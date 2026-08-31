/// <reference types="temporal-polyfill/types/global" />
import { db } from '../prisma/db.ts';
import { BusinessStateNotFoundError } from './errors.ts';
import type {
  CreateWorkItemInput,
  UpdateWorkItemInput,
  WorkItem,
  WorkItemListFilter,
  WorkItemStatus,
} from './types.ts';
import { requireNonEmptyString, omitUndefined } from './validation.ts';
import { initialWorkItemLifecycle, nextWorkItemLifecycle } from './work-item-lifecycle.ts';

export async function getWorkItemById(id: string): Promise<WorkItem | null> {
  return db.orm.public.WorkItem.where({ id }).first();
}

export async function listWorkItems(filter: WorkItemListFilter): Promise<WorkItem[]> {
  const where: {
    organizationId: string;
    status?: WorkItemListFilter['status'];
    priority?: WorkItemListFilter['priority'];
    workType?: WorkItemListFilter['workType'];
    goalId?: string | null;
    assignedAgentId?: string | null;
    parentId?: string | null;
  } = { organizationId: filter.organizationId };

  if (filter.status) {
    where.status = filter.status;
  }
  if (filter.priority) {
    where.priority = filter.priority;
  }
  if (filter.workType) {
    where.workType = filter.workType;
  }
  if (filter.goalId !== undefined) {
    where.goalId = filter.goalId;
  }
  if (filter.assignedAgentId !== undefined) {
    where.assignedAgentId = filter.assignedAgentId;
  }
  if (filter.parentId !== undefined) {
    where.parentId = filter.parentId;
  }

  return db.orm.public.WorkItem.where(where)
    .orderBy((item) => item.createdAt.desc())
    .all();
}

export async function createWorkItem(input: CreateWorkItemInput): Promise<WorkItem> {
  const title = requireNonEmptyString(input.title, 'title');
  const status = input.status ?? 'BACKLOG';
  const lifecycle = initialWorkItemLifecycle(status, Temporal.Now.instant());

  return db.orm.public.WorkItem.create({
    organizationId: input.organizationId,
    title,
    description: input.description ?? null,
    status,
    priority: input.priority,
    workType: input.workType,
    goalId: input.goalId ?? null,
    parentId: input.parentId ?? null,
    agentRunId: input.agentRunId ?? null,
    sourceType: input.sourceType ?? null,
    sourceId: input.sourceId ?? null,
    assignedAgentId: input.assignedAgentId ?? null,
    dueAt: input.dueAt ?? null,
    startedAt: lifecycle.startedAt,
    completedAt: lifecycle.completedAt,
  });
}

export async function updateWorkItem(id: string, input: UpdateWorkItemInput): Promise<WorkItem> {
  const existing = await getWorkItemById(id);
  if (!existing) {
    throw new BusinessStateNotFoundError(`WorkItem not found: ${id}`);
  }

  const patch: UpdateWorkItemInput = { ...input };
  if (input.title !== undefined) {
    patch.title = requireNonEmptyString(input.title, 'title');
  }

  if (input.status !== undefined) {
    const lifecycle = nextWorkItemLifecycle(
      existing.status,
      input.status,
      existing.startedAt,
      existing.completedAt,
      Temporal.Now.instant(),
    );
    if (lifecycle.startedAt !== undefined) {
      patch.startedAt = lifecycle.startedAt;
    }
    if (lifecycle.completedAt !== undefined) {
      patch.completedAt = lifecycle.completedAt;
    }
  }

  await db.orm.public.WorkItem.where({ id }).update(
    omitUndefined(patch as Record<string, unknown>),
  );
  const updated = await getWorkItemById(id);
  if (!updated) {
    throw new BusinessStateNotFoundError(`WorkItem not found after update: ${id}`);
  }
  return updated;
}

export async function updateWorkItemStatus(
  id: string,
  status: WorkItemStatus,
): Promise<WorkItem> {
  return updateWorkItem(id, { status });
}
