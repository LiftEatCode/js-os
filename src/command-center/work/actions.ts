'use server';

import {
  createWorkItemCommand,
  updateWorkItemCommand,
} from '@/business-commands/work-item-commands';
import {
  BusinessStateNotFoundError,
  InvalidBusinessStateInputError,
  getJsSolutionsOrganization,
  getWorkItemById,
} from '@/business-state';
import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import { isCommandCenterWriteEnabled } from '../write-access';
import { isWorkUuid, parseWorkForm, type WorkFormState } from './parse';

export type { WorkFormState };

function revalidateWorkPaths(workItemId?: string) {
  revalidatePath('/app');
  revalidatePath('/app/activity');
  revalidatePath('/app/work');
  if (workItemId) {
    revalidatePath(`/app/work/${workItemId}`);
  }
}

function formError(error: unknown): WorkFormState {
  if (error instanceof InvalidBusinessStateInputError) {
    if (error.message.startsWith('title ')) {
      return { error: 'Title is required.', fieldErrors: { title: 'Title is required.' } };
    }
    if (error.message.includes('parent')) {
      return { error: error.message, fieldErrors: { parentId: error.message } };
    }
    return { error: error.message };
  }
  if (error instanceof BusinessStateNotFoundError) {
    return { error: 'Work item could not be found.' };
  }
  return { error: 'Work item could not be saved.' };
}

async function requireJsSolutionsWorkItem(workItemId: string) {
  if (!isWorkUuid(workItemId)) {
    throw new BusinessStateNotFoundError('WorkItem not found.');
  }
  const organization = await getJsSolutionsOrganization();
  const workItem = await getWorkItemById(workItemId);
  if (!workItem || workItem.organizationId !== organization.id) {
    throw new BusinessStateNotFoundError('WorkItem not found.');
  }
  return { organization, workItem };
}

export async function createWorkItemAction(
  _previous: WorkFormState,
  formData: FormData,
): Promise<WorkFormState> {
  if (!isCommandCenterWriteEnabled()) {
    return { error: 'Command Center writes are disabled.' };
  }

  const organization = await getJsSolutionsOrganization();
  const parsed = parseWorkForm(formData, organization.timezone);
  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    const workItem = await createWorkItemCommand({
      organizationId: organization.id,
      title: parsed.value.title,
      description: parsed.value.description,
      status: parsed.value.status,
      priority: parsed.value.priority,
      workType: parsed.value.workType,
      goalId: parsed.value.goalId,
      parentId: parsed.value.parentId,
      assignedAgentId: parsed.value.assignedAgentId,
      dueAt: parsed.value.dueAt,
    });
    revalidateWorkPaths(workItem.id);
    redirect(`/app/work/${workItem.id}`);
  } catch (error) {
    unstable_rethrow(error);
    return formError(error);
  }
}

export async function updateWorkItemAction(
  _previous: WorkFormState,
  formData: FormData,
): Promise<WorkFormState> {
  if (!isCommandCenterWriteEnabled()) {
    return { error: 'Command Center writes are disabled.' };
  }

  const workItemId = String(formData.get('workItemId') ?? '');
  try {
    const { organization, workItem } = await requireJsSolutionsWorkItem(workItemId);
    const parsed = parseWorkForm(formData, organization.timezone);
    if (!parsed.ok) {
      return parsed.state;
    }
    await updateWorkItemCommand({
      id: workItem.id,
      organizationId: organization.id,
      title: parsed.value.title,
      description: parsed.value.description,
      status: parsed.value.status,
      priority: parsed.value.priority,
      workType: parsed.value.workType,
      goalId: parsed.value.goalId,
      parentId: parsed.value.parentId,
      assignedAgentId: parsed.value.assignedAgentId,
      dueAt: parsed.value.dueAt,
    });
    revalidateWorkPaths(workItem.id);
    return {};
  } catch (error) {
    unstable_rethrow(error);
    return formError(error);
  }
}
