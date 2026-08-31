import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { wouldCreateParentCycle } from './work-item-hierarchy.ts';

const items = [
  { id: 'root', parentId: null },
  { id: 'child', parentId: 'root' },
  { id: 'grandchild', parentId: 'child' },
  { id: 'other', parentId: null },
];

describe('wouldCreateParentCycle', () => {
  it('rejects a WorkItem parenting itself', () => {
    assert.equal(wouldCreateParentCycle('root', 'root', items), true);
  });

  it('rejects assigning a descendant as parent', () => {
    assert.equal(wouldCreateParentCycle('root', 'child', items), true);
    assert.equal(wouldCreateParentCycle('root', 'grandchild', items), true);
    assert.equal(wouldCreateParentCycle('child', 'grandchild', items), true);
  });

  it('allows a valid parent or clearing the parent', () => {
    assert.equal(wouldCreateParentCycle('grandchild', 'other', items), false);
    assert.equal(wouldCreateParentCycle('other', 'root', items), false);
    assert.equal(wouldCreateParentCycle('child', null, items), false);
  });
});
