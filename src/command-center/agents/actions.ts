'use server';

import {
  changeAgentPermissionLevelCommand,
  changeAgentStatusCommand,
} from '@/business-commands/agent-commands';
import {
  BusinessStateNotFoundError,
  InvalidBusinessStateInputError,
  getAgentDefinitionById,
  getJsSolutionsOrganization,
} from '@/business-state';
import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { isCommandCenterWriteEnabled } from '../write-access';
import {
  isAgentUuid,
  parseAgentPermissionForm,
  parseAgentStatusForm,
  type AgentFormState,
} from './parse';

export type { AgentFormState };

function revalidateAgentPaths(agentId?: string) {
  revalidatePath('/app');
  revalidatePath('/app/activity');
  revalidatePath('/app/agents');
  if (agentId) {
    revalidatePath(`/app/agents/${agentId}`);
  }
}

function formError(error: unknown): AgentFormState {
  if (error instanceof InvalidBusinessStateInputError) {
    return { error: error.message };
  }
  if (error instanceof BusinessStateNotFoundError) {
    return { error: 'Agent could not be found.' };
  }
  return { error: 'Agent could not be saved.' };
}

async function requireJsSolutionsAgent(agentId: string) {
  if (!isAgentUuid(agentId)) {
    throw new BusinessStateNotFoundError('AgentDefinition not found.');
  }
  const organization = await getJsSolutionsOrganization();
  const agent = await getAgentDefinitionById(agentId);
  if (!agent || agent.organizationId !== organization.id) {
    throw new BusinessStateNotFoundError('AgentDefinition not found.');
  }
  return { organization, agent };
}

export async function changeAgentStatusAction(
  _previous: AgentFormState,
  formData: FormData,
): Promise<AgentFormState> {
  if (!isCommandCenterWriteEnabled()) {
    return { error: 'Command Center writes are disabled.' };
  }

  const parsed = parseAgentStatusForm(formData);
  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    const { organization, agent } = await requireJsSolutionsAgent(parsed.value.agentId);
    await changeAgentStatusCommand({
      id: agent.id,
      organizationId: organization.id,
      status: parsed.value.status,
    });
    revalidateAgentPaths(agent.id);
    return {};
  } catch (error) {
    unstable_rethrow(error);
    return formError(error);
  }
}

export async function changeAgentPermissionAction(
  _previous: AgentFormState,
  formData: FormData,
): Promise<AgentFormState> {
  if (!isCommandCenterWriteEnabled()) {
    return { error: 'Command Center writes are disabled.' };
  }

  const parsed = parseAgentPermissionForm(formData);
  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    const { organization, agent } = await requireJsSolutionsAgent(parsed.value.agentId);
    if (parsed.value.permissionLevel === 'EXECUTE' && !parsed.value.executeConfirmed) {
      return {
        error:
          'Confirm that EXECUTE is a ceiling and does not bypass tool, policy, or approval controls.',
        fieldErrors: {
          executeConfirmation:
            'Confirm that EXECUTE is a ceiling and does not bypass tool, policy, or approval controls.',
        },
      };
    }
    await changeAgentPermissionLevelCommand({
      id: agent.id,
      organizationId: organization.id,
      permissionLevel: parsed.value.permissionLevel,
    });
    revalidateAgentPaths(agent.id);
    return {};
  } catch (error) {
    unstable_rethrow(error);
    return formError(error);
  }
}
