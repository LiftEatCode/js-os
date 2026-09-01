import type { AgentRun } from "@/business-state";
import { formatAgentLabel } from "@/command-center/agents/constants";
import { formatBusinessInstant } from "@/command-center/overview/format";

export function AgentRunList({
  runs,
  timeZone,
}: {
  runs: AgentRun[];
  timeZone: string;
}) {
  if (runs.length === 0) {
    return (
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        No AgentRuns have been recorded for this role. AgentRun is historical audit, not a
        runtime console. This page does not start runs.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
      {runs.map((run) => {
        const failed = run.status === "FAILED";
        return (
          <li
            key={run.id}
            className={`px-4 py-3 ${failed ? "bg-red-50 dark:bg-red-950/30" : ""}`}
          >
            <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
              {formatAgentLabel(run.status)}
              {failed ? " · Failed" : ""}
            </p>
            <p className="mt-0.5 text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
              {formatAgentLabel(run.triggerType)}
              {run.triggerReference ? ` · ${run.triggerReference}` : ""}
              {` · Started ${formatBusinessInstant(run.startedAt, timeZone) ?? "—"}`}
              {run.completedAt
                ? ` · Completed ${formatBusinessInstant(run.completedAt, timeZone) ?? "—"}`
                : ""}
            </p>
            {failed && run.error ? (
              <p className="mt-1 break-words text-sm text-red-800 dark:text-red-300">{run.error}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
