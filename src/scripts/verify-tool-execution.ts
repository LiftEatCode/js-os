/**
 * Development-only Phase 3.6 end-to-end tool execution verification.
 * Creates and deletes real ToolRequest, ToolExecution, WorkItem, Approval,
 * and BusinessEvent rows. Never production.
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
import { db } from '../prisma/db.ts';
import { defineTool } from '../tools/definition.ts';
import { createAgentToolActor, createUserToolActor } from '../tools/evaluate-permission.ts';
import { createExecutableToolRegistry } from '../tools/executable-registry.ts';
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

function assertDevelopment(databaseUrl: string): void {
  if (process.env['JS_OS_TOOL_EXECUTION_VERIFY_TARGET'] !== 'development') {
    throw new Error(
      'Refusing tool-execution verification. Set JS_OS_TOOL_EXECUTION_VERIFY_TARGET=development.',
    );
  }
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('Refusing tool-execution verification while NODE_ENV=production.');
  }
  const host = new URL(databaseUrl).hostname.toLowerCase();
  if (host.includes('production') || host.includes('-prod-') || host.includes('.prod.')) {
    throw new Error('Refusing tool-execution verification: database host looks like production.');
  }
}

type Deletable = {
  where: (filter: Record<string, unknown>) => { delete: () => Promise<unknown> };
};

async function deleteById(model: Deletable, id: string): Promise<void> {
  await model.where({ id }).delete();
}

function metadata(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

async function requestEvents(organizationId: string, requestId: string) {
  const result: Awaited<ReturnType<typeof listBusinessEvents>> = [];
  for (const eventType of [
    'tool.ready',
    'tool.denied',
    'tool.waiting_approval',
    'tool.execution_queued',
    'tool.execution_started',
    'tool.executed',
  ]) {
    const events = await listBusinessEvents({ organizationId, eventType, limit: 100 });
    result.push(...events.filter((event) => metadata(event.metadata).toolRequestId === requestId));
  }
  return result;
}

async function workEvents(organizationId: string, workItemId: string) {
  const result: Awaited<ReturnType<typeof listBusinessEvents>> = [];
  for (const eventType of ['work.created', 'work.status_changed']) {
    const events = await listBusinessEvents({ organizationId, eventType, limit: 100 });
    result.push(...events.filter((event) => metadata(event.metadata).workItemId === workItemId));
  }
  return result;
}

async function cleanup(input: {
  organizationId: string;
  requestIds: string[];
  approvalIds: string[];
  workItemIds: string[];
}): Promise<void> {
  const requestIds = [...new Set(input.requestIds)];
  const approvalIds = [...new Set(input.approvalIds)];
  const workItemIds = [...new Set(input.workItemIds)];

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

  for (const eventType of [
    'tool.ready',
    'tool.denied',
    'tool.waiting_approval',
    'tool.execution_queued',
    'tool.execution_started',
    'tool.executed',
    'work.created',
    'work.status_changed',
    'approval.requested',
    'approval.approved',
  ]) {
    const events = await listBusinessEvents({
      organizationId: input.organizationId,
      eventType,
      limit: 200,
    });
    for (const event of events) {
      const meta = metadata(event.metadata);
      if (
        (typeof meta.toolRequestId === 'string' && requestIds.includes(meta.toolRequestId)) ||
        (typeof meta.approvalId === 'string' && approvalIds.includes(meta.approvalId)) ||
        (typeof meta.workItemId === 'string' && workItemIds.includes(meta.workItemId))
      ) {
        await deleteById(db.orm.public.BusinessEvent as unknown as Deletable, event.id);
      }
    }
  }

  for (const workItemId of workItemIds.reverse()) {
    const row = await db.orm.public.WorkItem.where({ id: workItemId }).first();
    if (row) {
      await deleteById(db.orm.public.WorkItem as unknown as Deletable, workItemId);
    }
  }
}

const approvalInput = z
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

const approvalDefinition = defineTool({
  slug: 'test.approved_create_work_item',
  name: 'Approved Create Work Item',
  description: 'Verification-only create-work tool requiring explicit approval.',
  version: 1,
  enabled: true,
  requiredPermission: 'PREPARE',
  riskLevel: 'MEDIUM',
  approvalRequirement: 'ALWAYS',
  persistExecution: true,
  inputSchema: approvalInput,
  outputSchema: z.object({ workItemId: z.string().uuid(), status: z.string() }).strict(),
});

const approvalImplementation = defineToolImplementation({
  definition: approvalDefinition,
  execute: async (input, context) => {
    const item = await createWorkItemCommand(
      {
        organizationId: context.organizationId,
        title: input.title,
        priority: input.priority,
        workType: input.workType,
      },
      context.actor,
    );
    return { workItemId: item.id, status: item.status };
  },
});

try {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }
  assertDevelopment(databaseUrl);

  const organization = await getJsSolutionsOrganization();
  const finance = await getAgentDefinitionBySlug(organization.id, 'finance');
  if (!finance) {
    throw new Error('Expected finance AgentDefinition from bootstrap.');
  }

  const requestIds: string[] = [];
  const approvalIds: string[] = [];
  const workItemIds: string[] = [];
  const owner = createUserToolActor();

  console.log('JS OS Phase 3.6 tool execution verification');

  try {
    console.log('Scenario A: USER create_work_item executes end-to-end');
    const createRequest = await requestToolUse({
      organizationId: organization.id,
      actor: owner,
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
    const fulfilledCreate = await getToolRequestById(createRequest.id);
    const createOutput = createExecution.output as { workItemId?: string } | null;
    if (
      createExecution.status !== 'SUCCEEDED' ||
      fulfilledCreate?.status !== 'FULFILLED' ||
      !createOutput?.workItemId
    ) {
      throw new Error('Scenario A expected SUCCEEDED execution, FULFILLED request, and workItemId');
    }

    workItemIds.push(createOutput.workItemId);
    const createdWork = await db.orm.public.WorkItem.where({ id: createOutput.workItemId }).first();
    if (
      !createdWork ||
      createdWork.organizationId !== organization.id ||
      createdWork.title !== 'Phase 3.6 integration work item'
    ) {
      throw new Error('Scenario A expected a real organization-scoped WorkItem');
    }

    const createWorkEvents = await workEvents(organization.id, createdWork.id);
    const createdEvent = createWorkEvents.find((event) => event.eventType === 'work.created');
    if (!createdEvent || createdEvent.sourceType !== 'USER') {
      throw new Error('Scenario A expected work.created with USER provenance');
    }

    const createAudit = await requestEvents(organization.id, createRequest.id);
    const createAuditTypes = new Set(createAudit.map((event) => event.eventType));
    for (const expected of [
      'tool.ready',
      'tool.execution_queued',
      'tool.execution_started',
      'tool.executed',
    ]) {
      if (!createAuditTypes.has(expected)) {
        throw new Error(`Scenario A missing ${expected}`);
      }
    }
    console.log('  passed');

    console.log('Scenario B: update_work_status mutates work and emits status event');
    const updateRequest = await requestToolUse({
      organizationId: organization.id,
      actor: owner,
      definition: internalUpdateWorkStatusDefinition,
      input: { workItemId: createdWork.id, status: 'IN_PROGRESS' },
    });
    requestIds.push(updateRequest.id);
    const updateExecution = await executeToolRequest(updateRequest.id);
    const updatedWork = await db.orm.public.WorkItem.where({ id: createdWork.id }).first();
    if (updateExecution.status !== 'SUCCEEDED' || updatedWork?.status !== 'IN_PROGRESS') {
      throw new Error('Scenario B expected SUCCEEDED execution and IN_PROGRESS WorkItem');
    }
    const updateEvents = await workEvents(organization.id, createdWork.id);
    const statusEvent = updateEvents.find((event) => event.eventType === 'work.status_changed');
    const statusMeta = statusEvent ? metadata(statusEvent.metadata) : {};
    if (
      !statusEvent ||
      statusMeta.previousStatus !== createdWork.status ||
      statusMeta.newStatus !== 'IN_PROGRESS'
    ) {
      throw new Error('Scenario B expected work.status_changed with previous/new status');
    }
    console.log('  passed');

    console.log('Scenario C: insufficient agent permission denies before execution or mutation');
    const beforeCount = (
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
      input: { title: 'Must not exist', priority: 'LOW', workType: 'TASK' },
    });
    requestIds.push(denied.id);
    const deniedExecutions = await listToolExecutionsForRequest(denied.id);
    const afterCount = (
      await db.orm.public.WorkItem.where({ organizationId: organization.id }).all()
    ).length;
    const deniedAudit = await requestEvents(organization.id, denied.id);
    if (
      denied.status !== 'DENIED' ||
      deniedExecutions.length !== 0 ||
      beforeCount !== afterCount ||
      !deniedAudit.some((event) => event.eventType === 'tool.denied')
    ) {
      throw new Error('Scenario C expected DENIED, zero execution, zero mutation, tool.denied');
    }
    console.log('  passed');

    console.log('Scenario D: approval produces READY only; explicit coordinator performs mutation');
    const approvalCoordinator = createToolExecutionCoordinator(
      createExecutableToolRegistry([approvalDefinition], [approvalImplementation]),
    );
    const approvalRequest = await requestToolUse({
      organizationId: organization.id,
      actor: owner,
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
    const pending = await getApprovalById(approvalRequest.approvalId);
    if (pending?.status !== 'PENDING') {
      throw new Error('Scenario D expected PENDING Approval');
    }

    const beforeApprovalIds = new Set(
      (await db.orm.public.WorkItem.where({ organizationId: organization.id }).all()).map(
        (item) => item.id,
      ),
    );
    await approveApprovalCommand(approvalRequest.approvalId);
    const ready = await getToolRequestById(approvalRequest.id);
    const afterApprovalExecutions = await listToolExecutionsForRequest(approvalRequest.id);
    const afterApprovalWork = await db.orm.public.WorkItem.where({ organizationId: organization.id }).all();
    if (
      ready?.status !== 'READY' ||
      afterApprovalExecutions.length !== 0 ||
      afterApprovalWork.some((item) => !beforeApprovalIds.has(item.id))
    ) {
      throw new Error('Scenario D approval must not auto-execute or mutate business state');
    }

    const approvedExecution = await approvalCoordinator(approvalRequest.id);
    const approvedRequest = await getToolRequestById(approvalRequest.id);
    const approvedOutput = approvedExecution.output as { workItemId?: string } | null;
    if (
      approvedExecution.status !== 'SUCCEEDED' ||
      approvedRequest?.status !== 'FULFILLED' ||
      !approvedOutput?.workItemId
    ) {
      throw new Error('Scenario D expected explicit execution to SUCCEED and FULFILL');
    }
    workItemIds.push(approvedOutput.workItemId);
    const approvedWork = await db.orm.public.WorkItem.where({ id: approvedOutput.workItemId }).first();
    if (!approvedWork) {
      throw new Error('Scenario D expected real WorkItem after explicit coordinator execution');
    }
    console.log('  passed');

    console.log('Phase 3.6 integration verification passed');
  } finally {
    await cleanup({
      organizationId: organization.id,
      requestIds,
      approvalIds,
      workItemIds,
    });
    console.log('cleanup complete');
  }
} finally {
  await db.close();
}
