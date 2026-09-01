/// <reference types="temporal-polyfill/types/global" />
import { getAgentDefinitionByIdWithOrm } from '../business-state/agent-definition-persistence.ts';
import { recordBusinessEventWithOrm } from '../business-state/business-events.ts';
import { getGoalByIdWithOrm } from '../business-state/goal-persistence.ts';
import type { CreateWorkItemInput, WorkItem } from '../business-state/types.ts';
import {
  createWorkItemWithOrm,
  getWorkItemByIdWithOrm,
  listWorkItemsWithOrm,
  updateWorkItemWithOrm,
} from '../business-state/work-item-persistence.ts';
import { runBusinessCommand, type BusinessCommandTx } from './run.ts';
import {
  createWorkItemWithStore,
  updateWorkItemStatusWithStore,
  updateWorkItemWithStore,
  type UpdateWorkItemCommandInput,
  type UpdateWorkItemStatusCommandInput,
  type WorkCommandActor,
  type WorkCommandStore,
} from './work-items.ts';

const OWNER_ACTOR: WorkCommandActor = {
  sourceType: 'USER',
  sourceId: null,
};

function storeFromTx(tx: BusinessCommandTx): WorkCommandStore {
  return {
    getWorkItemById: (id) => getWorkItemByIdWithOrm(tx.orm, id),
    listWorkItems: (organizationId) => listWorkItemsWithOrm(tx.orm, { organizationId }),
    getGoalById: (id) => getGoalByIdWithOrm(tx.orm, id),
    getAgentDefinitionById: (id) => getAgentDefinitionByIdWithOrm(tx.orm, id),
    create: (input, now) => createWorkItemWithOrm(tx.orm, input, now),
    update: (id, input, now) => updateWorkItemWithOrm(tx.orm, id, input, now),
    recordEvent: async (input) => {
      await recordBusinessEventWithOrm(tx.orm, input);
    },
  };
}

/**
 * Creates a WorkItem and appends work.created in one transaction.
 * Does not create an Approval when status is WAITING_APPROVAL.
 * Public createWorkItem remains event-free.
 */
export async function createWorkItemCommand(
  input: CreateWorkItemInput,
  actor: WorkCommandActor = OWNER_ACTOR,
): Promise<WorkItem> {
  return runBusinessCommand(async (tx) => {
    return createWorkItemWithStore(storeFromTx(tx), input, Temporal.Now.instant(), actor);
  });
}

/**
 * Updates owner-editable WorkItem fields.
 *
 * Event policy (one event per owner action):
 * - status is the only meaningful change → work.status_changed
 * - any other field change (including mixed status + fields) → work.updated
 * - no meaningful change → InvalidBusinessStateInputError, no event
 *
 * Parent cycle and linked Goal/Agent checks run inside the transaction
 * against current organization WorkItems.
 *
 * Residual last-write-wins: current state is loaded inside the transaction,
 * but concurrent updates are not row-locked.
 */
export async function updateWorkItemCommand(
  input: UpdateWorkItemCommandInput,
  actor: WorkCommandActor = OWNER_ACTOR,
): Promise<WorkItem> {
  return runBusinessCommand(async (tx) => {
    return updateWorkItemWithStore(storeFromTx(tx), input, Temporal.Now.instant(), actor);
  });
}

/**
 * Status-only change. Emits work.status_changed.
 * Does not auto-create Approvals or mutate related entities.
 */
export async function updateWorkItemStatusCommand(
  input: UpdateWorkItemStatusCommandInput,
  actor: WorkCommandActor = OWNER_ACTOR,
): Promise<WorkItem> {
  return runBusinessCommand(async (tx) => {
    return updateWorkItemStatusWithStore(storeFromTx(tx), input, Temporal.Now.instant(), actor);
  });
}
