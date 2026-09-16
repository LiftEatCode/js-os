import type { ToolExecution } from '../../tools/types.ts';
import type {
  ToolExecutionViewModel,
  ToolRequestOutcomeViewModel,
} from './tool-request-detail-view-model.ts';

const TERMINAL_EXECUTION_STATUSES = new Set<ToolExecution['status']>([
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
]);

export type ToolExecutionMapping = Readonly<{
  executions: readonly ToolExecutionViewModel[];
  outcome: ToolRequestOutcomeViewModel;
}>;

/**
 * Pure presentation mapper for persisted execution attempts. Persisted
 * lifecycle state is authoritative; this function does not consult approvals,
 * the live tool registry, or the database.
 */
export function mapToolExecutions(
  executions: readonly ToolExecution[],
): ToolExecutionMapping {
  const ordered = executions.toSorted(
    (left, right) =>
      left.attemptNumber - right.attemptNumber || left.id.localeCompare(right.id),
  );

  const mapped = ordered.map(mapToolExecution);
  const latest = mapped.at(-1) ?? null;

  return {
    executions: mapped,
    outcome: {
      latestExecutionId: latest?.id ?? null,
      result: latest ? outcomeForStatus(latest.status) : 'NOT_EXECUTED',
      // Produced business records are resolved explicitly by slug/version in
      // Phase 3.7.1D. Never infer record IDs from arbitrary execution output.
      producedRecords: [],
    },
  };
}

export function mapToolExecution(execution: ToolExecution): ToolExecutionViewModel {
  return {
    id: execution.id,
    attemptNumber: execution.attemptNumber,
    status: execution.status,
    output: execution.output,
    error: execution.error,
    createdAt: execution.createdAt.toString(),
    startedAt: execution.startedAt?.toString() ?? null,
    completedAt: execution.completedAt?.toString() ?? null,
    durationMs: durationMs(execution),
    isTerminal: TERMINAL_EXECUTION_STATUSES.has(execution.status),
  };
}

function durationMs(execution: ToolExecution): number | null {
  if (!execution.startedAt || !execution.completedAt) return null;

  return Number(execution.startedAt.until(execution.completedAt).total('milliseconds'));
}

function outcomeForStatus(
  status: ToolExecution['status'],
): ToolRequestOutcomeViewModel['result'] {
  switch (status) {
    case 'QUEUED':
    case 'RUNNING':
      return 'RUNNING';
    case 'SUCCEEDED':
      return 'SUCCEEDED';
    case 'FAILED':
      return 'FAILED';
    case 'CANCELLED':
      return 'CANCELLED';
  }
}
