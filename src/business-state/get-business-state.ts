import {
  getOrganizationBySlug,
} from './organization.ts';
import { listActiveGoals } from './goals.ts';
import { listWorkItems } from './work-items.ts';
import { listRecentBusinessEvents } from './business-events.ts';
import { BusinessStateNotFoundError } from './errors.ts';
import {
  JS_SOLUTIONS_SLUG,
  type BusinessEvent,
  type BusinessState,
  type BusinessStateEvent,
  type BusinessStateGoal,
  type BusinessStateWorkItem,
  type Goal,
  type Organization,
  type WorkItem,
} from './types.ts';

const ACTIVE_WORK_STATUSES = new Set<WorkItem['status']>([
  'READY',
  'IN_PROGRESS',
  'BLOCKED',
  'WAITING_APPROVAL',
]);

function toBusinessStateGoal(goal: Goal): BusinessStateGoal {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    status: goal.status,
    priority: goal.priority,
    timeHorizon: goal.timeHorizon,
    targetDate: goal.targetDate,
    metricName: goal.metricName,
    metricUnit: goal.metricUnit,
    targetValue: goal.targetValue,
    currentValue: goal.currentValue,
  };
}

function toBusinessStateWorkItem(workItem: WorkItem): BusinessStateWorkItem {
  return {
    id: workItem.id,
    goalId: workItem.goalId,
    parentId: workItem.parentId,
    title: workItem.title,
    description: workItem.description,
    status: workItem.status,
    priority: workItem.priority,
    workType: workItem.workType,
    assignedAgentId: workItem.assignedAgentId,
    dueAt: workItem.dueAt,
    startedAt: workItem.startedAt,
    completedAt: workItem.completedAt,
  };
}

function toBusinessStateEvent(event: BusinessEvent): BusinessStateEvent {
  return {
    id: event.id,
    eventType: event.eventType,
    sourceType: event.sourceType,
    sourceId: event.sourceId,
    title: event.title,
    description: event.description,
    occurredAt: event.occurredAt,
  };
}

export function buildBusinessStateSnapshot(input: {
  organization: Organization;
  goals: Goal[];
  workItems: WorkItem[];
  recentEvents: BusinessEvent[];
  generatedAt?: BusinessState['generatedAt'];
}): BusinessState {
  const activeWorkItems = input.workItems.filter((item) =>
    ACTIVE_WORK_STATUSES.has(item.status),
  );
  const blockedWorkItems = activeWorkItems.filter((item) => item.status === 'BLOCKED');
  const highPriorityWorkItems = activeWorkItems.filter(
    (item) => item.priority === 'HIGH' || item.priority === 'CRITICAL',
  );

  return {
    organization: {
      id: input.organization.id,
      name: input.organization.name,
      slug: input.organization.slug,
      description: input.organization.description,
      timezone: input.organization.timezone,
      status: input.organization.status,
    },
    goals: input.goals.map(toBusinessStateGoal),
    activeWork: activeWorkItems.map(toBusinessStateWorkItem),
    blockedWork: blockedWorkItems.map(toBusinessStateWorkItem),
    recentEvents: input.recentEvents.map(toBusinessStateEvent),
    summary: {
      activeGoals: input.goals.length,
      activeWorkItems: activeWorkItems.length,
      blockedWorkItems: blockedWorkItems.length,
      highPriorityWorkItems: highPriorityWorkItems.length,
    },
    generatedAt: input.generatedAt ?? Temporal.Now.instant(),
  };
}

/**
 * Returns the normalized operating snapshot consumed by the command center and,
 * later, CEO reasoning. This intentionally does not expose raw ORM relations.
 */
export async function getBusinessState(
  organizationSlug: string = JS_SOLUTIONS_SLUG,
): Promise<BusinessState> {
  const organization = await getOrganizationBySlug(organizationSlug);
  if (!organization) {
    throw new BusinessStateNotFoundError(
      `Organization slug "${organizationSlug}" was not found.`,
    );
  }

  const [goals, workItems, recentEvents] = await Promise.all([
    listActiveGoals(organization.id),
    listWorkItems({ organizationId: organization.id }),
    listRecentBusinessEvents(organization.id, 25),
  ]);

  return buildBusinessStateSnapshot({
    organization,
    goals,
    workItems,
    recentEvents,
  });
}
