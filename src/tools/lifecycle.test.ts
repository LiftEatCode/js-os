import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { InvalidToolTransitionError } from './errors.ts';
import {
  assertToolExecutionTransition,
  assertToolRequestTransition,
  canCancelToolExecution,
  canCancelToolRequest,
  canTransitionToolExecution,
  canTransitionToolRequest,
  isTerminalToolExecutionStatus,
  isTerminalToolRequestStatus,
} from './lifecycle.ts';
import {
  TERMINAL_TOOL_EXECUTION_STATUSES,
  TERMINAL_TOOL_REQUEST_STATUSES,
  TOOL_EXECUTION_STATUSES,
  TOOL_REQUEST_STATUSES,
  type ToolExecutionStatus,
  type ToolRequestStatus,
} from './types.ts';

const VALID_REQUEST_TRANSITIONS: Array<[ToolRequestStatus, ToolRequestStatus]> = [
  ['REQUESTED', 'WAITING_APPROVAL'],
  ['REQUESTED', 'READY'],
  ['REQUESTED', 'DENIED'],
  ['REQUESTED', 'CANCELLED'],
  ['WAITING_APPROVAL', 'READY'],
  ['WAITING_APPROVAL', 'DENIED'],
  ['WAITING_APPROVAL', 'CANCELLED'],
  ['READY', 'FULFILLED'],
  ['READY', 'FAILED'],
  ['READY', 'CANCELLED'],
];

const INVALID_REQUEST_TRANSITIONS: Array<[ToolRequestStatus, ToolRequestStatus]> = [
  ['REQUESTED', 'FULFILLED'],
  ['REQUESTED', 'FAILED'],
  ['WAITING_APPROVAL', 'FULFILLED'],
  ['WAITING_APPROVAL', 'FAILED'],
  ['WAITING_APPROVAL', 'REQUESTED'],
  ['READY', 'REQUESTED'],
  ['READY', 'WAITING_APPROVAL'],
  ['READY', 'DENIED'],
  ['DENIED', 'READY'],
  ['CANCELLED', 'READY'],
  ['FULFILLED', 'READY'],
  ['FAILED', 'READY'],
  ['FAILED', 'CANCELLED'],
];

const VALID_EXECUTION_TRANSITIONS: Array<[ToolExecutionStatus, ToolExecutionStatus]> = [
  ['QUEUED', 'RUNNING'],
  ['QUEUED', 'CANCELLED'],
  ['RUNNING', 'SUCCEEDED'],
  ['RUNNING', 'FAILED'],
];

const INVALID_EXECUTION_TRANSITIONS: Array<[ToolExecutionStatus, ToolExecutionStatus]> = [
  ['QUEUED', 'SUCCEEDED'],
  ['QUEUED', 'FAILED'],
  ['RUNNING', 'CANCELLED'],
  ['RUNNING', 'QUEUED'],
  ['SUCCEEDED', 'FAILED'],
  ['FAILED', 'SUCCEEDED'],
  ['CANCELLED', 'RUNNING'],
];

describe('ToolRequest lifecycle', () => {
  it('allows the approved v0.1 transitions', () => {
    for (const [from, to] of VALID_REQUEST_TRANSITIONS) {
      assert.equal(canTransitionToolRequest(from, to), true, `${from} → ${to}`);
      assert.doesNotThrow(() => assertToolRequestTransition(from, to));
    }
  });

  it('rejects invalid and terminal-state transitions', () => {
    for (const [from, to] of INVALID_REQUEST_TRANSITIONS) {
      assert.equal(canTransitionToolRequest(from, to), false, `${from} → ${to}`);
      assert.throws(() => assertToolRequestTransition(from, to), InvalidToolTransitionError);
    }
  });

  it('does not allow self-transitions', () => {
    for (const status of TOOL_REQUEST_STATUSES) {
      assert.equal(canTransitionToolRequest(status, status), false);
    }
  });

  it('treats FULFILLED, FAILED, CANCELLED, and DENIED as terminal', () => {
    assert.deepEqual([...TERMINAL_TOOL_REQUEST_STATUSES], [
      'FULFILLED',
      'FAILED',
      'CANCELLED',
      'DENIED',
    ]);
    for (const status of TOOL_REQUEST_STATUSES) {
      const terminal = isTerminalToolRequestStatus(status);
      const expected = (
        TERMINAL_TOOL_REQUEST_STATUSES as readonly ToolRequestStatus[]
      ).includes(status);
      assert.equal(terminal, expected);
      if (terminal) {
        for (const to of TOOL_REQUEST_STATUSES) {
          assert.equal(canTransitionToolRequest(status, to), false, `${status} → ${to}`);
        }
      }
    }
  });

  it('allows cancellation only from REQUESTED, WAITING_APPROVAL, and READY', () => {
    assert.equal(canCancelToolRequest('REQUESTED'), true);
    assert.equal(canCancelToolRequest('WAITING_APPROVAL'), true);
    assert.equal(canCancelToolRequest('READY'), true);
    assert.equal(canCancelToolRequest('FULFILLED'), false);
    assert.equal(canCancelToolRequest('FAILED'), false);
    assert.equal(canCancelToolRequest('DENIED'), false);
    assert.equal(canCancelToolRequest('CANCELLED'), false);
  });
});

describe('ToolExecution lifecycle', () => {
  it('allows QUEUED → RUNNING/CANCELLED and RUNNING → SUCCEEDED/FAILED', () => {
    for (const [from, to] of VALID_EXECUTION_TRANSITIONS) {
      assert.equal(canTransitionToolExecution(from, to), true, `${from} → ${to}`);
      assert.doesNotThrow(() => assertToolExecutionTransition(from, to));
    }
  });

  it('rejects skipping RUNNING, cancelling RUNNING, and leaving terminals', () => {
    for (const [from, to] of INVALID_EXECUTION_TRANSITIONS) {
      assert.equal(canTransitionToolExecution(from, to), false, `${from} → ${to}`);
      assert.throws(() => assertToolExecutionTransition(from, to), InvalidToolTransitionError);
    }
  });

  it('treats SUCCEEDED, FAILED, and CANCELLED as terminal', () => {
    assert.deepEqual([...TERMINAL_TOOL_EXECUTION_STATUSES], [
      'SUCCEEDED',
      'FAILED',
      'CANCELLED',
    ]);
    for (const status of TOOL_EXECUTION_STATUSES) {
      const terminal = isTerminalToolExecutionStatus(status);
      const expected = (
        TERMINAL_TOOL_EXECUTION_STATUSES as readonly ToolExecutionStatus[]
      ).includes(status);
      assert.equal(terminal, expected);
      if (terminal) {
        for (const to of TOOL_EXECUTION_STATUSES) {
          assert.equal(canTransitionToolExecution(status, to), false, `${status} → ${to}`);
        }
      }
    }
  });

  it('allows execution cancellation only from QUEUED', () => {
    assert.equal(canCancelToolExecution('QUEUED'), true);
    assert.equal(canCancelToolExecution('RUNNING'), false);
    assert.equal(canCancelToolExecution('SUCCEEDED'), false);
    assert.equal(canCancelToolExecution('FAILED'), false);
    assert.equal(canCancelToolExecution('CANCELLED'), false);
  });
});
