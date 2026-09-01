/// <reference types="temporal-polyfill/types/global" />
import type { AgentRole } from '../../business-state/types.ts';
import { AGENT_ROLES } from './constants.ts';

export type SortableAgent = {
  role: AgentRole;
  name: string;
  slug: string;
};

const roleRank = Object.fromEntries(AGENT_ROLES.map((role, index) => [role, index])) as Record<
  AgentRole,
  number
>;

export function compareAgents(a: SortableAgent, b: SortableAgent): number {
  const byRole = roleRank[a.role] - roleRank[b.role];
  if (byRole !== 0) {
    return byRole;
  }
  const byName = a.name.localeCompare(b.name);
  if (byName !== 0) {
    return byName;
  }
  return a.slug.localeCompare(b.slug);
}

export function sortAgents<T extends SortableAgent>(items: T[]): T[] {
  return [...items].sort(compareAgents);
}

export type SortableAgentRun = {
  id: string;
  startedAt: Temporal.Instant;
  createdAt: Temporal.Instant;
};

export function compareAgentRuns(a: SortableAgentRun, b: SortableAgentRun): number {
  const byStarted = Temporal.Instant.compare(b.startedAt, a.startedAt);
  if (byStarted !== 0) {
    return byStarted;
  }
  const byCreated = Temporal.Instant.compare(b.createdAt, a.createdAt);
  if (byCreated !== 0) {
    return byCreated;
  }
  return b.id.localeCompare(a.id);
}

export function sortAgentRuns<T extends SortableAgentRun>(items: T[]): T[] {
  return [...items].sort(compareAgentRuns);
}

export function latestRunByAgent<T extends SortableAgentRun & { agentDefinitionId: string }>(
  runs: T[],
): Map<string, T> {
  const latest = new Map<string, T>();
  for (const run of sortAgentRuns(runs)) {
    if (!latest.has(run.agentDefinitionId)) {
      latest.set(run.agentDefinitionId, run);
    }
  }
  return latest;
}
