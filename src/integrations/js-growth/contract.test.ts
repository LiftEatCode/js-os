import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { jsGrowthBusinessEventV1Schema } from './contract.ts';

const validBase = {
  version: 1,
  eventId: 'event:quote:123',
  eventType: 'growth.quote_submitted',
  occurredAt: '2026-09-06T17:00:00.000Z',
  title: 'Quote request submitted',
} as const;

describe('JS Growth event contract', () => {
  it('accepts both v1 event types', () => {
    assert.equal(jsGrowthBusinessEventV1Schema.safeParse(validBase).success, true);
    assert.equal(
      jsGrowthBusinessEventV1Schema.safeParse({
        ...validBase,
        eventId: 'event:audit:123',
        eventType: 'growth.audit_completed',
        title: 'Website audit completed',
        metadata: { audit_type: 'website', result: 'completed' },
      }).success,
      true,
    );
  });

  it('rejects unsupported versions and event types', () => {
    assert.equal(
      jsGrowthBusinessEventV1Schema.safeParse({ ...validBase, version: 2 }).success,
      false,
    );
    assert.equal(
      jsGrowthBusinessEventV1Schema.safeParse({
        ...validBase,
        eventType: 'growth.page_viewed',
      }).success,
      false,
    );
  });

  it('rejects invalid identifiers, timestamps, and unbounded metadata', () => {
    const invalidCases = [
      { ...validBase, eventId: '' },
      { ...validBase, eventId: 'contains spaces' },
      { ...validBase, occurredAt: '2026-09-06T17:00:00-05:00' },
      { ...validBase, metadata: { email: 'person@example.com' } },
      { ...validBase, metadata: { nested: { value: true } } },
      { ...validBase, metadata: { source: ['website'] } },
    ];

    for (const value of invalidCases) {
      assert.equal(jsGrowthBusinessEventV1Schema.safeParse(value).success, false);
    }
  });
});
