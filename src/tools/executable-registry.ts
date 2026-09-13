import type { ToolDefinition } from './definition.ts';
import {
  DuplicateToolImplementationError,
  ToolImplementationNotFoundError,
  ToolNotFoundError,
} from './errors.ts';
import type { ToolImplementation } from './implementation.ts';
import { ToolRegistry, createToolRegistry } from './registry.ts';

function compareSlugs(left: string, right: string): number {
  return left.localeCompare(right, 'en');
}

/**
 * Strict composition root for declarative tool contracts and executable
 * implementations.
 *
 * ToolRegistry remains the source of truth for definition semantics. This
 * registry adds an executable binding and requires a complete one-to-one
 * mapping at composition time so execution cannot discover a missing adapter
 * only after a durable ToolRequest has reached READY.
 */
export class ExecutableToolRegistry {
  readonly #definitions: ToolRegistry;
  readonly #implementations = new Map<string, ToolImplementation>();

  constructor(
    definitions: readonly ToolDefinition[] = [],
    implementations: readonly ToolImplementation[] = [],
  ) {
    this.#definitions = createToolRegistry(definitions);

    for (const implementation of implementations) {
      this.bind(implementation);
    }

    for (const definition of this.#definitions.list()) {
      if (!this.#implementations.has(definition.slug)) {
        throw new ToolImplementationNotFoundError(definition.slug);
      }
    }
  }

  /**
   * Declarative registry used by request-time discovery and authorization.
   */
  get definitions(): ToolRegistry {
    return this.#definitions;
  }

  getDefinition(slug: string): ToolDefinition | null {
    return this.#definitions.get(slug);
  }

  requireDefinition(slug: string): ToolDefinition {
    return this.#definitions.require(slug);
  }

  has(slug: string): boolean {
    return this.#definitions.has(slug);
  }

  getImplementation(slug: string): ToolImplementation | null {
    return this.#implementations.get(slug) ?? null;
  }

  requireImplementation(slug: string): ToolImplementation {
    const implementation = this.getImplementation(slug);
    if (implementation === null) {
      if (!this.#definitions.has(slug)) {
        throw new ToolNotFoundError(slug);
      }
      throw new ToolImplementationNotFoundError(slug);
    }
    return implementation;
  }

  /**
   * Deterministic declarative listing. Disabled definitions remain visible;
   * request-time permission evaluation is still responsible for rejecting them.
   */
  listDefinitions(): ToolDefinition[] {
    return this.#definitions.list();
  }

  /**
   * Deterministic executable listing by tool slug.
   */
  listImplementations(): ToolImplementation[] {
    return [...this.#implementations.values()].sort((left, right) =>
      compareSlugs(left.definition.slug, right.definition.slug),
    );
  }

  bind(implementation: ToolImplementation): void {
    const slug = implementation.definition.slug;
    const registeredDefinition = this.#definitions.get(slug);
    if (registeredDefinition === null) {
      throw new ToolNotFoundError(slug);
    }
    if (this.#implementations.has(slug)) {
      throw new DuplicateToolImplementationError(slug);
    }

    this.#implementations.set(slug, implementation);
  }
}

export function createExecutableToolRegistry(
  definitions: readonly ToolDefinition[] = [],
  implementations: readonly ToolImplementation[] = [],
): ExecutableToolRegistry {
  return new ExecutableToolRegistry(definitions, implementations);
}
