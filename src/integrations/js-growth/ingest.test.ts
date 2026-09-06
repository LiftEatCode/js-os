import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { JsGrowthBusinessEventV1 } from './contract.ts';
import { ingestJsGrowthEventWithDependencies } from './ingest.ts';

const event: JsGrowthBusinessEventV1 = {
  version: 1,
  eventId: 'event:quote:123',
  eventType: 'growth.quote_submitted',
  occurredAt: '2026-09-06T17:00:00.000Z',
  title: 'Quote request submitted',
  metadata: { form_name: 'contact', source: 'website' },
};

describe('JS Growth event ingestion', () => {
  it('accepts the first delivery and deduplicates the replay', async () => {
    const rows = new Map<string, { id: string; sourceId: string }>();
    let writes = 0;

    const dependencies = {
      async getOrganizationId() {
        return 'organization-1';
      },
      async findExisting({ eventId }: { organizationId: string; eventId: string }) {
        return rows.get(eventId) ?? null;
      },
      async record(input: {
        organizationId: string;
        event: JsGrowthBusinessEventV1;
        title: string;
      }) {
        writes += 1;
        assert.equal(input.organizationId, 'organization-1');
        assert.equal(input.title, 'Quote request submitted');
        const row = { id: 'business-event-1', sourceId: input.event.eventId };
        rows.set(input.event.eventId, row);
        return row;
      },
    };

    const first = await ingestJsGrowthEventWithDependencies(event, dependencies);
    const second = await ingestJsGrowthEventWithDependencies(event, dependencies);

    assert.deepEqual(first, {
      status: 'accepted',
      eventId: event.eventId,
      businessEventId: 'business-event-1',
    });
    assert.deepEqual(second, {
      status: 'duplicate',
      eventId: event.eventId,
      businessEventId: 'business-event-1',
    });
    assert.equal(writes, 1);
  });

  it('treats a post-write race as a duplicate when the row becomes visible', async () => {
    let findCount = 0;
    const dependencies = {
      async getOrganizationId() {
        return 'organization-1';
      },
      async findExisting() {
        findCount += 1;
        return findCount === 1
          ? null
          : { id: 'business-event-race', sourceId: event.eventId };
      },
      async record() {
        throw new Error('unique constraint');
      },
    };

    const result = await ingestJsGrowthEventWithDependencies(event, dependencies);

    assert.deepEqual(result, {
      status: 'duplicate',
      eventId: event.eventId,
      businessEventId: 'business-event-race',
    });
  });
});
