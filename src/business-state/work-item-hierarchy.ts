export type WorkItemAncestryRow = {
  id: string;
  parentId: string | null;
};

/**
 * A WorkItem cannot become its own ancestor.
 * Walks parents of the proposed parent; a hit on workItemId is a cycle.
 */
export function wouldCreateParentCycle(
  workItemId: string,
  nextParentId: string | null,
  items: WorkItemAncestryRow[],
): boolean {
  if (!nextParentId) {
    return false;
  }
  if (nextParentId === workItemId) {
    return true;
  }

  const parentById = new Map(items.map((item) => [item.id, item.parentId]));
  if (!parentById.has(nextParentId)) {
    return false;
  }

  const seen = new Set<string>();
  let current: string | null = nextParentId;
  while (current) {
    if (current === workItemId) {
      return true;
    }
    if (seen.has(current)) {
      return true;
    }
    seen.add(current);
    current = parentById.get(current) ?? null;
  }
  return false;
}
