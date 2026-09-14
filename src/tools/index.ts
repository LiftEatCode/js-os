export {
  DuplicateToolImplementationError,
  DuplicateToolSlugError,
  InvalidToolDefinitionError,
  InvalidToolInputError,
  InvalidToolOutputError,
  InvalidToolTransitionError,
  ToolAuthorizationError,
  ToolDefinitionVersionMismatchError,
  ToolExecutionNotFoundError,
  ToolIdempotencyConflictError,
  ToolImplementationNotFoundError,
  ToolInvariantError,
  ToolNotFoundError,
  ToolRequestNotFoundError,
} from './errors.ts';

export { defineTool, getToolDefinitionSnapshot } from './definition.ts';
export type { DefineToolInput, ToolDefinition } from './definition.ts';

export { defineToolImplementation, eraseToolImplementation } from './implementation.ts';
export type {
  AnyToolImplementation,
  DefineToolImplementationInput,
  ToolExecutionActor,
  ToolExecutionContext,
  ToolImplementation,
} from './implementation.ts';

export { ToolRegistry, createToolRegistry } from './registry.ts';
export {
  ExecutableToolRegistry,
  createExecutableToolRegistry,
} from './executable-registry.ts';
export { executableToolRegistry } from './catalog.ts';

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

export {
  TOOL_APPROVAL_PAYLOAD_KIND,
  TOOL_DENIAL_REASONS,
  TOOL_EXECUTE_ACTION_TYPE,
  assertToolRequestAuthorizedForExecution,
  mapToolActorToApprovalRequester,
  mapToolRiskToApprovalRisk,
  toolApprovalDescription,
  toolApprovalTitle,
} from './approval.ts';
export type { ToolApprovalPayload, ToolDenialReason } from './approval.ts';

export { requestToolUse } from './request-tool.ts';
export type { RequestToolUseInput } from './request-tool.ts';

export {
  cancelToolRequest,
  denyToolRequest,
  getToolRequestByApprovalId,
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

export {
  createInternalCreateWorkItemImplementation,
  internalCreateWorkItemDefinition,
  internalCreateWorkItemImplementation,
  internalCreateWorkItemInputSchema,
  internalCreateWorkItemOutputSchema,
} from './definitions/internal-create-work-item.ts';
export type {
  InternalCreateWorkItemInput,
  InternalCreateWorkItemOutput,
} from './definitions/internal-create-work-item.ts';

export {
  createInternalUpdateWorkStatusImplementation,
  internalUpdateWorkStatusDefinition,
  internalUpdateWorkStatusImplementation,
  internalUpdateWorkStatusInputSchema,
  internalUpdateWorkStatusOutputSchema,
} from './definitions/internal-update-work-status.ts';
export type {
  InternalUpdateWorkStatusInput,
  InternalUpdateWorkStatusOutput,
} from './definitions/internal-update-work-status.ts';

export {
  createToolExecutionCoordinator,
  executeToolRequest,
} from './coordinator.ts';
export type { ToolExecutionCoordinatorDependencies } from './coordinator.ts';
