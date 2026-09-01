/// <reference types="temporal-polyfill/types/global" />
import type {
  Approval,
  ApprovalRequesterType,
  ApprovalRiskLevel,
  ApprovalStatus,
} from '../../business-state/types.ts';
import { isValidActionType } from '../../business-state/validation.ts';
import {
  ACTION_TYPE_MAX_LENGTH,
  APPROVAL_FORM_DEFAULTS,
  APPROVAL_REQUESTER_SET,
  APPROVAL_RISK_SET,
  APPROVAL_STATUS_SET,
  APPROVAL_TITLE_MAX_LENGTH,
} from './constants.ts';

export type ApprovalFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type ParsedApprovalRequest = {
  title: string;
  actionType: string;
  riskLevel: ApprovalRiskLevel;
  description: string | null;
  workItemId: string | null;
  expiresAt: Temporal.Instant | null;
  payload: Approval['payload'];
};

export type ApprovalDecisionKind = 'approve' | 'reject' | 'cancel';

export type ParsedApprovalDecision = {
  approvalId: string;
  decision: ApprovalDecisionKind;
  decisionReason: string | null;
  criticalConfirmed: boolean;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DECISIONS = new Set<string>(['approve', 'reject', 'cancel']);

export function isApprovalUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function parseOptionalUuid(
  raw: string,
): { ok: true; value: string | null } | { ok: false } {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: true, value: null };
  }
  if (!UUID_PATTERN.test(trimmed)) {
    return { ok: false };
  }
  return { ok: true, value: trimmed };
}

function isApprovalStatus(value: string): value is ApprovalStatus {
  return APPROVAL_STATUS_SET.has(value);
}

function isRiskLevel(value: string): value is ApprovalRiskLevel {
  return APPROVAL_RISK_SET.has(value);
}

function isRequesterType(value: string): value is ApprovalRequesterType {
  return APPROVAL_REQUESTER_SET.has(value);
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseStatusFilter(
  value: string | string[] | undefined,
): ApprovalStatus | undefined {
  const raw = firstParam(value);
  return raw && isApprovalStatus(raw) ? raw : undefined;
}

export function parseRiskFilter(
  value: string | string[] | undefined,
): ApprovalRiskLevel | undefined {
  const raw = firstParam(value);
  return raw && isRiskLevel(raw) ? raw : undefined;
}

export function parseRequesterFilter(
  value: string | string[] | undefined,
): ApprovalRequesterType | undefined {
  const raw = firstParam(value);
  return raw && isRequesterType(raw) ? raw : undefined;
}

export function parseExpiresAt(
  raw: string,
  timeZone: string,
): { ok: true; value: Temporal.Instant | null } | { ok: false } {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: true, value: null };
  }
  try {
    const date = Temporal.PlainDate.from(trimmed);
    const zone = timeZone.trim() || 'America/Chicago';
    return {
      ok: true,
      value: date
        .toZonedDateTime({
          timeZone: zone,
          plainTime: Temporal.PlainTime.from('23:59:59.999'),
        })
        .toInstant(),
    };
  } catch {
    return { ok: false };
  }
}

export function parsePayloadJson(
  raw: string,
): { ok: true; value: Approval['payload'] } | { ok: false } {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: true, value: null };
  }
  try {
    return { ok: true, value: JSON.parse(trimmed) as Approval['payload'] };
  } catch {
    return { ok: false };
  }
}

function optionalText(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function isConfirmed(raw: string): boolean {
  return raw === 'on' || raw === 'yes' || raw === 'true';
}

export function parseApprovalRequestForm(
  formData: FormData,
  timeZone: string,
): { ok: true; value: ParsedApprovalRequest } | { ok: false; state: ApprovalFormState } {
  const fieldErrors: Record<string, string> = {};
  const title = field(formData, 'title').trim();
  if (title.length === 0) {
    fieldErrors.title = 'Title is required.';
  } else if (title.length > APPROVAL_TITLE_MAX_LENGTH) {
    fieldErrors.title = 'Title is too long.';
  }

  const actionType = field(formData, 'actionType').trim();
  if (actionType.length === 0) {
    fieldErrors.actionType = 'Action type is required.';
  } else if (!isValidActionType(actionType) || actionType.length > ACTION_TYPE_MAX_LENGTH) {
    fieldErrors.actionType =
      'Action type must use lowercase.dot.notation (for example outreach.send_email).';
  }

  const riskRaw = field(formData, 'riskLevel') || APPROVAL_FORM_DEFAULTS.riskLevel;
  if (!isRiskLevel(riskRaw)) {
    fieldErrors.riskLevel = 'Risk level is invalid.';
  }

  const expiresAt = parseExpiresAt(field(formData, 'expiresAt'), timeZone);
  if (!expiresAt.ok) {
    fieldErrors.expiresAt = 'Expiration date is invalid.';
  }

  const workItemId = parseOptionalUuid(field(formData, 'workItemId'));
  if (!workItemId.ok) {
    fieldErrors.workItemId = 'Work item is invalid.';
  }

  const payload = parsePayloadJson(field(formData, 'payload'));
  if (!payload.ok) {
    fieldErrors.payload = 'Payload must be valid JSON or empty.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    const first = Object.values(fieldErrors)[0];
    return { ok: false, state: { error: first, fieldErrors } };
  }

  return {
    ok: true,
    value: {
      title,
      actionType,
      riskLevel: riskRaw as ApprovalRiskLevel,
      description: optionalText(formData.get('description')),
      workItemId: workItemId.ok ? workItemId.value : null,
      expiresAt: expiresAt.ok ? expiresAt.value : null,
      payload: payload.ok ? payload.value : null,
    },
  };
}

export function parseApprovalDecisionForm(
  formData: FormData,
): { ok: true; value: ParsedApprovalDecision } | { ok: false; state: ApprovalFormState } {
  const fieldErrors: Record<string, string> = {};
  const approvalId = field(formData, 'approvalId').trim();
  if (!isApprovalUuid(approvalId)) {
    fieldErrors.approvalId = 'Approval is invalid.';
  }

  const decisionRaw = field(formData, 'decision');
  if (!DECISIONS.has(decisionRaw)) {
    fieldErrors.decision = 'Decision is invalid.';
  }

  const decisionReason = optionalText(formData.get('decisionReason'));
  if (decisionRaw === 'reject' && !decisionReason) {
    fieldErrors.decisionReason = 'A reason is required when rejecting an approval.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    const first = Object.values(fieldErrors)[0];
    return { ok: false, state: { error: first, fieldErrors } };
  }

  return {
    ok: true,
    value: {
      approvalId,
      decision: decisionRaw as ApprovalDecisionKind,
      decisionReason,
      criticalConfirmed: isConfirmed(field(formData, 'criticalConfirmation')),
    },
  };
}
