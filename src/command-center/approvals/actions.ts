'use server';

import {
  approveApprovalCommand,
  cancelApprovalCommand,
  requestApprovalCommand,
  rejectApprovalCommand,
} from '@/business-commands/approval-commands';
import {
  BusinessStateNotFoundError,
  InvalidBusinessStateInputError,
  InvalidBusinessStateTransitionError,
  getApprovalById,
  getJsSolutionsOrganization,
  getWorkItemById,
} from '@/business-state';
import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import { isCommandCenterWriteEnabled } from '../write-access';
import {
  isApprovalUuid,
  parseApprovalDecisionForm,
  parseApprovalRequestForm,
  type ApprovalFormState,
} from './parse';

export type { ApprovalFormState };

function revalidateApprovalPaths(approvalId?: string) {
  revalidatePath('/app');
  revalidatePath('/app/activity');
  revalidatePath('/app/approvals');
  if (approvalId) {
    revalidatePath(`/app/approvals/${approvalId}`);
  }
}

function formError(error: unknown): ApprovalFormState {
  if (error instanceof InvalidBusinessStateInputError) {
    if (error.message.startsWith('title ')) {
      return { error: 'Title is required.', fieldErrors: { title: 'Title is required.' } };
    }
    if (error.message.startsWith('actionType ')) {
      return {
        error: 'Action type must use lowercase.dot.notation (for example outreach.send_email).',
        fieldErrors: {
          actionType:
            'Action type must use lowercase.dot.notation (for example outreach.send_email).',
        },
      };
    }
    if (error.message.includes('decisionReason')) {
      return {
        error: 'A reason is required when rejecting an approval.',
        fieldErrors: { decisionReason: 'A reason is required when rejecting an approval.' },
      };
    }
    return { error: error.message };
  }
  if (error instanceof InvalidBusinessStateTransitionError) {
    return { error: 'This approval can no longer be decided.' };
  }
  if (error instanceof BusinessStateNotFoundError) {
    return { error: 'Approval could not be found.' };
  }
  return { error: 'Approval could not be saved.' };
}

async function requireJsSolutionsWorkItem(organizationId: string, workItemId: string | null) {
  if (!workItemId) {
    return;
  }
  const workItem = await getWorkItemById(workItemId);
  if (!workItem || workItem.organizationId !== organizationId) {
    throw new InvalidBusinessStateInputError('Work item could not be found.');
  }
}

export async function createApprovalRequestAction(
  _previous: ApprovalFormState,
  formData: FormData,
): Promise<ApprovalFormState> {
  if (!isCommandCenterWriteEnabled()) {
    return { error: 'Command Center writes are disabled.' };
  }

  const organization = await getJsSolutionsOrganization();
  const parsed = parseApprovalRequestForm(formData, organization.timezone);
  if (!parsed.ok) {
    return parsed.state;
  }

  try {
    await requireJsSolutionsWorkItem(organization.id, parsed.value.workItemId);
    const approval = await requestApprovalCommand({
      organizationId: organization.id,
      title: parsed.value.title,
      actionType: parsed.value.actionType,
      riskLevel: parsed.value.riskLevel,
      requestedByType: 'USER',
      requestedById: null,
      description: parsed.value.description,
      workItemId: parsed.value.workItemId,
      agentRunId: null,
      expiresAt: parsed.value.expiresAt,
      payload: parsed.value.payload,
    });
    revalidateApprovalPaths(approval.id);
    redirect(`/app/approvals/${approval.id}`);
  } catch (error) {
    unstable_rethrow(error);
    return formError(error);
  }
}

export async function decideApprovalAction(
  _previous: ApprovalFormState,
  formData: FormData,
): Promise<ApprovalFormState> {
  if (!isCommandCenterWriteEnabled()) {
    return { error: 'Command Center writes are disabled.' };
  }

  const parsed = parseApprovalDecisionForm(formData);
  if (!parsed.ok) {
    return parsed.state;
  }

  if (!isApprovalUuid(parsed.value.approvalId)) {
    return { error: 'Approval could not be found.' };
  }

  try {
    const organization = await getJsSolutionsOrganization();
    const existing = await getApprovalById(parsed.value.approvalId);
    if (!existing || existing.organizationId !== organization.id) {
      throw new BusinessStateNotFoundError('Approval not found.');
    }

    if (existing.riskLevel === 'CRITICAL' && !parsed.value.criticalConfirmed) {
      return {
        error: 'Confirm that you understand this is a critical-risk approval.',
        fieldErrors: {
          criticalConfirmation: 'Confirm that you understand this is a critical-risk approval.',
        },
      };
    }

    const reason = { decisionReason: parsed.value.decisionReason };
    let approval = existing;
    if (parsed.value.decision === 'approve') {
      approval = await approveApprovalCommand(existing.id, reason);
    } else if (parsed.value.decision === 'reject') {
      approval = await rejectApprovalCommand(existing.id, reason);
    } else {
      approval = await cancelApprovalCommand(existing.id, reason);
    }

    revalidateApprovalPaths(approval.id);
    return {};
  } catch (error) {
    unstable_rethrow(error);
    return formError(error);
  }
}
