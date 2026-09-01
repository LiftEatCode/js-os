import type { ToolRequest } from './types.ts';

/**
 * Deterministic JSON comparison for idempotency and persisted payloads.
 * Object keys are sorted; arrays keep order.
 */
export function canonicalizeJson(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value ?? null;
  }
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeJson(item));
  }
  const record = value as Record<string, unknown>;
  const canonical: Record<string, unknown> = {};
  for (const key of Object.keys(record).toSorted()) {
    canonical[key] = canonicalizeJson(record[key]);
  }
  return canonical;
}

export function canonicalJsonString(value: unknown): string {
  return JSON.stringify(canonicalizeJson(value));
}

export function jsonValuesEqual(left: unknown, right: unknown): boolean {
  return canonicalJsonString(left) === canonicalJsonString(right);
}

export function asJsonValue(value: unknown): ToolRequest['input'] {
  if (value === undefined) {
    return null;
  }
  try {
    return JSON.parse(JSON.stringify(value)) as ToolRequest['input'];
  } catch {
    throw new TypeError('Value is not JSON-serializable.');
  }
}

