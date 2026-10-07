import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  presentToolsDashboard,
  TOOLS_DASHBOARD_COPY,
} from './present-tools-dashboard.ts';
import type {
  ToolRequestListItemViewModel,
  ToolsDashboardViewModel,
} from './tools-dashboard-view-model.ts';

function item(overrides: Partial<ToolRequestListItemViewModel> = {}): ToolRequestListItemViewModel {
  return {
    id: 'request-1',
    href: '/app/tools/requests/request-1',
    toolSlug: 'internal.create_work_item',
    toolName: 'Create Work Item',
    status: 'READY',
    actorType: 'USER',
    actorId: 'user-1',
    requestedAt: '2026-09-16T09:00:00Z',
    requiredPermission: 'PREPARE',
    approvalRequirement: 'NEVER',
    approvalId: null,
    approvalHref: null,
    latestExecutionStatus: null,
    latestExecutionError: null,
    ...overrides,
  };
}

function dashboard(overrides: Partial<ToolsDashboardViewModel> = {}): ToolsDashboardViewModel {
  return {
    organization: { id: 'org-1', name: 'JS Solutions', timezone: 'America/Chicago' },
    filters: { status: null, toolSlug: null },
    summary: {
      registeredTools: 1,
      recentRequests: 1,
      waitingApproval: 0,
      ready: 1,
      runningExecutions: 0,
      fulfilled: 0,
      failed: 0,
      denied: 0,
    },
    registeredTools: [
      {
        slug: 'internal.create_work_item',
        name: 'Create Work Item',
        description: 'Create a WorkItem through the existing command.',
        version: 1,
        enabled: true,
        requiredPermission: 'PREPARE',
        riskLevel: 'LOW',
        approvalRequirement: 'NEVER',
      },
    ],
    requests: [item()],
    ...overrides,
  };
}

describe('presentToolsDashboard', () => {
  it('renders WAITING_APPROVAL, READY, FULFILLED, FAILED, and DENIED rows', () => {
    const presented = presentToolsDashboard(
      dashboard({
        requests: [
          item({ id: 'wait', href: '/app/tools/requests/wait', status: 'WAITING_APPROVAL' }),
          item({ id: 'ready', href: '/app/tools/requests/ready', status: 'READY' }),
          item({
            id: 'done',
            href: '/app/tools/requests/done',
            status: 'FULFILLED',
            latestExecutionStatus: 'SUCCEEDED',
          }),
          item({
            id: 'fail',
            href: '/app/tools/requests/fail',
            status: 'FAILED',
            latestExecutionStatus: 'FAILED',
            latestExecutionError: 'Tool execution failed.',
          }),
          item({ id: 'deny', href: '/app/tools/requests/deny', status: 'DENIED' }),
        ],
      }),
    );

    assert.deepEqual(
      presented.requests.map((row) => [row.statusLabel, row.href, row.waitingApproval]),
      [
        ['Waiting Approval', '/app/tools/requests/wait', true],
        ['Ready', '/app/tools/requests/ready', false],
        ['Fulfilled', '/app/tools/requests/done', false],
        ['Failed', '/app/tools/requests/fail', false],
        ['Denied', '/app/tools/requests/deny', false],
      ],
    );
    assert.equal(presented.requests[3]?.latestExecutionError, 'Tool execution failed.');
  });

  it('uses matching-filter empty copy when a status filter has no rows', () => {
    const presented = presentToolsDashboard(
      dashboard({
        filters: { status: 'FAILED', toolSlug: null },
        requests: [],
        summary: {
          registeredTools: 1,
          recentRequests: 2,
          waitingApproval: 0,
          ready: 2,
          runningExecutions: 0,
          fulfilled: 0,
          failed: 0,
          denied: 0,
        },
      }),
    );

    assert.equal(presented.emptyRequests, TOOLS_DASHBOARD_COPY.noMatchingRequests);
  });

  it('uses the empty ToolRequest copy when nothing has been recorded', () => {
    const presented = presentToolsDashboard(
      dashboard({
        requests: [],
        registeredTools: [],
        summary: {
          registeredTools: 0,
          recentRequests: 0,
          waitingApproval: 0,
          ready: 0,
          runningExecutions: 0,
          fulfilled: 0,
          failed: 0,
          denied: 0,
        },
      }),
    );

    assert.equal(presented.emptyRequests, TOOLS_DASHBOARD_COPY.noRequests);
    assert.equal(presented.emptyRegisteredTools, TOOLS_DASHBOARD_COPY.noRegisteredTools);
  });

  it('does not surface secret fields from the dashboard view model', () => {
    const presented = presentToolsDashboard(dashboard());
    const serialized = JSON.stringify(presented);

    assert.doesNotMatch(serialized, /sk-live|"apiKey"|"password"|"token"|"DATABASE_URL"|"inputSchema"/);
    assert.equal('input' in presented.requests[0]!, false);
    assert.equal('inputSchema' in presented.registeredTools[0]!, false);
    assert.match(serialized, /\/app\/tools\/requests\/request-1/);
    assert.equal(TOOLS_DASHBOARD_COPY.approvalIsNotExecution.includes('not execution'), true);
  });
});
