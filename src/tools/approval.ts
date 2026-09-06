import type {
  Approval,
  ApprovalRequesterType,
  ApprovalRiskLevel,
  CreateApprovalRequestInput,
} from '../business-state/types.ts';
import { isApprovalAuthorizationExpired } from '../business-state/approval-lifecycle.ts';
import { ToolAuthorizationError, ToolInvariantError } from './errors.ts';
import { asJsonValue } from './json.ts';
import type { ToolActorType, ToolRequest, ToolRiskLevel } from './types.ts';

export const TOOL_EXECUTE_ACTION_TYPE = 'tool.execute';

export const TOOL_APPROVAL_PAYLOAD_KIND = 'tool_request';

export const TOOL_DENIAL_REASONS = {
  APPROVAL_REJECTED: 'APPROVAL_REJECTED',
  APPROVAL_EXPIRED: 'APPROVAL_EXPIRED',
} as const;

export type ToolDenialReason = (typeof TOOL_DENIAL_REASONS)[keyof typeof TOOL_DENIAL_REASONS];

export type ToolApprovalPayload = {
  kind: typeof TOOL_APPROVAL_PAYLOAD_KIND;
  toolRequestId: string;
  toolSlug: string;
  toolName: string;
  toolVersion: number;
  requiredPermission: string;
  riskLevel: ToolRiskLevel;
  input: ToolRequest['input'];
};

export function mapToolRiskToApprovalRisk(riskLevel: ToolRiskLevel): ApprovalRiskLevel {
  switch (riskLevel) {
    case 'LOW':
      return 'LOW';
    case 'MEDIUM':
      return 'MEDIUM';
    case 'HIGH':
      return 'HIGH';
    case 'CRITICAL':
      return 'CRITICAL';
    default: {
      const unexpected: never = riskLevel;
      throw new ToolInvariantError(`Unsupported ToolRiskLevel: ${String(unexpected)}`);
    }
  }
}

export function mapToolActorToApprovalRequester(
  actorType: ToolActorType,
): ApprovalRequesterType {
  switch (actorType) {
    case 'USER':
      return 'USER';
    case 'AGENT':
      return 'AGENT';
    case 'SYSTEM':
      return 'SYSTEM';
    default: {
      const unexpected: never = actorType;
      throw new ToolInvariantError(`Unsupported ToolActorType: ${String(unexpected)}`);
    }
  }
}

export function toolApprovalTitle(toolName: string): string {
  return `Approve tool: ${toolName}`;
}

export function toolApprovalDescription(toolName: string): string {
  return `Authorize JS OS to execute the ${toolName} capability.`;
}

export function toolApprovalPayload(request: ToolRequest): ToolApprovalPayload {
  return {
    kind: TOOL_APPROVAL_PAYLOAD_KIND,
    toolRequestId: request.id,
    toolSlug: request.toolSlug,
    toolName: request.toolName,
    toolVersion: request.toolVersion,
    requiredPermission: request.requiredPermission,
    riskLevel: request.riskLevel,
    input: request.input,
  };
}

export function createToolApprovalRequestInput(request: ToolRequest): CreateApprovalRequestInput {
  return {
    organizationId: request.organizationId,
    title: toolApprovalTitle(request.toolName),
    actionType: TOOL_EXECUTE_ACTION_TYPE,
    riskLevel: mapToolRiskToApprovalRisk(request.riskLevel),
    requestedByType: mapToolActorToApprovalRequester(request.requestedByType),
    description: toolApprovalDescription(request.toolName),
    workItemId: request.workItemId,
    agentRunId: request.agentRunId,
    requestedById: request.requestedById,
    payload: asJsonValue(toolApprovalPayload(request)),
  };
}

export function isToolApprovalPayload(value: unknown): value is ToolApprovalPayload {
  if (value == null || typeof value !== 'object') {
    return false;
  }
  const payload = value as { kind?: unknown; toolRequestId?: unknown };
  return payload.kind === TOOL_APPROVAL_PAYLOAD_KIND && typeof payload.toolRequestId === 'string';
}

/**
 * READY is not sufficient for ALWAYS tools. Approval must exist, belong to the
 * same organization, represent this ToolRequest, be APPROVED, and not be past
 * expiresAt. NEVER tools do not require an Approval.
 */
export function assertToolRequestAuthorizedForExecution(
  request: ToolRequest,
  approval: Approval | null,
  now: Temporal.Instant,
): void {
  if (request.status !== 'READY') {
    throw new ToolAuthorizationError(
      `ToolExecution attempts can only be created for READY requests; found ${request.status}.`,
    );
  }

  if (request.approvalRequirement === 'NEVER') {
    return;
  }

  if (request.approvalRequirement !== 'ALWAYS') {
    throw new ToolInvariantError(
      `Unsupported approvalRequirement: ${String(request.approvalRequirement)}`,
    );
  }

  if (request.approvalId == null) {
    throw new ToolInvariantError(
      'ALWAYS ToolRequest is missing approvalId; an Approval cannot be created at execution time.',
    );
  }

  if (!approval) {
    throw new ToolAuthorizationError('Approval not found for this ToolRequest.');
  }

  if (approval.id !== request.approvalId) {
    throw new ToolAuthorizationError('Approval does not match ToolRequest.approvalId.');
  }

  if (approval.organizationId !== request.organizationId) {
    throw new ToolAuthorizationError('Approval does not belong to the same organization.');
  }

  if (!isToolApprovalPayload(approval.payload) || approval.payload.toolRequestId !== request.id) {
    throw new ToolAuthorizationError('Approval does not represent this ToolRequest.');
  }

  if (approval.status !== 'APPROVED') {
    throw new ToolAuthorizationError(
      `Approval status ${approval.status} does not authorize execution.`,
    );
  }

  if (isApprovalAuthorizationExpired(approval.expiresAt, now)) {
    throw new ToolAuthorizationError('Approval has expired and does not authorize execution.');
  }
}
