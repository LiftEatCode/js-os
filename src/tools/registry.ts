import { DuplicateToolSlugError, ToolNotFoundError } from './errors.ts';
import type { ToolDefinition } from './definition.ts';

function compareSlugs(left: string, right: string): number {
  return left.localeCompare(right, 'en');
}

/**
 * In-memory catalog of ToolDefinitions.
 * One active contract per slug. Historical versions live on ToolRequest rows.
 */
export class ToolRegistry {
  readonly #tools = new Map<string, ToolDefinition>();

  constructor(definitions: readonly ToolDefinition[] = []) {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  register(definition: ToolDefinition): void {
    if (this.#tools.has(definition.slug)) {
      throw new DuplicateToolSlugError(definition.slug);
    }
    this.#tools.set(definition.slug, definition);
  }

  get(slug: string): ToolDefinition | null {
    return this.#tools.get(slug) ?? null;
  }

  has(slug: string): boolean {
    return this.#tools.has(slug);
  }

  require(slug: string): ToolDefinition {
    const definition = this.get(slug);
    if (definition === null) {
      throw new ToolNotFoundError(slug);
    }
    return definition;
  }

  list(): ToolDefinition[] {
    return [...this.#tools.values()].sort((left, right) => compareSlugs(left.slug, right.slug));
  }

  listEnabled(): ToolDefinition[] {
    return this.list().filter((definition) => definition.enabled);
  }
}

export function createToolRegistry(
  definitions: readonly ToolDefinition[] = [],
): ToolRegistry {
  return new ToolRegistry(definitions);
}
