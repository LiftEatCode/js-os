import {
  getAgentDefinitionByIdWithOrm,
  getAgentDefinitionBySlugWithOrm,
  listAgentDefinitionsWithOrm,
  updateAgentPermissionLevelWithOrm,
  updateAgentStatusWithOrm,
} from './agent-definition-persistence.ts';
import { db } from '../prisma/db.ts';
import type {
  AgentDefinition,
  AgentDefinitionListFilter,
  AgentDefinitionStatus,
  AgentPermissionLevel,
} from './types.ts';

export async function getAgentDefinitionById(id: string): Promise<AgentDefinition | null> {
  return getAgentDefinitionByIdWithOrm(db.orm, id);
}

export async function getAgentDefinitionBySlug(
  organizationId: string,
  slug: string,
): Promise<AgentDefinition | null> {
  return getAgentDefinitionBySlugWithOrm(db.orm, organizationId, slug);
}

export async function listAgentDefinitions(
  filter: AgentDefinitionListFilter,
): Promise<AgentDefinition[]> {
  return listAgentDefinitionsWithOrm(db.orm, filter);
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
  return updateAgentStatusWithOrm(db.orm, id, status);
}

export async function updateAgentPermissionLevel(
  id: string,
  permissionLevel: AgentPermissionLevel,
): Promise<AgentDefinition> {
  return updateAgentPermissionLevelWithOrm(db.orm, id, permissionLevel);
}
