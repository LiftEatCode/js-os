import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { initialWorkItemLifecycle, nextWorkItemLifecycle } from './work-item-lifecycle.ts';

const now = Temporal.Instant.from('2026-08-31T18:00:00Z');
const earlier = Temporal.Instant.from('2026-08-01T00:00:00Z');

describe('nextWorkItemLifecycle', () => {
  it('does not change timestamps when status is unchanged', () => {
    assert.deepEqual(
      nextWorkItemLifecycle('IN_PROGRESS', 'IN_PROGRESS', earlier, null, now),
      {},
    );
    assert.deepEqual(
      nextWorkItemLifecycle('COMPLETED', 'COMPLETED', earlier, earlier, now),
      {},
    );
  });

  it('sets startedAt when first entering IN_PROGRESS', () => {
    assert.deepEqual(nextWorkItemLifecycle('BACKLOG', 'IN_PROGRESS', null, null, now), {
      startedAt: now,
    });
  });

  it('does not reset startedAt on later status changes', () => {
    assert.deepEqual(
      nextWorkItemLifecycle('IN_PROGRESS', 'BLOCKED', earlier, null, now),
      {},
    );
    assert.deepEqual(
      nextWorkItemLifecycle('BLOCKED', 'READY', earlier, null, now),
      {},
    );
  });

  it('sets completedAt when entering COMPLETED', () => {
    assert.deepEqual(nextWorkItemLifecycle('IN_PROGRESS', 'COMPLETED', earlier, null, now), {
      completedAt: now,
    });
  });

  it('preserves existing completedAt when entering COMPLETED', () => {
    assert.deepEqual(
      nextWorkItemLifecycle('IN_PROGRESS', 'COMPLETED', earlier, earlier, now),
      { completedAt: earlier },
    );
  });

  it('clears completedAt when leaving COMPLETED', () => {
    assert.deepEqual(nextWorkItemLifecycle('COMPLETED', 'IN_PROGRESS', earlier, earlier, now), {
      completedAt: null,
    });
    assert.deepEqual(nextWorkItemLifecycle('COMPLETED', 'CANCELLED', earlier, earlier, now), {
      completedAt: null,
    });
  });

  it('does not manufacture completion for CANCELLED', () => {
    assert.deepEqual(nextWorkItemLifecycle('BACKLOG', 'CANCELLED', null, null, now), {});
    assert.deepEqual(nextWorkItemLifecycle('IN_PROGRESS', 'CANCELLED', earlier, null, now), {});
  });
});

describe('initialWorkItemLifecycle', () => {
  it('sets startedAt only for IN_PROGRESS creates', () => {
    assert.deepEqual(initialWorkItemLifecycle('IN_PROGRESS', now), {
      startedAt: now,
      completedAt: null,
    });
    assert.deepEqual(initialWorkItemLifecycle('BACKLOG', now), {
      startedAt: null,
      completedAt: null,
    });
  });

  it('sets completedAt only for COMPLETED creates', () => {
    assert.deepEqual(initialWorkItemLifecycle('COMPLETED', now), {
      startedAt: null,
      completedAt: now,
    });
    assert.deepEqual(initialWorkItemLifecycle('CANCELLED', now), {
      startedAt: null,
      completedAt: null,
    });
  });
});
