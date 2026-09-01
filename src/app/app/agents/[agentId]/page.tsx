/// <reference types="temporal-polyfill/types/global" />
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  getAgentDefinitionById,
  getJsSolutionsOrganization,
  listAgentRuns,
} from "@/business-state";
import {
  AGENT_RUN_HISTORY_LIMIT,
  AGENT_STATUS_COPY,
  PERMISSION_CEILING_COPY,
  formatAgentLabel,
} from "@/command-center/agents/constants";
import { isAgentUuid } from "@/command-center/agents/parse";
import { sortAgentRuns } from "@/command-center/agents/ordering";
import { formatBusinessInstant } from "@/command-center/overview/format";
import { isCommandCenterWriteEnabled } from "@/command-center/write-access";
import { AgentPermissionForm } from "@/components/command-center/agents/agent-permission-form";
import { AgentRunList } from "@/components/command-center/agents/agent-run-list";
import { AgentStatusForm } from "@/components/command-center/agents/agent-status-form";
import { PageHeader } from "@/components/command-center/page-header";
import { ReadOnlyNotice } from "@/components/command-center/read-only-notice";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agent",
};

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  if (!isAgentUuid(agentId)) {
    notFound();
  }

  const organization = await getJsSolutionsOrganization();
  const agent = await getAgentDefinitionById(agentId);
  if (!agent || agent.organizationId !== organization.id) {
    notFound();
  }

  const writesEnabled = isCommandCenterWriteEnabled();
  const timeZone = organization.timezone;
  const runs = sortAgentRuns(
    await listAgentRuns({
      organizationId: organization.id,
      agentDefinitionId: agent.id,
      limit: AGENT_RUN_HISTORY_LIMIT,
    }),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={agent.name}
        description={
          agent.description ??
          "Configured organizational role. This is not an operational autonomous agent."
        }
        actions={
          <Link
            href="/app/agents"
            className="text-sm text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 dark:focus-visible:outline-zinc-100"
          >
            Back to Agents
          </Link>
        }
        meta={
          <p>
            {formatAgentLabel(agent.role)} · {formatAgentLabel(agent.status)} · Ceiling{" "}
            {formatAgentLabel(agent.permissionLevel)}
          </p>
        }
      />

      {writesEnabled ? null : <ReadOnlyNotice />}

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Info label="Name" value={agent.name} />
        <Info label="Slug" value={agent.slug} />
        <Info label="Role" value={formatAgentLabel(agent.role)} />
        <Info
          label="Status"
          value={`${formatAgentLabel(agent.status)} — ${AGENT_STATUS_COPY[agent.status]}`}
        />
        <Info
          label="Permission ceiling"
          value={`${formatAgentLabel(agent.permissionLevel)} — ${PERMISSION_CEILING_COPY[agent.permissionLevel]}`}
        />
        <Info label="Created" value={formatBusinessInstant(agent.createdAt, timeZone) ?? "—"} />
        <Info label="Updated" value={formatBusinessInstant(agent.updatedAt, timeZone) ?? "—"} />
      </dl>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Instructions</h2>
        {agent.instructions ? (
          <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            {agent.instructions}
          </p>
        ) : (
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            No instructions recorded. Operating policy remains in version-controlled documentation.
          </p>
        )}
      </section>

      {writesEnabled ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Status</h2>
            <AgentStatusForm agentId={agent.id} currentStatus={agent.status} />
          </section>
          <section className="space-y-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
              Permission ceiling
            </h2>
            <AgentPermissionForm
              agentId={agent.id}
              currentPermissionLevel={agent.permissionLevel}
            />
          </section>
        </div>
      ) : (
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Status and permission controls are unavailable while Command Center writes are disabled.
        </p>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Recent AgentRuns</h2>
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          AgentRun is a historical record of an execution attempt. Input and output snapshots are
          not shown here. There is no run, retry, or start control.
        </p>
        <AgentRunList runs={runs} timeZone={timeZone} />
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-zinc-950 dark:text-zinc-50">{value}</dd>
    </div>
  );
}
