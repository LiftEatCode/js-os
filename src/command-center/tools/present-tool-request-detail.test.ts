import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  presentToolRequestDetail,
  TOOL_REQUEST_DETAIL_COPY,
} from './present-tool-request-detail.ts';
import type {
  ToolApprovalViewModel,
  ToolExecutionViewModel,
  ToolRequestDetailViewModel,
  ToolRequestTimelineEventViewModel,
} from './tool-request-detail-view-model.ts';

function approval(overrides: Partial<ToolApprovalViewModel> = {}): ToolApprovalViewModel {
  return {
    id: 'approval-1',
    actionType: 'tool.execute',
    title: 'Approve tool: Create Work Item',
    description: null,
    status: 'PENDING',
    riskLevel: 'LOW',
    requestedBy: { type: 'USER', id: 'user-1' },
    requestedAt: '2026-09-16T09:00:00Z',
    decidedAt: null,
    decisionReason: null,
    expiresAt: null,
    linkedWorkItemId: null,
    linkedAgentRunId: null,
    state: {
      isPending: true,
      isApproved: false,
      isTerminal: false,
      isExpired: false,
    },
    ...overrides,
  };
}

function execution(overrides: Partial<ToolExecutionViewModel> = {}): ToolExecutionViewModel {
  return {
    id: 'execution-1',
    attemptNumber: 1,
    status: 'SUCCEEDED',
    output: { workItemId: 'work-1' },
    error: null,
    createdAt: '2026-09-16T09:00:00Z',
    startedAt: '2026-09-16T09:00:01Z',
    completedAt: '2026-09-16T09:00:02Z',
    durationMs: 1000,
    isTerminal: true,
    ...overrides,
  };
}

function timelineEvent(
  overrides: Partial<ToolRequestTimelineEventViewModel> = {},
): ToolRequestTimelineEventViewModel {
  return {
    id: 'event-1',
    occurredAt: '2026-09-16T09:00:00Z',
    eventType: 'tool.ready',
    category: 'REQUEST',
    severity: 'INFO',
    title: 'Tool request ready: Create Work Item',
    description: null,
    actor: { type: 'USER', id: 'user-1' },
    metadata: { toolRequestId: 'request-1' },
    links: [],
    ...overrides,
  };
}

function detail(overrides: Partial<ToolRequestDetailViewModel> = {}): ToolRequestDetailViewModel {
  return {
    request: {
      id: 'request-1',
      status: 'READY',
      tool: { slug: 'internal.create_work_item', name: 'Create Work Item', version: 1 },
      contract: {
        requiredPermission: 'PREPARE',
        riskLevel: 'LOW',
        approvalRequirement: 'NEVER',
      },
      input: { title: 'Follow up with prospect' },
      idempotencyKey: 'idem-1',
      requestedAt: '2026-09-16T09:00:00Z',
      createdAt: '2026-09-16T09:00:00Z',
      updatedAt: '2026-09-16T09:00:00Z',
    },
    organization: {
      id: 'org-1',
      name: 'JS Solutions',
      slug: 'js-solutions',
      timezone: 'America/Chicago',
    },
    actor: { type: 'USER', id: 'user-1', agent: null },
    authorization: {
      requiredPermission: 'PREPARE',
      actorPermission: null,
      result: 'ALLOWED',
      denialReason: null,
    },
    approval: null,
    linkedRecords: { workItem: null, agentRun: null },
    executions: [],
    outcome: {
      latestExecutionId: null,
      result: 'NOT_EXECUTED',
      producedRecords: [],
    },
    timeline: [],
    actions: {
      canExecute: true,
      canCancelRequest: true,
      canCancelQueuedExecution: true,
      approval: { canApprove: true, canReject: true },
    },
    ...overrides,
  };
}

describe('presentToolRequestDetail', () => {
  it('renders a READY request with snapshot fields and does not expose mutation actions', () => {
    const presented = presentToolRequestDetail(detail());

    assert.equal(presented.toolSlug, 'internal.create_work_item');
    assert.equal(presented.requestId, 'request-1');
    assert.equal(presented.statusLabel, 'Ready');
    assert.equal(presented.actorTypeLabel, 'User');
    assert.equal(presented.actorLabel, 'user-1');
    assert.equal(presented.idempotencyKey, 'idem-1');
    assert.equal(presented.requiredPermissionLabel, 'Prepare');
    assert.equal(presented.approvalRequirementLabel, 'Never');
    assert.match(presented.inputJson ?? '', /Follow up with prospect/);
    assert.equal(presented.description, TOOL_REQUEST_DETAIL_COPY.description);
    assert.equal('actions' in presented, false);
  });

  it('renders Approval information for WAITING_APPROVAL without implying execution', () => {
    const presented = presentToolRequestDetail(
      detail({
        request: {
          ...detail().request,
          status: 'WAITING_APPROVAL',
          contract: {
            requiredPermission: 'PREPARE',
            riskLevel: 'LOW',
            approvalRequirement: 'ALWAYS',
          },
        },
        approval: approval(),
      }),
    );

    assert.equal(presented.statusLabel, 'Waiting Approval');
    assert.equal(presented.approval?.id, 'approval-1');
    assert.equal(presented.approval?.statusLabel, 'Pending');
    assert.equal(presented.approval?.actionType, 'tool.execute');
    assert.equal(presented.approval?.href, '/app/approvals/approval-1');
    assert.equal(TOOL_REQUEST_DETAIL_COPY.approvalIsNotExecution.includes('not execution'), true);
  });

  it('renders the denial reason for a DENIED request', () => {
    const presented = presentToolRequestDetail(
      detail({
        request: { ...detail().request, status: 'DENIED' },
        authorization: {
          requiredPermission: 'PREPARE',
          actorPermission: null,
          result: 'DENIED',
          denialReason: 'APPROVAL_REJECTED',
        },
      }),
    );

    assert.equal(presented.statusLabel, 'Denied');
    assert.equal(presented.denialReason, 'APPROVAL_REJECTED');
  });

  it('renders FULFILLED executions and produced records with Command Center links', () => {
    const presented = presentToolRequestDetail(
      detail({
        request: { ...detail().request, status: 'FULFILLED' },
        executions: [execution()],
        outcome: {
          latestExecutionId: 'execution-1',
          result: 'SUCCEEDED',
          producedRecords: [
            {
              type: 'WORK_ITEM',
              id: 'work-1',
              label: 'Follow up with prospect',
              href: '/app/work/work-1',
            },
          ],
        },
        timeline: [
          timelineEvent({ eventType: 'tool.executed', category: 'EXECUTION', severity: 'SUCCESS' }),
          timelineEvent({
            id: 'event-2',
            eventType: 'work.created',
            category: 'BUSINESS_MUTATION',
            severity: 'SUCCESS',
            title: 'Work created',
          }),
        ],
      }),
    );

    assert.equal(presented.statusLabel, 'Fulfilled');
    assert.equal(presented.executions[0]?.attemptNumber, 1);
    assert.equal(presented.executions[0]?.statusLabel, 'Succeeded');
    assert.equal(presented.producedRecords[0]?.label, 'Follow up with prospect');
    assert.equal(presented.producedRecords[0]?.href, '/app/work/work-1');
    assert.equal(presented.timeline[0]?.eventTypeLabel, 'Tool Executed');
    assert.equal(presented.timeline[1]?.eventTypeLabel, 'Work Created');
  });

  it('renders FAILED execution error information', () => {
    const presented = presentToolRequestDetail(
      detail({
        request: { ...detail().request, status: 'FAILED' },
        executions: [
          execution({
            status: 'FAILED',
            output: null,
            error: 'Tool output is invalid for internal.create_work_item v1.',
          }),
        ],
        outcome: {
          latestExecutionId: 'execution-1',
          result: 'FAILED',
          producedRecords: [],
        },
      }),
    );

    assert.equal(presented.statusLabel, 'Failed');
    assert.equal(
      presented.executions[0]?.error,
      'Tool output is invalid for internal.create_work_item v1.',
    );
  });

  it('preserves deterministic execution attempt ordering', () => {
    const presented = presentToolRequestDetail(
      detail({
        request: { ...detail().request, status: 'FAILED' },
        executions: [
          execution({
            id: 'execution-1',
            attemptNumber: 1,
            status: 'FAILED',
            output: null,
            error: 'first-failure',
          }),
          execution({
            id: 'execution-2',
            attemptNumber: 2,
            status: 'FAILED',
            output: null,
            error: 'second-failure',
          }),
        ],
        outcome: {
          latestExecutionId: 'execution-2',
          result: 'FAILED',
          producedRecords: [],
        },
      }),
    );

    assert.deepEqual(
      presented.executions.map((item) => item.attemptNumber),
      [1, 2],
    );
    assert.deepEqual(
      presented.executions.map((item) => item.error),
      ['first-failure', 'second-failure'],
    );
  });

  it('renders safe empty states for missing optional relationships', () => {
    const presented = presentToolRequestDetail(detail());

    assert.deepEqual(presented.emptyStates, [
      TOOL_REQUEST_DETAIL_COPY.noApproval,
      TOOL_REQUEST_DETAIL_COPY.noExecutions,
      TOOL_REQUEST_DETAIL_COPY.noProducedRecords,
      TOOL_REQUEST_DETAIL_COPY.noTimeline,
    ]);
    assert.equal(presented.approval, null);
    assert.deepEqual(presented.executions, []);
    assert.deepEqual(presented.producedRecords, []);
    assert.deepEqual(presented.timeline, []);
  });

  it('does not display secret or credential fields from JSON payloads', () => {
    const presented = presentToolRequestDetail(
      detail({
        request: {
          ...detail().request,
          input: {
            title: 'Safe title',
            apiKey: 'sk-live-should-not-appear',
            password: 'hunter2',
            DATABASE_URL: 'postgres://internal',
          },
        },
        executions: [
          execution({
            output: {
              workItemId: 'work-1',
              access_token: 'tok-should-not-appear',
            },
          }),
        ],
        timeline: [
          timelineEvent({
            metadata: {
              toolRequestId: 'request-1',
              client_secret: 'secret-should-not-appear',
            },
          }),
        ],
        outcome: {
          latestExecutionId: 'execution-1',
          result: 'SUCCEEDED',
          producedRecords: [],
        },
      }),
    );

    const visible = [
      presented.inputJson,
      presented.executions[0]?.outputJson,
      presented.timeline[0]?.metadataJson,
    ].join('\n');

    assert.match(visible, /Safe title/);
    assert.match(visible, /\[redacted\]/);
    assert.doesNotMatch(visible, /sk-live-should-not-appear/);
    assert.doesNotMatch(visible, /hunter2/);
    assert.doesNotMatch(visible, /postgres:\/\/internal/);
    assert.doesNotMatch(visible, /tok-should-not-appear/);
    assert.doesNotMatch(visible, /secret-should-not-appear/);
  });
});
