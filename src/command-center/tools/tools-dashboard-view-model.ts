import type {
  ToolActorType,
  ToolApprovalRequirement,
  ToolExecutionStatus,
  ToolRequestStatus,
  ToolRequiredPermission,
  ToolRiskLevel,
} from '../../tools/types.ts';

export type ToolsDashboardViewModel = Readonly<{
  organization: Readonly<{
    id: string;
    name: string;
    timezone: string;
  }>;
  filters: Readonly<{
    status: ToolRequestStatus | null;
    toolSlug: string | null;
  }>;
  summary: ToolsDashboardSummaryViewModel;
  registeredTools: readonly RegisteredToolViewModel[];
  requests: readonly ToolRequestListItemViewModel[];
}>;

export type ToolsDashboardSummaryViewModel = Readonly<{
  registeredTools: number;
  recentRequests: number;
  waitingApproval: number;
  ready: number;
  runningExecutions: number;
  fulfilled: number;
  failed: number;
  denied: number;
}>;

export type RegisteredToolViewModel = Readonly<{
  slug: string;
  name: string;
  description: string;
  version: number;
  enabled: boolean;
  requiredPermission: ToolRequiredPermission;
  riskLevel: ToolRiskLevel;
  approvalRequirement: ToolApprovalRequirement;
}>;

export type ToolRequestListItemViewModel = Readonly<{
  id: string;
  href: string;
  toolSlug: string;
  toolName: string;
  status: ToolRequestStatus;
  actorType: ToolActorType;
  actorId: string | null;
  requestedAt: string;
  requiredPermission: ToolRequiredPermission;
  approvalRequirement: ToolApprovalRequirement;
  approvalId: string | null;
  approvalHref: string | null;
  latestExecutionStatus: ToolExecutionStatus | null;
  latestExecutionError: string | null;
}>;
