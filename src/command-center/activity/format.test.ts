import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatEventMetadata,
  formatEventTypeLabel,
  formatSourceType,
} from './constants.ts';
import { parseEventTypeFilter, parseSourceTypeFilter } from './parse.ts';

describe('activity formatting', () => {
  it('formats known event types without changing the stored value', () => {
    assert.equal(formatEventTypeLabel('goal.progress_updated'), 'Goal Progress Updated');
    assert.equal(formatEventTypeLabel('work.created'), 'Work Created');
    assert.equal(formatEventTypeLabel('work.status_changed'), 'Work Status Changed');
  });

  it('formats unknown event types from arbitrary dot notation', () => {
    assert.equal(formatEventTypeLabel('new.integration.event'), 'New Integration Event');
    assert.equal(formatEventTypeLabel('lead.created'), 'Lead Created');
  });

  it('formats source types readably', () => {
    assert.equal(formatSourceType('USER'), 'User');
    assert.equal(formatSourceType('SYSTEM'), 'System');
    assert.equal(formatSourceType('AGENT'), 'Agent');
    assert.equal(formatSourceType('JS_GROWTH'), 'JS Growth');
    assert.equal(formatSourceType('GITHUB'), 'GitHub');
  });

  it('stringifies metadata as pretty JSON and treats null as absent', () => {
    assert.equal(formatEventMetadata(null), null);
    assert.equal(formatEventMetadata({ goalId: 'g1', newStatus: 'ACTIVE' }), '{\n  "goalId": "g1",\n  "newStatus": "ACTIVE"\n}');
  });
});

describe('activity filter parsing', () => {
  it('accepts known source types and ignores unknown values', () => {
    assert.equal(parseSourceTypeFilter('USER'), 'USER');
    assert.equal(parseSourceTypeFilter('nope'), undefined);
    assert.equal(parseSourceTypeFilter(undefined), undefined);
  });

  it('trims eventType and treats empty as unset', () => {
    assert.equal(parseEventTypeFilter('  work.completed  '), 'work.completed');
    assert.equal(parseEventTypeFilter('   '), undefined);
    assert.equal(parseEventTypeFilter(undefined), undefined);
  });
});
