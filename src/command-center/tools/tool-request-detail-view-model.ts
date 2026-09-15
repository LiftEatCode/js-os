import type {
  AgentDefinitionStatus,
  AgentPermissionLevel,
  AgentRole,
  AgentRunStatus,
  AgentRunTriggerType,
  ApprovalRequesterType,
  ApprovalRiskLevel,
  ApprovalStatus,
  BusinessEventSourceType,
  WorkItemPriority,
  WorkItemStatus,
  WorkType,
} from '../../business-state/types.ts';
import type {
  ToolActorType,
  ToolApprovalRequirement,
  ToolExecutionStatus,
  ToolRequestStatus,
  ToolRequiredPermission,
  ToolRiskLevel,
} from '../../tools/types.ts';

/**
 * Serializable Command Center contract for a single ToolRequest forensic view.
 *
 * The request tool/contract fields are historical snapshots persisted on the
 * ToolRequest row. They must never be replaced by the current live registry
 * definition when rendering historical activity.
 */
export type ToolRequestDetailViewModel = Readonly<{
  request: ToolRequestForensicRequestViewModel;
  organization: ToolRequestOrganizationViewModel;
  actor: ToolRequestActorViewModel;
  authorization: ToolAuthorizationViewModel;
  approval: ToolApprovalViewModel | null;
  linkedRecords: Readonly<{
    workItem: LinkedWorkItemViewModel | null;
    agentRun: LinkedAgentRunViewModel | null;
  }>;
  executions: readonly ToolExecutionViewModel[];
  outcome: ToolRequestOutcomeViewModel;
  timeline: readonly ToolRequestTimelineEventViewModel[];
  actions: ToolRequestActionsViewModel;
}>;

export type ToolRequestForensicRequestViewModel = Readonly<{
  id: string;
  status: ToolRequestStatus;
  tool: Readonly<{
    slug: string;
    name: string;
    version: number;
  }>;
  contract: Readonly<{
    requiredPermission: ToolRequiredPermission;
    riskLevel: ToolRiskLevel;
    approvalRequirement: ToolApprovalRequirement;
  }>;
  input: unknown;
  idempotencyKey: string | null;
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
}>;

export type ToolRequestOrganizationViewModel = Readonly<{
  id: string;
  name: string;
  slug: string;
  timezone: string;
}>;

export type ToolRequestActorViewModel = Readonly<{
  type: ToolActorType;
  id: string | null;
  agent: Readonly<{
    id: string;
    name: string;
    slug: string;
    role: AgentRole;
    status: AgentDefinitionStatus;
    permissionLevel: AgentPermissionLevel;
  }> | null;
}>;

/**
 * Historical authorization result is intentionally separate from the agent's
 * current permissionLevel. Later mappers should prefer persisted request/event
 * evidence and must not rewrite history from the current AgentDefinition row.
 */
export type ToolAuthorizationViewModel = Readonly<{
  requiredPermission: ToolRequiredPermission;
  actorPermission: AgentPermissionLevel | null;
  result: 'ALLOWED' | 'DENIED' | 'UNKNOWN';
  denialReason: string | null;
}>;

export type ToolApprovalViewModel = Readonly<{
  id: string;
  actionType: string;
  title: string;
  description: string | null;
  status: ApprovalStatus;
  riskLevel: ApprovalRiskLevel;
  requestedBy: Readonly<{
    type: ApprovalRequesterType;
    id: string | null;
  }>;
  requestedAt: string;
  decidedAt: string | null;
  decisionReason: string | null;
  expiresAt: string | null;
  linkedWorkItemId: string | null;
  linkedAgentRunId: string | null;
  state: Readonly<{
    isPending: boolean;
    isApproved: boolean;
    isTerminal: boolean;
    isExpired: boolean;
  }>;
}>;

export type ToolExecutionViewModel = Readonly<{
  id: string;
  attemptNumber: number;
  status: ToolExecutionStatus;
  output: unknown | null;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  isTerminal: boolean;
}>;

export type LinkedWorkItemViewModel = Readonly<{
  id: string;
  title: string;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  workType: WorkType;
  goalId: string | null;
  assignedAgentId: string | null;
  createdAt: string;
  updatedAt: string;
  href: string;
}>;

export type LinkedAgentRunViewModel = Readonly<{
  id: string;
  status: AgentRunStatus;
  triggerType: AgentRunTriggerType;
  triggerReference: string | null;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  href: string;
}>;

export type ProducedRecordViewModel = Readonly<{
  type: 'WORK_ITEM';
  id: string;
  label: string | null;
  href: string;
}>;

export type ToolRequestOutcomeViewModel = Readonly<{
  latestExecutionId: string | null;
  result: 'NOT_EXECUTED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  producedRecords: readonly ProducedRecordViewModel[];
}>;

export type ToolRequestTimelineEventCategory =
  | 'REQUEST'
  | 'AUTHORIZATION'
  | 'APPROVAL'
  | 'EXECUTION'
  | 'BUSINESS_MUTATION'
  | 'FAILURE';

export type ToolRequestTimelineEventSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export type ToolRequestTimelineLink = Readonly<{
  type: 'TOOL_REQUEST' | 'TOOL_EXECUTION' | 'APPROVAL' | 'WORK_ITEM' | 'AGENT_RUN';
  id: string;
  href: string;
}>;

export type ToolRequestTimelineEventViewModel = Readonly<{
  id: string;
  occurredAt: string;
  eventType: string;
  category: ToolRequestTimelineEventCategory;
  severity: ToolRequestTimelineEventSeverity;
  title: string;
  description: string | null;
  actor: Readonly<{
    type: BusinessEventSourceType;
    id: string | null;
  }>;
  metadata: unknown | null;
  links: readonly ToolRequestTimelineLink[];
}>;

/**
 * Presentation eligibility only. Every mutation command/coordinator remains
 * responsible for authoritative authorization and lifecycle validation.
 */
export type ToolRequestActionsViewModel = Readonly<{
  canExecute: boolean;
  canCancelRequest: boolean;
  canCancelQueuedExecution: boolean;
  approval: Readonly<{
    canApprove: boolean;
    canReject: boolean;
  }>;
}>;
