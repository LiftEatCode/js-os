/// <reference types="temporal-polyfill/types/global" />
import { InvalidBusinessStateInputError } from './errors.ts';
import type { ApprovalStatus } from './types.ts';

export const TERMINAL_APPROVAL_STATUSES = [
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
] as const satisfies readonly ApprovalStatus[];

export type TerminalApprovalStatus = (typeof TERMINAL_APPROVAL_STATUSES)[number];

export type ApprovalDecisionStatus = 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type ApprovalDecisionFields = {
  status: ApprovalDecisionStatus;
  decidedAt: Temporal.Instant;
  decisionReason: string | null;
};

/**
 * Approval proposal fields are immutable after creation.
 * Only decision state (status, decidedAt, decisionReason) may change afterward.
 * There is no update-proposal API.
 */
export function isTerminalApprovalStatus(status: ApprovalStatus): boolean {
  return status !== 'PENDING';
}

/**
 * Authorization is invalid when expiresAt is set and is at or before now.
 * Used at decision and execution boundaries. There is no expiration worker.
 */
export function isApprovalAuthorizationExpired(
  expiresAt: Temporal.Instant | null,
  now: Temporal.Instant,
): boolean {
  return expiresAt !== null && Temporal.Instant.compare(expiresAt, now) <= 0;
}

/**
 * Derived UI information only. Does not mutate status by itself.
 * A PENDING row with expiresAt in the past is still PENDING until a decision
 * boundary persists EXPIRED.
 */
export function isPendingPastExpiration(
  status: ApprovalStatus,
  expiresAt: Temporal.Instant | null,
  now: Temporal.Instant,
): boolean {
  return status === 'PENDING' && isApprovalAuthorizationExpired(expiresAt, now);
}

export function nextApprovalExpiration(
  now: Temporal.Instant,
  reason?: string | null,
): { status: 'EXPIRED'; decidedAt: Temporal.Instant; decisionReason: string } {
  const trimmed = reason?.trim() ?? '';
  return {
    status: 'EXPIRED',
    decidedAt: now,
    decisionReason: trimmed.length === 0 ? 'Expired before authorization.' : trimmed,
  };
}

export function requireRejectionReason(reason: string | null | undefined): string {
  const trimmed = reason?.trim() ?? '';
  if (trimmed.length === 0) {
    throw new InvalidBusinessStateInputError('decisionReason is required when rejecting an Approval.');
  }
  return trimmed;
}

export function optionalDecisionReason(reason: string | null | undefined): string | null {
  const trimmed = reason?.trim() ?? '';
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * decidedAt is owned by Approval domain logic, not the UI.
 * APPROVED, REJECTED, and CANCELLED are final dispositions and set decidedAt.
 */
export function nextApprovalDecision(
  status: ApprovalDecisionStatus,
  reason: string | null | undefined,
  now: Temporal.Instant,
): ApprovalDecisionFields {
  const decisionReason =
    status === 'REJECTED' ? requireRejectionReason(reason) : optionalDecisionReason(reason);

  return {
    status,
    decidedAt: now,
    decisionReason,
  };
}
