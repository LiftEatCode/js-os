/// <reference types="temporal-polyfill/types/global" />
import { formatBusinessInstant } from '../overview/format.ts';

const REDACTED = '[redacted]';

/**
 * Keys that must never appear in Command Center JSON. Idempotency keys are
 * request identifiers, not credentials, and are shown in a dedicated field.
 */
const SENSITIVE_KEY_PATTERN =
  /password|passwd|secret|token|credential|authorization|apikey|privatekey|accesskey|clientsecret|databaseurl/;

export function formatToolInstant(value: string | null | undefined, timeZone: string): string | null {
  if (!value) {
    return null;
  }

  try {
    return formatBusinessInstant(Temporal.Instant.from(value), timeZone);
  } catch {
    return value;
  }
}

export function formatReadOnlyJson(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  try {
    return JSON.stringify(redactSensitiveJson(value), null, 2);
  } catch {
    return 'Value could not be displayed.';
  }
}

export function redactSensitiveJson(value: unknown): unknown {
  if (value == null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveJson(item));
  }

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    result[key] = isSensitiveKey(key) ? REDACTED : redactSensitiveJson(item);
  }
  return result;
}

function isSensitiveKey(key: string): boolean {
  const normalized = key.replace(/[-_]/g, '').toLowerCase();
  if (normalized === 'idempotencykey') {
    return false;
  }
  if (normalized === 'env' || normalized === 'environment') {
    return true;
  }
  return SENSITIVE_KEY_PATTERN.test(normalized);
}
