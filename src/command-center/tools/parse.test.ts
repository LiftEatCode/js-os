import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseToolRequestStatusFilter, parseToolSlugFilter } from './parse.ts';

describe('parseToolRequestStatusFilter', () => {
  it('accepts persisted ToolRequest statuses', () => {
    assert.equal(parseToolRequestStatusFilter('WAITING_APPROVAL'), 'WAITING_APPROVAL');
    assert.equal(parseToolRequestStatusFilter('READY'), 'READY');
    assert.equal(parseToolRequestStatusFilter('FULFILLED'), 'FULFILLED');
    assert.equal(parseToolRequestStatusFilter('FAILED'), 'FAILED');
    assert.equal(parseToolRequestStatusFilter('DENIED'), 'DENIED');
  });

  it('ignores invalid status values instead of throwing', () => {
    assert.equal(parseToolRequestStatusFilter('nope'), undefined);
    assert.equal(parseToolRequestStatusFilter('waiting_approval'), undefined);
    assert.equal(parseToolRequestStatusFilter('REQUESTED'), undefined);
    assert.equal(parseToolRequestStatusFilter(''), undefined);
    assert.equal(parseToolRequestStatusFilter(undefined), undefined);
  });
});

describe('parseToolSlugFilter', () => {
  it('accepts valid tool slugs and ignores invalid values', () => {
    assert.equal(parseToolSlugFilter('internal.create_work_item'), 'internal.create_work_item');
    assert.equal(parseToolSlugFilter('not a slug'), undefined);
    assert.equal(parseToolSlugFilter('CreateWorkItem'), undefined);
    assert.equal(parseToolSlugFilter(undefined), undefined);
  });
});
