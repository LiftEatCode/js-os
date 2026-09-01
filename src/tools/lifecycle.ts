import { InvalidToolTransitionError } from './errors.ts';
import {
  TERMINAL_TOOL_EXECUTION_STATUSES,
  TERMINAL_TOOL_REQUEST_STATUSES,
  type ToolExecutionStatus,
  type ToolRequestStatus,
} from './types.ts';

/**
 * ToolRequest.status = FAILED means at least one ToolExecution attempt ran and
 * the logical action did not succeed.
 *
 * FAILED is not used for invalid input, disabled tools, insufficient permission,
 * unsupported actors, or approval required/rejected/expired. Those either prevent
 * request creation or result in DENIED, WAITING_APPROVAL, or CANCELLED.
 */
const TOOL_REQUEST_TRANSITIONS: Record<ToolRequestStatus, readonly ToolRequestStatus[]> = {
  REQUESTED: ['WAITING_APPROVAL', 'READY', 'DENIED', 'CANCELLED'],
  WAITING_APPROVAL: ['READY', 'DENIED', 'CANCELLED'],
  READY: ['FULFILLED', 'FAILED', 'CANCELLED'],
  FULFILLED: [],
  FAILED: [],
  CANCELLED: [],
  DENIED: [],
};

/**
 * ToolExecution.status = FAILED means the adapter attempt ran and failed.
 * RUNNING → CANCELLED is unsupported in v0.1.
 */
const TOOL_EXECUTION_TRANSITIONS: Record<ToolExecutionStatus, readonly ToolExecutionStatus[]> = {
  QUEUED: ['RUNNING', 'CANCELLED'],
  RUNNING: ['SUCCEEDED', 'FAILED'],
  SUCCEEDED: [],
  FAILED: [],
  CANCELLED: [],
};

export function isTerminalToolRequestStatus(status: ToolRequestStatus): boolean {
  return (TERMINAL_TOOL_REQUEST_STATUSES as readonly ToolRequestStatus[]).includes(status);
}

export function isTerminalToolExecutionStatus(status: ToolExecutionStatus): boolean {
  return (TERMINAL_TOOL_EXECUTION_STATUSES as readonly ToolExecutionStatus[]).includes(status);
}

export function canTransitionToolRequest(
  from: ToolRequestStatus,
  to: ToolRequestStatus,
): boolean {
  return TOOL_REQUEST_TRANSITIONS[from].includes(to);
}

export function canTransitionToolExecution(
  from: ToolExecutionStatus,
  to: ToolExecutionStatus,
): boolean {
  return TOOL_EXECUTION_TRANSITIONS[from].includes(to);
}

export function assertToolRequestTransition(
  from: ToolRequestStatus,
  to: ToolRequestStatus,
): void {
  if (!canTransitionToolRequest(from, to)) {
    throw new InvalidToolTransitionError(
      `ToolRequest cannot transition from ${from} to ${to}.`,
    );
  }
}

export function assertToolExecutionTransition(
  from: ToolExecutionStatus,
  to: ToolExecutionStatus,
): void {
  if (!canTransitionToolExecution(from, to)) {
    throw new InvalidToolTransitionError(
      `ToolExecution cannot transition from ${from} to ${to}.`,
    );
  }
}

/**
 * Request cancellation is valid from REQUESTED, WAITING_APPROVAL, and READY.
 * Execution cancellation is valid only QUEUED → CANCELLED.
 */
export function canCancelToolRequest(status: ToolRequestStatus): boolean {
  return canTransitionToolRequest(status, 'CANCELLED');
}

export function canCancelToolExecution(status: ToolExecutionStatus): boolean {
  return canTransitionToolExecution(status, 'CANCELLED');
}
