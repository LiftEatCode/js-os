import type { BusinessEventSourceType } from '../../business-state/types.ts';

export const ACTIVITY_PAGE_SIZE = 50;

export const BUSINESS_EVENT_SOURCE_TYPES = [
  'SYSTEM',
  'USER',
  'AGENT',
  'JS_GROWTH',
  'GITHUB',
  'EMAIL',
  'CALENDAR',
  'PAYMENTS',
  'OTHER',
] as const satisfies readonly BusinessEventSourceType[];

export const BUSINESS_EVENT_SOURCE_SET = new Set<string>(BUSINESS_EVENT_SOURCE_TYPES);

const SOURCE_LABELS: Record<BusinessEventSourceType, string> = {
  SYSTEM: 'System',
  USER: 'User',
  AGENT: 'Agent',
  JS_GROWTH: 'JS Growth',
  GITHUB: 'GitHub',
  EMAIL: 'Email',
  CALENDAR: 'Calendar',
  PAYMENTS: 'Payments',
  OTHER: 'Other',
};

export function formatSourceType(sourceType: string): string {
  if (sourceType in SOURCE_LABELS) {
    return SOURCE_LABELS[sourceType as BusinessEventSourceType];
  }
  return sourceType
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Display label for an open-ended eventType. Does not validate or rewrite the stored value.
 */
export function formatEventTypeLabel(eventType: string): string {
  const trimmed = eventType.trim();
  if (trimmed.length === 0) {
    return 'Event';
  }
  return trimmed
    .split('.')
    .flatMap((segment) => segment.split('_'))
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function formatEventMetadata(metadata: unknown): string | null {
  if (metadata == null) {
    return null;
  }
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return 'Metadata could not be displayed.';
  }
}
