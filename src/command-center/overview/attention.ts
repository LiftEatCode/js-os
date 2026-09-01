/// <reference types="temporal-polyfill/types/global" />
import type {
  AgentRunStatus,
  ApprovalStatus,
  WorkItemPriority,
  WorkItemStatus,
} from '../../business-state/types.ts';

export const CLOSED_WORK_STATUSES = ['COMPLETED', 'CANCELLED'] as const;

export type OwnerAttentionKind =
  | 'critical_work'
  | 'failed_agent_run'
  | 'pending_approval'
  | 'blocked_work'
  | 'overdue_work';

export type OwnerAttentionSeverity = 'info' | 'warning' | 'critical';

export type OwnerAttentionItem = {
  kind: OwnerAttentionKind;
  title: string;
  description?: string;
  href: string;
  severity: OwnerAttentionSeverity;
};

export type AttentionWorkItem = {
  id: string;
  title: string;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  dueAt: Temporal.Instant | null;
  createdAt: Temporal.Instant;
};

export type AttentionApproval = {
  id: string;
  title: string;
  status: ApprovalStatus;
  requestedAt: Temporal.Instant;
};

export type AttentionAgentRun = {
  id: string;
  status: AgentRunStatus;
  error: string | null;
  completedAt: Temporal.Instant | null;
  createdAt: Temporal.Instant;
  agentName?: string | null;
};

export type BuildOwnerAttentionInput = {
  workItems: AttentionWorkItem[];
  pendingApprovals: AttentionApproval[];
  failedAgentRuns: AttentionAgentRun[];
  now: Temporal.Instant;
};

const KIND_ORDER: OwnerAttentionKind[] = [
  'critical_work',
  'failed_agent_run',
  'pending_approval',
  'blocked_work',
  'overdue_work',
];

const PRIORITY_RANK: Record<WorkItemPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export function isOpenWorkItem(status: WorkItemStatus): boolean {
  return status !== 'COMPLETED' && status !== 'CANCELLED';
}

export function compareWorkPriority(a: WorkItemPriority, b: WorkItemPriority): number {
  return PRIORITY_RANK[a] - PRIORITY_RANK[b];
}

export function sortOpenWorkItems<T extends AttentionWorkItem>(items: T[]): T[] {
  return [...items].filter((item) => isOpenWorkItem(item.status)).sort((a, b) => {
    const byPriority = compareWorkPriority(a.priority, b.priority);
    if (byPriority !== 0) {
      return byPriority;
    }
    if (a.dueAt && b.dueAt) {
      const byDue = Temporal.Instant.compare(a.dueAt, b.dueAt);
      if (byDue !== 0) {
        return byDue;
      }
    } else if (a.dueAt) {
      return -1;
    } else if (b.dueAt) {
      return 1;
    }
    return Temporal.Instant.compare(b.createdAt, a.createdAt);
  });
}

function isOverdue(item: AttentionWorkItem, now: Temporal.Instant): boolean {
  if (!item.dueAt || !isOpenWorkItem(item.status)) {
    return false;
  }
  return Temporal.Instant.compare(item.dueAt, now) < 0;
}

function compareInstantAsc(a: Temporal.Instant, b: Temporal.Instant): number {
  return Temporal.Instant.compare(a, b);
}

function compareInstantDesc(a: Temporal.Instant, b: Temporal.Instant): number {
  return Temporal.Instant.compare(b, a);
}

/**
 * Deterministic Owner Attention projection.
 *
 * Not AI reasoning, not a policy engine. Surfaces concrete persisted conditions.
 *
 * WorkItems appear in at most one group, first match in:
 * critical open work → blocked open work → overdue open work.
 *
 * Group order:
 * 1. Critical work
 * 2. Failed AgentRuns
 * 3. Pending approvals
 * 4. Blocked work
 * 5. Overdue work
 */
export function buildOwnerAttention(input: BuildOwnerAttentionInput): OwnerAttentionItem[] {
  const openWork = input.workItems.filter((item) => isOpenWorkItem(item.status));
  const usedWorkIds = new Set<string>();
  const grouped: Record<OwnerAttentionKind, OwnerAttentionItem[]> = {
    critical_work: [],
    failed_agent_run: [],
    pending_approval: [],
    blocked_work: [],
    overdue_work: [],
  };

  const critical = openWork
    .filter((item) => item.priority === 'CRITICAL')
    .sort((a, b) => compareInstantAsc(a.createdAt, b.createdAt));

  for (const item of critical) {
    usedWorkIds.add(item.id);
    grouped.critical_work.push({
      kind: 'critical_work',
      title: item.title,
      description: `Open ${item.status} work with CRITICAL priority.`,
      href: `/app/work/${item.id}`,
      severity: 'critical',
    });
  }

  const failed = [...input.failedAgentRuns]
    .filter((run) => run.status === 'FAILED')
    .sort((a, b) => {
      const aTime = a.completedAt ?? a.createdAt;
      const bTime = b.completedAt ?? b.createdAt;
      return compareInstantDesc(aTime, bTime);
    });

  for (const run of failed) {
    const agent = run.agentName?.trim();
    grouped.failed_agent_run.push({
      kind: 'failed_agent_run',
      title: agent ? `${agent} run failed` : 'Agent run failed',
      description: run.error?.trim() || 'An AgentRun ended in FAILED.',
      href: '/app/agents',
      severity: 'critical',
    });
  }

  const pending = [...input.pendingApprovals]
    .filter((approval) => approval.status === 'PENDING')
    .sort((a, b) => compareInstantAsc(a.requestedAt, b.requestedAt));

  for (const approval of pending) {
    grouped.pending_approval.push({
      kind: 'pending_approval',
      title: approval.title,
      description: 'Pending authorization. Approval does not execute the action.',
      href: `/app/approvals/${approval.id}`,
      severity: 'warning',
    });
  }

  const blocked = openWork
    .filter((item) => item.status === 'BLOCKED' && !usedWorkIds.has(item.id))
    .sort((a, b) => compareInstantAsc(a.createdAt, b.createdAt));

  for (const item of blocked) {
    usedWorkIds.add(item.id);
    grouped.blocked_work.push({
      kind: 'blocked_work',
      title: item.title,
      description: 'Open work is BLOCKED.',
      href: `/app/work/${item.id}`,
      severity: 'warning',
    });
  }

  const overdue = openWork
    .filter((item) => isOverdue(item, input.now) && !usedWorkIds.has(item.id))
    .sort((a, b) => {
      if (a.dueAt && b.dueAt) {
        return compareInstantAsc(a.dueAt, b.dueAt);
      }
      return compareInstantAsc(a.createdAt, b.createdAt);
    });

  for (const item of overdue) {
    grouped.overdue_work.push({
      kind: 'overdue_work',
      title: item.title,
      description: 'Open work is past its due date.',
      href: `/app/work/${item.id}`,
      severity: 'warning',
    });
  }

  return KIND_ORDER.flatMap((kind) => grouped[kind]);
}
