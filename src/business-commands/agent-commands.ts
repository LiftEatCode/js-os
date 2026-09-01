/// <reference types="temporal-polyfill/types/global" />
import {
  getAgentDefinitionByIdWithOrm,
  updateAgentPermissionLevelWithOrm,
  updateAgentStatusWithOrm,
} from '../business-state/agent-definition-persistence.ts';
import { recordBusinessEventWithOrm } from '../business-state/business-events.ts';
import type { AgentDefinition } from '../business-state/types.ts';
import {
  changeAgentPermissionLevelWithStore,
  changeAgentStatusWithStore,
  type AgentCommandActor,
  type AgentCommandStore,
  type ChangeAgentPermissionInput,
  type ChangeAgentStatusInput,
} from './agents.ts';
import { runBusinessCommand, type BusinessCommandTx } from './run.ts';

const OWNER_ACTOR: AgentCommandActor = {
  sourceType: 'USER',
  sourceId: null,
};

function storeFromTx(tx: BusinessCommandTx): AgentCommandStore {
  return {
    getAgentDefinitionById: (id) => getAgentDefinitionByIdWithOrm(tx.orm, id),
    updateStatus: (id, status) => updateAgentStatusWithOrm(tx.orm, id, status),
    updatePermissionLevel: (id, permissionLevel) =>
      updateAgentPermissionLevelWithOrm(tx.orm, id, permissionLevel),
    recordEvent: async (input) => {
      await recordBusinessEventWithOrm(tx.orm, input);
    },
  };
}

/**
 * Changes AgentDefinition.status. This is configuration only.
 * It does not start, pause, or stop a runtime, model, or schedule.
 */
export async function changeAgentStatusCommand(
  input: ChangeAgentStatusInput,
  actor: AgentCommandActor = OWNER_ACTOR,
): Promise<AgentDefinition> {
  return runBusinessCommand(async (tx) => {
    return changeAgentStatusWithStore(storeFromTx(tx), input, Temporal.Now.instant(), actor);
  });
}

/**
 * Changes AgentDefinition.permissionLevel (the capability ceiling).
 * EXECUTE is not unrestricted execution; tools, policy, and approvals still apply.
 */
export async function changeAgentPermissionLevelCommand(
  input: ChangeAgentPermissionInput,
  actor: AgentCommandActor = OWNER_ACTOR,
): Promise<AgentDefinition> {
  return runBusinessCommand(async (tx) => {
    return changeAgentPermissionLevelWithStore(
      storeFromTx(tx),
      input,
      Temporal.Now.instant(),
      actor,
    );
  });
}
