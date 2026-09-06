import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { authenticateJsGrowthRequest } from './auth.ts';

function requestWithAuthorization(value?: string): Request {
  return new Request('https://js-os.test/api/integrations/js-growth/events', {
    method: 'POST',
    headers: value ? { authorization: value } : undefined,
  });
}

describe('JS Growth event authentication', () => {
  it('accepts a matching bearer secret', () => {
    assert.equal(
      authenticateJsGrowthRequest(
        requestWithAuthorization('Bearer test-secret'),
        'test-secret',
      ),
      true,
    );
  });

  it('fails closed for missing or invalid configuration', () => {
    assert.equal(
      authenticateJsGrowthRequest(requestWithAuthorization('Bearer test-secret'), undefined),
      false,
    );
    assert.equal(
      authenticateJsGrowthRequest(requestWithAuthorization('Bearer test-secret'), ''),
      false,
    );
  });

  it('rejects missing, malformed, and incorrect credentials', () => {
    assert.equal(authenticateJsGrowthRequest(requestWithAuthorization(), 'test-secret'), false);
    assert.equal(
      authenticateJsGrowthRequest(requestWithAuthorization('Basic test-secret'), 'test-secret'),
      false,
    );
    assert.equal(
      authenticateJsGrowthRequest(requestWithAuthorization('Bearer wrong-secret'), 'test-secret'),
      false,
    );
  });
});
