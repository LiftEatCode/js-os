/// <reference types="temporal-polyfill/types/global" />
import {
  assertAgentPermissionChange,
  assertAgentStatusChange,
} from '../business-state/agent-definition-lifecycle.ts';
import { BusinessStateNotFoundError } from '../business-state/errors.ts';
import type {
  AgentDefinition,
  AgentDefinitionStatus,
  AgentPermissionLevel,
  RecordBusinessEventInput,
} from '../business-state/types.ts';

export const AGENT_EVENT_TYPES = {
  statusChanged: 'agent.status_changed',
  permissionChanged: 'agent.permission_changed',
} as const;

export type AgentCommandActor = {
  sourceType: 'USER' | 'AGENT' | 'SYSTEM';
  sourceId?: string | null;
};

export type AgentCommandStore = {
  getAgentDefinitionById(id: string): Promise<AgentDefinition | null>;
  updateStatus(id: string, status: AgentDefinitionStatus): Promise<AgentDefinition>;
  updatePermissionLevel(
    id: string,
    permissionLevel: AgentPermissionLevel,
  ): Promise<AgentDefinition>;
  recordEvent(input: RecordBusinessEventInput): Promise<void>;
};

export type ChangeAgentStatusInput = {
  id: string;
  organizationId: string;
  status: AgentDefinitionStatus;
};

export type ChangeAgentPermissionInput = {
  id: string;
  organizationId: string;
  permissionLevel: AgentPermissionLevel;
};

function requireJsSolutionsAgent(
  agent: AgentDefinition | null,
  id: string,
  organizationId: string,
): AgentDefinition {
  if (!agent || agent.organizationId !== organizationId) {
    throw new BusinessStateNotFoundError(`AgentDefinition not found: ${id}`);
  }
  return agent;
}

function eventInput(
  agent: AgentDefinition,
  eventType: string,
  title: string,
  metadata: Record<string, string>,
  now: Temporal.Instant,
  actor: AgentCommandActor,
): RecordBusinessEventInput {
  return {
    organizationId: agent.organizationId,
    eventType,
    sourceType: actor.sourceType,
    sourceId: actor.sourceId ?? null,
    title,
    occurredAt: now,
    metadata,
  };
}

export async function changeAgentStatusWithStore(
  store: AgentCommandStore,
  input: ChangeAgentStatusInput,
  now: Temporal.Instant,
  actor: AgentCommandActor,
): Promise<AgentDefinition> {
  const existing = requireJsSolutionsAgent(
    await store.getAgentDefinitionById(input.id),
    input.id,
    input.organizationId,
  );
  assertAgentStatusChange(existing.status, input.status);

  const updated = await store.updateStatus(existing.id, input.status);
  await store.recordEvent(
    eventInput(
      updated,
      AGENT_EVENT_TYPES.statusChanged,
      'Agent status changed',
      {
        agentDefinitionId: updated.id,
        agentSlug: updated.slug,
        previousStatus: existing.status,
        newStatus: updated.status,
      },
      now,
      actor,
    ),
  );
  return updated;
}

export async function changeAgentPermissionLevelWithStore(
  store: AgentCommandStore,
  input: ChangeAgentPermissionInput,
  now: Temporal.Instant,
  actor: AgentCommandActor,
): Promise<AgentDefinition> {
  const existing = requireJsSolutionsAgent(
    await store.getAgentDefinitionById(input.id),
    input.id,
    input.organizationId,
  );
  assertAgentPermissionChange(existing.permissionLevel, input.permissionLevel);

  const updated = await store.updatePermissionLevel(existing.id, input.permissionLevel);
  await store.recordEvent(
    eventInput(
      updated,
      AGENT_EVENT_TYPES.permissionChanged,
      'Agent permission changed',
      {
        agentDefinitionId: updated.id,
        agentSlug: updated.slug,
        previousPermissionLevel: existing.permissionLevel,
        newPermissionLevel: updated.permissionLevel,
      },
      now,
      actor,
    ),
  );
  return updated;
}
