import type {
  WorkItemPriority,
  WorkItemStatus,
  WorkType,
} from '../../business-state/types.ts';

export const WORK_STATUSES = [
  'BACKLOG',
  'READY',
  'IN_PROGRESS',
  'BLOCKED',
  'WAITING_APPROVAL',
  'COMPLETED',
  'CANCELLED',
] as const satisfies readonly WorkItemStatus[];

export const WORK_LIST_STATUS_ORDER = [
  'IN_PROGRESS',
  'BLOCKED',
  'WAITING_APPROVAL',
  'READY',
  'BACKLOG',
  'COMPLETED',
  'CANCELLED',
] as const satisfies readonly WorkItemStatus[];

export const WORK_PRIORITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const satisfies readonly WorkItemPriority[];

export const WORK_PRIORITY_ORDER = [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
] as const satisfies readonly WorkItemPriority[];

export const WORK_TYPES = [
  'TASK',
  'REVIEW',
  'RESEARCH',
  'CONTENT',
  'OUTREACH',
  'ENGINEERING',
  'CLIENT_WORK',
  'ADMIN',
  'DECISION',
] as const satisfies readonly WorkType[];

export const WORK_FORM_DEFAULTS = {
  status: 'BACKLOG',
  priority: 'MEDIUM',
  workType: 'TASK',
} as const;

export const WORK_STATUS_SET = new Set<string>(WORK_STATUSES);
export const WORK_PRIORITY_SET = new Set<string>(WORK_PRIORITIES);
export const WORK_TYPE_SET = new Set<string>(WORK_TYPES);

export function formatWorkLabel(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}
