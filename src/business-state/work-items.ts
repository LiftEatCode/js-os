import { db } from '../prisma/db.ts';
import type {
  CreateWorkItemInput,
  UpdateWorkItemInput,
  WorkItem,
  WorkItemListFilter,
  WorkItemStatus,
} from './types.ts';
import {
  createWorkItemWithOrm,
  getWorkItemByIdWithOrm,
  listWorkItemsWithOrm,
  updateWorkItemWithOrm,
} from './work-item-persistence.ts';

export async function getWorkItemById(id: string): Promise<WorkItem | null> {
  return getWorkItemByIdWithOrm(db.orm, id);
}

export async function listWorkItems(filter: WorkItemListFilter): Promise<WorkItem[]> {
  return listWorkItemsWithOrm(db.orm, filter);
}

export async function createWorkItem(input: CreateWorkItemInput): Promise<WorkItem> {
  return createWorkItemWithOrm(db.orm, input);
}

export async function updateWorkItem(id: string, input: UpdateWorkItemInput): Promise<WorkItem> {
  return updateWorkItemWithOrm(db.orm, id, input);
}

export async function updateWorkItemStatus(
  id: string,
  status: WorkItemStatus,
): Promise<WorkItem> {
  return updateWorkItem(id, { status });
}
