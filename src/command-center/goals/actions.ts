'use server';

import {
  BusinessStateNotFoundError,
  InvalidBusinessStateInputError,
  createGoal,
  getGoalById,
  getJsSolutionsOrganization,
  updateGoal,
  updateGoalProgress,
} from '@/business-state';
import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import { isCommandCenterWriteEnabled } from '../write-access';
import { isGoalUuid, parseGoalForm, parseProgressForm, type GoalFormState } from './parse';

export type { GoalFormState };

function revalidateGoalPaths(goalId?: string) {
  revalidatePath('/app');
  revalidatePath('/app/goals');
  if (goalId) {
    revalidatePath(`/app/goals/${goalId}`);
  }
}

function formError(error: unknown): GoalFormState {
  if (error instanceof InvalidBusinessStateInputError) {
    if (error.message.startsWith('title ')) {
      return { error: 'Title is required.', fieldErrors: { title: 'Title is required.' } };
    }
    return { error: error.message };
  }
  if (error instanceof BusinessStateNotFoundError) {
    return { error: 'Goal could not be found.' };
  }
  return { error: 'Goal could not be saved.' };
}

async function requireJsSolutionsGoal(goalId: string) {
  if (!isGoalUuid(goalId)) {
    throw new BusinessStateNotFoundError('Goal not found.');
  }
  const organization = await getJsSolutionsOrganization();
  const goal = await getGoalById(goalId);
  if (!goal || goal.organizationId !== organization.id) {
    throw new BusinessStateNotFoundError('Goal not found.');
  }
  return { organization, goal };
}

export async function createGoalAction(
  _previous: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  if (!isCommandCenterWriteEnabled()) {
    return { error: 'Command Center writes are disabled.' };
  }

  const organization = await getJsSolutionsOrganization();
  const parsed = parseGoalForm(formData, organization.timezone);
  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    const goal = await createGoal({
      organizationId: organization.id,
      ...parsed.value,
    });
    revalidateGoalPaths(goal.id);
    redirect(`/app/goals/${goal.id}`);
  } catch (error) {
    unstable_rethrow(error);
    return formError(error);
  }
}

export async function updateGoalAction(
  _previous: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  if (!isCommandCenterWriteEnabled()) {
    return { error: 'Command Center writes are disabled.' };
  }

  const goalId = String(formData.get('goalId') ?? '');
  try {
    const { organization, goal } = await requireJsSolutionsGoal(goalId);
    const parsed = parseGoalForm(formData, organization.timezone);
    if (!parsed.ok) {
      return parsed.state;
    }
    await updateGoal(goal.id, {
      title: parsed.value.title,
      description: parsed.value.description,
      status: parsed.value.status,
      priority: parsed.value.priority,
      timeHorizon: parsed.value.timeHorizon,
      targetDate: parsed.value.targetDate,
      metricName: parsed.value.metricName,
      metricUnit: parsed.value.metricUnit,
      targetValue: parsed.value.targetValue,
      currentValue: parsed.value.currentValue,
    });
    revalidateGoalPaths(goal.id);
    return {};
  } catch (error) {
    unstable_rethrow(error);
    return formError(error);
  }
}

export async function updateGoalProgressAction(
  _previous: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  if (!isCommandCenterWriteEnabled()) {
    return { error: 'Command Center writes are disabled.' };
  }

  const goalId = String(formData.get('goalId') ?? '');
  const parsed = parseProgressForm(formData);
  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    const { goal } = await requireJsSolutionsGoal(goalId);
    await updateGoalProgress(goal.id, parsed.currentValue);
    revalidateGoalPaths(goal.id);
    return {};
  } catch (error) {
    unstable_rethrow(error);
    return formError(error);
  }
}
