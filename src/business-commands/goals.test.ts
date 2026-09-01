import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BusinessStateNotFoundError,
  InvalidBusinessStateInputError,
} from '../business-state/errors.ts';
import { nextGoalCompletedAt } from '../business-state/goal-lifecycle.ts';
import { requireNonEmptyString } from '../business-state/validation.ts';
import type {
  CreateGoalInput,
  Goal,
  RecordBusinessEventInput,
  UpdateGoalInput,
} from '../business-state/types.ts';
import { type TransactionRunner } from './command.ts';
import {
  GOAL_EVENT_TYPES,
  createGoalWithStore,
  updateGoalProgressWithStore,
  updateGoalWithStore,
  type GoalCommandActor,
  type GoalCommandStore,
} from './goals.ts';

const now = Temporal.Instant.from('2026-09-01T12:00:00Z');
const earlier = Temporal.Instant.from('2026-08-01T00:00:00Z');
const actor: GoalCommandActor = { sourceType: 'USER', sourceId: null };

type MemoryState = {
  goals: Map<string, Goal>;
  events: RecordBusinessEventInput[];
  failOnUpdate: boolean;
  failOnEvent: boolean;
  nextId: number;
};

function emptyState(): MemoryState {
  return {
    goals: new Map(),
    events: [],
    failOnUpdate: false,
    failOnEvent: false,
    nextId: 1,
  };
}

function cloneState(state: MemoryState): MemoryState {
  return {
    goals: new Map(state.goals),
    events: [...state.events],
    failOnUpdate: state.failOnUpdate,
    failOnEvent: state.failOnEvent,
    nextId: state.nextId,
  };
}

function memoryRunner(committed: MemoryState): TransactionRunner<MemoryState> {
  return async (work) => {
    const draft = cloneState(committed);
    const result = await work(draft);
    committed.goals = draft.goals;
    committed.events = draft.events;
    committed.nextId = draft.nextId;
    return result;
  };
}

function goal(
  overrides: Partial<Goal> & Pick<Goal, 'id' | 'title'>,
): Goal {
  return {
    organizationId: 'org-1',
    description: null,
    status: 'DRAFT',
    priority: 'MEDIUM',
    timeHorizon: 'QUARTERLY',
    targetDate: null,
    metricName: null,
    metricUnit: null,
    targetValue: null,
    currentValue: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    ...overrides,
  };
}

function storeFrom(scope: MemoryState): GoalCommandStore {
  return {
    async getGoalById(id) {
      return scope.goals.get(id) ?? null;
    },
    async create(input: CreateGoalInput, createdAt: Temporal.Instant) {
      if (scope.failOnUpdate) {
        throw new Error('mutation failed');
      }
      const title = requireNonEmptyString(input.title, 'title');
      const status = input.status ?? 'DRAFT';
      const created = goal({
        id: `g${scope.nextId++}`,
        organizationId: input.organizationId,
        title,
        description: input.description ?? null,
        status,
        priority: input.priority,
        timeHorizon: input.timeHorizon,
        targetDate: input.targetDate ?? null,
        metricName: input.metricName ?? null,
        metricUnit: input.metricUnit ?? null,
        targetValue: input.targetValue ?? null,
        currentValue: input.currentValue ?? null,
        completedAt: status === 'ACHIEVED' ? createdAt : null,
        createdAt,
        updatedAt: createdAt,
      });
      scope.goals.set(created.id, created);
      return created;
    },
    async update(id, input: UpdateGoalInput, updatedAt: Temporal.Instant) {
      const existing = scope.goals.get(id);
      if (!existing) {
        throw new BusinessStateNotFoundError(`Goal not found: ${id}`);
      }
      if (scope.failOnUpdate) {
        throw new Error('mutation failed');
      }
      const patch: UpdateGoalInput = { ...input };
      if (input.title !== undefined) {
        patch.title = requireNonEmptyString(input.title, 'title');
      }
      if (input.status !== undefined) {
        const completedAt = nextGoalCompletedAt(
          existing.status,
          input.status,
          existing.completedAt,
          updatedAt,
        );
        if (completedAt !== undefined) {
          patch.completedAt = completedAt;
        }
      }
      const updated = { ...existing, ...patch, updatedAt } as Goal;
      scope.goals.set(id, updated);
      return updated;
    },
    async recordEvent(input) {
      if (scope.failOnEvent) {
        throw new Error('event failed');
      }
      scope.events.push(input);
    },
  };
}

async function runInTx<T>(
  committed: MemoryState,
  work: (scope: MemoryState) => Promise<T>,
): Promise<T> {
  return memoryRunner(committed)(work);
}

describe('Goal commands', () => {
  it('creates a Goal and appends goal.created atomically', async () => {
    const committed = emptyState();
    const created = await runInTx(committed, (scope) =>
      createGoalWithStore(
        storeFrom(scope),
        {
          organizationId: 'org-1',
          title: 'Grow MRR',
          priority: 'HIGH',
          timeHorizon: 'QUARTERLY',
          status: 'ACTIVE',
        },
        now,
        actor,
      ),
    );
    assert.equal(created.title, 'Grow MRR');
    assert.equal(created.status, 'ACTIVE');
    assert.equal(created.completedAt, null);
    assert.equal(committed.events.length, 1);
    assert.equal(committed.events[0]?.eventType, GOAL_EVENT_TYPES.created);
    assert.equal(committed.events[0]?.sourceType, 'USER');
    assert.equal(committed.events[0]?.sourceId, null);
    assert.deepEqual(committed.events[0]?.metadata, {
      goalId: created.id,
      title: 'Grow MRR',
      status: 'ACTIVE',
      priority: 'HIGH',
    });
  });

  it('sets completedAt when creating an ACHIEVED Goal', async () => {
    const committed = emptyState();
    const created = await runInTx(committed, (scope) =>
      createGoalWithStore(
        storeFrom(scope),
        {
          organizationId: 'org-1',
          title: 'Already done',
          priority: 'LOW',
          timeHorizon: 'SHORT_TERM',
          status: 'ACHIEVED',
        },
        now,
        actor,
      ),
    );
    assert.equal(created.completedAt, now);
    assert.equal(committed.events[0]?.eventType, GOAL_EVENT_TYPES.created);
  });

  it('updates fields and appends goal.updated', async () => {
    const committed = emptyState();
    committed.goals.set('g1', goal({ id: 'g1', title: 'Old', status: 'ACTIVE', priority: 'LOW' }));
    const updated = await runInTx(committed, (scope) =>
      updateGoalWithStore(
        storeFrom(scope),
        { id: 'g1', organizationId: 'org-1', title: 'New', priority: 'HIGH' },
        now,
        actor,
      ),
    );
    assert.equal(updated.title, 'New');
    assert.equal(updated.priority, 'HIGH');
    assert.equal(committed.events.length, 1);
    assert.equal(committed.events[0]?.eventType, GOAL_EVENT_TYPES.updated);
    assert.deepEqual(committed.events[0]?.metadata, {
      goalId: 'g1',
      title: 'New',
      status: 'ACTIVE',
      priority: 'HIGH',
    });
  });

  it('emits a single goal.updated when status and fields change together', async () => {
    const committed = emptyState();
    committed.goals.set('g1', goal({ id: 'g1', title: 'Old', status: 'DRAFT' }));
    await runInTx(committed, (scope) =>
      updateGoalWithStore(
        storeFrom(scope),
        { id: 'g1', organizationId: 'org-1', title: 'New', status: 'ACTIVE' },
        now,
        actor,
      ),
    );
    assert.equal(committed.events.length, 1);
    assert.equal(committed.events[0]?.eventType, GOAL_EVENT_TYPES.updated);
    assert.deepEqual(committed.events[0]?.metadata, {
      goalId: 'g1',
      title: 'New',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      previousStatus: 'DRAFT',
      newStatus: 'ACTIVE',
    });
  });

  it('emits goal.status_changed when only status changes', async () => {
    const committed = emptyState();
    committed.goals.set('g1', goal({ id: 'g1', title: 'Grow MRR', status: 'DRAFT' }));
    await runInTx(committed, (scope) =>
      updateGoalWithStore(
        storeFrom(scope),
        { id: 'g1', organizationId: 'org-1', status: 'ACTIVE' },
        now,
        actor,
      ),
    );
    assert.equal(committed.goals.get('g1')?.status, 'ACTIVE');
    assert.equal(committed.events.length, 1);
    assert.equal(committed.events[0]?.eventType, GOAL_EVENT_TYPES.statusChanged);
    assert.deepEqual(committed.events[0]?.metadata, {
      goalId: 'g1',
      previousStatus: 'DRAFT',
      newStatus: 'ACTIVE',
    });
  });

  it('sets completedAt when entering ACHIEVED and clears it when leaving', async () => {
    const committed = emptyState();
    committed.goals.set('g1', goal({ id: 'g1', title: 'Ship', status: 'ACTIVE' }));
    await runInTx(committed, (scope) =>
      updateGoalWithStore(
        storeFrom(scope),
        { id: 'g1', organizationId: 'org-1', status: 'ACHIEVED' },
        now,
        actor,
      ),
    );
    assert.equal(committed.goals.get('g1')?.completedAt, now);
    await runInTx(committed, (scope) =>
      updateGoalWithStore(
        storeFrom(scope),
        { id: 'g1', organizationId: 'org-1', status: 'ACTIVE' },
        now,
        actor,
      ),
    );
    assert.equal(committed.goals.get('g1')?.completedAt, null);
    assert.equal(committed.events.length, 2);
    assert.equal(committed.events[0]?.eventType, GOAL_EVENT_TYPES.statusChanged);
    assert.equal(committed.events[1]?.eventType, GOAL_EVENT_TYPES.statusChanged);
  });

  it('preserves existing completedAt when re-entering ACHIEVED is not needed and entering from PAUSED keeps prior stamp', async () => {
    const committed = emptyState();
    committed.goals.set(
      'g1',
      goal({ id: 'g1', title: 'Ship', status: 'PAUSED', completedAt: earlier }),
    );
    await runInTx(committed, (scope) =>
      updateGoalWithStore(
        storeFrom(scope),
        { id: 'g1', organizationId: 'org-1', status: 'ACHIEVED' },
        now,
        actor,
      ),
    );
    assert.equal(committed.goals.get('g1')?.completedAt, earlier);
  });

  it('updates progress and appends goal.progress_updated', async () => {
    const committed = emptyState();
    committed.goals.set(
      'g1',
      goal({
        id: 'g1',
        title: 'MRR',
        metricName: 'Monthly recurring revenue',
        currentValue: '600' as Goal['currentValue'],
      }),
    );
    await runInTx(committed, (scope) =>
      updateGoalProgressWithStore(
        storeFrom(scope),
        { id: 'g1', organizationId: 'org-1', currentValue: '2000' as Goal['currentValue'] },
        now,
        actor,
      ),
    );
    assert.equal(String(committed.goals.get('g1')?.currentValue), '2000');
    assert.equal(committed.events.length, 1);
    assert.equal(committed.events[0]?.eventType, GOAL_EVENT_TYPES.progressUpdated);
    assert.deepEqual(committed.events[0]?.metadata, {
      goalId: 'g1',
      metricName: 'Monthly recurring revenue',
      previousValue: '600',
      newValue: '2000',
    });
  });

  it('does not write an event when an update is a no-op', async () => {
    const committed = emptyState();
    committed.goals.set('g1', goal({ id: 'g1', title: 'Grow MRR', status: 'ACTIVE' }));
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          updateGoalWithStore(
            storeFrom(scope),
            { id: 'g1', organizationId: 'org-1', title: 'Grow MRR', status: 'ACTIVE' },
            now,
            actor,
          ),
        ),
      InvalidBusinessStateInputError,
    );
    assert.equal(committed.events.length, 0);
  });

  it('does not write an event when progress is unchanged', async () => {
    const committed = emptyState();
    committed.goals.set(
      'g1',
      goal({ id: 'g1', title: 'MRR', currentValue: '600' as Goal['currentValue'] }),
    );
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          updateGoalProgressWithStore(
            storeFrom(scope),
            { id: 'g1', organizationId: 'org-1', currentValue: '600' as Goal['currentValue'] },
            now,
            actor,
          ),
        ),
      InvalidBusinessStateInputError,
    );
    assert.equal(committed.events.length, 0);
  });

  it('treats other-organization goals as not found and writes no event', async () => {
    const committed = emptyState();
    committed.goals.set(
      'g1',
      goal({ id: 'g1', title: 'Other', organizationId: 'org-other', status: 'ACTIVE' }),
    );
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          updateGoalWithStore(
            storeFrom(scope),
            { id: 'g1', organizationId: 'org-1', status: 'PAUSED' },
            now,
            actor,
          ),
        ),
      BusinessStateNotFoundError,
    );
    assert.equal(committed.goals.get('g1')?.status, 'ACTIVE');
    assert.equal(committed.events.length, 0);
  });

  it('does not append an event when the mutation fails', async () => {
    const committed = emptyState();
    committed.goals.set('g1', goal({ id: 'g1', title: 'Grow MRR' }));
    committed.failOnUpdate = true;
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          updateGoalWithStore(
            storeFrom(scope),
            { id: 'g1', organizationId: 'org-1', title: 'Changed' },
            now,
            actor,
          ),
        ),
      /mutation failed/,
    );
    assert.equal(committed.goals.get('g1')?.title, 'Grow MRR');
    assert.equal(committed.events.length, 0);
  });

  it('rolls back the mutation when the event append fails', async () => {
    const committed = emptyState();
    committed.goals.set('g1', goal({ id: 'g1', title: 'Grow MRR' }));
    committed.failOnEvent = true;
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          updateGoalWithStore(
            storeFrom(scope),
            { id: 'g1', organizationId: 'org-1', title: 'Changed' },
            now,
            actor,
          ),
        ),
      /event failed/,
    );
    assert.equal(committed.goals.get('g1')?.title, 'Grow MRR');
    assert.equal(committed.events.length, 0);
  });

  it('does not append an event when create mutation fails', async () => {
    const committed = emptyState();
    committed.failOnUpdate = true;
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          createGoalWithStore(
            storeFrom(scope),
            {
              organizationId: 'org-1',
              title: 'Grow MRR',
              priority: 'HIGH',
              timeHorizon: 'QUARTERLY',
            },
            now,
            actor,
          ),
        ),
      /mutation failed/,
    );
    assert.equal(committed.goals.size, 0);
    assert.equal(committed.events.length, 0);
  });

  it('rolls back create when the event append fails', async () => {
    const committed = emptyState();
    committed.failOnEvent = true;
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          createGoalWithStore(
            storeFrom(scope),
            {
              organizationId: 'org-1',
              title: 'Grow MRR',
              priority: 'HIGH',
              timeHorizon: 'QUARTERLY',
            },
            now,
            actor,
          ),
        ),
      /event failed/,
    );
    assert.equal(committed.goals.size, 0);
    assert.equal(committed.events.length, 0);
  });
});
