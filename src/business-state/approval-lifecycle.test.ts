import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { InvalidBusinessStateInputError } from './errors.ts';
import {
  isPendingPastExpiration,
  isTerminalApprovalStatus,
  nextApprovalDecision,
  requireRejectionReason,
} from './approval-lifecycle.ts';
import { assertApprovalCanCancel, assertApprovalCanDecide } from './validation.ts';

const now = Temporal.Instant.from('2026-08-31T18:00:00Z');
const earlier = Temporal.Instant.from('2026-08-01T00:00:00Z');

describe('Approval lifecycle', () => {
  it('allows PENDING to APPROVED, REJECTED, and CANCELLED', () => {
    assert.doesNotThrow(() => assertApprovalCanDecide('PENDING'));
    assert.doesNotThrow(() => assertApprovalCanCancel('PENDING'));
    assert.deepEqual(nextApprovalDecision('APPROVED', null, now), {
      status: 'APPROVED',
      decidedAt: now,
      decisionReason: null,
    });
    assert.deepEqual(nextApprovalDecision('REJECTED', 'Out of policy', now), {
      status: 'REJECTED',
      decidedAt: now,
      decisionReason: 'Out of policy',
    });
    assert.deepEqual(nextApprovalDecision('CANCELLED', 'Withdrawn', now), {
      status: 'CANCELLED',
      decidedAt: now,
      decisionReason: 'Withdrawn',
    });
  });

  it('treats APPROVED, REJECTED, CANCELLED, and EXPIRED as terminal', () => {
    assert.equal(isTerminalApprovalStatus('PENDING'), false);
    assert.equal(isTerminalApprovalStatus('APPROVED'), true);
    assert.equal(isTerminalApprovalStatus('REJECTED'), true);
    assert.equal(isTerminalApprovalStatus('CANCELLED'), true);
    assert.equal(isTerminalApprovalStatus('EXPIRED'), true);
  });

  it('rejects a second decision from a terminal status', () => {
    assert.throws(() => assertApprovalCanDecide('APPROVED'));
    assert.throws(() => assertApprovalCanDecide('REJECTED'));
    assert.throws(() => assertApprovalCanCancel('CANCELLED'));
    assert.throws(() => assertApprovalCanDecide('EXPIRED'));
  });

  it('sets decidedAt for approve, reject, and cancel', () => {
    assert.equal(nextApprovalDecision('APPROVED', 'ok', now).decidedAt, now);
    assert.equal(nextApprovalDecision('REJECTED', 'no', now).decidedAt, now);
    assert.equal(nextApprovalDecision('CANCELLED', null, now).decidedAt, now);
  });

  it('requires a decision reason for rejection and allows optional reasons otherwise', () => {
    assert.throws(() => requireRejectionReason(null), InvalidBusinessStateInputError);
    assert.throws(() => requireRejectionReason('  '), InvalidBusinessStateInputError);
    assert.throws(() => nextApprovalDecision('REJECTED', null, now), InvalidBusinessStateInputError);
    assert.equal(nextApprovalDecision('APPROVED', '  ', now).decisionReason, null);
    assert.equal(nextApprovalDecision('CANCELLED', undefined, now).decisionReason, null);
  });

  it('does not treat a past expiresAt as persisted EXPIRED', () => {
    assert.equal(isPendingPastExpiration('PENDING', earlier, now), true);
    assert.equal(isPendingPastExpiration('PENDING', null, now), false);
    assert.equal(isPendingPastExpiration('APPROVED', earlier, now), false);
    assert.equal(isPendingPastExpiration('EXPIRED', earlier, now), false);
  });
});
