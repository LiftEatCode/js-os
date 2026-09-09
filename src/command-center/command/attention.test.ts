import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveAttentionItems } from './attention.ts';
import { makeAgentRun, makeApproval, makeBusinessState, makeWorkItem } from './test-fixtures.ts';

test('attention items preserve blocked, approval, failed-run order', () => {
  const state = makeBusinessState({
    blockedWork: [makeWorkItem({ id: 'work-1', title: 'Blocked task', status: 'BLOCKED' })],
    pendingApprovals: [makeApproval({ id: 'approval-1', title: 'Approve action', riskLevel: 'MEDIUM' })],
    recentAgentRuns: [
      makeAgentRun({ id: 'run-1', status: 'COMPLETED' }),
      makeAgentRun({ id: 'run-2', status: 'FAILED', error: 'boom' }),
    ],
  });
  const items = deriveAttentionItems(state);
  assert.deepEqual(items.map((item) => item.type), ['blocked-work', 'approval', 'failed-agent-run']);
  assert.equal(items[2]?.detail, 'boom');
});

test('clean snapshot returns no attention items', () => {
  assert.deepEqual(deriveAttentionItems(makeBusinessState()), []);
});
