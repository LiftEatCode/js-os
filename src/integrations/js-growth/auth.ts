import { timingSafeEqual } from 'node:crypto';

const AUTHORIZATION_PREFIX = 'Bearer ';

function constantTimeEqual(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function authenticateJsGrowthRequest(
  request: Request,
  configuredSecret: string | undefined = process.env['JS_GROWTH_EVENTS_SECRET'],
): boolean {
  if (!configuredSecret?.trim()) {
    return false;
  }

  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith(AUTHORIZATION_PREFIX)) {
    return false;
  }

  const token = authorization.slice(AUTHORIZATION_PREFIX.length).trim();
  if (!token) {
    return false;
  }

  return constantTimeEqual(token, configuredSecret.trim());
}
