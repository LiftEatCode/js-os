/// <reference types="temporal-polyfill/types/global" />
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  getJsSolutionsOrganization,
  getWorkItemById,
  listAgentDefinitions,
  listGoals,
  listWorkItems,
} from "@/business-state";
import { isOpenWorkItem } from "@/command-center/overview/attention";
import { formatBusinessDate, formatBusinessInstant } from "@/command-center/overview/format";
import { isCommandCenterWriteEnabled } from "@/command-center/write-access";
import { formatWorkLabel } from "@/command-center/work/constants";
import { instantToDateInput, isWorkUuid } from "@/command-center/work/parse";
import { WorkItemForm } from "@/components/command-center/work/work-item-form";
import { PageHeader } from "@/components/command-center/page-header";
import { ReadOnlyNotice } from "@/components/command-center/read-only-notice";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Work Item",
};

export default async function WorkItemDetailPage({
  params,
}: {
  params: Promise<{ workItemId: string }>;
}) {
  const { workItemId } = await params;
  if (!isWorkUuid(workItemId)) {
    notFound();
  }

  const organization = await getJsSolutionsOrganization();
  const workItem = await getWorkItemById(workItemId);
  if (!workItem || workItem.organizationId !== organization.id) {
    notFound();
  }

  const [goals, workItems, agents] = await Promise.all([
    listGoals({ organizationId: organization.id }),
    listWorkItems({ organizationId: organization.id }),
    listAgentDefinitions({ organizationId: organization.id }),
  ]);

  const writesEnabled = isCommandCenterWriteEnabled();
  const timeZone = organization.timezone;
  const now = Temporal.Now.instant();
  const goal = workItem.goalId ? goals.find((row) => row.id === workItem.goalId) : null;
  const parent = workItem.parentId
    ? workItems.find((row) => row.id === workItem.parentId)
    : null;
  const assignee = workItem.assignedAgentId
    ? agents.find((row) => row.id === workItem.assignedAgentId)
    : null;
  const children = workItems.filter((row) => row.parentId === workItem.id);
  const overdue = Boolean(
    workItem.dueAt &&
      isOpenWorkItem(workItem.status) &&
      Temporal.Instant.compare(workItem.dueAt, now) < 0,
  );

  const goalOptions = goals
    .filter((row) => row.status !== "CANCELLED" || row.id === workItem.goalId)
    .map((row) => ({
      id: row.id,
      label: `${row.title} (${formatWorkLabel(row.status)})`,
    }));
  const parentOptions = workItems
    .filter((row) => row.id !== workItem.id)
    .map((row) => ({
      id: row.id,
      label: `${row.title} (${formatWorkLabel(row.status)})`,
    }));
  const agentOptions = agents.map((row) => ({
    id: row.id,
    label: `${row.name} · ${formatWorkLabel(row.role)} · ${formatWorkLabel(row.status)} · ${formatWorkLabel(row.permissionLevel)}`,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title={workItem.title}
        description={workItem.description ?? "Work that needs to happen for JS Solutions."}
        actions={
          <Link
            href="/app/work"
            className="text-sm text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 dark:focus-visible:outline-zinc-100"
          >
            Back to Work
          </Link>
        }
        meta={
          <p>
            {formatWorkLabel(workItem.status)} · {formatWorkLabel(workItem.priority)} ·{" "}
            {formatWorkLabel(workItem.workType)}
            {overdue ? " · Overdue" : ""}
          </p>
        }
      />

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Info
          label="Goal"
          value={
            goal ? (
              <Link
                href={`/app/goals/${goal.id}`}
                className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
              >
                {goal.title} ({formatWorkLabel(goal.status)})
              </Link>
            ) : (
              "None"
            )
          }
        />
        <Info
          label="Parent work item"
          value={
            parent ? (
              <Link
                href={`/app/work/${parent.id}`}
                className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
              >
                {parent.title} ({formatWorkLabel(parent.status)})
              </Link>
            ) : (
              "None"
            )
          }
        />
        <Info
          label="Configured assignee"
          value={
            assignee ? (
              <Link
                href={`/app/agents/${assignee.id}`}
                className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
              >
                {assignee.name} · {formatWorkLabel(assignee.role)} ·{" "}
                {formatWorkLabel(assignee.status)} · {formatWorkLabel(assignee.permissionLevel)}
              </Link>
            ) : (
              "None"
            )
          }
        />
        <Info
          label="Due date"
          value={
            workItem.dueAt
              ? `${formatBusinessDate(workItem.dueAt, timeZone) ?? "—"}${overdue ? " · Overdue" : ""}`
              : "None"
          }
        />
        <Info
          label="Started"
          value={
            workItem.startedAt
              ? (formatBusinessInstant(workItem.startedAt, timeZone) ?? "—")
              : "Not started"
          }
        />
        <Info
          label="Completed"
          value={
            workItem.completedAt
              ? (formatBusinessInstant(workItem.completedAt, timeZone) ?? "—")
              : "Not completed"
          }
        />
        <Info label="Created" value={formatBusinessInstant(workItem.createdAt, timeZone) ?? "—"} />
        <Info label="Updated" value={formatBusinessInstant(workItem.updatedAt, timeZone) ?? "—"} />
        {workItem.sourceType || workItem.sourceId ? (
          <Info
            label="Source"
            value={[workItem.sourceType, workItem.sourceId].filter(Boolean).join(" · ")}
          />
        ) : null}
      </dl>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Child work items
        </h2>
        {children.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No child work items.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/app/work/${child.id}`}
                  className="block px-4 py-3 text-sm hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
                >
                  <p className="font-medium text-zinc-950 dark:text-zinc-50">{child.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {formatWorkLabel(child.status)} · {formatWorkLabel(child.priority)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {writesEnabled ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Edit Work Item
          </h2>
          <WorkItemForm
            mode="edit"
            goals={goalOptions}
            parents={parentOptions}
            agents={agentOptions}
            values={{
              workItemId: workItem.id,
              title: workItem.title,
              description: workItem.description ?? "",
              status: workItem.status,
              priority: workItem.priority,
              workType: workItem.workType,
              goalId: workItem.goalId ?? "",
              parentId: workItem.parentId ?? "",
              assignedAgentId: workItem.assignedAgentId ?? "",
              dueAt: instantToDateInput(workItem.dueAt, timeZone),
            }}
          />
        </section>
      ) : (
        <ReadOnlyNotice />
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-zinc-950 dark:text-zinc-50">{value}</dd>
    </div>
  );
}
