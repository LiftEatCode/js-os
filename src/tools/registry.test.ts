import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { defineTool } from './definition.ts';
import { DuplicateToolSlugError, ToolNotFoundError } from './errors.ts';
import { ToolRegistry, createToolRegistry } from './registry.ts';

const emptyInput = z.object({});

function tool(overrides: {
  slug: string;
  enabled?: boolean;
  persistExecution?: boolean;
  requiredPermission?: 'OBSERVE' | 'RECOMMEND' | 'PREPARE' | 'EXECUTE';
}) {
  return defineTool({
    slug: overrides.slug,
    name: overrides.slug,
    description: `Test capability ${overrides.slug}.`,
    version: 1,
    enabled: overrides.enabled ?? true,
    requiredPermission: overrides.requiredPermission ?? 'PREPARE',
    riskLevel: 'LOW',
    approvalRequirement: 'NEVER',
    persistExecution: overrides.persistExecution ?? true,
    inputSchema: emptyInput,
  });
}

describe('ToolRegistry', () => {
  it('registers and looks up by slug', () => {
    const registry = createToolRegistry();
    const definition = tool({ slug: 'test.prepare_action' });
    registry.register(definition);
    assert.equal(registry.has('test.prepare_action'), true);
    assert.equal(registry.get('test.prepare_action'), definition);
    assert.equal(registry.require('test.prepare_action'), definition);
  });

  it('returns null for unknown lookup and throws from require', () => {
    const registry = new ToolRegistry();
    assert.equal(registry.get('test.missing'), null);
    assert.equal(registry.has('test.missing'), false);
    assert.throws(() => registry.require('test.missing'), ToolNotFoundError);
  });

  it('rejects duplicate slugs even when versions differ', () => {
    const first = tool({ slug: 'test.execute_action' });
    const second = defineTool({
      slug: 'test.execute_action',
      name: 'Execute Action v2',
      description: 'Second contract for the same slug.',
      version: 2,
      enabled: true,
      requiredPermission: 'EXECUTE',
      riskLevel: 'MEDIUM',
      approvalRequirement: 'ALWAYS',
      persistExecution: true,
      inputSchema: emptyInput,
    });
    const registry = new ToolRegistry([first]);
    assert.throws(() => registry.register(second), DuplicateToolSlugError);
    assert.throws(
      () => new ToolRegistry([first, second]),
      DuplicateToolSlugError,
    );
  });

  it('lists tools deterministically by slug', () => {
    const registry = createToolRegistry([
      tool({ slug: 'test.execute_action' }),
      tool({ slug: 'test.read_business_state' }),
      tool({ slug: 'test.prepare_action' }),
    ]);
    assert.deepEqual(
      registry.list().map((definition) => definition.slug),
      ['test.execute_action', 'test.prepare_action', 'test.read_business_state'],
    );
  });

  it('filters enabled tools without removing disabled ones', () => {
    const disabled = tool({ slug: 'test.read_business_state', enabled: false });
    const registry = createToolRegistry([
      tool({ slug: 'test.execute_action' }),
      disabled,
      tool({ slug: 'test.prepare_action', enabled: true }),
    ]);
    assert.deepEqual(
      registry.listEnabled().map((definition) => definition.slug),
      ['test.execute_action', 'test.prepare_action'],
    );
    assert.equal(registry.get('test.read_business_state'), disabled);
    assert.equal(registry.has('test.read_business_state'), true);
  });

  it('does not expose a mutable internal collection', () => {
    const registry = createToolRegistry([tool({ slug: 'test.prepare_action' })]);
    const listed = registry.list();
    listed.pop();
    listed.push(tool({ slug: 'test.execute_action' }));
    assert.deepEqual(
      registry.list().map((definition) => definition.slug),
      ['test.prepare_action'],
    );
  });
});
