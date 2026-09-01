import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { InvalidToolInputError } from './errors.ts';
import {
  TOOL_SLUG_MAX_LENGTH,
  agentRequestRequiresDefinition,
  assertAgentRequestHasDefinition,
  assertExecutionOrganizationMatchesRequest,
  isValidAttemptNumber,
  isValidToolSlug,
  isValidToolVersion,
  requireAttemptNumber,
  requireToolSlug,
  requireToolVersion,
} from './validation.ts';

describe('tool slug validation', () => {
  it('accepts lowercase.dot slugs including underscores', () => {
    assert.equal(isValidToolSlug('internal.create_work_item'), true);
    assert.equal(isValidToolSlug('internal.update_work_status'), true);
    assert.equal(isValidToolSlug('email.send'), true);
    assert.equal(isValidToolSlug('github.create_issue'), true);
    assert.equal(isValidToolSlug('js_growth.run_website_audit'), true);
    assert.equal(requireToolSlug('  email.send  '), 'email.send');
  });

  it('rejects invalid slug forms', () => {
    assert.equal(isValidToolSlug('Send Email'), false);
    assert.equal(isValidToolSlug('send'), false);
    assert.equal(isValidToolSlug('EMAIL.send'), false);
    assert.equal(isValidToolSlug('email.'), false);
    assert.equal(isValidToolSlug('.email.send'), false);
    assert.equal(isValidToolSlug('email..send'), false);
    assert.equal(isValidToolSlug('email.send-now'), false);
    assert.throws(() => requireToolSlug('Send Email'), InvalidToolInputError);
    assert.throws(() => requireToolSlug('send'), InvalidToolInputError);
  });

  it('rejects slugs longer than 120 characters', () => {
    const tooLong = `${'a'.repeat(60)}.${'b'.repeat(60)}`;
    assert.equal(tooLong.length > TOOL_SLUG_MAX_LENGTH, true);
    assert.equal(isValidToolSlug(tooLong), false);
    assert.throws(() => requireToolSlug(tooLong), InvalidToolInputError);
  });
});

describe('tool version and attempt number', () => {
  it('requires version >= 1', () => {
    assert.equal(isValidToolVersion(1), true);
    assert.equal(isValidToolVersion(2), true);
    assert.equal(requireToolVersion(1), 1);
    assert.equal(isValidToolVersion(0), false);
    assert.equal(isValidToolVersion(-1), false);
    assert.equal(isValidToolVersion(1.5), false);
    assert.throws(() => requireToolVersion(0), InvalidToolInputError);
  });

  it('requires attemptNumber >= 1', () => {
    assert.equal(isValidAttemptNumber(1), true);
    assert.equal(requireAttemptNumber(3), 3);
    assert.equal(isValidAttemptNumber(0), false);
    assert.equal(isValidAttemptNumber(-1), false);
    assert.equal(isValidAttemptNumber(1.2), false);
    assert.throws(() => requireAttemptNumber(0), InvalidToolInputError);
  });
});

describe('actor and organization invariants', () => {
  it('requires agentDefinitionId only for AGENT actors', () => {
    assert.equal(agentRequestRequiresDefinition('USER', null), true);
    assert.equal(agentRequestRequiresDefinition('SYSTEM', undefined), true);
    assert.equal(agentRequestRequiresDefinition('AGENT', 'def-1'), true);
    assert.equal(agentRequestRequiresDefinition('AGENT', null), false);
    assert.doesNotThrow(() => assertAgentRequestHasDefinition('USER', null));
    assert.throws(
      () => assertAgentRequestHasDefinition('AGENT', null),
      InvalidToolInputError,
    );
  });

  it('requires execution organization to match the request', () => {
    assert.doesNotThrow(() =>
      assertExecutionOrganizationMatchesRequest('org-1', 'org-1'),
    );
    assert.throws(
      () => assertExecutionOrganizationMatchesRequest('org-1', 'org-2'),
      InvalidToolInputError,
    );
  });
});
