/// <reference types="temporal-polyfill/types/global" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { createToolExecutionCoordinator, type ToolExecutionCoordinatorDependencies } from './coordinator.ts';
import { defineTool } from './definition.ts';
import { createExecutableToolRegistry } from './executable-registry.ts';
import { defineToolImplementation } from './implementation.ts';
import type { ToolExecution, ToolRequest } from './types.ts';

function request(overrides: Partial<ToolRequest> = {}): ToolRequest {
  return {
    id: 'request-1',
    organizationId: 'org-1',
    toolSlug: 'test.prepare_action',
    toolName: 'Prepare Action',
    toolVersion: 1,
    requiredPermission: 'PREPARE',
    riskLevel: 'LOW',
    approvalRequirement: 'NEVER',
    requestedByType: 'AGENT',
    requestedById: 'agent-1',
    agentDefinitionId: 'agent-1',
    agentRunId: null,
    workItemId: null,
    approvalId: null,
    status: 'READY',
    denialCode: null,
    denialReason: null,
    input: { title: 'Persisted title' },
    idempotencyKey: null,
    requestedAt: Temporal.Instant.from('2026-09-14T14:00:00Z'),
    resolvedAt: null,
    createdAt: Temporal.Instant.from('2026-09-14T14:00:00Z'),
    ...overrides,
  } as ToolRequest;
}

function execution(overrides: Partial<ToolExecution> = {}): ToolExecution {
  return {
    id: 'execution-1',
    organizationId: 'org-1',
    toolRequestId: 'request-1',
    attemptNumber: 1,
    status: 'QUEUED',
    output: null,
    error: null,
    queuedAt: Temporal.Instant.from('2026-09-14T14:00:00Z'),
    startedAt: null,
    completedAt: null,
    createdAt: Temporal.Instant.from('2026-09-14T14:00:00Z'),
    ...overrides,
  } as ToolExecution;
}

type CoordinatorTestOutput = { ok: boolean } | { result: string };

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
    execute: async () =>
      (options.execute ? await options.execute() : { ok: true }) as CoordinatorTestOutput,
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
      return execution();
    },
    markToolExecutionRunning: async () => {
      calls.push('running');
      return execution({ status: 'RUNNING' });
    },
    completeToolExecution: async (_id, output) => {
      calls.push('succeeded');
      completedOutput = output;
      return execution({ status: 'SUCCEEDED', output: output as ToolExecution['output'] });
    },
    failToolExecution: async (_id, error) => {
      calls.push('failed');
      failedError = error;
      return execution({ status: 'FAILED', error });
    },
  };
  return { deps, calls, completedOutput: () => completedOutput, failedError: () => failedError };
}

describe('tool execution coordinator', () => {
  it('executes READY persisted input with organization and provenance from the request', async () => {
    const state = dependencies(request());
    let seenInput: unknown;
    let seenContext: unknown;
    const toolRegistry = registry({
      execute: async () => {
        seenInput = { title: 'Persisted title' };
        seenContext = {
          organizationId: 'org-1',
          toolRequestId: 'request-1',
          toolExecutionId: 'execution-1',
          actor: { sourceType: 'AGENT', sourceId: 'agent-1' },
        };
        return { ok: true };
      },
    });
    const execute = createToolExecutionCoordinator(toolRegistry, state.deps);

    const result = await execute('request-1');

    assert.equal(result.status, 'SUCCEEDED');
    assert.deepEqual(state.calls, ['queued', 'running', 'succeeded']);
    assert.deepEqual(seenInput, { title: 'Persisted title' });
    assert.deepEqual(seenContext, {
      organizationId: 'org-1',
      toolRequestId: 'request-1',
      toolExecutionId: 'execution-1',
      actor: { sourceType: 'AGENT', sourceId: 'agent-1' },
    });
  });

  it('fails execution on definition version drift', async () => {
    const state = dependencies(request({ toolVersion: 1 }));
    const execute = createToolExecutionCoordinator(registry({ version: 2 }), state.deps);
    const result = await execute('request-1');
    assert.equal(result.status, 'FAILED');
    assert.deepEqual(state.calls, ['queued', 'running', 'failed']);
    assert.match(state.failedError() ?? '', /version/i);
  });

  it('fails execution when persisted input no longer satisfies the live schema', async () => {
    const state = dependencies(request({ input: { title: '' } }));
    const execute = createToolExecutionCoordinator(registry(), state.deps);
    const result = await execute('request-1');
    assert.equal(result.status, 'FAILED');
    assert.match(state.failedError() ?? '', /input is invalid/i);
  });

  it('fails execution when implementation output fails the output schema', async () => {
    const state = dependencies(request());
    const execute = createToolExecutionCoordinator(
      registry({ execute: async () => ({ ok: true }), outputString: true }),
      state.deps,
    );
    const result = await execute('request-1');
    assert.equal(result.status, 'FAILED');
    assert.match(state.failedError() ?? '', /output is invalid/i);
  });

  it('fails execution when implementation throws', async () => {
    const state = dependencies(request());
    const execute = createToolExecutionCoordinator(
      registry({ execute: async () => { throw new Error('adapter exploded'); } }),
      state.deps,
    );
    const result = await execute('request-1');
    assert.equal(result.status, 'FAILED');
    assert.equal(state.failedError(), 'adapter exploded');
  });

  it('fails execution when the request tool is not bound in the registry', async () => {
    const state = dependencies(request({ toolSlug: 'test.missing_action' }));
    const execute = createToolExecutionCoordinator(registry(), state.deps);
    const result = await execute('request-1');
    assert.equal(result.status, 'FAILED');
    assert.match(state.failedError() ?? '', /not found/i);
  });

  it('rejects non-READY requests before allocating an execution attempt', async () => {
    const state = dependencies(request({ status: 'WAITING_APPROVAL' }));
    const execute = createToolExecutionCoordinator(registry(), state.deps);
    await assert.rejects(() => execute('request-1'), /must be READY/i);
    assert.deepEqual(state.calls, []);
  });

  it('rejects a missing ToolRequest before allocating an execution attempt', async () => {
    const state = dependencies(null);
    const execute = createToolExecutionCoordinator(registry(), state.deps);
    await assert.rejects(() => execute('missing'), /not found/i);
    assert.deepEqual(state.calls, []);
  });
});
