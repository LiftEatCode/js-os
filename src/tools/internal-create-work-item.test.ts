import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CreateWorkItemInput, WorkItem } from '../business-state/types.ts';
import {
  createInternalCreateWorkItemImplementation,
  internalCreateWorkItemDefinition,
  internalCreateWorkItemInputSchema,
} from './definitions/internal-create-work-item.ts';
import type { ToolExecutionContext } from './implementation.ts';

const organizationId = '11111111-1111-4111-8111-111111111111';
const workItemId = '22222222-2222-4222-8222-222222222222';
const goalId = '33333333-3333-4333-8333-333333333333';
const parentId = '44444444-4444-4444-8444-444444444444';
const assignedAgentId = '55555555-5555-4555-8555-555555555555';

const context: ToolExecutionContext = {
  organizationId,
  toolRequestId: '66666666-6666-4666-8666-666666666666',
  toolExecutionId: '77777777-7777-4777-8777-777777777777',
  actor: {
    sourceType: 'AGENT',
    sourceId: assignedAgentId,
  },
};

function workItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id: workItemId,
    organizationId,
    goalId: null,
    parentId: null,
    agentRunId: null,
    title: 'Implement Phase 3.6.3',
    description: null,
    status: 'BACKLOG',
    priority: 'HIGH',
    workType: 'ENGINEERING',
    sourceType: null,
    sourceId: null,
    assignedAgentId: null,
    dueAt: null,
    startedAt: null,
    completedAt: null,
    createdAt: Temporal.Instant.from('2026-09-13T20:00:00Z'),
    updatedAt: Temporal.Instant.from('2026-09-13T20:00:00Z'),
    ...overrides,
  };
}

describe('internal.create_work_item definition', () => {
  it('uses the Phase 3.6 contract settings', () => {
    assert.equal(internalCreateWorkItemDefinition.slug, 'internal.create_work_item');
    assert.equal(internalCreateWorkItemDefinition.version, 1);
    assert.equal(internalCreateWorkItemDefinition.enabled, true);
    assert.equal(internalCreateWorkItemDefinition.requiredPermission, 'PREPARE');
    assert.equal(internalCreateWorkItemDefinition.riskLevel, 'LOW');
    assert.equal(internalCreateWorkItemDefinition.approvalRequirement, 'NEVER');
    assert.equal(internalCreateWorkItemDefinition.persistExecution, true);
  });

  it('does not accept organization or provenance as tool input', () => {
    const result = internalCreateWorkItemInputSchema.safeParse({
      organizationId,
      title: 'Create from tool',
      priority: 'HIGH',
      workType: 'ENGINEERING',
    });
    assert.equal(result.success, false);
  });

  it('rejects invalid work-item enum values and blank titles', () => {
    assert.equal(
      internalCreateWorkItemInputSchema.safeParse({
        title: '',
        priority: 'HIGH',
        workType: 'ENGINEERING',
      }).success,
      false,
    );
    assert.equal(
      internalCreateWorkItemInputSchema.safeParse({
        title: 'Bad priority',
        priority: 'URGENT',
        workType: 'ENGINEERING',
      }).success,
      false,
    );
  });
});

describe('internal.create_work_item implementation', () => {
  it('derives organization and actor provenance from execution context', async () => {
    let receivedInput: CreateWorkItemInput | null = null;
    let receivedActor: ToolExecutionContext['actor'] | null = null;
    const implementation = createInternalCreateWorkItemImplementation(async (input, actor) => {
      receivedInput = input;
      receivedActor = actor;
      return workItem({
        organizationId: input.organizationId,
        title: input.title,
        status: input.status ?? 'BACKLOG',
        priority: input.priority,
        workType: input.workType,
        goalId: input.goalId ?? null,
        parentId: input.parentId ?? null,
        assignedAgentId: input.assignedAgentId ?? null,
      });
    });

    const output = await implementation.execute(
      {
        title: 'Implement Phase 3.6.3',
        description: 'Create the first executable internal tool.',
        status: 'READY',
        priority: 'HIGH',
        workType: 'ENGINEERING',
        goalId,
        parentId,
        assignedAgentId,
      },
      context,
    );

    assert.deepEqual(receivedInput, {
      organizationId,
      title: 'Implement Phase 3.6.3',
      description: 'Create the first executable internal tool.',
      status: 'READY',
      priority: 'HIGH',
      workType: 'ENGINEERING',
      goalId,
      parentId,
      assignedAgentId,
    });
    assert.deepEqual(receivedActor, context.actor);
    assert.deepEqual(output, {
      workItemId,
      title: 'Implement Phase 3.6.3',
      status: 'READY',
    });
  });

  it('preserves optional null link values for the business command', async () => {
    let receivedInput: CreateWorkItemInput | null = null;
    const implementation = createInternalCreateWorkItemImplementation(async (input) => {
      receivedInput = input;
      return workItem();
    });

    await implementation.execute(
      {
        title: 'Unlinked task',
        priority: 'MEDIUM',
        workType: 'TASK',
        goalId: null,
        parentId: null,
        assignedAgentId: null,
      },
      context,
    );

    assert.deepEqual(receivedInput, {
      organizationId,
      title: 'Unlinked task',
      priority: 'MEDIUM',
      workType: 'TASK',
      goalId: null,
      parentId: null,
      assignedAgentId: null,
    });
  });

  it('propagates command failures without converting them to false success', async () => {
    const implementation = createInternalCreateWorkItemImplementation(async () => {
      throw new Error('command failed');
    });

    await assert.rejects(
      implementation.execute(
        {
          title: 'Failing task',
          priority: 'LOW',
          workType: 'TASK',
        },
        context,
      ),
      /command failed/,
    );
  });
});
