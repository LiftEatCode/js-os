import type {
  AgentDefinitionStatus,
  AgentPermissionLevel,
  AgentRole,
} from '../../business-state/types.ts';

export const AGENT_STATUSES = [
  'ACTIVE',
  'PAUSED',
  'DISABLED',
] as const satisfies readonly AgentDefinitionStatus[];

export const AGENT_ROLES = [
  'CEO',
  'SALES',
  'MARKETING',
  'CLIENT_OPERATIONS',
  'ENGINEERING',
  'FINANCE',
  'GENERAL',
] as const satisfies readonly AgentRole[];

export const AGENT_PERMISSION_LEVELS = [
  'OBSERVE',
  'RECOMMEND',
  'PREPARE',
  'EXECUTE',
] as const satisfies readonly AgentPermissionLevel[];

export const AGENT_STATUS_SET = new Set<string>(AGENT_STATUSES);
export const AGENT_ROLE_SET = new Set<string>(AGENT_ROLES);
export const AGENT_PERMISSION_SET = new Set<string>(AGENT_PERMISSION_LEVELS);

export const AGENT_RUN_HISTORY_LIMIT = 20;
export const AGENT_LIST_RUN_SCAN_LIMIT = 200;

export const PERMISSION_CEILING_COPY: Record<AgentPermissionLevel, string> = {
  OBSERVE: 'Can inspect state.',
  RECOMMEND: 'Can reason/recommend within future runtime.',
  PREPARE: 'Can prepare proposed actions/content.',
  EXECUTE:
    'May execute only when tools, policy, and approval rules also allow it. EXECUTE is not unrestricted execution.',
};

export const AGENT_STATUS_COPY: Record<AgentDefinitionStatus, string> = {
  ACTIVE: 'Available for future runtime use.',
  PAUSED: 'Temporarily prevented from participating.',
  DISABLED: 'Administratively disabled.',
};

export function formatAgentLabel(value: string): string {
  return value
    .split('_')
    .map((part) => (part === 'CEO' ? 'CEO' : part.charAt(0) + part.slice(1).toLowerCase()))
    .join(' ');
}
