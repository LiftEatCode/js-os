import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  parseApprovalDecisionForm,
  parseApprovalRequestForm,
  parseExpiresAt,
  parseOptionalUuid,
  parsePayloadJson,
  parseRequesterFilter,
  parseRiskFilter,
  parseStatusFilter,
} from './parse.ts';

describe('Approval form parsing', () => {
  it('parses a valid request', () => {
    const form = new FormData();
    form.set('title', 'Send outreach email to prospect');
    form.set('actionType', 'outreach.send_email');
    form.set('riskLevel', 'HIGH');
    form.set('description', 'Authorize the prepared outreach.');
    form.set('workItemId', '11111111-1111-4111-8111-111111111111');
    form.set('expiresAt', '2026-12-31');
    form.set('payload', '{"to":"prospect@example.com"}');
    const parsed = parseApprovalRequestForm(form, 'America/Chicago');
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.value.title, 'Send outreach email to prospect');
      assert.equal(parsed.value.actionType, 'outreach.send_email');
      assert.equal(parsed.value.riskLevel, 'HIGH');
      assert.equal(parsed.value.workItemId, '11111111-1111-4111-8111-111111111111');
      assert.deepEqual(parsed.value.payload, { to: 'prospect@example.com' });
      assert.ok(parsed.value.expiresAt);
    }
  });

  it('rejects an empty title', () => {
    const form = new FormData();
    form.set('title', '   ');
    form.set('actionType', 'outreach.send_email');
    form.set('riskLevel', 'MEDIUM');
    const parsed = parseApprovalRequestForm(form, 'America/Chicago');
    assert.equal(parsed.ok, false);
    if (!parsed.ok) {
      assert.equal(parsed.state.fieldErrors?.title, 'Title is required.');
    }
  });

  it('rejects an invalid action type', () => {
    const form = new FormData();
    form.set('title', 'Send email');
    form.set('actionType', 'Send Email');
    form.set('riskLevel', 'LOW');
    const parsed = parseApprovalRequestForm(form, 'America/Chicago');
    assert.equal(parsed.ok, false);
    if (!parsed.ok) {
      assert.match(parsed.state.fieldErrors?.actionType ?? '', /lowercase\.dot\.notation/);
    }
  });

  it('rejects an invalid risk level', () => {
    const form = new FormData();
    form.set('title', 'Send email');
    form.set('actionType', 'outreach.send_email');
    form.set('riskLevel', 'URGENT');
    const parsed = parseApprovalRequestForm(form, 'America/Chicago');
    assert.equal(parsed.ok, false);
    if (!parsed.ok) {
      assert.equal(parsed.state.fieldErrors?.riskLevel, 'Risk level is invalid.');
    }
  });

  it('rejects invalid JSON payload and accepts empty as null', () => {
    assert.equal(parsePayloadJson('{nope').ok, false);
    assert.deepEqual(parsePayloadJson(''), { ok: true, value: null });
    assert.deepEqual(parsePayloadJson('{"ok":true}'), { ok: true, value: { ok: true } });
  });

  it('rejects an invalid expiration', () => {
    assert.equal(parseExpiresAt('2026-13-40', 'America/Chicago').ok, false);
  });

  it('validates linked WorkItem UUIDs', () => {
    assert.equal(parseOptionalUuid('not-a-uuid').ok, false);
    assert.deepEqual(parseOptionalUuid(''), { ok: true, value: null });
  });

  it('requires a rejection reason and accepts optional approve/cancel reasons', () => {
    const reject = new FormData();
    reject.set('approvalId', '11111111-1111-4111-8111-111111111111');
    reject.set('decision', 'reject');
    const parsedReject = parseApprovalDecisionForm(reject);
    assert.equal(parsedReject.ok, false);
    if (!parsedReject.ok) {
      assert.equal(
        parsedReject.state.fieldErrors?.decisionReason,
        'A reason is required when rejecting an approval.',
      );
    }

    const approve = new FormData();
    approve.set('approvalId', '11111111-1111-4111-8111-111111111111');
    approve.set('decision', 'approve');
    const parsedApprove = parseApprovalDecisionForm(approve);
    assert.equal(parsedApprove.ok, true);
  });

  it('requires the critical confirmation checkbox value when present as confirmation', () => {
    const form = new FormData();
    form.set('approvalId', '11111111-1111-4111-8111-111111111111');
    form.set('decision', 'approve');
    form.set('criticalConfirmation', 'on');
    const parsed = parseApprovalDecisionForm(form);
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.value.criticalConfirmed, true);
    }
  });

  it('ignores unknown list filters', () => {
    assert.equal(parseStatusFilter('PENDING'), 'PENDING');
    assert.equal(parseStatusFilter('nope'), undefined);
    assert.equal(parseRiskFilter('CRITICAL'), 'CRITICAL');
    assert.equal(parseRiskFilter('URGENT'), undefined);
    assert.equal(parseRequesterFilter('AGENT'), 'AGENT');
    assert.equal(parseRequesterFilter('BOT'), undefined);
  });
});
