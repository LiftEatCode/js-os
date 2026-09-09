import type { AgentRun, Approval, BusinessStateWorkItem } from '@/business-state';

export type AttentionItem = {
  id: string;
  type: 'blocked-work' | 'approval' | 'failed-agent-run';
  title: string;
  detail: string;
};

export function deriveAttentionItems(input: {
  blockedWork: BusinessStateWorkItem[];
  approvals: Approval[];
  recentAgentRuns: AgentRun[];
}): AttentionItem[] {
  return [
    ...input.blockedWork.map((item) => ({
      id: item.id,
      type: 'blocked-work' as const,
      title: item.title,
      detail: 'Blocked work',
    })),
    ...input.approvals.map((approval) => ({
      id: approval.id,
      type: 'approval' as const,
      title: approval.title,
      detail: `Pending approval · ${approval.riskLevel} risk`,
    })),
    ...input.recentAgentRuns
      .filter((run) => run.status === 'FAILED')
      .map((run) => ({
        id: run.id,
        type: 'failed-agent-run' as const,
        title: 'Agent run failed',
        detail: run.error ?? 'Review the failed run.',
      })),
  ];
}
