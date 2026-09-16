import type { BusinessEvent } from '../../business-state/types.ts';
import { db } from '../../prisma/db.ts';

const TOOL_EVENT_TYPES = new Set([
  'tool.denied',
  'tool.waiting_approval',
  'tool.ready',
  'tool.execution_queued',
  'tool.execution_started',
  'tool.executed',
  'tool.execution_failed',
  'tool.cancelled',
]);

const WORK_MUTATION_EVENT_TYPES = new Set(['work.created', 'work.status_changed']);

export type ToolRequestEventCorrelationInput = Readonly<{
  organizationId: string;
  toolRequestId: string;
  toolExecutionIds: readonly string[];
  approvalId: string | null;
  producedWorkItemIds: readonly string[];
}>;

export type ToolRequestEventReadStore = Readonly<{
  listOrganizationEvents(organizationId: string): Promise<BusinessEvent[]>;
}>;

export const prismaToolRequestEventReadStore: ToolRequestEventReadStore = {
  listOrganizationEvents(organizationId) {
    // BusinessEvent currently has no dedicated tool-request/execution foreign key
    // or indexed metadata column. Keep the database predicate organization-scoped
    // and perform exact metadata correlation in memory until Phase 3.8 hardening.
    return db.orm.public.BusinessEvent.where({ organizationId }).all();
  },
};

/**
 * Correlates the audit events that belong to one ToolRequest forensic story.
 * Tool lifecycle events require an exact request/execution/approval identifier.
 * Work mutation events are included only for explicitly resolved produced
 * WorkItems, never merely because a WorkItem was contextual to the request.
 */
export async function loadToolRequestEventsWithStore(
  store: ToolRequestEventReadStore,
  input: ToolRequestEventCorrelationInput,
): Promise<readonly BusinessEvent[]> {
  const events = await store.listOrganizationEvents(input.organizationId);
  const executionIds = new Set(input.toolExecutionIds);
  const producedWorkItemIds = new Set(input.producedWorkItemIds);

  return events
    .filter((event) => event.organizationId === input.organizationId)
    .filter((event) =>
      correlatesEvent(event, input.toolRequestId, executionIds, input.approvalId, producedWorkItemIds),
    )
    .toSorted(
      (left, right) =>
        Temporal.Instant.compare(left.occurredAt, right.occurredAt) || left.id.localeCompare(right.id),
    );
}

export function loadToolRequestEvents(
  input: ToolRequestEventCorrelationInput,
): Promise<readonly BusinessEvent[]> {
  return loadToolRequestEventsWithStore(prismaToolRequestEventReadStore, input);
}

function correlatesEvent(
  event: BusinessEvent,
  toolRequestId: string,
  executionIds: ReadonlySet<string>,
  approvalId: string | null,
  producedWorkItemIds: ReadonlySet<string>,
): boolean {
  const metadata = stringMetadata(event.metadata);

  if (TOOL_EVENT_TYPES.has(event.eventType)) {
    if (metadata.toolRequestId === toolRequestId) return true;
    if (metadata.toolExecutionId && executionIds.has(metadata.toolExecutionId)) return true;
    if (approvalId && metadata.approvalId === approvalId) return true;
    return false;
  }

  if (!WORK_MUTATION_EVENT_TYPES.has(event.eventType)) return false;

  const workItemId = workItemIdFromEvent(event, metadata);
  return workItemId !== null && producedWorkItemIds.has(workItemId);
}

function stringMetadata(value: unknown | null): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string') result[key] = item;
  }
  return result;
}

function workItemIdFromEvent(
  event: BusinessEvent,
  metadata: Readonly<Record<string, string>>,
): string | null {
  for (const key of ['workItemId', 'workItemID', 'id']) {
    const value = metadata[key];
    if (value) return value;
  }

  // Business commands may use the affected record as sourceId. Restrict this
  // fallback to known work mutation event types before accepting it.
  return event.sourceId ?? null;
}
