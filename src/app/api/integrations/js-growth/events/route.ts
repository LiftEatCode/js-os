import { authenticateJsGrowthRequest } from '../../../../../integrations/js-growth/auth.ts';
import { jsGrowthBusinessEventV1Schema } from '../../../../../integrations/js-growth/contract.ts';
import { ingestJsGrowthEvent } from '../../../../../integrations/js-growth/ingest.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 16 * 1024;

function json(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  if (!authenticateJsGrowthRequest(request)) {
    return json(401, { error: 'unauthorized' });
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json(413, { error: 'payload_too_large' });
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      return json(413, { error: 'payload_too_large' });
    }
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const parsed = jsGrowthBusinessEventV1Schema.safeParse(body);
  if (!parsed.success) {
    return json(400, { error: 'invalid_event' });
  }

  try {
    const result = await ingestJsGrowthEvent(parsed.data);

    if (result.status === 'duplicate') {
      console.info('js_growth_event.duplicate', {
        eventId: result.eventId,
        businessEventId: result.businessEventId,
      });
      return json(200, result);
    }

    console.info('js_growth_event.accepted', {
      eventId: result.eventId,
      eventType: parsed.data.eventType,
      businessEventId: result.businessEventId,
    });
    return json(202, result);
  } catch (error) {
    console.error('js_growth_event.failed', {
      eventId: parsed.data.eventId,
      eventType: parsed.data.eventType,
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    return json(500, { error: 'ingestion_failed' });
  }
}
