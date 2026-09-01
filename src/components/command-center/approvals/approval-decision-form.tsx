"use client";

import { useActionState } from "react";
import {
  decideApprovalAction,
  type ApprovalFormState,
} from "@/command-center/approvals/actions";
import { formatApprovalLabel } from "@/command-center/approvals/constants";

const inputClassName =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:outline-zinc-100";

export function ApprovalDecisionForm({
  approvalId,
  title,
  riskLevel,
}: {
  approvalId: string;
  title: string;
  riskLevel: string;
}) {
  const [state, formAction, pending] = useActionState<ApprovalFormState, FormData>(
    decideApprovalAction,
    {},
  );
  const isCritical = riskLevel === "CRITICAL";
  const riskLabel = formatApprovalLabel(riskLevel);

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Approving authorizes the proposed action. It does not execute it.
      </p>
      {state.error ? (
        <p className="text-sm text-red-800 dark:text-red-300" role="alert">
          {state.error}
        </p>
      ) : null}

      <DecisionPanel
        action={formAction}
        pending={pending}
        approvalId={approvalId}
        title={title}
        riskLabel={riskLabel}
        isCritical={isCritical}
        decision="approve"
        heading="Approve"
        reasonRequired={false}
        reasonError={state.fieldErrors?.decisionReason}
        confirmError={state.fieldErrors?.criticalConfirmation}
        buttonLabel={pending ? "Approving…" : "Approve"}
      />
      <DecisionPanel
        action={formAction}
        pending={pending}
        approvalId={approvalId}
        title={title}
        riskLabel={riskLabel}
        isCritical={isCritical}
        decision="reject"
        heading="Reject"
        reasonRequired
        reasonError={state.fieldErrors?.decisionReason}
        confirmError={state.fieldErrors?.criticalConfirmation}
        buttonLabel={pending ? "Rejecting…" : "Reject"}
      />
      <DecisionPanel
        action={formAction}
        pending={pending}
        approvalId={approvalId}
        title={title}
        riskLabel={riskLabel}
        isCritical={isCritical}
        decision="cancel"
        heading="Cancel"
        reasonRequired={false}
        reasonError={state.fieldErrors?.decisionReason}
        confirmError={state.fieldErrors?.criticalConfirmation}
        buttonLabel={pending ? "Cancelling…" : "Cancel request"}
        description="Cancel withdraws the request. It is not a denial. Use Reject to deny."
      />
    </div>
  );
}

function DecisionPanel({
  action,
  pending,
  approvalId,
  title,
  riskLabel,
  isCritical,
  decision,
  heading,
  reasonRequired,
  reasonError,
  confirmError,
  buttonLabel,
  description,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  approvalId: string;
  title: string;
  riskLabel: string;
  isCritical: boolean;
  decision: "approve" | "reject" | "cancel";
  heading: string;
  reasonRequired: boolean;
  reasonError?: string;
  confirmError?: string;
  buttonLabel: string;
  description?: string;
}) {
  const reasonId = `${decision}-decisionReason`;
  const confirmId = `${decision}-criticalConfirmation`;

  return (
    <form action={action} className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <input type="hidden" name="approvalId" value={approvalId} />
      <input type="hidden" name="decision" value={decision} />
      <h3 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{heading}</h3>
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        You are about to {decision === "cancel" ? "cancel" : decision} “{title}” (risk:{" "}
        {riskLabel}).
      </p>
      {description ? (
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{description}</p>
      ) : null}
      <div>
        <label htmlFor={reasonId} className="block text-sm font-medium text-zinc-950 dark:text-zinc-50">
          Decision reason{reasonRequired ? "" : " (optional)"}
          {reasonRequired ? <span className="sr-only"> required</span> : null}
        </label>
        <textarea
          id={reasonId}
          name="decisionReason"
          rows={3}
          required={reasonRequired}
          className={inputClassName}
          aria-invalid={Boolean(reasonError)}
          aria-describedby={reasonError ? `${reasonId}-error` : undefined}
        />
        {reasonError ? (
          <p id={`${reasonId}-error`} className="mt-1 text-sm text-red-800 dark:text-red-300">
            {reasonError}
          </p>
        ) : null}
      </div>
      {isCritical ? (
        <div>
          <label htmlFor={confirmId} className="flex items-start gap-2 text-sm text-zinc-950 dark:text-zinc-50">
            <input
              id={confirmId}
              name="criticalConfirmation"
              type="checkbox"
              value="yes"
              className="mt-1"
              aria-invalid={Boolean(confirmError)}
            />
            <span>I understand this is a critical-risk approval.</span>
          </label>
          {confirmError ? (
            <p className="mt-1 text-sm text-red-800 dark:text-red-300">{confirmError}</p>
          ) : null}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-100"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
