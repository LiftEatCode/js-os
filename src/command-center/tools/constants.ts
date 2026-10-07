import { formatEnumLabel } from '../format.ts';

export function workItemHref(id: string): string {
  return `/app/work/${id}`;
}

export function approvalHref(id: string): string {
  return `/app/approvals/${id}`;
}

export function agentHref(id: string): string {
  return `/app/agents/${id}`;
}

export function toolRequestHref(id: string): string {
  return `/app/tools/requests/${id}`;
}

export function formatToolLabel(value: string): string {
  return formatEnumLabel(value);
}
