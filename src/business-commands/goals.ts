/// <reference types="temporal-polyfill/types/global" />
import { BusinessStateNotFoundError, InvalidBusinessStateInputError } from '../business-state/errors.ts';
import { omitUndefined } from '../business-state/validation.ts';
import type {
  CreateGoalInput,
  Goal,
  RecordBusinessEventInput,
  UpdateGoalInput,
} from '../business-state/types.ts';

export const GOAL_EVENT_TYPES = {
  created: 'goal.created',
  updated: 'goal.updated',
  progressUpdated: 'goal.progress_updated',
  statusChanged: 'goal.status_changed',
} as const;

export type GoalCommandActor = {
  sourceType: 'USER' | 'AGENT' | 'SYSTEM';
  sourceId?: string | null;
};

export type GoalCommandStore = {
  getGoalById(id: string): Promise<Goal | null>;
  create(input: CreateGoalInput, now: Temporal.Instant): Promise<Goal>;
  update(id: string, input: UpdateGoalInput, now: Temporal.Instant): Promise<Goal>;
  recordEvent(input: RecordBusinessEventInput): Promise<void>;
};

export type UpdateGoalCommandInput = {
  id: string;
  organizationId: string;
} & Omit<UpdateGoalInput, 'completedAt'>;

export type UpdateGoalProgressCommandInput = {
  id: string;
  organizationId: string;
  currentValue: Goal['currentValue'];
};

function requireJsSolutionsGoal(
  goal: Goal | null,
  id: string,
  organizationId: string,
): Goal {
  if (!goal || goal.organizationId !== organizationId) {
    throw new BusinessStateNotFoundError(`Goal not found: ${id}`);
  }
  return goal;
}

function sameText(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a ?? null) === (b ?? null);
}

function sameInstant(
  a: Temporal.Instant | null | undefined,
  b: Temporal.Instant | null | undefined,
): boolean {
  if (a == null && b == null) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  return Temporal.Instant.compare(a, b) === 0;
}

function sameDecimal(a: unknown, b: unknown): boolean {
  if (a == null && b == null) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  return String(a) === String(b);
}

function decimalEventValue(value: unknown): string {
  return value == null ? '' : String(value);
}

function eventInput(
  goal: Goal,
  eventType: string,
  title: string,
  metadata: Record<string, string>,
  now: Temporal.Instant,
  actor: GoalCommandActor,
): RecordBusinessEventInput {
  return {
    organizationId: goal.organizationId,
    eventType,
    sourceType: actor.sourceType,
    sourceId: actor.sourceId ?? null,
    title,
    occurredAt: now,
    metadata,
  };
}

function ownerFieldChanges(
  existing: Goal,
  patch: Omit<UpdateGoalInput, 'completedAt'>,
): string[] {
  const changed: string[] = [];
  if (patch.title !== undefined && patch.title !== existing.title) {
    changed.push('title');
  }
  if (patch.description !== undefined && !sameText(existing.description, patch.description)) {
    changed.push('description');
  }
  if (patch.status !== undefined && patch.status !== existing.status) {
    changed.push('status');
  }
  if (patch.priority !== undefined && patch.priority !== existing.priority) {
    changed.push('priority');
  }
  if (patch.timeHorizon !== undefined && patch.timeHorizon !== existing.timeHorizon) {
    changed.push('timeHorizon');
  }
  if (patch.targetDate !== undefined && !sameInstant(existing.targetDate, patch.targetDate)) {
    changed.push('targetDate');
  }
  if (patch.metricName !== undefined && !sameText(existing.metricName, patch.metricName)) {
    changed.push('metricName');
  }
  if (patch.metricUnit !== undefined && !sameText(existing.metricUnit, patch.metricUnit)) {
    changed.push('metricUnit');
  }
  if (patch.targetValue !== undefined && !sameDecimal(existing.targetValue, patch.targetValue)) {
    changed.push('targetValue');
  }
  if (patch.currentValue !== undefined && !sameDecimal(existing.currentValue, patch.currentValue)) {
    changed.push('currentValue');
  }
  return changed;
}

function updatedMetadata(existing: Goal, updated: Goal, statusChanged: boolean): Record<string, string> {
  const metadata: Record<string, string> = {
    goalId: updated.id,
    title: updated.title,
    status: updated.status,
    priority: updated.priority,
  };
  if (statusChanged) {
    metadata.previousStatus = existing.status;
    metadata.newStatus = updated.status;
  }
  return metadata;
}

export async function createGoalWithStore(
  store: GoalCommandStore,
  input: CreateGoalInput,
  now: Temporal.Instant,
  actor: GoalCommandActor,
): Promise<Goal> {
  const created = await store.create(input, now);
  await store.recordEvent(
    eventInput(
      created,
      GOAL_EVENT_TYPES.created,
      'Goal created',
      {
        goalId: created.id,
        title: created.title,
        status: created.status,
        priority: created.priority,
      },
      now,
      actor,
    ),
  );
  return created;
}

export async function updateGoalWithStore(
  store: GoalCommandStore,
  input: UpdateGoalCommandInput,
  now: Temporal.Instant,
  actor: GoalCommandActor,
): Promise<Goal> {
  const existing = requireJsSolutionsGoal(
    await store.getGoalById(input.id),
    input.id,
    input.organizationId,
  );

  const patch = omitUndefined({
    title: input.title,
    description: input.description,
    status: input.status,
    priority: input.priority,
    timeHorizon: input.timeHorizon,
    targetDate: input.targetDate,
    metricName: input.metricName,
    metricUnit: input.metricUnit,
    targetValue: input.targetValue,
    currentValue: input.currentValue,
  }) as Omit<UpdateGoalInput, 'completedAt'>;
  const changed = ownerFieldChanges(existing, patch);
  if (changed.length === 0) {
    throw new InvalidBusinessStateInputError('Goal was not changed.');
  }

  const updated = await store.update(existing.id, patch, now);
  const statusChanged = changed.includes('status');
  const onlyStatusChanged = statusChanged && changed.length === 1;

  await store.recordEvent(
    eventInput(
      updated,
      onlyStatusChanged ? GOAL_EVENT_TYPES.statusChanged : GOAL_EVENT_TYPES.updated,
      onlyStatusChanged ? 'Goal status changed' : 'Goal updated',
      onlyStatusChanged
        ? {
            goalId: updated.id,
            previousStatus: existing.status,
            newStatus: updated.status,
          }
        : updatedMetadata(existing, updated, statusChanged),
      now,
      actor,
    ),
  );
  return updated;
}

export async function updateGoalProgressWithStore(
  store: GoalCommandStore,
  input: UpdateGoalProgressCommandInput,
  now: Temporal.Instant,
  actor: GoalCommandActor,
): Promise<Goal> {
  const existing = requireJsSolutionsGoal(
    await store.getGoalById(input.id),
    input.id,
    input.organizationId,
  );

  if (sameDecimal(existing.currentValue, input.currentValue)) {
    throw new InvalidBusinessStateInputError('Goal progress was not changed.');
  }

  const updated = await store.update(existing.id, { currentValue: input.currentValue }, now);
  await store.recordEvent(
    eventInput(
      updated,
      GOAL_EVENT_TYPES.progressUpdated,
      'Goal progress updated',
      {
        goalId: updated.id,
        metricName: updated.metricName ?? '',
        previousValue: decimalEventValue(existing.currentValue),
        newValue: decimalEventValue(updated.currentValue),
      },
      now,
      actor,
    ),
  );
  return updated;
}
