export {
  DuplicateToolSlugError,
  InvalidToolDefinitionError,
  InvalidToolInputError,
  InvalidToolTransitionError,
  ToolExecutionNotFoundError,
  ToolIdempotencyConflictError,
  ToolNotFoundError,
  ToolRequestNotFoundError,
} from './errors.ts';

export { defineTool, getToolDefinitionSnapshot } from './definition.ts';
export type { DefineToolInput, ToolDefinition } from './definition.ts';

export { ToolRegistry, createToolRegistry } from './registry.ts';

export {
  createAgentToolActor,
  createSystemToolActor,
  createUserToolActor,
  evaluateToolPermission,
} from './evaluate-permission.ts';
export type {
  ToolPermissionActor,
  ToolPermissionAgentProjection,
  ToolPermissionDenialCode,
  ToolPermissionEvaluation,
} from './evaluate-permission.ts';

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

export { TOOL_EVENT_TYPES } from './events.ts';

export { requestToolUse } from './request-tool.ts';
export type { RequestToolUseInput } from './request-tool.ts';

export {
  cancelToolRequest,
  denyToolRequest,
  getToolRequestById,
  listToolRequests,
  markToolRequestReady,
  markToolRequestWaitingApproval,
} from './requests.ts';
export type { ToolRequestListFilter } from './requests.ts';

export {
  cancelQueuedToolExecution,
  completeToolExecution,
  createToolExecutionAttempt,
  failToolExecution,
  getToolExecutionById,
  listToolExecutions,
  listToolExecutionsForRequest,
  markToolExecutionRunning,
} from './executions.ts';
export type { ToolExecutionListFilter } from './executions.ts';
