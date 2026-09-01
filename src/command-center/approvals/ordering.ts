/// <reference types="temporal-polyfill/types/global" />
import type { ApprovalRiskLevel, ApprovalStatus } from '../../business-state/types.ts';
import { APPROVAL_RISK_ORDER } from './constants.ts';

export type SortableApproval = {
  status: ApprovalStatus;
  riskLevel: ApprovalRiskLevel;
  requestedAt: Temporal.Instant;
  decidedAt: Temporal.Instant | null;
};

const riskRank = Object.fromEntries(
  APPROVAL_RISK_ORDER.map((risk, index) => [risk, index]),
) as Record<ApprovalRiskLevel, number>;

/**
 * PENDING first (by risk CRITICAL→LOW, then oldest requestedAt).
 * Terminal records follow, most recently decided then most recently requested.
 */
export function compareApprovals(a: SortableApproval, b: SortableApproval): number {
  const aPending = a.status === 'PENDING';
  const bPending = b.status === 'PENDING';
  if (aPending !== bPending) {
    return aPending ? -1 : 1;
  }

  if (aPending && bPending) {
    const byRisk = riskRank[a.riskLevel] - riskRank[b.riskLevel];
    if (byRisk !== 0) {
      return byRisk;
    }
    return Temporal.Instant.compare(a.requestedAt, b.requestedAt);
  }

  const aDecided = a.decidedAt ?? a.requestedAt;
  const bDecided = b.decidedAt ?? b.requestedAt;
  const byRecent = Temporal.Instant.compare(bDecided, aDecided);
  if (byRecent !== 0) {
    return byRecent;
  }
  return Temporal.Instant.compare(b.requestedAt, a.requestedAt);
}

export function sortApprovals<T extends SortableApproval>(items: T[]): T[] {
  return [...items].sort(compareApprovals);
}
