/// <reference types="temporal-polyfill/types/global" />
import { db } from '../prisma/db.ts';
import { commitStateAndEvent } from '../business-commands/command.ts';
import { runBusinessCommand } from '../business-commands/run.ts';
import { TOOL_EVENT_TYPES, toolLifecycleEvent } from './events.ts';
import {
  InvalidToolInputError,
  InvalidToolTransitionError,
  ToolExecutionNotFoundError,
  ToolRequestNotFoundError,
} from './errors.ts';
import {
  getToolExecutionByIdWithOrm,
  isUniqueViolation,
  listToolExecutionsForRequestWithOrm,
  listToolExecutionsWithOrm,
  sanitizeToolExecutionError,
  type ToolExecutionListFilter,
} from './execution-persistence.ts';
import { asJsonValue } from './json.ts';
import { assertToolExecutionTransition, assertToolRequestTransition } from './lifecycle.ts';
import { toolLifecycleStoreFromTx, type ToolLifecycleStore } from './lifecycle-store.ts';
import type { ToolExecution, ToolRequest } from './types.ts';

export type { ToolExecutionListFilter };

const ATTEMPT_CREATE_RETRIES = 3;

export async function getToolExecutionById(id: string): Promise<ToolExecution | null> {
  return getToolExecutionByIdWithOrm(db.orm, id);
}

export async function listToolExecutions(
  filter: ToolExecutionListFilter,
): Promise<ToolExecution[]> {
  return listToolExecutionsWithOrm(db.orm, filter);
}

export async function listToolExecutionsForRequest(
  toolRequestId: string,
): Promise<ToolExecution[]> {
  return listToolExecutionsForRequestWithOrm(db.orm, toolRequestId);
}

async function requireExecution(
  store: ToolLifecycleStore,
  id: string,
): Promise<ToolExecution> {
  const execution = await store.getToolExecutionById(id);
  if (!execution) {
    throw new ToolExecutionNotFoundError(id);
  }
  return execution;
}

async function fulfillRequestFromSucceededExecution(
  store: ToolLifecycleStore,
  requestId: string,
): Promise<ToolRequest> {
  const existing = await store.getToolRequestById(requestId);
  if (!existing) {
    throw new ToolRequestNotFoundError(requestId);
  }
  assertToolRequestTransition(existing.status, 'FULFILLED');
  return store.transitionToolRequestStatus(requestId, existing.status, 'FULFILLED');
}

async function failRequestFromFailedExecution(
  store: ToolLifecycleStore,
  requestId: string,
): Promise<ToolRequest> {
  const existing = await store.getToolRequestById(requestId);
  if (!existing) {
    throw new ToolRequestNotFoundError(requestId);
  }
  assertToolRequestTransition(existing.status, 'FAILED');
  return store.transitionToolRequestStatus(requestId, existing.status, 'FAILED');
}

export async function createToolExecutionAttemptWithStore(
  store: ToolLifecycleStore,
  toolRequestId: string,
  now: Temporal.Instant = Temporal.Now.instant(),
): Promise<ToolExecution> {
  const request = await store.getToolRequestById(toolRequestId);
  if (!request) {
    throw new ToolRequestNotFoundError(toolRequestId);
  }
  if (request.status !== 'READY') {
    throw new InvalidToolTransitionError(
      `ToolExecution attempts can only be created for READY requests; found ${request.status}.`,
    );
  }

  const existing = await store.listToolExecutionsForRequest(toolRequestId);
  if (existing.some((execution) => execution.status === 'QUEUED' || execution.status === 'RUNNING')) {
    throw new InvalidToolTransitionError(
      'A ToolExecution attempt is already in progress for this ToolRequest.',
    );
  }

  const attemptNumber = await store.nextAttemptNumber(toolRequestId);
  return commitStateAndEvent(
    async (work) => work(store),
    async () =>
      store.createToolExecution({
        organizationId: request.organizationId,
        toolRequestId: request.id,
        attemptNumber,
      }),
    async (_store, execution) => {
      await store.recordEvent(
        toolLifecycleEvent({
          request,
          execution,
          eventType: TOOL_EVENT_TYPES.executionQueued,
          title: `Tool execution queued: ${request.toolName}`,
          now,
        }),
      );
    },
  );
}

export async function markToolExecutionRunningWithStore(
  store: ToolLifecycleStore,
  id: string,
  now: Temporal.Instant = Temporal.Now.instant(),
): Promise<ToolExecution> {
  const existing = await requireExecution(store, id);
  const request = await store.getToolRequestById(existing.toolRequestId);
  if (!request) {
    throw new ToolRequestNotFoundError(existing.toolRequestId);
  }
  assertToolExecutionTransition(existing.status, 'RUNNING');
  return commitStateAndEvent(
    async (work) => work(store),
    async () =>
      store.transitionToolExecutionStatus(id, existing.status, 'RUNNING', {
        startedAt: existing.startedAt ?? now,
        completedAt: null,
      }),
    async (_store, execution) => {
      await store.recordEvent(
        toolLifecycleEvent({
          request,
          execution,
          eventType: TOOL_EVENT_TYPES.executionStarted,
          title: `Tool execution started: ${request.toolName}`,
          now,
        }),
      );
    },
  );
}

export async function completeToolExecutionWithStore(
  store: ToolLifecycleStore,
  id: string,
  output: unknown = null,
  now: Temporal.Instant = Temporal.Now.instant(),
): Promise<ToolExecution> {
  const existing = await requireExecution(store, id);
  const request = await store.getToolRequestById(existing.toolRequestId);
  if (!request) {
    throw new ToolRequestNotFoundError(existing.toolRequestId);
  }
  assertToolExecutionTransition(existing.status, 'SUCCEEDED');
  let serialized: ReturnType<typeof asJsonValue>;
  try {
    serialized = asJsonValue(output);
  } catch {
    throw new InvalidToolInputError('output must be JSON-serializable.');
  }

  return commitStateAndEvent(
    async (work) => work(store),
    async () => {
      const execution = await store.transitionToolExecutionStatus(id, existing.status, 'SUCCEEDED', {
        output: serialized,
        error: null,
        startedAt: existing.startedAt,
        completedAt: now,
      });
      await fulfillRequestFromSucceededExecution(store, request.id);
      return execution;
    },
    async (_store, execution) => {
      const fulfilled = await store.getToolRequestById(request.id);
      await store.recordEvent(
        toolLifecycleEvent({
          request: fulfilled ?? { ...request, status: 'FULFILLED' },
          execution,
          eventType: TOOL_EVENT_TYPES.executed,
          title: `Tool executed: ${request.toolName}`,
          now,
        }),
      );
    },
  );
}

export async function failToolExecutionWithStore(
  store: ToolLifecycleStore,
  id: string,
  error: string,
  now: Temporal.Instant = Temporal.Now.instant(),
): Promise<ToolExecution> {
  const existing = await requireExecution(store, id);
  const request = await store.getToolRequestById(existing.toolRequestId);
  if (!request) {
    throw new ToolRequestNotFoundError(existing.toolRequestId);
  }
  assertToolExecutionTransition(existing.status, 'FAILED');
  const sanitized = sanitizeToolExecutionError(error);

  return commitStateAndEvent(
    async (work) => work(store),
    async () => {
      const execution = await store.transitionToolExecutionStatus(id, existing.status, 'FAILED', {
        error: sanitized,
        startedAt: existing.startedAt,
        completedAt: now,
      });
      await failRequestFromFailedExecution(store, request.id);
      return execution;
    },
    async (_store, execution) => {
      const failed = await store.getToolRequestById(request.id);
      await store.recordEvent(
        toolLifecycleEvent({
          request: failed ?? { ...request, status: 'FAILED' },
          execution,
          eventType: TOOL_EVENT_TYPES.executionFailed,
          title: `Tool execution failed: ${request.toolName}`,
          now,
        }),
      );
    },
  );
}

export async function cancelQueuedToolExecutionWithStore(
  store: ToolLifecycleStore,
  id: string,
  now: Temporal.Instant = Temporal.Now.instant(),
): Promise<ToolExecution> {
  const existing = await requireExecution(store, id);
  const request = await store.getToolRequestById(existing.toolRequestId);
  if (!request) {
    throw new ToolRequestNotFoundError(existing.toolRequestId);
  }
  assertToolExecutionTransition(existing.status, 'CANCELLED');
  return commitStateAndEvent(
    async (work) => work(store),
    async () =>
      store.transitionToolExecutionStatus(id, existing.status, 'CANCELLED', {
        completedAt: now,
        startedAt: existing.startedAt,
      }),
    async (_store, execution) => {
      await store.recordEvent(
        toolLifecycleEvent({
          request,
          execution,
          eventType: TOOL_EVENT_TYPES.cancelled,
          title: `Tool execution cancelled: ${request.toolName}`,
          now,
        }),
      );
    },
  );
}

export async function createToolExecutionAttempt(toolRequestId: string): Promise<ToolExecution> {
  let lastError: unknown;
  for (let attempt = 0; attempt < ATTEMPT_CREATE_RETRIES; attempt += 1) {
    try {
      return await runBusinessCommand(async (tx) =>
        createToolExecutionAttemptWithStore(toolLifecycleStoreFromTx(tx), toolRequestId),
      );
    } catch (error) {
      lastError = error;
      if (!isUniqueViolation(error) || attempt === ATTEMPT_CREATE_RETRIES - 1) {
        throw error;
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new InvalidToolTransitionError('Could not allocate a ToolExecution attempt number.');
}

export async function markToolExecutionRunning(id: string): Promise<ToolExecution> {
  return runBusinessCommand(async (tx) =>
    markToolExecutionRunningWithStore(toolLifecycleStoreFromTx(tx), id),
  );
}

export async function completeToolExecution(
  id: string,
  output?: unknown,
): Promise<ToolExecution> {
  return runBusinessCommand(async (tx) =>
    completeToolExecutionWithStore(toolLifecycleStoreFromTx(tx), id, output),
  );
}

export async function failToolExecution(id: string, error: string): Promise<ToolExecution> {
  return runBusinessCommand(async (tx) =>
    failToolExecutionWithStore(toolLifecycleStoreFromTx(tx), id, error),
  );
}

export async function cancelQueuedToolExecution(id: string): Promise<ToolExecution> {
  return runBusinessCommand(async (tx) =>
    cancelQueuedToolExecutionWithStore(toolLifecycleStoreFromTx(tx), id),
  );
}
