import type { z } from 'zod';
import type { ToolDefinition } from './definition.ts';

/**
 * Provenance carried into a tool implementation after the request has already
 * passed authorization. This shape intentionally mirrors business-command
 * actor provenance without coupling the tool contract to a specific command.
 */
export type ToolExecutionActor = Readonly<{
  sourceType: 'USER' | 'AGENT' | 'SYSTEM';
  sourceId?: string | null;
}>;

/**
 * Server-owned execution context. Implementations must derive organization and
 * provenance from this context rather than accepting those values as tool input.
 */
export type ToolExecutionContext = Readonly<{
  organizationId: string;
  toolRequestId: string;
  toolExecutionId: string;
  actor: ToolExecutionActor;
}>;

type ToolInput<TInputSchema extends z.ZodType> = z.output<TInputSchema>;
type ToolOutput<TOutputSchema extends z.ZodType | undefined> =
  TOutputSchema extends z.ZodType ? z.input<TOutputSchema> : unknown;

/**
 * Executable binding for a declarative ToolDefinition.
 *
 * ToolDefinition remains the capability contract used for discovery,
 * authorization, persistence snapshots, and schema validation. Execution is a
 * separate concern and is attached only through ToolImplementation.
 */
export type ToolImplementation<
  TInputSchema extends z.ZodType = z.ZodType,
  TOutputSchema extends z.ZodType | undefined = z.ZodType | undefined,
> = Readonly<{
  definition: ToolDefinition<TInputSchema, TOutputSchema>;
  execute: (
    input: ToolInput<TInputSchema>,
    context: ToolExecutionContext,
  ) => Promise<ToolOutput<TOutputSchema>>;
}>;

export type DefineToolImplementationInput<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType | undefined = undefined,
> = {
  definition: ToolDefinition<TInputSchema, TOutputSchema>;
  execute: ToolImplementation<TInputSchema, TOutputSchema>['execute'];
};

/**
 * Bind a validated definition to executable code. This helper does not
 * register, authorize, persist, validate input/output, or execute the tool.
 */
export function defineToolImplementation<
  TInputSchema extends z.ZodType,
  TOutputSchema extends z.ZodType | undefined = undefined,
>(
  implementation: DefineToolImplementationInput<TInputSchema, TOutputSchema>,
): ToolImplementation<TInputSchema, TOutputSchema> {
  if (
    implementation == null ||
    typeof implementation !== 'object' ||
    implementation.definition == null ||
    typeof implementation.definition !== 'object'
  ) {
    throw new TypeError('ToolImplementation requires a ToolDefinition.');
  }
  if (typeof implementation.execute !== 'function') {
    throw new TypeError('ToolImplementation execute must be a function.');
  }

  return Object.freeze({
    definition: implementation.definition,
    execute: implementation.execute,
  });
}
