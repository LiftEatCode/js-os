import { formatEventTypeLabel } from '../activity/constants.ts';
import { formatApprovalLabel } from '../approvals/constants.ts';
import { formatWorkLabel } from '../work/constants.ts';
import { approvalHref, formatToolLabel } from './constants.ts';
import { formatReadOnlyJson, formatToolInstant } from './format.ts';
import type {
  ToolRequestActorViewModel,
  ToolRequestDetailViewModel,
} from './tool-request-detail-view-model.ts';

export const TOOL_REQUEST_DETAIL_COPY = {
  description:
    'Inspection of a persisted ToolRequest. This page does not execute tools or decide Approvals.',
  approvalIsNotExecution:
    'Approval is authorization, not execution. An approved request is not a completed ToolExecution.',
  noApproval: 'No Approval is associated with this ToolRequest.',
  noExecutions: 'No execution attempts were recorded.',
  noProducedRecords: 'No produced business records were resolved.',
  noTimeline: 'No correlated BusinessEvents were found.',
} as const;

export type ToolRequestDetailPresentation = Readonly<{
  title: string;
  description: string;
  toolSlug: string;
  requestId: string;
  statusLabel: string;
  requestedAt: string;
  actorTypeLabel: string;
  actorLabel: string;
  requiredPermissionLabel: string;
  approvalRequirementLabel: string;
  riskLabel: string;
  idempotencyKey: string;
  authorizationLabel: string;
  denialReason: string | null;
  inputJson: string | null;
  relatedWorkItem: Readonly<{ label: string; href: string }> | null;
  relatedAgentRun: Readonly<{ label: string; href: string }> | null;
  approval: Readonly<{
    id: string;
    href: string;
    statusLabel: string;
    actionType: string;
    decisionReason: string;
  }> | null;
  executions: readonly Readonly<{
    attemptNumber: number;
    statusLabel: string;
    error: string | null;
    outputJson: string | null;
  }>[];
  producedRecords: readonly Readonly<{
    typeLabel: string;
    id: string;
    label: string;
    href: string;
  }>[];
  timeline: readonly Readonly<{
    eventTypeLabel: string;
    title: string;
    metadataJson: string | null;
  }>[];
  emptyStates: readonly string[];
}>;

export function presentToolRequestDetail(
  detail: ToolRequestDetailViewModel,
): ToolRequestDetailPresentation {
  const timeZone = detail.organization.timezone;
  const emptyStates: string[] = [];
  if (!detail.approval) {
    emptyStates.push(TOOL_REQUEST_DETAIL_COPY.noApproval);
  }
  if (detail.executions.length === 0) {
    emptyStates.push(TOOL_REQUEST_DETAIL_COPY.noExecutions);
  }
  if (detail.outcome.producedRecords.length === 0) {
    emptyStates.push(TOOL_REQUEST_DETAIL_COPY.noProducedRecords);
  }
  if (detail.timeline.length === 0) {
    emptyStates.push(TOOL_REQUEST_DETAIL_COPY.noTimeline);
  }

  return {
    title: detail.request.tool.name,
    description: TOOL_REQUEST_DETAIL_COPY.description,
    toolSlug: detail.request.tool.slug,
    requestId: detail.request.id,
    statusLabel: formatToolLabel(detail.request.status),
    requestedAt: formatToolInstant(detail.request.requestedAt, timeZone) ?? '—',
    actorTypeLabel: formatToolLabel(detail.actor.type),
    actorLabel: formatActorLabel(detail.actor),
    requiredPermissionLabel: formatToolLabel(detail.request.contract.requiredPermission),
    approvalRequirementLabel: formatToolLabel(detail.request.contract.approvalRequirement),
    riskLabel: formatToolLabel(detail.request.contract.riskLevel),
    idempotencyKey: detail.request.idempotencyKey ?? 'None',
    authorizationLabel: formatToolLabel(detail.authorization.result),
    denialReason: detail.authorization.denialReason,
    inputJson: formatReadOnlyJson(detail.request.input),
    relatedWorkItem: detail.linkedRecords.workItem
      ? {
          label: `${detail.linkedRecords.workItem.title} (${formatWorkLabel(detail.linkedRecords.workItem.status)})`,
          href: detail.linkedRecords.workItem.href,
        }
      : null,
    relatedAgentRun: detail.linkedRecords.agentRun
      ? {
          label: `${formatWorkLabel(detail.linkedRecords.agentRun.status)} · ${formatWorkLabel(detail.linkedRecords.agentRun.triggerType)}`,
          href: detail.linkedRecords.agentRun.href,
        }
      : null,
    approval: detail.approval
      ? {
          id: detail.approval.id,
          href: approvalHref(detail.approval.id),
          statusLabel: formatApprovalLabel(detail.approval.status),
          actionType: detail.approval.actionType,
          decisionReason: detail.approval.decisionReason ?? 'None',
        }
      : null,
    executions: detail.executions.map((execution) => ({
      attemptNumber: execution.attemptNumber,
      statusLabel: formatToolLabel(execution.status),
      error: execution.error,
      outputJson: formatReadOnlyJson(execution.output),
    })),
    producedRecords: detail.outcome.producedRecords.map((record) => ({
      typeLabel: formatToolLabel(record.type),
      id: record.id,
      label: record.label ?? record.id,
      href: record.href,
    })),
    timeline: detail.timeline.map((event) => ({
      eventTypeLabel: formatEventTypeLabel(event.eventType),
      title: event.title,
      metadataJson: formatReadOnlyJson(event.metadata),
    })),
    emptyStates,
  };
}

function formatActorLabel(actor: ToolRequestActorViewModel): string {
  if (actor.agent) {
    return `${actor.agent.name} (${actor.agent.slug})`;
  }
  if (actor.id) {
    return actor.id;
  }
  return 'None';
}
