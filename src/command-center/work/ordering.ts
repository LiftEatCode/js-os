/// <reference types="temporal-polyfill/types/global" />
import type { WorkItemPriority, WorkItemStatus } from '../../business-state/types.ts';
import { WORK_LIST_STATUS_ORDER, WORK_PRIORITY_ORDER } from './constants.ts';

export type SortableWorkItem = {
  status: WorkItemStatus;
  priority: WorkItemPriority;
  dueAt: Temporal.Instant | null;
  createdAt: Temporal.Instant;
};

const statusRank = Object.fromEntries(
  WORK_LIST_STATUS_ORDER.map((status, index) => [status, index]),
) as Record<WorkItemStatus, number>;

const priorityRank = Object.fromEntries(
  WORK_PRIORITY_ORDER.map((priority, index) => [priority, index]),
) as Record<WorkItemPriority, number>;

export function compareWorkItems(a: SortableWorkItem, b: SortableWorkItem): number {
  const byStatus = statusRank[a.status] - statusRank[b.status];
  if (byStatus !== 0) {
    return byStatus;
  }
  const byPriority = priorityRank[a.priority] - priorityRank[b.priority];
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
}

export function sortWorkItems<T extends SortableWorkItem>(items: T[]): T[] {
  return [...items].sort(compareWorkItems);
}
