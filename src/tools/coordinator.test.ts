import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { defineTool } from './definition.ts';
import { createExecutableToolRegistry } from './executable-registry.ts';
import { defineToolImplementation } from './implementation.ts';
import {
  createToolExecutionCoordinator,
  type ToolExecutionCoordinatorDependencies,
} from './coordinator.ts';
import type { ToolExecution, ToolRequest } from './types.ts';
import { InvalidToolTransitionError, ToolRequestNotFoundError } from './errors.ts';

const organizationId = '11111111-1111-4111-8111-111111111111';
const requestId = '22222222-2222-4222-8222-222222222222';
const executionId = '33333333-3333-4333-8333-333333333333';
const agentId = '44444444-4444-4444-8444-444444444444';

function request(overrides: Partial<ToolRequest> = {}): ToolRequest {
  return {
    id: requestId,
    organizationId,
    toolSlug: 'test.prepare_action',
    toolName: 'Prepare Action',
    toolVersion: 1,
    requiredPermission: 'PREPARE',
    riskLevel: 'LOW',
    approvalRequirement: 'NEVER',
    status: 'READY',
    input: { title: 'Do work' },
    requestedByType: 'AGENT',
    requestedById: agentId,
    agentDefinitionId: agentId,
    agentRunId: null,
    workItemId: null,
    approvalId: null,
    idempotencyKey: null,
    requestedAt: Temporal.Instant.from('2026-09-14T14:00:00Z'),
    createdAt: Temporal.Instant.from('2026-09-14T14:00:00Z'),
    updatedAt: Temporal.Instant.from('2026-09-14T14:00:00Z'),
    ...overrides,
  } as ToolRequest;
}

function execution(status: ToolExecution['status'] = 'QUEUED'): ToolExecution {
  return {
    id: executionId,
    organizationId,
    toolRequestId: requestId,
    attemptNumber: 1,
    status,
    output: null,
    error: null,
    startedAt: status === 'QUEUED' ? null : Temporal.Instant.from('2026-09-14T14:00:01Z'),
    completedAt: null,
    createdAt: Temporal.Instant.from('2026-09-14T14:00:00Z'),
  } as ToolExecution;
}

function registry(options: { version?: number; execute?: () => Promise<unknown>; outputString?: boolean } = {}) {
  const inputSchema = z.object({ title: z.string().min(1) }).strict();
  const outputSchema = options.outputString
    ? z.object({ result: z.string() }).strict()
    : z.object({ ok: z.boolean() }).strict();
  const definition = defineTool({
    slug: 'test.prepare_action',
    name: 'Prepare Action',
    description: 'Test coordinator execution.',
    version: options.version ?? 1,
    enabled: true,
    requiredPermission: 'PREPARE',
    riskLevel: 'LOW',
    approvalRequirement: 'NEVER',
    persistExecution: true,
    inputSchema,
    outputSchema,
  });
  const implementation = defineToolImplementation({
    definition,
    execute: async () => (options.execute ? options.execute() : { ok: true }),
  });
  return createExecutableToolRegistry([definition], [implementation]);
}

function dependencies(currentRequest: ToolRequest | null) {
  const calls: string[] = [];
  let completedOutput: unknown;
  let failedError: string | undefined;
  const deps: ToolExecutionCoordinatorDependencies = {
    getToolRequestById: async () => currentRequest,
    createToolExecutionAttempt: async () => {
      calls.push('queued');
      return execution('QUEUED');
    },
    markToolExecutionRunning: async () => {
      calls.push('running');
      return execution('RUNNING');
    },
    completeToolExecution: async (_id, output) => {
      calls.push('completed');
      completedOutput = output;
      return { ...execution('SUCCEEDED'), output } as ToolExecution;
    },
    failToolExecution: async (_id, error) => {
      calls.push('failed');
      failedError = error;
      return { ...execution('FAILED'), error } as ToolExecution;
    },
  };
  return { deps, calls, getCompletedOutput: () => completedOutput, getFailedError: () => failedError };
}

describe('tool execution coordinator', () => {
  it('executes READY persisted input with organization and provenance from the request', async () => {
    let receivedInput: unknown;
    let receivedContext: unknown;
    const definition = defineTool({
      slug: 'test.prepare_action',
      name: 'Prepare Action',
      description: 'Test coordinator execution.',
      version: 1,
      enabled: true,
      requiredPermission: 'PREPARE',
      riskLevel: 'LOW',
      approvalRequirement: 'NEVER',
      persistExecution: true,
      inputSchema: z.object({ title: z.string() }).strict(),
      outputSchema: z.object({ ok: z.boolean() }).strict(),
    });
    const implementation = defineToolImplementation({
      definition,
      execute: async (input, context) => {
        receivedInput = input;
        receivedContext = context;
        return { ok: true };
      },
    });
    const state = dependencies(request());
    const execute = createToolExecutionCoordinator(
      createExecutableToolRegistry([definition], [implementation]),
      state.deps,
    );

    const result = await execute(requestId);

    assert.equal(result.status, 'SUCCEEDED');
    assert.deepEqual(state.calls, ['queued', 'running', 'completed']);
    assert.deepEqual(receivedInput, { title: 'Do work' });
    assert.deepEqual(receivedContext, {
      organizationId,
      toolRequestId: requestId,
      toolExecutionId: executionId,
      actor: { sourceType: 'AGENT', sourceId: agentId },
    });
    assert.deepEqual(state.getCompletedOutput(), { ok: true });
  });

  it('fails execution on definition version drift', async () => {
    const state = dependencies(request({ toolVersion: 1 }));
    const execute = createToolExecutionCoordinator(registry({ version: 2 }), state.deps);
    const result = await execute(requestId);
    assert.equal(result.status, 'FAILED');
    assert.deepEqual(state.calls, ['queued', 'running', 'failed']);
    assert.match(state.getFailedError() ?? '', /version mismatch/);
  });

  it('fails execution when persisted input no longer satisfies the live schema', async () => {
    const state = dependencies(request({ input: {} as ToolRequest['input'] }));
    const execute = createToolExecutionCoordinator(registry(), state.deps);
    const result = await execute(requestId);
    assert.equal(result.status, 'FAILED');
    assert.match(state.getFailedError() ?? '', /Persisted input is invalid/);
  });

  it('fails execution when implementation output fails the output schema', async () => {
    const state = dependencies(request());
    const execute = createToolExecutionCoordinator(
      registry({ execute: async () => ({ result: 42 }), outputString: true }),
      state.deps,
    );
    const result = await execute(requestId);
    assert.equal(result.status, 'FAILED');
    assert.match(state.getFailedError() ?? '', /Tool output is invalid/);
  });

  it('fails execution when implementation throws', async () => {
    const state = dependencies(request());
    const execute = createToolExecutionCoordinator(
      registry({ execute: async () => { throw new Error('implementation exploded'); } }),
      state.deps,
    );
    const result = await execute(requestId);
    assert.equal(result.status, 'FAILED');
    assert.equal(state.getFailedError(), 'implementation exploded');
  });

  it('fails execution when the request tool is not bound in the registry', async () => {
    const state = dependencies(request({ toolSlug: 'test.missing' }));
    const execute = createToolExecutionCoordinator(registry(), state.deps);
    const result = await execute(requestId);
    assert.equal(result.status, 'FAILED');
    assert.match(state.getFailedError() ?? '', /Tool not found/);
  });

  it('rejects non-READY requests before allocating an execution attempt', async () => {
    const state = dependencies(request({ status: 'WAITING_APPROVAL' }));
    const execute = createToolExecutionCoordinator(registry(), state.deps);
    await assert.rejects(execute(requestId), InvalidToolTransitionError);
    assert.deepEqual(state.calls, []);
  });

  it('rejects a missing ToolRequest before allocating an execution attempt', async () => {
    const state = dependencies(null);
    const execute = createToolExecutionCoordinator(registry(), state.deps);
    await assert.rejects(execute(requestId), ToolRequestNotFoundError);
    assert.deepEqual(state.calls, []);
  });
});
