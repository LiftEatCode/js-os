import type { ToolDefinition } from '../../tools/definition.ts';
import { executableToolRegistry } from '../../tools/catalog.ts';
import { listToolExecutions, type ToolExecutionListFilter } from '../../tools/executions.ts';
import { listToolRequests, type ToolRequestListFilter } from '../../tools/requests.ts';
import type { ToolExecution, ToolRequest, ToolRequestStatus } from '../../tools/types.ts';
import {
  TOOL_EXECUTION_SCAN_LIMIT,
  TOOL_REQUEST_LIST_LIMIT,
  TOOL_REQUEST_SCAN_LIMIT,
  approvalHref,
  toolRequestHref,
} from './constants.ts';
import type {
  RegisteredToolViewModel,
  ToolRequestListItemViewModel,
  ToolsDashboardSummaryViewModel,
  ToolsDashboardViewModel,
} from './tools-dashboard-view-model.ts';

export type ToolsDashboardFilter = Readonly<{
  status?: ToolRequestStatus;
  toolSlug?: string;
}>;

export type ToolsDashboardReadStore = Readonly<{
  listToolRequests(filter: ToolRequestListFilter): Promise<ToolRequest[]>;
  listToolExecutions(filter: ToolExecutionListFilter): Promise<ToolExecution[]>;
}>;

export type ToolsDashboardCatalog = Readonly<{
  listDefinitions(): readonly ToolDefinition[];
}>;

const prismaToolsDashboardReadStore: ToolsDashboardReadStore = {
  listToolRequests,
  listToolExecutions,
};

const executableToolsDashboardCatalog: ToolsDashboardCatalog = {
  listDefinitions: () => executableToolRegistry.listDefinitions(),
};

export async function loadToolsDashboardWithStore(
  store: ToolsDashboardReadStore,
  catalog: ToolsDashboardCatalog,
  organization: Readonly<{ id: string; name: string; timezone: string }>,
  filters: ToolsDashboardFilter = {},
): Promise<ToolsDashboardViewModel> {
  const organizationId = organization.id;
  const [recentRequests, filteredRequests, executions] = await Promise.all([
    store.listToolRequests({ organizationId, limit: TOOL_REQUEST_SCAN_LIMIT }),
    store.listToolRequests({
      organizationId,
      status: filters.status,
      toolSlug: filters.toolSlug,
      limit: TOOL_REQUEST_LIST_LIMIT,
    }),
    store.listToolExecutions({ organizationId, limit: TOOL_EXECUTION_SCAN_LIMIT }),
  ]);

  const scopedRecent = recentRequests.filter((request) => request.organizationId === organizationId);
  const scopedList = filteredRequests.filter((request) => request.organizationId === organizationId);
  const scopedExecutions = executions.filter((execution) => execution.organizationId === organizationId);
  const latestByRequest = latestExecutionByRequest(scopedExecutions);

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      timezone: organization.timezone,
    },
    filters: {
      status: filters.status ?? null,
      toolSlug: filters.toolSlug ?? null,
    },
    summary: summarize(catalog.listDefinitions(), scopedRecent, scopedExecutions),
    registeredTools: catalog.listDefinitions().map(toRegisteredTool),
    requests: scopedList.map((request) => toListItem(request, latestByRequest.get(request.id) ?? null)),
  };
}

export function loadToolsDashboard(
  organization: Readonly<{ id: string; name: string; timezone: string }>,
  filters: ToolsDashboardFilter = {},
): Promise<ToolsDashboardViewModel> {
  return loadToolsDashboardWithStore(
    prismaToolsDashboardReadStore,
    executableToolsDashboardCatalog,
    organization,
    filters,
  );
}

function summarize(
  definitions: readonly ToolDefinition[],
  requests: readonly ToolRequest[],
  executions: readonly ToolExecution[],
): ToolsDashboardSummaryViewModel {
  return {
    registeredTools: definitions.length,
    recentRequests: requests.length,
    waitingApproval: countStatus(requests, 'WAITING_APPROVAL'),
    ready: countStatus(requests, 'READY'),
    runningExecutions: executions.filter((execution) => execution.status === 'RUNNING').length,
    fulfilled: countStatus(requests, 'FULFILLED'),
    failed: countStatus(requests, 'FAILED'),
    denied: countStatus(requests, 'DENIED'),
  };
}

function countStatus(requests: readonly ToolRequest[], status: ToolRequestStatus): number {
  return requests.filter((request) => request.status === status).length;
}

function toRegisteredTool(definition: ToolDefinition): RegisteredToolViewModel {
  return {
    slug: definition.slug,
    name: definition.name,
    description: definition.description,
    version: definition.version,
    enabled: definition.enabled,
    requiredPermission: definition.requiredPermission,
    riskLevel: definition.riskLevel,
    approvalRequirement: definition.approvalRequirement,
  };
}

function toListItem(
  request: ToolRequest,
  latestExecution: ToolExecution | null,
): ToolRequestListItemViewModel {
  return {
    id: request.id,
    href: toolRequestHref(request.id),
    toolSlug: request.toolSlug,
    toolName: request.toolName,
    status: request.status,
    actorType: request.requestedByType,
    actorId: request.requestedById,
    requestedAt: request.requestedAt.toString(),
    requiredPermission: request.requiredPermission,
    approvalRequirement: request.approvalRequirement,
    approvalId: request.approvalId,
    approvalHref: request.approvalId ? approvalHref(request.approvalId) : null,
    latestExecutionStatus: latestExecution?.status ?? null,
    latestExecutionError: latestExecution?.error ?? null,
  };
}

function latestExecutionByRequest(
  executions: readonly ToolExecution[],
): Map<string, ToolExecution> {
  const latest = new Map<string, ToolExecution>();
  for (const execution of executions) {
    const current = latest.get(execution.toolRequestId);
    if (
      !current ||
      execution.attemptNumber > current.attemptNumber ||
      (execution.attemptNumber === current.attemptNumber && execution.id.localeCompare(current.id) > 0)
    ) {
      latest.set(execution.toolRequestId, execution);
    }
  }
  return latest;
}
