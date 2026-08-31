import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildOwnerAttention,
  isOpenWorkItem,
  sortOpenWorkItems,
  type AttentionAgentRun,
  type AttentionApproval,
  type AttentionWorkItem,
} from './attention.ts';

const now = Temporal.Instant.from('2026-08-31T18:00:00Z');

function work(
  overrides: Partial<AttentionWorkItem> & Pick<AttentionWorkItem, 'id' | 'title'>,
): AttentionWorkItem {
  return {
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueAt: null,
    createdAt: Temporal.Instant.from('2026-08-01T00:00:00Z'),
    ...overrides,
  };
}

function approval(
  overrides: Partial<AttentionApproval> & Pick<AttentionApproval, 'id' | 'title'>,
): AttentionApproval {
  return {
    status: 'PENDING',
    requestedAt: Temporal.Instant.from('2026-08-20T00:00:00Z'),
    ...overrides,
  };
}

function run(
  overrides: Partial<AttentionAgentRun> & Pick<AttentionAgentRun, 'id'>,
): AttentionAgentRun {
  return {
    status: 'FAILED',
    error: 'tool timed out',
    completedAt: Temporal.Instant.from('2026-08-30T12:00:00Z'),
    createdAt: Temporal.Instant.from('2026-08-30T11:00:00Z'),
    agentName: 'JS OS CEO',
    ...overrides,
  };
}

describe('open work', () => {
  it('treats completed and cancelled as closed', () => {
    assert.equal(isOpenWorkItem('COMPLETED'), false);
    assert.equal(isOpenWorkItem('CANCELLED'), false);
    assert.equal(isOpenWorkItem('BLOCKED'), true);
    assert.equal(isOpenWorkItem('BACKLOG'), true);
  });

  it('sorts by priority then due date', () => {
    const sorted = sortOpenWorkItems([
      work({
        id: 'low',
        title: 'low',
        priority: 'LOW',
        dueAt: Temporal.Instant.from('2026-09-01T00:00:00Z'),
      }),
      work({
        id: 'crit-later',
        title: 'crit-later',
        priority: 'CRITICAL',
        dueAt: Temporal.Instant.from('2026-09-10T00:00:00Z'),
      }),
      work({
        id: 'crit-soon',
        title: 'crit-soon',
        priority: 'CRITICAL',
        dueAt: Temporal.Instant.from('2026-09-02T00:00:00Z'),
      }),
      work({ id: 'done', title: 'done', status: 'COMPLETED', priority: 'CRITICAL' }),
    ]);

    assert.deepEqual(
      sorted.map((item) => item.id),
      ['crit-soon', 'crit-later', 'low'],
    );
  });
});

describe('buildOwnerAttention', () => {
  it('returns no items when state is empty', () => {
    const items = buildOwnerAttention({
      workItems: [],
      pendingApprovals: [],
      failedAgentRuns: [],
      now,
    });
    assert.deepEqual(items, []);
  });

  it('surfaces pending approval', () => {
    const items = buildOwnerAttention({
      workItems: [],
      pendingApprovals: [approval({ id: 'a1', title: 'Send outbound email' })],
      failedAgentRuns: [],
      now,
    });
    assert.equal(items.length, 1);
    assert.equal(items[0]?.kind, 'pending_approval');
    assert.equal(items[0]?.href, '/app/approvals');
  });

  it('surfaces critical open work', () => {
    const items = buildOwnerAttention({
      workItems: [
        work({ id: 'w1', title: 'Fix production outage', priority: 'CRITICAL' }),
      ],
      pendingApprovals: [],
      failedAgentRuns: [],
      now,
    });
    assert.equal(items[0]?.kind, 'critical_work');
    assert.equal(items[0]?.severity, 'critical');
  });

  it('does not surface completed critical work', () => {
    const items = buildOwnerAttention({
      workItems: [
        work({
          id: 'w1',
          title: 'Done outage',
          priority: 'CRITICAL',
          status: 'COMPLETED',
        }),
      ],
      pendingApprovals: [],
      failedAgentRuns: [],
      now,
    });
    assert.deepEqual(items, []);
  });

  it('surfaces blocked work', () => {
    const items = buildOwnerAttention({
      workItems: [work({ id: 'w1', title: 'Waiting on vendor', status: 'BLOCKED' })],
      pendingApprovals: [],
      failedAgentRuns: [],
      now,
    });
    assert.equal(items[0]?.kind, 'blocked_work');
  });

  it('surfaces overdue open work', () => {
    const items = buildOwnerAttention({
      workItems: [
        work({
          id: 'w1',
          title: 'Late report',
          dueAt: Temporal.Instant.from('2026-08-01T00:00:00Z'),
        }),
      ],
      pendingApprovals: [],
      failedAgentRuns: [],
      now,
    });
    assert.equal(items[0]?.kind, 'overdue_work');
  });

  it('does not surface completed overdue work', () => {
    const items = buildOwnerAttention({
      workItems: [
        work({
          id: 'w1',
          title: 'Finished late',
          status: 'COMPLETED',
          dueAt: Temporal.Instant.from('2026-08-01T00:00:00Z'),
        }),
      ],
      pendingApprovals: [],
      failedAgentRuns: [],
      now,
    });
    assert.deepEqual(items, []);
  });

  it('surfaces failed AgentRuns', () => {
    const items = buildOwnerAttention({
      workItems: [],
      pendingApprovals: [],
      failedAgentRuns: [run({ id: 'r1' })],
      now,
    });
    assert.equal(items[0]?.kind, 'failed_agent_run');
    assert.equal(items[0]?.title, 'JS OS CEO run failed');
  });

  it('orders groups deterministically and dedupes work items', () => {
    const items = buildOwnerAttention({
      workItems: [
        work({
          id: 'overdue',
          title: 'Overdue medium',
          dueAt: Temporal.Instant.from('2026-08-01T00:00:00Z'),
          createdAt: Temporal.Instant.from('2026-07-01T00:00:00Z'),
        }),
        work({
          id: 'blocked',
          title: 'Blocked medium',
          status: 'BLOCKED',
          createdAt: Temporal.Instant.from('2026-07-02T00:00:00Z'),
        }),
        work({
          id: 'crit-blocked-overdue',
          title: 'Critical blocked overdue',
          priority: 'CRITICAL',
          status: 'BLOCKED',
          dueAt: Temporal.Instant.from('2026-08-01T00:00:00Z'),
          createdAt: Temporal.Instant.from('2026-07-03T00:00:00Z'),
        }),
      ],
      pendingApprovals: [
        approval({
          id: 'newer',
          title: 'Newer approval',
          requestedAt: Temporal.Instant.from('2026-08-22T00:00:00Z'),
        }),
        approval({
          id: 'older',
          title: 'Older approval',
          requestedAt: Temporal.Instant.from('2026-08-10T00:00:00Z'),
        }),
      ],
      failedAgentRuns: [
        run({
          id: 'older-fail',
          completedAt: Temporal.Instant.from('2026-08-20T00:00:00Z'),
        }),
        run({
          id: 'newer-fail',
          agentName: 'JS OS Sales',
          completedAt: Temporal.Instant.from('2026-08-29T00:00:00Z'),
        }),
      ],
      now,
    });

    assert.deepEqual(
      items.map((item) => `${item.kind}:${item.title}`),
      [
        'critical_work:Critical blocked overdue',
        'failed_agent_run:JS OS Sales run failed',
        'failed_agent_run:JS OS CEO run failed',
        'pending_approval:Older approval',
        'pending_approval:Newer approval',
        'blocked_work:Blocked medium',
        'overdue_work:Overdue medium',
      ],
    );
  });

  it('orders overdue work by earliest due date', () => {
    const items = buildOwnerAttention({
      workItems: [
        work({
          id: 'later',
          title: 'Later due',
          dueAt: Temporal.Instant.from('2026-08-20T00:00:00Z'),
        }),
        work({
          id: 'sooner',
          title: 'Sooner due',
          dueAt: Temporal.Instant.from('2026-08-10T00:00:00Z'),
        }),
      ],
      pendingApprovals: [],
      failedAgentRuns: [],
      now,
    });
    assert.deepEqual(
      items.map((item) => item.title),
      ['Sooner due', 'Later due'],
    );
  });
});
