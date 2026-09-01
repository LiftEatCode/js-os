import { clampListLimit } from '../../business-state/validation.ts';
import type { BusinessEventSourceType } from '../../business-state/types.ts';
import { ACTIVITY_PAGE_SIZE, BUSINESS_EVENT_SOURCE_SET } from './constants.ts';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isEventUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseSourceTypeFilter(
  value: string | string[] | undefined,
): BusinessEventSourceType | undefined {
  const raw = firstParam(value)?.trim();
  if (!raw || !BUSINESS_EVENT_SOURCE_SET.has(raw)) {
    return undefined;
  }
  return raw as BusinessEventSourceType;
}

export function parseEventTypeFilter(value: string | string[] | undefined): string | undefined {
  const raw = firstParam(value)?.trim();
  return raw && raw.length > 0 ? raw : undefined;
}

export function parseActivityLimit(value: string | string[] | undefined): number {
  const raw = firstParam(value)?.trim();
  if (!raw) {
    return ACTIVITY_PAGE_SIZE;
  }
  const parsed = Number(raw);
  try {
    return clampListLimit(parsed, ACTIVITY_PAGE_SIZE);
  } catch {
    return ACTIVITY_PAGE_SIZE;
  }
}
