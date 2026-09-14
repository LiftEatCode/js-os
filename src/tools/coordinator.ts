import { executableToolRegistry } from './catalog.ts';
import {
  InvalidToolInputError,
  InvalidToolOutputError,
  InvalidToolTransitionError,
  ToolDefinitionVersionMismatchError,
  ToolRequestNotFoundError,
} from './errors.ts';
import type { ExecutableToolRegistry } from './executable-registry.ts';
import {
  completeToolExecution,
  createToolExecutionAttempt,
  failToolExecution,
  markToolExecutionRunning,
} from './executions.ts';
import { getToolRequestById } from './requests.ts';
import type { ToolExecution, ToolRequest } from './types.ts';

export type ToolExecutionCoordinatorDependencies = {
  getToolRequestById(id: string): Promise<ToolRequest | null>;
  createToolExecutionAttempt(toolRequestId: string): Promise<ToolExecution>;
  markToolExecutionRunning(id: string): Promise<ToolExecution>;
  completeToolExecution(id: string, output?: unknown): Promise<ToolExecution>;
  failToolExecution(id: string, error: string): Promise<ToolExecution>;
};

const DEFAULT_DEPENDENCIES: ToolExecutionCoordinatorDependencies = {
  getToolRequestById,
  createToolExecutionAttempt,
  markToolExecutionRunning,
  completeToolExecution,
  failToolExecution,
};

function executionErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return 'Tool execution failed.';
}

function assertReady(request: ToolRequest): void {
  if (request.status !== 'READY') {
    throw new InvalidToolTransitionError(
      `ToolRequest must be READY before execution; found ${request.status}.`,
    );
  }
}

/**
 * Explicit coordinator for one persisted ToolRequest.
 *
 * Authorization has already happened before READY. The coordinator does not
 * re-authorize; it creates an execution attempt, resolves the current bound
 * implementation, fails closed on definition-version drift, parses persisted
 * input through the live schema, executes with server-owned provenance, parses
 * output, then delegates terminal state changes to the existing lifecycle APIs.
 */
export function createToolExecutionCoordinator(
  registry: ExecutableToolRegistry,
  dependencies: ToolExecutionCoordinatorDependencies = DEFAULT_DEPENDENCIES,
): (toolRequestId: string) => Promise<ToolExecution> {
  return async function execute(toolRequestId: string): Promise<ToolExecution> {
    const request = await dependencies.getToolRequestById(toolRequestId);
    if (!request) {
      throw new ToolRequestNotFoundError(toolRequestId);
    }
    assertReady(request);

    const execution = await dependencies.createToolExecutionAttempt(request.id);
    await dependencies.markToolExecutionRunning(execution.id);

    try {
      const implementation = registry.requireImplementation(request.toolSlug);
      const definition = implementation.definition;

      if (definition.version !== request.toolVersion) {
        throw new ToolDefinitionVersionMismatchError(
          request.toolSlug,
          request.toolVersion,
          definition.version,
        );
      }

      const inputResult = definition.inputSchema.safeParse(request.input);
      if (!inputResult.success) {
        throw new InvalidToolInputError(
          `Persisted input is invalid for ${request.toolSlug} v${request.toolVersion}.`,
        );
      }

      const output = await implementation.execute(inputResult.data, {
        organizationId: request.organizationId,
        toolRequestId: request.id,
        toolExecutionId: execution.id,
        actor: {
          sourceType: request.requestedByType,
          sourceId: request.requestedById ?? null,
        },
      });

      let validatedOutput = output;
      if (definition.outputSchema !== undefined) {
        const outputResult = definition.outputSchema.safeParse(output);
        if (!outputResult.success) {
          throw new InvalidToolOutputError(
            `Tool output is invalid for ${request.toolSlug} v${request.toolVersion}.`,
          );
        }
        validatedOutput = outputResult.data;
      }

      return dependencies.completeToolExecution(execution.id, validatedOutput);
    } catch (error) {
      return dependencies.failToolExecution(execution.id, executionErrorMessage(error));
    }
  };
}

export const executeToolRequest = createToolExecutionCoordinator(executableToolRegistry);
