import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import type {
  AgentDefinition,
  AgentRun,
  RecordBusinessEventInput,
  WorkItem,
} from '../business-state/types.ts';
import { defineTool } from './definition.ts';
import {
  createAgentToolActor,
  createSystemToolActor,
  createUserToolActor,
} from './evaluate-permission.ts';
import {
  InvalidToolInputError,
  InvalidToolTransitionError,
  ToolIdempotencyConflictError,
} from './errors.ts';
import { TOOL_EVENT_TYPES } from './events.ts';
import {
  cancelQueuedToolExecutionWithStore,
  completeToolExecutionWithStore,
  createToolExecutionAttemptWithStore,
  failToolExecutionWithStore,
  markToolExecutionRunningWithStore,
} from './executions.ts';
import type { ToolExecutionCompletionFields } from './execution-persistence.ts';
import type { ToolLifecycleStore } from './lifecycle-store.ts';
import { requestToolUseWithStore } from './request-tool.ts';
import { cancelToolRequestWithStore } from './requests.ts';
import type { CreateToolRequestRecordInput } from './request-persistence.ts';
import type { ToolExecution, ToolExecutionStatus, ToolRequest, ToolRequestStatus } from './types.ts';
import * as toolsPublicApi from './index.ts';

const now = Temporal.Instant.from('2026-09-01T18:00:00Z');

type MemoryState = {
  organizations: Set<string>;
  agents: Map<string, AgentDefinition>;
  runs: Map<string, AgentRun>;
  workItems: Map<string, WorkItem>;
  requests: Map<string, ToolRequest>;
  executions: Map<string, ToolExecution>;
  events: RecordBusinessEventInput[];
  nextId: number;
};

function emptyState(): MemoryState {
  return {
    organizations: new Set(['org-1']),
    agents: new Map(),
    runs: new Map(),
    workItems: new Map(),
    requests: new Map(),
    executions: new Map(),
    events: [],
    nextId: 1,
  };
}

function memoryStore(state: MemoryState): ToolLifecycleStore {
  return {
    async getOrganizationById(id) {
      return state.organizations.has(id) ? { id } : null;
    },
    async getAgentDefinitionById(id) {
      return state.agents.get(id) ?? null;
    },
    async getAgentRunById(id) {
      return state.runs.get(id) ?? null;
    },
    async getWorkItemById(id) {
      return state.workItems.get(id) ?? null;
    },
    async getToolRequestById(id) {
      return state.requests.get(id) ?? null;
    },
    async findToolRequestByIdempotency(organizationId, toolSlug, idempotencyKey) {
      return (
        [...state.requests.values()].find(
          (request) =>
            request.organizationId === organizationId &&
            request.toolSlug === toolSlug &&
            request.idempotencyKey === idempotencyKey,
        ) ?? null
      );
    },
    async createToolRequest(input: CreateToolRequestRecordInput) {
      const created: ToolRequest = {
        id: `req-${state.nextId++}`,
        organizationId: input.organizationId,
        toolSlug: input.toolSlug,
        toolName: input.toolName,
        toolVersion: input.toolVersion,
        requiredPermission: input.requiredPermission,
        riskLevel: input.riskLevel,
        approvalRequirement: input.approvalRequirement,
        status: input.status,
        input: input.input,
        requestedByType: input.requestedByType,
        requestedById: input.requestedById,
        agentDefinitionId: input.agentDefinitionId,
        agentRunId: input.agentRunId,
        workItemId: input.workItemId,
        approvalId: null,
        idempotencyKey: input.idempotencyKey,
        requestedAt: now,
        createdAt: now,
        updatedAt: now,
      };
      state.requests.set(created.id, created);
      return created;
    },
    async transitionToolRequestStatus(id, from, to) {
      const existing = state.requests.get(id);
      if (!existing || existing.status !== from) {
        throw new InvalidToolTransitionError(
          `ToolRequest cannot transition from ${existing?.status ?? 'missing'} to ${to}.`,
        );
      }
      const updated = { ...existing, status: to as ToolRequestStatus, updatedAt: now };
      state.requests.set(id, updated);
      return updated;
    },
    async getToolExecutionById(id) {
      return state.executions.get(id) ?? null;
    },
    async listToolExecutionsForRequest(toolRequestId) {
      return [...state.executions.values()]
        .filter((execution) => execution.toolRequestId === toolRequestId)
        .toSorted((left, right) => left.attemptNumber - right.attemptNumber);
    },
    async nextAttemptNumber(toolRequestId) {
      const latest = [...state.executions.values()]
        .filter((execution) => execution.toolRequestId === toolRequestId)
        .reduce((max, execution) => Math.max(max, execution.attemptNumber), 0);
      return latest + 1;
    },
    async createToolExecution(input) {
      const created: ToolExecution = {
        id: `exec-${state.nextId++}`,
        organizationId: input.organizationId,
        toolRequestId: input.toolRequestId,
        attemptNumber: input.attemptNumber,
        status: 'QUEUED',
        output: null,
        error: null,
        startedAt: null,
        completedAt: null,
        createdAt: now,
      };
      state.executions.set(created.id, created);
      return created;
    },
    async transitionToolExecutionStatus(
      id,
      from,
      to,
      fields: ToolExecutionCompletionFields,
    ) {
      const existing = state.executions.get(id);
      if (!existing || existing.status !== from) {
        throw new InvalidToolTransitionError(
          `ToolExecution cannot transition from ${existing?.status ?? 'missing'} to ${to}.`,
        );
      }
      const updated: ToolExecution = {
        ...existing,
        status: to as ToolExecutionStatus,
        output: fields.output === undefined ? existing.output : fields.output,
        error: fields.error === undefined ? existing.error : fields.error,
        startedAt: fields.startedAt === undefined ? existing.startedAt : fields.startedAt,
        completedAt: fields.completedAt,
      };
      state.executions.set(id, updated);
      return updated;
    },
    async recordEvent(input) {
      state.events.push(input);
    },
  };
}

function readyTool(overrides?: { persistExecution?: boolean; enabled?: boolean }) {
  return defineTool({
    slug: 'test.ready_action',
    name: 'Ready Action',
    description: 'Test tool that routes to READY.',
    version: 1,
    enabled: overrides?.enabled ?? true,
    requiredPermission: 'PREPARE',
    riskLevel: 'LOW',
    approvalRequirement: 'NEVER',
    persistExecution: overrides?.persistExecution ?? true,
    inputSchema: z.object({ title: z.string().min(1) }),
  });
}

function approvalTool() {
  return defineTool({
    slug: 'test.approval_action',
    name: 'Approval Action',
    description: 'Test tool that routes to WAITING_APPROVAL.',
    version: 1,
    enabled: true,
    requiredPermission: 'PREPARE',
    riskLevel: 'MEDIUM',
    approvalRequirement: 'ALWAYS',
    persistExecution: true,
    inputSchema: z.object({ title: z.string().min(1) }),
  });
}

function agentDefinition(
  overrides: Partial<AgentDefinition> & Pick<AgentDefinition, 'id' | 'permissionLevel'>,
): AgentDefinition {
  return {
    organizationId: 'org-1',
    name: 'Test Agent',
    slug: 'test-agent',
    description: null,
    status: 'ACTIVE',
    role: 'GENERAL',
    instructions: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function workItem(id: string, organizationId: string): WorkItem {
  return {
    id,
    organizationId,
    goalId: null,
    parentId: null,
    agentRunId: null,
    title: 'Linked work',
    description: null,
    status: 'BACKLOG',
    priority: 'MEDIUM',
    workType: 'TASK',
    sourceType: null,
    sourceId: null,
    assignedAgentId: null,
    dueAt: null,
    startedAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function agentRun(
  overrides: Pick<AgentRun, 'id' | 'organizationId' | 'agentDefinitionId'>,
): AgentRun {
  return {
    triggerType: 'MANUAL',
    triggerReference: null,
    status: 'QUEUED',
    startedAt: now,
    completedAt: null,
    inputSnapshot: null,
    output: null,
    error: null,
    createdAt: now,
    ...overrides,
  };
}

describe('requestToolUseWithStore', () => {
  it('rejects invalid input without creating a ToolRequest', async () => {
    const state = emptyState();
    const store = memoryStore(state);
    await assert.rejects(
      () =>
        requestToolUseWithStore(
          store,
          {
            organizationId: 'org-1',
            actor: createUserToolActor(),
            definition: readyTool(),
            input: {},
          },
          now,
        ),
      InvalidToolInputError,
    );
    assert.equal(state.requests.size, 0);
    assert.equal(state.events.length, 0);
  });

  it('rejects persistExecution=false without persisting', async () => {
    const state = emptyState();
    const store = memoryStore(state);
    await assert.rejects(
      () =>
        requestToolUseWithStore(
          store,
          {
            organizationId: 'org-1',
            actor: createUserToolActor(),
            definition: readyTool({ persistExecution: false }),
            input: { title: 'ok' },
          },
          now,
        ),
      (error: unknown) =>
        error instanceof InvalidToolInputError &&
        error.message.includes('persistExecution=true'),
    );
    assert.equal(state.requests.size, 0);
  });

  it('persists parsed input and routes allowed NEVER tools to READY', async () => {
    const state = emptyState();
    const store = memoryStore(state);
    const request = await requestToolUseWithStore(
      store,
      {
        organizationId: 'org-1',
        actor: createUserToolActor('owner'),
        definition: readyTool(),
        input: { title: 'Ship', extra: true },
      },
      now,
    );
    assert.equal(request.status, 'READY');
    assert.deepEqual(request.input, { title: 'Ship' });
    assert.equal(request.toolSlug, 'test.ready_action');
    assert.equal(request.toolName, 'Ready Action');
    assert.equal(request.toolVersion, 1);
    assert.equal(request.requestedByType, 'USER');
    assert.equal(request.requestedById, 'owner');
    assert.equal(request.agentDefinitionId, null);
    assert.equal(request.approvalId, null);
    assert.equal(state.events[0]?.eventType, TOOL_EVENT_TYPES.ready);
  });

  it('routes ALWAYS tools to WAITING_APPROVAL without an Approval row', async () => {
    const state = emptyState();
    const store = memoryStore(state);
    const request = await requestToolUseWithStore(
      store,
      {
        organizationId: 'org-1',
        actor: createSystemToolActor(),
        definition: approvalTool(),
        input: { title: 'Needs review' },
      },
      now,
    );
    assert.equal(request.status, 'WAITING_APPROVAL');
    assert.equal(request.approvalId, null);
    assert.equal(request.requestedByType, 'SYSTEM');
    assert.equal(request.requestedById, null);
    assert.equal(state.events[0]?.eventType, TOOL_EVENT_TYPES.waitingApproval);
  });

  it('persists DENIED when permission evaluation denies, with zero executions', async () => {
    const state = emptyState();
    state.agents.set(
      'agent-finance',
      agentDefinition({ id: 'agent-finance', permissionLevel: 'OBSERVE' }),
    );
    const store = memoryStore(state);
    const request = await requestToolUseWithStore(
      store,
      {
        organizationId: 'org-1',
        actor: createAgentToolActor({
          id: 'agent-finance',
          status: 'ACTIVE',
          permissionLevel: 'EXECUTE',
        }),
        definition: readyTool(),
        input: { title: 'Denied' },
      },
      now,
    );
    assert.equal(request.status, 'DENIED');
    assert.equal(request.agentDefinitionId, 'agent-finance');
    assert.equal(request.requestedByType, 'AGENT');
    assert.equal(request.requestedById, 'agent-finance');
    assert.equal(state.executions.size, 0);
    assert.equal(state.events[0]?.eventType, TOOL_EVENT_TYPES.denied);
    assert.equal(
      (state.events[0]?.metadata as { denialCode?: string } | null)?.denialCode,
      'INSUFFICIENT_PERMISSION',
    );
  });

  it('returns the existing request for the same idempotency key and logical request', async () => {
    const state = emptyState();
    const store = memoryStore(state);
    const input = {
      organizationId: 'org-1',
      actor: createUserToolActor(),
      definition: readyTool(),
      input: { title: 'Same' },
      idempotencyKey: 'key-1',
    };
    const first = await requestToolUseWithStore(store, input, now);
    const second = await requestToolUseWithStore(store, input, now);
    assert.equal(second.id, first.id);
    assert.equal(state.requests.size, 1);
    assert.equal(state.events.length, 1);
  });

  it('rejects an idempotency key reused for a different logical request', async () => {
    const state = emptyState();
    const store = memoryStore(state);
    await requestToolUseWithStore(
      store,
      {
        organizationId: 'org-1',
        actor: createUserToolActor(),
        definition: readyTool(),
        input: { title: 'First' },
        idempotencyKey: 'key-1',
      },
      now,
    );
    await assert.rejects(
      () =>
        requestToolUseWithStore(
          store,
          {
            organizationId: 'org-1',
            actor: createUserToolActor(),
            definition: readyTool(),
            input: { title: 'Second' },
            idempotencyKey: 'key-1',
          },
          now,
        ),
      ToolIdempotencyConflictError,
    );
    assert.equal(state.requests.size, 1);
  });

  it('rejects cross-organization WorkItem and AgentRun references', async () => {
    const state = emptyState();
    state.workItems.set('wi-other', workItem('wi-other', 'org-other'));
    state.runs.set(
      'run-other',
      agentRun({ id: 'run-other', organizationId: 'org-other', agentDefinitionId: 'agent-1' }),
    );
    const store = memoryStore(state);
    await assert.rejects(
      () =>
        requestToolUseWithStore(
          store,
          {
            organizationId: 'org-1',
            actor: createUserToolActor(),
            definition: readyTool(),
            input: { title: 'Work' },
            workItemId: 'wi-other',
          },
          now,
        ),
      InvalidToolInputError,
    );
    await assert.rejects(
      () =>
        requestToolUseWithStore(
          store,
          {
            organizationId: 'org-1',
            actor: createUserToolActor(),
            definition: readyTool(),
            input: { title: 'Run' },
            agentRunId: 'run-other',
          },
          now,
        ),
      InvalidToolInputError,
    );
    assert.equal(state.requests.size, 0);
  });

  it('requires AGENT AgentRuns to belong to the requesting AgentDefinition', async () => {
    const state = emptyState();
    state.agents.set(
      'agent-1',
      agentDefinition({ id: 'agent-1', permissionLevel: 'PREPARE' }),
    );
    state.agents.set(
      'agent-2',
      agentDefinition({ id: 'agent-2', permissionLevel: 'PREPARE' }),
    );
    state.runs.set(
      'run-2',
      agentRun({ id: 'run-2', organizationId: 'org-1', agentDefinitionId: 'agent-2' }),
    );
    const store = memoryStore(state);
    await assert.rejects(
      () =>
        requestToolUseWithStore(
          store,
          {
            organizationId: 'org-1',
            actor: createAgentToolActor({
              id: 'agent-1',
              status: 'ACTIVE',
              permissionLevel: 'PREPARE',
            }),
            definition: readyTool(),
            input: { title: 'Run mismatch' },
            agentRunId: 'run-2',
          },
          now,
        ),
      InvalidToolInputError,
    );
  });
});

describe('ToolExecution lifecycle', () => {
  async function readyRequest(store: ToolLifecycleStore) {
    return requestToolUseWithStore(
      store,
      {
        organizationId: 'org-1',
        actor: createUserToolActor(),
        definition: readyTool(),
        input: { title: 'Go' },
      },
      now,
    );
  }

  it('creates attempt number 1 as QUEUED', async () => {
    const state = emptyState();
    const store = memoryStore(state);
    const request = await readyRequest(store);
    const execution = await createToolExecutionAttemptWithStore(store, request.id, now);
    assert.equal(execution.attemptNumber, 1);
    assert.equal(execution.status, 'QUEUED');
    assert.equal(execution.startedAt, null);
    assert.equal(execution.completedAt, null);
    assert.equal(state.events.at(-1)?.eventType, TOOL_EVENT_TYPES.executionQueued);
  });

  it('transitions QUEUED → RUNNING → SUCCEEDED and fulfills the request', async () => {
    const state = emptyState();
    const store = memoryStore(state);
    const request = await readyRequest(store);
    const queued = await createToolExecutionAttemptWithStore(store, request.id, now);
    const running = await markToolExecutionRunningWithStore(store, queued.id, now);
    assert.equal(running.status, 'RUNNING');
    assert.equal(running.startedAt?.toString(), now.toString());
    assert.equal(running.completedAt, null);
    const succeeded = await completeToolExecutionWithStore(
      store,
      running.id,
      { ok: true },
      now,
    );
    assert.equal(succeeded.status, 'SUCCEEDED');
    assert.deepEqual(succeeded.output, { ok: true });
    assert.equal(succeeded.completedAt?.toString(), now.toString());
    assert.equal(state.requests.get(request.id)?.status, 'FULFILLED');
    assert.equal(state.events.at(-1)?.eventType, TOOL_EVENT_TYPES.executed);
  });

  it('transitions RUNNING → FAILED and fails the request', async () => {
    const state = emptyState();
    const store = memoryStore(state);
    const request = await readyRequest(store);
    const queued = await createToolExecutionAttemptWithStore(store, request.id, now);
    await markToolExecutionRunningWithStore(store, queued.id, now);
    const failed = await failToolExecutionWithStore(
      store,
      queued.id,
      'adapter exploded\nSECRET=abc\nstack',
      now,
    );
    assert.equal(failed.status, 'FAILED');
    assert.equal(failed.error, 'adapter exploded');
    assert.equal(state.requests.get(request.id)?.status, 'FAILED');
    assert.equal(state.events.at(-1)?.eventType, TOOL_EVENT_TYPES.executionFailed);
  });

  it('cancels QUEUED executions and rejects RUNNING → CANCELLED', async () => {
    const state = emptyState();
    const store = memoryStore(state);
    const request = await readyRequest(store);
    const queued = await createToolExecutionAttemptWithStore(store, request.id, now);
    const cancelled = await cancelQueuedToolExecutionWithStore(store, queued.id, now);
    assert.equal(cancelled.status, 'CANCELLED');
    assert.equal(cancelled.completedAt?.toString(), now.toString());
    assert.equal(state.requests.get(request.id)?.status, 'READY');

    const again = await createToolExecutionAttemptWithStore(store, request.id, now);
    await markToolExecutionRunningWithStore(store, again.id, now);
    await assert.rejects(
      () => cancelQueuedToolExecutionWithStore(store, again.id, now),
      InvalidToolTransitionError,
    );
  });

  it('cancels a READY request and its QUEUED execution together', async () => {
    const state = emptyState();
    const store = memoryStore(state);
    const request = await readyRequest(store);
    const queued = await createToolExecutionAttemptWithStore(store, request.id, now);
    const cancelled = await cancelToolRequestWithStore(store, request.id, now);
    assert.equal(cancelled.status, 'CANCELLED');
    assert.equal(state.executions.get(queued.id)?.status, 'CANCELLED');
    assert.equal(state.events.at(-1)?.eventType, TOOL_EVENT_TYPES.cancelled);
  });

  it('rejects request cancellation while an execution is RUNNING', async () => {
    const state = emptyState();
    const store = memoryStore(state);
    const request = await readyRequest(store);
    const queued = await createToolExecutionAttemptWithStore(store, request.id, now);
    await markToolExecutionRunningWithStore(store, queued.id, now);
    await assert.rejects(
      () => cancelToolRequestWithStore(store, request.id, now),
      InvalidToolTransitionError,
    );
    assert.equal(state.requests.get(request.id)?.status, 'READY');
  });

  it('does not create attempts for terminal or pre-ready requests', async () => {
    const state = emptyState();
    const store = memoryStore(state);
    const waiting = await requestToolUseWithStore(
      store,
      {
        organizationId: 'org-1',
        actor: createUserToolActor(),
        definition: approvalTool(),
        input: { title: 'Wait' },
      },
      now,
    );
    await assert.rejects(
      () => createToolExecutionAttemptWithStore(store, waiting.id, now),
      InvalidToolTransitionError,
    );

    const denied = await requestToolUseWithStore(
      store,
      {
        organizationId: 'org-1',
        actor: createUserToolActor(),
        definition: readyTool({ enabled: false }),
        input: { title: 'Off' },
      },
      now,
    );
    assert.equal(denied.status, 'DENIED');
    await assert.rejects(
      () => createToolExecutionAttemptWithStore(store, denied.id, now),
      InvalidToolTransitionError,
    );

    const ready = await readyRequest(store);
    const queued = await createToolExecutionAttemptWithStore(store, ready.id, now);
    await markToolExecutionRunningWithStore(store, queued.id, now);
    await completeToolExecutionWithStore(store, queued.id, { done: true }, now);
    await assert.rejects(
      () => createToolExecutionAttemptWithStore(store, ready.id, now),
      InvalidToolTransitionError,
    );
  });
});

describe('execution-derived terminal request statuses', () => {
  async function readyRequest(store: ToolLifecycleStore) {
    return requestToolUseWithStore(
      store,
      {
        organizationId: 'org-1',
        actor: createUserToolActor(),
        definition: readyTool(),
        input: { title: 'Go' },
      },
      now,
    );
  }

  it('reaches FULFILLED only with a SUCCEEDED execution and tool.executed', async () => {
    const state = emptyState();
    const store = memoryStore(state);
    const request = await readyRequest(store);
    const queued = await createToolExecutionAttemptWithStore(store, request.id, now);
    await markToolExecutionRunningWithStore(store, queued.id, now);
    await completeToolExecutionWithStore(store, queued.id, { ok: true }, now);

    const fulfilled = state.requests.get(request.id);
    const executions = await store.listToolExecutionsForRequest(request.id);
    assert.equal(fulfilled?.status, 'FULFILLED');
    assert.equal(executions.length >= 1, true);
    assert.equal(executions.some((execution) => execution.status === 'SUCCEEDED'), true);
    assert.equal(
      executions.find((execution) => execution.id === queued.id)?.status,
      'SUCCEEDED',
    );
    assert.equal(
      state.events.some((event) => event.eventType === TOOL_EVENT_TYPES.executed),
      true,
    );
  });

  it('reaches FAILED only with a FAILED execution and tool.execution_failed', async () => {
    const state = emptyState();
    const store = memoryStore(state);
    const request = await readyRequest(store);
    const queued = await createToolExecutionAttemptWithStore(store, request.id, now);
    await markToolExecutionRunningWithStore(store, queued.id, now);
    await failToolExecutionWithStore(store, queued.id, 'adapter failed', now);

    const failed = state.requests.get(request.id);
    const executions = await store.listToolExecutionsForRequest(request.id);
    assert.equal(failed?.status, 'FAILED');
    assert.equal(executions.length >= 1, true);
    assert.equal(executions.some((execution) => execution.status === 'FAILED'), true);
    assert.equal(
      executions.find((execution) => execution.id === queued.id)?.status,
      'FAILED',
    );
    assert.equal(
      state.events.some((event) => event.eventType === TOOL_EVENT_TYPES.executionFailed),
      true,
    );
  });
});

describe('public ToolRequest API', () => {
  it('does not export standalone FULFILLED or FAILED request mutations', () => {
    assert.equal('fulfillToolRequest' in toolsPublicApi, false);
    assert.equal('failToolRequest' in toolsPublicApi, false);
    assert.equal('fulfillToolRequestWithStore' in toolsPublicApi, false);
    assert.equal('failToolRequestWithStore' in toolsPublicApi, false);
    assert.equal('completeToolExecution' in toolsPublicApi, true);
    assert.equal('failToolExecution' in toolsPublicApi, true);
  });
});
