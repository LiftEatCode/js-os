/// <reference types="temporal-polyfill/types/global" />
import { db } from '../prisma/db.ts';
import { commitStateAndEvent } from '../business-commands/command.ts';
import { runBusinessCommand } from '../business-commands/run.ts';
import { cancelApprovalWithStore } from '../business-commands/approvals.ts';
import { TOOL_EVENT_TYPES, toolLifecycleEvent } from './events.ts';
import { InvalidToolTransitionError, ToolRequestNotFoundError } from './errors.ts';
import {
  getToolRequestByApprovalIdWithOrm,
  getToolRequestByIdWithOrm,
  listToolRequestsWithOrm,
  type ToolRequestListFilter,
} from './request-persistence.ts';
import {
  approvalCommandStoreFromToolStore,
  toolLifecycleStoreFromTx,
  type ToolLifecycleStore,
} from './lifecycle-store.ts';
import { assertToolRequestTransition, canCancelToolRequest } from './lifecycle.ts';
import type { ToolRequest, ToolRequestStatus } from './types.ts';

export type { ToolRequestListFilter };

export async function getToolRequestById(id: string): Promise<ToolRequest | null> {
  return getToolRequestByIdWithOrm(db.orm, id);
}

export async function getToolRequestByApprovalId(approvalId: string): Promise<ToolRequest | null> {
  return getToolRequestByApprovalIdWithOrm(db.orm, approvalId);
}

export async function listToolRequests(filter: ToolRequestListFilter): Promise<ToolRequest[]> {
  return listToolRequestsWithOrm(db.orm, filter);
}

async function requireRequest(
  store: ToolLifecycleStore,
  id: string,
): Promise<ToolRequest> {
  const request = await store.getToolRequestById(id);
  if (!request) {
    throw new ToolRequestNotFoundError(id);
  }
  return request;
}

async function transitionRequestWithStore(
  store: ToolLifecycleStore,
  id: string,
  to: ToolRequestStatus,
  now: Temporal.Instant,
  eventType: string,
  titleFor: (request: ToolRequest) => string,
  extras?: { reason?: string },
): Promise<ToolRequest> {
  const existing = await requireRequest(store, id);
  assertToolRequestTransition(existing.status, to);
  return commitStateAndEvent(
    async (work) => work(store),
    async () => store.transitionToolRequestStatus(id, existing.status, to),
    async (_store, request) => {
      await store.recordEvent(
        toolLifecycleEvent({
          request,
          eventType,
          title: titleFor(request),
          now,
          reason: extras?.reason,
        }),
      );
    },
  );
}

export async function markToolRequestWaitingApprovalWithStore(
  store: ToolLifecycleStore,
  id: string,
  now: Temporal.Instant = Temporal.Now.instant(),
): Promise<ToolRequest> {
  return transitionRequestWithStore(
    store,
    id,
    'WAITING_APPROVAL',
    now,
    TOOL_EVENT_TYPES.waitingApproval,
    (request) => `Tool request waiting approval: ${request.toolName}`,
  );
}

export async function markToolRequestReadyWithStore(
  store: ToolLifecycleStore,
  id: string,
  now: Temporal.Instant = Temporal.Now.instant(),
): Promise<ToolRequest> {
  return transitionRequestWithStore(
    store,
    id,
    'READY',
    now,
    TOOL_EVENT_TYPES.ready,
    (request) => `Tool request ready: ${request.toolName}`,
  );
}

export async function denyToolRequestWithStore(
  store: ToolLifecycleStore,
  id: string,
  now: Temporal.Instant = Temporal.Now.instant(),
  reason?: string,
): Promise<ToolRequest> {
  return transitionRequestWithStore(
    store,
    id,
    'DENIED',
    now,
    TOOL_EVENT_TYPES.denied,
    (request) => `Tool request denied: ${request.toolName}`,
    reason ? { reason } : undefined,
  );
}

export async function cancelToolRequestWithStore(
  store: ToolLifecycleStore,
  id: string,
  now: Temporal.Instant = Temporal.Now.instant(),
): Promise<ToolRequest> {
  const existing = await requireRequest(store, id);
  if (!canCancelToolRequest(existing.status)) {
    throw new InvalidToolTransitionError(
      `ToolRequest cannot transition from ${existing.status} to CANCELLED.`,
    );
  }

  const executions = await store.listToolExecutionsForRequest(id);
  if (executions.some((execution) => execution.status === 'RUNNING')) {
    throw new InvalidToolTransitionError(
      'ToolRequest cannot be cancelled while a ToolExecution is RUNNING.',
    );
  }

  if (existing.approvalId) {
    const approval = await store.getApprovalById(existing.approvalId);
    if (approval?.status === 'PENDING') {
      await cancelApprovalWithStore(
        approvalCommandStoreFromToolStore(store),
        approval.id,
        {},
        now,
        {
          sourceType: existing.requestedByType,
          sourceId: existing.requestedById,
        },
      );
    }
  }

  return commitStateAndEvent(
    async (work) => work(store),
    async () => {
      for (const execution of executions) {
        if (execution.status === 'QUEUED') {
          await store.transitionToolExecutionStatus(execution.id, 'QUEUED', 'CANCELLED', {
            completedAt: now,
          });
        }
      }
      return store.transitionToolRequestStatus(id, existing.status, 'CANCELLED');
    },
    async (_store, request) => {
      await store.recordEvent(
        toolLifecycleEvent({
          request,
          eventType: TOOL_EVENT_TYPES.cancelled,
          title: `Tool request cancelled: ${request.toolName}`,
          now,
        }),
      );
    },
  );
}

export async function markToolRequestWaitingApproval(id: string): Promise<ToolRequest> {
  return runBusinessCommand(async (tx) =>
    markToolRequestWaitingApprovalWithStore(toolLifecycleStoreFromTx(tx), id),
  );
}

export async function markToolRequestReady(id: string): Promise<ToolRequest> {
  return runBusinessCommand(async (tx) =>
    markToolRequestReadyWithStore(toolLifecycleStoreFromTx(tx), id),
  );
}

export async function denyToolRequest(id: string): Promise<ToolRequest> {
  return runBusinessCommand(async (tx) => denyToolRequestWithStore(toolLifecycleStoreFromTx(tx), id));
}

export async function cancelToolRequest(id: string): Promise<ToolRequest> {
  return runBusinessCommand(async (tx) =>
    cancelToolRequestWithStore(toolLifecycleStoreFromTx(tx), id),
  );
}
