import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  AgentDefinition,
  AgentRun,
  Approval,
  Organization,
  WorkItem,
} from '../../business-state/types.ts';
import type { ToolExecution, ToolRequest } from '../../tools/types.ts';
import {
  loadToolRequestDetailAggregateWithStore,
  type ToolRequestDetailReadStore,
} from './load-tool-request-detail.ts';

const now = Temporal.Instant.from('2026-09-15T16:00:00Z');

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
    idempotencyKey: null,
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
    output: null,
    error: null,
    startedAt: now,
    completedAt: now,
    createdAt: now,
    ...overrides,
  };
}

const organization = {
  id: 'org-1',
  name: 'JS Solutions',
  slug: 'js-solutions',
  description: null,
  timezone: 'America/Chicago',
  status: 'ACTIVE',
  createdAt: now,
  updatedAt: now,
} satisfies Organization;

function storeFor(input: {
  request?: ToolRequest | null;
  organization?: Organization | null;
  agentDefinition?: AgentDefinition | null;
  agentRun?: AgentRun | null;
  workItem?: WorkItem | null;
  approval?: Approval | null;
  executions?: ToolExecution[];
} = {}): ToolRequestDetailReadStore {
  return {
    async getToolRequest() { return input.request === undefined ? request() : input.request; },
    async getOrganization() { return input.organization === undefined ? organization : input.organization; },
    async getAgentDefinition() { return input.agentDefinition ?? null; },
    async getAgentRun() { return input.agentRun ?? null; },
    async getWorkItem() { return input.workItem ?? null; },
    async getApproval() { return input.approval ?? null; },
    async listExecutions() { return input.executions ?? []; },
  };
}

describe('loadToolRequestDetailAggregateWithStore', () => {
  it('returns null when the request does not exist', async () => {
    const result = await loadToolRequestDetailAggregateWithStore(
      storeFor({ request: null }),
      'org-1',
      'missing',
    );
    assert.equal(result, null);
  });

  it('returns null when a store returns a cross-organization request', async () => {
    const result = await loadToolRequestDetailAggregateWithStore(
      storeFor({ request: request({ organizationId: 'org-2' }) }),
      'org-1',
      'request-1',
    );
    assert.equal(result, null);
  });

  it('preserves the persisted tool snapshot without consulting the live registry', async () => {
    const historical = request({
      toolSlug: 'internal.create_work_item',
      toolName: 'Historical Create Work Item',
      toolVersion: 1,
      requiredPermission: 'PREPARE',
      riskLevel: 'LOW',
      approvalRequirement: 'NEVER',
    });

    const result = await loadToolRequestDetailAggregateWithStore(
      storeFor({ request: historical }),
      'org-1',
      historical.id,
    );

    assert.equal(result?.request.toolName, 'Historical Create Work Item');
    assert.equal(result?.request.toolVersion, 1);
    assert.equal(result?.request.requiredPermission, 'PREPARE');
  });

  it('sorts execution attempts and filters mismatched request/org rows defensively', async () => {
    const result = await loadToolRequestDetailAggregateWithStore(
      storeFor({
        executions: [
          execution(3),
          execution(1),
          execution(2),
          execution(4, { organizationId: 'org-2' }),
          execution(5, { toolRequestId: 'request-other' }),
        ],
      }),
      'org-1',
      'request-1',
    );

    assert.deepEqual(result?.executions.map((item) => item.attemptNumber), [1, 2, 3]);
  });

  it('does not query optional relations when their ids are null', async () => {
    let optionalLookups = 0;
    const store = storeFor();
    const countingStore: ToolRequestDetailReadStore = {
      ...store,
      async getAgentDefinition(...args) { optionalLookups += 1; return store.getAgentDefinition(...args); },
      async getAgentRun(...args) { optionalLookups += 1; return store.getAgentRun(...args); },
      async getWorkItem(...args) { optionalLookups += 1; return store.getWorkItem(...args); },
      async getApproval(...args) { optionalLookups += 1; return store.getApproval(...args); },
    };

    const result = await loadToolRequestDetailAggregateWithStore(
      countingStore,
      'org-1',
      'request-1',
    );

    assert.ok(result);
    assert.equal(optionalLookups, 0);
  });

  it('drops a cross-organization optional relation returned by an alternate store', async () => {
    const foreignWorkItem = {
      id: 'work-1',
      organizationId: 'org-2',
    } as WorkItem;

    const result = await loadToolRequestDetailAggregateWithStore(
      storeFor({
        request: request({ workItemId: 'work-1' }),
        workItem: foreignWorkItem,
      }),
      'org-1',
      'request-1',
    );

    assert.equal(result?.workItem, null);
  });
});
