import { formatToolInstant } from './format.ts';
import { formatToolLabel, toolRequestHref } from './constants.ts';
import type {
  RegisteredToolViewModel,
  ToolRequestListItemViewModel,
  ToolsDashboardViewModel,
} from './tools-dashboard-view-model.ts';

export const TOOLS_DASHBOARD_COPY = {
  description:
    'Registered capabilities and recent ToolRequest activity. This page does not execute tools or decide Approvals. Approval is not execution.',
  actorNote:
    'USER and SYSTEM are not limited by the agent permission ceiling. AGENT actors must be ACTIVE and meet the required permission.',
  noRegisteredTools: 'No tools are registered in the current catalog.',
  noRequests: 'No ToolRequests have been recorded yet.',
  noMatchingRequests: 'No ToolRequests match these filters.',
  approvalIsNotExecution: 'Approval is authorization, not execution.',
} as const;

export type ToolsDashboardPresentation = Readonly<{
  description: string;
  actorNote: string;
  summary: ToolsDashboardViewModel['summary'];
  registeredTools: readonly RegisteredToolViewModel[];
  requests: readonly Readonly<{
    id: string;
    href: string;
    toolSlug: string;
    statusLabel: string;
    actorLabel: string;
    requestedAt: string;
    requiredPermissionLabel: string;
    approvalRequirementLabel: string;
    waitingApproval: boolean;
    approvalHref: string | null;
    latestExecutionLabel: string | null;
    latestExecutionError: string | null;
  }>[];
  emptyRegisteredTools: string | null;
  emptyRequests: string | null;
}>;

export function presentToolsDashboard(
  dashboard: ToolsDashboardViewModel,
): ToolsDashboardPresentation {
  const filtered = Boolean(dashboard.filters.status || dashboard.filters.toolSlug);
  const timeZone = dashboard.organization.timezone;

  return {
    description: TOOLS_DASHBOARD_COPY.description,
    actorNote: TOOLS_DASHBOARD_COPY.actorNote,
    summary: dashboard.summary,
    registeredTools: dashboard.registeredTools,
    requests: dashboard.requests.map((request) => presentRequest(request, timeZone)),
    emptyRegisteredTools:
      dashboard.registeredTools.length === 0 ? TOOLS_DASHBOARD_COPY.noRegisteredTools : null,
    emptyRequests:
      dashboard.requests.length === 0
        ? filtered
          ? TOOLS_DASHBOARD_COPY.noMatchingRequests
          : TOOLS_DASHBOARD_COPY.noRequests
        : null,
  };
}

function presentRequest(request: ToolRequestListItemViewModel, timeZone: string) {
  return {
    id: request.id,
    href: request.href || toolRequestHref(request.id),
    toolSlug: request.toolSlug,
    statusLabel: formatToolLabel(request.status),
    actorLabel: request.actorId
      ? `${formatToolLabel(request.actorType)} · ${request.actorId}`
      : formatToolLabel(request.actorType),
    requestedAt: formatToolInstant(request.requestedAt, timeZone) ?? '—',
    requiredPermissionLabel: formatToolLabel(request.requiredPermission),
    approvalRequirementLabel: formatToolLabel(request.approvalRequirement),
    waitingApproval: request.status === 'WAITING_APPROVAL',
    approvalHref: request.approvalHref,
    latestExecutionLabel: request.latestExecutionStatus
      ? formatToolLabel(request.latestExecutionStatus)
      : null,
    latestExecutionError: request.latestExecutionError,
  };
}
