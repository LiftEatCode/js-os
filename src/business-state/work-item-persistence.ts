/// <reference types="temporal-polyfill/types/global" />
import { BusinessStateNotFoundError } from './errors.ts';
import type { PersistenceOrm } from './persistence.ts';
import type {
  CreateWorkItemInput,
  UpdateWorkItemInput,
  WorkItem,
  WorkItemListFilter,
} from './types.ts';
import { omitUndefined, requireNonEmptyString } from './validation.ts';
import { initialWorkItemLifecycle, nextWorkItemLifecycle } from './work-item-lifecycle.ts';

export async function getWorkItemByIdWithOrm(
  orm: PersistenceOrm,
  id: string,
): Promise<WorkItem | null> {
  return orm.public.WorkItem.where({ id }).first();
}

export async function listWorkItemsWithOrm(
  orm: PersistenceOrm,
  filter: WorkItemListFilter,
): Promise<WorkItem[]> {
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

  return orm.public.WorkItem.where(where)
    .orderBy((item) => item.createdAt.desc())
    .all();
}

export async function createWorkItemWithOrm(
  orm: PersistenceOrm,
  input: CreateWorkItemInput,
  now: Temporal.Instant = Temporal.Now.instant(),
): Promise<WorkItem> {
  const title = requireNonEmptyString(input.title, 'title');
  const status = input.status ?? 'BACKLOG';
  const lifecycle = initialWorkItemLifecycle(status, now);

  return orm.public.WorkItem.create({
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

export async function updateWorkItemWithOrm(
  orm: PersistenceOrm,
  id: string,
  input: UpdateWorkItemInput,
  now: Temporal.Instant = Temporal.Now.instant(),
): Promise<WorkItem> {
  const existing = await getWorkItemByIdWithOrm(orm, id);
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
      now,
    );
    if (lifecycle.startedAt !== undefined) {
      patch.startedAt = lifecycle.startedAt;
    }
    if (lifecycle.completedAt !== undefined) {
      patch.completedAt = lifecycle.completedAt;
    }
  }

  await orm.public.WorkItem.where({ id }).update(
    omitUndefined(patch as Record<string, unknown>),
  );
  const updated = await getWorkItemByIdWithOrm(orm, id);
  if (!updated) {
    throw new BusinessStateNotFoundError(`WorkItem not found after update: ${id}`);
  }
  return updated;
}
