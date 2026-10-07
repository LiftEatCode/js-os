import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { defineTool } from '../../tools/definition.ts';
import type { ToolDefinition } from '../../tools/definition.ts';
import type { ToolExecution, ToolRequest } from '../../tools/types.ts';
import {
  loadToolsDashboardWithStore,
  type ToolsDashboardCatalog,
  type ToolsDashboardReadStore,
} from './load-tools-dashboard.ts';

const now = Temporal.Instant.from('2026-09-16T09:00:00Z');
const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';

function request(overrides: Partial<ToolRequest> = {}): ToolRequest {
  return {
    id: 'request-1',
    organizationId: ORG_ID,
    toolSlug: 'internal.create_work_item',
    toolName: 'Create Work Item',
    toolVersion: 1,
    requiredPermission: 'PREPARE',
    riskLevel: 'LOW',
    approvalRequirement: 'NEVER',
    status: 'READY',
    input: { title: 'Create it', apiKey: 'sk-live-secret' },
    requestedByType: 'USER',
    requestedById: 'user-1',
    agentDefinitionId: null,
    agentRunId: null,
    workItemId: null,
    approvalId: null,
    idempotencyKey: null,
    requestedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function execution(overrides: Partial<ToolExecution> = {}): ToolExecution {
  return {
    id: 'execution-1',
    organizationId: ORG_ID,
    toolRequestId: 'request-1',
    attemptNumber: 1,
    status: 'SUCCEEDED',
    output: { workItemId: 'work-1' },
    error: null,
    startedAt: now,
    completedAt: now,
    createdAt: now,
    ...overrides,
  };
}

function tool(slug: string, name: string): ToolDefinition {
  return defineTool({
    slug,
    name,
    description: `${name} capability.`,
    version: 1,
    enabled: true,
    requiredPermission: 'PREPARE',
    riskLevel: 'LOW',
    approvalRequirement: 'NEVER',
    persistExecution: true,
    inputSchema: z.object({ title: z.string() }).strict(),
  });
}

const organization = { id: ORG_ID, name: 'JS Solutions', timezone: 'America/Chicago' };

function store(input: {
  requests?: ToolRequest[];
  filtered?: ToolRequest[];
  executions?: ToolExecution[];
  requestCalls?: ToolRequest['organizationId'][];
} = {}): ToolsDashboardReadStore {
  return {
    async listToolRequests(filter) {
      input.requestCalls?.push(filter.organizationId);
      const rows = filter.status || filter.toolSlug ? (input.filtered ?? input.requests ?? []) : (input.requests ?? []);
      return rows.filter((row) => {
        if (filter.status && row.status !== filter.status) return false;
        if (filter.toolSlug && row.toolSlug !== filter.toolSlug) return false;
        return true;
      });
    },
    async listToolExecutions() {
      return input.executions ?? [];
    },
  };
}

function catalog(definitions: readonly ToolDefinition[] = [tool('internal.create_work_item', 'Create Work Item')]): ToolsDashboardCatalog {
  return { listDefinitions: () => definitions };
}

describe('loadToolsDashboardWithStore', () => {
  it('scopes counts, lists, and execution lookup to the requested organization', async () => {
    const requestCalls: string[] = [];
    const result = await loadToolsDashboardWithStore(
      store({
        requestCalls,
        requests: [
          request({ id: 'in-org', status: 'READY' }),
          request({ id: 'foreign', organizationId: OTHER_ORG_ID, status: 'FAILED' }),
        ],
        executions: [
          execution({ id: 'in-org-exec', toolRequestId: 'in-org' }),
          execution({
            id: 'foreign-exec',
            organizationId: OTHER_ORG_ID,
            toolRequestId: 'foreign',
            status: 'RUNNING',
          }),
        ],
      }),
      catalog(),
      organization,
    );

    assert.deepEqual(requestCalls, [ORG_ID, ORG_ID]);
    assert.equal(result.summary.recentRequests, 1);
    assert.equal(result.summary.ready, 1);
    assert.equal(result.summary.failed, 0);
    assert.equal(result.summary.runningExecutions, 0);
    assert.deepEqual(result.requests.map((item) => item.id), ['in-org']);
    assert.equal(result.requests.some((item) => item.id === 'foreign'), false);
  });

  it('computes dashboard summary counts from registered tools and recent requests', async () => {
    const result = await loadToolsDashboardWithStore(
      store({
        requests: [
          request({ id: 'wait', status: 'WAITING_APPROVAL', approvalRequirement: 'ALWAYS' }),
          request({ id: 'ready', status: 'READY' }),
          request({ id: 'done', status: 'FULFILLED' }),
          request({ id: 'fail', status: 'FAILED' }),
          request({ id: 'deny', status: 'DENIED' }),
        ],
        executions: [execution({ status: 'RUNNING', toolRequestId: 'ready', output: null })],
      }),
      catalog([
        tool('internal.create_work_item', 'Create Work Item'),
        tool('internal.update_work_status', 'Update Work Status'),
      ]),
      organization,
    );

    assert.deepEqual(result.summary, {
      registeredTools: 2,
      recentRequests: 5,
      waitingApproval: 1,
      ready: 1,
      runningExecutions: 1,
      fulfilled: 1,
      failed: 1,
      denied: 1,
    });
  });

  it('presents registered tools without schemas or invocation metadata', async () => {
    const result = await loadToolsDashboardWithStore(store(), catalog(), organization);
    assert.deepEqual(result.registeredTools, [
      {
        slug: 'internal.create_work_item',
        name: 'Create Work Item',
        description: 'Create Work Item capability.',
        version: 1,
        enabled: true,
        requiredPermission: 'PREPARE',
        riskLevel: 'LOW',
        approvalRequirement: 'NEVER',
      },
    ]);
    assert.equal('inputSchema' in result.registeredTools[0]!, false);
    assert.equal('execute' in result.registeredTools[0]!, false);
  });

  it('lists WAITING_APPROVAL requests with forensic and Approval hrefs', async () => {
    const result = await loadToolsDashboardWithStore(
      store({
        requests: [
          request({
            id: 'wait-1',
            status: 'WAITING_APPROVAL',
            approvalRequirement: 'ALWAYS',
            approvalId: 'approval-1',
          }),
        ],
      }),
      catalog(),
      organization,
    );

    assert.equal(result.requests[0]?.status, 'WAITING_APPROVAL');
    assert.equal(result.requests[0]?.href, '/app/tools/requests/wait-1');
    assert.equal(result.requests[0]?.approvalHref, '/app/approvals/approval-1');
  });

  it('filters the activity list by status while keeping unfiltered summary counts', async () => {
    const rows = [
      request({ id: 'ready', status: 'READY' }),
      request({ id: 'denied', status: 'DENIED' }),
    ];
    const result = await loadToolsDashboardWithStore(
      store({ requests: rows, filtered: [rows[1]!] }),
      catalog(),
      organization,
      { status: 'DENIED' },
    );

    assert.equal(result.filters.status, 'DENIED');
    assert.equal(result.summary.ready, 1);
    assert.equal(result.summary.denied, 1);
    assert.deepEqual(result.requests.map((item) => item.id), ['denied']);
  });

  it('filters the activity list by tool slug', async () => {
    const rows = [
      request({ id: 'create', toolSlug: 'internal.create_work_item' }),
      request({ id: 'update', toolSlug: 'internal.update_work_status' }),
    ];
    const result = await loadToolsDashboardWithStore(
      store({ requests: rows, filtered: [rows[1]!] }),
      catalog(),
      organization,
      { toolSlug: 'internal.update_work_status' },
    );

    assert.equal(result.filters.toolSlug, 'internal.update_work_status');
    assert.deepEqual(result.requests.map((item) => item.id), ['update']);
    assert.equal(result.summary.recentRequests, 2);
  });

  it('links every listed ToolRequest to the forensic detail route', async () => {
    const result = await loadToolsDashboardWithStore(
      store({ requests: [request({ id: 'request-99' })] }),
      catalog(),
      organization,
    );

    assert.equal(result.requests[0]?.href, '/app/tools/requests/request-99');
  });

  it('attaches latest execution outcome without exposing request input', async () => {
    const result = await loadToolsDashboardWithStore(
      store({
        requests: [request({ id: 'request-1', status: 'FAILED' })],
        executions: [
          execution({
            id: 'execution-1',
            attemptNumber: 1,
            status: 'FAILED',
            error: 'first',
            output: null,
          }),
          execution({
            id: 'execution-2',
            attemptNumber: 2,
            status: 'FAILED',
            error: 'Tool execution failed.',
            output: null,
          }),
        ],
      }),
      catalog(),
      organization,
    );

    assert.equal(result.requests[0]?.latestExecutionStatus, 'FAILED');
    assert.equal(result.requests[0]?.latestExecutionError, 'Tool execution failed.');
    assert.equal('input' in result.requests[0]!, false);
    assert.doesNotMatch(JSON.stringify(result), /sk-live-secret|"apiKey"|"inputSchema"/);
  });

  it('returns empty lists without throwing', async () => {
    const result = await loadToolsDashboardWithStore(store({ requests: [], executions: [] }), catalog([]), organization);
    assert.deepEqual(result.summary.registeredTools, 0);
    assert.deepEqual(result.registeredTools, []);
    assert.deepEqual(result.requests, []);
  });
});
