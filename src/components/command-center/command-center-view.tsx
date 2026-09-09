import type { CommandCenterData } from '@/command-center/command/load';
import { deriveAttentionItems } from '@/command-center/command/attention';

const badge = 'rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300';
const panel = 'rounded-xl border border-slate-800 bg-slate-950/60 p-5';

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-500">{children}</p>;
}

export function CommandCenterView({ data }: { data: CommandCenterData }) {
  const { state, approvals, agents, recentAgentRuns } = data;
  const attention = deriveAttentionItems({ blockedWork: state.blockedWork, approvals, recentAgentRuns });
  const activeAgents = agents.filter((agent) => agent.status === 'ACTIVE').length;
  const goalById = new Map(state.goals.map((goal) => [goal.id, goal.title]));
  const agentById = new Map(agents.map((agent) => [agent.id, agent.name]));
  const generatedAt = state.generatedAt?.toString?.() ?? String(state.generatedAt);

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-3 border-b border-slate-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">JS OS</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-100">Command Center</h1>
          <p className="mt-2 text-sm text-slate-400">{state.organization.name} · {state.organization.status}</p>
        </div>
        <p className="text-xs text-slate-500">State generated {generatedAt}</p>
      </header>

      <section aria-labelledby="health-heading">
        <h2 id="health-heading" className="mb-3 text-sm font-semibold text-slate-300">Business health</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {[
            ['Active Goals', state.summary.activeGoals],
            ['Open Work', state.summary.activeWorkItems],
            ['Blocked', state.summary.blockedWorkItems],
            ['Approvals', approvals.length],
            ['Active Agents', activeAgents],
            ['Recent Runs', recentAgentRuns.length],
          ].map(([label, value]) => (
            <div key={label} className={panel}>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={panel}>
          <h2 className="mb-4 font-semibold text-slate-100">Needs attention</h2>
          {attention.length === 0 ? <Empty>Nothing currently requires attention.</Empty> : (
            <div className="space-y-3">{attention.map((item) => (
              <div key={`${item.type}-${item.id}`} className="rounded-lg border border-slate-800 p-3">
                <p className="font-medium text-slate-200">{item.title}</p>
                <p className="mt-1 text-xs text-amber-300">{item.detail}</p>
              </div>
            ))}</div>
          )}
        </section>

        <section className={panel}>
          <h2 className="mb-4 font-semibold text-slate-100">Active goals</h2>
          {state.goals.length === 0 ? <Empty>No active goals.</Empty> : (
            <div className="space-y-3">{state.goals.map((goal) => (
              <div key={goal.id} className="flex items-start justify-between gap-3 border-b border-slate-900 pb-3 last:border-0">
                <div><p className="text-sm font-medium text-slate-200">{goal.title}</p><p className="mt-1 text-xs text-slate-500">{goal.timeHorizon}</p></div>
                <span className={badge}>{goal.priority}</span>
              </div>
            ))}</div>
          )}
        </section>

        <section className={panel}>
          <h2 className="mb-4 font-semibold text-slate-100">Current work</h2>
          {state.activeWork.length === 0 ? <Empty>No open work.</Empty> : (
            <div className="space-y-3">{state.activeWork.map((item) => (
              <div key={item.id} className="border-b border-slate-900 pb-3 last:border-0">
                <div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-slate-200">{item.title}</p><span className={badge}>{item.status}</span></div>
                {item.goalId && goalById.get(item.goalId) ? <p className="mt-1 text-xs text-slate-500">Goal: {goalById.get(item.goalId)}</p> : null}
              </div>
            ))}</div>
          )}
        </section>

        <section className={panel}>
          <h2 className="mb-4 font-semibold text-slate-100">Agent status</h2>
          {agents.length === 0 ? <Empty>No agents configured.</Empty> : (
            <div className="space-y-3">{agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-slate-200">{agent.name}</p><p className="text-xs text-slate-500">{agent.role}</p></div><span className={badge}>{agent.status}</span></div>
            ))}</div>
          )}
        </section>

        <section className={panel}>
          <h2 className="mb-4 font-semibold text-slate-100">Blocked work</h2>
          {state.blockedWork.length === 0 ? <Empty>No blocked work.</Empty> : state.blockedWork.map((item) => <div key={item.id} className="mb-3 rounded-lg border border-amber-900/50 p-3 last:mb-0"><p className="text-sm font-medium text-slate-200">{item.title}</p><p className="mt-1 text-xs text-amber-300">BLOCKED</p></div>)}
        </section>

        <section className={panel}>
          <h2 className="mb-4 font-semibold text-slate-100">Approvals</h2>
          {approvals.length === 0 ? <Empty>No approvals currently require attention.</Empty> : approvals.map((approval) => <div key={approval.id} className="mb-3 border-b border-slate-900 pb-3 last:border-0"><p className="text-sm font-medium text-slate-200">{approval.title}</p><p className="mt-1 text-xs text-slate-500">{approval.actionType} · {approval.riskLevel}</p></div>)}
        </section>
      </div>

      <section className={panel}>
        <h2 className="mb-4 font-semibold text-slate-100">Recent agent runs</h2>
        {recentAgentRuns.length === 0 ? <Empty>No agent runs recorded yet.</Empty> : <div className="space-y-3">{recentAgentRuns.map((run) => <div key={run.id} className="flex items-start justify-between gap-3 border-b border-slate-900 pb-3 last:border-0"><div><p className="text-sm text-slate-200">{agentById.get(run.agentDefinitionId) ?? 'Agent run'}</p>{run.error ? <p className="mt-1 text-xs text-rose-300">{run.error}</p> : null}</div><span className={badge}>{run.status}</span></div>)}</div>}
      </section>

      <section className={panel}>
        <h2 className="mb-4 font-semibold text-slate-100">Recent business activity</h2>
        {state.recentEvents.length === 0 ? <Empty>No recent business activity.</Empty> : <ol className="space-y-4">{state.recentEvents.map((event) => <li key={event.id} className="border-l border-slate-700 pl-4"><p className="text-sm font-medium text-slate-200">{event.title}</p><p className="mt-1 text-xs text-slate-500">{event.eventType} · {event.occurredAt?.toString?.() ?? String(event.occurredAt)}</p>{event.description ? <p className="mt-1 text-sm text-slate-400">{event.description}</p> : null}</li>)}</ol>}
      </section>
    </main>
  );
}
