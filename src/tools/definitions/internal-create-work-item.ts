import { z } from 'zod';
import { createWorkItemCommand } from '../../business-commands/work-item-commands.ts';
import type { CreateWorkItemInput, WorkItem } from '../../business-state/types.ts';
import { defineTool } from '../definition.ts';
import {
  defineToolImplementation,
  type ToolExecutionContext,
  type ToolImplementation,
} from '../implementation.ts';

const WORK_ITEM_STATUSES = [
  'BACKLOG',
  'READY',
  'IN_PROGRESS',
  'BLOCKED',
  'WAITING_APPROVAL',
  'COMPLETED',
  'CANCELLED',
] as const;

const WORK_ITEM_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

const WORK_TYPES = [
  'TASK',
  'REVIEW',
  'RESEARCH',
  'CONTENT',
  'OUTREACH',
  'ENGINEERING',
  'CLIENT_WORK',
  'ADMIN',
  'DECISION',
] as const;

export const internalCreateWorkItemInputSchema = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1).nullable().optional(),
    status: z.enum(WORK_ITEM_STATUSES).optional(),
    priority: z.enum(WORK_ITEM_PRIORITIES),
    workType: z.enum(WORK_TYPES),
    goalId: z.string().uuid().nullable().optional(),
    parentId: z.string().uuid().nullable().optional(),
    assignedAgentId: z.string().uuid().nullable().optional(),
  })
  .strict();

export const internalCreateWorkItemOutputSchema = z
  .object({
    workItemId: z.string().uuid(),
    title: z.string(),
    status: z.enum(WORK_ITEM_STATUSES),
  })
  .strict();

export const internalCreateWorkItemDefinition = defineTool({
  slug: 'internal.create_work_item',
  name: 'Create Work Item',
  description: 'Create a WorkItem within the organization executing the tool.',
  version: 1,
  enabled: true,
  requiredPermission: 'PREPARE',
  riskLevel: 'LOW',
  approvalRequirement: 'NEVER',
  persistExecution: true,
  inputSchema: internalCreateWorkItemInputSchema,
  outputSchema: internalCreateWorkItemOutputSchema,
});

export type InternalCreateWorkItemInput = z.output<typeof internalCreateWorkItemInputSchema>;
export type InternalCreateWorkItemOutput = z.output<typeof internalCreateWorkItemOutputSchema>;

type CreateWorkItemCommand = (
  input: CreateWorkItemInput,
  actor: ToolExecutionContext['actor'],
) => Promise<WorkItem>;

function toCommandInput(
  input: InternalCreateWorkItemInput,
  context: ToolExecutionContext,
): CreateWorkItemInput {
  return {
    organizationId: context.organizationId,
    title: input.title,
    priority: input.priority,
    workType: input.workType,
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.goalId !== undefined ? { goalId: input.goalId } : {}),
    ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
    ...(input.assignedAgentId !== undefined
      ? { assignedAgentId: input.assignedAgentId }
      : {}),
  };
}

/**
 * Factory exists to make the adapter independently testable while the default
 * exported implementation is wired to the real transactional business command.
 */
export function createInternalCreateWorkItemImplementation(
  command: CreateWorkItemCommand = createWorkItemCommand,
): ToolImplementation<
  typeof internalCreateWorkItemInputSchema,
  typeof internalCreateWorkItemOutputSchema
> {
  return defineToolImplementation({
    definition: internalCreateWorkItemDefinition,
    execute: async (input, context) => {
      const created = await command(toCommandInput(input, context), context.actor);
      return {
        workItemId: created.id,
        title: created.title,
        status: created.status,
      };
    },
  });
}

export const internalCreateWorkItemImplementation =
  createInternalCreateWorkItemImplementation();
