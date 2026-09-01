import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AGENT_PERMISSION_LEVELS, formatAgentLabel } from './constants.ts';
import { sortAgents, sortAgentRuns } from './ordering.ts';

describe('Agent list ordering', () => {
  it('orders by business role then name then slug', () => {
    const sorted = sortAgents([
      { role: 'FINANCE', name: 'JS OS Finance', slug: 'finance' },
      { role: 'CEO', name: 'JS OS CEO', slug: 'ceo' },
      { role: 'GENERAL', name: 'Utility', slug: 'utility' },
      { role: 'SALES', name: 'JS OS Sales', slug: 'sales' },
      { role: 'CLIENT_OPERATIONS', name: 'JS OS Client Operations', slug: 'client-operations' },
      { role: 'MARKETING', name: 'JS OS Marketing', slug: 'marketing' },
      { role: 'ENGINEERING', name: 'JS OS Engineering', slug: 'engineering' },
    ]);
    assert.deepEqual(
      sorted.map((row) => row.role),
      [
        'CEO',
        'SALES',
        'MARKETING',
        'CLIENT_OPERATIONS',
        'ENGINEERING',
        'FINANCE',
        'GENERAL',
      ],
    );
  });

  it('orders permission ceilings by capability, not alphabetically', () => {
    assert.deepEqual([...AGENT_PERMISSION_LEVELS], [
      'OBSERVE',
      'RECOMMEND',
      'PREPARE',
      'EXECUTE',
    ]);
  });

  it('formats CLIENT_OPERATIONS and keeps CEO as an acronym', () => {
    assert.equal(formatAgentLabel('CLIENT_OPERATIONS'), 'Client Operations');
    assert.equal(formatAgentLabel('CEO'), 'CEO');
    assert.equal(formatAgentLabel('RECOMMEND'), 'Recommend');
  });
});

describe('AgentRun ordering', () => {
  it('orders newest startedAt first, then createdAt, then id', () => {
    const older = Temporal.Instant.from('2026-08-01T00:00:00Z');
    const newer = Temporal.Instant.from('2026-08-20T00:00:00Z');
    const sorted = sortAgentRuns([
      { id: 'b', startedAt: older, createdAt: newer },
      { id: 'a', startedAt: newer, createdAt: older },
      { id: 'c', startedAt: older, createdAt: older },
    ]);
    assert.deepEqual(
      sorted.map((row) => row.id),
      ['a', 'b', 'c'],
    );
  });
});
