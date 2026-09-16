import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { WorkItem } from '../../business-state/types.ts';
import {
  resolveToolProducedRecordsWithStore,
  type ToolProducedRecordReadStore,
} from './resolve-tool-produced-records.ts';

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const OTHER_ORG_ID = '00000000-0000-4000-8000-000000000002';
const WORK_ITEM_ID = '00000000-0000-4000-8000-000000000003';

function workItem(overrides: Partial<WorkItem> = {}): WorkItem {
  const instant = Temporal.Instant.from('2026-09-16T09:00:00Z');
  return {
    id: WORK_ITEM_ID,
    organizationId: ORG_ID,
    goalId: null,
    parentId: null,
    agentRunId: null,
    title: 'Follow up with prospect',
    description: null,
    status: 'READY',
    priority: 'MEDIUM',
    workType: 'TASK',
    sourceType: null,
    sourceId: null,
    assignedAgentId: null,
    dueAt: null,
    startedAt: null,
    completedAt: null,
    createdAt: instant,
    updatedAt: instant,
    ...overrides,
  };
}

function store(value: WorkItem | null, calls: Array<[string, string]>): ToolProducedRecordReadStore {
  return {
    async getWorkItem(organizationId, workItemId) {
      calls.push([organizationId, workItemId]);
      return value;
    },
  };
}

describe('resolveToolProducedRecordsWithStore', () => {
  it('resolves create_work_item v1 output to an organization-scoped WorkItem', async () => {
    const calls: Array<[string, string]> = [];
    const records = await resolveToolProducedRecordsWithStore(store(workItem(), calls), {
      organizationId: ORG_ID,
      toolSlug: 'internal.create_work_item',
      toolVersion: 1,
      output: { workItemId: WORK_ITEM_ID, title: 'Follow up with prospect', status: 'READY' },
    });

    assert.deepEqual(calls, [[ORG_ID, WORK_ITEM_ID]]);
    assert.deepEqual(records, [
      {
        type: 'WORK_ITEM',
        id: WORK_ITEM_ID,
        label: 'Follow up with prospect',
        href: `/command/work/${WORK_ITEM_ID}`,
      },
    ]);
  });

  it('resolves update_work_status v1 to the affected WorkItem', async () => {
    const calls: Array<[string, string]> = [];
    const records = await resolveToolProducedRecordsWithStore(store(workItem(), calls), {
      organizationId: ORG_ID,
      toolSlug: 'internal.update_work_status',
      toolVersion: 1,
      output: { workItemId: WORK_ITEM_ID, status: 'COMPLETED' },
    });

    assert.equal(records[0]?.id, WORK_ITEM_ID);
    assert.deepEqual(calls, [[ORG_ID, WORK_ITEM_ID]]);
  });

  it('does not inspect arbitrary output for unknown tool slugs or versions', async () => {
    const calls: Array<[string, string]> = [];
    const readStore = store(workItem(), calls);

    assert.deepEqual(
      await resolveToolProducedRecordsWithStore(readStore, {
        organizationId: ORG_ID,
        toolSlug: 'internal.unknown',
        toolVersion: 1,
        output: { workItemId: WORK_ITEM_ID },
      }),
      [],
    );
    assert.deepEqual(
      await resolveToolProducedRecordsWithStore(readStore, {
        organizationId: ORG_ID,
        toolSlug: 'internal.create_work_item',
        toolVersion: 2,
        output: { workItemId: WORK_ITEM_ID },
      }),
      [],
    );
    assert.deepEqual(calls, []);
  });

  it('returns no records for malformed or missing output', async () => {
    const calls: Array<[string, string]> = [];
    const readStore = store(workItem(), calls);

    for (const output of [null, {}, [], { workItemId: 123 }, { workItemId: '' }]) {
      assert.deepEqual(
        await resolveToolProducedRecordsWithStore(readStore, {
          organizationId: ORG_ID,
          toolSlug: 'internal.create_work_item',
          toolVersion: 1,
          output,
        }),
        [],
      );
    }
    assert.deepEqual(calls, []);
  });

  it('drops missing and cross-organization WorkItems defensively', async () => {
    const missingCalls: Array<[string, string]> = [];
    const foreignCalls: Array<[string, string]> = [];
    const input = {
      organizationId: ORG_ID,
      toolSlug: 'internal.create_work_item',
      toolVersion: 1,
      output: { workItemId: WORK_ITEM_ID },
    } as const;

    assert.deepEqual(
      await resolveToolProducedRecordsWithStore(store(null, missingCalls), input),
      [],
    );
    assert.deepEqual(
      await resolveToolProducedRecordsWithStore(
        store(workItem({ organizationId: OTHER_ORG_ID }), foreignCalls),
        input,
      ),
      [],
    );
    assert.deepEqual(missingCalls, [[ORG_ID, WORK_ITEM_ID]]);
    assert.deepEqual(foreignCalls, [[ORG_ID, WORK_ITEM_ID]]);
  });
});
