/// <reference types="temporal-polyfill/types/global" />
import { db } from '../prisma/db.ts';
import { commitStateAndEvent } from '../business-commands/command.ts';
import { runBusinessCommand } from '../business-commands/run.ts';
import type { ToolDefinition } from './definition.ts';
import { getToolDefinitionSnapshot } from './definition.ts';
import {
  createAgentToolActor,
  evaluateToolPermission,
  type ToolPermissionActor,
  type ToolPermissionDenialCode,
} from './evaluate-permission.ts';
import { TOOL_EVENT_TYPES, toolLifecycleEvent } from './events.ts';
import { InvalidToolInputError, ToolIdempotencyConflictError } from './errors.ts';
import { isUniqueViolation } from './execution-persistence.ts';
import { asJsonValue, jsonValuesEqual } from './json.ts';
import { toolLifecycleStoreFromTx, type ToolLifecycleStore } from './lifecycle-store.ts';
import {
  findToolRequestByIdempotencyWithOrm,
  type CreateToolRequestRecordInput,
} from './request-persistence.ts';
import type { ToolActorType, ToolRequest } from './types.ts';

export type RequestToolUseInput = {
  organizationId: string;
  actor: ToolPermissionActor;
  definition: ToolDefinition;
  input: unknown;
  agentRunId?: string | null;
  workItemId?: string | null;
  idempotencyKey?: string | null;
};

type ActorPersistence = {
  requestedByType: ToolActorType;
  requestedById: string | null;
  agentDefinitionId: string | null;
  permissionActor: ToolPermissionActor;
};

function normalizeIdempotencyKey(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function parseToolInput(definition: ToolDefinition, input: unknown): ReturnType<typeof asJsonValue> {
  const parsed = definition.inputSchema.safeParse(input);
  if (!parsed.success) {
    const message =
      parsed.error.issues.map((issue) => issue.message).join('; ') || 'Invalid tool input.';
    throw new InvalidToolInputError(message);
  }
  return asJsonValue(parsed.data);
}

async function resolveActor(
  store: ToolLifecycleStore,
  organizationId: string,
  actor: ToolPermissionActor,
): Promise<ActorPersistence> {
  if (actor.type === 'USER') {
    return {
      requestedByType: 'USER',
      requestedById: actor.requestedById ?? null,
      agentDefinitionId: null,
      permissionActor: actor,
    };
  }
  if (actor.type === 'SYSTEM') {
    return {
      requestedByType: 'SYSTEM',
      requestedById: null,
      agentDefinitionId: null,
      permissionActor: actor,
    };
  }

  const agent = await store.getAgentDefinitionById(actor.agentDefinition.id);
  if (!agent || agent.organizationId !== organizationId) {
    throw new InvalidToolInputError(
      'agentDefinitionId must refer to an AgentDefinition in the request organization.',
    );
  }
  return {
    requestedByType: 'AGENT',
    requestedById: agent.id,
    agentDefinitionId: agent.id,
    permissionActor: createAgentToolActor({
      id: agent.id,
      status: agent.status,
      permissionLevel: agent.permissionLevel,
    }),
  };
}

async function assertOrganization(
  store: ToolLifecycleStore,
  organizationId: string,
): Promise<void> {
  const organization = await store.getOrganizationById(organizationId);
  if (!organization) {
    throw new InvalidToolInputError('organizationId is invalid.');
  }
}

async function assertOptionalReferences(
  store: ToolLifecycleStore,
  input: {
    organizationId: string;
    agentDefinitionId: string | null;
    agentRunId: string | null;
    workItemId: string | null;
  },
): Promise<void> {
  if (input.agentRunId) {
    const run = await store.getAgentRunById(input.agentRunId);
    if (!run || run.organizationId !== input.organizationId) {
      throw new InvalidToolInputError(
        'agentRunId must refer to an AgentRun in the request organization.',
      );
    }
    if (input.agentDefinitionId && run.agentDefinitionId !== input.agentDefinitionId) {
      throw new InvalidToolInputError(
        'agentRunId must belong to the requesting AgentDefinition.',
      );
    }
  }
  if (input.workItemId) {
    const workItem = await store.getWorkItemById(input.workItemId);
    if (!workItem || workItem.organizationId !== input.organizationId) {
      throw new InvalidToolInputError(
        'workItemId must refer to a WorkItem in the request organization.',
      );
    }
  }
}

function routedStatus(
  allowed: boolean,
  approvalRequirement: ToolDefinition['approvalRequirement'],
): ToolRequest['status'] {
  if (!allowed) {
    return 'DENIED';
  }
  if (approvalRequirement === 'ALWAYS') {
    return 'WAITING_APPROVAL';
  }
  if (approvalRequirement === 'NEVER') {
    return 'READY';
  }
  throw new InvalidToolInputError(
    `Unsupported approvalRequirement: ${String(approvalRequirement)}`,
  );
}

function sameLogicalRequest(
  existing: ToolRequest,
  candidate: {
    organizationId: string;
    toolSlug: string;
    toolVersion: number;
    input: unknown;
    requestedByType: ToolActorType;
    agentDefinitionId: string | null;
  },
): boolean {
  return (
    existing.organizationId === candidate.organizationId &&
    existing.toolSlug === candidate.toolSlug &&
    existing.toolVersion === candidate.toolVersion &&
    existing.requestedByType === candidate.requestedByType &&
    (existing.agentDefinitionId ?? null) === candidate.agentDefinitionId &&
    jsonValuesEqual(existing.input, candidate.input)
  );
}

function creationEvent(
  request: ToolRequest,
  now: Temporal.Instant,
  denialCode: ToolPermissionDenialCode | null,
) {
  if (request.status === 'DENIED') {
    return toolLifecycleEvent({
      request,
      eventType: TOOL_EVENT_TYPES.denied,
      title: `Tool request denied: ${request.toolName}`,
      now,
      denialCode: denialCode ?? 'ACTOR_NOT_ALLOWED',
    });
  }
  if (request.status === 'WAITING_APPROVAL') {
    return toolLifecycleEvent({
      request,
      eventType: TOOL_EVENT_TYPES.waitingApproval,
      title: `Tool request waiting approval: ${request.toolName}`,
      now,
    });
  }
  return toolLifecycleEvent({
    request,
    eventType: TOOL_EVENT_TYPES.ready,
    title: `Tool request ready: ${request.toolName}`,
    now,
  });
}

export async function requestToolUseWithStore(
  store: ToolLifecycleStore,
  input: RequestToolUseInput,
  now: Temporal.Instant = Temporal.Now.instant(),
): Promise<ToolRequest> {
  if (input.definition.persistExecution !== true) {
    throw new InvalidToolInputError(
      'requestToolUse requires persistExecution=true. Non-persisted tools are a future coordinator path.',
    );
  }

  const parsedInput = parseToolInput(input.definition, input.input);
  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey);
  await assertOrganization(store, input.organizationId);
  const actor = await resolveActor(store, input.organizationId, input.actor);
  await assertOptionalReferences(store, {
    organizationId: input.organizationId,
    agentDefinitionId: actor.agentDefinitionId,
    agentRunId: input.agentRunId ?? null,
    workItemId: input.workItemId ?? null,
  });

  const snapshot = getToolDefinitionSnapshot(input.definition);
  const permission = evaluateToolPermission(actor.permissionActor, input.definition);
  const status = routedStatus(permission.allowed, input.definition.approvalRequirement);

  const record: CreateToolRequestRecordInput = {
    organizationId: input.organizationId,
    toolSlug: snapshot.toolSlug,
    toolName: snapshot.toolName,
    toolVersion: snapshot.toolVersion,
    requiredPermission: snapshot.requiredPermission,
    riskLevel: snapshot.riskLevel,
    approvalRequirement: snapshot.approvalRequirement,
    status,
    input: parsedInput,
    requestedByType: actor.requestedByType,
    requestedById: actor.requestedById,
    agentDefinitionId: actor.agentDefinitionId,
    agentRunId: input.agentRunId ?? null,
    workItemId: input.workItemId ?? null,
    idempotencyKey,
  };

  if (idempotencyKey) {
    const existing = await store.findToolRequestByIdempotency(
      record.organizationId,
      record.toolSlug,
      idempotencyKey,
    );
    if (existing) {
      if (!sameLogicalRequest(existing, record)) {
        throw new ToolIdempotencyConflictError(existing.id);
      }
      return existing;
    }
  }

  return commitStateAndEvent(
    async (work) => work(store),
    async () => store.createToolRequest(record),
    async (_store, created) => {
      await store.recordEvent(creationEvent(created, now, permission.code));
    },
  );
}

export async function requestToolUse(input: RequestToolUseInput): Promise<ToolRequest> {
  try {
    return await runBusinessCommand(async (tx) => {
      return requestToolUseWithStore(toolLifecycleStoreFromTx(tx), input);
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
    const key = normalizeIdempotencyKey(input.idempotencyKey);
    if (!key) {
      throw error;
    }
    const existing = await findToolRequestByIdempotencyWithOrm(
      db.orm,
      input.organizationId,
      input.definition.slug,
      key,
    );
    if (!existing) {
      throw error;
    }
    const parsedInput = parseToolInput(input.definition, input.input);
    const requestedByType = input.actor.type;
    const agentDefinitionId =
      input.actor.type === 'AGENT' ? input.actor.agentDefinition.id : null;
    if (
      !sameLogicalRequest(existing, {
        organizationId: input.organizationId,
        toolSlug: input.definition.slug,
        toolVersion: input.definition.version,
        input: parsedInput,
        requestedByType,
        agentDefinitionId,
      })
    ) {
      throw new ToolIdempotencyConflictError(existing.id);
    }
    return existing;
  }
}
