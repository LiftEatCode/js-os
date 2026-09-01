/// <reference types="temporal-polyfill/types/global" />
import {
  applyApprovalDecisionWithOrm,
  createApprovalRequestWithOrm,
  getApprovalByIdWithOrm,
} from '../business-state/approval-persistence.ts';
import { recordBusinessEventWithOrm } from '../business-state/business-events.ts';
import type {
  Approval,
  ApprovalDecisionInput,
  CreateApprovalRequestInput,
} from '../business-state/types.ts';
import {
  approveApprovalWithStore,
  cancelApprovalWithStore,
  requestApprovalWithStore,
  rejectApprovalWithStore,
  type ApprovalCommandActor,
  type ApprovalCommandStore,
} from './approvals.ts';
import { runBusinessCommand, type BusinessCommandTx } from './run.ts';

const OWNER_ACTOR: ApprovalCommandActor = {
  sourceType: 'USER',
  sourceId: null,
};

function storeFromTx(tx: BusinessCommandTx): ApprovalCommandStore {
  return {
    getApprovalById: (id) => getApprovalByIdWithOrm(tx.orm, id),
    createApproval: (input) => createApprovalRequestWithOrm(tx.orm, input),
    applyDecision: (id, status, input, now) =>
      applyApprovalDecisionWithOrm(tx.orm, id, status, input, now),
    recordEvent: async (input) => {
      await recordBusinessEventWithOrm(tx.orm, input);
    },
  };
}

/**
 * Owner-facing command: create a PENDING Approval and append approval.requested.
 * Does not execute the proposed action. Does not mutate a linked WorkItem.
 */
export async function requestApprovalCommand(
  input: CreateApprovalRequestInput,
  actor: ApprovalCommandActor = OWNER_ACTOR,
): Promise<Approval> {
  return runBusinessCommand(async (tx) => {
    return requestApprovalWithStore(storeFromTx(tx), input, Temporal.Now.instant(), actor);
  });
}

/**
 * Records owner authorization. APPROVED ≠ EXECUTED.
 * Does not call tools, APIs, complete WorkItems, or continue AgentRuns.
 */
export async function approveApprovalCommand(
  id: string,
  input: ApprovalDecisionInput = {},
  actor: ApprovalCommandActor = OWNER_ACTOR,
): Promise<Approval> {
  return runBusinessCommand(async (tx) => {
    return approveApprovalWithStore(storeFromTx(tx), id, input, Temporal.Now.instant(), actor);
  });
}

export async function rejectApprovalCommand(
  id: string,
  input: ApprovalDecisionInput,
  actor: ApprovalCommandActor = OWNER_ACTOR,
): Promise<Approval> {
  return runBusinessCommand(async (tx) => {
    return rejectApprovalWithStore(storeFromTx(tx), id, input, Temporal.Now.instant(), actor);
  });
}

export async function cancelApprovalCommand(
  id: string,
  input: ApprovalDecisionInput = {},
  actor: ApprovalCommandActor = OWNER_ACTOR,
): Promise<Approval> {
  return runBusinessCommand(async (tx) => {
    return cancelApprovalWithStore(storeFromTx(tx), id, input, Temporal.Now.instant(), actor);
  });
}
