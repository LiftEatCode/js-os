'use server';

import {
  BusinessStateNotFoundError,
  InvalidBusinessStateInputError,
  createWorkItem,
  getAgentDefinitionById,
  getGoalById,
  getJsSolutionsOrganization,
  getWorkItemById,
  listWorkItems,
  updateWorkItem,
  wouldCreateParentCycle,
} from '@/business-state';
import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import { isCommandCenterWriteEnabled } from '../write-access';
import { isWorkUuid, parseWorkForm, type WorkFormState } from './parse';

export type { WorkFormState };

function revalidateWorkPaths(workItemId?: string) {
  revalidatePath('/app');
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

async function assertLinkedEntities(
  organizationId: string,
  fields: { goalId: string | null; parentId: string | null; assignedAgentId: string | null },
  currentWorkItemId?: string,
) {
  if (fields.goalId) {
    const goal = await getGoalById(fields.goalId);
    if (!goal || goal.organizationId !== organizationId) {
      throw new InvalidBusinessStateInputError('Goal could not be found.');
    }
  }

  if (fields.assignedAgentId) {
    const agent = await getAgentDefinitionById(fields.assignedAgentId);
    if (!agent || agent.organizationId !== organizationId) {
      throw new InvalidBusinessStateInputError('Assigned role could not be found.');
    }
  }

  if (fields.parentId) {
    if (currentWorkItemId && fields.parentId === currentWorkItemId) {
      throw new InvalidBusinessStateInputError('A work item cannot be its own parent.');
    }
    const parent = await getWorkItemById(fields.parentId);
    if (!parent || parent.organizationId !== organizationId) {
      throw new InvalidBusinessStateInputError('Parent work item could not be found.');
    }
    if (currentWorkItemId) {
      const siblings = await listWorkItems({ organizationId });
      if (wouldCreateParentCycle(currentWorkItemId, fields.parentId, siblings)) {
        throw new InvalidBusinessStateInputError(
          'A work item cannot become its own ancestor.',
        );
      }
    }
  }
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
    await assertLinkedEntities(organization.id, parsed.value);
    const workItem = await createWorkItem({
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
    await assertLinkedEntities(organization.id, parsed.value, workItem.id);
    await updateWorkItem(workItem.id, {
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
