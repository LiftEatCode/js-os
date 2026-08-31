import { db } from '../prisma/db.ts';
import { BusinessStateNotFoundError } from './errors.ts';
import type {
  AgentDefinition,
  AgentDefinitionListFilter,
  AgentDefinitionStatus,
  AgentPermissionLevel,
} from './types.ts';
import { requireNonEmptyString } from './validation.ts';

export async function getAgentDefinitionById(id: string): Promise<AgentDefinition | null> {
  return db.orm.public.AgentDefinition.where({ id }).first();
}

export async function getAgentDefinitionBySlug(
  organizationId: string,
  slug: string,
): Promise<AgentDefinition | null> {
  return db.orm.public.AgentDefinition.where({
    organizationId,
    slug: requireNonEmptyString(slug, 'slug'),
  }).first();
}

export async function listAgentDefinitions(
  filter: AgentDefinitionListFilter,
): Promise<AgentDefinition[]> {
  const where: {
    organizationId: string;
    status?: AgentDefinitionListFilter['status'];
    role?: AgentDefinitionListFilter['role'];
  } = { organizationId: filter.organizationId };

  if (filter.status) {
    where.status = filter.status;
  }
  if (filter.role) {
    where.role = filter.role;
  }

  return db.orm.public.AgentDefinition.where(where)
    .orderBy((agent) => agent.slug.asc())
    .all();
}

export async function listActiveAgentDefinitions(
  organizationId: string,
): Promise<AgentDefinition[]> {
  return listAgentDefinitions({ organizationId, status: 'ACTIVE' });
}

export async function updateAgentStatus(
  id: string,
  status: AgentDefinitionStatus,
): Promise<AgentDefinition> {
  const existing = await getAgentDefinitionById(id);
  if (!existing) {
    throw new BusinessStateNotFoundError(`AgentDefinition not found: ${id}`);
  }

  await db.orm.public.AgentDefinition.where({ id }).update({ status });
  const updated = await getAgentDefinitionById(id);
  if (!updated) {
    throw new BusinessStateNotFoundError(`AgentDefinition not found after update: ${id}`);
  }
  return updated;
}

export async function updateAgentPermissionLevel(
  id: string,
  permissionLevel: AgentPermissionLevel,
): Promise<AgentDefinition> {
  const existing = await getAgentDefinitionById(id);
  if (!existing) {
    throw new BusinessStateNotFoundError(`AgentDefinition not found: ${id}`);
  }

  await db.orm.public.AgentDefinition.where({ id }).update({ permissionLevel });
  const updated = await getAgentDefinitionById(id);
  if (!updated) {
    throw new BusinessStateNotFoundError(`AgentDefinition not found after update: ${id}`);
  }
  return updated;
}
