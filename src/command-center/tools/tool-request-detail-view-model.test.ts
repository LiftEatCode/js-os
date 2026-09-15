import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  ToolRequestActorViewModel,
  ToolRequestDetailViewModel,
  ToolExecutionViewModel,
} from './tool-request-detail-view-model.ts';

function execution(overrides: Partial<ToolExecutionViewModel> = {}): ToolExecutionViewModel {
  return {
    id: 'execution-1',
    attemptNumber: 1,
    status: 'SUCCEEDED',
    output: { workItemId: 'work-1' },
    error: null,
    createdAt: '2026-09-15T16:00:00.000Z',
    startedAt: '2026-09-15T16:00:01.000Z',
    completedAt: '2026-09-15T16:00:02.000Z',
    durationMs: 1000,
    isTerminal: true,
    ...overrides,
  };
}

function actor(type: 'USER' | 'SYSTEM'): ToolRequestActorViewModel {
  return { type, id: null, agent: null };
}

test('supports USER and SYSTEM actors without an AgentDefinition', () => {
  assert.deepEqual(actor('USER'), { type: 'USER', id: null, agent: null });
  assert.deepEqual(actor('SYSTEM'), { type: 'SYSTEM', id: null, agent: null });
});

test('supports AGENT actor context independently from historical authorization', () => {
  const value: ToolRequestActorViewModel = {
    type: 'AGENT',
    id: 'agent-1',
    agent: {
      id: 'agent-1',
      name: 'Engineering Agent',
      slug: 'engineering',
      role: 'ENGINEERING',
      status: 'ACTIVE',
      permissionLevel: 'EXECUTE',
    },
  };

  assert.equal(value.agent?.permissionLevel, 'EXECUTE');
});

test('execution contract supports multiple attempts and nullable output/error', () => {
  const attempts: readonly ToolExecutionViewModel[] = [
    execution({
      id: 'execution-1',
      attemptNumber: 1,
      status: 'FAILED',
      output: null,
      error: 'Tool execution failed.',
    }),
    execution({ id: 'execution-2', attemptNumber: 2 }),
  ];

  assert.equal(attempts.length, 2);
  assert.equal(attempts[0]?.output, null);
  assert.equal(attempts[0]?.error, 'Tool execution failed.');
  assert.equal(attempts[1]?.attemptNumber, 2);
});

test('forensic detail keeps contextual and produced WorkItems distinct', () => {
  const value = {
    request: {
      id: 'request-1',
      status: 'FULFILLED',
      tool: { slug: 'internal.create_work_item', name: 'Create Work Item', version: 1 },
      contract: {
        requiredPermission: 'PREPARE',
        riskLevel: 'LOW',
        approvalRequirement: 'NEVER',
      },
      input: { title: 'Created work' },
      idempotencyKey: null,
      requestedAt: '2026-09-15T16:00:00.000Z',
      createdAt: '2026-09-15T16:00:00.000Z',
      updatedAt: '2026-09-15T16:00:02.000Z',
    },
    organization: {
      id: 'org-1',
      name: 'JS Solutions',
      slug: 'js-solutions',
      timezone: 'America/Chicago',
    },
    actor: actor('USER'),
    authorization: {
      requiredPermission: 'PREPARE',
      actorPermission: null,
      result: 'ALLOWED',
      denialReason: null,
    },
    approval: null,
    linkedRecords: {
      workItem: {
        id: 'context-work',
        title: 'Context work',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        workType: 'ENGINEERING',
        goalId: null,
        assignedAgentId: null,
        createdAt: '2026-09-15T15:00:00.000Z',
        updatedAt: '2026-09-15T15:30:00.000Z',
        href: '/command/work/context-work',
      },
      agentRun: null,
    },
    executions: [execution()],
    outcome: {
      latestExecutionId: 'execution-1',
      result: 'SUCCEEDED',
      producedRecords: [
        {
          type: 'WORK_ITEM',
          id: 'work-1',
          label: 'Created work',
          href: '/command/work/work-1',
        },
      ],
    },
    timeline: [],
    actions: {
      canExecute: false,
      canCancelRequest: false,
      canCancelQueuedExecution: false,
      approval: { canApprove: false, canReject: false },
    },
  } satisfies ToolRequestDetailViewModel;

  assert.notEqual(value.linkedRecords.workItem?.id, value.outcome.producedRecords[0]?.id);
  assert.equal(typeof value.request.requestedAt, 'string');
  assert.equal(typeof value.executions[0]?.completedAt, 'string');
});
