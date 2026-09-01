import { BusinessStateNotFoundError } from './errors.ts';
import type { PersistenceOrm } from './persistence.ts';
import type {
  AgentDefinition,
  AgentDefinitionListFilter,
  AgentDefinitionStatus,
  AgentPermissionLevel,
} from './types.ts';
import { requireNonEmptyString } from './validation.ts';

export async function getAgentDefinitionByIdWithOrm(
  orm: PersistenceOrm,
  id: string,
): Promise<AgentDefinition | null> {
  return orm.public.AgentDefinition.where({ id }).first();
}

export async function getAgentDefinitionBySlugWithOrm(
  orm: PersistenceOrm,
  organizationId: string,
  slug: string,
): Promise<AgentDefinition | null> {
  return orm.public.AgentDefinition.where({
    organizationId,
    slug: requireNonEmptyString(slug, 'slug'),
  }).first();
}

export async function listAgentDefinitionsWithOrm(
  orm: PersistenceOrm,
  filter: AgentDefinitionListFilter,
): Promise<AgentDefinition[]> {
  const where: {
    organizationId: string;
    status?: AgentDefinitionListFilter['status'];
    role?: AgentDefinitionListFilter['role'];
    permissionLevel?: AgentDefinitionListFilter['permissionLevel'];
  } = { organizationId: filter.organizationId };

  if (filter.status) {
    where.status = filter.status;
  }
  if (filter.role) {
    where.role = filter.role;
  }
  if (filter.permissionLevel) {
    where.permissionLevel = filter.permissionLevel;
  }

  return orm.public.AgentDefinition.where(where)
    .orderBy((agent) => agent.slug.asc())
    .all();
}

export async function updateAgentStatusWithOrm(
  orm: PersistenceOrm,
  id: string,
  status: AgentDefinitionStatus,
): Promise<AgentDefinition> {
  const existing = await getAgentDefinitionByIdWithOrm(orm, id);
  if (!existing) {
    throw new BusinessStateNotFoundError(`AgentDefinition not found: ${id}`);
  }

  await orm.public.AgentDefinition.where({ id }).update({ status });
  const updated = await getAgentDefinitionByIdWithOrm(orm, id);
  if (!updated) {
    throw new BusinessStateNotFoundError(`AgentDefinition not found after update: ${id}`);
  }
  return updated;
}

export async function updateAgentPermissionLevelWithOrm(
  orm: PersistenceOrm,
  id: string,
  permissionLevel: AgentPermissionLevel,
): Promise<AgentDefinition> {
  const existing = await getAgentDefinitionByIdWithOrm(orm, id);
  if (!existing) {
    throw new BusinessStateNotFoundError(`AgentDefinition not found: ${id}`);
  }

  await orm.public.AgentDefinition.where({ id }).update({ permissionLevel });
  const updated = await getAgentDefinitionByIdWithOrm(orm, id);
  if (!updated) {
    throw new BusinessStateNotFoundError(`AgentDefinition not found after update: ${id}`);
  }
  return updated;
}
