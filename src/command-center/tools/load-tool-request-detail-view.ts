/// <reference types="temporal-polyfill/types/global" />
import {
  loadToolRequestDetailAggregateWithStore,
  prismaToolRequestDetailReadStore,
  type ToolRequestDetailReadStore,
} from './load-tool-request-detail.ts';
import {
  loadToolRequestEventsWithStore,
  prismaToolRequestEventReadStore,
  type ToolRequestEventReadStore,
} from './load-tool-request-events.ts';
import { mapToolRequestDetail } from './map-tool-request-detail.ts';
import { mapToolExecutions } from './map-tool-executions.ts';
import {
  prismaToolProducedRecordReadStore,
  resolveToolProducedRecordsWithStore,
  type ToolProducedRecordReadStore,
} from './resolve-tool-produced-records.ts';
import type { ToolRequestDetailViewModel } from './tool-request-detail-view-model.ts';

export type ToolRequestDetailViewStores = Readonly<{
  detail: ToolRequestDetailReadStore;
  producedRecords: ToolProducedRecordReadStore;
  events: ToolRequestEventReadStore;
}>;

const prismaToolRequestDetailViewStores: ToolRequestDetailViewStores = {
  detail: prismaToolRequestDetailReadStore,
  producedRecords: prismaToolProducedRecordReadStore,
  events: prismaToolRequestEventReadStore,
};

/**
 * Organization-scoped ToolRequest forensic view. Returns null when the request
 * is missing or not visible to the given organization.
 */
export async function loadToolRequestDetailViewWithStores(
  stores: ToolRequestDetailViewStores,
  organizationId: string,
  toolRequestId: string,
  now: Temporal.Instant = Temporal.Now.instant(),
): Promise<ToolRequestDetailViewModel | null> {
  const aggregate = await loadToolRequestDetailAggregateWithStore(
    stores.detail,
    organizationId,
    toolRequestId,
  );
  if (!aggregate) {
    return null;
  }

  const { executions } = mapToolExecutions(aggregate.executions);
  const succeeded = executions.findLast((execution) => execution.status === 'SUCCEEDED');
  const producedRecords = succeeded
    ? await resolveToolProducedRecordsWithStore(stores.producedRecords, {
        organizationId,
        toolSlug: aggregate.request.toolSlug,
        toolVersion: aggregate.request.toolVersion,
        output: succeeded.output,
      })
    : [];

  const events = await loadToolRequestEventsWithStore(stores.events, {
    organizationId,
    toolRequestId: aggregate.request.id,
    toolExecutionIds: executions.map((execution) => execution.id),
    approvalId: aggregate.approval?.id ?? aggregate.request.approvalId,
    producedWorkItemIds: producedRecords
      .filter((record) => record.type === 'WORK_ITEM')
      .map((record) => record.id),
  });

  return mapToolRequestDetail({
    aggregate,
    producedRecords,
    events,
    now,
  });
}

export function loadToolRequestDetailView(
  organizationId: string,
  toolRequestId: string,
): Promise<ToolRequestDetailViewModel | null> {
  return loadToolRequestDetailViewWithStores(
    prismaToolRequestDetailViewStores,
    organizationId,
    toolRequestId,
  );
}
