import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  parseGoalForm,
  parseOptionalDecimal,
  parseStatusFilter,
  parseTargetDate,
} from './parse.ts';

describe('goal form parsing', () => {
  it('rejects an empty title', () => {
    const form = new FormData();
    form.set('title', '   ');
    form.set('status', 'DRAFT');
    form.set('priority', 'MEDIUM');
    form.set('timeHorizon', 'QUARTERLY');
    const parsed = parseGoalForm(form, 'America/Chicago');
    assert.equal(parsed.ok, false);
    if (!parsed.ok) {
      assert.equal(parsed.state.fieldErrors?.title, 'Title is required.');
    }
  });

  it('rejects invalid enums', () => {
    const form = new FormData();
    form.set('title', 'Grow pipeline');
    form.set('status', 'DONE');
    form.set('priority', 'URGENT');
    form.set('timeHorizon', 'WEEK');
    const parsed = parseGoalForm(form, 'America/Chicago');
    assert.equal(parsed.ok, false);
    if (!parsed.ok) {
      assert.equal(parsed.state.fieldErrors?.status, 'Status is invalid.');
      assert.equal(parsed.state.fieldErrors?.priority, 'Priority is invalid.');
      assert.equal(parsed.state.fieldErrors?.timeHorizon, 'Time horizon is invalid.');
    }
  });

  it('rejects invalid decimals and preserves valid decimal strings', () => {
    assert.deepEqual(parseOptionalDecimal(''), { ok: true, value: null });
    assert.deepEqual(parseOptionalDecimal('  8500.00  '), { ok: true, value: '8500.00' });
    assert.deepEqual(parseOptionalDecimal('-4.5'), { ok: true, value: '-4.5' });
    assert.equal(parseOptionalDecimal('abc').ok, false);
    assert.equal(parseOptionalDecimal('1e3').ok, false);
    assert.equal(parseOptionalDecimal('12.34.56').ok, false);
    assert.equal(parseOptionalDecimal('1,000').ok, false);
  });

  it('parses optional metric fields and a target date in the organization timezone', () => {
    const form = new FormData();
    form.set('title', 'Increase MRR');
    form.set('status', 'DRAFT');
    form.set('priority', 'MEDIUM');
    form.set('timeHorizon', 'QUARTERLY');
    form.set('metricName', 'Monthly recurring revenue');
    form.set('metricUnit', 'USD');
    form.set('targetValue', '15000');
    form.set('currentValue', '8500.00');
    form.set('targetDate', '2026-12-31');
    const parsed = parseGoalForm(form, 'America/Chicago');
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.value.metricName, 'Monthly recurring revenue');
      assert.equal(parsed.value.targetValue, '15000');
      assert.equal(parsed.value.currentValue, '8500.00');
      assert.ok(parsed.value.targetDate);
      const date = parsed.value.targetDate.toZonedDateTimeISO('America/Chicago').toPlainDate();
      assert.equal(date.toString(), '2026-12-31');
    }
  });

  it('rejects an invalid target date', () => {
    assert.equal(parseTargetDate('2026-13-40', 'America/Chicago').ok, false);
  });

  it('ignores unknown status filters', () => {
    assert.equal(parseStatusFilter('ACTIVE'), 'ACTIVE');
    assert.equal(parseStatusFilter('nope'), undefined);
    assert.equal(parseStatusFilter(undefined), undefined);
  });
});
