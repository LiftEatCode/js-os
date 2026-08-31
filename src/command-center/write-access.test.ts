import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CommandCenterWritesDisabledError,
  assertCommandCenterWriteEnabled,
  isCommandCenterWriteEnabled,
} from './write-access.ts';

describe('command-center write access', () => {
  it('is disabled by default', () => {
    assert.equal(isCommandCenterWriteEnabled({}), false);
    assert.equal(isCommandCenterWriteEnabled({ NODE_ENV: 'development' }), false);
    assert.equal(
      isCommandCenterWriteEnabled({
        NODE_ENV: 'development',
        JS_OS_COMMAND_CENTER_WRITES: 'false',
      }),
      false,
    );
  });

  it('requires development and explicit opt-in', () => {
    assert.equal(
      isCommandCenterWriteEnabled({
        NODE_ENV: 'development',
        JS_OS_COMMAND_CENTER_WRITES: 'true',
      }),
      true,
    );
  });

  it('rejects production even when the flag is set', () => {
    assert.equal(
      isCommandCenterWriteEnabled({
        NODE_ENV: 'production',
        JS_OS_COMMAND_CENTER_WRITES: 'true',
      }),
      false,
    );
  });

  it('assert throws when disabled', () => {
    assert.throws(
      () => assertCommandCenterWriteEnabled({ NODE_ENV: 'production' }),
      CommandCenterWritesDisabledError,
    );
  });
});
