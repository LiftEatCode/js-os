import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BusinessStateNotFoundError,
  InvalidBusinessStateInputError,
} from '../business-state/errors.ts';
import {
  assertAgentPermissionChange,
  assertAgentStatusChange,
} from '../business-state/agent-definition-lifecycle.ts';
import type {
  AgentDefinition,
  AgentDefinitionStatus,
  AgentPermissionLevel,
  RecordBusinessEventInput,
} from '../business-state/types.ts';
import { type TransactionRunner } from './command.ts';
import {
  AGENT_EVENT_TYPES,
  changeAgentPermissionLevelWithStore,
  changeAgentStatusWithStore,
  type AgentCommandActor,
  type AgentCommandStore,
} from './agents.ts';

const now = Temporal.Instant.from('2026-09-01T12:00:00Z');
const actor: AgentCommandActor = { sourceType: 'USER', sourceId: null };

type MemoryState = {
  agents: Map<string, AgentDefinition>;
  events: RecordBusinessEventInput[];
  failOnUpdate: boolean;
  failOnEvent: boolean;
};

function emptyState(): MemoryState {
  return {
    agents: new Map(),
    events: [],
    failOnUpdate: false,
    failOnEvent: false,
  };
}

function cloneState(state: MemoryState): MemoryState {
  return {
    agents: new Map(state.agents),
    events: [...state.events],
    failOnUpdate: state.failOnUpdate,
    failOnEvent: state.failOnEvent,
  };
}

function memoryRunner(committed: MemoryState): TransactionRunner<MemoryState> {
  return async (work) => {
    const draft = cloneState(committed);
    const result = await work(draft);
    committed.agents = draft.agents;
    committed.events = draft.events;
    return result;
  };
}

function agent(
  overrides: Partial<AgentDefinition> & Pick<AgentDefinition, 'id' | 'slug' | 'name'>,
): AgentDefinition {
  return {
    organizationId: 'org-1',
    description: null,
    status: 'ACTIVE',
    role: 'MARKETING',
    permissionLevel: 'RECOMMEND',
    instructions: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function storeFrom(scope: MemoryState): AgentCommandStore {
  return {
    async getAgentDefinitionById(id) {
      return scope.agents.get(id) ?? null;
    },
    async updateStatus(id, status: AgentDefinitionStatus) {
      const existing = scope.agents.get(id);
      if (!existing) {
        throw new BusinessStateNotFoundError(`AgentDefinition not found: ${id}`);
      }
      if (scope.failOnUpdate) {
        throw new Error('mutation failed');
      }
      assertAgentStatusChange(existing.status, status);
      const updated = { ...existing, status, updatedAt: now };
      scope.agents.set(id, updated);
      return updated;
    },
    async updatePermissionLevel(id, permissionLevel: AgentPermissionLevel) {
      const existing = scope.agents.get(id);
      if (!existing) {
        throw new BusinessStateNotFoundError(`AgentDefinition not found: ${id}`);
      }
      if (scope.failOnUpdate) {
        throw new Error('mutation failed');
      }
      assertAgentPermissionChange(existing.permissionLevel, permissionLevel);
      const updated = { ...existing, permissionLevel, updatedAt: now };
      scope.agents.set(id, updated);
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

describe('Agent configuration commands', () => {
  it('changes ACTIVE to PAUSED and appends agent.status_changed', async () => {
    const committed = emptyState();
    committed.agents.set('a1', agent({ id: 'a1', slug: 'marketing', name: 'JS OS Marketing' }));
    const updated = await runInTx(committed, (scope) =>
      changeAgentStatusWithStore(
        storeFrom(scope),
        { id: 'a1', organizationId: 'org-1', status: 'PAUSED' },
        now,
        actor,
      ),
    );
    assert.equal(updated.status, 'PAUSED');
    assert.equal(committed.events.length, 1);
    assert.equal(committed.events[0]?.eventType, AGENT_EVENT_TYPES.statusChanged);
    assert.equal(committed.events[0]?.sourceType, 'USER');
    assert.equal(committed.events[0]?.sourceId, null);
    assert.deepEqual(committed.events[0]?.metadata, {
      agentDefinitionId: 'a1',
      agentSlug: 'marketing',
      previousStatus: 'ACTIVE',
      newStatus: 'PAUSED',
    });
  });

  it('changes PAUSED to ACTIVE and ACTIVE to DISABLED', async () => {
    const committed = emptyState();
    committed.agents.set(
      'a1',
      agent({ id: 'a1', slug: 'sales', name: 'JS OS Sales', status: 'PAUSED', role: 'SALES' }),
    );
    await runInTx(committed, (scope) =>
      changeAgentStatusWithStore(
        storeFrom(scope),
        { id: 'a1', organizationId: 'org-1', status: 'ACTIVE' },
        now,
        actor,
      ),
    );
    assert.equal(committed.agents.get('a1')?.status, 'ACTIVE');
    await runInTx(committed, (scope) =>
      changeAgentStatusWithStore(
        storeFrom(scope),
        { id: 'a1', organizationId: 'org-1', status: 'DISABLED' },
        now,
        actor,
      ),
    );
    assert.equal(committed.agents.get('a1')?.status, 'DISABLED');
    assert.equal(committed.events.length, 2);
  });

  it('does not write an event when status is unchanged', async () => {
    const committed = emptyState();
    committed.agents.set('a1', agent({ id: 'a1', slug: 'ceo', name: 'JS OS CEO', role: 'CEO' }));
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          changeAgentStatusWithStore(
            storeFrom(scope),
            { id: 'a1', organizationId: 'org-1', status: 'ACTIVE' },
            now,
            actor,
          ),
        ),
      InvalidBusinessStateInputError,
    );
    assert.equal(committed.events.length, 0);
    assert.equal(committed.agents.get('a1')?.status, 'ACTIVE');
  });

  it('does not append an event when the status mutation fails', async () => {
    const committed = emptyState();
    committed.agents.set('a1', agent({ id: 'a1', slug: 'marketing', name: 'JS OS Marketing' }));
    committed.failOnUpdate = true;
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          changeAgentStatusWithStore(
            storeFrom(scope),
            { id: 'a1', organizationId: 'org-1', status: 'PAUSED' },
            now,
            actor,
          ),
        ),
      /mutation failed/,
    );
    assert.equal(committed.agents.get('a1')?.status, 'ACTIVE');
    assert.equal(committed.events.length, 0);
  });

  it('rolls back the status mutation when the event append fails', async () => {
    const committed = emptyState();
    committed.agents.set('a1', agent({ id: 'a1', slug: 'marketing', name: 'JS OS Marketing' }));
    committed.failOnEvent = true;
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          changeAgentStatusWithStore(
            storeFrom(scope),
            { id: 'a1', organizationId: 'org-1', status: 'PAUSED' },
            now,
            actor,
          ),
        ),
      /event failed/,
    );
    assert.equal(committed.agents.get('a1')?.status, 'ACTIVE');
    assert.equal(committed.events.length, 0);
  });

  it('changes permission ceilings and appends agent.permission_changed', async () => {
    const committed = emptyState();
    committed.agents.set(
      'a1',
      agent({
        id: 'a1',
        slug: 'sales',
        name: 'JS OS Sales',
        role: 'SALES',
        permissionLevel: 'OBSERVE',
      }),
    );
    await runInTx(committed, (scope) =>
      changeAgentPermissionLevelWithStore(
        storeFrom(scope),
        { id: 'a1', organizationId: 'org-1', permissionLevel: 'RECOMMEND' },
        now,
        actor,
      ),
    );
    await runInTx(committed, (scope) =>
      changeAgentPermissionLevelWithStore(
        storeFrom(scope),
        { id: 'a1', organizationId: 'org-1', permissionLevel: 'PREPARE' },
        now,
        actor,
      ),
    );
    await runInTx(committed, (scope) =>
      changeAgentPermissionLevelWithStore(
        storeFrom(scope),
        { id: 'a1', organizationId: 'org-1', permissionLevel: 'EXECUTE' },
        now,
        actor,
      ),
    );
    assert.equal(committed.agents.get('a1')?.permissionLevel, 'EXECUTE');
    assert.equal(committed.events.length, 3);
    assert.equal(committed.events[2]?.eventType, AGENT_EVENT_TYPES.permissionChanged);
    assert.deepEqual(committed.events[2]?.metadata, {
      agentDefinitionId: 'a1',
      agentSlug: 'sales',
      previousPermissionLevel: 'PREPARE',
      newPermissionLevel: 'EXECUTE',
    });
  });

  it('does not write an event when permission level is unchanged', async () => {
    const committed = emptyState();
    committed.agents.set('a1', agent({ id: 'a1', slug: 'sales', name: 'JS OS Sales', role: 'SALES' }));
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          changeAgentPermissionLevelWithStore(
            storeFrom(scope),
            { id: 'a1', organizationId: 'org-1', permissionLevel: 'RECOMMEND' },
            now,
            actor,
          ),
        ),
      InvalidBusinessStateInputError,
    );
    assert.equal(committed.events.length, 0);
  });

  it('does not append an event when the permission mutation fails', async () => {
    const committed = emptyState();
    committed.agents.set('a1', agent({ id: 'a1', slug: 'sales', name: 'JS OS Sales', role: 'SALES' }));
    committed.failOnUpdate = true;
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          changeAgentPermissionLevelWithStore(
            storeFrom(scope),
            { id: 'a1', organizationId: 'org-1', permissionLevel: 'PREPARE' },
            now,
            actor,
          ),
        ),
      /mutation failed/,
    );
    assert.equal(committed.agents.get('a1')?.permissionLevel, 'RECOMMEND');
    assert.equal(committed.events.length, 0);
  });

  it('rolls back the permission mutation when the event append fails', async () => {
    const committed = emptyState();
    committed.agents.set('a1', agent({ id: 'a1', slug: 'sales', name: 'JS OS Sales', role: 'SALES' }));
    committed.failOnEvent = true;
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          changeAgentPermissionLevelWithStore(
            storeFrom(scope),
            { id: 'a1', organizationId: 'org-1', permissionLevel: 'PREPARE' },
            now,
            actor,
          ),
        ),
      /event failed/,
    );
    assert.equal(committed.agents.get('a1')?.permissionLevel, 'RECOMMEND');
    assert.equal(committed.events.length, 0);
  });

  it('treats other-organization agents as not found and writes no event', async () => {
    const committed = emptyState();
    committed.agents.set(
      'a1',
      agent({ id: 'a1', slug: 'marketing', name: 'Other Marketing', organizationId: 'org-other' }),
    );
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          changeAgentStatusWithStore(
            storeFrom(scope),
            { id: 'a1', organizationId: 'org-1', status: 'PAUSED' },
            now,
            actor,
          ),
        ),
      BusinessStateNotFoundError,
    );
    assert.equal(committed.agents.get('a1')?.status, 'ACTIVE');
    assert.equal(committed.events.length, 0);
  });
});
