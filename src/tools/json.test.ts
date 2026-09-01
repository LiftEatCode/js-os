import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canonicalizeJson, jsonValuesEqual } from './json.ts';

describe('jsonValuesEqual', () => {
  it('treats object key order as irrelevant', () => {
    assert.equal(jsonValuesEqual({ b: 1, a: 2 }, { a: 2, b: 1 }), true);
  });

  it('treats array order as significant', () => {
    assert.equal(jsonValuesEqual([1, 2], [2, 1]), false);
  });

  it('compares nested objects after canonicalizing keys', () => {
    assert.equal(
      jsonValuesEqual({ nested: { z: true, a: [1] } }, { nested: { a: [1], z: true } }),
      true,
    );
  });
});

describe('canonicalizeJson', () => {
  it('sorts object keys recursively', () => {
    assert.deepEqual(canonicalizeJson({ b: { d: 1, c: 2 }, a: 0 }), {
      a: 0,
      b: { c: 2, d: 1 },
    });
  });
});
