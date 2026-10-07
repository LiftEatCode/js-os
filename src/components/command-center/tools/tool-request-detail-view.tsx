import Link from "next/link";
import type { ReactNode } from "react";
import { formatSourceType } from "@/command-center/activity/constants";
import { formatApprovalLabel } from "@/command-center/approvals/constants";
import { formatToolInstant, formatReadOnlyJson } from "@/command-center/tools/format";
import {
  presentToolRequestDetail,
  TOOL_REQUEST_DETAIL_COPY,
} from "@/command-center/tools/present-tool-request-detail";
import { formatToolLabel } from "@/command-center/tools/constants";
import type { ToolRequestDetailViewModel } from "@/command-center/tools/tool-request-detail-view-model";
import { PageHeader } from "@/components/command-center/page-header";

const linkClassName =
  "underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100";

export function ToolRequestDetailView({ detail }: { detail: ToolRequestDetailViewModel }) {
  const presented = presentToolRequestDetail(detail);
  const timeZone = detail.organization.timezone;

  return (
    <div className="space-y-8">
      <PageHeader
        title={presented.title}
        description={presented.description}
        meta={
          <p>
            {presented.toolSlug} · {presented.statusLabel} · {presented.actorTypeLabel}
          </p>
        }
      />

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Info label="Tool" value={presented.toolSlug} />
        <Info label="ToolRequest ID" value={presented.requestId} />
        <Info label="Status" value={presented.statusLabel} />
        <Info label="Requested" value={presented.requestedAt} />
        <Info label="Actor type" value={presented.actorTypeLabel} />
        <Info label="Actor" value={presented.actorLabel} />
      </dl>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Request
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Info label="Tool slug" value={presented.toolSlug} />
          <Info
            label="Tool version"
            value={`${detail.request.tool.name} · v${detail.request.tool.version}`}
          />
          <Info label="Required permission" value={presented.requiredPermissionLabel} />
          <Info label="Approval requirement" value={presented.approvalRequirementLabel} />
          <Info label="Risk" value={presented.riskLabel} />
          <Info label="Idempotency key" value={presented.idempotencyKey} />
          <Info label="Authorization" value={presented.authorizationLabel} />
          {presented.denialReason ? (
            <Info label="Denial reason" value={presented.denialReason} />
          ) : null}
          <Info
            label="Related work item"
            value={
              presented.relatedWorkItem ? (
                <Link href={presented.relatedWorkItem.href} className={linkClassName}>
                  {presented.relatedWorkItem.label}
                </Link>
              ) : (
                "None"
              )
            }
          />
          <Info
            label="Related Agent Run"
            value={
              presented.relatedAgentRun ? (
                <Link href={presented.relatedAgentRun.href} className={linkClassName}>
                  {presented.relatedAgentRun.label}
                </Link>
              ) : (
                "None"
              )
            }
          />
        </dl>
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Input
          </h3>
          <ReadOnlyJson value={detail.request.input} emptyLabel="No input recorded." />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Approval
        </h2>
        {detail.approval && presented.approval ? (
          <>
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {TOOL_REQUEST_DETAIL_COPY.approvalIsNotExecution}
            </p>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Info
                label="Approval ID"
                value={
                  <Link href={presented.approval.href} className={linkClassName}>
                    {presented.approval.id}
                  </Link>
                }
              />
              <Info label="Approval status" value={presented.approval.statusLabel} />
              <Info label="Action type" value={presented.approval.actionType} />
              <Info label="Risk" value={formatApprovalLabel(detail.approval.riskLevel)} />
              <Info
                label="Requested"
                value={formatToolInstant(detail.approval.requestedAt, timeZone) ?? "—"}
              />
              <Info
                label="Decided"
                value={
                  detail.approval.decidedAt
                    ? (formatToolInstant(detail.approval.decidedAt, timeZone) ?? "—")
                    : "Not decided"
                }
              />
              <Info label="Decision reason" value={presented.approval.decisionReason} />
              <Info
                label="Expires"
                value={
                  detail.approval.expiresAt
                    ? `${formatToolInstant(detail.approval.expiresAt, timeZone) ?? "—"}${
                        detail.approval.state.isExpired && detail.approval.state.isPending
                          ? " · Past expiration time"
                          : ""
                      }`
                    : "None"
                }
              />
            </dl>
          </>
        ) : (
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {TOOL_REQUEST_DETAIL_COPY.noApproval}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Executions
        </h2>
        {presented.executions.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {TOOL_REQUEST_DETAIL_COPY.noExecutions}
          </p>
        ) : (
          <ol className="space-y-4">
            {detail.executions.map((execution, index) => {
              const presentedExecution = presented.executions[index];
              return (
                <li
                  key={execution.id}
                  className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    Attempt {presentedExecution?.attemptNumber} · {presentedExecution?.statusLabel}
                  </p>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <Info label="Execution ID" value={execution.id} />
                    <Info
                      label="Queued"
                      value={formatToolInstant(execution.createdAt, timeZone) ?? "—"}
                    />
                    <Info
                      label="Started"
                      value={
                        execution.startedAt
                          ? (formatToolInstant(execution.startedAt, timeZone) ?? "—")
                          : "Not started"
                      }
                    />
                    <Info
                      label="Completed"
                      value={
                        execution.completedAt
                          ? (formatToolInstant(execution.completedAt, timeZone) ?? "—")
                          : "Not completed"
                      }
                    />
                    <Info
                      label="Duration"
                      value={
                        execution.durationMs == null ? "Unknown" : `${execution.durationMs} ms`
                      }
                    />
                  </dl>
                  {presentedExecution?.error ? (
                    <div className="space-y-1">
                      <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Error
                      </h3>
                      <p className="break-words text-sm text-red-800 dark:text-red-300">
                        {presentedExecution.error}
                      </p>
                    </div>
                  ) : null}
                  <div className="space-y-1">
                    <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Output
                    </h3>
                    <ReadOnlyJson value={execution.output} emptyLabel="No output recorded." />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Produced records
        </h2>
        {presented.producedRecords.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {TOOL_REQUEST_DETAIL_COPY.noProducedRecords}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {presented.producedRecords.map((record) => (
              <li key={`${record.typeLabel}:${record.id}`}>
                <Link
                  href={record.href}
                  className="block px-4 py-3 text-sm hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
                >
                  <p className="font-medium text-zinc-950 dark:text-zinc-50">{record.label}</p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {record.typeLabel} · {record.id}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          BusinessEvent timeline
        </h2>
        {presented.timeline.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {TOOL_REQUEST_DETAIL_COPY.noTimeline}
          </p>
        ) : (
          <ol className="space-y-4">
            {detail.timeline.map((event, index) => {
              const presentedEvent = presented.timeline[index];
              return (
                <li
                  key={event.id}
                  className="space-y-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {presentedEvent?.title}
                  </p>
                  <p className="text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
                    {presentedEvent?.eventTypeLabel} · {formatToolLabel(event.category)} ·{" "}
                    {formatToolLabel(event.severity)} ·{" "}
                    {formatToolInstant(event.occurredAt, timeZone) ?? "—"}
                  </p>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <Info label="Source" value={formatSourceType(event.actor.type)} />
                    <Info label="Source ID" value={event.actor.id ?? "None"} />
                  </dl>
                  {event.description ? (
                    <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                      {event.description}
                    </p>
                  ) : null}
                  {event.links.length > 0 ? (
                    <ul className="flex flex-wrap gap-3 text-sm">
                      {event.links.map((link) => (
                        <li key={`${link.type}:${link.id}`}>
                          <Link href={link.href} className={linkClassName}>
                            {formatToolLabel(link.type)} {link.id}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="space-y-1">
                    <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Metadata
                    </h3>
                    <ReadOnlyJson value={event.metadata} emptyLabel="No metadata recorded." />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function ReadOnlyJson({ value, emptyLabel }: { value: unknown; emptyLabel: string }) {
  const rendered = formatReadOnlyJson(value);
  if (rendered == null) {
    return <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{emptyLabel}</p>;
  }

  return (
    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs leading-5 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
      {rendered}
    </pre>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-zinc-950 dark:text-zinc-50">{value}</dd>
    </div>
  );
}
