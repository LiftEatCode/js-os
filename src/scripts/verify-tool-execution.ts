/**
 * Development-only Phase 3.6 end-to-end tool execution verification.
 *
 * Exercises real ToolRequest, ToolExecution, WorkItem, Approval, and
 * BusinessEvent persistence against the development database. Creates and
 * deletes rows. Never production.
 */

import { z } from 'zod';
import { approveApprovalCommand } from '../business-commands/approval-commands.ts';
import { createWorkItemCommand } from '../business-commands/work-item-commands.ts';
import {
  getAgentDefinitionBySlug,
  getApprovalById,
  getJsSolutionsOrganization,
  listBusinessEvents,
} from '../business-state/index.ts';
import type { WorkItem } from '../business-state/types.ts';
import { db } from '../prisma/db.ts';
import { createExecutableToolRegistry } from '../tools/executable-registry.ts';
import { defineTool } from '../tools/definition.ts';
import { createAgentToolActor, createUserToolActor } from '../tools/evaluate-permission.ts';
import { defineToolImplementation } from '../tools/implementation.ts';
import {
  createToolExecutionCoordinator,
  executeToolRequest,
  getToolRequestById,
  internalCreateWorkItemDefinition,
  internalUpdateWorkStatusDefinition,
  listToolExecutionsForRequest,
  requestToolUse,
} from '../tools/index.ts';

const APPROVAL_VERIFY_SLUG = 'test.approved_create_work_item';

function redactDatabaseTarget(databaseUrl: string): { host: string; database: string } {
  const parsed = new URL(databaseUrl);
  return {
    host: parsed.hostname,
    database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
  };
}

function assertDevelopmentVerifyAllowed(databaseUrl: string): void {
  if (process.env['JS_OS_TOOL_EXECUTION_VERIFY_TARGET'] !== 'development') {
    throw new Error(
      'Refusing tool-execution verification. Set JS_OS_TOOL_EXECUTION_VERIFY_TARGET=development.',
    );
  }
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('Refusing tool-execution verification while NODE_ENV=production.');
  }
  const { host } = redactDatabaseTarget(databaseUrl);
  const lower = host.toLowerCase();
  if (lower.includes('production') || lower.includes('-prod-') || lower.includes('.prod.')) {
    throw new Error('Refusing tool-execution verification: database host looks like production.');
  }
}

type Deletable = {
  where: (filter: Record<string, unknown>) => { delete: () => Promise<unknown> };
};

async function deleteById(model: Deletable, id: string): Promise<void> {
  await model.where({ id }).delete();
}

async function getWorkItem(id: string): Promise<WorkItem | null> {
  return db.orm.public.WorkItem.where({ id }).first();
}

function eventMetadata(event: { metadata: unknown }): Record<string, unknown> {
  return event.metadata && typeof event.metadata === 'object'
    ? (event.metadata as Record<string, unknown>)
    : {};
}

async function findEventsForRequest(
  organizationId: string,
  requestId: string,
): Promise<Awaited<ReturnType<typeof listBusinessEvents>>> {
  const events: Awaited<ReturnType<typeof listBusinessEvents>> = [];
  for (const eventType of [
    'tool.ready',
    'tool.denied',
    'tool.waiting_approval',
    'tool.execution_queued',
    'tool.execution_started',
    'tool.executed',
    'tool.execution_failed',
  ]) {
    const rows = await listBusinessEvents({ organizationId, eventType, limit: 100 });
    events.push(...rows.filter((row) => eventMetadata(row).toolRequestId === requestId));
  }
  return events;
}

async function findWorkEvents(
  organizationId: string,
  workItemId: string,
): Promise<Awaited<ReturnType<typeof listBusinessEvents>>> {
  const events: Awaited<ReturnType<typeof listBusinessEvents>> = [];
  for (const eventType of ['work.created', 'work.status_changed']) {
    const rows = await listBusinessEvents({ organizationId, eventType, limit: 100 });
    events.push(...rows.filter((row) => eventMetadata(row).workItemId === workItemId));
  }
  return events;
}

async function cleanup(input: {
  organizationId: string;
  requestIds: string[];
  workItemIds: string[];
  approvalIds: string[];
}): Promise<void> {
  const requestIds = [...new Set(input.requestIds)];
  const workItemIds = [...new Set(input.workItemIds)];
  const approvalIds = [...new Set(input.approvalIds)];

  for (const requestId of requestIds) {
    const executions = await db.orm.public.ToolExecution.where({ toolRequestId: requestId }).all();
    for (const execution of executions) {
      await deleteById(db.orm.public.ToolExecution as unknown as Deletable, execution.id);
    }
  }
  for (const requestId of requestIds) {
    await deleteById(db.orm.public.ToolRequest as unknown as Deletable, requestId);
  }
  for (const approvalId of approvalIds) {
    await deleteById(db.orm.public.Approval as unknown as Deletable, approvalId);
  }

  const eventTypes = [
    'tool.ready',
    'tool.denied',
    'tool.waiting_approval',
    'tool.execution_queued',
    'tool.execution_started',
    'tool.executed',
    'tool.execution_failed',
    'work.created',
    'work.status_changed',
    'approval.requested',
    'approval.approved',
  ];
  for (const eventType of eventTypes) {
    const events = await listBusinessEvents({
      organizationId: input.organizationId,
      eventType,
      limit: 200,
    });
    for (const event of events) {
      const metadata = eventMetadata(event);
      if (
        (typeof metadata.toolRequestId === 'string' && requestIds.includes(metadata.toolRequestId)) ||
        (typeof metadata.workItemId === 'string' && workItemIds.includes(metadata.workItemId)) ||
        (typeof metadata.approvalId === 'string' && approvalIds.includes(metadata.approvalId))
      ) {
        await deleteById(db.orm.public.BusinessEvent as unknown as Deletable, event.id);
      }
    }
  }

  for (const workItemId of workItemIds.reverse()) {
    const existing = await db.orm.public.WorkItem.where({ id: workItemId }).first();
    if (existing) {
      await deleteById(db.orm.public.WorkItem as unknown as Deletable, workItemId);
    }
  }
}

const approvalInputSchema = z
  .object({
    title: z.string().trim().min(1),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    workType: z.enum([
      'TASK',
      'REVIEW',
      'RESEARCH',
      'CONTENT',
      'OUTREACH',
      'ENGINEERING',
      'CLIENT_WORK',
      'ADMIN',
      'DECISION',
    ]),
  })
  .strict();

const approvalOutputSchema = z
  .object({ workItemId: z.string().uuid(), status: z.string() })
  .strict();

const approvalDefinition = defineTool({
  slug: APPROVAL_VERIFY_SLUG,
  name: 'Approved Create Work Item',
  description: 'Verification-only create-work tool requiring explicit owner approval.',
  version: 1,
  enabled: true,
  requiredPermission: 'PREPARE',
  riskLevel: 'MEDIUM',
  approvalRequirement: 'ALWAYS',
  persistExecution: true,
  inputSchema: approvalInputSchema,
  outputSchema: approvalOutputSchema,
});

const approvalImplementation = defineToolImplementation({
  definition: approvalDefinition,
  execute: async (input, context) => {
    const created = await createWorkItemCommand(
      {
        organizationId: context.organizationId,
        title: input.title,
        priority: input.priority,
        workType: input.workType,
      },
      context.actor,
    );
    return { workItemId: created.id, status: created.status };
  },
});

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
  console.log('JS OS Phase 3.6 tool-execution verification (development only)');
  console.log(`database host: ${host}`);
  console.log(`database name: ${database}`);

  const organization = await getJsSolutionsOrganization();
  const finance = await getAgentDefinitionBySlug(organization.id, 'finance');
  if (!finance) {
    throw new Error('Expected finance AgentDefinition from bootstrap.');
  }

  const requestIds: string[] = [];
  const workItemIds: string[] = [];
  const approvalIds: string[] = [];
  const user = createUserToolActor('phase-3.6-verifier');

  try {
    console.log('Scenario A: USER request → READY → coordinator → real WorkItem → FULFILLED');
    const createRequest = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: internalCreateWorkItemDefinition,
      input: {
        title: 'Phase 3.6 integration work item',
        priority: 'HIGH',
        workType: 'ENGINEERING',
      },
    });
    requestIds.push(createRequest.id);
    if (createRequest.status !== 'READY') {
      throw new Error(`Scenario A expected READY, found ${createRequest.status}`);
    }

    const createExecution = await executeToolRequest(createRequest.id);
    if (createExecution.status !== 'SUCCEEDED') {
      throw new Error(`Scenario A expected SUCCEEDED, found ${createExecution.status}`);
    }
    const fulfilledCreate = await getToolRequestById(createRequest.id);
    if (fulfilledCreate?.status !== 'FULFILLED') {
      throw new Error('Scenario A expected FULFILLED ToolRequest');
    }
    const createOutput = createExecution.output as { workItemId?: string } | null;
    if (!createOutput?.workItemId) {
      throw new Error('Scenario A expected workItemId in execution output');
    }
    workItemIds.push(createOutput.workItemId);
    const createdWork = await getWorkItem(createOutput.workItemId);
    if (
      !createdWork ||
      createdWork.organizationId !== organization.id ||
      createdWork.title !== 'Phase 3.6 integration work item'
    ) {
      throw new Error('Scenario A expected a real organization-scoped WorkItem');
    }
    const createWorkEvents = await findWorkEvents(organization.id, createdWork.id);
    const workCreated = createWorkEvents.find((event) => event.eventType === 'work.created');
    if (!workCreated || workCreated.sourceType !== 'USER' || workCreated.sourceId !== 'phase-3.6-verifier') {
      throw new Error('Scenario A expected work.created with USER provenance');
    }
    const createToolEvents = await findEventsForRequest(organization.id, createRequest.id);
    const createEventTypes = createToolEvents.map((event) => event.eventType);
    for (const expected of [
      'tool.ready',
      'tool.execution_queued',
      'tool.execution_started',
      'tool.executed',
    ]) {
      if (!createEventTypes.includes(expected)) {
        throw new Error(`Scenario A missing audit event ${expected}`);
      }
    }
    console.log('  passed');

    console.log('Scenario B: update_work_status → real mutation + work.status_changed');
    const updateRequest = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: internalUpdateWorkStatusDefinition,
      input: { workItemId: createdWork.id, status: 'IN_PROGRESS' },
    });
    requestIds.push(updateRequest.id);
    const updateExecution = await executeToolRequest(updateRequest.id);
    if (updateExecution.status !== 'SUCCEEDED') {
      throw new Error('Scenario B expected SUCCEEDED execution');
    }
    const updatedWork = await getWorkItem(createdWork.id);
    if (updatedWork?.status !== 'IN_PROGRESS') {
      throw new Error('Scenario B expected persisted IN_PROGRESS status');
    }
    const workEvents = await findWorkEvents(organization.id, createdWork.id);
    const statusEvent = workEvents.find((event) => event.eventType === 'work.status_changed');
    const statusMetadata = statusEvent ? eventMetadata(statusEvent) : {};
    if (
      !statusEvent ||
      statusMetadata.previousStatus !== createdWork.status ||
      statusMetadata.newStatus !== 'IN_PROGRESS'
    ) {
      throw new Error('Scenario B expected authoritative work.status_changed metadata');
    }
    console.log('  passed');

    console.log('Scenario C: insufficient AGENT permission → DENIED, zero execution, zero mutation');
    const beforeDeniedCount = (
      await db.orm.public.WorkItem.where({ organizationId: organization.id }).all()
    ).length;
    const denied = await requestToolUse({
      organizationId: organization.id,
      actor: createAgentToolActor({
        id: finance.id,
        status: finance.status,
        permissionLevel: finance.permissionLevel,
      }),
      definition: internalCreateWorkItemDefinition,
      input: {
        title: 'Must not be created',
        priority: 'LOW',
        workType: 'TASK',
      },
    });
    requestIds.push(denied.id);
    const deniedExecutions = await listToolExecutionsForRequest(denied.id);
    const afterDeniedCount = (
      await db.orm.public.WorkItem.where({ organizationId: organization.id }).all()
    ).length;
    if (denied.status !== 'DENIED' || deniedExecutions.length !== 0 || afterDeniedCount !== beforeDeniedCount) {
      throw new Error('Scenario C expected DENIED with zero execution and zero WorkItem mutation');
    }
    const deniedEvents = await findEventsForRequest(organization.id, denied.id);
    if (!deniedEvents.some((event) => event.eventType === 'tool.denied')) {
      throw new Error('Scenario C expected tool.denied audit event');
    }
    console.log('  passed');

    console.log('Scenario D: approval gates execution; approve → READY only; explicit coordinator mutates');
    const approvalRegistry = createExecutableToolRegistry(
      [approvalDefinition],
      [approvalImplementation],
    );
    const approvalCoordinator = createToolExecutionCoordinator(approvalRegistry);
    const approvalRequest = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: approvalDefinition,
      input: {
        title: 'Approval-gated integration work item',
        priority: 'MEDIUM',
        workType: 'ENGINEERING',
      },
    });
    requestIds.push(approvalRequest.id);
    if (approvalRequest.status !== 'WAITING_APPROVAL' || !approvalRequest.approvalId) {
      throw new Error('Scenario D expected WAITING_APPROVAL with approvalId');
    }
    approvalIds.push(approvalRequest.approvalId);
    const pendingApproval = await getApprovalById(approvalRequest.approvalId);
    if (pendingApproval?.status !== 'PENDING') {
      throw new Error('Scenario D expected PENDING Approval');
    }
    const beforeApproveWorkIds = new Set(
      (await db.orm.public.WorkItem.where({ organizationId: organization.id }).all()).map(
        (item) => item.id,
      ),
    );
    await approveApprovalCommand(approvalRequest.approvalId);
    const readyAfterApproval = await getToolRequestById(approvalRequest.id);
    const executionsAfterApproval = await listToolExecutionsForRequest(approvalRequest.id);
    const workAfterApproval = await db.orm.public.WorkItem.where({ organizationId: organization.id }).all();
    const unexpectedWorkAfterApproval = workAfterApproval.filter((item) => !beforeApproveWorkIds.has(item.id));
    if (
      readyAfterApproval?.status !== 'READY' ||
      executionsAfterApproval.length !== 0 ||
      unexpectedWorkAfterApproval.length !== 0
    ) {
      throw new Error('Scenario D approval must produce READY only, with no execution or WorkItem mutation');
    }

    const approvedExecution = await approvalCoordinator.executeToolRequest(approvalRequest.id);
    if (approvedExecution.status !== 'SUCCEEDED') {
      throw new Error('Scenario D expected explicit coordinator execution to SUCCEED');
    }
    const approvedOutput = approvedExecution.output as { workItemId?: string } | null;
    if (!approvedOutput?.workItemId) {
      throw new Error('Scenario D expected workItemId output');
    }
    workItemIds.push(approvedOutput.workItemId);
    const approvedWork = await getWorkItem(approvedOutput.workItemId);
    const fulfilledApproved = await getToolRequestById(approvalRequest.id);
    if (!approvedWork || fulfilledApproved?.status !== 'FULFILLED') {
      throw new Error('Scenario D expected real WorkItem plus FULFILLED request after explicit execution');
    }
    console.log('  passed');

    console.log('Phase 3.6 integration verification passed');
  } finally {
    await cleanup({
      organizationId: organization.id,
      requestIds,
      workItemIds,
      approvalIds,
    });
    console.log('cleanup complete');
  }
} finally {
  await db.close();
}
