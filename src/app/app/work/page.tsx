/// <reference types="temporal-polyfill/types/global" />
import type { Metadata } from "next";
import Link from "next/link";
import {
  getJsSolutionsOrganization,
  listAgentDefinitions,
  listGoals,
  listWorkItems,
  type WorkItem,
  type WorkItemPriority,
  type WorkItemStatus,
  type WorkType,
} from "@/business-state";
import { isOpenWorkItem } from "@/command-center/overview/attention";
import { formatBusinessDate } from "@/command-center/overview/format";
import { isCommandCenterWriteEnabled } from "@/command-center/write-access";
import {
  WORK_LIST_STATUS_ORDER,
  WORK_PRIORITY_ORDER,
  WORK_TYPES,
  formatWorkLabel,
} from "@/command-center/work/constants";
import { sortWorkItems } from "@/command-center/work/ordering";
import {
  parsePriorityFilter,
  parseStatusFilter,
  parseWorkTypeFilter,
} from "@/command-center/work/parse";
import { PageHeader } from "@/components/command-center/page-header";
import { ReadOnlyNotice } from "@/components/command-center/read-only-notice";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Work",
};

type WorkSearchParams = {
  status?: string | string[];
  priority?: string | string[];
  workType?: string | string[];
};

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<WorkSearchParams>;
}) {
  const params = await searchParams;
  const status = parseStatusFilter(params.status);
  const priority = parsePriorityFilter(params.priority);
  const workType = parseWorkTypeFilter(params.workType);
  const writesEnabled = isCommandCenterWriteEnabled();
  const organization = await getJsSolutionsOrganization();
  const [items, goals, agents] = await Promise.all([
    listWorkItems({ organizationId: organization.id, status, priority, workType }),
    listGoals({ organizationId: organization.id }),
    listAgentDefinitions({ organizationId: organization.id }),
  ]);
  const workItems = sortWorkItems(items);
  const goalById = new Map(goals.map((goal) => [goal.id, goal]));
  const agentById = new Map(agents.map((agent) => [agent.id, agent]));
  const now = Temporal.Now.instant();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Work"
        description="What needs to happen to move JS Solutions forward."
        actions={
          writesEnabled ? (
            <Link
              href="/app/work/new"
              className="inline-flex items-center rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-100"
            >
              Create Work Item
            </Link>
          ) : null
        }
      />

      {writesEnabled ? null : <ReadOnlyNotice />}

      <WorkFilters status={status} priority={priority} workType={workType} />

      {workItems.length === 0 ? (
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {status || priority || workType
            ? "No work items match these filters."
            : writesEnabled
              ? "No work items have been defined yet."
              : "No work items have been defined yet. Creation is unavailable while Command Center writes are disabled."}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
          {workItems.map((item) => (
            <li key={item.id}>
              <WorkListItem
                item={item}
                timeZone={organization.timezone}
                now={now}
                goalTitle={item.goalId ? (goalById.get(item.goalId)?.title ?? null) : null}
                agentName={
                  item.assignedAgentId
                    ? (agentById.get(item.assignedAgentId)?.name ?? null)
                    : null
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WorkFilters({
  status,
  priority,
  workType,
}: {
  status?: WorkItemStatus;
  priority?: WorkItemPriority;
  workType?: WorkType;
}) {
  return (
    <div className="space-y-3">
      <FilterRow
        label="Status"
        current={status}
        items={WORK_LIST_STATUS_ORDER}
        queryKey="status"
        status={status}
        priority={priority}
        workType={workType}
      />
      <FilterRow
        label="Priority"
        current={priority}
        items={WORK_PRIORITY_ORDER}
        queryKey="priority"
        status={status}
        priority={priority}
        workType={workType}
      />
      <FilterRow
        label="Work type"
        current={workType}
        items={WORK_TYPES}
        queryKey="workType"
        status={status}
        priority={priority}
        workType={workType}
      />
    </div>
  );
}

function FilterRow({
  label,
  current,
  items,
  queryKey,
  status,
  priority,
  workType,
}: {
  label: string;
  current?: string;
  items: readonly string[];
  queryKey: "status" | "priority" | "workType";
  status?: WorkItemStatus;
  priority?: WorkItemPriority;
  workType?: WorkType;
}) {
  const allHref = workFilterHref({ status, priority, workType, [queryKey]: undefined });
  return (
    <nav aria-label={`Filter work by ${label.toLowerCase()}`}>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <ul className="flex flex-wrap gap-2">
        <li>
          <FilterLink href={allHref} active={!current} label="All" />
        </li>
        {items.map((value) => (
          <li key={value}>
            <FilterLink
              href={workFilterHref({ status, priority, workType, [queryKey]: value })}
              active={current === value}
              label={formatWorkLabel(value)}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function workFilterHref(filters: {
  status?: string;
  priority?: string;
  workType?: string;
}): string {
  const params = new URLSearchParams();
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.priority) {
    params.set("priority", filters.priority);
  }
  if (filters.workType) {
    params.set("workType", filters.workType);
  }
  const query = params.toString();
  return query ? `/app/work?${query}` : "/app/work";
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "inline-flex rounded-md px-2.5 py-1 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
        active
          ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
          : "border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function WorkListItem({
  item,
  timeZone,
  now,
  goalTitle,
  agentName,
}: {
  item: WorkItem;
  timeZone: string;
  now: Temporal.Instant;
  goalTitle: string | null;
  agentName: string | null;
}) {
  const due = formatBusinessDate(item.dueAt, timeZone);
  const overdue = Boolean(
    item.dueAt && isOpenWorkItem(item.status) && Temporal.Instant.compare(item.dueAt, now) < 0,
  );
  const muted = item.status === "COMPLETED" || item.status === "CANCELLED";

  return (
    <Link
      href={`/app/work/${item.id}`}
      className={`block px-4 py-3 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100 ${muted ? "opacity-80" : ""}`}
    >
      <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{item.title}</p>
      <p className="mt-0.5 text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
        {formatWorkLabel(item.status)} · {formatWorkLabel(item.priority)} ·{" "}
        {formatWorkLabel(item.workType)}
        {goalTitle ? ` · ${goalTitle}` : ""}
        {agentName ? ` · ${agentName}` : ""}
        {due ? ` · ${due}` : ""}
        {overdue ? " · Overdue" : ""}
      </p>
    </Link>
  );
}
