/// <reference types="temporal-polyfill/types/global" />
import type { WorkItemStatus } from './types.ts';

export type WorkItemLifecyclePatch = {
  startedAt?: Temporal.Instant | null;
  completedAt?: Temporal.Instant | null;
};

/**
 * startedAt / completedAt are owned by the WorkItem service, not the UI.
 *
 * - First entry into IN_PROGRESS sets startedAt if empty. Later changes do not reset it.
 * - Entering COMPLETED sets completedAt if empty.
 * - Leaving COMPLETED clears completedAt.
 * - CANCELLED is not completion and does not set completedAt.
 */
export function nextWorkItemLifecycle(
  currentStatus: WorkItemStatus,
  nextStatus: WorkItemStatus,
  existingStartedAt: Temporal.Instant | null,
  existingCompletedAt: Temporal.Instant | null,
  now: Temporal.Instant,
): WorkItemLifecyclePatch {
  if (nextStatus === currentStatus) {
    return {};
  }

  const patch: WorkItemLifecyclePatch = {};

  if (nextStatus === 'IN_PROGRESS' && existingStartedAt === null) {
    patch.startedAt = now;
  }

  if (nextStatus === 'COMPLETED') {
    patch.completedAt = existingCompletedAt ?? now;
  } else if (currentStatus === 'COMPLETED') {
    patch.completedAt = null;
  }

  return patch;
}

export function initialWorkItemLifecycle(
  status: WorkItemStatus,
  now: Temporal.Instant,
): { startedAt: Temporal.Instant | null; completedAt: Temporal.Instant | null } {
  return {
    startedAt: status === 'IN_PROGRESS' ? now : null,
    completedAt: status === 'COMPLETED' ? now : null,
  };
}
