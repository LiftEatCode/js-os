/// <reference types="temporal-polyfill/types/global" />
import {
  isPendingPastExpiration,
  isTerminalApprovalStatus,
} from '../../business-state/approval-lifecycle.ts';
import type { Approval, BusinessEvent } from '../../business-state/types.ts';
import { TOOL_EVENT_TYPES } from '../../tools/events.ts';
import type { ToolRequest } from '../../tools/types.ts';
import type { ToolRequestDetailAggregate } from './load-tool-request-detail.ts';
import { mapToolExecutions } from './map-tool-executions.ts';
import { agentHref, approvalHref, workItemHref } from './constants.ts';
import type {
  ProducedRecordViewModel,
  ToolApprovalViewModel,
  ToolAuthorizationViewModel,
  ToolRequestActionsViewModel,
  ToolRequestActorViewModel,
  ToolRequestDetailViewModel,
  ToolRequestTimelineEventCategory,
  ToolRequestTimelineEventSeverity,
  ToolRequestTimelineEventViewModel,
  ToolRequestTimelineLink,
} from './tool-request-detail-view-model.ts';

const INSPECTION_ACTIONS = {
  canExecute: false,
  canCancelRequest: false,
  canCancelQueuedExecution: false,
  approval: {
    canApprove: false,
    canReject: false,
  },
} as const satisfies ToolRequestActionsViewModel;

export type ToolRequestDetailMappingInput = Readonly<{
  aggregate: ToolRequestDetailAggregate;
  producedRecords: readonly ProducedRecordViewModel[];
  events: readonly BusinessEvent[];
  now: Temporal.Instant;
}>;

/**
 * Assembles the forensic Command Center view model from persisted aggregates.
 * Does not consult the live tool registry, mutate lifecycle, or infer
 * authorization from the current AgentDefinition permission ceiling.
 */
export function mapToolRequestDetail(
  input: ToolRequestDetailMappingInput,
): ToolRequestDetailViewModel {
  const { aggregate, events, now } = input;
  const { request, organization, agentDefinition, agentRun, workItem, approval, executions } =
    aggregate;
  const mappedExecutions = mapToolExecutions(executions);
  const producedRecords = input.producedRecords;

  return {
    request: {
      id: request.id,
      status: request.status,
      tool: {
        slug: request.toolSlug,
        name: request.toolName,
        version: request.toolVersion,
      },
      contract: {
        requiredPermission: request.requiredPermission,
        riskLevel: request.riskLevel,
        approvalRequirement: request.approvalRequirement,
      },
      input: request.input,
      idempotencyKey: request.idempotencyKey,
      requestedAt: request.requestedAt.toString(),
      createdAt: request.createdAt.toString(),
      updatedAt: request.updatedAt.toString(),
    },
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      timezone: organization.timezone,
    },
    actor: mapActor(request, agentDefinition),
    authorization: mapAuthorization(request, agentDefinition?.permissionLevel ?? null, events),
    approval: approval ? mapApproval(approval, now) : null,
    linkedRecords: {
      workItem: workItem
        ? {
            id: workItem.id,
            title: workItem.title,
            status: workItem.status,
            priority: workItem.priority,
            workType: workItem.workType,
            goalId: workItem.goalId,
            assignedAgentId: workItem.assignedAgentId,
            createdAt: workItem.createdAt.toString(),
            updatedAt: workItem.updatedAt.toString(),
            href: workItemHref(workItem.id),
          }
        : null,
      agentRun: agentRun
        ? {
            id: agentRun.id,
            status: agentRun.status,
            triggerType: agentRun.triggerType,
            triggerReference: agentRun.triggerReference,
            startedAt: agentRun.startedAt.toString(),
            completedAt: agentRun.completedAt?.toString() ?? null,
            error: agentRun.error,
            href: agentHref(agentRun.agentDefinitionId),
          }
        : null,
    },
    executions: mappedExecutions.executions,
    outcome: {
      ...mappedExecutions.outcome,
      producedRecords,
    },
    timeline: events.map((event) => mapTimelineEvent(event)),
    actions: INSPECTION_ACTIONS,
  };
}

function mapActor(
  request: ToolRequest,
  agentDefinition: ToolRequestDetailAggregate['agentDefinition'],
): ToolRequestActorViewModel {
  return {
    type: request.requestedByType,
    id: request.requestedById,
    agent: agentDefinition
      ? {
          id: agentDefinition.id,
          name: agentDefinition.name,
          slug: agentDefinition.slug,
          role: agentDefinition.role,
          status: agentDefinition.status,
          permissionLevel: agentDefinition.permissionLevel,
        }
      : null,
  };
}

function mapAuthorization(
  request: ToolRequest,
  actorPermission: ToolAuthorizationViewModel['actorPermission'],
  events: readonly BusinessEvent[],
): ToolAuthorizationViewModel {
  const denialReason = denialReasonFromEvents(events);

  if (request.status === 'DENIED') {
    return {
      requiredPermission: request.requiredPermission,
      actorPermission,
      result: 'DENIED',
      denialReason,
    };
  }

  if (
    request.status === 'WAITING_APPROVAL' ||
    request.status === 'READY' ||
    request.status === 'FULFILLED' ||
    request.status === 'FAILED' ||
    request.status === 'CANCELLED'
  ) {
    return {
      requiredPermission: request.requiredPermission,
      actorPermission,
      result: 'ALLOWED',
      denialReason: null,
    };
  }

  return {
    requiredPermission: request.requiredPermission,
    actorPermission,
    result: 'UNKNOWN',
    denialReason,
  };
}

function denialReasonFromEvents(events: readonly BusinessEvent[]): string | null {
  const denied = events.find((event) => event.eventType === TOOL_EVENT_TYPES.denied);
  if (!denied) {
    return null;
  }

  const metadata = stringMetadata(denied.metadata);
  return metadata.reason ?? metadata.denialCode ?? null;
}

function mapApproval(approval: Approval, now: Temporal.Instant): ToolApprovalViewModel {
  const pastExpiration = isPendingPastExpiration(approval.status, approval.expiresAt, now);

  return {
    id: approval.id,
    actionType: approval.actionType,
    title: approval.title,
    description: approval.description,
    status: approval.status,
    riskLevel: approval.riskLevel,
    requestedBy: {
      type: approval.requestedByType,
      id: approval.requestedById,
    },
    requestedAt: approval.requestedAt.toString(),
    decidedAt: approval.decidedAt?.toString() ?? null,
    decisionReason: approval.decisionReason,
    expiresAt: approval.expiresAt?.toString() ?? null,
    linkedWorkItemId: approval.workItemId,
    linkedAgentRunId: approval.agentRunId,
    state: {
      isPending: approval.status === 'PENDING',
      isApproved: approval.status === 'APPROVED',
      isTerminal: isTerminalApprovalStatus(approval.status),
      isExpired: approval.status === 'EXPIRED' || pastExpiration,
    },
  };
}

function mapTimelineEvent(event: BusinessEvent): ToolRequestTimelineEventViewModel {
  return {
    id: event.id,
    occurredAt: event.occurredAt.toString(),
    eventType: event.eventType,
    category: categoryForEventType(event.eventType),
    severity: severityForEventType(event.eventType),
    title: event.title,
    description: event.description,
    actor: {
      type: event.sourceType,
      id: event.sourceId,
    },
    metadata: event.metadata,
    links: linksForEvent(event),
  };
}

function categoryForEventType(eventType: string): ToolRequestTimelineEventCategory {
  switch (eventType) {
    case TOOL_EVENT_TYPES.denied:
      return 'AUTHORIZATION';
    case TOOL_EVENT_TYPES.waitingApproval:
      return 'APPROVAL';
    case TOOL_EVENT_TYPES.executionQueued:
    case TOOL_EVENT_TYPES.executionStarted:
    case TOOL_EVENT_TYPES.executed:
      return 'EXECUTION';
    case TOOL_EVENT_TYPES.executionFailed:
      return 'FAILURE';
    case 'work.created':
    case 'work.status_changed':
      return 'BUSINESS_MUTATION';
    default:
      return 'REQUEST';
  }
}

function severityForEventType(eventType: string): ToolRequestTimelineEventSeverity {
  switch (eventType) {
    case TOOL_EVENT_TYPES.denied:
    case TOOL_EVENT_TYPES.executionFailed:
      return 'ERROR';
    case TOOL_EVENT_TYPES.waitingApproval:
    case TOOL_EVENT_TYPES.cancelled:
      return 'WARNING';
    case TOOL_EVENT_TYPES.executed:
    case 'work.created':
      return 'SUCCESS';
    default:
      return 'INFO';
  }
}

function linksForEvent(event: BusinessEvent): readonly ToolRequestTimelineLink[] {
  const metadata = stringMetadata(event.metadata);
  const links: ToolRequestTimelineLink[] = [];
  const seen = new Set<string>();

  const approvalId = metadata.approvalId;
  if (approvalId) {
    links.push({ type: 'APPROVAL', id: approvalId, href: approvalHref(approvalId) });
    seen.add(`APPROVAL:${approvalId}`);
  }

  const workItemId = metadata.workItemId ?? (event.eventType.startsWith('work.') ? event.sourceId : null);
  if (workItemId && !seen.has(`WORK_ITEM:${workItemId}`)) {
    links.push({ type: 'WORK_ITEM', id: workItemId, href: workItemHref(workItemId) });
  }

  return links;
}

function stringMetadata(value: unknown | null): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string') {
      result[key] = item;
    }
  }
  return result;
}
