import { createExecutableToolRegistry } from './executable-registry.ts';
import {
  internalCreateWorkItemDefinition,
  internalCreateWorkItemImplementation,
} from './definitions/internal-create-work-item.ts';
import {
  internalUpdateWorkStatusDefinition,
  internalUpdateWorkStatusImplementation,
} from './definitions/internal-update-work-status.ts';

/**
 * Current executable tool catalog for JS OS internal tools.
 * Definitions remain declarative; this module is the composition root that
 * binds each current definition to exactly one implementation.
 */
export const executableToolRegistry = createExecutableToolRegistry(
  [internalCreateWorkItemDefinition, internalUpdateWorkStatusDefinition],
  [internalCreateWorkItemImplementation, internalUpdateWorkStatusImplementation],
);
