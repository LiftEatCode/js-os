import { db } from '../prisma/db.ts';
import type { BusinessEvent, BusinessEventListFilter, RecordBusinessEventInput } from './types.ts';
import { clampListLimit, requireEventType, requireNonEmptyString } from './validation.ts';

export async function getBusinessEventById(id: string): Promise<BusinessEvent | null> {
  return db.orm.public.BusinessEvent.where({ id }).first();
}

export async function listBusinessEvents(
  filter: BusinessEventListFilter,
): Promise<BusinessEvent[]> {
  const where: {
    organizationId: string;
    eventType?: string;
    sourceType?: BusinessEventListFilter['sourceType'];
  } = { organizationId: filter.organizationId };

  if (filter.eventType) {
    where.eventType = filter.eventType;
  }
  if (filter.sourceType) {
    where.sourceType = filter.sourceType;
  }

  return db.orm.public.BusinessEvent.where(where)
    .orderBy((event) => event.occurredAt.desc())
    .limit(clampListLimit(filter.limit))
    .all();
}

export async function listRecentBusinessEvents(
  organizationId: string,
  limit?: number,
): Promise<BusinessEvent[]> {
  return listBusinessEvents({ organizationId, limit });
}

export async function recordBusinessEvent(
  input: RecordBusinessEventInput,
): Promise<BusinessEvent> {
  const eventType = requireEventType(input.eventType);
  const title = requireNonEmptyString(input.title, 'title');

  return db.orm.public.BusinessEvent.create({
    organizationId: input.organizationId,
    eventType,
    sourceType: input.sourceType,
    title,
    description: input.description ?? null,
    sourceId: input.sourceId ?? null,
    occurredAt: input.occurredAt ?? Temporal.Now.instant(),
    metadata: input.metadata ?? null,
  });
}
