/// <reference types="temporal-polyfill/types/global" />
import {
  applyApprovalDecisionWithOrm,
  createApprovalRequestWithOrm,
  getApprovalByIdWithOrm,
  listApprovalsWithOrm,
} from './approval-persistence.ts';
import { db } from '../prisma/db.ts';
import type {
  Approval,
  ApprovalDecisionInput,
  ApprovalListFilter,
  CreateApprovalRequestInput,
} from './types.ts';

export async function getApprovalById(id: string): Promise<Approval | null> {
  return getApprovalByIdWithOrm(db.orm, id);
}

export async function listApprovals(filter: ApprovalListFilter): Promise<Approval[]> {
  return listApprovalsWithOrm(db.orm, filter);
}

export async function listPendingApprovals(organizationId: string): Promise<Approval[]> {
  return listApprovals({ organizationId, status: 'PENDING' });
}

export async function createApprovalRequest(
  input: CreateApprovalRequestInput,
): Promise<Approval> {
  return createApprovalRequestWithOrm(db.orm, input);
}

export async function approveApproval(
  id: string,
  input: ApprovalDecisionInput = {},
): Promise<Approval> {
  return applyApprovalDecisionWithOrm(db.orm, id, 'APPROVED', input);
}

export async function rejectApproval(
  id: string,
  input: ApprovalDecisionInput = {},
): Promise<Approval> {
  return applyApprovalDecisionWithOrm(db.orm, id, 'REJECTED', input);
}

export async function cancelApproval(
  id: string,
  input: ApprovalDecisionInput = {},
): Promise<Approval> {
  return applyApprovalDecisionWithOrm(db.orm, id, 'CANCELLED', input);
}
