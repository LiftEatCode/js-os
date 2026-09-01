import type {
  ApprovalRequesterType,
  ApprovalRiskLevel,
  ApprovalStatus,
} from '../../business-state/types.ts';

export const APPROVAL_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
] as const satisfies readonly ApprovalStatus[];

export const APPROVAL_LIST_STATUS_ORDER = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
] as const satisfies readonly ApprovalStatus[];

export const APPROVAL_RISK_LEVELS = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const satisfies readonly ApprovalRiskLevel[];

export const APPROVAL_RISK_ORDER = [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
] as const satisfies readonly ApprovalRiskLevel[];

export const APPROVAL_REQUESTER_TYPES = [
  'USER',
  'AGENT',
  'SYSTEM',
] as const satisfies readonly ApprovalRequesterType[];

export const APPROVAL_FORM_DEFAULTS = {
  riskLevel: 'MEDIUM',
} as const;

export const APPROVAL_STATUS_SET = new Set<string>(APPROVAL_STATUSES);
export const APPROVAL_RISK_SET = new Set<string>(APPROVAL_RISK_LEVELS);
export const APPROVAL_REQUESTER_SET = new Set<string>(APPROVAL_REQUESTER_TYPES);

export const ACTION_TYPE_MAX_LENGTH = 120;
export const APPROVAL_TITLE_MAX_LENGTH = 200;

export function formatApprovalLabel(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}
