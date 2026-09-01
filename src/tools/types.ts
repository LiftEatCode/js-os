import type { FieldOutputTypes } from '../prisma/contract.d';

export type ToolRequest = FieldOutputTypes['public']['ToolRequest'];
export type ToolExecution = FieldOutputTypes['public']['ToolExecution'];

export type ToolRequestStatus = ToolRequest['status'];
export type ToolExecutionStatus = ToolExecution['status'];
export type ToolRequiredPermission = ToolRequest['requiredPermission'];
export type ToolRiskLevel = ToolRequest['riskLevel'];
export type ToolApprovalRequirement = ToolRequest['approvalRequirement'];
export type ToolActorType = ToolRequest['requestedByType'];

export const TOOL_REQUEST_STATUSES = [
  'REQUESTED',
  'WAITING_APPROVAL',
  'READY',
  'FULFILLED',
  'FAILED',
  'CANCELLED',
  'DENIED',
] as const satisfies readonly ToolRequestStatus[];

export const TOOL_EXECUTION_STATUSES = [
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
] as const satisfies readonly ToolExecutionStatus[];

export const TERMINAL_TOOL_REQUEST_STATUSES = [
  'FULFILLED',
  'FAILED',
  'CANCELLED',
  'DENIED',
] as const satisfies readonly ToolRequestStatus[];

export const TERMINAL_TOOL_EXECUTION_STATUSES = [
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
] as const satisfies readonly ToolExecutionStatus[];

export type TerminalToolRequestStatus = (typeof TERMINAL_TOOL_REQUEST_STATUSES)[number];
export type TerminalToolExecutionStatus = (typeof TERMINAL_TOOL_EXECUTION_STATUSES)[number];

/**
 * Historical snapshots stored on ToolRequest even though the future code registry
 * also holds the live contract. Registry definitions may change or disappear;
 * persisted rows must remain interpretable without live lookup.
 */
export type ToolRequestSnapshotFields = Pick<
  ToolRequest,
  'toolSlug' | 'toolName' | 'toolVersion' | 'requiredPermission' | 'riskLevel' | 'approvalRequirement'
>;
