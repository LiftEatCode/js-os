import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { nextGoalCompletedAt } from './goal-lifecycle.ts';

const now = Temporal.Instant.from('2026-08-31T18:00:00Z');
const earlier = Temporal.Instant.from('2026-08-01T00:00:00Z');

describe('nextGoalCompletedAt', () => {
  it('does not change completedAt when status is unchanged', () => {
    assert.equal(nextGoalCompletedAt('ACTIVE', 'ACTIVE', null, now), undefined);
    assert.equal(nextGoalCompletedAt('ACHIEVED', 'ACHIEVED', earlier, now), undefined);
  });

  it('sets completedAt when entering ACHIEVED without an existing timestamp', () => {
    assert.equal(nextGoalCompletedAt('DRAFT', 'ACHIEVED', null, now), now);
  });

  it('preserves existing completedAt when entering ACHIEVED', () => {
    assert.equal(nextGoalCompletedAt('PAUSED', 'ACHIEVED', earlier, now), earlier);
  });

  it('clears completedAt when leaving ACHIEVED', () => {
    assert.equal(nextGoalCompletedAt('ACHIEVED', 'ACTIVE', earlier, now), null);
    assert.equal(nextGoalCompletedAt('ACHIEVED', 'CANCELLED', earlier, now), null);
  });

  it('does not set completedAt for CANCELLED from a non-achieved status', () => {
    assert.equal(nextGoalCompletedAt('ACTIVE', 'CANCELLED', null, now), undefined);
  });
});
