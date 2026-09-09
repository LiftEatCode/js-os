import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveAttentionItems } from './attention.ts';

test('attention items preserve blocked, approval, failed-run order', () => {
  const items = deriveAttentionItems({
    blockedWork: [{ id: 'work-1', title: 'Blocked task', status: 'BLOCKED' } as never],
    approvals: [{ id: 'approval-1', title: 'Approve action', riskLevel: 'MEDIUM' } as never],
    recentAgentRuns: [
      { id: 'run-1', status: 'COMPLETED' } as never,
      { id: 'run-2', status: 'FAILED', error: 'boom' } as never,
    ],
  });

  assert.deepEqual(items.map((item) => item.type), ['blocked-work', 'approval', 'failed-agent-run']);
  assert.equal(items[2]?.detail, 'boom');
});

test('clean snapshot returns no attention items', () => {
  assert.deepEqual(deriveAttentionItems({ blockedWork: [], approvals: [], recentAgentRuns: [] }), []);
});
