import type { GoalPriority, GoalStatus, GoalTimeHorizon } from '../../business-state/types.ts';

export const GOAL_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'ACHIEVED',
  'CANCELLED',
] as const satisfies readonly GoalStatus[];

export const GOAL_LIST_STATUS_ORDER = [
  'ACTIVE',
  'DRAFT',
  'PAUSED',
  'ACHIEVED',
  'CANCELLED',
] as const satisfies readonly GoalStatus[];

export const GOAL_PRIORITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const satisfies readonly GoalPriority[];

export const GOAL_PRIORITY_ORDER = [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
] as const satisfies readonly GoalPriority[];

export const GOAL_TIME_HORIZONS = [
  'SHORT_TERM',
  'QUARTERLY',
  'ANNUAL',
  'LONG_TERM',
] as const satisfies readonly GoalTimeHorizon[];

export const GOAL_FORM_DEFAULTS = {
  status: 'DRAFT',
  priority: 'MEDIUM',
  timeHorizon: 'QUARTERLY',
} as const;

export const GOAL_STATUS_SET = new Set<string>(GOAL_STATUSES);
export const GOAL_PRIORITY_SET = new Set<string>(GOAL_PRIORITIES);
export const GOAL_TIME_HORIZON_SET = new Set<string>(GOAL_TIME_HORIZONS);

export { formatEnumLabel as formatGoalLabel } from '../format.ts';
