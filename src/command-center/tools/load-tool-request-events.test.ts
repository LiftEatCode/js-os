import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { BusinessEvent } from '../../business-state/types.ts';
import {
  loadToolRequestEventsWithStore,
  type ToolRequestEventReadStore,
} from './load-tool-request-events.ts';

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const OTHER_ORG_ID = '00000000-0000-4000-8000-000000000002';
const REQUEST_ID = '00000000-0000-4000-8000-000000000003';
const EXECUTION_ID = '00000000-0000-4000-8000-000000000004';
const APPROVAL_ID = '00000000-0000-4000-8000-000000000005';
const WORK_ITEM_ID = '00000000-0000-4000-8000-000000000006';

function event(overrides: Partial<BusinessEvent> & Pick<BusinessEvent, 'id' | 'eventType'>): BusinessEvent {
  return {
    organizationId: ORG_ID,
    sourceType: 'SYSTEM',
    sourceId: null,
    title: overrides.eventType,
    description: null,
    occurredAt: Temporal.Instant.from('2026-09-16T09:00:00Z'),
    metadata: null,
    createdAt: Temporal.Instant.from('2026-09-16T09:00:00Z'),
    ...overrides,
  };
}

function store(events: BusinessEvent[], calls: string[]): ToolRequestEventReadStore {
  return {
    async listOrganizationEvents(organizationId) {
      calls.push(organizationId);
      return events;
    },
  };
}

const input = {
  organizationId: ORG_ID,
  toolRequestId: REQUEST_ID,
  toolExecutionIds: [EXECUTION_ID],
  approvalId: APPROVAL_ID,
  producedWorkItemIds: [WORK_ITEM_ID],
} as const;

describe('loadToolRequestEventsWithStore', () => {
  it('correlates lifecycle events by exact request, execution, and approval identifiers', async () => {
    const calls: string[] = [];
    const events = [
      event({ id: 'request', eventType: 'tool.ready', metadata: { toolRequestId: REQUEST_ID } }),
      event({ id: 'execution', eventType: 'tool.executed', metadata: { toolExecutionId: EXECUTION_ID } }),
      event({ id: 'approval', eventType: 'tool.waiting_approval', metadata: { approvalId: APPROVAL_ID } }),
      event({ id: 'other', eventType: 'tool.ready', metadata: { toolRequestId: 'other-request' } }),
    ];

    const result = await loadToolRequestEventsWithStore(store(events, calls), input);

    assert.deepEqual(calls, [ORG_ID]);
    assert.deepEqual(result.map((item) => item.id).sort(), ['approval', 'execution', 'request']);
  });

  it('includes work mutation events only for explicitly produced WorkItems', async () => {
    const events = [
      event({ id: 'created', eventType: 'work.created', metadata: { workItemId: WORK_ITEM_ID } }),
      event({ id: 'changed', eventType: 'work.status_changed', metadata: { workItemId: WORK_ITEM_ID } }),
      event({ id: 'unrelated', eventType: 'work.status_changed', metadata: { workItemId: 'context-only' } }),
    ];

    const result = await loadToolRequestEventsWithStore(store(events, []), input);
    assert.deepEqual(result.map((item) => item.id), ['changed', 'created']);
  });

  it('rejects cross-organization rows even if identifiers match', async () => {
    const result = await loadToolRequestEventsWithStore(
      store([
        event({
          id: 'foreign',
          eventType: 'tool.executed',
          organizationId: OTHER_ORG_ID,
          metadata: { toolRequestId: REQUEST_ID },
        }),
      ], []),
      input,
    );

    assert.deepEqual(result, []);
  });

  it('does not correlate unknown event types merely because metadata contains a request id', async () => {
    const result = await loadToolRequestEventsWithStore(
      store([
        event({ id: 'unknown', eventType: 'something.else', metadata: { toolRequestId: REQUEST_ID } }),
      ], []),
      input,
    );

    assert.deepEqual(result, []);
  });

  it('sorts deterministically by occurredAt and then id', async () => {
    const early = Temporal.Instant.from('2026-09-16T08:59:00Z');
    const same = Temporal.Instant.from('2026-09-16T09:00:00Z');
    const events = [
      event({ id: 'b', eventType: 'tool.executed', occurredAt: same, metadata: { toolRequestId: REQUEST_ID } }),
      event({ id: 'a', eventType: 'tool.ready', occurredAt: same, metadata: { toolRequestId: REQUEST_ID } }),
      event({ id: 'early', eventType: 'tool.execution_queued', occurredAt: early, metadata: { toolRequestId: REQUEST_ID } }),
    ];

    const result = await loadToolRequestEventsWithStore(store(events, []), input);
    assert.deepEqual(result.map((item) => item.id), ['early', 'a', 'b']);
  });

  it('handles malformed metadata without guessing identifiers', async () => {
    const result = await loadToolRequestEventsWithStore(
      store([
        event({ id: 'null', eventType: 'tool.ready', metadata: null }),
        event({ id: 'array', eventType: 'tool.ready', metadata: [REQUEST_ID] }),
        event({ id: 'numeric', eventType: 'tool.ready', metadata: { toolRequestId: 123 } }),
      ], []),
      input,
    );

    assert.deepEqual(result, []);
  });
});
