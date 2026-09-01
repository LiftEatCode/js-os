/// <reference types="temporal-polyfill/types/global" />
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  getAgentDefinitionById,
  getAgentRunById,
  getApprovalById,
  getJsSolutionsOrganization,
  getWorkItemById,
  isPendingPastExpiration,
  isTerminalApprovalStatus,
} from "@/business-state";
import { formatApprovalLabel } from "@/command-center/approvals/constants";
import { isApprovalUuid } from "@/command-center/approvals/parse";
import { formatBusinessInstant } from "@/command-center/overview/format";
import { isCommandCenterWriteEnabled } from "@/command-center/write-access";
import { formatWorkLabel } from "@/command-center/work/constants";
import { ApprovalDecisionForm } from "@/components/command-center/approvals/approval-decision-form";
import { ApprovalPayload } from "@/components/command-center/approvals/approval-payload";
import { PageHeader } from "@/components/command-center/page-header";
import { ReadOnlyNotice } from "@/components/command-center/read-only-notice";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Approval",
};

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ approvalId: string }>;
}) {
  const { approvalId } = await params;
  if (!isApprovalUuid(approvalId)) {
    notFound();
  }

  const organization = await getJsSolutionsOrganization();
  const approval = await getApprovalById(approvalId);
  if (!approval || approval.organizationId !== organization.id) {
    notFound();
  }

  const writesEnabled = isCommandCenterWriteEnabled();
  const timeZone = organization.timezone;
  const now = Temporal.Now.instant();
  const pastExpiration = isPendingPastExpiration(approval.status, approval.expiresAt, now);
  const terminal = isTerminalApprovalStatus(approval.status);

  const [workItem, agentRun] = await Promise.all([
    approval.workItemId ? getWorkItemById(approval.workItemId) : Promise.resolve(null),
    approval.agentRunId ? getAgentRunById(approval.agentRunId) : Promise.resolve(null),
  ]);
  const relatedWork =
    workItem && workItem.organizationId === organization.id ? workItem : null;
  const relatedRun =
    agentRun && agentRun.organizationId === organization.id ? agentRun : null;
  const agentDefinition = relatedRun
    ? await getAgentDefinitionById(relatedRun.agentDefinitionId)
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title={approval.title}
        description={
          approval.description ?? "Authorization for a proposed action. Approval is not execution."
        }
        actions={
          <Link
            href="/app/approvals"
            className="text-sm text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 dark:focus-visible:outline-zinc-100"
          >
            Back to Approvals
          </Link>
        }
        meta={
          <p>
            {formatApprovalLabel(approval.status)} · Risk {formatApprovalLabel(approval.riskLevel)}
            {pastExpiration ? " · Past expiration time" : ""}
          </p>
        }
      />

      {writesEnabled ? null : <ReadOnlyNotice />}

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Info label="Action type" value={approval.actionType} />
        <Info label="Status" value={formatApprovalLabel(approval.status)} />
        <Info label="Risk" value={formatApprovalLabel(approval.riskLevel)} />
        <Info label="Requested by" value={formatApprovalLabel(approval.requestedByType)} />
        <Info label="Requester ID" value={approval.requestedById ?? "None"} />
        <Info
          label="Requested"
          value={formatBusinessInstant(approval.requestedAt, timeZone) ?? "—"}
        />
        <Info
          label="Expires"
          value={
            approval.expiresAt
              ? `${formatBusinessInstant(approval.expiresAt, timeZone) ?? "—"}${
                  pastExpiration ? " · Past expiration time" : ""
                }`
              : "None"
          }
        />
        <Info
          label="Decided"
          value={
            approval.decidedAt
              ? (formatBusinessInstant(approval.decidedAt, timeZone) ?? "—")
              : "Not decided"
          }
        />
        <Info label="Decision reason" value={approval.decisionReason ?? "None"} />
        <Info
          label="Related work item"
          value={
            relatedWork ? (
              <Link
                href={`/app/work/${relatedWork.id}`}
                className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
              >
                {relatedWork.title} ({formatWorkLabel(relatedWork.status)} ·{" "}
                {formatWorkLabel(relatedWork.priority)})
              </Link>
            ) : (
              "None"
            )
          }
        />
        <Info
          label="Related Agent Run"
          value={
            relatedRun ? (
              agentDefinition ? (
                <Link
                  href={`/app/agents/${agentDefinition.id}`}
                  className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
                >
                  {[
                    agentDefinition.name,
                    formatWorkLabel(relatedRun.status),
                    formatWorkLabel(relatedRun.triggerType),
                    relatedRun.startedAt
                      ? formatBusinessInstant(relatedRun.startedAt, timeZone)
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Link>
              ) : (
                [
                  "Configured role",
                  formatWorkLabel(relatedRun.status),
                  formatWorkLabel(relatedRun.triggerType),
                  relatedRun.startedAt
                    ? formatBusinessInstant(relatedRun.startedAt, timeZone)
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              )
            ) : (
              "None"
            )
          }
        />
      </dl>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Payload</h2>
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          The payload describes the proposed action. It is not executed when this request is
          approved.
        </p>
        <ApprovalPayload payload={approval.payload} />
      </section>

      {approval.status === "PENDING" && writesEnabled ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Decision</h2>
          <ApprovalDecisionForm
            approvalId={approval.id}
            title={approval.title}
            riskLevel={approval.riskLevel}
          />
        </section>
      ) : null}

      {approval.status === "PENDING" && !writesEnabled ? (
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Decision controls are unavailable while Command Center writes are disabled.
        </p>
      ) : null}

      {terminal ? (
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          This request is closed. Proposal fields stay as originally recorded; a new Approval is
          required for a different action.
        </p>
      ) : null}
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
