/// <reference types="temporal-polyfill/types/global" />

export type SortableBusinessEvent = {
  id: string;
  occurredAt: Temporal.Instant;
  createdAt: Temporal.Instant;
};

export function compareBusinessEvents(a: SortableBusinessEvent, b: SortableBusinessEvent): number {
  const byOccurred = Temporal.Instant.compare(b.occurredAt, a.occurredAt);
  if (byOccurred !== 0) {
    return byOccurred;
  }
  const byCreated = Temporal.Instant.compare(b.createdAt, a.createdAt);
  if (byCreated !== 0) {
    return byCreated;
  }
  return b.id.localeCompare(a.id);
}

export function sortBusinessEvents<T extends SortableBusinessEvent>(events: T[]): T[] {
  return [...events].sort(compareBusinessEvents);
}
