import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  InvalidBusinessStateInputError,
  InvalidBusinessStateTransitionError,
} from './errors.ts';
import {
  assertAgentRunCanCancel,
  assertAgentRunCanFinish,
  assertAgentRunCanStart,
  assertApprovalCanCancel,
  assertApprovalCanDecide,
  isValidEventType,
  requireActionType,
  requireEventType,
  requireNonEmptyString,
} from './validation.ts';

describe('business-state validation', () => {
  it('rejects empty titles', () => {
    assert.throws(() => requireNonEmptyString('   ', 'title'), InvalidBusinessStateInputError);
  });

  it('accepts lowercase.dot event types', () => {
    assert.equal(isValidEventType('lead.created'), true);
    assert.equal(isValidEventType('work.completed'), true);
    assert.equal(isValidEventType('approval.requested'), true);
    assert.equal(requireEventType('  lead.created  '), 'lead.created');
  });

  it('rejects invalid event types', () => {
    assert.equal(isValidEventType('Lead.Created'), false);
    assert.equal(isValidEventType('created'), false);
    assert.throws(() => requireEventType('CREATED'), InvalidBusinessStateInputError);
  });

  it('accepts lowercase.dot action types including underscores', () => {
    assert.equal(requireActionType('  outreach.send_email  '), 'outreach.send_email');
    assert.equal(requireActionType('payment.issue_refund'), 'payment.issue_refund');
    assert.throws(() => requireActionType('Send Email'), InvalidBusinessStateInputError);
    assert.throws(() => requireActionType('send'), InvalidBusinessStateInputError);
  });

  it('allows approval decisions only from PENDING', () => {
    assert.doesNotThrow(() => assertApprovalCanDecide('PENDING'));
    assert.throws(
      () => assertApprovalCanDecide('APPROVED'),
      InvalidBusinessStateTransitionError,
    );
    assert.throws(
      () => assertApprovalCanCancel('REJECTED'),
      InvalidBusinessStateTransitionError,
    );
  });

  it('enforces AgentRun lifecycle', () => {
    assert.doesNotThrow(() => assertAgentRunCanStart('QUEUED'));
    assert.throws(() => assertAgentRunCanStart('RUNNING'), InvalidBusinessStateTransitionError);
    assert.doesNotThrow(() => assertAgentRunCanFinish('RUNNING', 'COMPLETED'));
    assert.throws(
      () => assertAgentRunCanFinish('QUEUED', 'COMPLETED'),
      InvalidBusinessStateTransitionError,
    );
    assert.doesNotThrow(() => assertAgentRunCanCancel('QUEUED'));
    assert.doesNotThrow(() => assertAgentRunCanCancel('RUNNING'));
    assert.throws(
      () => assertAgentRunCanCancel('COMPLETED'),
      InvalidBusinessStateTransitionError,
    );
  });
});
