/// <reference types="temporal-polyfill/types/global" />
import { nextApprovalDecision, nextApprovalExpiration } from './approval-lifecycle.ts';
import { BusinessStateNotFoundError, InvalidBusinessStateTransitionError } from './errors.ts';
import type { PersistenceOrm } from './persistence.ts';
import type {
  Approval,
  ApprovalDecisionInput,
  ApprovalListFilter,
  CreateApprovalRequestInput,
} from './types.ts';
import {
  assertApprovalCanCancel,
  assertApprovalCanDecide,
  requireActionType,
  requireNonEmptyString,
} from './validation.ts';

export async function getApprovalByIdWithOrm(
  orm: PersistenceOrm,
  id: string,
): Promise<Approval | null> {
  return orm.public.Approval.where({ id }).first();
}

export async function listApprovalsWithOrm(
  orm: PersistenceOrm,
  filter: ApprovalListFilter,
): Promise<Approval[]> {
  const where: {
    organizationId: string;
    status?: ApprovalListFilter['status'];
    riskLevel?: ApprovalListFilter['riskLevel'];
    requestedByType?: ApprovalListFilter['requestedByType'];
    workItemId?: string | null;
  } = { organizationId: filter.organizationId };

  if (filter.status) {
    where.status = filter.status;
  }
  if (filter.riskLevel) {
    where.riskLevel = filter.riskLevel;
  }
  if (filter.requestedByType) {
    where.requestedByType = filter.requestedByType;
  }
  if (filter.workItemId !== undefined) {
    where.workItemId = filter.workItemId;
  }

  return orm.public.Approval.where(where)
    .orderBy((approval) => approval.requestedAt.desc())
    .all();
}

export async function createApprovalRequestWithOrm(
  orm: PersistenceOrm,
  input: CreateApprovalRequestInput,
): Promise<Approval> {
  const title = requireNonEmptyString(input.title, 'title');
  const actionType = requireActionType(input.actionType);

  return orm.public.Approval.create({
    organizationId: input.organizationId,
    title,
    actionType,
    riskLevel: input.riskLevel,
    requestedByType: input.requestedByType,
    status: 'PENDING',
    description: input.description ?? null,
    workItemId: input.workItemId ?? null,
    agentRunId: input.agentRunId ?? null,
    requestedById: input.requestedById ?? null,
    expiresAt: input.expiresAt ?? null,
    payload: input.payload ?? null,
  });
}

export async function applyApprovalDecisionWithOrm(
  orm: PersistenceOrm,
  id: string,
  status: 'APPROVED' | 'REJECTED' | 'CANCELLED',
  input: ApprovalDecisionInput = {},
  now: Temporal.Instant = Temporal.Now.instant(),
): Promise<Approval> {
  const existing = await getApprovalByIdWithOrm(orm, id);
  if (!existing) {
    throw new BusinessStateNotFoundError(`Approval not found: ${id}`);
  }

  if (status === 'CANCELLED') {
    assertApprovalCanCancel(existing.status);
  } else {
    assertApprovalCanDecide(existing.status);
  }

  const patch = nextApprovalDecision(status, input.decisionReason, now);
  const updated = await orm.public.Approval.where({ id, status: 'PENDING' }).update({
    status: patch.status,
    decidedAt: patch.decidedAt,
    decisionReason: patch.decisionReason,
  });
  const row = firstUpdated(updated);
  if (row) {
    return row;
  }

  const current = await getApprovalByIdWithOrm(orm, id);
  if (!current) {
    throw new BusinessStateNotFoundError(`Approval not found after decision: ${id}`);
  }
  throw new InvalidBusinessStateTransitionError(
    `Approval cannot transition from ${current.status} to ${status}.`,
  );
}

export async function expirePendingApprovalWithOrm(
  orm: PersistenceOrm,
  id: string,
  now: Temporal.Instant = Temporal.Now.instant(),
  reason?: string | null,
): Promise<Approval> {
  const existing = await getApprovalByIdWithOrm(orm, id);
  if (!existing) {
    throw new BusinessStateNotFoundError(`Approval not found: ${id}`);
  }
  if (existing.status !== 'PENDING') {
    throw new InvalidBusinessStateTransitionError(
      `Approval cannot expire from status ${existing.status}; expected PENDING.`,
    );
  }

  const patch = nextApprovalExpiration(now, reason);
  const updated = await orm.public.Approval.where({ id, status: 'PENDING' }).update({
    status: patch.status,
    decidedAt: patch.decidedAt,
    decisionReason: patch.decisionReason,
  });
  const row = firstUpdated(updated);
  if (row) {
    return row;
  }

  const current = await getApprovalByIdWithOrm(orm, id);
  if (!current) {
    throw new BusinessStateNotFoundError(`Approval not found after expiration: ${id}`);
  }
  throw new InvalidBusinessStateTransitionError(
    `Approval cannot expire from status ${current.status}; expected PENDING.`,
  );
}

function firstUpdated<T>(updated: T | T[] | null | undefined): T | undefined {
  if (updated == null) {
    return undefined;
  }
  return Array.isArray(updated) ? updated[0] : updated;
}
