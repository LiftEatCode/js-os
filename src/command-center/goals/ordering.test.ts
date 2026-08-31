import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sortGoals, type SortableGoal } from './ordering.ts';

function goal(
  overrides: Partial<SortableGoal> & { id: string; status: SortableGoal['status']; priority: SortableGoal['priority'] },
): SortableGoal & { id: string } {
  return {
    targetDate: null,
    createdAt: Temporal.Instant.from('2026-08-01T00:00:00Z'),
    ...overrides,
  };
}

describe('goal list ordering', () => {
  it('orders by status then priority then target date then newest created', () => {
    const sorted = sortGoals([
      goal({
        id: 'cancelled',
        status: 'CANCELLED',
        priority: 'CRITICAL',
        createdAt: Temporal.Instant.from('2026-08-20T00:00:00Z'),
      }),
      goal({
        id: 'active-low',
        status: 'ACTIVE',
        priority: 'LOW',
        createdAt: Temporal.Instant.from('2026-08-10T00:00:00Z'),
      }),
      goal({
        id: 'active-crit-later',
        status: 'ACTIVE',
        priority: 'CRITICAL',
        targetDate: Temporal.Instant.from('2026-12-01T00:00:00Z'),
        createdAt: Temporal.Instant.from('2026-08-02T00:00:00Z'),
      }),
      goal({
        id: 'active-crit-sooner',
        status: 'ACTIVE',
        priority: 'CRITICAL',
        targetDate: Temporal.Instant.from('2026-09-01T00:00:00Z'),
        createdAt: Temporal.Instant.from('2026-08-03T00:00:00Z'),
      }),
      goal({
        id: 'draft',
        status: 'DRAFT',
        priority: 'HIGH',
        createdAt: Temporal.Instant.from('2026-08-15T00:00:00Z'),
      }),
      goal({
        id: 'active-low-newer',
        status: 'ACTIVE',
        priority: 'LOW',
        createdAt: Temporal.Instant.from('2026-08-11T00:00:00Z'),
      }),
    ]);

    assert.deepEqual(
      sorted.map((item) => item.id),
      [
        'active-crit-sooner',
        'active-crit-later',
        'active-low-newer',
        'active-low',
        'draft',
        'cancelled',
      ],
    );
  });
});
