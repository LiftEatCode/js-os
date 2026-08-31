import { InvalidBusinessStateInputError, InvalidBusinessStateTransitionError } from './errors.ts';
import type { AgentRunStatus, ApprovalStatus } from './types.ts';

const EVENT_TYPE_PATTERN = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/;

export function requireNonEmptyString(value: string, field: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new InvalidBusinessStateInputError(`${field} must be a non-empty string.`);
  }
  return trimmed;
}

export function isValidEventType(eventType: string): boolean {
  return EVENT_TYPE_PATTERN.test(eventType);
}

export function requireEventType(eventType: string): string {
  const trimmed = requireNonEmptyString(eventType, 'eventType');
  if (!isValidEventType(trimmed)) {
    throw new InvalidBusinessStateInputError(
      'eventType must use lowercase.dot.notation (for example lead.created).',
    );
  }
  return trimmed;
}

export function omitUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(input) as Array<keyof T>) {
    if (input[key] !== undefined) {
      result[key] = input[key];
    }
  }
  return result;
}

export function clampListLimit(limit: number | undefined, fallback = 50, max = 200): number {
  if (limit === undefined) {
    return fallback;
  }
  if (!Number.isInteger(limit) || limit < 1) {
    throw new InvalidBusinessStateInputError('limit must be a positive integer.');
  }
  return Math.min(limit, max);
}

export function assertApprovalCanDecide(status: ApprovalStatus): void {
  if (status !== 'PENDING') {
    throw new InvalidBusinessStateTransitionError(
      `Approval cannot be decided from status ${status}; expected PENDING.`,
    );
  }
}

export function assertApprovalCanCancel(status: ApprovalStatus): void {
  if (status !== 'PENDING') {
    throw new InvalidBusinessStateTransitionError(
      `Approval cannot be cancelled from status ${status}; expected PENDING.`,
    );
  }
}

export function assertAgentRunCanStart(status: AgentRunStatus): void {
  if (status !== 'QUEUED') {
    throw new InvalidBusinessStateTransitionError(
      `AgentRun cannot enter RUNNING from ${status}; expected QUEUED.`,
    );
  }
}

export function assertAgentRunCanFinish(
  status: AgentRunStatus,
  next: 'COMPLETED' | 'FAILED',
): void {
  if (status !== 'RUNNING') {
    throw new InvalidBusinessStateTransitionError(
      `AgentRun cannot enter ${next} from ${status}; expected RUNNING.`,
    );
  }
}

export function assertAgentRunCanCancel(status: AgentRunStatus): void {
  if (status !== 'QUEUED' && status !== 'RUNNING') {
    throw new InvalidBusinessStateTransitionError(
      `AgentRun cannot be cancelled from ${status}; expected QUEUED or RUNNING.`,
    );
  }
}
