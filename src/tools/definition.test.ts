import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { defineTool, getToolDefinitionSnapshot } from './definition.ts';
import { InvalidToolDefinitionError } from './errors.ts';

const titleInput = z.object({ title: z.string().min(1) });
const summaryOutput = z.object({ summary: z.string() });

function validDefinition() {
  return defineTool({
    slug: 'test.prepare_action',
    name: 'Prepare Action',
    description: 'Prepare a proposed internal action without executing it.',
    version: 1,
    enabled: true,
    requiredPermission: 'PREPARE',
    riskLevel: 'LOW',
    approvalRequirement: 'NEVER',
    persistExecution: true,
    inputSchema: titleInput,
  });
}

describe('defineTool', () => {
  it('accepts a valid definition and freezes the contract', () => {
    const definition = validDefinition();
    assert.equal(definition.slug, 'test.prepare_action');
    assert.equal(definition.name, 'Prepare Action');
    assert.equal(definition.version, 1);
    assert.equal(definition.persistExecution, true);
    assert.throws(() => {
      (definition as { enabled: boolean }).enabled = false;
    }, TypeError);
  });

  it('trims name and description without rewriting the slug', () => {
    const definition = defineTool({
      slug: 'test.read_business_state',
      name: '  Read Business State  ',
      description: '  Inspect current organization business state.  ',
      version: 2,
      enabled: false,
      requiredPermission: 'OBSERVE',
      riskLevel: 'LOW',
      approvalRequirement: 'NEVER',
      persistExecution: false,
      inputSchema: z.object({}),
    });
    assert.equal(definition.name, 'Read Business State');
    assert.equal(definition.description, 'Inspect current organization business state.');
    assert.equal(definition.slug, 'test.read_business_state');
    assert.equal(definition.enabled, false);
    assert.equal(definition.persistExecution, false);
  });

  it('rejects invalid slugs without rewriting them', () => {
    const base = {
      name: 'Create Work Item',
      description: 'Create a JS OS WorkItem within the current organization.',
      version: 1,
      enabled: true,
      requiredPermission: 'PREPARE' as const,
      riskLevel: 'LOW' as const,
      approvalRequirement: 'NEVER' as const,
      persistExecution: true,
      inputSchema: z.object({}),
    };
    assert.throws(
      () => defineTool({ ...base, slug: 'Internal.CreateWorkItem' }),
      InvalidToolDefinitionError,
    );
    assert.throws(
      () => defineTool({ ...base, slug: 'internal/create_work_item' }),
      InvalidToolDefinitionError,
    );
    assert.throws(
      () => defineTool({ ...base, slug: 'internal..create_work_item' }),
      InvalidToolDefinitionError,
    );
    assert.throws(() => defineTool({ ...base, slug: 'send' }), InvalidToolDefinitionError);
  });

  it('rejects invalid versions and blank name or description', () => {
    const base = {
      slug: 'test.execute_action',
      name: 'Execute Action',
      description: 'Execute a previously prepared action.',
      version: 1,
      enabled: true,
      requiredPermission: 'EXECUTE' as const,
      riskLevel: 'MEDIUM' as const,
      approvalRequirement: 'ALWAYS' as const,
      persistExecution: true,
      inputSchema: z.object({}),
    };
    assert.throws(() => defineTool({ ...base, version: 0 }), InvalidToolDefinitionError);
    assert.throws(() => defineTool({ ...base, name: '   ' }), InvalidToolDefinitionError);
    assert.throws(() => defineTool({ ...base, description: '' }), InvalidToolDefinitionError);
  });

  it('rejects a missing input schema', () => {
    assert.throws(
      () =>
        defineTool({
          slug: 'test.execute_action',
          name: 'Execute Action',
          description: 'Execute a previously prepared action.',
          version: 1,
          enabled: true,
          requiredPermission: 'EXECUTE',
          riskLevel: 'MEDIUM',
          approvalRequirement: 'ALWAYS',
          persistExecution: true,
          inputSchema: null as never,
        }),
      InvalidToolDefinitionError,
    );
  });

  it('preserves input schema inference', () => {
    const definition = validDefinition();
    const parsed = definition.inputSchema.parse({ title: 'Draft outreach' });
    assert.equal(parsed.title, 'Draft outreach');
    assert.throws(() => definition.inputSchema.parse({}));
  });

  it('maps snapshot fields exactly', () => {
    const definition = validDefinition();
    assert.deepEqual(getToolDefinitionSnapshot(definition), {
      toolSlug: 'test.prepare_action',
      toolName: 'Prepare Action',
      toolVersion: 1,
      requiredPermission: 'PREPARE',
      riskLevel: 'LOW',
      approvalRequirement: 'NEVER',
    });
  });
});

describe('tool schemas', () => {
  it('parses valid input and rejects invalid input', () => {
    const definition = validDefinition();
    assert.deepEqual(definition.inputSchema.parse({ title: 'Ok' }), { title: 'Ok' });
    assert.throws(() => definition.inputSchema.parse({ title: '' }));
  });

  it('parses optional output schemas', () => {
    const definition = defineTool({
      slug: 'test.read_business_state',
      name: 'Read Business State',
      description: 'Inspect current organization business state.',
      version: 1,
      enabled: true,
      requiredPermission: 'OBSERVE',
      riskLevel: 'LOW',
      approvalRequirement: 'NEVER',
      persistExecution: false,
      inputSchema: z.object({}),
      outputSchema: summaryOutput,
    });
    assert.deepEqual(definition.outputSchema?.parse({ summary: 'Healthy' }), {
      summary: 'Healthy',
    });
    assert.throws(() => definition.outputSchema?.parse({ summary: 1 }));
  });
});
