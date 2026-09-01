import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  parseAgentPermissionForm,
  parseAgentStatusForm,
  parsePermissionFilter,
  parseRoleFilter,
  parseStatusFilter,
} from './parse.ts';

describe('Agent form parsing', () => {
  it('parses a valid status change', () => {
    const form = new FormData();
    form.set('agentId', '11111111-1111-4111-8111-111111111111');
    form.set('status', 'PAUSED');
    const parsed = parseAgentStatusForm(form);
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.value.status, 'PAUSED');
    }
  });

  it('rejects an invalid status', () => {
    const form = new FormData();
    form.set('agentId', '11111111-1111-4111-8111-111111111111');
    form.set('status', 'RUNNING');
    const parsed = parseAgentStatusForm(form);
    assert.equal(parsed.ok, false);
  });

  it('parses a permission change to PREPARE without EXECUTE confirmation', () => {
    const form = new FormData();
    form.set('agentId', '11111111-1111-4111-8111-111111111111');
    form.set('permissionLevel', 'PREPARE');
    const parsed = parseAgentPermissionForm(form);
    assert.equal(parsed.ok, true);
  });

  it('rejects EXECUTE without confirmation and accepts it with confirmation', () => {
    const missing = new FormData();
    missing.set('agentId', '11111111-1111-4111-8111-111111111111');
    missing.set('permissionLevel', 'EXECUTE');
    const parsedMissing = parseAgentPermissionForm(missing);
    assert.equal(parsedMissing.ok, false);
    if (!parsedMissing.ok) {
      assert.ok(parsedMissing.state.fieldErrors?.executeConfirmation);
    }

    const confirmed = new FormData();
    confirmed.set('agentId', '11111111-1111-4111-8111-111111111111');
    confirmed.set('permissionLevel', 'EXECUTE');
    confirmed.set('executeConfirmation', 'yes');
    const parsedConfirmed = parseAgentPermissionForm(confirmed);
    assert.equal(parsedConfirmed.ok, true);
  });

  it('ignores unknown list filters', () => {
    assert.equal(parseStatusFilter('ACTIVE'), 'ACTIVE');
    assert.equal(parseStatusFilter('nope'), undefined);
    assert.equal(parseRoleFilter('MARKETING'), 'MARKETING');
    assert.equal(parseRoleFilter('HR'), undefined);
    assert.equal(parsePermissionFilter('RECOMMEND'), 'RECOMMEND');
    assert.equal(parsePermissionFilter('ADMIN'), undefined);
  });
});
