import type { PersistenceOrm } from '../business-state/persistence.ts';
import { clampListLimit } from '../business-state/validation.ts';
import { InvalidToolTransitionError, ToolRequestNotFoundError } from './errors.ts';
import { assertToolRequestTransition } from './lifecycle.ts';
import type {
  ToolActorType,
  ToolApprovalRequirement,
  ToolRequest,
  ToolRequestStatus,
  ToolRequiredPermission,
  ToolRiskLevel,
} from './types.ts';

export type CreateToolRequestRecordInput = {
  organizationId: string;
  toolSlug: string;
  toolName: string;
  toolVersion: number;
  requiredPermission: ToolRequiredPermission;
  riskLevel: ToolRiskLevel;
  approvalRequirement: ToolApprovalRequirement;
  status: ToolRequestStatus;
  input: ToolRequest['input'];
  requestedByType: ToolActorType;
  requestedById: string | null;
  agentDefinitionId: string | null;
  agentRunId: string | null;
  workItemId: string | null;
  idempotencyKey: string | null;
};

export type ToolRequestListFilter = {
  organizationId: string;
  status?: ToolRequestStatus;
  toolSlug?: string;
  agentDefinitionId?: string;
  agentRunId?: string;
  workItemId?: string;
  requestedByType?: ToolActorType;
  limit?: number;
};

export async function getToolRequestByIdWithOrm(
  orm: PersistenceOrm,
  id: string,
): Promise<ToolRequest | null> {
  return orm.public.ToolRequest.where({ id }).first();
}

export async function findToolRequestByIdempotencyWithOrm(
  orm: PersistenceOrm,
  organizationId: string,
  toolSlug: string,
  idempotencyKey: string,
): Promise<ToolRequest | null> {
  return orm.public.ToolRequest.where({
    organizationId,
    toolSlug,
    idempotencyKey,
  }).first();
}

export async function listToolRequestsWithOrm(
  orm: PersistenceOrm,
  filter: ToolRequestListFilter,
): Promise<ToolRequest[]> {
  const where: {
    organizationId: string;
    status?: ToolRequestStatus;
    toolSlug?: string;
    agentDefinitionId?: string;
    agentRunId?: string;
    workItemId?: string;
    requestedByType?: ToolActorType;
  } = { organizationId: filter.organizationId };

  if (filter.status) {
    where.status = filter.status;
  }
  if (filter.toolSlug) {
    where.toolSlug = filter.toolSlug;
  }
  if (filter.agentDefinitionId) {
    where.agentDefinitionId = filter.agentDefinitionId;
  }
  if (filter.agentRunId) {
    where.agentRunId = filter.agentRunId;
  }
  if (filter.workItemId) {
    where.workItemId = filter.workItemId;
  }
  if (filter.requestedByType) {
    where.requestedByType = filter.requestedByType;
  }

  return orm.public.ToolRequest.where(where)
    .orderBy([(request) => request.requestedAt.desc(), (request) => request.id.desc()])
    .limit(clampListLimit(filter.limit))
    .all();
}

export async function createToolRequestWithOrm(
  orm: PersistenceOrm,
  input: CreateToolRequestRecordInput,
): Promise<ToolRequest> {
  return orm.public.ToolRequest.create({
    organizationId: input.organizationId,
    toolSlug: input.toolSlug,
    toolName: input.toolName,
    toolVersion: input.toolVersion,
    requiredPermission: input.requiredPermission,
    riskLevel: input.riskLevel,
    approvalRequirement: input.approvalRequirement,
    status: input.status,
    input: input.input,
    requestedByType: input.requestedByType,
    requestedById: input.requestedById,
    agentDefinitionId: input.agentDefinitionId,
    agentRunId: input.agentRunId,
    workItemId: input.workItemId,
    approvalId: null,
    idempotencyKey: input.idempotencyKey,
  });
}

export async function transitionToolRequestStatusWithOrm(
  orm: PersistenceOrm,
  id: string,
  from: ToolRequestStatus,
  to: ToolRequestStatus,
): Promise<ToolRequest> {
  assertToolRequestTransition(from, to);
  const updated = await orm.public.ToolRequest.where({ id, status: from }).update({
    status: to,
  });
  const row = firstUpdated(updated);
  if (row?.status === to) {
    return row;
  }
  const current = await getToolRequestByIdWithOrm(orm, id);
  if (!current) {
    throw new ToolRequestNotFoundError(id);
  }
  if (current.status === to) {
    return current;
  }
  throw new InvalidToolTransitionError(
    `ToolRequest cannot transition from ${current.status} to ${to}.`,
  );
}

function firstUpdated<T>(updated: T | T[] | null | undefined): T | undefined {
  if (updated == null) {
    return undefined;
  }
  return Array.isArray(updated) ? updated[0] : updated;
}
