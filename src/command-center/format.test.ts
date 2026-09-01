import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatEnumLabel } from './format.ts';

describe('formatEnumLabel', () => {
  it('title-cases underscore tokens', () => {
    assert.equal(formatEnumLabel('IN_PROGRESS'), 'In Progress');
    assert.equal(formatEnumLabel('WAITING_APPROVAL'), 'Waiting Approval');
    assert.equal(formatEnumLabel('CLIENT_OPERATIONS'), 'Client Operations');
    assert.equal(formatEnumLabel('SHORT_TERM'), 'Short Term');
  });

  it('keeps product acronyms', () => {
    assert.equal(formatEnumLabel('CEO'), 'CEO');
    assert.equal(formatEnumLabel('JS_GROWTH'), 'JS Growth');
  });
});
