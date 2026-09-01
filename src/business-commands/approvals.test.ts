import 'temporal-polyfill/full/global';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BusinessStateNotFoundError,
  InvalidBusinessStateInputError,
  InvalidBusinessStateTransitionError,
} from '../business-state/errors.ts';
import { nextApprovalDecision } from '../business-state/approval-lifecycle.ts';
import type {
  Approval,
  ApprovalDecisionInput,
  CreateApprovalRequestInput,
  RecordBusinessEventInput,
} from '../business-state/types.ts';
import { assertApprovalCanCancel, assertApprovalCanDecide } from '../business-state/validation.ts';
import { commitStateAndEvent, type TransactionRunner } from './command.ts';
import {
  APPROVAL_EVENT_TYPES,
  approveApprovalWithStore,
  cancelApprovalWithStore,
  requestApprovalWithStore,
  rejectApprovalWithStore,
  type ApprovalCommandActor,
  type ApprovalCommandStore,
} from './approvals.ts';

const now = Temporal.Instant.from('2026-08-31T18:00:00Z');
const actor: ApprovalCommandActor = { sourceType: 'USER', sourceId: null };

type MemoryState = {
  approvals: Map<string, Approval>;
  events: RecordBusinessEventInput[];
  failOnCreate: boolean;
  failOnEvent: boolean;
  nextId: number;
};

function emptyState(): MemoryState {
  return {
    approvals: new Map(),
    events: [],
    failOnCreate: false,
    failOnEvent: false,
    nextId: 1,
  };
}

function cloneState(state: MemoryState): MemoryState {
  return {
    approvals: new Map(state.approvals),
    events: [...state.events],
    failOnCreate: state.failOnCreate,
    failOnEvent: state.failOnEvent,
    nextId: state.nextId,
  };
}

function memoryRunner(committed: MemoryState): TransactionRunner<MemoryState> {
  return async (work) => {
    const draft = cloneState(committed);
    const result = await work(draft);
    committed.approvals = draft.approvals;
    committed.events = draft.events;
    committed.nextId = draft.nextId;
    return result;
  };
}

function pendingApproval(
  overrides: Partial<Approval> & Pick<Approval, 'id' | 'title' | 'actionType'>,
): Approval {
  return {
    organizationId: 'org-1',
    workItemId: null,
    agentRunId: null,
    description: null,
    status: 'PENDING',
    riskLevel: 'HIGH',
    requestedByType: 'USER',
    requestedById: null,
    requestedAt: now,
    decidedAt: null,
    decisionReason: null,
    expiresAt: null,
    payload: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function storeFrom(scope: MemoryState): ApprovalCommandStore {
  return {
    async getApprovalById(id) {
      return scope.approvals.get(id) ?? null;
    },
    async createApproval(input: CreateApprovalRequestInput) {
      if (scope.failOnCreate) {
        throw new Error('mutation failed');
      }
      const id = `approval-${scope.nextId}`;
      scope.nextId += 1;
      const approval = pendingApproval({
        id,
        organizationId: input.organizationId,
        title: input.title,
        actionType: input.actionType,
        riskLevel: input.riskLevel,
        requestedByType: input.requestedByType,
        description: input.description ?? null,
        workItemId: input.workItemId ?? null,
        agentRunId: input.agentRunId ?? null,
        requestedById: input.requestedById ?? null,
        expiresAt: input.expiresAt ?? null,
        payload: input.payload ?? null,
      });
      scope.approvals.set(id, approval);
      return approval;
    },
    async applyDecision(id, status, input: ApprovalDecisionInput, decidedAt) {
      const existing = scope.approvals.get(id);
      if (!existing) {
        throw new BusinessStateNotFoundError(`Approval not found: ${id}`);
      }
      if (status === 'CANCELLED') {
        assertApprovalCanCancel(existing.status);
      } else {
        assertApprovalCanDecide(existing.status);
      }
      const patch = nextApprovalDecision(status, input.decisionReason, decidedAt);
      const updated: Approval = {
        ...existing,
        status: patch.status,
        decidedAt: patch.decidedAt,
        decisionReason: patch.decisionReason,
        updatedAt: decidedAt,
      };
      scope.approvals.set(id, updated);
      return updated;
    },
    async recordEvent(input) {
      if (scope.failOnEvent) {
        throw new Error('event failed');
      }
      scope.events.push(input);
    },
  };
}

const requestInput: CreateApprovalRequestInput = {
  organizationId: 'org-1',
  title: 'Send outreach email to prospect',
  actionType: 'outreach.send_email',
  riskLevel: 'HIGH',
  requestedByType: 'USER',
};

async function runInTx<T>(
  committed: MemoryState,
  work: (scope: MemoryState) => Promise<T>,
): Promise<T> {
  return memoryRunner(committed)(work);
}

describe('Approval commands', () => {
  it('commits an Approval request and approval.requested together', async () => {
    const committed = emptyState();
    const approval = await runInTx(committed, (scope) =>
      requestApprovalWithStore(storeFrom(scope), requestInput, now, actor),
    );
    assert.equal(approval.status, 'PENDING');
    assert.equal(approval.decidedAt, null);
    assert.equal(committed.approvals.size, 1);
    assert.equal(committed.events.length, 1);
    assert.equal(committed.events[0]?.eventType, APPROVAL_EVENT_TYPES.requested);
    assert.equal(committed.events[0]?.title, 'Approval requested');
    assert.equal(committed.events[0]?.sourceType, 'USER');
    assert.equal(committed.events[0]?.sourceId, null);
    assert.deepEqual(committed.events[0]?.metadata, {
      approvalId: approval.id,
      actionType: 'outreach.send_email',
      riskLevel: 'HIGH',
    });
  });

  it('does not append an event when Approval creation fails', async () => {
    const committed = emptyState();
    committed.failOnCreate = true;
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          requestApprovalWithStore(storeFrom(scope), requestInput, now, actor),
        ),
      /mutation failed/,
    );
    assert.equal(committed.approvals.size, 0);
    assert.equal(committed.events.length, 0);
  });

  it('rolls back Approval creation when the event append fails', async () => {
    const committed = emptyState();
    committed.failOnEvent = true;
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          requestApprovalWithStore(storeFrom(scope), requestInput, now, actor),
        ),
      /event failed/,
    );
    assert.equal(committed.approvals.size, 0);
    assert.equal(committed.events.length, 0);
  });

  it('approves PENDING and appends approval.approved without executing', async () => {
    const committed = emptyState();
    const created = pendingApproval({
      id: 'a1',
      title: 'Publish landing page',
      actionType: 'website.publish',
      workItemId: 'work-1',
    });
    committed.approvals.set(created.id, created);

    const updated = await runInTx(committed, (scope) =>
      approveApprovalWithStore(storeFrom(scope), 'a1', { decisionReason: 'Proceed' }, now, actor),
    );
    assert.equal(updated.status, 'APPROVED');
    assert.equal(updated.decidedAt, now);
    assert.equal(updated.decisionReason, 'Proceed');
    assert.equal(updated.title, created.title);
    assert.equal(updated.actionType, created.actionType);
    assert.equal(updated.payload, null);
    assert.equal(committed.events.length, 1);
    assert.equal(committed.events[0]?.eventType, APPROVAL_EVENT_TYPES.approved);
    assert.deepEqual(committed.events[0]?.metadata, {
      approvalId: 'a1',
      riskLevel: 'HIGH',
      workItemId: 'work-1',
    });
  });

  it('rejects PENDING with a required reason and appends approval.rejected', async () => {
    const committed = emptyState();
    committed.approvals.set(
      'a1',
      pendingApproval({ id: 'a1', title: 'Issue refund', actionType: 'payment.issue_refund' }),
    );
    const updated = await runInTx(committed, (scope) =>
      rejectApprovalWithStore(storeFrom(scope), 'a1', { decisionReason: 'Not authorized' }, now, actor),
    );
    assert.equal(updated.status, 'REJECTED');
    assert.equal(updated.decisionReason, 'Not authorized');
    assert.equal(committed.events[0]?.eventType, APPROVAL_EVENT_TYPES.rejected);
  });

  it('cancels PENDING and appends approval.cancelled', async () => {
    const committed = emptyState();
    committed.approvals.set(
      'a1',
      pendingApproval({ id: 'a1', title: 'Withdraw request', actionType: 'work.execute' }),
    );
    const updated = await runInTx(committed, (scope) =>
      cancelApprovalWithStore(storeFrom(scope), 'a1', {}, now, actor),
    );
    assert.equal(updated.status, 'CANCELLED');
    assert.equal(updated.decidedAt, now);
    assert.equal(committed.events[0]?.eventType, APPROVAL_EVENT_TYPES.cancelled);
  });

  it('rejects duplicate approve of an already APPROVED request with no second event', async () => {
    const committed = emptyState();
    committed.approvals.set(
      'a1',
      pendingApproval({ id: 'a1', title: 'Send email', actionType: 'outreach.send_email' }),
    );
    await runInTx(committed, (scope) =>
      approveApprovalWithStore(storeFrom(scope), 'a1', {}, now, actor),
    );
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          approveApprovalWithStore(storeFrom(scope), 'a1', {}, now, actor),
        ),
      InvalidBusinessStateTransitionError,
    );
    assert.equal(committed.approvals.get('a1')?.status, 'APPROVED');
    assert.equal(committed.events.length, 1);
    assert.equal(committed.events[0]?.eventType, APPROVAL_EVENT_TYPES.approved);
  });

  it('does not approve an already REJECTED request', async () => {
    const committed = emptyState();
    committed.approvals.set('a1', {
      ...pendingApproval({ id: 'a1', title: 'Refund', actionType: 'payment.issue_refund' }),
      status: 'REJECTED',
      decidedAt: now,
      decisionReason: 'No',
    });
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          approveApprovalWithStore(storeFrom(scope), 'a1', {}, now, actor),
        ),
      InvalidBusinessStateTransitionError,
    );
    assert.equal(committed.events.length, 0);
  });

  it('does not reject an already CANCELLED request', async () => {
    const committed = emptyState();
    committed.approvals.set('a1', {
      ...pendingApproval({ id: 'a1', title: 'Cancelled request', actionType: 'work.execute' }),
      status: 'CANCELLED',
      decidedAt: now,
    });
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          rejectApprovalWithStore(
            storeFrom(scope),
            'a1',
            { decisionReason: 'Too late' },
            now,
            actor,
          ),
        ),
      InvalidBusinessStateTransitionError,
    );
    assert.equal(committed.events.length, 0);
  });

  it('requires a rejection reason before mutating or appending an event', async () => {
    const committed = emptyState();
    committed.approvals.set(
      'a1',
      pendingApproval({ id: 'a1', title: 'Refund', actionType: 'payment.issue_refund' }),
    );
    await assert.rejects(
      () =>
        runInTx(committed, (scope) =>
          rejectApprovalWithStore(storeFrom(scope), 'a1', {}, now, actor),
        ),
      InvalidBusinessStateInputError,
    );
    assert.equal(committed.approvals.get('a1')?.status, 'PENDING');
    assert.equal(committed.events.length, 0);
  });

  it('keeps proposal fields unchanged after a decision', async () => {
    const committed = emptyState();
    const created = pendingApproval({
      id: 'a1',
      title: 'Publish Copper Secure AC cage landing page',
      actionType: 'website.publish',
      description: 'Publish the cage page',
      payload: { path: '/copper-secure-ac' },
      riskLevel: 'CRITICAL',
    });
    committed.approvals.set('a1', created);
    const updated = await runInTx(committed, (scope) =>
      approveApprovalWithStore(storeFrom(scope), 'a1', {}, now, actor),
    );
    assert.equal(updated.title, created.title);
    assert.equal(updated.actionType, created.actionType);
    assert.equal(updated.description, created.description);
    assert.deepEqual(updated.payload, created.payload);
    assert.equal(updated.riskLevel, 'CRITICAL');
  });

  it('pairs mutation and event through commitStateAndEvent rollback', async () => {
    const committed = emptyState();
    const runner = memoryRunner(committed);
    await assert.rejects(
      () =>
        commitStateAndEvent(
          runner,
          async (scope) => {
            scope.approvals.set(
              'a1',
              pendingApproval({ id: 'a1', title: 'X', actionType: 'work.execute' }),
            );
            return scope.approvals.get('a1')!;
          },
          async () => {
            throw new Error('event failed');
          },
        ),
      /event failed/,
    );
    assert.equal(committed.approvals.size, 0);
    assert.equal(committed.events.length, 0);
  });
});
