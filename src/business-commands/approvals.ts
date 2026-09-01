/// <reference types="temporal-polyfill/types/global" />
import { BusinessStateNotFoundError } from '../business-state/errors.ts';
import type {
  Approval,
  ApprovalDecisionInput,
  CreateApprovalRequestInput,
  RecordBusinessEventInput,
} from '../business-state/types.ts';
import { assertApprovalCanCancel, assertApprovalCanDecide } from '../business-state/validation.ts';
import { nextApprovalDecision } from '../business-state/approval-lifecycle.ts';

export const APPROVAL_EVENT_TYPES = {
  requested: 'approval.requested',
  approved: 'approval.approved',
  rejected: 'approval.rejected',
  cancelled: 'approval.cancelled',
} as const;

export type ApprovalCommandActor = {
  sourceType: 'USER' | 'AGENT' | 'SYSTEM';
  sourceId?: string | null;
};

export type ApprovalCommandStore = {
  getApprovalById(id: string): Promise<Approval | null>;
  createApproval(input: CreateApprovalRequestInput): Promise<Approval>;
  applyDecision(
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'CANCELLED',
    input: ApprovalDecisionInput,
    now: Temporal.Instant,
  ): Promise<Approval>;
  recordEvent(input: RecordBusinessEventInput): Promise<void>;
};

export type ApprovalEventMetadata = {
  approvalId: string;
  actionType?: string;
  riskLevel: Approval['riskLevel'];
  workItemId?: string;
};

export function approvalRequestMetadata(approval: Approval): ApprovalEventMetadata {
  const metadata: ApprovalEventMetadata = {
    approvalId: approval.id,
    actionType: approval.actionType,
    riskLevel: approval.riskLevel,
  };
  if (approval.workItemId) {
    metadata.workItemId = approval.workItemId;
  }
  return metadata;
}

export function approvalDecisionMetadata(approval: Approval): ApprovalEventMetadata {
  const metadata: ApprovalEventMetadata = {
    approvalId: approval.id,
    riskLevel: approval.riskLevel,
  };
  if (approval.workItemId) {
    metadata.workItemId = approval.workItemId;
  }
  return metadata;
}

function eventInput(
  approval: Approval,
  eventType: string,
  title: string,
  metadata: ApprovalEventMetadata,
  now: Temporal.Instant,
  actor: ApprovalCommandActor,
): RecordBusinessEventInput {
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

export async function requestApprovalWithStore(
  store: ApprovalCommandStore,
  input: CreateApprovalRequestInput,
  now: Temporal.Instant,
  actor: ApprovalCommandActor,
): Promise<Approval> {
  const approval = await store.createApproval(input);
  await store.recordEvent(
    eventInput(
      approval,
      APPROVAL_EVENT_TYPES.requested,
      'Approval requested',
      approvalRequestMetadata(approval),
      now,
      actor,
    ),
  );
  return approval;
}

async function decideApprovalWithStore(
  store: ApprovalCommandStore,
  id: string,
  status: 'APPROVED' | 'REJECTED' | 'CANCELLED',
  input: ApprovalDecisionInput,
  now: Temporal.Instant,
  actor: ApprovalCommandActor,
  eventType: string,
  title: string,
): Promise<Approval> {
  const existing = await store.getApprovalById(id);
  if (!existing) {
    throw new BusinessStateNotFoundError(`Approval not found: ${id}`);
  }
  if (status === 'CANCELLED') {
    assertApprovalCanCancel(existing.status);
  } else {
    assertApprovalCanDecide(existing.status);
  }
  nextApprovalDecision(status, input.decisionReason, now);

  const updated = await store.applyDecision(id, status, input, now);
  await store.recordEvent(
    eventInput(updated, eventType, title, approvalDecisionMetadata(updated), now, actor),
  );
  return updated;
}

export async function approveApprovalWithStore(
  store: ApprovalCommandStore,
  id: string,
  input: ApprovalDecisionInput,
  now: Temporal.Instant,
  actor: ApprovalCommandActor,
): Promise<Approval> {
  return decideApprovalWithStore(
    store,
    id,
    'APPROVED',
    input,
    now,
    actor,
    APPROVAL_EVENT_TYPES.approved,
    'Approval approved',
  );
}

export async function rejectApprovalWithStore(
  store: ApprovalCommandStore,
  id: string,
  input: ApprovalDecisionInput,
  now: Temporal.Instant,
  actor: ApprovalCommandActor,
): Promise<Approval> {
  return decideApprovalWithStore(
    store,
    id,
    'REJECTED',
    input,
    now,
    actor,
    APPROVAL_EVENT_TYPES.rejected,
    'Approval rejected',
  );
}

export async function cancelApprovalWithStore(
  store: ApprovalCommandStore,
  id: string,
  input: ApprovalDecisionInput,
  now: Temporal.Instant,
  actor: ApprovalCommandActor,
): Promise<Approval> {
  return decideApprovalWithStore(
    store,
    id,
    'CANCELLED',
    input,
    now,
    actor,
    APPROVAL_EVENT_TYPES.cancelled,
    'Approval cancelled',
  );
}
