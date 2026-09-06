/**
 * Development-only ToolRequest ↔ Approval integration check.
 * Creates and deletes rows. Never production.
 */

import { db } from '../prisma/db.ts';
import {
  approveApprovalCommand,
  cancelApprovalCommand,
  rejectApprovalCommand,
  requestApprovalCommand,
} from '../business-commands/approval-commands.ts';
import {
  getApprovalById,
  getJsSolutionsOrganization,
  listBusinessEvents,
} from '../business-state/index.ts';
import { defineTool } from '../tools/definition.ts';
import { createUserToolActor } from '../tools/evaluate-permission.ts';
import {
  TOOL_EXECUTE_ACTION_TYPE,
  cancelToolRequest,
  createToolExecutionAttempt,
  getToolRequestByApprovalId,
  getToolRequestById,
  listToolExecutionsForRequest,
  requestToolUse,
} from '../tools/index.ts';
import { z } from 'zod';

const VERIFY_SLUG = 'test.approval_action';
const NON_TOOL_ACTION_TYPE = 'verify.non_tool';

function redactDatabaseTarget(databaseUrl: string): { host: string; database: string } {
  const parsed = new URL(databaseUrl);
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  return { host: parsed.hostname, database };
}

function assertDevelopmentVerifyAllowed(databaseUrl: string): void {
  const target = process.env['JS_OS_TOOL_APPROVAL_VERIFY_TARGET'];
  if (target !== 'development') {
    throw new Error(
      'Refusing tool-approval verification. Set JS_OS_TOOL_APPROVAL_VERIFY_TARGET=development.',
    );
  }
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('Refusing tool-approval verification while NODE_ENV=production.');
  }
  const { host } = redactDatabaseTarget(databaseUrl);
  const hostLower = host.toLowerCase();
  if (
    hostLower.includes('production') ||
    hostLower.includes('-prod-') ||
    hostLower.includes('.prod.')
  ) {
    throw new Error('Refusing tool-approval verification: database host looks like production.');
  }
}

function alwaysDefinition() {
  return defineTool({
    slug: VERIFY_SLUG,
    name: 'Approval Action',
    description: 'Verification tool that requires approval.',
    version: 1,
    enabled: true,
    requiredPermission: 'PREPARE',
    riskLevel: 'MEDIUM',
    approvalRequirement: 'ALWAYS',
    persistExecution: true,
    inputSchema: z.object({ title: z.string().min(1) }),
  });
}

function neverDefinition() {
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

type Deletable = {
  where: (filter: Record<string, unknown>) => { delete: () => Promise<unknown> };
};

async function deleteById(model: Deletable, id: string): Promise<void> {
  await model.where({ id }).delete();
}

async function cleanup(input: {
  organizationId: string;
  requestIds: string[];
  executionIds: string[];
  approvalIds: string[];
}): Promise<void> {
  const requestIds = [...new Set(input.requestIds)];
  const executionIds = [...new Set(input.executionIds)];
  const approvalIds = [...new Set(input.approvalIds)];

  for (const id of executionIds) {
    await deleteById(db.orm.public.ToolExecution as unknown as Deletable, id);
  }
  for (const requestId of requestIds) {
    const leftovers = await db.orm.public.ToolExecution.where({ toolRequestId: requestId }).all();
    for (const execution of leftovers) {
      await deleteById(db.orm.public.ToolExecution as unknown as Deletable, execution.id);
    }
  }
  for (const id of requestIds) {
    await deleteById(db.orm.public.ToolRequest as unknown as Deletable, id);
  }
  for (const id of approvalIds) {
    await deleteById(db.orm.public.Approval as unknown as Deletable, id);
  }

  const eventTypes = [
    'tool.denied',
    'tool.waiting_approval',
    'tool.ready',
    'tool.execution_queued',
    'tool.cancelled',
    'approval.requested',
    'approval.approved',
    'approval.rejected',
    'approval.cancelled',
    'approval.expired',
  ];
  for (const eventType of eventTypes) {
    const events = await listBusinessEvents({
      organizationId: input.organizationId,
      eventType,
      limit: 100,
    });
    for (const event of events) {
      const metadata = event.metadata as { toolRequestId?: string; approvalId?: string } | null;
      if (
        (metadata?.toolRequestId && requestIds.includes(metadata.toolRequestId)) ||
        (metadata?.approvalId && approvalIds.includes(metadata.approvalId))
      ) {
        await deleteById(db.orm.public.BusinessEvent as unknown as Deletable, event.id);
      }
    }
  }
}

async function expectRejected(work: () => Promise<unknown>, label: string): Promise<void> {
  try {
    await work();
    throw new Error(`${label}: expected the operation to fail`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(`${label}:`)) {
      throw error;
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
  console.log('JS OS tool-approval verification (development only)');
  console.log(`database host: ${host}`);
  console.log(`database name: ${database}`);

  const organization = await getJsSolutionsOrganization();
  const user = createUserToolActor();
  const requestIds: string[] = [];
  const executionIds: string[] = [];
  const approvalIds: string[] = [];

  try {
    console.log('Scenario A: ALWAYS → PENDING Approval → approve → READY, zero executions');
    const waiting = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: alwaysDefinition(),
      input: { title: 'Scenario A' },
    });
    requestIds.push(waiting.id);
    if (waiting.status !== 'WAITING_APPROVAL' || waiting.approvalId == null) {
      throw new Error('Scenario A expected WAITING_APPROVAL with approvalId');
    }
    approvalIds.push(waiting.approvalId);
    const pending = await getApprovalById(waiting.approvalId);
    const linked = await getToolRequestByApprovalId(waiting.approvalId);
    if (
      pending?.status !== 'PENDING' ||
      pending.actionType !== TOOL_EXECUTE_ACTION_TYPE ||
      linked?.id !== waiting.id
    ) {
      throw new Error('Scenario A expected a PENDING tool.execute Approval linked to the request');
    }
    const approved = await approveApprovalCommand(waiting.approvalId);
    const ready = await getToolRequestById(waiting.id);
    const executionsA = await listToolExecutionsForRequest(waiting.id);
    if (approved.status !== 'APPROVED' || ready?.status !== 'READY' || executionsA.length !== 0) {
      throw new Error('Scenario A expected APPROVED + READY and zero ToolExecution rows');
    }
    console.log('  passed');

    console.log('Scenario B: ALWAYS → reject → DENIED, zero executions');
    const rejectRequest = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: alwaysDefinition(),
      input: { title: 'Scenario B' },
    });
    requestIds.push(rejectRequest.id);
    if (!rejectRequest.approvalId) {
      throw new Error('Scenario B expected approvalId');
    }
    approvalIds.push(rejectRequest.approvalId);
    const rejected = await rejectApprovalCommand(rejectRequest.approvalId, {
      decisionReason: 'Verification rejection',
    });
    const denied = await getToolRequestById(rejectRequest.id);
    const executionsB = await listToolExecutionsForRequest(rejectRequest.id);
    if (rejected.status !== 'REJECTED' || denied?.status !== 'DENIED' || executionsB.length !== 0) {
      throw new Error('Scenario B expected REJECTED + DENIED and zero executions');
    }
    console.log('  passed');

    console.log('Scenario C: ALWAYS → cancel Approval → both CANCELLED');
    const cancelFromApproval = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: alwaysDefinition(),
      input: { title: 'Scenario C' },
    });
    requestIds.push(cancelFromApproval.id);
    if (!cancelFromApproval.approvalId) {
      throw new Error('Scenario C expected approvalId');
    }
    approvalIds.push(cancelFromApproval.approvalId);
    const cancelledApproval = await cancelApprovalCommand(cancelFromApproval.approvalId);
    const cancelledRequest = await getToolRequestById(cancelFromApproval.id);
    if (
      cancelledApproval.status !== 'CANCELLED' ||
      cancelledRequest?.status !== 'CANCELLED'
    ) {
      throw new Error('Scenario C expected CANCELLED Approval and ToolRequest');
    }
    console.log('  passed');

    console.log('Scenario D: cancel ToolRequest while waiting → both CANCELLED');
    const cancelFromRequest = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: alwaysDefinition(),
      input: { title: 'Scenario D' },
    });
    requestIds.push(cancelFromRequest.id);
    if (!cancelFromRequest.approvalId) {
      throw new Error('Scenario D expected approvalId');
    }
    approvalIds.push(cancelFromRequest.approvalId);
    await cancelToolRequest(cancelFromRequest.id);
    const afterRequestCancel = await getToolRequestById(cancelFromRequest.id);
    const afterApprovalCancel = await getApprovalById(cancelFromRequest.approvalId);
    if (
      afterRequestCancel?.status !== 'CANCELLED' ||
      afterApprovalCancel?.status !== 'CANCELLED'
    ) {
      throw new Error('Scenario D expected both rows CANCELLED');
    }
    console.log('  passed');

    console.log('Scenario E: expired PENDING approval cannot be approved into READY');
    const expireRequest = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: alwaysDefinition(),
      input: { title: 'Scenario E' },
    });
    requestIds.push(expireRequest.id);
    if (!expireRequest.approvalId) {
      throw new Error('Scenario E expected approvalId');
    }
    approvalIds.push(expireRequest.approvalId);
    await db.orm.public.Approval.where({ id: expireRequest.approvalId }).update({
      expiresAt: Temporal.Instant.from('2020-01-01T00:00:00Z'),
    });
    const expired = await approveApprovalCommand(expireRequest.approvalId);
    const expiredRequest = await getToolRequestById(expireRequest.id);
    if (expired.status !== 'EXPIRED' || expiredRequest?.status !== 'DENIED') {
      throw new Error('Scenario E expected EXPIRED Approval and DENIED ToolRequest');
    }
    console.log('  passed');

    console.log('Scenario F: READY ALWAYS cannot execute without a valid Approval');
    const invalid = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: alwaysDefinition(),
      input: { title: 'Scenario F' },
    });
    requestIds.push(invalid.id);
    if (!invalid.approvalId) {
      throw new Error('Scenario F expected approvalId');
    }
    approvalIds.push(invalid.approvalId);
    await db.orm.public.ToolRequest.where({ id: invalid.id }).update({ status: 'READY' });
    await expectRejected(
      () => createToolExecutionAttempt(invalid.id),
      'Scenario F PENDING approval',
    );

    await db.orm.public.ToolRequest.where({ id: invalid.id }).update({
      status: 'READY',
      approvalId: null,
    });
    await expectRejected(
      () => createToolExecutionAttempt(invalid.id),
      'Scenario F missing approvalId',
    );
    await db.orm.public.ToolRequest.where({ id: invalid.id }).update({
      approvalId: invalid.approvalId,
    });

    await rejectApprovalCommand(invalid.approvalId, { decisionReason: 'F reject' });
    await db.orm.public.ToolRequest.where({ id: invalid.id }).update({ status: 'READY' });
    await expectRejected(
      () => createToolExecutionAttempt(invalid.id),
      'Scenario F REJECTED approval',
    );

    const cancelledExec = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: alwaysDefinition(),
      input: { title: 'Scenario F cancel' },
    });
    requestIds.push(cancelledExec.id);
    if (!cancelledExec.approvalId) {
      throw new Error('Scenario F cancel expected approvalId');
    }
    approvalIds.push(cancelledExec.approvalId);
    await cancelApprovalCommand(cancelledExec.approvalId);
    await db.orm.public.ToolRequest.where({ id: cancelledExec.id }).update({ status: 'READY' });
    await expectRejected(
      () => createToolExecutionAttempt(cancelledExec.id),
      'Scenario F CANCELLED approval',
    );

    const expiredExec = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: alwaysDefinition(),
      input: { title: 'Scenario F expire status' },
    });
    requestIds.push(expiredExec.id);
    if (!expiredExec.approvalId) {
      throw new Error('Scenario F expire expected approvalId');
    }
    approvalIds.push(expiredExec.approvalId);
    await db.orm.public.Approval.where({ id: expiredExec.approvalId }).update({
      expiresAt: Temporal.Instant.from('2020-01-01T00:00:00Z'),
    });
    await approveApprovalCommand(expiredExec.approvalId);
    await db.orm.public.ToolRequest.where({ id: expiredExec.id }).update({ status: 'READY' });
    await expectRejected(
      () => createToolExecutionAttempt(expiredExec.id),
      'Scenario F EXPIRED approval',
    );

    const approvedExpired = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: alwaysDefinition(),
      input: { title: 'Scenario F approved expired' },
    });
    requestIds.push(approvedExpired.id);
    if (!approvedExpired.approvalId) {
      throw new Error('Scenario F approved-expired expected approvalId');
    }
    approvalIds.push(approvedExpired.approvalId);
    await approveApprovalCommand(approvedExpired.approvalId);
    await db.orm.public.Approval.where({ id: approvedExpired.approvalId }).update({
      expiresAt: Temporal.Instant.from('2020-01-01T00:00:00Z'),
    });
    await expectRejected(
      () => createToolExecutionAttempt(approvedExpired.id),
      'Scenario F approved-but-expired',
    );
    console.log('  passed');

    console.log('Scenario G: READY + valid APPROVED Approval can queue a ToolExecution');
    const valid = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: alwaysDefinition(),
      input: { title: 'Scenario G' },
    });
    requestIds.push(valid.id);
    if (!valid.approvalId) {
      throw new Error('Scenario G expected approvalId');
    }
    approvalIds.push(valid.approvalId);
    await approveApprovalCommand(valid.approvalId);
    const queued = await createToolExecutionAttempt(valid.id);
    executionIds.push(queued.id);
    const stillReady = await getToolRequestById(valid.id);
    if (queued.status !== 'QUEUED' || stillReady?.status !== 'READY') {
      throw new Error('Scenario G expected QUEUED attempt and READY request');
    }
    console.log('  passed');

    console.log('NEVER tools still execute without Approval');
    const neverRequest = await requestToolUse({
      organizationId: organization.id,
      actor: user,
      definition: neverDefinition(),
      input: { title: 'NEVER' },
    });
    requestIds.push(neverRequest.id);
    const neverAttempt = await createToolExecutionAttempt(neverRequest.id);
    executionIds.push(neverAttempt.id);
    if (neverRequest.approvalId != null || neverAttempt.status !== 'QUEUED') {
      throw new Error('NEVER tool should queue without an Approval');
    }
    console.log('  passed');

    console.log('Non-tool approvals: PENDING → APPROVED / REJECTED / CANCELLED');
    const nonToolApprove = await requestApprovalCommand({
      organizationId: organization.id,
      title: 'Verify non-tool approve',
      actionType: NON_TOOL_ACTION_TYPE,
      riskLevel: 'LOW',
      requestedByType: 'USER',
    });
    approvalIds.push(nonToolApprove.id);
    const nonToolApproved = await approveApprovalCommand(nonToolApprove.id);
    if (nonToolApproved.status !== 'APPROVED') {
      throw new Error('Non-tool approve expected APPROVED');
    }
    if ((await getToolRequestByApprovalId(nonToolApprove.id)) != null) {
      throw new Error('Non-tool Approval must not create a ToolRequest');
    }

    const nonToolReject = await requestApprovalCommand({
      organizationId: organization.id,
      title: 'Verify non-tool reject',
      actionType: NON_TOOL_ACTION_TYPE,
      riskLevel: 'LOW',
      requestedByType: 'USER',
    });
    approvalIds.push(nonToolReject.id);
    const nonToolRejected = await rejectApprovalCommand(nonToolReject.id, {
      decisionReason: 'Verification',
    });
    if (nonToolRejected.status !== 'REJECTED') {
      throw new Error('Non-tool reject expected REJECTED');
    }

    const nonToolCancel = await requestApprovalCommand({
      organizationId: organization.id,
      title: 'Verify non-tool cancel',
      actionType: NON_TOOL_ACTION_TYPE,
      riskLevel: 'LOW',
      requestedByType: 'USER',
    });
    approvalIds.push(nonToolCancel.id);
    const nonToolCancelled = await cancelApprovalCommand(nonToolCancel.id);
    if (nonToolCancelled.status !== 'CANCELLED') {
      throw new Error('Non-tool cancel expected CANCELLED');
    }
    console.log('  passed');

    console.log('verification passed');
  } finally {
    await cleanup({
      organizationId: organization.id,
      requestIds,
      executionIds,
      approvalIds,
    });
    console.log('cleanup complete');
  }
} finally {
  await db.close();
}
