import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  AgentDefinition,
  AgentRun,
  Approval,
  BusinessEvent,
  Organization,
  WorkItem,
} from '../../business-state/types.ts';
import type { ToolExecution, ToolRequest } from '../../tools/types.ts';
import type { ToolRequestDetailAggregate } from './load-tool-request-detail.ts';
import { mapToolRequestDetail } from './map-tool-request-detail.ts';

const now = Temporal.Instant.from('2026-09-16T09:00:00Z');

function organization(): Organization {
  return {
    id: 'org-1',
    name: 'JS Solutions',
    slug: 'js-solutions',
    description: null,
    timezone: 'America/Chicago',
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };
}

function request(overrides: Partial<ToolRequest> = {}): ToolRequest {
  return {
    id: 'request-1',
    organizationId: 'org-1',
    toolSlug: 'internal.create_work_item',
    toolName: 'Create Work Item',
    toolVersion: 1,
    requiredPermission: 'PREPARE',
    riskLevel: 'LOW',
    approvalRequirement: 'NEVER',
    status: 'READY',
    input: { title: 'Create it' },
    requestedByType: 'USER',
    requestedById: 'user-1',
    agentDefinitionId: null,
    agentRunId: null,
    workItemId: null,
    approvalId: null,
    idempotencyKey: 'idem-1',
    requestedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function execution(attemptNumber: number, overrides: Partial<ToolExecution> = {}): ToolExecution {
  return {
    id: `execution-${attemptNumber}`,
    organizationId: 'org-1',
    toolRequestId: 'request-1',
    attemptNumber,
    status: 'SUCCEEDED',
    output: { workItemId: 'work-produced' },
    error: null,
    startedAt: now,
    completedAt: now,
    createdAt: now,
    ...overrides,
  };
}

function approval(overrides: Partial<Approval> = {}): Approval {
  return {
    id: 'approval-1',
    organizationId: 'org-1',
    workItemId: null,
    agentRunId: null,
    actionType: 'tool.execute',
    title: 'Approve tool: Create Work Item',
    description: 'Authorize JS OS to execute the Create Work Item capability.',
    status: 'PENDING',
    riskLevel: 'LOW',
    requestedByType: 'USER',
    requestedById: 'user-1',
    requestedAt: now,
    decidedAt: null,
    decisionReason: null,
    expiresAt: null,
    payload: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function event(overrides: Partial<BusinessEvent> & Pick<BusinessEvent, 'id' | 'eventType'>): BusinessEvent {
  return {
    organizationId: 'org-1',
    sourceType: 'USER',
    sourceId: 'user-1',
    title: overrides.eventType,
    description: null,
    occurredAt: now,
    metadata: { toolRequestId: 'request-1' },
    createdAt: now,
    ...overrides,
  };
}

function aggregate(overrides: Partial<ToolRequestDetailAggregate> = {}): ToolRequestDetailAggregate {
  return {
    request: request(),
    organization: organization(),
    agentDefinition: null,
    agentRun: null,
    workItem: null,
    approval: null,
    executions: [],
    ...overrides,
  };
}

describe('mapToolRequestDetail', () => {
  it('maps a READY request without inventing execution or approval', () => {
    const result = mapToolRequestDetail({
      aggregate: aggregate(),
      producedRecords: [],
      events: [event({ id: 'ready', eventType: 'tool.ready' })],
      now,
    });

    assert.equal(result.request.status, 'READY');
    assert.equal(result.request.idempotencyKey, 'idem-1');
    assert.equal(result.authorization.result, 'ALLOWED');
    assert.equal(result.authorization.denialReason, null);
    assert.equal(result.approval, null);
    assert.deepEqual(result.executions, []);
    assert.equal(result.outcome.result, 'NOT_EXECUTED');
    assert.equal(result.actions.canExecute, false);
    assert.equal(result.actions.approval.canApprove, false);
  });

  it('maps WAITING_APPROVAL with the associated Approval and Command Center href', () => {
    const result = mapToolRequestDetail({
      aggregate: aggregate({
        request: request({
          status: 'WAITING_APPROVAL',
          approvalRequirement: 'ALWAYS',
          approvalId: 'approval-1',
        }),
        approval: approval(),
      }),
      producedRecords: [],
      events: [event({ id: 'waiting', eventType: 'tool.waiting_approval', metadata: { approvalId: 'approval-1' } })],
      now,
    });

    assert.equal(result.approval?.id, 'approval-1');
    assert.equal(result.approval?.status, 'PENDING');
    assert.equal(result.approval?.state.isApproved, false);
    assert.equal(result.timeline[0]?.links[0]?.href, '/app/approvals/approval-1');
  });

  it('surfaces denial reason from the persisted tool.denied event', () => {
    const result = mapToolRequestDetail({
      aggregate: aggregate({ request: request({ status: 'DENIED' }) }),
      producedRecords: [],
      events: [
        event({
          id: 'denied',
          eventType: 'tool.denied',
          metadata: { reason: 'APPROVAL_REJECTED', denialCode: 'ACTOR_NOT_ALLOWED' },
        }),
      ],
      now,
    });

    assert.equal(result.authorization.result, 'DENIED');
    assert.equal(result.authorization.denialReason, 'APPROVAL_REJECTED');
  });

  it('does not treat current AgentDefinition permission as historical authorization', () => {
    const agent = {
      id: 'agent-1',
      organizationId: 'org-1',
      name: 'Engineering Agent',
      slug: 'engineering',
      description: null,
      status: 'ACTIVE',
      role: 'ENGINEERING',
      permissionLevel: 'EXECUTE',
      instructions: null,
      createdAt: now,
      updatedAt: now,
    } satisfies AgentDefinition;

    const result = mapToolRequestDetail({
      aggregate: aggregate({
        request: request({
          status: 'DENIED',
          requestedByType: 'AGENT',
          requestedById: 'agent-1',
          agentDefinitionId: 'agent-1',
        }),
        agentDefinition: agent,
      }),
      producedRecords: [],
      events: [
        event({
          id: 'denied',
          eventType: 'tool.denied',
          metadata: { denialCode: 'INSUFFICIENT_PERMISSION' },
        }),
      ],
      now,
    });

    assert.equal(result.actor.agent?.permissionLevel, 'EXECUTE');
    assert.equal(result.authorization.actorPermission, 'EXECUTE');
    assert.equal(result.authorization.result, 'DENIED');
    assert.equal(result.authorization.denialReason, 'INSUFFICIENT_PERMISSION');
  });

  it('preserves execution attempt order and overlays produced-record Command Center hrefs', () => {
    const result = mapToolRequestDetail({
      aggregate: aggregate({
        request: request({ status: 'FULFILLED' }),
        executions: [
          execution(2, { status: 'SUCCEEDED' }),
          execution(1, { status: 'FAILED', output: null, error: 'Tool execution failed.' }),
        ],
      }),
      producedRecords: [
        {
          type: 'WORK_ITEM',
          id: 'work-produced',
          label: 'Created work',
          href: '/command/work/work-produced',
        },
      ],
      events: [],
      now,
    });

    assert.deepEqual(
      result.executions.map((item) => item.attemptNumber),
      [1, 2],
    );
    assert.equal(result.executions[0]?.error, 'Tool execution failed.');
    assert.equal(result.outcome.producedRecords[0]?.href, '/app/work/work-produced');
  });

  it('leaves missing optional relationships null without throwing', () => {
    const result = mapToolRequestDetail({
      aggregate: aggregate(),
      producedRecords: [],
      events: [],
      now,
    });

    assert.equal(result.approval, null);
    assert.equal(result.linkedRecords.workItem, null);
    assert.equal(result.linkedRecords.agentRun, null);
    assert.deepEqual(result.outcome.producedRecords, []);
    assert.deepEqual(result.timeline, []);
  });

  it('links contextual WorkItems and AgentRuns to existing Command Center surfaces', () => {
    const workItem = {
      id: 'context-work',
      organizationId: 'org-1',
      goalId: null,
      parentId: null,
      agentRunId: null,
      title: 'Context work',
      description: null,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      workType: 'ENGINEERING',
      sourceType: null,
      sourceId: null,
      assignedAgentId: null,
      dueAt: null,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    } satisfies WorkItem;
    const agentRun = {
      id: 'run-1',
      organizationId: 'org-1',
      agentDefinitionId: 'agent-1',
      triggerType: 'MANUAL',
      triggerReference: null,
      status: 'COMPLETED',
      startedAt: now,
      completedAt: now,
      inputSnapshot: null,
      output: null,
      error: null,
      createdAt: now,
    } satisfies AgentRun;

    const result = mapToolRequestDetail({
      aggregate: aggregate({
        request: request({ workItemId: 'context-work', agentRunId: 'run-1' }),
        workItem,
        agentRun,
      }),
      producedRecords: [],
      events: [],
      now,
    });

    assert.equal(result.linkedRecords.workItem?.href, '/app/work/context-work');
    assert.equal(result.linkedRecords.agentRun?.href, '/app/agents/agent-1');
  });
});
