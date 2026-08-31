/// <reference types="temporal-polyfill/types/global" />
import type {
  Goal,
  GoalPriority,
  GoalStatus,
  GoalTimeHorizon,
} from '../../business-state/types.ts';
import {
  GOAL_FORM_DEFAULTS,
  GOAL_PRIORITY_SET,
  GOAL_STATUS_SET,
  GOAL_TIME_HORIZON_SET,
} from './constants.ts';

export type GoalFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type ParsedGoalFields = {
  title: string;
  description: string | null;
  status: GoalStatus;
  priority: GoalPriority;
  timeHorizon: GoalTimeHorizon;
  targetDate: Temporal.Instant | null;
  metricName: string | null;
  metricUnit: string | null;
  targetValue: string | null;
  currentValue: string | null;
};

const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isGoalUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function isGoalStatus(value: string): value is GoalStatus {
  return GOAL_STATUS_SET.has(value);
}

export function parseStatusFilter(value: string | string[] | undefined): GoalStatus | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return undefined;
  }
  return isGoalStatus(raw) ? raw : undefined;
}

export function parseOptionalDecimal(raw: string): { ok: true; value: string | null } | { ok: false } {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: true, value: null };
  }
  if (!DECIMAL_PATTERN.test(trimmed)) {
    return { ok: false };
  }
  return { ok: true, value: trimmed };
}

export function parseTargetDate(
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
      value: date.toZonedDateTime({ timeZone: zone }).toInstant(),
    };
  } catch {
    return { ok: false };
  }
}

export function instantToDateInput(
  value: Goal['targetDate'] | null | undefined,
  timeZone: string,
): string {
  if (!value) {
    return '';
  }
  const zone = timeZone.trim() || 'America/Chicago';
  try {
    return value.toZonedDateTimeISO(zone).toPlainDate().toString();
  } catch {
    return '';
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

export function parseGoalForm(
  formData: FormData,
  timeZone: string,
): { ok: true; value: ParsedGoalFields } | { ok: false; state: GoalFormState } {
  const fieldErrors: Record<string, string> = {};
  const title = field(formData, 'title').trim();
  if (title.length === 0) {
    fieldErrors.title = 'Title is required.';
  }

  const statusRaw = field(formData, 'status') || GOAL_FORM_DEFAULTS.status;
  const priorityRaw = field(formData, 'priority') || GOAL_FORM_DEFAULTS.priority;
  const horizonRaw = field(formData, 'timeHorizon') || GOAL_FORM_DEFAULTS.timeHorizon;

  if (!GOAL_STATUS_SET.has(statusRaw)) {
    fieldErrors.status = 'Status is invalid.';
  }
  if (!GOAL_PRIORITY_SET.has(priorityRaw)) {
    fieldErrors.priority = 'Priority is invalid.';
  }
  if (!GOAL_TIME_HORIZON_SET.has(horizonRaw)) {
    fieldErrors.timeHorizon = 'Time horizon is invalid.';
  }

  const targetDate = parseTargetDate(field(formData, 'targetDate'), timeZone);
  if (!targetDate.ok) {
    fieldErrors.targetDate = 'Target date is invalid.';
  }

  const targetValue = parseOptionalDecimal(field(formData, 'targetValue'));
  if (!targetValue.ok) {
    fieldErrors.targetValue = 'Target value must be a valid number.';
  }

  const currentValue = parseOptionalDecimal(field(formData, 'currentValue'));
  if (!currentValue.ok) {
    fieldErrors.currentValue = 'Current value must be a valid number.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    const first = Object.values(fieldErrors)[0];
    return { ok: false, state: { error: first, fieldErrors } };
  }

  return {
    ok: true,
    value: {
      title,
      description: optionalText(formData.get('description')),
      status: statusRaw as GoalStatus,
      priority: priorityRaw as GoalPriority,
      timeHorizon: horizonRaw as GoalTimeHorizon,
      targetDate: targetDate.ok ? targetDate.value : null,
      metricName: optionalText(formData.get('metricName')),
      metricUnit: optionalText(formData.get('metricUnit')),
      targetValue: targetValue.ok ? targetValue.value : null,
      currentValue: currentValue.ok ? currentValue.value : null,
    },
  };
}

export function parseProgressForm(
  formData: FormData,
): { ok: true; currentValue: string | null } | { ok: false; state: GoalFormState } {
  const currentValue = parseOptionalDecimal(field(formData, 'currentValue'));
  if (!currentValue.ok) {
    return {
      ok: false,
      state: {
        error: 'Current value must be a valid number.',
        fieldErrors: { currentValue: 'Current value must be a valid number.' },
      },
    };
  }
  return { ok: true, currentValue: currentValue.value };
}
