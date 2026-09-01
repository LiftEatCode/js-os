/**
 * Development-only ToolRequest / ToolExecution lifecycle check.
 * Creates and deletes rows. Never production.
 */

import { db } from '../prisma/db.ts';
import {
  getAgentDefinitionBySlug,
  getJsSolutionsOrganization,
  listBusinessEvents,
} from '../business-state/index.ts';
import { defineTool } from '../tools/definition.ts';
import {
  createAgentToolActor,
  createUserToolActor,
} from '../tools/evaluate-permission.ts';
import {
  cancelToolRequest,
  createToolExecutionAttempt,
  completeToolExecution,
  failToolExecution,
  getToolRequestById,
  listToolExecutionsForRequest,
  markToolExecutionRunning,
  requestToolUse,
  TOOL_EVENT_TYPES,
} from '../tools/index.ts';
import { ToolIdempotencyConflictError } from '../tools/errors.ts';
import { z } from 'zod';

const VERIFY_SLUGS = [
  'test.ready_action',
  'test.approval_action',
  'test.denied_action',
] as const;

function redactDatabaseTarget(databaseUrl: string): { host: string; database: string } {
  const parsed = new URL(databaseUrl);
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  return { host: parsed.hostname, database };
}

function assertDevelopmentVerifyAllowed(databaseUrl: string): void {
  const target = process.env['JS_OS_TOOL_LIFECYCLE_VERIFY_TARGET'];
  if (target !== 'development') {
    throw new Error(
      'Refusing tool-lifecycle verification. Set JS_OS_TOOL_LIFECYCLE_VERIFY_TARGET=development.',
    );
  }
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('Refusing tool-lifecycle verification while NODE_ENV=production.');
  }
  const { host } = redactDatabaseTarget(databaseUrl);
  const hostLower = host.toLowerCase();
  if (
    hostLower.includes('production') ||
    hostLower.includes('-prod-') ||
    hostLower.includes('.prod.')
  ) {
    throw new Error('Refusing tool-lifecycle verification: database host looks like production.');
  }
}

function readyDefinition() {
  return defineTool({
    slug: 'test.ready_action',
    name: 'Ready Action',
    description: 'Verification tool that routes to READY.',
    version: 1,
    enabled: true,
    requiredPermission: 'PREPARE',
    riskLevel: 'LOW',
    approvalRequirement: 'NEVER',
    persistExecution: true,
    inputSchema: z.object({ title: z.string().min(1) }),
  });
}

function approvalDefinition() {
  return defineTool({
    slug: 'test.approval_action',
    name: 'Approval Action',
    description: 'Verification tool that routes to WAITING_APPROVAL.',
    version: 1,
    enabled: true,
    requiredPermission: 'PREPARE',
    riskLevel: 'MEDIUM',
    approvalRequirement: 'ALWAYS',
    persistExecution: true,
    inputSchema: z.object({ title: z.string().min(1) }),
  });
}

function deniedDefinition() {
  return defineTool({
    slug: 'test.denied_action',
    name: 'Denied Action',
    description: 'Verification tool used with an insufficient agent ceiling.',
    version: 1,
    enabled: true,
    requiredPermission: 'PREPARE',
    riskLevel: 'LOW',
    approvalRequirement: 'NEVER',
    persistExecution: true,
    inputSchema: z.object({ title: z.string().min(1) }),
  });
}

type Deletable = {
  where: (filter: Record<string, unknown>) => { delete: () => Promise<unknown> };
};

async function deleteById(model: Deletable, id: string): Promise<void> {
  await model.where({ id }).delete();
}

async function cleanup(
  organizationId: string,
  requestIds: string[],
  executionIds: string[],
): Promise<void> {
  const uniqueRequestIds = [...new Set(requestIds)];
  const uniqueExecutionIds = [...new Set(executionIds)];

  for (const id of uniqueExecutionIds) {
    await deleteById(db.orm.public.ToolExecution as unknown as Deletable, id);
  }
  for (const requestId of uniqueRequestIds) {
    const leftovers = await db.orm.public.ToolExecution.where({ toolRequestId: requestId }).all();
    for (const execution of leftovers) {
      await deleteById(db.orm.public.ToolExecution as unknown as Deletable, execution.id);
    }
  }
  for (const id of uniqueRequestIds) {
    await deleteById(db.orm.public.ToolRequest as unknown as Deletable, id);
  }

  const events: Awaited<ReturnType<typeof listBusinessEvents>> = [];
  for (const eventType of Object.values(TOOL_EVENT_TYPES)) {
    events.push(
      ...(await listBusinessEvents({ organizationId, eventType, limit: 100 })),
    );
  }
  for (const event of events) {
    const metadata = event.metadata as { toolRequestId?: string } | null;
    if (metadata?.toolRequestId && uniqueRequestIds.includes(metadata.toolRequestId)) {
      await deleteById(db.orm.public.BusinessEvent as unknown as Deletable, event.id);
    }
  }
}

try {
  if (typeof Temporal === 'undefined') {
    throw new Error('Temporal is not available. The polyfill in src/prisma/db.ts did not load.');
  }

  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }
  assertDevelopmentVerifyAllowed(databaseUrl);
  const { host, database } = redactDatabaseTarget(databaseUrl);
  console.log('JS OS tool-lifecycle verification (development only)');
  console.log(`database host: ${host}`);
  console.log(`database name: ${database}`);

  const organization = await getJsSolutionsOrganization();
  const finance = await getAgentDefinitionBySlug(organization.id, 'finance');
  if (!finance) {
    throw new Error('Expected finance AgentDefinition from bootstrap.');
  }

  const requestIds: string[] = [];
  const executionIds: string[] = [];
  const approvalCountBefore = (await db.orm.public.Approval.where({
    organizationId: organization.id,
    actionType: 'test.approval_action',
  }).all()).length;

  try {
    const user = createUserToolActor();

    console.log('Scenario A: READY → attempt 1 QUEUED → RUNNING → SUCCEEDED → FULFILLED');
    const ready = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: readyDefinition(),
      input: { title: 'Scenario A' },
    });
    requestIds.push(ready.id);
    if (ready.status !== 'READY') {
      throw new Error(`Scenario A expected READY, found ${ready.status}`);
    }
    const attempt = await createToolExecutionAttempt(ready.id);
    executionIds.push(attempt.id);
    if (attempt.attemptNumber !== 1 || attempt.status !== 'QUEUED') {
      throw new Error('Scenario A expected attemptNumber 1 QUEUED');
    }
    const running = await markToolExecutionRunning(attempt.id);
    if (running.status !== 'RUNNING' || running.startedAt == null || running.completedAt != null) {
      throw new Error('Scenario A expected RUNNING with startedAt and no completedAt');
    }
    const succeeded = await completeToolExecution(attempt.id, { ok: true });
    const fulfilled = await getToolRequestById(ready.id);
    if (succeeded.status !== 'SUCCEEDED' || fulfilled?.status !== 'FULFILLED') {
      throw new Error('Scenario A expected SUCCEEDED execution and FULFILLED request');
    }
    console.log('  passed');

    console.log('Scenario B: enabled + denied permission → DENIED, zero executions');
    const denied = await requestToolUse({
      organizationId: organization.id,
      actor: createAgentToolActor({
        id: finance.id,
        status: finance.status,
        permissionLevel: finance.permissionLevel,
      }),
      definition: deniedDefinition(),
      input: { title: 'Scenario B' },
    });
    requestIds.push(denied.id);
    const deniedExecutions = await listToolExecutionsForRequest(denied.id);
    if (denied.status !== 'DENIED' || deniedExecutions.length !== 0) {
      throw new Error('Scenario B expected DENIED with zero executions');
    }
    console.log('  passed');

    console.log('Scenario C: ALWAYS → WAITING_APPROVAL, zero executions, no Approval row');
    const waiting = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: approvalDefinition(),
      input: { title: 'Scenario C' },
    });
    requestIds.push(waiting.id);
    const waitingExecutions = await listToolExecutionsForRequest(waiting.id);
    const approvalCountAfter = (await db.orm.public.Approval.where({
      organizationId: organization.id,
      actionType: 'test.approval_action',
    }).all()).length;
    if (
      waiting.status !== 'WAITING_APPROVAL' ||
      waiting.approvalId != null ||
      waitingExecutions.length !== 0 ||
      approvalCountAfter !== approvalCountBefore
    ) {
      throw new Error('Scenario C expected WAITING_APPROVAL without Approval or executions');
    }
    console.log('  passed');

    console.log('Scenario D: execution failure → execution FAILED, request FAILED');
    const failRequest = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: readyDefinition(),
      input: { title: 'Scenario D' },
    });
    requestIds.push(failRequest.id);
    const failAttempt = await createToolExecutionAttempt(failRequest.id);
    executionIds.push(failAttempt.id);
    await markToolExecutionRunning(failAttempt.id);
    await failToolExecution(failAttempt.id, 'verification adapter failure');
    const failedRequest = await getToolRequestById(failRequest.id);
    const failedExecution = (await listToolExecutionsForRequest(failRequest.id))[0];
    if (failedExecution?.status !== 'FAILED' || failedRequest?.status !== 'FAILED') {
      throw new Error('Scenario D expected FAILED execution and FAILED request');
    }
    console.log('  passed');

    console.log('Scenario E: request cancellation → CANCELLED');
    const cancelRequest = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: readyDefinition(),
      input: { title: 'Scenario E' },
    });
    requestIds.push(cancelRequest.id);
    const queued = await createToolExecutionAttempt(cancelRequest.id);
    executionIds.push(queued.id);
    const cancelled = await cancelToolRequest(cancelRequest.id);
    const cancelledExecution = (await listToolExecutionsForRequest(cancelRequest.id))[0];
    if (cancelled.status !== 'CANCELLED' || cancelledExecution?.status !== 'CANCELLED') {
      throw new Error('Scenario E expected CANCELLED request and queued execution');
    }
    console.log('  passed');

    console.log('Idempotency: reuse returns the same request; mismatch conflicts');
    const idempotent = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: readyDefinition(),
      input: { title: 'Same logical' },
      idempotencyKey: 'verify-tool-lifecycle-same',
    });
    requestIds.push(idempotent.id);
    const reused = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: readyDefinition(),
      input: { title: 'Same logical' },
      idempotencyKey: 'verify-tool-lifecycle-same',
    });
    if (reused.id !== idempotent.id) {
      requestIds.push(reused.id);
      throw new Error('Idempotency reuse should return the existing ToolRequest');
    }
    let conflicted = false;
    try {
      await requestToolUse({
        organizationId: organization.id,
        actor: user,
        definition: readyDefinition(),
        input: { title: 'Different logical' },
        idempotencyKey: 'verify-tool-lifecycle-same',
      });
    } catch (error) {
      if (error instanceof ToolIdempotencyConflictError) {
        conflicted = true;
      } else {
        throw error;
      }
    }
    if (!conflicted) {
      throw new Error('Expected ToolIdempotencyConflictError for mismatched logical request');
    }
    console.log('  passed');

    console.log('Attempt numbering: first attempt is 1; no automatic second attempt');
    const numbered = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: readyDefinition(),
      input: { title: 'Attempt numbering' },
    });
    requestIds.push(numbered.id);
    const first = await createToolExecutionAttempt(numbered.id);
    executionIds.push(first.id);
    if (first.attemptNumber !== 1) {
      throw new Error(`Expected attemptNumber 1, found ${first.attemptNumber}`);
    }
    const afterFirst = await listToolExecutionsForRequest(numbered.id);
    if (afterFirst.length !== 1) {
      throw new Error('Expected no automatic second attempt');
    }
    console.log('  passed');

    console.log('verification passed');
  } finally {
    await cleanup(organization.id, requestIds, executionIds);
    const leftover = await db.orm.public.ToolRequest.where({
      organizationId: organization.id,
    }).all();
    const leftoverVerify = leftover.filter((row) =>
      (VERIFY_SLUGS as readonly string[]).includes(row.toolSlug),
    );
    for (const row of leftoverVerify) {
      const executions = await db.orm.public.ToolExecution.where({ toolRequestId: row.id }).all();
      for (const execution of executions) {
        await deleteById(db.orm.public.ToolExecution as unknown as Deletable, execution.id);
      }
      await deleteById(db.orm.public.ToolRequest as unknown as Deletable, row.id);
    }
    console.log('cleanup complete');
  }
} finally {
  await db.close();
}
