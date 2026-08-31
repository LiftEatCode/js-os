import { db } from '../prisma/db.ts';
import { BusinessStateNotFoundError } from './errors.ts';
import type {
  Approval,
  ApprovalDecisionInput,
  ApprovalListFilter,
  CreateApprovalRequestInput,
} from './types.ts';
import {
  assertApprovalCanCancel,
  assertApprovalCanDecide,
  requireNonEmptyString,
} from './validation.ts';

export async function getApprovalById(id: string): Promise<Approval | null> {
  return db.orm.public.Approval.where({ id }).first();
}

export async function listApprovals(filter: ApprovalListFilter): Promise<Approval[]> {
  const where: {
    organizationId: string;
    status?: ApprovalListFilter['status'];
    workItemId?: string | null;
  } = { organizationId: filter.organizationId };

  if (filter.status) {
    where.status = filter.status;
  }
  if (filter.workItemId !== undefined) {
    where.workItemId = filter.workItemId;
  }

  return db.orm.public.Approval.where(where)
    .orderBy((approval) => approval.requestedAt.desc())
    .all();
}

export async function listPendingApprovals(organizationId: string): Promise<Approval[]> {
  return listApprovals({ organizationId, status: 'PENDING' });
}

export async function createApprovalRequest(
  input: CreateApprovalRequestInput,
): Promise<Approval> {
  const title = requireNonEmptyString(input.title, 'title');
  const actionType = requireNonEmptyString(input.actionType, 'actionType');

  return db.orm.public.Approval.create({
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

async function decideApproval(
  id: string,
  status: 'APPROVED' | 'REJECTED',
  input: ApprovalDecisionInput = {},
): Promise<Approval> {
  const existing = await getApprovalById(id);
  if (!existing) {
    throw new BusinessStateNotFoundError(`Approval not found: ${id}`);
  }
  assertApprovalCanDecide(existing.status);

  await db.orm.public.Approval.where({ id }).update({
    status,
    decidedAt: Temporal.Now.instant(),
    decisionReason: input.decisionReason ?? null,
  });

  const updated = await getApprovalById(id);
  if (!updated) {
    throw new BusinessStateNotFoundError(`Approval not found after decision: ${id}`);
  }
  return updated;
}

export async function approveApproval(
  id: string,
  input: ApprovalDecisionInput = {},
): Promise<Approval> {
  return decideApproval(id, 'APPROVED', input);
}

export async function rejectApproval(
  id: string,
  input: ApprovalDecisionInput = {},
): Promise<Approval> {
  return decideApproval(id, 'REJECTED', input);
}

export async function cancelApproval(
  id: string,
  input: ApprovalDecisionInput = {},
): Promise<Approval> {
  const existing = await getApprovalById(id);
  if (!existing) {
    throw new BusinessStateNotFoundError(`Approval not found: ${id}`);
  }
  assertApprovalCanCancel(existing.status);

  await db.orm.public.Approval.where({ id }).update({
    status: 'CANCELLED',
    decidedAt: Temporal.Now.instant(),
    decisionReason: input.decisionReason ?? null,
  });

  const updated = await getApprovalById(id);
  if (!updated) {
    throw new BusinessStateNotFoundError(`Approval not found after cancel: ${id}`);
  }
  return updated;
}
