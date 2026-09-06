/// <reference types="temporal-polyfill/types/global" />
import { isApprovalAuthorizationExpired } from '../business-state/approval-lifecycle.ts';
import type { Approval, ApprovalDecisionInput } from '../business-state/types.ts';
import {
  APPROVAL_EVENT_TYPES,
  approveApprovalWithStore,
  cancelApprovalWithStore,
  rejectApprovalWithStore,
  type ApprovalCommandActor,
  type ApprovalCommandStore,
} from '../business-commands/approvals.ts';
import { TOOL_DENIAL_REASONS } from './approval.ts';
import type { ToolLifecycleStore } from './lifecycle-store.ts';
import {
  cancelToolRequestWithStore,
  denyToolRequestWithStore,
  markToolRequestReadyWithStore,
} from './requests.ts';

function approvalEvent(
  approval: Approval,
  eventType: string,
  title: string,
  now: Temporal.Instant,
  actor: ApprovalCommandActor,
) {
  const metadata: Record<string, string> = {
    approvalId: approval.id,
    riskLevel: approval.riskLevel,
  };
  if (approval.actionType) {
    metadata.actionType = approval.actionType;
  }
  if (approval.workItemId) {
    metadata.workItemId = approval.workItemId;
  }
  return {
    organizationId: approval.organizationId,
    eventType,
    sourceType: actor.sourceType,
    sourceId: actor.sourceId ?? null,
    title,
    occurredAt: now,
    metadata,
  };
}

async function transitionLinkedWaitingRequest(
  toolStore: ToolLifecycleStore,
  approvalId: string,
  now: Temporal.Instant,
  to: 'READY' | 'DENIED' | 'CANCELLED',
  reason?: string,
): Promise<void> {
  const linked = await toolStore.getToolRequestByApprovalId(approvalId);
  if (!linked) {
    return;
  }
  if (linked.status !== 'WAITING_APPROVAL') {
    return;
  }
  if (to === 'READY') {
    await markToolRequestReadyWithStore(toolStore, linked.id, now);
    return;
  }
  if (to === 'DENIED') {
    await denyToolRequestWithStore(toolStore, linked.id, now, reason);
    return;
  }
  await cancelToolRequestWithStore(toolStore, linked.id, now);
}

async function expirePendingApprovalWithStore(
  store: ApprovalCommandStore,
  id: string,
  now: Temporal.Instant,
  actor: ApprovalCommandActor,
  reason?: string | null,
): Promise<Approval> {
  const expired = await store.expirePending(id, now, reason);
  await store.recordEvent(
    approvalEvent(expired, APPROVAL_EVENT_TYPES.expired, 'Approval expired', now, actor),
  );
  return expired;
}

/**
 * Owner approve: PENDING + past expiresAt persists EXPIRED and denies a linked
 * WAITING_APPROVAL ToolRequest. Otherwise APPROVED + linked request READY.
 * Never creates a ToolExecution.
 */
export async function approveApprovalAndLinkedToolRequest(
  approvalStore: ApprovalCommandStore,
  toolStore: ToolLifecycleStore,
  id: string,
  input: ApprovalDecisionInput,
  now: Temporal.Instant,
  actor: ApprovalCommandActor,
): Promise<Approval> {
  const existing = await approvalStore.getApprovalById(id);
  if (existing?.status === 'PENDING' && isApprovalAuthorizationExpired(existing.expiresAt, now)) {
    const expired = await expirePendingApprovalWithStore(approvalStore, id, now, actor);
    await transitionLinkedWaitingRequest(
      toolStore,
      expired.id,
      now,
      'DENIED',
      TOOL_DENIAL_REASONS.APPROVAL_EXPIRED,
    );
    return expired;
  }

  const decided = await approveApprovalWithStore(approvalStore, id, input, now, actor);
  await transitionLinkedWaitingRequest(toolStore, decided.id, now, 'READY');
  return decided;
}

export async function rejectApprovalAndLinkedToolRequest(
  approvalStore: ApprovalCommandStore,
  toolStore: ToolLifecycleStore,
  id: string,
  input: ApprovalDecisionInput,
  now: Temporal.Instant,
  actor: ApprovalCommandActor,
): Promise<Approval> {
  const decided = await rejectApprovalWithStore(approvalStore, id, input, now, actor);
  await transitionLinkedWaitingRequest(
    toolStore,
    decided.id,
    now,
    'DENIED',
    TOOL_DENIAL_REASONS.APPROVAL_REJECTED,
  );
  return decided;
}

export async function cancelApprovalAndLinkedToolRequest(
  approvalStore: ApprovalCommandStore,
  toolStore: ToolLifecycleStore,
  id: string,
  input: ApprovalDecisionInput,
  now: Temporal.Instant,
  actor: ApprovalCommandActor,
): Promise<Approval> {
  const decided = await cancelApprovalWithStore(approvalStore, id, input, now, actor);
  await transitionLinkedWaitingRequest(toolStore, decided.id, now, 'CANCELLED');
  return decided;
}
