import Link from "next/link";
import type { OverviewData } from "@/command-center/overview/load";
import { OverviewSection } from "./overview-section";
import { PageHeader } from "./page-header";
import { SummaryMetrics } from "./summary-metrics";

const severityClass: Record<string, string> = {
  critical: "text-red-800 dark:text-red-300",
  warning: "text-amber-800 dark:text-amber-300",
  info: "text-zinc-600 dark:text-zinc-400",
};

export function OverviewView({ data }: { data: OverviewData }) {
  const description =
    data.organization.description?.trim() || "JS Solutions operating state.";

  return (
    <div className="space-y-8">
      <PageHeader
        title={data.organization.name}
        description={description}
        actions={
          <p className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
            {data.organization.status}
          </p>
        }
      />

      <SummaryMetrics metrics={data.metrics} />

      <OverviewSection title="Owner Attention">
        {data.attention.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            No items currently require owner attention. This reflects currently modeled
            business state, not overall business health.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {data.attention.map((item, index) => (
              <li key={`${item.kind}-${item.title}-${index}`}>
                <Link
                  href={item.href}
                  className="block px-4 py-3 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
                >
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {item.title}
                  </p>
                  <p className={`mt-0.5 text-xs font-medium uppercase tracking-wide ${severityClass[item.severity]}`}>
                    {item.kind.replaceAll("_", " ")}
                  </p>
                  {item.description ? (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {item.description}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </OverviewSection>

      <OverviewSection title="Active Goals" href="/app/goals" hrefLabel="Goals">
        {data.goals.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            No active goals have been defined yet.
          </p>
        ) : (
          <RowList
            rows={data.goals.map((goal) => ({
              title: goal.title,
              meta: `${goal.status} · ${goal.priority} · ${goal.timeHorizon}`,
            }))}
          />
        )}
      </OverviewSection>

      <OverviewSection title="Current Work" href="/app/work" hrefLabel="Work">
        {data.work.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            No open work items.
          </p>
        ) : (
          <RowList
            rows={data.work.map((item) => ({
              title: item.title,
              meta: [item.status, item.priority, item.workType, item.dueAtLabel]
                .filter(Boolean)
                .join(" · "),
            }))}
          />
        )}
      </OverviewSection>

      <OverviewSection title="Pending Approvals" href="/app/approvals" hrefLabel="Approvals">
        {data.approvals.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            No pending approvals.
          </p>
        ) : (
          <RowList
            rows={data.approvals.map((approval) => ({
              title: approval.title,
              meta: [approval.riskLevel, approval.actionType, approval.requestedAtLabel]
                .filter(Boolean)
                .join(" · "),
            }))}
          />
        )}
      </OverviewSection>

      <OverviewSection title="Recent Activity" href="/app/activity" hrefLabel="Activity">
        {data.events.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            No business events have been recorded yet.
          </p>
        ) : (
          <RowList
            rows={data.events.map((event) => ({
              title: event.title,
              meta: [event.eventType, event.sourceType, event.occurredAtLabel]
                .filter(Boolean)
                .join(" · "),
              detail: event.description,
            }))}
          />
        )}
      </OverviewSection>

      <OverviewSection title="Configured organizational roles" href="/app/agents" hrefLabel="Agents">
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          AgentDefinition rows are configuration, not operational AI agents.
        </p>
        {data.agents.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            No active AgentDefinitions.
          </p>
        ) : (
          <RowList
            rows={data.agents.map((agent) => ({
              title: agent.name,
              meta: `${agent.role} · ${agent.status} · ${agent.permissionLevel}`,
            }))}
          />
        )}
      </OverviewSection>
    </div>
  );
}

function RowList({
  rows,
}: {
  rows: Array<{ title: string; meta: string; detail?: string | null }>;
}) {
  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
      {rows.map((row) => (
        <li key={`${row.title}-${row.meta}`} className="px-4 py-3">
          <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{row.title}</p>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {row.meta}
          </p>
          {row.detail ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{row.detail}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
