import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { defineTool } from './definition.ts';
import { defineToolImplementation } from './implementation.ts';

const inputSchema = z.object({ title: z.string().min(1) });
const outputSchema = z.object({ workItemId: z.string().min(1) });

function definition() {
  return defineTool({
    slug: 'test.create_work_item',
    name: 'Create Work Item',
    description: 'Create a test work item through a controlled implementation.',
    version: 1,
    enabled: true,
    requiredPermission: 'PREPARE',
    riskLevel: 'LOW',
    approvalRequirement: 'NEVER',
    persistExecution: true,
    inputSchema,
    outputSchema,
  });
}

describe('defineToolImplementation', () => {
  it('binds a ToolDefinition to executable code and freezes the binding', async () => {
    const toolDefinition = definition();
    const implementation = defineToolImplementation({
      definition: toolDefinition,
      execute: async (input, context) => ({
        workItemId: `${context.organizationId}:${input.title}`,
      }),
    });

    assert.equal(implementation.definition, toolDefinition);
    assert.equal(Object.isFrozen(implementation), true);
    assert.deepEqual(
      await implementation.execute(
        { title: 'Draft outreach' },
        {
          organizationId: 'org-1',
          toolRequestId: 'request-1',
          toolExecutionId: 'execution-1',
          actor: { sourceType: 'AGENT', sourceId: 'agent-1' },
        },
      ),
      { workItemId: 'org-1:Draft outreach' },
    );
  });

  it('keeps execute off the declarative ToolDefinition', () => {
    const toolDefinition = definition();
    const implementation = defineToolImplementation({
      definition: toolDefinition,
      execute: async () => ({ workItemId: 'work-1' }),
    });

    assert.equal('execute' in toolDefinition, false);
    assert.equal(typeof implementation.execute, 'function');
  });

  it('rejects a missing definition', () => {
    assert.throws(
      () =>
        defineToolImplementation({
          definition: null as never,
          execute: async () => ({ workItemId: 'work-1' }),
        }),
      /requires a ToolDefinition/,
    );
  });

  it('rejects a missing execute function', () => {
    assert.throws(
      () =>
        defineToolImplementation({
          definition: definition(),
          execute: null as never,
        }),
      /execute must be a function/,
    );
  });
});
