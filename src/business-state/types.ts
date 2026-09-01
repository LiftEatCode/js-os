import type { FieldOutputTypes } from '../prisma/contract.d';

export type Organization = FieldOutputTypes['public']['Organization'];
export type Goal = FieldOutputTypes['public']['Goal'];
export type WorkItem = FieldOutputTypes['public']['WorkItem'];
export type BusinessEvent = FieldOutputTypes['public']['BusinessEvent'];
export type Approval = FieldOutputTypes['public']['Approval'];
export type AgentDefinition = FieldOutputTypes['public']['AgentDefinition'];
export type AgentRun = FieldOutputTypes['public']['AgentRun'];

export type GoalStatus = Goal['status'];
export type GoalPriority = Goal['priority'];
export type GoalTimeHorizon = Goal['timeHorizon'];
export type WorkItemStatus = WorkItem['status'];
export type WorkItemPriority = WorkItem['priority'];
export type WorkType = WorkItem['workType'];
export type WorkItemSourceType = NonNullable<WorkItem['sourceType']>;
export type BusinessEventSourceType = BusinessEvent['sourceType'];
export type ApprovalStatus = Approval['status'];
export type ApprovalRiskLevel = Approval['riskLevel'];
export type ApprovalRequesterType = Approval['requestedByType'];
export type AgentDefinitionStatus = AgentDefinition['status'];
export type AgentRole = AgentDefinition['role'];
export type AgentPermissionLevel = AgentDefinition['permissionLevel'];
export type AgentRunStatus = AgentRun['status'];
export type AgentRunTriggerType = AgentRun['triggerType'];

export const JS_SOLUTIONS_SLUG = 'js-solutions';

export type CreateGoalInput = {
  organizationId: string;
  title: string;
  description?: string | null;
  status?: GoalStatus;
  priority: GoalPriority;
  timeHorizon: GoalTimeHorizon;
  targetDate?: Goal['targetDate'] | null;
  metricName?: string | null;
  metricUnit?: string | null;
  targetValue?: Goal['targetValue'] | null;
  currentValue?: Goal['currentValue'] | null;
};

export type UpdateGoalInput = {
  title?: string;
  description?: string | null;
  status?: GoalStatus;
  priority?: GoalPriority;
  timeHorizon?: GoalTimeHorizon;
  targetDate?: Goal['targetDate'] | null;
  metricName?: string | null;
  metricUnit?: string | null;
  targetValue?: Goal['targetValue'] | null;
  currentValue?: Goal['currentValue'] | null;
  completedAt?: Goal['completedAt'] | null;
};

export type GoalListFilter = {
  organizationId: string;
  status?: GoalStatus;
  priority?: GoalPriority;
  timeHorizon?: GoalTimeHorizon;
};

export type CreateWorkItemInput = {
  organizationId: string;
  title: string;
  description?: string | null;
  status?: WorkItemStatus;
  priority: WorkItemPriority;
  workType: WorkType;
  goalId?: string | null;
  parentId?: string | null;
  agentRunId?: string | null;
  sourceType?: WorkItemSourceType | null;
  sourceId?: string | null;
  assignedAgentId?: string | null;
  dueAt?: WorkItem['dueAt'] | null;
};

export type UpdateWorkItemInput = {
  title?: string;
  description?: string | null;
  status?: WorkItemStatus;
  priority?: WorkItemPriority;
  workType?: WorkType;
  goalId?: string | null;
  parentId?: string | null;
  sourceType?: WorkItemSourceType | null;
  sourceId?: string | null;
  assignedAgentId?: string | null;
  dueAt?: WorkItem['dueAt'] | null;
  startedAt?: WorkItem['startedAt'] | null;
  completedAt?: WorkItem['completedAt'] | null;
};

export type WorkItemListFilter = {
  organizationId: string;
  status?: WorkItemStatus;
  priority?: WorkItemPriority;
  workType?: WorkType;
  goalId?: string | null;
  assignedAgentId?: string | null;
  parentId?: string | null;
};

export type RecordBusinessEventInput = {
  organizationId: string;
  eventType: string;
  sourceType: BusinessEventSourceType;
  title: string;
  description?: string | null;
  sourceId?: string | null;
  occurredAt?: BusinessEvent['occurredAt'];
  metadata?: BusinessEvent['metadata'];
};

export type BusinessEventListFilter = {
  organizationId: string;
  eventType?: string;
  sourceType?: BusinessEventSourceType;
  limit?: number;
};

export type CreateApprovalRequestInput = {
  organizationId: string;
  title: string;
  actionType: string;
  riskLevel: ApprovalRiskLevel;
  requestedByType: ApprovalRequesterType;
  description?: string | null;
  workItemId?: string | null;
  agentRunId?: string | null;
  requestedById?: string | null;
  expiresAt?: Approval['expiresAt'] | null;
  payload?: Approval['payload'];
};

export type ApprovalListFilter = {
  organizationId: string;
  status?: ApprovalStatus;
  riskLevel?: ApprovalRiskLevel;
  requestedByType?: ApprovalRequesterType;
  workItemId?: string | null;
};

export type ApprovalDecisionInput = {
  decisionReason?: string | null;
};

export type AgentDefinitionListFilter = {
  organizationId: string;
  status?: AgentDefinitionStatus;
  role?: AgentRole;
};

export type CreateAgentRunInput = {
  organizationId: string;
  agentDefinitionId: string;
  triggerType: AgentRunTriggerType;
  triggerReference?: string | null;
  inputSnapshot?: AgentRun['inputSnapshot'];
};

export type AgentRunListFilter = {
  organizationId: string;
  agentDefinitionId?: string;
  status?: AgentRunStatus;
};
