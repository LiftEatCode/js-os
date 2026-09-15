import type {
  AgentDefinition,
  AgentRun,
  Approval,
  Organization,
  WorkItem,
} from '../../business-state/types.ts';
import { db } from '../../prisma/db.ts';
import type { ToolExecution, ToolRequest } from '../../tools/types.ts';

export type ToolRequestDetailAggregate = Readonly<{
  request: ToolRequest;
  organization: Organization;
  agentDefinition: AgentDefinition | null;
  agentRun: AgentRun | null;
  workItem: WorkItem | null;
  approval: Approval | null;
  executions: readonly ToolExecution[];
}>;

/**
 * Minimal read-store boundary for the forensic aggregate. The production
 * implementation below is organization-scoped on every lookup; tests can use
 * an in-memory store without coupling Command Center tests to Postgres.
 */
export type ToolRequestDetailReadStore = Readonly<{
  getToolRequest(organizationId: string, toolRequestId: string): Promise<ToolRequest | null>;
  getOrganization(organizationId: string): Promise<Organization | null>;
  getAgentDefinition(organizationId: string, id: string): Promise<AgentDefinition | null>;
  getAgentRun(organizationId: string, id: string): Promise<AgentRun | null>;
  getWorkItem(organizationId: string, id: string): Promise<WorkItem | null>;
  getApproval(organizationId: string, id: string): Promise<Approval | null>;
  listExecutions(organizationId: string, toolRequestId: string): Promise<ToolExecution[]>;
}>;

export const prismaToolRequestDetailReadStore: ToolRequestDetailReadStore = {
  getToolRequest(organizationId, toolRequestId) {
    return db.orm.public.ToolRequest.where({ id: toolRequestId, organizationId }).first();
  },
  getOrganization(organizationId) {
    return db.orm.public.Organization.where({ id: organizationId }).first();
  },
  getAgentDefinition(organizationId, id) {
    return db.orm.public.AgentDefinition.where({ id, organizationId }).first();
  },
  getAgentRun(organizationId, id) {
    return db.orm.public.AgentRun.where({ id, organizationId }).first();
  },
  getWorkItem(organizationId, id) {
    return db.orm.public.WorkItem.where({ id, organizationId }).first();
  },
  getApproval(organizationId, id) {
    return db.orm.public.Approval.where({ id, organizationId }).first();
  },
  listExecutions(organizationId, toolRequestId) {
    return db.orm.public.ToolExecution.where({ organizationId, toolRequestId })
      .orderBy([(execution) => execution.attemptNumber.asc(), (execution) => execution.id.asc()])
      .all();
  },
};

/**
 * Loads the authoritative persisted aggregate for one ToolRequest.
 *
 * This stage intentionally performs retrieval only. Execution outcome,
 * authorization, produced-record resolution, timeline correlation, and action
 * eligibility are layered on by later Phase 3.7.1 tickets.
 */
export async function loadToolRequestDetailAggregateWithStore(
  store: ToolRequestDetailReadStore,
  organizationId: string,
  toolRequestId: string,
): Promise<ToolRequestDetailAggregate | null> {
  const request = await store.getToolRequest(organizationId, toolRequestId);
  if (!request) return null;

  // Defense in depth for alternate/test stores. Production lookup already
  // includes organizationId in the query.
  if (request.organizationId !== organizationId) return null;

  const [organization, agentDefinition, agentRun, workItem, approval, executions] =
    await Promise.all([
      store.getOrganization(organizationId),
      request.agentDefinitionId
        ? store.getAgentDefinition(organizationId, request.agentDefinitionId)
        : Promise.resolve(null),
      request.agentRunId
        ? store.getAgentRun(organizationId, request.agentRunId)
        : Promise.resolve(null),
      request.workItemId
        ? store.getWorkItem(organizationId, request.workItemId)
        : Promise.resolve(null),
      request.approvalId
        ? store.getApproval(organizationId, request.approvalId)
        : Promise.resolve(null),
      store.listExecutions(organizationId, request.id),
    ]);

  // A ToolRequest cannot be rendered without its owning organization. Treat a
  // broken/mismatched organization relation as not found rather than leaking a
  // partial cross-organization aggregate.
  if (!organization || organization.id !== organizationId) return null;

  const safeExecutions = executions
    .filter(
      (execution) =>
        execution.organizationId === organizationId && execution.toolRequestId === request.id,
    )
    .toSorted(
      (left, right) =>
        left.attemptNumber - right.attemptNumber || left.id.localeCompare(right.id),
    );

  return {
    request,
    organization,
    agentDefinition: belongsToOrganization(agentDefinition, organizationId),
    agentRun: belongsToOrganization(agentRun, organizationId),
    workItem: belongsToOrganization(workItem, organizationId),
    approval: belongsToOrganization(approval, organizationId),
    executions: safeExecutions,
  };
}

export async function loadToolRequestDetailAggregate(
  organizationId: string,
  toolRequestId: string,
): Promise<ToolRequestDetailAggregate | null> {
  return loadToolRequestDetailAggregateWithStore(
    prismaToolRequestDetailReadStore,
    organizationId,
    toolRequestId,
  );
}

function belongsToOrganization<T extends { organizationId: string }>(
  value: T | null,
  organizationId: string,
): T | null {
  return value?.organizationId === organizationId ? value : null;
}
