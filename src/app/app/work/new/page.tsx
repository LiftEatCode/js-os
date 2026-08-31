import type { Metadata } from "next";
import Link from "next/link";
import {
  getJsSolutionsOrganization,
  listAgentDefinitions,
  listGoals,
  listWorkItems,
} from "@/business-state";
import { isCommandCenterWriteEnabled } from "@/command-center/write-access";
import { formatWorkLabel } from "@/command-center/work/constants";
import { WorkItemForm } from "@/components/command-center/work/work-item-form";
import { PageHeader } from "@/components/command-center/page-header";
import { ReadOnlyNotice } from "@/components/command-center/read-only-notice";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create Work Item",
};

export default async function NewWorkPage() {
  const writesEnabled = isCommandCenterWriteEnabled();
  const organization = await getJsSolutionsOrganization();
  const [goals, workItems, agents] = writesEnabled
    ? await Promise.all([
        listGoals({ organizationId: organization.id }),
        listWorkItems({ organizationId: organization.id }),
        listAgentDefinitions({ organizationId: organization.id }),
      ])
    : [[], [], []];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Create Work Item"
        description="Define work that needs to happen. Defaults to Backlog until you choose otherwise."
        actions={
          <Link
            href="/app/work"
            className="text-sm text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 dark:focus-visible:outline-zinc-100"
          >
            Back to Work
          </Link>
        }
      />
      {writesEnabled ? (
        <WorkItemForm
          mode="create"
          goals={goals
            .filter((goal) => goal.status !== "CANCELLED")
            .map((goal) => ({
              id: goal.id,
              label: `${goal.title} (${formatWorkLabel(goal.status)})`,
            }))}
          parents={workItems.map((item) => ({
            id: item.id,
            label: `${item.title} (${formatWorkLabel(item.status)})`,
          }))}
          agents={agents.map((agent) => ({
            id: agent.id,
            label: `${agent.name} · ${formatWorkLabel(agent.role)} · ${formatWorkLabel(agent.status)} · ${formatWorkLabel(agent.permissionLevel)}`,
          }))}
        />
      ) : (
        <ReadOnlyNotice />
      )}
    </div>
  );
}
