/// <reference types="temporal-polyfill/types/global" />
import { BusinessStateNotFoundError, InvalidBusinessStateInputError } from '../business-state/errors.ts';
import { omitUndefined } from '../business-state/validation.ts';
import type {
  AgentDefinition,
  CreateWorkItemInput,
  Goal,
  RecordBusinessEventInput,
  UpdateWorkItemInput,
  WorkItem,
  WorkItemStatus,
} from '../business-state/types.ts';
import { wouldCreateParentCycle } from '../business-state/work-item-hierarchy.ts';

export const WORK_EVENT_TYPES = {
  created: 'work.created',
  updated: 'work.updated',
  statusChanged: 'work.status_changed',
} as const;

export type WorkCommandActor = {
  sourceType: 'USER' | 'AGENT' | 'SYSTEM';
  sourceId?: string | null;
};

export type WorkCommandStore = {
  getWorkItemById(id: string): Promise<WorkItem | null>;
  listWorkItems(organizationId: string): Promise<WorkItem[]>;
  getGoalById(id: string): Promise<Goal | null>;
  getAgentDefinitionById(id: string): Promise<AgentDefinition | null>;
  create(input: CreateWorkItemInput, now: Temporal.Instant): Promise<WorkItem>;
  update(id: string, input: UpdateWorkItemInput, now: Temporal.Instant): Promise<WorkItem>;
  recordEvent(input: RecordBusinessEventInput): Promise<void>;
};

export type UpdateWorkItemCommandInput = {
  id: string;
  organizationId: string;
} & Omit<UpdateWorkItemInput, 'startedAt' | 'completedAt'>;

export type UpdateWorkItemStatusCommandInput = {
  id: string;
  organizationId: string;
  status: WorkItemStatus;
};

function requireJsSolutionsWorkItem(
  item: WorkItem | null,
  id: string,
  organizationId: string,
): WorkItem {
  if (!item || item.organizationId !== organizationId) {
    throw new BusinessStateNotFoundError(`WorkItem not found: ${id}`);
  }
  return item;
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

function eventInput(
  item: WorkItem,
  eventType: string,
  title: string,
  metadata: Record<string, string>,
  now: Temporal.Instant,
  actor: WorkCommandActor,
): RecordBusinessEventInput {
  return {
    organizationId: item.organizationId,
    eventType,
    sourceType: actor.sourceType,
    sourceId: actor.sourceId ?? null,
    title,
    occurredAt: now,
    metadata,
  };
}

function createdMetadata(item: WorkItem): Record<string, string> {
  const metadata: Record<string, string> = {
    workItemId: item.id,
    title: item.title,
    status: item.status,
    priority: item.priority,
    workType: item.workType,
  };
  if (item.goalId) {
    metadata.goalId = item.goalId;
  }
  if (item.parentId) {
    metadata.parentId = item.parentId;
  }
  return metadata;
}

function updatedMetadata(
  existing: WorkItem,
  updated: WorkItem,
  changed: string[],
): Record<string, string> {
  const metadata: Record<string, string> = {
    workItemId: updated.id,
    title: updated.title,
    status: updated.status,
    priority: updated.priority,
    workType: updated.workType,
  };
  if (changed.includes('status')) {
    metadata.previousStatus = existing.status;
    metadata.newStatus = updated.status;
  }
  if (changed.includes('goalId')) {
    metadata.goalId = updated.goalId ?? '';
  }
  if (changed.includes('parentId')) {
    metadata.parentId = updated.parentId ?? '';
  }
  return metadata;
}

function ownerFieldChanges(
  existing: WorkItem,
  patch: Omit<UpdateWorkItemInput, 'startedAt' | 'completedAt'>,
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
  if (patch.workType !== undefined && patch.workType !== existing.workType) {
    changed.push('workType');
  }
  if (patch.goalId !== undefined && !sameText(existing.goalId, patch.goalId)) {
    changed.push('goalId');
  }
  if (patch.parentId !== undefined && !sameText(existing.parentId, patch.parentId)) {
    changed.push('parentId');
  }
  if (
    patch.assignedAgentId !== undefined &&
    !sameText(existing.assignedAgentId, patch.assignedAgentId)
  ) {
    changed.push('assignedAgentId');
  }
  if (patch.dueAt !== undefined && !sameInstant(existing.dueAt, patch.dueAt)) {
    changed.push('dueAt');
  }
  if (patch.sourceType !== undefined && !sameText(existing.sourceType, patch.sourceType)) {
    changed.push('sourceType');
  }
  if (patch.sourceId !== undefined && !sameText(existing.sourceId, patch.sourceId)) {
    changed.push('sourceId');
  }
  return changed;
}

async function assertLinkedEntities(
  store: WorkCommandStore,
  organizationId: string,
  fields: { goalId?: string | null; parentId?: string | null; assignedAgentId?: string | null },
  currentWorkItemId?: string,
): Promise<void> {
  if (fields.goalId) {
    const goal = await store.getGoalById(fields.goalId);
    if (!goal || goal.organizationId !== organizationId) {
      throw new InvalidBusinessStateInputError('Goal could not be found.');
    }
  }

  if (fields.assignedAgentId) {
    const agent = await store.getAgentDefinitionById(fields.assignedAgentId);
    if (!agent || agent.organizationId !== organizationId) {
      throw new InvalidBusinessStateInputError('Assigned role could not be found.');
    }
  }

  if (fields.parentId) {
    if (currentWorkItemId && fields.parentId === currentWorkItemId) {
      throw new InvalidBusinessStateInputError('A work item cannot be its own parent.');
    }
    const parent = await store.getWorkItemById(fields.parentId);
    if (!parent || parent.organizationId !== organizationId) {
      throw new InvalidBusinessStateInputError('Parent work item could not be found.');
    }
    if (currentWorkItemId) {
      const siblings = await store.listWorkItems(organizationId);
      if (wouldCreateParentCycle(currentWorkItemId, fields.parentId, siblings)) {
        throw new InvalidBusinessStateInputError(
          'A work item cannot become its own ancestor.',
        );
      }
    }
  }
}

export async function createWorkItemWithStore(
  store: WorkCommandStore,
  input: CreateWorkItemInput,
  now: Temporal.Instant,
  actor: WorkCommandActor,
): Promise<WorkItem> {
  await assertLinkedEntities(store, input.organizationId, {
    goalId: input.goalId ?? null,
    parentId: input.parentId ?? null,
    assignedAgentId: input.assignedAgentId ?? null,
  });
  const created = await store.create(input, now);
  await store.recordEvent(
    eventInput(
      created,
      WORK_EVENT_TYPES.created,
      'Work item created',
      createdMetadata(created),
      now,
      actor,
    ),
  );
  return created;
}

export async function updateWorkItemWithStore(
  store: WorkCommandStore,
  input: UpdateWorkItemCommandInput,
  now: Temporal.Instant,
  actor: WorkCommandActor,
): Promise<WorkItem> {
  const existing = requireJsSolutionsWorkItem(
    await store.getWorkItemById(input.id),
    input.id,
    input.organizationId,
  );

  const patch = omitUndefined({
    title: input.title,
    description: input.description,
    status: input.status,
    priority: input.priority,
    workType: input.workType,
    goalId: input.goalId,
    parentId: input.parentId,
    assignedAgentId: input.assignedAgentId,
    dueAt: input.dueAt,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
  }) as Omit<UpdateWorkItemInput, 'startedAt' | 'completedAt'>;
  const changed = ownerFieldChanges(existing, patch);
  if (changed.length === 0) {
    throw new InvalidBusinessStateInputError('Work item was not changed.');
  }

  await assertLinkedEntities(
    store,
    input.organizationId,
    {
      goalId: patch.goalId,
      parentId: patch.parentId,
      assignedAgentId: patch.assignedAgentId,
    },
    existing.id,
  );

  const updated = await store.update(existing.id, patch, now);
  const statusChanged = changed.includes('status');
  const onlyStatusChanged = statusChanged && changed.length === 1;

  await store.recordEvent(
    eventInput(
      updated,
      onlyStatusChanged ? WORK_EVENT_TYPES.statusChanged : WORK_EVENT_TYPES.updated,
      onlyStatusChanged ? 'Work item status changed' : 'Work item updated',
      onlyStatusChanged
        ? {
            workItemId: updated.id,
            previousStatus: existing.status,
            newStatus: updated.status,
          }
        : updatedMetadata(existing, updated, changed),
      now,
      actor,
    ),
  );
  return updated;
}

export async function updateWorkItemStatusWithStore(
  store: WorkCommandStore,
  input: UpdateWorkItemStatusCommandInput,
  now: Temporal.Instant,
  actor: WorkCommandActor,
): Promise<WorkItem> {
  const existing = requireJsSolutionsWorkItem(
    await store.getWorkItemById(input.id),
    input.id,
    input.organizationId,
  );

  if (existing.status === input.status) {
    throw new InvalidBusinessStateInputError('Work item status was not changed.');
  }

  const updated = await store.update(existing.id, { status: input.status }, now);
  await store.recordEvent(
    eventInput(
      updated,
      WORK_EVENT_TYPES.statusChanged,
      'Work item status changed',
      {
        workItemId: updated.id,
        previousStatus: existing.status,
        newStatus: updated.status,
      },
      now,
      actor,
    ),
  );
  return updated;
}
