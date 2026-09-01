import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BusinessStateNotFoundError,
  InvalidBusinessStateInputError,
} from '../business-state/errors.ts';
import { requireNonEmptyString } from '../business-state/validation.ts';
import type {
  AgentDefinition,
  CreateWorkItemInput,
  Goal,
  RecordBusinessEventInput,
  UpdateWorkItemInput,
  WorkItem,
} from '../business-state/types.ts';
import { initialWorkItemLifecycle, nextWorkItemLifecycle } from '../business-state/work-item-lifecycle.ts';
import { type TransactionRunner } from './command.ts';
import {
  WORK_EVENT_TYPES,
  createWorkItemWithStore,
  updateWorkItemStatusWithStore,
  updateWorkItemWithStore,
  type WorkCommandActor,
  type WorkCommandStore,
} from './work-items.ts';

const now = Temporal.Instant.from('2026-09-01T12:00:00Z');
const earlier = Temporal.Instant.from('2026-08-01T00:00:00Z');
const actor: WorkCommandActor = { sourceType: 'USER', sourceId: null };

type MemoryState = {
  workItems: Map<string, WorkItem>;
  goals: Map<string, Goal>;
  agents: Map<string, AgentDefinition>;
  events: RecordBusinessEventInput[];
  failOnUpdate: boolean;
  failOnEvent: boolean;
  nextId: number;
};

function emptyState(): MemoryState {
  return {
    workItems: new Map(),
    goals: new Map(),
    agents: new Map(),
    events: [],
    failOnUpdate: false,
    failOnEvent: false,
    nextId: 1,
  };
}

function cloneState(state: MemoryState): MemoryState {
  return {
    workItems: new Map(state.workItems),
    goals: new Map(state.goals),
    agents: new Map(state.agents),
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
    committed.workItems = draft.workItems;
    committed.goals = draft.goals;
    committed.agents = draft.agents;
    committed.events = draft.events;
    committed.nextId = draft.nextId;
    return result;
  };
}

function workItem(
  overrides: Partial<WorkItem> & Pick<WorkItem, 'id' | 'title'>,
): WorkItem {
  return {
    organizationId: 'org-1',
    description: null,
    status: 'BACKLOG',
    priority: 'MEDIUM',
    workType: 'ENGINEERING',
    goalId: null,
    parentId: null,
    agentRunId: null,
    sourceType: null,
    sourceId: null,
    assignedAgentId: null,
    dueAt: null,
    startedAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function goalRow(overrides: Partial<Goal> & Pick<Goal, 'id' | 'title'>): Goal {
  return {
    organizationId: 'org-1',
    description: null,
    status: 'ACTIVE',
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

function agentRow(
  overrides: Partial<AgentDefinition> & Pick<AgentDefinition, 'id' | 'slug' | 'name'>,
): AgentDefinition {
  return {
    organizationId: 'org-1',
    description: null,
    status: 'ACTIVE',
    role: 'ENGINEERING',
    permissionLevel: 'RECOMMEND',
    instructions: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function storeFrom(scope: MemoryState): WorkCommandStore {
  return {
    async getWorkItemById(id) {
      return scope.workItems.get(id) ?? null;
    },
    async listWorkItems(organizationId) {
      return [...scope.workItems.values()].filter((item) => item.organizationId === organizationId);
    },
    async getGoalById(id) {
      return scope.goals.get(id) ?? null;
    },
    async getAgentDefinitionById(id) {
      return scope.agents.get(id) ?? null;
    },
    async create(input: CreateWorkItemInput, createdAt: Temporal.Instant) {
      if (scope.failOnUpdate) {
        throw new Error('mutation failed');
      }
      const title = requireNonEmptyString(input.title, 'title');
      const status = input.status ?? 'BACKLOG';
      const lifecycle = initialWorkItemLifecycle(status, createdAt);
      const created = workItem({
        id: `w${scope.nextId++}`,
        organizationId: input.organizationId,
        title,
        description: input.description ?? null,
        status,
        priority: input.priority,
        workType: input.workType,
        goalId: input.goalId ?? null,
        parentId: input.parentId ?? null,
        agentRunId: input.agentRunId ?? null,
        sourceType: input.sourceType ?? null,
        sourceId: input.sourceId ?? null,
        assignedAgentId: input.assignedAgentId ?? null,
        dueAt: input.dueAt ?? null,
        startedAt: lifecycle.startedAt,
        completedAt: lifecycle.completedAt,
        createdAt,
        updatedAt: createdAt,
      });
      scope.workItems.set(created.id, created);
      return created;
    },
    async update(id, input: UpdateWorkItemInput, updatedAt: Temporal.Instant) {
      const existing = scope.workItems.get(id);
      if (!existing) {
        throw new BusinessStateNotFoundError(`WorkItem not found: ${id}`);
      }
      if (scope.failOnUpdate) {
        throw new Error('mutation failed');
      }
      const patch: UpdateWorkItemInput = { ...input };
      if (input.title !== undefined) {
        patch.title = requireNonEmptyString(input.title, 'title');
      }
      if (input.status !== undefined) {
        const lifecycle = nextWorkItemLifecycle(
          existing.status,
          input.status,
          existing.startedAt,
          existing.completedAt,
          updatedAt,
        );
        if (lifecycle.startedAt !== undefined) {
          patch.startedAt = lifecycle.startedAt;
        }
        if (lifecycle.completedAt !== undefined) {
          patch.completedAt = lifecycle.completedAt;
        }
      }
      const updated = { ...existing, ...patch, updatedAt } as WorkItem;
      scope.workItems.set(id, updated);
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

describe('Work item commands', () => {
  it('creates a WorkItem and appends work.created atomically', async () => {
    const committed = emptyState();
    const created = await runInTx(committed, (scope) =>
      createWorkItemWithStore(
        storeFrom(scope),
        {
          organizationId: 'org-1',
          title: 'Ship Command Center',
          priority: 'HIGH',
          workType: 'ENGINEERING',
          status: 'BACKLOG',
        },
        now,
        actor,
      ),
    );
    assert.equal(created.title, 'Ship Command Center');
    assert.equal(created.startedAt, null);
    assert.equal(created.completedAt, null);
    assert.equal(committed.events.length, 1);
    assert.equal(committed.events[0]?.eventType, WORK_EVENT_TYPES.created);
    assert.equal(committed.events[0]?.sourceType, 'USER');
    assert.equal(committed.events[0]?.sourceId, null);
    assert.deepEqual(committed.events[0]?.metadata, {
      workItemId: created.id,
      title: 'Ship Command Center',
      status: 'BACKLOG',
      priority: 'HIGH',
      workType: 'ENGINEERING',
    });
  });

  it('sets startedAt on IN_PROGRESS create and completedAt on COMPLETED create, not on CANCELLED', async () => {
    const committed = emptyState();
    const inProgress = await runInTx(committed, (scope) =>
      createWorkItemWithStore(
        storeFrom(scope),
        {
          organizationId: 'org-1',
          title: 'Active work',
          priority: 'MEDIUM',
          workType: 'TASK',
          status: 'IN_PROGRESS',
        },
        now,
        actor,
      ),
    );
    const completed = await runInTx(committed, (scope) =>
      createWorkItemWithStore(
        storeFrom(scope),
        {
          organizationId: 'org-1',
          title: 'Done work',
          priority: 'MEDIUM',
          workType: 'TASK',
          status: 'COMPLETED',
        },
        now,
        actor,
      ),
    );
    const cancelled = await runInTx(committed, (scope) =>
      createWorkItemWithStore(
        storeFrom(scope),
        {
          organizationId: 'org-1',
          title: 'Dropped work',
          priority: 'LOW',
          workType: 'TASK',
          status: 'CANCELLED',
        },
        now,
        actor,
      ),
    );
    assert.equal(inProgress.startedAt, now);
    assert.equal(inProgress.completedAt, null);
    assert.equal(completed.completedAt, now);
    assert.equal(cancelled.completedAt, null);
  });

  it('updates fields and appends work.updated', async () => {
    const committed = emptyState();
    committed.workItems.set(
      'w1',
      workItem({ id: 'w1', title: 'Old', status: 'READY', priority: 'LOW' }),
    );
    const updated = await runInTx(committed, (scope) =>
      updateWorkItemWithStore(
        storeFrom(scope),
        { id: 'w1', organizationId: 'org-1', title: 'New', priority: 'HIGH' },
        now,
        actor,
      ),
    );
    assert.equal(updated.title, 'New');
    assert.equal(committed.events.length, 1);
    assert.equal(committed.events[0]?.eventType, WORK_EVENT_TYPES.updated);
    assert.deepEqual(committed.events[0]?.metadata, {
      workItemId: 'w1',
      title: 'New',
      status: 'READY',
      priority: 'HIGH',
      workType: 'ENGINEERING',
    });
  });

  it('emits work.status_changed for status-only updates', async () => {
    const committed = emptyState();
    committed.workItems.set('w1', workItem({ id: 'w1', title: 'Ship', status: 'READY' }));
    await runInTx(committed, (scope) =>
      updateWorkItemStatusWithStore(
        storeFrom(scope),
        { id: 'w1', organizationId: 'org-1', status: 'IN_PROGRESS' },
        now,
        actor,
      ),
    );
    assert.equal(committed.workItems.get('w1')?.status, 'IN_PROGRESS');
    assert.equal(committed.workItems.get('w1')?.startedAt, now);
    assert.equal(committed.events.length, 1);
    assert.equal(committed.events[0]?.eventType, WORK_EVENT_TYPES.statusChanged);
    assert.deepEqual(committed.events[0]?.metadata, {
      workItemId: 'w1',
      previousStatus: 'READY',
      newStatus: 'IN_PROGRESS',
    });
  });

  it('preserves startedAt on later transitions and sets/clears completedAt around COMPLETED', async () => {
    const committed = emptyState();
    committed.workItems.set(
      'w1',
      workItem({ id: 'w1', title: 'Ship', status: 'IN_PROGRESS', startedAt: earlier }),
    );
    await runInTx(committed, (scope) =>
      updateWorkItemStatusWithStore(
        storeFrom(scope),
        { id: 'w1', organizationId: 'org-1', status: 'BLOCKED' },
        now,
        actor,
      ),
    );
    assert.equal(committed.workItems.get('w1')?.startedAt, earlier);
    await runInTx(committed, (scope) =>
      updateWorkItemStatusWithStore(
        storeFrom(scope),
        { id: 'w1', organizationId: 'org-1', status: 'COMPLETED' },
        now,
        actor,
      ),
    );
    assert.equal(committed.workItems.get('w1')?.completedAt, now);
    await runInTx(committed, (scope) =>
      updateWorkItemStatusWithStore(
        storeFrom(scope),
        { id: 'w1', organizationId: 'org-1', status: 'IN_PROGRESS' },
        now,
        actor,
      ),
    );
    assert.equal(committed.workItems.get('w1')?.completedAt, null);
    assert.equal(committed.workItems.get('w1')?.startedAt, earlier);
  });

  it('does not set completedAt when moving to CANCELLED', async () => {
    const committed = emptyState();
    committed.workItems.set(
      'w1',
      workItem({ id: 'w1', title: 'Ship', status: 'IN_PROGRESS', startedAt: earlier }),
    );
    await runInTx(committed, (scope) =>
      updateWorkItemStatusWithStore(
        storeFrom(scope),
        { id: 'w1', organizationId: 'org-1', status: 'CANCELLED' },
        now,
        actor,
      ),
    );
    assert.equal(committed.workItems.get('w1')?.status, 'CANCELLED');
    assert.equal(committed.workItems.get('w1')?.completedAt, null);
    assert.equal(committed.workItems.get('w1')?.startedAt, earlier);
  });

  it('rejects self-parenting and ancestor cycles before mutation', async () => {
    const committed = emptyState();
    committed.workItems.set('root', workItem({ id: 'root', title: 'Root' }));
    committed.workItems.set('child', workItem({ id: 'child', title: 'Child', parentId: 'root' }));
    committed.workItems.set(
      'grandchild',
      workItem({ id: 'grandchild', title: 'Grandchild', parentId: 'child' }),
    );

    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          updateWorkItemWithStore(
            storeFrom(scope),
            { id: 'root', organizationId: 'org-1', parentId: 'root' },
            now,
            actor,
          ),
        ),
      /cannot be its own parent/,
    );
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          updateWorkItemWithStore(
            storeFrom(scope),
            { id: 'root', organizationId: 'org-1', parentId: 'grandchild' },
            now,
            actor,
          ),
        ),
      /cannot become its own ancestor/,
    );
    assert.equal(committed.workItems.get('root')?.parentId, null);
    assert.equal(committed.events.length, 0);
  });

  it('does not write an event when an update is a no-op', async () => {
    const committed = emptyState();
    committed.workItems.set('w1', workItem({ id: 'w1', title: 'Ship', status: 'READY' }));
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          updateWorkItemWithStore(
            storeFrom(scope),
            { id: 'w1', organizationId: 'org-1', title: 'Ship', status: 'READY' },
            now,
            actor,
          ),
        ),
      InvalidBusinessStateInputError,
    );
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          updateWorkItemStatusWithStore(
            storeFrom(scope),
            { id: 'w1', organizationId: 'org-1', status: 'READY' },
            now,
            actor,
          ),
        ),
      InvalidBusinessStateInputError,
    );
    assert.equal(committed.events.length, 0);
  });

  it('treats other-organization work as not found and writes no event', async () => {
    const committed = emptyState();
    committed.workItems.set(
      'w1',
      workItem({ id: 'w1', title: 'Other', organizationId: 'org-other', status: 'READY' }),
    );
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          updateWorkItemStatusWithStore(
            storeFrom(scope),
            { id: 'w1', organizationId: 'org-1', status: 'IN_PROGRESS' },
            now,
            actor,
          ),
        ),
      BusinessStateNotFoundError,
    );
    assert.equal(committed.workItems.get('w1')?.status, 'READY');
    assert.equal(committed.events.length, 0);
  });

  it('rejects linked entities from another organization', async () => {
    const committed = emptyState();
    committed.workItems.set('w1', workItem({ id: 'w1', title: 'Ship' }));
    committed.goals.set(
      'g-other',
      goalRow({ id: 'g-other', title: 'Other goal', organizationId: 'org-other' }),
    );
    committed.agents.set(
      'a-other',
      agentRow({
        id: 'a-other',
        slug: 'other',
        name: 'Other',
        organizationId: 'org-other',
      }),
    );
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          updateWorkItemWithStore(
            storeFrom(scope),
            { id: 'w1', organizationId: 'org-1', goalId: 'g-other' },
            now,
            actor,
          ),
        ),
      InvalidBusinessStateInputError,
    );
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          createWorkItemWithStore(
            storeFrom(scope),
            {
              organizationId: 'org-1',
              title: 'Assigned elsewhere',
              priority: 'LOW',
              workType: 'TASK',
              assignedAgentId: 'a-other',
            },
            now,
            actor,
          ),
        ),
      InvalidBusinessStateInputError,
    );
    assert.equal(committed.events.length, 0);
  });

  it('does not append an event when the mutation fails', async () => {
    const committed = emptyState();
    committed.workItems.set('w1', workItem({ id: 'w1', title: 'Ship' }));
    committed.failOnUpdate = true;
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          updateWorkItemWithStore(
            storeFrom(scope),
            { id: 'w1', organizationId: 'org-1', title: 'Changed' },
            now,
            actor,
          ),
        ),
      /mutation failed/,
    );
    assert.equal(committed.workItems.get('w1')?.title, 'Ship');
    assert.equal(committed.events.length, 0);
  });

  it('rolls back the mutation when the event append fails', async () => {
    const committed = emptyState();
    committed.workItems.set('w1', workItem({ id: 'w1', title: 'Ship' }));
    committed.failOnEvent = true;
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          updateWorkItemWithStore(
            storeFrom(scope),
            { id: 'w1', organizationId: 'org-1', title: 'Changed' },
            now,
            actor,
          ),
        ),
      /event failed/,
    );
    assert.equal(committed.workItems.get('w1')?.title, 'Ship');
    assert.equal(committed.events.length, 0);
  });
});
