"use client";

import { useActionState, type ReactNode } from "react";
import {
  createApprovalRequestAction,
  type ApprovalFormState,
} from "@/command-center/approvals/actions";
import {
  APPROVAL_FORM_DEFAULTS,
  APPROVAL_RISK_LEVELS,
  formatApprovalLabel,
} from "@/command-center/approvals/constants";

const inputClassName =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:outline-zinc-100";

export type ApprovalRequestFormOption = {
  id: string;
  label: string;
};

export function ApprovalRequestForm({
  workItems,
}: {
  workItems: ApprovalRequestFormOption[];
}) {
  const [state, formAction, pending] = useActionState<ApprovalFormState, FormData>(
    createApprovalRequestAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <p className="text-sm text-red-800 dark:text-red-300" role="alert">
          {state.error}
        </p>
      ) : null}

      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Creating an Approval records a request for authorization. It does not execute the
        proposed action, and it does not change a linked WorkItem to Waiting Approval.
      </p>

      <Field label="Title" name="title" error={state.fieldErrors?.title} required>
        <input
          id="title"
          name="title"
          required
          defaultValue=""
          className={inputClassName}
          aria-invalid={Boolean(state.fieldErrors?.title)}
          aria-describedby={state.fieldErrors?.title ? "title-error" : undefined}
        />
      </Field>

      <Field
        label="Action type"
        name="actionType"
        error={state.fieldErrors?.actionType}
        required
        hint="Machine-readable lowercase.dot.notation, for example outreach.send_email."
      >
        <input
          id="actionType"
          name="actionType"
          required
          autoComplete="off"
          spellCheck={false}
          placeholder="outreach.send_email"
          className={inputClassName}
          aria-invalid={Boolean(state.fieldErrors?.actionType)}
          aria-describedby={
            state.fieldErrors?.actionType ? "actionType-error" : "actionType-hint"
          }
        />
      </Field>

      <Field label="Risk level" name="riskLevel" error={state.fieldErrors?.riskLevel} required>
        <select
          id="riskLevel"
          name="riskLevel"
          defaultValue={APPROVAL_FORM_DEFAULTS.riskLevel}
          className={inputClassName}
        >
          {APPROVAL_RISK_LEVELS.map((risk) => (
            <option key={risk} value={risk}>
              {formatApprovalLabel(risk)}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Description" name="description">
        <textarea
          id="description"
          name="description"
          rows={4}
          className={inputClassName}
        />
      </Field>

      <Field
        label="Related work item"
        name="workItemId"
        error={state.fieldErrors?.workItemId}
        hint="Optional context only. This does not change WorkItem status."
      >
        <select id="workItemId" name="workItemId" defaultValue="" className={inputClassName}>
          <option value="">None</option>
          {workItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Expiration"
        name="expiresAt"
        error={state.fieldErrors?.expiresAt}
        hint="Optional. Past expiration is shown on the request; status is not changed automatically."
      >
        <input id="expiresAt" name="expiresAt" type="date" className={inputClassName} />
      </Field>

      <Field
        label="Payload"
        name="payload"
        error={state.fieldErrors?.payload}
        hint="Optional JSON describing the proposed action. Empty means no payload."
      >
        <textarea
          id="payload"
          name="payload"
          rows={8}
          spellCheck={false}
          className={`${inputClassName} font-mono text-xs`}
        />
      </Field>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Requester is recorded as User. Authentication is not implemented, so no user identifier
        is stored.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-100"
      >
        {pending ? "Requesting…" : "Request Approval"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  required,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-950 dark:text-zinc-50">
        {label}
        {required ? <span className="sr-only"> required</span> : null}
      </label>
      {children}
      {hint ? (
        <p id={`${name}-hint`} className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-800 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
