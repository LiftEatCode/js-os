/// <reference types="temporal-polyfill/types/global" />
import { BusinessStateNotFoundError } from './errors.ts';
import { nextGoalCompletedAt } from './goal-lifecycle.ts';
import type { PersistenceOrm } from './persistence.ts';
import type { CreateGoalInput, Goal, GoalListFilter, UpdateGoalInput } from './types.ts';
import { omitUndefined, requireNonEmptyString } from './validation.ts';

export async function getGoalByIdWithOrm(
  orm: PersistenceOrm,
  id: string,
): Promise<Goal | null> {
  return orm.public.Goal.where({ id }).first();
}

export async function listGoalsWithOrm(
  orm: PersistenceOrm,
  filter: GoalListFilter,
): Promise<Goal[]> {
  const where: {
    organizationId: string;
    status?: GoalListFilter['status'];
    priority?: GoalListFilter['priority'];
    timeHorizon?: GoalListFilter['timeHorizon'];
  } = { organizationId: filter.organizationId };

  if (filter.status) {
    where.status = filter.status;
  }
  if (filter.priority) {
    where.priority = filter.priority;
  }
  if (filter.timeHorizon) {
    where.timeHorizon = filter.timeHorizon;
  }

  return orm.public.Goal.where(where)
    .orderBy((goal) => goal.createdAt.desc())
    .all();
}

export async function createGoalWithOrm(
  orm: PersistenceOrm,
  input: CreateGoalInput,
  now: Temporal.Instant = Temporal.Now.instant(),
): Promise<Goal> {
  const title = requireNonEmptyString(input.title, 'title');
  const status = input.status ?? 'DRAFT';

  return orm.public.Goal.create({
    organizationId: input.organizationId,
    title,
    description: input.description ?? null,
    status,
    priority: input.priority,
    timeHorizon: input.timeHorizon,
    targetDate: input.targetDate ?? null,
    metricName: input.metricName ?? null,
    metricUnit: input.metricUnit ?? null,
    targetValue: input.targetValue ?? null,
    currentValue: input.currentValue ?? null,
    completedAt: status === 'ACHIEVED' ? now : null,
  });
}

export async function updateGoalWithOrm(
  orm: PersistenceOrm,
  id: string,
  input: UpdateGoalInput,
  now: Temporal.Instant = Temporal.Now.instant(),
): Promise<Goal> {
  const existing = await getGoalByIdWithOrm(orm, id);
  if (!existing) {
    throw new BusinessStateNotFoundError(`Goal not found: ${id}`);
  }

  const patch: UpdateGoalInput = { ...input };
  if (input.title !== undefined) {
    patch.title = requireNonEmptyString(input.title, 'title');
  }

  if (input.status !== undefined) {
    const completedAt = nextGoalCompletedAt(
      existing.status,
      input.status,
      existing.completedAt,
      now,
    );
    if (completedAt !== undefined) {
      patch.completedAt = completedAt;
    }
  }

  await orm.public.Goal.where({ id }).update(omitUndefined(patch as Record<string, unknown>));
  const updated = await getGoalByIdWithOrm(orm, id);
  if (!updated) {
    throw new BusinessStateNotFoundError(`Goal not found after update: ${id}`);
  }
  return updated;
}
