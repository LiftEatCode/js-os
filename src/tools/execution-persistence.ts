import type { PersistenceOrm } from '../business-state/persistence.ts';
import { clampListLimit, omitUndefined } from '../business-state/validation.ts';
import {
  InvalidToolInputError,
  InvalidToolTransitionError,
  ToolExecutionNotFoundError,
  ToolRequestNotFoundError,
} from './errors.ts';
import { assertToolExecutionTransition } from './lifecycle.ts';
import type { ToolExecution, ToolExecutionStatus } from './types.ts';

export const TOOL_EXECUTION_ERROR_MAX_LENGTH = 2000;

export type ToolExecutionListFilter = {
  organizationId: string;
  toolRequestId?: string;
  status?: ToolExecutionStatus;
  limit?: number;
};

export type CreateToolExecutionRecordInput = {
  organizationId: string;
  toolRequestId: string;
  attemptNumber: number;
};

export type ToolExecutionCompletionFields = {
  output?: ToolExecution['output'];
  error?: string | null;
  startedAt?: ToolExecution['startedAt'];
  completedAt: ToolExecution['completedAt'];
};

export async function getToolExecutionByIdWithOrm(
  orm: PersistenceOrm,
  id: string,
): Promise<ToolExecution | null> {
  return orm.public.ToolExecution.where({ id }).first();
}

export async function listToolExecutionsWithOrm(
  orm: PersistenceOrm,
  filter: ToolExecutionListFilter,
): Promise<ToolExecution[]> {
  const where: {
    organizationId: string;
    toolRequestId?: string;
    status?: ToolExecutionStatus;
  } = { organizationId: filter.organizationId };

  if (filter.toolRequestId) {
    where.toolRequestId = filter.toolRequestId;
  }
  if (filter.status) {
    where.status = filter.status;
  }

  return orm.public.ToolExecution.where(where)
    .orderBy([(execution) => execution.createdAt.desc(), (execution) => execution.id.desc()])
    .limit(clampListLimit(filter.limit))
    .all();
}

export async function listToolExecutionsForRequestWithOrm(
  orm: PersistenceOrm,
  toolRequestId: string,
): Promise<ToolExecution[]> {
  return orm.public.ToolExecution.where({ toolRequestId })
    .orderBy((execution) => execution.attemptNumber.asc())
    .all();
}

export async function nextToolExecutionAttemptNumberWithOrm(
  orm: PersistenceOrm,
  toolRequestId: string,
): Promise<number> {
  const latest = await orm.public.ToolExecution.where({ toolRequestId })
    .orderBy((execution) => execution.attemptNumber.desc())
    .limit(1)
    .first();
  return (latest?.attemptNumber ?? 0) + 1;
}

export async function createToolExecutionWithOrm(
  orm: PersistenceOrm,
  input: CreateToolExecutionRecordInput,
): Promise<ToolExecution> {
  return orm.public.ToolExecution.create({
    organizationId: input.organizationId,
    toolRequestId: input.toolRequestId,
    attemptNumber: input.attemptNumber,
    status: 'QUEUED',
    output: null,
    error: null,
    startedAt: null,
    completedAt: null,
  });
}

export async function transitionToolExecutionStatusWithOrm(
  orm: PersistenceOrm,
  id: string,
  from: ToolExecutionStatus,
  to: ToolExecutionStatus,
  fields: ToolExecutionCompletionFields,
): Promise<ToolExecution> {
  assertToolExecutionTransition(from, to);
  const updated = await orm.public.ToolExecution.where({ id, status: from }).update(
    omitUndefined({
      status: to,
      output: fields.output,
      error: fields.error,
      startedAt: fields.startedAt,
      completedAt: fields.completedAt,
    }),
  );
  const row = firstUpdated(updated);
  if (row?.status === to) {
    return row;
  }
  const current = await getToolExecutionByIdWithOrm(orm, id);
  if (!current) {
    throw new ToolExecutionNotFoundError(id);
  }
  if (current.status === to) {
    return current;
  }
  throw new InvalidToolTransitionError(
    `ToolExecution cannot transition from ${current.status} to ${to}.`,
  );
}

export function requireToolRequest(request: { id: string } | null, id: string): asserts request {
  if (!request) {
    throw new ToolRequestNotFoundError(id);
  }
}

function firstUpdated<T>(updated: T | T[] | null | undefined): T | undefined {
  if (updated == null) {
    return undefined;
  }
  return Array.isArray(updated) ? updated[0] : updated;
}

export function isUniqueViolation(error: unknown): boolean {
  if (
    error &&
    typeof error === 'object' &&
    'sqlState' in error &&
    (error as { sqlState?: string }).sqlState === '23505'
  ) {
    return true;
  }
  const message = error instanceof Error ? error.message : String(error);
  return /unique|23505/i.test(message);
}

export function sanitizeToolExecutionError(error: string): string {
  const firstLine = error.replaceAll('\r', '').split('\n')[0] ?? '';
  const trimmed = firstLine.trim();
  if (trimmed.length === 0) {
    throw new InvalidToolInputError('error must be a non-empty string.');
  }
  if (trimmed.length <= TOOL_EXECUTION_ERROR_MAX_LENGTH) {
    return trimmed;
  }
  return trimmed.slice(0, TOOL_EXECUTION_ERROR_MAX_LENGTH);
}
