/// <reference types="temporal-polyfill/types/global" />
import {
  createGoalWithOrm,
  getGoalByIdWithOrm,
  updateGoalWithOrm,
} from '../business-state/goal-persistence.ts';
import { recordBusinessEventWithOrm } from '../business-state/business-events.ts';
import type { CreateGoalInput, Goal } from '../business-state/types.ts';
import {
  createGoalWithStore,
  updateGoalProgressWithStore,
  updateGoalWithStore,
  type GoalCommandActor,
  type GoalCommandStore,
  type UpdateGoalCommandInput,
  type UpdateGoalProgressCommandInput,
} from './goals.ts';
import { runBusinessCommand, type BusinessCommandTx } from './run.ts';

const OWNER_ACTOR: GoalCommandActor = {
  sourceType: 'USER',
  sourceId: null,
};

function storeFromTx(tx: BusinessCommandTx): GoalCommandStore {
  return {
    getGoalById: (id) => getGoalByIdWithOrm(tx.orm, id),
    create: (input, now) => createGoalWithOrm(tx.orm, input, now),
    update: (id, input, now) => updateGoalWithOrm(tx.orm, id, input, now),
    recordEvent: async (input) => {
      await recordBusinessEventWithOrm(tx.orm, input);
    },
  };
}

/**
 * Creates a Goal and appends goal.created in one transaction.
 * Public createGoal remains event-free.
 */
export async function createGoalCommand(
  input: CreateGoalInput,
  actor: GoalCommandActor = OWNER_ACTOR,
): Promise<Goal> {
  return runBusinessCommand(async (tx) => {
    return createGoalWithStore(storeFromTx(tx), input, Temporal.Now.instant(), actor);
  });
}

/**
 * Updates owner-editable Goal fields.
 *
 * Event policy (one event per owner action):
 * - status is the only meaningful change → goal.status_changed
 * - any other field change (including mixed status + fields) → goal.updated
 * - no meaningful change → InvalidBusinessStateInputError, no event
 *
 * Residual last-write-wins: current state is loaded inside the transaction,
 * but concurrent updates are not row-locked.
 */
export async function updateGoalCommand(
  input: UpdateGoalCommandInput,
  actor: GoalCommandActor = OWNER_ACTOR,
): Promise<Goal> {
  return runBusinessCommand(async (tx) => {
    return updateGoalWithStore(storeFromTx(tx), input, Temporal.Now.instant(), actor);
  });
}

/**
 * Progress-only form. Emits goal.progress_updated.
 */
export async function updateGoalProgressCommand(
  input: UpdateGoalProgressCommandInput,
  actor: GoalCommandActor = OWNER_ACTOR,
): Promise<Goal> {
  return runBusinessCommand(async (tx) => {
    return updateGoalProgressWithStore(storeFromTx(tx), input, Temporal.Now.instant(), actor);
  });
}
