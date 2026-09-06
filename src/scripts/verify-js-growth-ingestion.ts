import { db } from '../prisma/db.ts';
import { ingestJsGrowthEvent } from '../integrations/js-growth/ingest.ts';

const eventId = 'verify:js-growth-ingestion:v1';
const event = {
  version: 1 as const,
  eventId,
  eventType: 'growth.audit_completed' as const,
  occurredAt: new Date().toISOString(),
  title: 'Website audit completed',
  metadata: {
    audit_type: 'website' as const,
    result: 'completed' as const,
  },
};

try {
  console.log('JS Growth ingestion verification');

  const first = await ingestJsGrowthEvent(event);
  const second = await ingestJsGrowthEvent(event);

  console.log(`first delivery: ${first.status}`);
  console.log(`second delivery: ${second.status}`);
  console.log(`businessEventId: ${second.businessEventId}`);

  if (second.status !== 'duplicate') {
    throw new Error('Expected second delivery to be deduplicated.');
  }

  if (first.businessEventId !== second.businessEventId) {
    throw new Error('Replay resolved to a different BusinessEvent.');
  }

  console.log('JS Growth ingestion verification passed');
} finally {
  await db.close();
}
