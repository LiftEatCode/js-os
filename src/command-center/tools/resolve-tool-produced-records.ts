import type { WorkItem } from '../../business-state/types.ts';
import { db } from '../../prisma/db.ts';
import type { ProducedRecordViewModel } from './tool-request-detail-view-model.ts';

export type ToolProducedRecordResolutionInput = Readonly<{
  organizationId: string;
  toolSlug: string;
  toolVersion: number;
  output: unknown | null;
}>;

export type ToolProducedRecordReadStore = Readonly<{
  getWorkItem(organizationId: string, workItemId: string): Promise<WorkItem | null>;
}>;

export const prismaToolProducedRecordReadStore: ToolProducedRecordReadStore = {
  getWorkItem(organizationId, workItemId) {
    return db.orm.public.WorkItem.where({ id: workItemId, organizationId }).first();
  },
};

/**
 * Resolves business records affected by a successful tool execution using an
 * explicit slug/version contract. Never scan arbitrary JSON for IDs: every
 * supported tool/version must opt in here with a known output shape.
 */
export async function resolveToolProducedRecordsWithStore(
  store: ToolProducedRecordReadStore,
  input: ToolProducedRecordResolutionInput,
): Promise<readonly ProducedRecordViewModel[]> {
  const workItemId = workItemIdForKnownTool(input.toolSlug, input.toolVersion, input.output);
  if (!workItemId) return [];

  const workItem = await store.getWorkItem(input.organizationId, workItemId);
  if (!workItem || workItem.organizationId !== input.organizationId) return [];

  return [toProducedWorkItem(workItem)];
}

export function resolveToolProducedRecords(
  input: ToolProducedRecordResolutionInput,
): Promise<readonly ProducedRecordViewModel[]> {
  return resolveToolProducedRecordsWithStore(prismaToolProducedRecordReadStore, input);
}

function workItemIdForKnownTool(
  toolSlug: string,
  toolVersion: number,
  output: unknown | null,
): string | null {
  if (toolVersion !== 1) return null;

  switch (toolSlug) {
    case 'internal.create_work_item':
    case 'internal.update_work_status':
      return readWorkItemId(output);
    default:
      return null;
  }
}

function readWorkItemId(output: unknown | null): string | null {
  if (!output || typeof output !== 'object' || Array.isArray(output)) return null;

  const workItemId = (output as Record<string, unknown>).workItemId;
  return typeof workItemId === 'string' && workItemId.length > 0 ? workItemId : null;
}

function toProducedWorkItem(workItem: WorkItem): ProducedRecordViewModel {
  return {
    type: 'WORK_ITEM',
    id: workItem.id,
    label: workItem.title,
    href: `/command/work/${workItem.id}`,
  };
}
