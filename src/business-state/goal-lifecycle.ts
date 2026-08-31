/// <reference types="temporal-polyfill/types/global" />
import type { GoalStatus } from './types.ts';

/**
 * completedAt is owned by the Goal service, not the UI.
 *
 * - Entering ACHIEVED sets completedAt if it is currently empty.
 * - Leaving ACHIEVED clears completedAt.
 * - Other status changes leave completedAt unchanged (`undefined`).
 */
export function nextGoalCompletedAt(
  currentStatus: GoalStatus,
  nextStatus: GoalStatus,
  existingCompletedAt: Temporal.Instant | null,
  now: Temporal.Instant,
): Temporal.Instant | null | undefined {
  if (nextStatus === currentStatus) {
    return undefined;
  }
  if (nextStatus === 'ACHIEVED') {
    return existingCompletedAt ?? now;
  }
  if (currentStatus === 'ACHIEVED') {
    return null;
  }
  return undefined;
}
