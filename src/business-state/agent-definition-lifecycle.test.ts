import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { InvalidBusinessStateInputError } from './errors.ts';
import { assertAgentPermissionChange, assertAgentStatusChange } from './agent-definition-lifecycle.ts';

describe('AgentDefinition configuration changes', () => {
  it('allows status changes between ACTIVE, PAUSED, and DISABLED', () => {
    assert.doesNotThrow(() => assertAgentStatusChange('ACTIVE', 'PAUSED'));
    assert.doesNotThrow(() => assertAgentStatusChange('PAUSED', 'ACTIVE'));
    assert.doesNotThrow(() => assertAgentStatusChange('ACTIVE', 'DISABLED'));
  });

  it('rejects a no-op status change', () => {
    assert.throws(
      () => assertAgentStatusChange('ACTIVE', 'ACTIVE'),
      InvalidBusinessStateInputError,
    );
  });

  it('allows permission ceiling changes along the capability order', () => {
    assert.doesNotThrow(() => assertAgentPermissionChange('OBSERVE', 'RECOMMEND'));
    assert.doesNotThrow(() => assertAgentPermissionChange('RECOMMEND', 'PREPARE'));
    assert.doesNotThrow(() => assertAgentPermissionChange('PREPARE', 'EXECUTE'));
  });

  it('rejects a no-op permission change', () => {
    assert.throws(
      () => assertAgentPermissionChange('RECOMMEND', 'RECOMMEND'),
      InvalidBusinessStateInputError,
    );
  });
});
