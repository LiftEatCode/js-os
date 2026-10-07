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
import type { ToolRequestDetailReadStore } from './load-tool-request-detail.ts';
import type { ToolRequestEventReadStore } from './load-tool-request-events.ts';
import {
  loadToolRequestDetailViewWithStores,
  type ToolRequestDetailViewStores,
} from './load-tool-request-detail-view.ts';
import type { ToolProducedRecordReadStore } from './resolve-tool-produced-records.ts';

const now = Temporal.Instant.from('2026-09-16T09:00:00Z');
const WORK_ITEM_ID = '00000000-0000-4000-8000-000000000003';

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
    status: 'FULFILLED',
    input: { title: 'Created work' },
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
    output: { workItemId: WORK_ITEM_ID },
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

function workItem(): WorkItem {
  return {
    id: WORK_ITEM_ID,
    organizationId: 'org-1',
    goalId: null,
    parentId: null,
    agentRunId: null,
    title: 'Created work',
    description: null,
    status: 'READY',
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

function defaultEvents(): BusinessEvent[] {
  return [
    {
      id: 'event-ready',
      organizationId: 'org-1',
      eventType: 'tool.ready',
      sourceType: 'USER',
      sourceId: 'user-1',
      title: 'Tool request ready: Create Work Item',
      description: null,
      occurredAt: now,
      metadata: { toolRequestId: 'request-1' },
      createdAt: now,
    },
    {
      id: 'event-executed',
      organizationId: 'org-1',
      eventType: 'tool.executed',
      sourceType: 'USER',
      sourceId: 'user-1',
      title: 'Tool executed: Create Work Item',
      description: null,
      occurredAt: now.add({ seconds: 2 }),
      metadata: { toolRequestId: 'request-1', toolExecutionId: 'execution-1' },
      createdAt: now,
    },
    {
      id: 'event-work',
      organizationId: 'org-1',
      eventType: 'work.created',
      sourceType: 'USER',
      sourceId: WORK_ITEM_ID,
      title: 'Work created',
      description: null,
      occurredAt: now.add({ seconds: 3 }),
      metadata: { workItemId: WORK_ITEM_ID },
      createdAt: now,
    },
  ];
}

function stores(input: {
  request?: ToolRequest | null;
  organization?: Organization | null;
  agentDefinition?: AgentDefinition | null;
  agentRun?: AgentRun | null;
  workItem?: WorkItem | null;
  approval?: Approval | null;
  executions?: ToolExecution[];
  producedWorkItem?: WorkItem | null;
  events?: BusinessEvent[];
} = {}): ToolRequestDetailViewStores {
  const detail: ToolRequestDetailReadStore = {
    async getToolRequest() {
      return input.request === undefined ? request() : input.request;
    },
    async getOrganization() {
      return input.organization === undefined ? organization : input.organization;
    },
    async getAgentDefinition() {
      return input.agentDefinition ?? null;
    },
    async getAgentRun() {
      return input.agentRun ?? null;
    },
    async getWorkItem() {
      return input.workItem ?? null;
    },
    async getApproval() {
      return input.approval ?? null;
    },
    async listExecutions() {
      return input.executions ?? [execution(1)];
    },
  };
  const producedRecords: ToolProducedRecordReadStore = {
    async getWorkItem() {
      return input.producedWorkItem === undefined ? workItem() : input.producedWorkItem;
    },
  };
  const events: ToolRequestEventReadStore = {
    async listOrganizationEvents() {
      return input.events ?? defaultEvents();
    },
  };

  return { detail, producedRecords, events };
}

describe('loadToolRequestDetailViewWithStores', () => {
  it('returns null when the request is missing or not in the organization', async () => {
    assert.equal(
      await loadToolRequestDetailViewWithStores(stores({ request: null }), 'org-1', 'missing', now),
      null,
    );
    assert.equal(
      await loadToolRequestDetailViewWithStores(
        stores({ request: request({ organizationId: 'org-2' }) }),
        'org-1',
        'request-1',
        now,
      ),
      null,
    );
  });

  it('composes executions, produced records, and correlated events for a fulfilled request', async () => {
    const result = await loadToolRequestDetailViewWithStores(stores(), 'org-1', 'request-1', now);

    assert.equal(result?.request.status, 'FULFILLED');
    assert.equal(result?.executions[0]?.attemptNumber, 1);
    assert.equal(result?.outcome.producedRecords[0]?.id, WORK_ITEM_ID);
    assert.equal(result?.outcome.producedRecords[0]?.href, `/app/work/${WORK_ITEM_ID}`);
    assert.deepEqual(result?.timeline.map((item) => item.eventType), [
      'tool.ready',
      'tool.executed',
      'work.created',
    ]);
    assert.equal(result?.actions.canExecute, false);
  });
});
