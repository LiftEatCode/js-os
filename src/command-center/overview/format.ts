/// <reference types="temporal-polyfill/types/global" />
/**
 * Server-safe business-local timestamp formatting.
 * Uses Temporal Instant + Organization timezone. No extra date library.
 */

export function formatBusinessInstant(
  value: Temporal.Instant | null | undefined,
  timeZone: string,
): string | null {
  if (!value) {
    return null;
  }

  const zone = timeZone.trim() || 'America/Chicago';

  try {
    return value.toZonedDateTimeISO(zone).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return value.toString();
  }
}

export function formatBusinessDate(
  value: Temporal.Instant | null | undefined,
  timeZone: string,
): string | null {
  if (!value) {
    return null;
  }

  const zone = timeZone.trim() || 'America/Chicago';

  try {
    return value.toZonedDateTimeISO(zone).toPlainDate().toLocaleString('en-US', {
      dateStyle: 'medium',
    });
  } catch {
    return value.toString();
  }
}
