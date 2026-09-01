import { InvalidToolInputError } from './errors.ts';
import type { ToolActorType } from './types.ts';

/**
 * lowercase.dot.notation with optional underscores in segments.
 * Examples: internal.create_work_item, email.send, js_growth.run_website_audit
 */
const TOOL_SLUG_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
export const TOOL_SLUG_MAX_LENGTH = 120;

export function isValidToolSlug(slug: string): boolean {
  return TOOL_SLUG_PATTERN.test(slug) && slug.length <= TOOL_SLUG_MAX_LENGTH;
}

export function requireToolSlug(slug: string): string {
  const trimmed = slug.trim();
  if (!isValidToolSlug(trimmed)) {
    throw new InvalidToolInputError(
      'toolSlug must use lowercase.dot.notation (for example internal.create_work_item).',
    );
  }
  return trimmed;
}

export function isValidToolVersion(version: number): boolean {
  return Number.isInteger(version) && version >= 1;
}

export function requireToolVersion(version: number): number {
  if (!isValidToolVersion(version)) {
    throw new InvalidToolInputError('toolVersion must be an integer >= 1.');
  }
  return version;
}

export function isValidAttemptNumber(attemptNumber: number): boolean {
  return Number.isInteger(attemptNumber) && attemptNumber >= 1;
}

export function requireAttemptNumber(attemptNumber: number): number {
  if (!isValidAttemptNumber(attemptNumber)) {
    throw new InvalidToolInputError('attemptNumber must be an integer >= 1.');
  }
  return attemptNumber;
}

/**
 * Application-level invariant (not a database CHECK):
 * requestedByType = AGENT requires agentDefinitionId.
 * USER Command Center requests use requestedByType = USER and requestedById = null.
 */
export function agentRequestRequiresDefinition(
  requestedByType: ToolActorType,
  agentDefinitionId: string | null | undefined,
): boolean {
  return requestedByType !== 'AGENT' || Boolean(agentDefinitionId);
}

export function assertAgentRequestHasDefinition(
  requestedByType: ToolActorType,
  agentDefinitionId: string | null | undefined,
): void {
  if (!agentRequestRequiresDefinition(requestedByType, agentDefinitionId)) {
    throw new InvalidToolInputError(
      'agentDefinitionId is required when requestedByType is AGENT.',
    );
  }
}

/**
 * Application-level invariant (not a database CHECK):
 * ToolExecution.organizationId must equal ToolRequest.organizationId.
 */
export function executionOrganizationMatchesRequest(
  executionOrganizationId: string,
  requestOrganizationId: string,
): boolean {
  return executionOrganizationId === requestOrganizationId;
}

export function assertExecutionOrganizationMatchesRequest(
  executionOrganizationId: string,
  requestOrganizationId: string,
): void {
  if (!executionOrganizationMatchesRequest(executionOrganizationId, requestOrganizationId)) {
    throw new InvalidToolInputError(
      'ToolExecution.organizationId must match ToolRequest.organizationId.',
    );
  }
}
