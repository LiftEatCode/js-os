import type {
  AgentDefinitionStatus,
  AgentPermissionLevel,
  AgentRole,
} from '../../business-state/types.ts';
import {
  AGENT_PERMISSION_SET,
  AGENT_ROLE_SET,
  AGENT_STATUS_SET,
} from './constants.ts';

export type AgentFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isAgentUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function isStatus(value: string): value is AgentDefinitionStatus {
  return AGENT_STATUS_SET.has(value);
}

function isRole(value: string): value is AgentRole {
  return AGENT_ROLE_SET.has(value);
}

function isPermission(value: string): value is AgentPermissionLevel {
  return AGENT_PERMISSION_SET.has(value);
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseStatusFilter(
  value: string | string[] | undefined,
): AgentDefinitionStatus | undefined {
  const raw = firstParam(value);
  return raw && isStatus(raw) ? raw : undefined;
}

export function parseRoleFilter(value: string | string[] | undefined): AgentRole | undefined {
  const raw = firstParam(value);
  return raw && isRole(raw) ? raw : undefined;
}

export function parsePermissionFilter(
  value: string | string[] | undefined,
): AgentPermissionLevel | undefined {
  const raw = firstParam(value);
  return raw && isPermission(raw) ? raw : undefined;
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

function isConfirmed(raw: string): boolean {
  return raw === 'on' || raw === 'yes' || raw === 'true';
}

export type ParsedAgentStatus = {
  agentId: string;
  status: AgentDefinitionStatus;
};

export type ParsedAgentPermission = {
  agentId: string;
  permissionLevel: AgentPermissionLevel;
  executeConfirmed: boolean;
};

export function parseAgentStatusForm(
  formData: FormData,
): { ok: true; value: ParsedAgentStatus } | { ok: false; state: AgentFormState } {
  const fieldErrors: Record<string, string> = {};
  const agentId = field(formData, 'agentId').trim();
  if (!isAgentUuid(agentId)) {
    fieldErrors.agentId = 'Agent is invalid.';
  }

  const statusRaw = field(formData, 'status');
  if (!isStatus(statusRaw)) {
    fieldErrors.status = 'Status is invalid.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    const first = Object.values(fieldErrors)[0];
    return { ok: false, state: { error: first, fieldErrors } };
  }

  return {
    ok: true,
    value: {
      agentId,
      status: statusRaw as AgentDefinitionStatus,
    },
  };
}

export function parseAgentPermissionForm(
  formData: FormData,
): { ok: true; value: ParsedAgentPermission } | { ok: false; state: AgentFormState } {
  const fieldErrors: Record<string, string> = {};
  const agentId = field(formData, 'agentId').trim();
  if (!isAgentUuid(agentId)) {
    fieldErrors.agentId = 'Agent is invalid.';
  }

  const permissionRaw = field(formData, 'permissionLevel');
  if (!isPermission(permissionRaw)) {
    fieldErrors.permissionLevel = 'Permission level is invalid.';
  }

  const executeConfirmed = isConfirmed(field(formData, 'executeConfirmation'));
  if (permissionRaw === 'EXECUTE' && !executeConfirmed) {
    fieldErrors.executeConfirmation =
      'Confirm that EXECUTE is a ceiling and does not bypass tool, policy, or approval controls.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    const first = Object.values(fieldErrors)[0];
    return { ok: false, state: { error: first, fieldErrors } };
  }

  return {
    ok: true,
    value: {
      agentId,
      permissionLevel: permissionRaw as AgentPermissionLevel,
      executeConfirmed,
    },
  };
}
