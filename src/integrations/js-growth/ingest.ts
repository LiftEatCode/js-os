import { db } from '../../prisma/db.ts';
import {
  getJsSolutionsOrganization,
  recordBusinessEvent,
  type BusinessEvent,
} from '../../business-state/index.ts';
import type { JsGrowthBusinessEventV1, JsGrowthEventType } from './contract.ts';

export type JsGrowthIngestResult =
  | {
      status: 'accepted';
      eventId: string;
      businessEventId: string;
    }
  | {
      status: 'duplicate';
      eventId: string;
      businessEventId: string;
    };

type ExistingBusinessEvent = Pick<BusinessEvent, 'id' | 'sourceId'>;

type IngestDependencies = {
  getOrganizationId: () => Promise<string>;
  findExisting: (input: {
    organizationId: string;
    eventId: string;
  }) => Promise<ExistingBusinessEvent | null>;
  record: (input: {
    organizationId: string;
    event: JsGrowthBusinessEventV1;
    title: string;
  }) => Promise<ExistingBusinessEvent>;
};

const EVENT_TITLES: Record<JsGrowthEventType, string> = {
  'growth.quote_submitted': 'Quote request submitted',
  'growth.audit_completed': 'Website audit completed',
};

const defaultDependencies: IngestDependencies = {
  async getOrganizationId() {
    return (await getJsSolutionsOrganization()).id;
  },

  async findExisting({ organizationId, eventId }) {
    return db.orm.public.BusinessEvent.where({
      organizationId,
      sourceType: 'JS_GROWTH',
      sourceId: eventId,
    }).first();
  },

  async record({ organizationId, event, title }) {
    return recordBusinessEvent({
      organizationId,
      eventType: event.eventType,
      sourceType: 'JS_GROWTH',
      sourceId: event.eventId,
      title,
      occurredAt: Temporal.Instant.from(event.occurredAt),
      metadata: (event.metadata ?? null) as BusinessEvent['metadata'],
    });
  },
};

export async function ingestJsGrowthEventWithDependencies(
  event: JsGrowthBusinessEventV1,
  dependencies: IngestDependencies,
): Promise<JsGrowthIngestResult> {
  const organizationId = await dependencies.getOrganizationId();
  const existing = await dependencies.findExisting({
    organizationId,
    eventId: event.eventId,
  });

  if (existing) {
    return {
      status: 'duplicate',
      eventId: event.eventId,
      businessEventId: existing.id,
    };
  }

  try {
    const created = await dependencies.record({
      organizationId,
      event,
      title: EVENT_TITLES[event.eventType],
    });

    return {
      status: 'accepted',
      eventId: event.eventId,
      businessEventId: created.id,
    };
  } catch (error) {
    // Once the composite unique constraint is applied, concurrent duplicate
    // deliveries race safely here. Re-read before deciding the write failed.
    const duplicate = await dependencies.findExisting({
      organizationId,
      eventId: event.eventId,
    });

    if (duplicate) {
      return {
        status: 'duplicate',
        eventId: event.eventId,
        businessEventId: duplicate.id,
      };
    }

    throw error;
  }
}

export async function ingestJsGrowthEvent(
  event: JsGrowthBusinessEventV1,
): Promise<JsGrowthIngestResult> {
  return ingestJsGrowthEventWithDependencies(event, defaultDependencies);
}
