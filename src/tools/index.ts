export { InvalidToolInputError, InvalidToolTransitionError } from './errors.ts';

export {
  assertToolExecutionTransition,
  assertToolRequestTransition,
  canCancelToolExecution,
  canCancelToolRequest,
  canTransitionToolExecution,
  canTransitionToolRequest,
  isTerminalToolExecutionStatus,
  isTerminalToolRequestStatus,
} from './lifecycle.ts';

export {
  TOOL_SLUG_MAX_LENGTH,
  agentRequestRequiresDefinition,
  assertAgentRequestHasDefinition,
  assertExecutionOrganizationMatchesRequest,
  executionOrganizationMatchesRequest,
  isValidAttemptNumber,
  isValidToolSlug,
  isValidToolVersion,
  requireAttemptNumber,
  requireToolSlug,
  requireToolVersion,
} from './validation.ts';

export type {
  TerminalToolExecutionStatus,
  TerminalToolRequestStatus,
  ToolActorType,
  ToolApprovalRequirement,
  ToolExecution,
  ToolExecutionStatus,
  ToolRequest,
  ToolRequestSnapshotFields,
  ToolRequestStatus,
  ToolRequiredPermission,
  ToolRiskLevel,
} from './types.ts';

export {
  TERMINAL_TOOL_EXECUTION_STATUSES,
  TERMINAL_TOOL_REQUEST_STATUSES,
  TOOL_EXECUTION_STATUSES,
  TOOL_REQUEST_STATUSES,
} from './types.ts';
