import type { z } from 'zod';
import { InvalidToolDefinitionError } from './errors.ts';
import type {
  ToolApprovalRequirement,
  ToolRequestSnapshotFields,
  ToolRequiredPermission,
  ToolRiskLevel,
} from './types.ts';
import { isValidToolSlug, isValidToolVersion } from './validation.ts';

/**
 * Declarative capability contract. Not an executable adapter.
 * ToolImplementation (execute) is a later milestone.
 */
export type ToolDefinition<
  TInputSchema extends z.ZodType = z.ZodType,
  TOutputSchema extends z.ZodType | undefined = undefined,
> = Readonly<{
  slug: string;
  name: string;
  description: string;
  version: number;
  enabled: boolean;
  requiredPermission: ToolRequiredPermission;
  riskLevel: ToolRiskLevel;
  approvalRequirement: ToolApprovalRequirement;
  persistExecution: boolean;
  inputSchema: TInputSchema;
  outputSchema?: TOutputSchema;
}>;

export type DefineToolInput<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType | undefined = undefined,
> = {
  slug: string;
  name: string;
  description: string;
  version: number;
  enabled: boolean;
  requiredPermission: ToolRequiredPermission;
  riskLevel: ToolRiskLevel;
  approvalRequirement: ToolApprovalRequirement;
  persistExecution: boolean;
  inputSchema: TInputSchema;
  outputSchema?: TOutputSchema;
};

function requireTrimmedText(value: string, field: string): string {
  if (typeof value !== 'string') {
    throw new InvalidToolDefinitionError(`${field} must be a non-empty string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new InvalidToolDefinitionError(`${field} must be a non-empty string.`);
  }
  return trimmed;
}

function assertZodSchema(value: unknown, field: string): asserts value is z.ZodType {
  if (
    value === null ||
    typeof value !== 'object' ||
    typeof (value as z.ZodType).safeParse !== 'function'
  ) {
    throw new InvalidToolDefinitionError(`${field} must be a Zod schema.`);
  }
}

/**
 * Build a validated ToolDefinition. Does not register, persist, or execute.
 * Slugs are not rewritten: invalid identity is rejected as given.
 */
export function defineTool<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType | undefined = undefined,
>(
  definition: DefineToolInput<TInputSchema, TOutputSchema>,
): ToolDefinition<TInputSchema, TOutputSchema> {
  if (!isValidToolSlug(definition.slug)) {
    throw new InvalidToolDefinitionError(
      'slug must use lowercase.dot.notation (for example internal.create_work_item).',
    );
  }
  if (!isValidToolVersion(definition.version)) {
    throw new InvalidToolDefinitionError('version must be an integer >= 1.');
  }
  if (typeof definition.enabled !== 'boolean') {
    throw new InvalidToolDefinitionError('enabled must be a boolean.');
  }
  if (typeof definition.persistExecution !== 'boolean') {
    throw new InvalidToolDefinitionError('persistExecution must be a boolean.');
  }
  assertZodSchema(definition.inputSchema, 'inputSchema');
  if (definition.outputSchema !== undefined) {
    assertZodSchema(definition.outputSchema, 'outputSchema');
  }

  const frozen = {
    slug: definition.slug,
    name: requireTrimmedText(definition.name, 'name'),
    description: requireTrimmedText(definition.description, 'description'),
    version: definition.version,
    enabled: definition.enabled,
    requiredPermission: definition.requiredPermission,
    riskLevel: definition.riskLevel,
    approvalRequirement: definition.approvalRequirement,
    persistExecution: definition.persistExecution,
    inputSchema: definition.inputSchema,
    ...(definition.outputSchema !== undefined ? { outputSchema: definition.outputSchema } : {}),
  };

  return Object.freeze(frozen) as ToolDefinition<TInputSchema, TOutputSchema>;
}

/**
 * Persistable metadata for a future ToolRequest snapshot.
 * Does not include description, enabled, persistExecution, or schemas.
 */
export function getToolDefinitionSnapshot(
  definition: ToolDefinition,
): ToolRequestSnapshotFields {
  return {
    toolSlug: definition.slug,
    toolName: definition.name,
    toolVersion: definition.version,
    requiredPermission: definition.requiredPermission,
    riskLevel: definition.riskLevel,
    approvalRequirement: definition.approvalRequirement,
  };
}
