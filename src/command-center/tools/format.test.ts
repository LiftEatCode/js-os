import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatReadOnlyJson, redactSensitiveJson } from './format.ts';

describe('redactSensitiveJson', () => {
  it('redacts credential-like keys and leaves business fields intact', () => {
    assert.deepEqual(
      redactSensitiveJson({
        title: 'Create work',
        apiKey: 'sk-live-secret',
        password: 'hunter2',
        access_token: 'tok',
        DATABASE_URL: 'postgres://internal',
        env: { NODE_ENV: 'production' },
        idempotencyKey: 'keep-this',
      }),
      {
        title: 'Create work',
        apiKey: '[redacted]',
        password: '[redacted]',
        access_token: '[redacted]',
        DATABASE_URL: '[redacted]',
        env: '[redacted]',
        idempotencyKey: 'keep-this',
      },
    );
  });

  it('walks nested objects and arrays', () => {
    assert.deepEqual(
      redactSensitiveJson({
        output: [{ client_secret: 'abc', workItemId: 'work-1' }],
      }),
      {
        output: [{ client_secret: '[redacted]', workItemId: 'work-1' }],
      },
    );
  });
});

describe('formatReadOnlyJson', () => {
  it('returns null for missing values and pretty-prints redacted JSON', () => {
    assert.equal(formatReadOnlyJson(null), null);
    assert.equal(
      formatReadOnlyJson({ title: 'Work', token: 'secret-value' }),
      '{\n  "title": "Work",\n  "token": "[redacted]"\n}',
    );
  });
});
