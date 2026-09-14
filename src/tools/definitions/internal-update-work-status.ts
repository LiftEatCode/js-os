import { z } from 'zod';
import { updateWorkItemStatusCommand } from '../../business-commands/work-item-commands.ts';
import type {
  UpdateWorkItemStatusCommandInput,
  WorkCommandActor,
} from '../../business-commands/work-items.ts';
import type { WorkItem } from '../../business-state/types.ts';
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

export const internalUpdateWorkStatusInputSchema = z
  .object({
    workItemId: z.string().uuid(),
    status: z.enum(WORK_ITEM_STATUSES),
  })
  .strict();

export const internalUpdateWorkStatusOutputSchema = z
  .object({
    workItemId: z.string().uuid(),
    status: z.enum(WORK_ITEM_STATUSES),
  })
  .strict();

export const internalUpdateWorkStatusDefinition = defineTool({
  slug: 'internal.update_work_status',
  name: 'Update Work Status',
  description: 'Update the status of a WorkItem within the organization executing the tool.',
  version: 1,
  enabled: true,
  requiredPermission: 'PREPARE',
  riskLevel: 'LOW',
  approvalRequirement: 'NEVER',
  persistExecution: true,
  inputSchema: internalUpdateWorkStatusInputSchema,
  outputSchema: internalUpdateWorkStatusOutputSchema,
});

export type InternalUpdateWorkStatusInput = z.output<
  typeof internalUpdateWorkStatusInputSchema
>;
export type InternalUpdateWorkStatusOutput = z.output<
  typeof internalUpdateWorkStatusOutputSchema
>;

type UpdateWorkItemStatusCommand = (
  input: UpdateWorkItemStatusCommandInput,
  actor: WorkCommandActor,
) => Promise<WorkItem>;

function toCommandInput(
  input: InternalUpdateWorkStatusInput,
  context: ToolExecutionContext,
): UpdateWorkItemStatusCommandInput {
  return {
    id: input.workItemId,
    organizationId: context.organizationId,
    status: input.status,
  };
}

/**
 * Thin executable adapter over the existing transactional status command.
 * Organization and actor provenance are server-owned execution context, never
 * caller-controlled tool input. The business command remains responsible for
 * org isolation, no-op rejection, mutation, and work.status_changed emission.
 */
export function createInternalUpdateWorkStatusImplementation(
  command: UpdateWorkItemStatusCommand = updateWorkItemStatusCommand,
): ToolImplementation<
  typeof internalUpdateWorkStatusInputSchema,
  typeof internalUpdateWorkStatusOutputSchema
> {
  return defineToolImplementation({
    definition: internalUpdateWorkStatusDefinition,
    execute: async (input, context) => {
      const updated = await command(toCommandInput(input, context), context.actor);
      return {
        workItemId: updated.id,
        status: updated.status,
      };
    },
  });
}

export const internalUpdateWorkStatusImplementation =
  createInternalUpdateWorkStatusImplementation();
