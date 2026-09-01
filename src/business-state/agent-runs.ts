import { db } from '../prisma/db.ts';
import { BusinessStateNotFoundError, InvalidBusinessStateInputError } from './errors.ts';
import type { AgentRun, AgentRunListFilter, CreateAgentRunInput } from './types.ts';
import { clampListLimit } from './validation.ts';
import {
  assertAgentRunCanCancel,
  assertAgentRunCanFinish,
  assertAgentRunCanStart,
} from './validation.ts';

export async function getAgentRunById(id: string): Promise<AgentRun | null> {
  return db.orm.public.AgentRun.where({ id }).first();
}

export async function listAgentRuns(filter: AgentRunListFilter): Promise<AgentRun[]> {
  const where: {
    organizationId: string;
    agentDefinitionId?: string;
    status?: AgentRunListFilter['status'];
  } = { organizationId: filter.organizationId };

  if (filter.agentDefinitionId) {
    where.agentDefinitionId = filter.agentDefinitionId;
  }
  if (filter.status) {
    where.status = filter.status;
  }

  const query = db.orm.public.AgentRun.where(where).orderBy((run) => run.createdAt.desc());
  if (filter.limit !== undefined) {
    return query.limit(clampListLimit(filter.limit)).all();
  }
  return query.all();
}

export async function createAgentRun(input: CreateAgentRunInput): Promise<AgentRun> {
  const now = Temporal.Now.instant();

  return db.orm.public.AgentRun.create({
    organizationId: input.organizationId,
    agentDefinitionId: input.agentDefinitionId,
    triggerType: input.triggerType,
    triggerReference: input.triggerReference ?? null,
    status: 'QUEUED',
    startedAt: now,
    completedAt: null,
    inputSnapshot: input.inputSnapshot ?? null,
    output: null,
    error: null,
  });
}

export async function markAgentRunRunning(id: string): Promise<AgentRun> {
  const existing = await getAgentRunById(id);
  if (!existing) {
    throw new BusinessStateNotFoundError(`AgentRun not found: ${id}`);
  }
  assertAgentRunCanStart(existing.status);

  await db.orm.public.AgentRun.where({ id }).update({
    status: 'RUNNING',
    startedAt: Temporal.Now.instant(),
  });

  return requireRun(id);
}

export async function completeAgentRun(
  id: string,
  output?: AgentRun['output'],
): Promise<AgentRun> {
  const existing = await getAgentRunById(id);
  if (!existing) {
    throw new BusinessStateNotFoundError(`AgentRun not found: ${id}`);
  }
  assertAgentRunCanFinish(existing.status, 'COMPLETED');

  await db.orm.public.AgentRun.where({ id }).update({
    status: 'COMPLETED',
    completedAt: Temporal.Now.instant(),
    output: output ?? null,
    error: null,
  });

  return requireRun(id);
}

export async function failAgentRun(id: string, error: string): Promise<AgentRun> {
  const existing = await getAgentRunById(id);
  if (!existing) {
    throw new BusinessStateNotFoundError(`AgentRun not found: ${id}`);
  }
  assertAgentRunCanFinish(existing.status, 'FAILED');

  const message = error.trim();
  if (message.length === 0) {
    throw new InvalidBusinessStateInputError('error must be a non-empty string.');
  }

  await db.orm.public.AgentRun.where({ id }).update({
    status: 'FAILED',
    completedAt: Temporal.Now.instant(),
    error: message,
  });

  return requireRun(id);
}

export async function cancelAgentRun(id: string): Promise<AgentRun> {
  const existing = await getAgentRunById(id);
  if (!existing) {
    throw new BusinessStateNotFoundError(`AgentRun not found: ${id}`);
  }
  assertAgentRunCanCancel(existing.status);

  await db.orm.public.AgentRun.where({ id }).update({
    status: 'CANCELLED',
    completedAt: Temporal.Now.instant(),
  });

  return requireRun(id);
}

async function requireRun(id: string): Promise<AgentRun> {
  const run = await getAgentRunById(id);
  if (!run) {
    throw new BusinessStateNotFoundError(`AgentRun not found: ${id}`);
  }
  return run;
}
