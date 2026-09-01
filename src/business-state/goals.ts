import { db } from '../prisma/db.ts';
import {
  createGoalWithOrm,
  getGoalByIdWithOrm,
  listGoalsWithOrm,
  updateGoalWithOrm,
} from './goal-persistence.ts';
import type { CreateGoalInput, Goal, GoalListFilter, UpdateGoalInput } from './types.ts';

export async function getGoalById(id: string): Promise<Goal | null> {
  return getGoalByIdWithOrm(db.orm, id);
}

export async function listGoals(filter: GoalListFilter): Promise<Goal[]> {
  return listGoalsWithOrm(db.orm, filter);
}

export async function listActiveGoals(organizationId: string): Promise<Goal[]> {
  return listGoals({ organizationId, status: 'ACTIVE' });
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  return createGoalWithOrm(db.orm, input);
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<Goal> {
  return updateGoalWithOrm(db.orm, id, input);
}

export async function updateGoalProgress(
  id: string,
  currentValue: Goal['currentValue'],
): Promise<Goal> {
  return updateGoal(id, { currentValue });
}
