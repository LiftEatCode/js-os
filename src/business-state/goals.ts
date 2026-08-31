import { db } from '../prisma/db.ts';
import { BusinessStateNotFoundError } from './errors.ts';
import type { CreateGoalInput, Goal, GoalListFilter, UpdateGoalInput } from './types.ts';
import { requireNonEmptyString, omitUndefined } from './validation.ts';

export async function getGoalById(id: string): Promise<Goal | null> {
  return db.orm.public.Goal.where({ id }).first();
}

export async function listGoals(filter: GoalListFilter): Promise<Goal[]> {
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

  return db.orm.public.Goal.where(where)
    .orderBy((goal) => goal.createdAt.desc())
    .all();
}

export async function listActiveGoals(organizationId: string): Promise<Goal[]> {
  return listGoals({ organizationId, status: 'ACTIVE' });
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const title = requireNonEmptyString(input.title, 'title');

  return db.orm.public.Goal.create({
    organizationId: input.organizationId,
    title,
    description: input.description ?? null,
    status: input.status ?? 'DRAFT',
    priority: input.priority,
    timeHorizon: input.timeHorizon,
    targetDate: input.targetDate ?? null,
    metricName: input.metricName ?? null,
    metricUnit: input.metricUnit ?? null,
    targetValue: input.targetValue ?? null,
    currentValue: input.currentValue ?? null,
  });
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<Goal> {
  const existing = await getGoalById(id);
  if (!existing) {
    throw new BusinessStateNotFoundError(`Goal not found: ${id}`);
  }

  const patch: UpdateGoalInput = { ...input };
  if (input.title !== undefined) {
    patch.title = requireNonEmptyString(input.title, 'title');
  }

  await db.orm.public.Goal.where({ id }).update(omitUndefined(patch as Record<string, unknown>));
  const updated = await getGoalById(id);
  if (!updated) {
    throw new BusinessStateNotFoundError(`Goal not found after update: ${id}`);
  }
  return updated;
}

export async function updateGoalProgress(
  id: string,
  currentValue: Goal['currentValue'],
): Promise<Goal> {
  return updateGoal(id, { currentValue });
}
