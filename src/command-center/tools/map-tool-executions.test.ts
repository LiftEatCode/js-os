import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ToolExecution } from '../../tools/types.ts';
import { mapToolExecution, mapToolExecutions } from './map-tool-executions.ts';

function execution(
  overrides: Partial<ToolExecution> & Pick<ToolExecution, 'id' | 'attemptNumber' | 'status'>,
): ToolExecution {
  return {
    organizationId: '00000000-0000-4000-8000-000000000001',
    toolRequestId: '00000000-0000-4000-8000-000000000002',
    output: null,
    error: null,
    createdAt: Temporal.Instant.from('2026-09-16T09:00:00Z'),
    startedAt: null,
    completedAt: null,
    ...overrides,
  };
}

describe('mapToolExecutions', () => {
  it('returns NOT_EXECUTED when there are no attempts', () => {
    const result = mapToolExecutions([]);

    assert.deepEqual(result.executions, []);
    assert.deepEqual(result.outcome, {
      latestExecutionId: null,
      result: 'NOT_EXECUTED',
      producedRecords: [],
    });
  });

  it('orders attempts deterministically and derives outcome from the latest attempt', () => {
    const result = mapToolExecutions([
      execution({ id: 'execution-2', attemptNumber: 2, status: 'FAILED', error: 'boom' }),
      execution({ id: 'execution-1', attemptNumber: 1, status: 'SUCCEEDED', output: { ok: true } }),
    ]);

    assert.deepEqual(result.executions.map((item) => item.id), ['execution-1', 'execution-2']);
    assert.equal(result.outcome.latestExecutionId, 'execution-2');
    assert.equal(result.outcome.result, 'FAILED');
    assert.deepEqual(result.outcome.producedRecords, []);
  });

  it('maps QUEUED and RUNNING latest attempts to RUNNING', () => {
    for (const status of ['QUEUED', 'RUNNING'] as const) {
      assert.equal(
        mapToolExecutions([execution({ id: status, attemptNumber: 1, status })]).outcome.result,
        'RUNNING',
      );
    }
  });

  it('maps terminal statuses to their persisted outcome', () => {
    for (const status of ['SUCCEEDED', 'FAILED', 'CANCELLED'] as const) {
      assert.equal(
        mapToolExecutions([execution({ id: status, attemptNumber: 1, status })]).outcome.result,
        status,
      );
    }
  });
});

describe('mapToolExecution', () => {
  it('serializes timestamps, calculates duration, and marks terminal attempts', () => {
    const result = mapToolExecution(
      execution({
        id: 'execution-1',
        attemptNumber: 1,
        status: 'SUCCEEDED',
        output: { workItemId: 'work-1' },
        startedAt: Temporal.Instant.from('2026-09-16T09:00:01Z'),
        completedAt: Temporal.Instant.from('2026-09-16T09:00:02.250Z'),
      }),
    );

    assert.equal(result.createdAt, '2026-09-16T09:00:00Z');
    assert.equal(result.startedAt, '2026-09-16T09:00:01Z');
    assert.equal(result.completedAt, '2026-09-16T09:00:02.25Z');
    assert.equal(result.durationMs, 1250);
    assert.equal(result.isTerminal, true);
    assert.deepEqual(result.output, { workItemId: 'work-1' });
    assert.equal(result.error, null);
  });

  it('leaves duration null unless both execution timestamps exist', () => {
    const missingStart = mapToolExecution(
      execution({
        id: 'missing-start',
        attemptNumber: 1,
        status: 'FAILED',
        completedAt: Temporal.Instant.from('2026-09-16T09:00:02Z'),
      }),
    );
    const missingCompletion = mapToolExecution(
      execution({
        id: 'missing-completion',
        attemptNumber: 2,
        status: 'RUNNING',
        startedAt: Temporal.Instant.from('2026-09-16T09:00:01Z'),
      }),
    );

    assert.equal(missingStart.durationMs, null);
    assert.equal(missingCompletion.durationMs, null);
    assert.equal(missingCompletion.isTerminal, false);
  });
});
