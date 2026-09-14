import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  UpdateWorkItemStatusCommandInput,
  WorkCommandActor,
} from '../business-commands/work-items.ts';
import type { WorkItem } from '../business-state/types.ts';
import {
  createInternalUpdateWorkStatusImplementation,
  internalUpdateWorkStatusDefinition,
  internalUpdateWorkStatusInputSchema,
} from './definitions/internal-update-work-status.ts';
import type { ToolExecutionContext } from './implementation.ts';

const organizationId = '11111111-1111-4111-8111-111111111111';
const workItemId = '22222222-2222-4222-8222-222222222222';
const agentId = '33333333-3333-4333-8333-333333333333';

const context: ToolExecutionContext = {
  organizationId,
  toolRequestId: '44444444-4444-4444-8444-444444444444',
  toolExecutionId: '55555555-5555-4555-8555-555555555555',
  actor: {
    sourceType: 'AGENT',
    sourceId: agentId,
  },
};

function workItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id: workItemId,
    organizationId,
    goalId: null,
    parentId: null,
    agentRunId: null,
    title: 'Implement Phase 3.6.4',
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
    createdAt: Temporal.Instant.from('2026-09-14T13:00:00Z'),
    updatedAt: Temporal.Instant.from('2026-09-14T14:00:00Z'),
    ...overrides,
  };
}

describe('internal.update_work_status definition', () => {
  it('uses the Phase 3.6 contract settings', () => {
    assert.equal(internalUpdateWorkStatusDefinition.slug, 'internal.update_work_status');
    assert.equal(internalUpdateWorkStatusDefinition.version, 1);
    assert.equal(internalUpdateWorkStatusDefinition.enabled, true);
    assert.equal(internalUpdateWorkStatusDefinition.requiredPermission, 'PREPARE');
    assert.equal(internalUpdateWorkStatusDefinition.riskLevel, 'LOW');
    assert.equal(internalUpdateWorkStatusDefinition.approvalRequirement, 'NEVER');
    assert.equal(internalUpdateWorkStatusDefinition.persistExecution, true);
  });

  it('does not accept organization or provenance as tool input', () => {
    const result = internalUpdateWorkStatusInputSchema.safeParse({
      workItemId,
      status: 'IN_PROGRESS',
      organizationId,
      actor: { sourceType: 'USER' },
    });
    assert.equal(result.success, false);
  });

  it('requires a UUID work item id and valid status', () => {
    assert.equal(
      internalUpdateWorkStatusInputSchema.safeParse({
        workItemId: 'not-a-uuid',
        status: 'IN_PROGRESS',
      }).success,
      false,
    );
    assert.equal(
      internalUpdateWorkStatusInputSchema.safeParse({
        workItemId,
        status: 'DONE',
      }).success,
      false,
    );
  });
});

describe('internal.update_work_status implementation', () => {
  it('derives organization and actor provenance from execution context', async () => {
    let receivedInput: UpdateWorkItemStatusCommandInput | null = null;
    let receivedActor: WorkCommandActor | null = null;
    const implementation = createInternalUpdateWorkStatusImplementation(
      async (input, actor) => {
        receivedInput = input;
        receivedActor = actor;
        return workItem({
          organizationId: input.organizationId,
          status: input.status,
        });
      },
    );

    const output = await implementation.execute(
      {
        workItemId,
        status: 'IN_PROGRESS',
      },
      context,
    );

    assert.deepEqual(receivedInput, {
      id: workItemId,
      organizationId,
      status: 'IN_PROGRESS',
    });
    assert.deepEqual(receivedActor, context.actor);
    assert.deepEqual(output, {
      workItemId,
      status: 'IN_PROGRESS',
    });
  });

  it('uses context organization instead of caller-controlled data', async () => {
    let receivedInput: UpdateWorkItemStatusCommandInput | null = null;
    const implementation = createInternalUpdateWorkStatusImplementation(async (input) => {
      receivedInput = input;
      return workItem({ organizationId: input.organizationId, status: input.status });
    });

    await implementation.execute({ workItemId, status: 'BLOCKED' }, context);

    assert.equal(receivedInput?.organizationId, organizationId);
    assert.equal(receivedInput?.id, workItemId);
    assert.equal(receivedInput?.status, 'BLOCKED');
  });

  it('preserves SYSTEM provenance without inventing a source id', async () => {
    let receivedActor: WorkCommandActor | null = null;
    const implementation = createInternalUpdateWorkStatusImplementation(
      async (input, actor) => {
        receivedActor = actor;
        return workItem({ organizationId: input.organizationId, status: input.status });
      },
    );

    await implementation.execute(
      { workItemId, status: 'COMPLETED' },
      {
        ...context,
        actor: { sourceType: 'SYSTEM', sourceId: null },
      },
    );

    assert.deepEqual(receivedActor, { sourceType: 'SYSTEM', sourceId: null });
  });

  it('propagates command failures so no false success is reported', async () => {
    const implementation = createInternalUpdateWorkStatusImplementation(async () => {
      throw new Error('status command failed');
    });

    await assert.rejects(
      implementation.execute({ workItemId, status: 'COMPLETED' }, context),
      /status command failed/,
    );
  });
});
