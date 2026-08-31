import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  parseDueAt,
  parseOptionalUuid,
  parsePriorityFilter,
  parseStatusFilter,
  parseWorkForm,
  parseWorkTypeFilter,
} from './parse.ts';

describe('work form parsing', () => {
  it('rejects an empty title', () => {
    const form = new FormData();
    form.set('title', '   ');
    form.set('status', 'BACKLOG');
    form.set('priority', 'MEDIUM');
    form.set('workType', 'TASK');
    const parsed = parseWorkForm(form, 'America/Chicago');
    assert.equal(parsed.ok, false);
    if (!parsed.ok) {
      assert.equal(parsed.state.fieldErrors?.title, 'Title is required.');
    }
  });

  it('rejects invalid enums', () => {
    const form = new FormData();
    form.set('title', 'Ship onboarding');
    form.set('status', 'DONE');
    form.set('priority', 'URGENT');
    form.set('workType', 'MISC');
    const parsed = parseWorkForm(form, 'America/Chicago');
    assert.equal(parsed.ok, false);
    if (!parsed.ok) {
      assert.equal(parsed.state.fieldErrors?.status, 'Status is invalid.');
      assert.equal(parsed.state.fieldErrors?.priority, 'Priority is invalid.');
      assert.equal(parsed.state.fieldErrors?.workType, 'Work type is invalid.');
    }
  });

  it('rejects an invalid due date', () => {
    assert.equal(parseDueAt('2026-13-40', 'America/Chicago').ok, false);
  });

  it('parses a valid form including optional ids and due date', () => {
    const form = new FormData();
    form.set('title', 'Prepare client proposal');
    form.set('status', 'READY');
    form.set('priority', 'HIGH');
    form.set('workType', 'CLIENT_WORK');
    form.set('goalId', '11111111-1111-4111-8111-111111111111');
    form.set('parentId', '');
    form.set('assignedAgentId', '22222222-2222-4222-8222-222222222222');
    form.set('dueAt', '2026-12-31');
    const parsed = parseWorkForm(form, 'America/Chicago');
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.value.status, 'READY');
      assert.equal(parsed.value.workType, 'CLIENT_WORK');
      assert.equal(parsed.value.goalId, '11111111-1111-4111-8111-111111111111');
      assert.equal(parsed.value.parentId, null);
      assert.ok(parsed.value.dueAt);
      const date = parsed.value.dueAt.toZonedDateTimeISO('America/Chicago').toPlainDate();
      assert.equal(date.toString(), '2026-12-31');
    }
  });

  it('rejects invalid optional UUIDs', () => {
    assert.equal(parseOptionalUuid('not-a-uuid').ok, false);
    assert.deepEqual(parseOptionalUuid(''), { ok: true, value: null });
  });

  it('ignores unknown list filters', () => {
    assert.equal(parseStatusFilter('IN_PROGRESS'), 'IN_PROGRESS');
    assert.equal(parseStatusFilter('nope'), undefined);
    assert.equal(parsePriorityFilter('CRITICAL'), 'CRITICAL');
    assert.equal(parseWorkTypeFilter('ENGINEERING'), 'ENGINEERING');
    assert.equal(parseWorkTypeFilter('nope'), undefined);
  });
});
