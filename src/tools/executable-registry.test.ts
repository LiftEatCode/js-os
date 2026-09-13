import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';
import { defineTool } from './definition.ts';
import {
  DuplicateToolImplementationError,
  DuplicateToolSlugError,
  ToolImplementationNotFoundError,
  ToolNotFoundError,
} from './errors.ts';
import { ExecutableToolRegistry, createExecutableToolRegistry } from './executable-registry.ts';
import { defineToolImplementation } from './implementation.ts';

function definition(slug: string, enabled = true) {
  return defineTool({
    slug,
    name: slug,
    description: `Test capability ${slug}.`,
    version: 1,
    enabled,
    requiredPermission: 'PREPARE',
    riskLevel: 'LOW',
    approvalRequirement: 'NEVER',
    persistExecution: true,
    inputSchema: z.object({ title: z.string().min(1) }),
    outputSchema: z.object({ id: z.string().min(1) }),
  });
}

function implementation(toolDefinition: ReturnType<typeof definition>) {
  return defineToolImplementation({
    definition: toolDefinition,
    execute: async () => ({ id: toolDefinition.slug }),
  });
}

describe('ExecutableToolRegistry', () => {
  it('composes definitions and implementations with deterministic lookup', () => {
    const create = definition('internal.create_work_item');
    const update = definition('internal.update_work_status');
    const createImplementation = implementation(create);
    const updateImplementation = implementation(update);

    const registry = createExecutableToolRegistry(
      [update, create],
      [updateImplementation, createImplementation],
    );

    assert.equal(registry.has(create.slug), true);
    assert.equal(registry.getDefinition(create.slug), create);
    assert.equal(registry.requireDefinition(create.slug), create);
    assert.equal(registry.getImplementation(create.slug), createImplementation);
    assert.equal(registry.requireImplementation(create.slug), createImplementation);
    assert.equal(registry.definitions.require(create.slug), create);
    assert.deepEqual(
      registry.listDefinitions().map((item) => item.slug),
      ['internal.create_work_item', 'internal.update_work_status'],
    );
    assert.deepEqual(
      registry.listImplementations().map((item) => item.definition.slug),
      ['internal.create_work_item', 'internal.update_work_status'],
    );
  });

  it('preserves ToolRegistry duplicate-definition protection', () => {
    const first = definition('internal.create_work_item');
    const duplicate = definition('internal.create_work_item');

    assert.throws(
      () => new ExecutableToolRegistry([first, duplicate], []),
      DuplicateToolSlugError,
    );
  });

  it('rejects duplicate implementation bindings for one slug', () => {
    const toolDefinition = definition('internal.create_work_item');
    const first = implementation(toolDefinition);
    const second = implementation(toolDefinition);

    assert.throws(
      () => createExecutableToolRegistry([toolDefinition], [first, second]),
      DuplicateToolImplementationError,
    );
  });

  it('rejects an implementation whose slug is not declared', () => {
    const declared = definition('internal.create_work_item');
    const unknown = definition('internal.update_work_status');

    assert.throws(
      () => createExecutableToolRegistry([declared], [implementation(unknown)]),
      ToolNotFoundError,
    );
  });

  it('fails composition when a declared tool has no implementation', () => {
    const create = definition('internal.create_work_item');
    const update = definition('internal.update_work_status');

    assert.throws(
      () => createExecutableToolRegistry([create, update], [implementation(create)]),
      ToolImplementationNotFoundError,
    );
  });

  it('throws deterministically for unknown definition and implementation lookup', () => {
    const toolDefinition = definition('internal.create_work_item');
    const registry = createExecutableToolRegistry(
      [toolDefinition],
      [implementation(toolDefinition)],
    );

    assert.equal(registry.getDefinition('internal.missing'), null);
    assert.equal(registry.getImplementation('internal.missing'), null);
    assert.throws(() => registry.requireDefinition('internal.missing'), ToolNotFoundError);
    assert.throws(() => registry.requireImplementation('internal.missing'), ToolNotFoundError);
  });

  it('keeps disabled definitions discoverable and bound', () => {
    const disabled = definition('internal.create_work_item', false);
    const bound = implementation(disabled);
    const registry = createExecutableToolRegistry([disabled], [bound]);

    assert.equal(registry.getDefinition(disabled.slug), disabled);
    assert.equal(registry.getImplementation(disabled.slug), bound);
    assert.equal(registry.listDefinitions()[0]?.enabled, false);
  });

  it('does not expose mutable internal collections', () => {
    const toolDefinition = definition('internal.create_work_item');
    const registry = createExecutableToolRegistry(
      [toolDefinition],
      [implementation(toolDefinition)],
    );

    registry.listDefinitions().pop();
    registry.listImplementations().pop();

    assert.equal(registry.listDefinitions().length, 1);
    assert.equal(registry.listImplementations().length, 1);
  });
});
