/// <reference types="temporal-polyfill/types/global" />
import {
  getJsSolutionsOrganization,
  listActiveAgentDefinitions,
  listAgentDefinitions,
  listActiveGoals,
  listAgentRuns,
  listPendingApprovals,
  listRecentBusinessEvents,
  listWorkItems,
  type AgentDefinition,
  type AgentRun,
  type Approval,
  type BusinessEvent,
  type Goal,
  type Organization,
  type WorkItem,
} from '@/business-state';
import { buildOwnerAttention, isOpenWorkItem, sortOpenWorkItems } from './attention';
import { formatBusinessInstant } from './format';

const CURRENT_WORK_LIMIT = 5;
const PENDING_APPROVAL_LIMIT = 5;
const RECENT_ACTIVITY_LIMIT = 8;

export type OverviewMetric = {
  label: string;
  value: number;
  href: string;
};

export type OverviewGoalRow = {
  id: string;
  title: string;
  status: Goal['status'];
  priority: Goal['priority'];
  timeHorizon: Goal['timeHorizon'];
};

export type OverviewWorkRow = {
  id: string;
  title: string;
  status: WorkItem['status'];
  priority: WorkItem['priority'];
  workType: WorkItem['workType'];
  dueAtLabel: string | null;
};

export type OverviewApprovalRow = {
  id: string;
  title: string;
  riskLevel: Approval['riskLevel'];
  actionType: string;
  requestedAtLabel: string | null;
};

export type OverviewEventRow = {
  id: string;
  title: string;
  eventType: string;
  sourceType: BusinessEvent['sourceType'];
  occurredAtLabel: string | null;
  description: string | null;
};

export type OverviewAgentRow = {
  id: string;
  name: string;
  role: AgentDefinition['role'];
  status: AgentDefinition['status'];
  permissionLevel: AgentDefinition['permissionLevel'];
};

export type OverviewData = {
  organization: {
    name: string;
    status: Organization['status'];
    description: string | null;
    timezone: string;
  };
  metrics: OverviewMetric[];
  attention: ReturnType<typeof buildOwnerAttention>;
  goals: OverviewGoalRow[];
  work: OverviewWorkRow[];
  approvals: OverviewApprovalRow[];
  events: OverviewEventRow[];
  agents: OverviewAgentRow[];
};

export async function loadOverview(): Promise<OverviewData> {
  const organization = await getJsSolutionsOrganization();
  const organizationId = organization.id;
  const timeZone = organization.timezone;

  const [goals, workItems, pendingApprovals, events, agents, configuredAgents, failedRuns] =
    await Promise.all([
      listActiveGoals(organizationId),
      listWorkItems({ organizationId }),
      listPendingApprovals(organizationId),
      listRecentBusinessEvents(organizationId, RECENT_ACTIVITY_LIMIT),
      listActiveAgentDefinitions(organizationId),
      listAgentDefinitions({ organizationId }),
      listAgentRuns({ organizationId, status: 'FAILED', limit: 50 }),
    ]);

  const openWork = workItems.filter((item) => isOpenWorkItem(item.status));
  const now = Temporal.Now.instant();
  const agentNameById = new Map(configuredAgents.map((agent) => [agent.id, agent.name]));

  const attention = buildOwnerAttention({
    workItems,
    pendingApprovals,
    failedAgentRuns: failedRuns.map((run: AgentRun) => ({
      id: run.id,
      agentDefinitionId: run.agentDefinitionId,
      status: run.status,
      error: run.error,
      completedAt: run.completedAt,
      createdAt: run.createdAt,
      agentName: agentNameById.get(run.agentDefinitionId) ?? null,
    })),
    now,
  });

  const currentWork = sortOpenWorkItems(openWork).slice(0, CURRENT_WORK_LIMIT);

  return {
    organization: {
      name: organization.name,
      status: organization.status,
      description: organization.description,
      timezone: timeZone,
    },
    metrics: [
      { label: 'Active Goals', value: goals.length, href: '/app/goals' },
      { label: 'Open Work', value: openWork.length, href: '/app/work' },
      { label: 'Pending Approvals', value: pendingApprovals.length, href: '/app/approvals' },
      { label: 'Active Agents', value: agents.length, href: '/app/agents' },
    ],
    attention,
    goals: goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      status: goal.status,
      priority: goal.priority,
      timeHorizon: goal.timeHorizon,
    })),
    work: currentWork.map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      priority: item.priority,
      workType: item.workType,
      dueAtLabel: formatBusinessInstant(item.dueAt, timeZone),
    })),
    approvals: pendingApprovals.slice(0, PENDING_APPROVAL_LIMIT).map((approval) => ({
      id: approval.id,
      title: approval.title,
      riskLevel: approval.riskLevel,
      actionType: approval.actionType,
      requestedAtLabel: formatBusinessInstant(approval.requestedAt, timeZone),
    })),
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      eventType: event.eventType,
      sourceType: event.sourceType,
      occurredAtLabel: formatBusinessInstant(event.occurredAt, timeZone),
      description: event.description,
    })),
    agents: agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      status: agent.status,
      permissionLevel: agent.permissionLevel,
    })),
  };
}
