import type { RecordBusinessEventInput } from '../business-state/types.ts';
import type { ToolPermissionDenialCode } from './evaluate-permission.ts';
import type { ToolActorType, ToolExecution, ToolRequest } from './types.ts';

/**
 * One BusinessEvent per meaningful lifecycle outcome.
 * Creation persists the routed status and emits that outcome event
 * (`tool.ready`, `tool.waiting_approval`, or `tool.denied`) rather than a
 * separate `tool.requested` plus a routing event.
 */
export const TOOL_EVENT_TYPES = {
  denied: 'tool.denied',
  waitingApproval: 'tool.waiting_approval',
  ready: 'tool.ready',
  executionQueued: 'tool.execution_queued',
  executionStarted: 'tool.execution_started',
  executed: 'tool.executed',
  executionFailed: 'tool.execution_failed',
  cancelled: 'tool.cancelled',
} as const;

export type ToolEventMetadata = {
  toolSlug: string;
  toolVersion: string;
  toolRequestId: string;
  status: string;
  toolExecutionId?: string;
  attemptNumber?: string;
  denialCode?: ToolPermissionDenialCode;
};

export function toolEventSourceType(requestedByType: ToolActorType): 'USER' | 'AGENT' | 'SYSTEM' {
  return requestedByType;
}

function metadata(fields: ToolEventMetadata): Record<string, string> {
  const result: Record<string, string> = {
    toolSlug: fields.toolSlug,
    toolVersion: fields.toolVersion,
    toolRequestId: fields.toolRequestId,
    status: fields.status,
  };
  if (fields.toolExecutionId) {
    result.toolExecutionId = fields.toolExecutionId;
  }
  if (fields.attemptNumber) {
    result.attemptNumber = fields.attemptNumber;
  }
  if (fields.denialCode) {
    result.denialCode = fields.denialCode;
  }
  return result;
}

export function toolLifecycleEvent(input: {
  request: ToolRequest;
  eventType: string;
  title: string;
  now: Temporal.Instant;
  execution?: ToolExecution;
  denialCode?: ToolPermissionDenialCode;
}): RecordBusinessEventInput {
  return {
    organizationId: input.request.organizationId,
    eventType: input.eventType,
    sourceType: toolEventSourceType(input.request.requestedByType),
    sourceId: input.request.requestedById,
    title: input.title,
    occurredAt: input.now,
    metadata: metadata({
      toolSlug: input.request.toolSlug,
      toolVersion: String(input.request.toolVersion),
      toolRequestId: input.request.id,
      status: input.execution?.status ?? input.request.status,
      ...(input.execution
        ? {
            toolExecutionId: input.execution.id,
            attemptNumber: String(input.execution.attemptNumber),
          }
        : {}),
      ...(input.denialCode ? { denialCode: input.denialCode } : {}),
    }),
  };
}
