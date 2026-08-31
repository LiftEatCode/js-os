/// <reference types="temporal-polyfill/types/global" />
import type {
  WorkItem,
  WorkItemPriority,
  WorkItemStatus,
  WorkType,
} from '../../business-state/types.ts';
import {
  WORK_FORM_DEFAULTS,
  WORK_PRIORITY_SET,
  WORK_STATUS_SET,
  WORK_TYPE_SET,
} from './constants.ts';

export type WorkFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type ParsedWorkFields = {
  title: string;
  description: string | null;
  status: WorkItemStatus;
  priority: WorkItemPriority;
  workType: WorkType;
  goalId: string | null;
  parentId: string | null;
  assignedAgentId: string | null;
  dueAt: Temporal.Instant | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isWorkUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function parseOptionalUuid(
  raw: string,
): { ok: true; value: string | null } | { ok: false } {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: true, value: null };
  }
  if (!isWorkUuid(trimmed)) {
    return { ok: false };
  }
  return { ok: true, value: trimmed };
}

function isWorkStatus(value: string): value is WorkItemStatus {
  return WORK_STATUS_SET.has(value);
}

function isWorkPriority(value: string): value is WorkItemPriority {
  return WORK_PRIORITY_SET.has(value);
}

function isWorkType(value: string): value is WorkType {
  return WORK_TYPE_SET.has(value);
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseStatusFilter(value: string | string[] | undefined): WorkItemStatus | undefined {
  const raw = firstParam(value);
  return raw && isWorkStatus(raw) ? raw : undefined;
}

export function parsePriorityFilter(
  value: string | string[] | undefined,
): WorkItemPriority | undefined {
  const raw = firstParam(value);
  return raw && isWorkPriority(raw) ? raw : undefined;
}

export function parseWorkTypeFilter(value: string | string[] | undefined): WorkType | undefined {
  const raw = firstParam(value);
  return raw && isWorkType(raw) ? raw : undefined;
}

export function parseDueAt(
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
  value: WorkItem['dueAt'] | null | undefined,
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

export function parseWorkForm(
  formData: FormData,
  timeZone: string,
): { ok: true; value: ParsedWorkFields } | { ok: false; state: WorkFormState } {
  const fieldErrors: Record<string, string> = {};
  const title = field(formData, 'title').trim();
  if (title.length === 0) {
    fieldErrors.title = 'Title is required.';
  }

  const statusRaw = field(formData, 'status') || WORK_FORM_DEFAULTS.status;
  const priorityRaw = field(formData, 'priority') || WORK_FORM_DEFAULTS.priority;
  const workTypeRaw = field(formData, 'workType') || WORK_FORM_DEFAULTS.workType;

  if (!WORK_STATUS_SET.has(statusRaw)) {
    fieldErrors.status = 'Status is invalid.';
  }
  if (!WORK_PRIORITY_SET.has(priorityRaw)) {
    fieldErrors.priority = 'Priority is invalid.';
  }
  if (!WORK_TYPE_SET.has(workTypeRaw)) {
    fieldErrors.workType = 'Work type is invalid.';
  }

  const dueAt = parseDueAt(field(formData, 'dueAt'), timeZone);
  if (!dueAt.ok) {
    fieldErrors.dueAt = 'Due date is invalid.';
  }

  const goalId = parseOptionalUuid(field(formData, 'goalId'));
  if (!goalId.ok) {
    fieldErrors.goalId = 'Goal is invalid.';
  }

  const parentId = parseOptionalUuid(field(formData, 'parentId'));
  if (!parentId.ok) {
    fieldErrors.parentId = 'Parent work item is invalid.';
  }

  const assignedAgentId = parseOptionalUuid(field(formData, 'assignedAgentId'));
  if (!assignedAgentId.ok) {
    fieldErrors.assignedAgentId = 'Assigned role is invalid.';
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
      status: statusRaw as WorkItemStatus,
      priority: priorityRaw as WorkItemPriority,
      workType: workTypeRaw as WorkType,
      goalId: goalId.ok ? goalId.value : null,
      parentId: parentId.ok ? parentId.value : null,
      assignedAgentId: assignedAgentId.ok ? assignedAgentId.value : null,
      dueAt: dueAt.ok ? dueAt.value : null,
    },
  };
}
