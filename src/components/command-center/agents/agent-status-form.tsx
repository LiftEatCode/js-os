"use client";

import { useActionState } from "react";
import {
  changeAgentStatusAction,
  type AgentFormState,
} from "@/command-center/agents/actions";
import {
  AGENT_STATUS_COPY,
  AGENT_STATUSES,
  formatAgentLabel,
} from "@/command-center/agents/constants";

const inputClassName =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:outline-zinc-100";

export function AgentStatusForm({
  agentId,
  currentStatus,
}: {
  agentId: string;
  currentStatus: string;
}) {
  const [state, formAction, pending] = useActionState<AgentFormState, FormData>(
    changeAgentStatusAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="agentId" value={agentId} />
      {state.error ? (
        <p className="text-sm text-red-800 dark:text-red-300" role="alert">
          {state.error}
        </p>
      ) : null}
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Current status: {formatAgentLabel(currentStatus)}. Changing status updates configuration
        only. It does not start or stop a runtime.
      </p>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-zinc-950 dark:text-zinc-50">
          New status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={currentStatus}
          className={inputClassName}
          aria-invalid={Boolean(state.fieldErrors?.status)}
        >
          {AGENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {formatAgentLabel(status)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {AGENT_STATUSES.map((status) => `${formatAgentLabel(status)}: ${AGENT_STATUS_COPY[status]}`).join(
            " ",
          )}
        </p>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-100"
      >
        {pending ? "Updating…" : "Update status"}
      </button>
    </form>
  );
}
