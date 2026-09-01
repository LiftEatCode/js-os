import { InvalidBusinessStateInputError } from './errors.ts';
import type { AgentDefinitionStatus, AgentPermissionLevel } from './types.ts';

export function assertAgentStatusChange(
  current: AgentDefinitionStatus,
  next: AgentDefinitionStatus,
): void {
  if (current === next) {
    throw new InvalidBusinessStateInputError(
      `AgentDefinition status is already ${current}.`,
    );
  }
}

export function assertAgentPermissionChange(
  current: AgentPermissionLevel,
  next: AgentPermissionLevel,
): void {
  if (current === next) {
    throw new InvalidBusinessStateInputError(
      `AgentDefinition permission level is already ${current}.`,
    );
  }
}
