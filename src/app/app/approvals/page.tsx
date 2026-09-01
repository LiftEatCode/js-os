/// <reference types="temporal-polyfill/types/global" />
import type { Metadata } from "next";
import Link from "next/link";
import {
  getJsSolutionsOrganization,
  isPendingPastExpiration,
  listApprovals,
  listWorkItems,
  type Approval,
  type ApprovalRequesterType,
  type ApprovalRiskLevel,
  type ApprovalStatus,
} from "@/business-state";
import {
  APPROVAL_LIST_STATUS_ORDER,
  APPROVAL_REQUESTER_TYPES,
  APPROVAL_RISK_ORDER,
  formatApprovalLabel,
} from "@/command-center/approvals/constants";
import { sortApprovals } from "@/command-center/approvals/ordering";
import {
  parseRequesterFilter,
  parseRiskFilter,
  parseStatusFilter,
} from "@/command-center/approvals/parse";
import { formatBusinessInstant } from "@/command-center/overview/format";
import { isCommandCenterWriteEnabled } from "@/command-center/write-access";
import { PageHeader } from "@/components/command-center/page-header";
import { ReadOnlyNotice } from "@/components/command-center/read-only-notice";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Approvals",
};

type ApprovalSearchParams = {
  status?: string | string[];
  riskLevel?: string | string[];
  requestedByType?: string | string[];
};

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<ApprovalSearchParams>;
}) {
  const params = await searchParams;
  const status = parseStatusFilter(params.status);
  const riskLevel = parseRiskFilter(params.riskLevel);
  const requestedByType = parseRequesterFilter(params.requestedByType);
  const writesEnabled = isCommandCenterWriteEnabled();
  const organization = await getJsSolutionsOrganization();
  const [approvals, workItems] = await Promise.all([
    listApprovals({
      organizationId: organization.id,
      status,
      riskLevel,
      requestedByType,
    }),
    listWorkItems({ organizationId: organization.id }),
  ]);
  const rows = sortApprovals(approvals);
  const workById = new Map(workItems.map((item) => [item.id, item]));
  const now = Temporal.Now.instant();
  const filtered = Boolean(status || riskLevel || requestedByType);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Approvals"
        description="Authorization for proposed actions. Approving a request does not execute it."
        actions={
          writesEnabled ? (
            <Link
              href="/app/approvals/new"
              className="inline-flex items-center rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-100"
            >
              Request Approval
            </Link>
          ) : null
        }
      />

      {writesEnabled ? null : <ReadOnlyNotice />}

      <ApprovalFilters
        status={status}
        riskLevel={riskLevel}
        requestedByType={requestedByType}
      />

      {rows.length === 0 ? (
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {filtered
            ? "No approvals match these filters."
            : writesEnabled
              ? "No approval requests have been recorded yet."
              : "No approval requests have been recorded yet. Creation is unavailable while Command Center writes are disabled."}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
          {rows.map((approval) => (
            <li key={approval.id}>
              <ApprovalListItem
                approval={approval}
                timeZone={organization.timezone}
                now={now}
                workTitle={
                  approval.workItemId
                    ? (workById.get(approval.workItemId)?.title ?? null)
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

function ApprovalFilters({
  status,
  riskLevel,
  requestedByType,
}: {
  status?: ApprovalStatus;
  riskLevel?: ApprovalRiskLevel;
  requestedByType?: ApprovalRequesterType;
}) {
  return (
    <div className="space-y-3">
      <FilterRow
        label="Status"
        current={status}
        items={APPROVAL_LIST_STATUS_ORDER}
        queryKey="status"
        status={status}
        riskLevel={riskLevel}
        requestedByType={requestedByType}
      />
      <FilterRow
        label="Risk"
        current={riskLevel}
        items={APPROVAL_RISK_ORDER}
        queryKey="riskLevel"
        status={status}
        riskLevel={riskLevel}
        requestedByType={requestedByType}
      />
      <FilterRow
        label="Requested by"
        current={requestedByType}
        items={APPROVAL_REQUESTER_TYPES}
        queryKey="requestedByType"
        status={status}
        riskLevel={riskLevel}
        requestedByType={requestedByType}
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
  riskLevel,
  requestedByType,
}: {
  label: string;
  current?: string;
  items: readonly string[];
  queryKey: "status" | "riskLevel" | "requestedByType";
  status?: ApprovalStatus;
  riskLevel?: ApprovalRiskLevel;
  requestedByType?: ApprovalRequesterType;
}) {
  const allHref = approvalFilterHref({ status, riskLevel, requestedByType, [queryKey]: undefined });
  return (
    <nav aria-label={`Filter approvals by ${label.toLowerCase()}`}>
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
              href={approvalFilterHref({
                status,
                riskLevel,
                requestedByType,
                [queryKey]: value,
              })}
              active={current === value}
              label={formatApprovalLabel(value)}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function approvalFilterHref(filters: {
  status?: string;
  riskLevel?: string;
  requestedByType?: string;
}): string {
  const params = new URLSearchParams();
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.riskLevel) {
    params.set("riskLevel", filters.riskLevel);
  }
  if (filters.requestedByType) {
    params.set("requestedByType", filters.requestedByType);
  }
  const query = params.toString();
  return query ? `/app/approvals?${query}` : "/app/approvals";
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

function ApprovalListItem({
  approval,
  timeZone,
  now,
  workTitle,
}: {
  approval: Approval;
  timeZone: string;
  now: Temporal.Instant;
  workTitle: string | null;
}) {
  const pending = approval.status === "PENDING";
  const pastExpiration = isPendingPastExpiration(approval.status, approval.expiresAt, now);
  const requested = formatBusinessInstant(approval.requestedAt, timeZone);

  return (
    <Link
      href={`/app/approvals/${approval.id}`}
      className={`block px-4 py-3 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100 ${pending ? "" : "opacity-80"}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{approval.title}</p>
        {pending ? (
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
            Needs decision
          </p>
        ) : null}
      </div>
      <p className="mt-0.5 text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
        {formatApprovalLabel(approval.status)} · Risk {formatApprovalLabel(approval.riskLevel)} ·{" "}
        {approval.actionType} · {formatApprovalLabel(approval.requestedByType)}
        {workTitle ? ` · ${workTitle}` : ""}
        {requested ? ` · ${requested}` : ""}
        {pastExpiration ? " · Past expiration time" : ""}
      </p>
    </Link>
  );
}
