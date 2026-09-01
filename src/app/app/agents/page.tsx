/// <reference types="temporal-polyfill/types/global" />
import type { Metadata } from "next";
import Link from "next/link";
import {
  getJsSolutionsOrganization,
  listAgentDefinitions,
  listAgentRuns,
  type AgentDefinition,
  type AgentDefinitionStatus,
  type AgentPermissionLevel,
  type AgentRole,
  type AgentRun,
} from "@/business-state";
import {
  AGENT_LIST_RUN_SCAN_LIMIT,
  AGENT_PERMISSION_LEVELS,
  AGENT_ROLES,
  AGENT_STATUSES,
  formatAgentLabel,
} from "@/command-center/agents/constants";
import { latestRunByAgent, sortAgents } from "@/command-center/agents/ordering";
import {
  parsePermissionFilter,
  parseRoleFilter,
  parseStatusFilter,
} from "@/command-center/agents/parse";
import { formatBusinessInstant } from "@/command-center/overview/format";
import { isCommandCenterWriteEnabled } from "@/command-center/write-access";
import { PageHeader } from "@/components/command-center/page-header";
import { ReadOnlyNotice } from "@/components/command-center/read-only-notice";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agents",
};

type AgentSearchParams = {
  status?: string | string[];
  role?: string | string[];
  permissionLevel?: string | string[];
};

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<AgentSearchParams>;
}) {
  const params = await searchParams;
  const status = parseStatusFilter(params.status);
  const role = parseRoleFilter(params.role);
  const permissionLevel = parsePermissionFilter(params.permissionLevel);
  const writesEnabled = isCommandCenterWriteEnabled();
  const organization = await getJsSolutionsOrganization();
  const [definitions, runs] = await Promise.all([
    listAgentDefinitions({ organizationId: organization.id }),
    listAgentRuns({ organizationId: organization.id, limit: AGENT_LIST_RUN_SCAN_LIMIT }),
  ]);
  const agents = sortAgents(
    definitions.filter((agent) => {
      if (status && agent.status !== status) {
        return false;
      }
      if (role && agent.role !== role) {
        return false;
      }
      if (permissionLevel && agent.permissionLevel !== permissionLevel) {
        return false;
      }
      return true;
    }),
  );
  const latestRun = latestRunByAgent(runs);
  const filtered = Boolean(status || role || permissionLevel);
  const failedRecent = runs.filter((run) => run.status === "FAILED").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agents"
        description="Configured organizational roles. An AgentDefinition is not an operational autonomous agent. This page does not invoke models, run tools, or start AgentRuns."
      />

      {writesEnabled ? null : <ReadOnlyNotice />}

      <dl className="grid gap-3 text-sm sm:grid-cols-5">
        <Summary label="Configured" value={definitions.length} />
        <Summary
          label="Active"
          value={definitions.filter((agent) => agent.status === "ACTIVE").length}
        />
        <Summary
          label="Paused"
          value={definitions.filter((agent) => agent.status === "PAUSED").length}
        />
        <Summary
          label="Disabled"
          value={definitions.filter((agent) => agent.status === "DISABLED").length}
        />
        <Summary label="Recent failed runs" value={failedRecent} />
      </dl>

      <AgentFilters status={status} role={role} permissionLevel={permissionLevel} />

      {agents.length === 0 ? (
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {filtered
            ? "No agents match these filters."
            : "No AgentDefinitions have been configured yet."}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
          {agents.map((agent) => (
            <li key={agent.id}>
              <AgentListItem
                agent={agent}
                lastRun={latestRun.get(agent.id) ?? null}
                timeZone={organization.timezone}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">{value}</dd>
    </div>
  );
}

function AgentFilters({
  status,
  role,
  permissionLevel,
}: {
  status?: AgentDefinitionStatus;
  role?: AgentRole;
  permissionLevel?: AgentPermissionLevel;
}) {
  return (
    <div className="space-y-3">
      <FilterRow
        label="Status"
        current={status}
        items={AGENT_STATUSES}
        queryKey="status"
        status={status}
        role={role}
        permissionLevel={permissionLevel}
      />
      <FilterRow
        label="Role"
        current={role}
        items={AGENT_ROLES}
        queryKey="role"
        status={status}
        role={role}
        permissionLevel={permissionLevel}
      />
      <FilterRow
        label="Permission ceiling"
        current={permissionLevel}
        items={AGENT_PERMISSION_LEVELS}
        queryKey="permissionLevel"
        status={status}
        role={role}
        permissionLevel={permissionLevel}
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
  role,
  permissionLevel,
}: {
  label: string;
  current?: string;
  items: readonly string[];
  queryKey: "status" | "role" | "permissionLevel";
  status?: AgentDefinitionStatus;
  role?: AgentRole;
  permissionLevel?: AgentPermissionLevel;
}) {
  const allHref = agentFilterHref({ status, role, permissionLevel, [queryKey]: undefined });
  return (
    <nav aria-label={`Filter agents by ${label.toLowerCase()}`}>
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
              href={agentFilterHref({ status, role, permissionLevel, [queryKey]: value })}
              active={current === value}
              label={formatAgentLabel(value)}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function agentFilterHref(filters: {
  status?: string;
  role?: string;
  permissionLevel?: string;
}): string {
  const params = new URLSearchParams();
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.role) {
    params.set("role", filters.role);
  }
  if (filters.permissionLevel) {
    params.set("permissionLevel", filters.permissionLevel);
  }
  const query = params.toString();
  return query ? `/app/agents?${query}` : "/app/agents";
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

function AgentListItem({
  agent,
  lastRun,
  timeZone,
}: {
  agent: AgentDefinition;
  lastRun: AgentRun | null;
  timeZone: string;
}) {
  const inactive = agent.status !== "ACTIVE";
  const lastRunLabel = lastRun
    ? `${formatAgentLabel(lastRun.status)} · ${formatBusinessInstant(lastRun.startedAt, timeZone) ?? "—"}`
    : "No runs recorded";

  return (
    <Link
      href={`/app/agents/${agent.id}`}
      className={`block px-4 py-3 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100 ${inactive ? "opacity-80" : ""}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{agent.name}</p>
        {inactive ? (
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
            {formatAgentLabel(agent.status)}
          </p>
        ) : null}
      </div>
      <p className="mt-0.5 text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
        {formatAgentLabel(agent.role)} · {formatAgentLabel(agent.status)} · Ceiling{" "}
        {formatAgentLabel(agent.permissionLevel)}
        {agent.description ? ` · ${agent.description}` : ""} · Last run {lastRunLabel}
      </p>
    </Link>
  );
}
