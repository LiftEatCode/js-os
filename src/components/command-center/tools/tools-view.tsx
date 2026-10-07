import Link from "next/link";
import { formatToolInstant } from "@/command-center/tools/format";
import {
  TOOL_REQUEST_LIST_STATUS_ORDER,
  formatToolLabel,
} from "@/command-center/tools/constants";
import {
  TOOLS_DASHBOARD_COPY,
  presentToolsDashboard,
} from "@/command-center/tools/present-tools-dashboard";
import type { ToolsDashboardViewModel } from "@/command-center/tools/tools-dashboard-view-model";
import { PageHeader } from "@/components/command-center/page-header";

const linkClassName =
  "underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100";

export function ToolsView({ dashboard }: { dashboard: ToolsDashboardViewModel }) {
  const presented = presentToolsDashboard(dashboard);
  const timeZone = dashboard.organization.timezone;

  return (
    <div className="space-y-8">
      <PageHeader title="Tools" description={presented.description} />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Registered tools" value={presented.summary.registeredTools} href="/app/tools" />
        <SummaryCard label="Recent requests" value={presented.summary.recentRequests} href="/app/tools" />
        <SummaryCard
          label="Waiting approval"
          value={presented.summary.waitingApproval}
          href={toolsHref({ status: "WAITING_APPROVAL", toolSlug: dashboard.filters.toolSlug })}
        />
        <SummaryCard
          label="Ready"
          value={presented.summary.ready}
          href={toolsHref({ status: "READY", toolSlug: dashboard.filters.toolSlug })}
        />
        <SummaryCard label="Running executions" value={presented.summary.runningExecutions} href="/app/tools" />
        <SummaryCard
          label="Fulfilled"
          value={presented.summary.fulfilled}
          href={toolsHref({ status: "FULFILLED", toolSlug: dashboard.filters.toolSlug })}
        />
        <SummaryCard
          label="Failed"
          value={presented.summary.failed}
          href={toolsHref({ status: "FAILED", toolSlug: dashboard.filters.toolSlug })}
        />
        <SummaryCard
          label="Denied"
          value={presented.summary.denied}
          href={toolsHref({ status: "DENIED", toolSlug: dashboard.filters.toolSlug })}
        />
      </dl>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Registered tools
        </h2>
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{presented.actorNote}</p>
        {presented.emptyRegisteredTools ? (
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {presented.emptyRegisteredTools}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {dashboard.registeredTools.map((tool) => (
              <li key={tool.slug} className="px-4 py-3">
                <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{tool.name}</p>
                <p className="mt-0.5 text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
                  {tool.slug} · v{tool.version} · {tool.enabled ? "Enabled" : "Disabled"} ·{" "}
                  {formatToolLabel(tool.requiredPermission)} · Approval{" "}
                  {formatToolLabel(tool.approvalRequirement)} · Risk {formatToolLabel(tool.riskLevel)}
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {tool.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          ToolRequest activity
        </h2>
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {TOOLS_DASHBOARD_COPY.approvalIsNotExecution}
        </p>
        <ToolFilters
          status={dashboard.filters.status}
          toolSlug={dashboard.filters.toolSlug}
          slugs={dashboard.registeredTools.map((tool) => tool.slug)}
        />
        {presented.emptyRequests ? (
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{presented.emptyRequests}</p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {dashboard.requests.map((request) => {
              const waiting = request.status === "WAITING_APPROVAL";
              return (
                <li
                  key={request.id}
                  className={waiting ? "bg-amber-50 dark:bg-amber-950/30" : undefined}
                >
                  <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                    <Link
                      href={request.href}
                      className="min-w-0 flex-1 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
                    >
                      <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                        {request.toolName}
                      </p>
                      <p className="mt-0.5 text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
                        {request.toolSlug} · {request.id} · {formatToolLabel(request.status)} ·{" "}
                        {formatToolLabel(request.actorType)}
                        {request.actorId ? ` · ${request.actorId}` : ""} ·{" "}
                        {formatToolInstant(request.requestedAt, timeZone) ?? "—"}
                      </p>
                      <p className="mt-0.5 text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
                        {formatToolLabel(request.requiredPermission)} · Approval{" "}
                        {formatToolLabel(request.approvalRequirement)}
                        {request.latestExecutionStatus
                          ? ` · Latest execution ${formatToolLabel(request.latestExecutionStatus)}`
                          : ""}
                      </p>
                      {request.latestExecutionError ? (
                        <p className="mt-1 break-words text-sm text-red-800 dark:text-red-300">
                          {request.latestExecutionError}
                        </p>
                      ) : null}
                    </Link>
                    {request.approvalHref ? (
                      <Link href={request.approvalHref} className={`shrink-0 text-sm ${linkClassName}`}>
                        Approval
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function ToolFilters({
  status,
  toolSlug,
  slugs,
}: {
  status: ToolsDashboardViewModel["filters"]["status"];
  toolSlug: ToolsDashboardViewModel["filters"]["toolSlug"];
  slugs: readonly string[];
}) {
  return (
    <div className="space-y-3">
      <FilterRow
        label="Status"
        current={status}
        items={TOOL_REQUEST_LIST_STATUS_ORDER}
        queryKey="status"
        status={status}
        toolSlug={toolSlug}
      />
      {slugs.length > 0 ? (
        <FilterRow
          label="Tool"
          current={toolSlug}
          items={slugs}
          queryKey="toolSlug"
          status={status}
          toolSlug={toolSlug}
          formatItem={(value) => value}
        />
      ) : null}
    </div>
  );
}

function FilterRow({
  label,
  current,
  items,
  queryKey,
  status,
  toolSlug,
  formatItem = formatToolLabel,
}: {
  label: string;
  current: string | null;
  items: readonly string[];
  queryKey: "status" | "toolSlug";
  status: ToolsDashboardViewModel["filters"]["status"];
  toolSlug: ToolsDashboardViewModel["filters"]["toolSlug"];
  formatItem?: (value: string) => string;
}) {
  return (
    <nav aria-label={`Filter tools by ${label.toLowerCase()}`}>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <ul className="flex flex-wrap gap-2">
        <li>
          <FilterLink
            href={toolsHref({
              status: queryKey === "status" ? null : status,
              toolSlug: queryKey === "toolSlug" ? null : toolSlug,
            })}
            active={!current}
            label="All"
          />
        </li>
        {items.map((value) => (
          <li key={value}>
            <FilterLink
              href={toolsHref({
                status: queryKey === "status" ? value : status,
                toolSlug: queryKey === "toolSlug" ? value : toolSlug,
              })}
              active={current === value}
              label={formatItem(value)}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function toolsHref(filters: { status?: string | null; toolSlug?: string | null }): string {
  const params = new URLSearchParams();
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.toolSlug) {
    params.set("toolSlug", filters.toolSlug);
  }
  const query = params.toString();
  return query ? `/app/tools?${query}` : "/app/tools";
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

function SummaryCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <div>
      <Link
        href={href}
        className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:focus-visible:outline-zinc-100"
      >
        <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
          {value}
        </dd>
      </Link>
    </div>
  );
}
