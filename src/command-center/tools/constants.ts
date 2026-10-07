import { formatEnumLabel } from '../format.ts';
import type { ToolRequestStatus } from '../../tools/types.ts';

export const TOOL_REQUEST_SCAN_LIMIT = 200;
export const TOOL_REQUEST_LIST_LIMIT = 50;
export const TOOL_EXECUTION_SCAN_LIMIT = 200;

/**
 * Persisted operational statuses shown as dashboard filters.
 * Conceptual REQUESTED is not stored on ToolRequest rows.
 */
export const TOOL_REQUEST_LIST_STATUS_ORDER = [
  'WAITING_APPROVAL',
  'READY',
  'FULFILLED',
  'FAILED',
  'DENIED',
  'CANCELLED',
] as const satisfies readonly ToolRequestStatus[];

export const TOOL_REQUEST_FILTER_STATUS_SET = new Set<string>(TOOL_REQUEST_LIST_STATUS_ORDER);

export function workItemHref(id: string): string {
  return `/app/work/${id}`;
}

export function approvalHref(id: string): string {
  return `/app/approvals/${id}`;
}

export function agentHref(id: string): string {
  return `/app/agents/${id}`;
}

export function toolRequestHref(id: string): string {
  return `/app/tools/requests/${id}`;
}

export function formatToolLabel(value: string): string {
  return formatEnumLabel(value);
}
