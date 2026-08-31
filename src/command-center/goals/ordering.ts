/// <reference types="temporal-polyfill/types/global" />
import type { GoalPriority, GoalStatus } from '../../business-state/types.ts';
import { GOAL_LIST_STATUS_ORDER, GOAL_PRIORITY_ORDER } from './constants.ts';

export type SortableGoal = {
  status: GoalStatus;
  priority: GoalPriority;
  targetDate: Temporal.Instant | null;
  createdAt: Temporal.Instant;
};

const statusRank = Object.fromEntries(
  GOAL_LIST_STATUS_ORDER.map((status, index) => [status, index]),
) as Record<GoalStatus, number>;

const priorityRank = Object.fromEntries(
  GOAL_PRIORITY_ORDER.map((priority, index) => [priority, index]),
) as Record<GoalPriority, number>;

export function compareGoals(a: SortableGoal, b: SortableGoal): number {
  const byStatus = statusRank[a.status] - statusRank[b.status];
  if (byStatus !== 0) {
    return byStatus;
  }
  const byPriority = priorityRank[a.priority] - priorityRank[b.priority];
  if (byPriority !== 0) {
    return byPriority;
  }
  if (a.targetDate && b.targetDate) {
    const byTarget = Temporal.Instant.compare(a.targetDate, b.targetDate);
    if (byTarget !== 0) {
      return byTarget;
    }
  } else if (a.targetDate) {
    return -1;
  } else if (b.targetDate) {
    return 1;
  }
  return Temporal.Instant.compare(b.createdAt, a.createdAt);
}

export function sortGoals<T extends SortableGoal>(goals: T[]): T[] {
  return [...goals].sort(compareGoals);
}
