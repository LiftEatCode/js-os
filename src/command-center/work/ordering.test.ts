import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sortWorkItems, type SortableWorkItem } from './ordering.ts';

function item(
  overrides: Partial<SortableWorkItem> & {
    id: string;
    status: SortableWorkItem['status'];
    priority: SortableWorkItem['priority'];
  },
): SortableWorkItem & { id: string } {
  return {
    dueAt: null,
    createdAt: Temporal.Instant.from('2026-08-01T00:00:00Z'),
    ...overrides,
  };
}

describe('work list ordering', () => {
  it('orders by status then priority then earliest due then newest created', () => {
    const sorted = sortWorkItems([
      item({
        id: 'cancelled',
        status: 'CANCELLED',
        priority: 'CRITICAL',
        createdAt: Temporal.Instant.from('2026-08-20T00:00:00Z'),
      }),
      item({
        id: 'backlog-low',
        status: 'BACKLOG',
        priority: 'LOW',
        createdAt: Temporal.Instant.from('2026-08-10T00:00:00Z'),
      }),
      item({
        id: 'progress-high-later',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueAt: Temporal.Instant.from('2026-12-01T00:00:00Z'),
        createdAt: Temporal.Instant.from('2026-08-02T00:00:00Z'),
      }),
      item({
        id: 'progress-high-sooner',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueAt: Temporal.Instant.from('2026-09-01T00:00:00Z'),
        createdAt: Temporal.Instant.from('2026-08-03T00:00:00Z'),
      }),
      item({
        id: 'blocked',
        status: 'BLOCKED',
        priority: 'MEDIUM',
        createdAt: Temporal.Instant.from('2026-08-15T00:00:00Z'),
      }),
      item({
        id: 'backlog-low-newer',
        status: 'BACKLOG',
        priority: 'LOW',
        createdAt: Temporal.Instant.from('2026-08-11T00:00:00Z'),
      }),
    ]);

    assert.deepEqual(
      sorted.map((row) => row.id),
      [
        'progress-high-sooner',
        'progress-high-later',
        'blocked',
        'backlog-low-newer',
        'backlog-low',
        'cancelled',
      ],
    );
  });
});
