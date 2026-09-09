/// <reference types="temporal-polyfill/types/global" />
import {
  BusinessStateNotFoundError,
  getBusinessState,
  listAgentDefinitions,
  listAgentRuns,
  listPendingApprovals,
  type AgentDefinition,
  type AgentRun,
  type Approval,
  type BusinessState,
} from '@/business-state';

export type CommandCenterData = {
  state: BusinessState;
  approvals: Approval[];
  agents: AgentDefinition[];
  recentAgentRuns: AgentRun[];
};

export async function loadCommandCenter(slug = 'js-solutions'): Promise<CommandCenterData | null> {
  try {
    const state = await getBusinessState(slug);
    const organizationId = state.organization.id;

    const [approvals, agents, recentAgentRuns] = await Promise.all([
      listPendingApprovals(organizationId),
      listAgentDefinitions({ organizationId }),
      listAgentRuns({ organizationId, limit: 20 }),
    ]);

    return { state, approvals, agents, recentAgentRuns };
  } catch (error) {
    if (error instanceof BusinessStateNotFoundError) return null;
    throw error;
  }
}
