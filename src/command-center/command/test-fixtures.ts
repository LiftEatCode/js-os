import { Temporal } from 'temporal-polyfill';
import type {
  BusinessState,
  BusinessStateAgentDefinition,
  BusinessStateAgentRun,
  BusinessStateApproval,
  BusinessStateWorkItem,
} from '@/business-state';

const instant = () => Temporal.Instant.from('2026-09-09T12:00:00Z');

export function makeWorkItem(overrides: Partial<BusinessStateWorkItem> = {}): BusinessStateWorkItem {
  return { id: 'work-1', goalId: null, parentId: null, title: 'Work item', description: null, status: 'READY', priority: 'MEDIUM', workType: 'TASK', assignedAgentId: null, dueAt: null, startedAt: null, completedAt: null, ...overrides };
}
export function makeApproval(overrides: Partial<BusinessStateApproval> = {}): BusinessStateApproval {
  return { id: 'approval-1', workItemId: null, agentRunId: null, actionType: 'work.update', title: 'Approval', description: null, status: 'PENDING', riskLevel: 'MEDIUM', requestedByType: 'USER', requestedById: null, requestedAt: instant(), expiresAt: null, ...overrides };
}
export function makeAgentDefinition(overrides: Partial<BusinessStateAgentDefinition> = {}): BusinessStateAgentDefinition {
  return { id: 'agent-1', name: 'CEO', slug: 'ceo', description: null, status: 'DISABLED', role: 'CEO', permissionLevel: 'OBSERVE', ...overrides };
}
export function makeAgentRun(overrides: Partial<BusinessStateAgentRun> = {}): BusinessStateAgentRun {
  return { id: 'run-1', agentDefinitionId: 'agent-1', triggerType: 'MANUAL', triggerReference: null, status: 'COMPLETED', startedAt: instant(), completedAt: instant(), error: null, createdAt: instant(), ...overrides };
}
export function makeBusinessState(overrides: Partial<BusinessState> = {}): BusinessState {
  return {
    organization: { id: 'org-1', name: 'JS Solutions', slug: 'js-solutions', description: null, timezone: 'America/Chicago', status: 'ACTIVE' },
    goals: [], activeWork: [], blockedWork: [], pendingApprovals: [], agents: [], recentAgentRuns: [], recentEvents: [],
    summary: { activeGoals: 0, activeWorkItems: 0, blockedWorkItems: 0, highPriorityWorkItems: 0, pendingApprovals: 0, activeAgents: 0, recentAgentRuns: 0 },
    generatedAt: instant(),
    ...overrides,
  };
}
