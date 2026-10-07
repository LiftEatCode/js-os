import { isValidToolSlug } from '../../tools/validation.ts';
import type { ToolRequestStatus } from '../../tools/types.ts';
import { TOOL_REQUEST_FILTER_STATUS_SET } from './constants.ts';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isToolRequestUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isToolRequestStatus(value: string): value is ToolRequestStatus {
  return TOOL_REQUEST_FILTER_STATUS_SET.has(value);
}

/**
 * Invalid values are ignored so a bookmarkable filter cannot blank the page.
 */
export function parseToolRequestStatusFilter(
  value: string | string[] | undefined,
): ToolRequestStatus | undefined {
  const raw = firstParam(value)?.trim();
  return raw && isToolRequestStatus(raw) ? raw : undefined;
}

export function parseToolSlugFilter(value: string | string[] | undefined): string | undefined {
  const raw = firstParam(value)?.trim();
  return raw && isValidToolSlug(raw) ? raw : undefined;
}
