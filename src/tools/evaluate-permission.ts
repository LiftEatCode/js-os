import type { AgentDefinitionStatus, AgentPermissionLevel } from '../business-state/types.ts';
import type { ToolDefinition } from './definition.ts';
import type { ToolActorType, ToolRequiredPermission } from './types.ts';

export type ToolPermissionDenialCode =
  | 'TOOL_DISABLED'
  | 'INSUFFICIENT_PERMISSION'
  | 'ACTOR_NOT_ALLOWED';

export type ToolPermissionAgentProjection = {
  id: string;
  status: AgentDefinitionStatus;
  permissionLevel: AgentPermissionLevel;
};

export type ToolPermissionActor =
  | {
      type: Extract<ToolActorType, 'USER'>;
      requestedById?: string | null;
    }
  | {
      type: Extract<ToolActorType, 'AGENT'>;
      agentDefinition: ToolPermissionAgentProjection;
    }
  | {
      type: Extract<ToolActorType, 'SYSTEM'>;
    };

export type ToolPermissionEvaluation =
  | {
      allowed: true;
      code: null;
    }
  | {
      allowed: false;
      code: ToolPermissionDenialCode;
    };

const AGENT_PERMISSION_RANK = {
  OBSERVE: 0,
  RECOMMEND: 1,
  PREPARE: 2,
  EXECUTE: 3,
} as const satisfies Record<AgentPermissionLevel, number>;

const TOOL_REQUIRED_PERMISSION_RANK = {
  OBSERVE: 0,
  RECOMMEND: 1,
  PREPARE: 2,
  EXECUTE: 3,
} as const satisfies Record<ToolRequiredPermission, number>;

function rankAgentPermission(level: AgentPermissionLevel): number | undefined {
  return AGENT_PERMISSION_RANK[level];
}

function rankToolRequiredPermission(level: ToolRequiredPermission): number | undefined {
  return TOOL_REQUIRED_PERMISSION_RANK[level];
}

export function createUserToolActor(requestedById?: string | null): ToolPermissionActor {
  return { type: 'USER', requestedById: requestedById ?? null };
}

export function createAgentToolActor(
  agentDefinition: ToolPermissionAgentProjection,
): ToolPermissionActor {
  return { type: 'AGENT', agentDefinition };
}

export function createSystemToolActor(): ToolPermissionActor {
  return { type: 'SYSTEM' };
}

/**
 * Deterministic technical permission check for a resolved ToolDefinition.
 * Does not look up the registry, database, approvals, risk, or persistExecution.
 *
 * Denial precedence: TOOL_DISABLED, then ACTOR_NOT_ALLOWED, then
 * INSUFFICIENT_PERMISSION, then allow.
 */
export function evaluateToolPermission(
  actor: ToolPermissionActor,
  definition: ToolDefinition,
): ToolPermissionEvaluation {
  if (definition.enabled !== true) {
    return { allowed: false, code: 'TOOL_DISABLED' };
  }

  if (actor == null || typeof actor !== 'object') {
    return { allowed: false, code: 'ACTOR_NOT_ALLOWED' };
  }

  switch (actor.type) {
    case 'USER':
    case 'SYSTEM':
      return { allowed: true, code: null };
    case 'AGENT':
      return evaluateAgentPermission(actor.agentDefinition, definition.requiredPermission);
    default:
      return { allowed: false, code: 'ACTOR_NOT_ALLOWED' };
  }
}

function evaluateAgentPermission(
  agentDefinition: ToolPermissionAgentProjection | undefined,
  requiredPermission: ToolRequiredPermission,
): ToolPermissionEvaluation {
  if (agentDefinition == null || typeof agentDefinition !== 'object') {
    return { allowed: false, code: 'ACTOR_NOT_ALLOWED' };
  }
  if (agentDefinition.status !== 'ACTIVE') {
    return { allowed: false, code: 'ACTOR_NOT_ALLOWED' };
  }

  const ceiling = rankAgentPermission(agentDefinition.permissionLevel);
  const required = rankToolRequiredPermission(requiredPermission);
  if (ceiling === undefined || required === undefined) {
    return { allowed: false, code: 'ACTOR_NOT_ALLOWED' };
  }
  if (ceiling < required) {
    return { allowed: false, code: 'INSUFFICIENT_PERMISSION' };
  }
  return { allowed: true, code: null };
}
