import type { Metadata } from "next";
import Link from "next/link";
import {
  getJsSolutionsOrganization,
  listGoals,
  type Goal,
  type GoalStatus,
} from "@/business-state";
import { GOAL_LIST_STATUS_ORDER } from "@/command-center/goals/constants";
import { sortGoals } from "@/command-center/goals/ordering";
import { parseStatusFilter } from "@/command-center/goals/parse";
import { formatBusinessDate } from "@/command-center/overview/format";
import { isCommandCenterWriteEnabled } from "@/command-center/write-access";
import { GoalMetric } from "@/components/command-center/goals/goal-metric";
import { PageHeader } from "@/components/command-center/page-header";
import { ReadOnlyNotice } from "@/components/command-center/read-only-notice";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Goals",
};

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const params = await searchParams;
  const status = parseStatusFilter(params.status);
  const writesEnabled = isCommandCenterWriteEnabled();
  const organization = await getJsSolutionsOrganization();
  const goals = sortGoals(await listGoals({ organizationId: organization.id, status }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Goals"
        description="Strategic objectives JS Solutions is intentionally trying to accomplish."
        actions={
          writesEnabled ? (
            <Link
              href="/app/goals/new"
              className="inline-flex items-center rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-100"
            >
              Create Goal
            </Link>
          ) : null
        }
      />

      {writesEnabled ? null : <ReadOnlyNotice />}

      <StatusFilter current={status} />

      {goals.length === 0 ? (
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {status
            ? `No ${status} goals.`
            : writesEnabled
              ? "No goals have been defined yet."
              : "No goals have been defined yet. Creation is unavailable while Command Center writes are disabled."}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
          {goals.map((goal) => (
            <li key={goal.id}>
              <GoalListItem goal={goal} timeZone={organization.timezone} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusFilter({ current }: { current: GoalStatus | undefined }) {
  const items: Array<{ label: string; href: string; status?: GoalStatus }> = [
    { label: "All", href: "/app/goals" },
    ...GOAL_LIST_STATUS_ORDER.map((status) => ({
      label: status,
      href: `/app/goals?status=${status}`,
      status,
    })),
  ];

  return (
    <nav aria-label="Filter goals by status">
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = item.status === current || (!item.status && !current);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "inline-flex rounded-md px-2.5 py-1 text-xs font-medium uppercase tracking-wide focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
                  active
                    ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                    : "border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900",
                ].join(" ")}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function GoalListItem({ goal, timeZone }: { goal: Goal; timeZone: string }) {
  const target = formatBusinessDate(goal.targetDate, timeZone);
  const muted = goal.status === "ACHIEVED" || goal.status === "CANCELLED";

  return (
    <Link
      href={`/app/goals/${goal.id}`}
      className={`block px-4 py-3 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100 ${muted ? "opacity-80" : ""}`}
    >
      <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{goal.title}</p>
      <p className="mt-0.5 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {goal.status} · {goal.priority} · {goal.timeHorizon}
        {target ? ` · ${target}` : ""}
      </p>
      <div className="mt-2">
        <GoalMetric
          metricName={goal.metricName}
          metricUnit={goal.metricUnit}
          currentValue={goal.currentValue}
          targetValue={goal.targetValue}
        />
      </div>
    </Link>
  );
}
