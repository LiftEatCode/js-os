"use client";

import { useActionState, useState } from "react";
import {
  changeAgentPermissionAction,
  type AgentFormState,
} from "@/command-center/agents/actions";
import {
  AGENT_PERMISSION_LEVELS,
  PERMISSION_CEILING_COPY,
  formatAgentLabel,
} from "@/command-center/agents/constants";

const inputClassName =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:outline-zinc-100";

export function AgentPermissionForm({
  agentId,
  currentPermissionLevel,
}: {
  agentId: string;
  currentPermissionLevel: string;
}) {
  const [state, formAction, pending] = useActionState<AgentFormState, FormData>(
    changeAgentPermissionAction,
    {},
  );
  const [selected, setSelected] = useState(currentPermissionLevel);
  const needsExecuteConfirm = selected === "EXECUTE";

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="agentId" value={agentId} />
      {state.error ? (
        <p className="text-sm text-red-800 dark:text-red-300" role="alert">
          {state.error}
        </p>
      ) : null}
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Permission level is the maximum capability ceiling for this agent. Current level:{" "}
        {formatAgentLabel(currentPermissionLevel)}. Changing the ceiling does not grant tools,
        bypass policy, or skip approval.
      </p>
      <div>
        <label
          htmlFor="permissionLevel"
          className="block text-sm font-medium text-zinc-950 dark:text-zinc-50"
        >
          New permission ceiling
        </label>
        <select
          id="permissionLevel"
          name="permissionLevel"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className={inputClassName}
          aria-invalid={Boolean(state.fieldErrors?.permissionLevel)}
        >
          {AGENT_PERMISSION_LEVELS.map((level) => (
            <option key={level} value={level}>
              {formatAgentLabel(level)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {formatAgentLabel(currentPermissionLevel)} → {formatAgentLabel(selected)}.{" "}
          {PERMISSION_CEILING_COPY[selected as keyof typeof PERMISSION_CEILING_COPY]}
        </p>
      </div>
      {needsExecuteConfirm ? (
        <div>
          <label
            htmlFor="executeConfirmation"
            className="flex items-start gap-2 text-sm text-zinc-950 dark:text-zinc-50"
          >
            <input
              id="executeConfirmation"
              name="executeConfirmation"
              type="checkbox"
              value="yes"
              className="mt-1"
              aria-invalid={Boolean(state.fieldErrors?.executeConfirmation)}
            />
            <span>
              I understand EXECUTE is the agent&apos;s maximum permission ceiling and does not
              bypass tool, policy, or approval controls.
            </span>
          </label>
          {state.fieldErrors?.executeConfirmation ? (
            <p className="mt-1 text-sm text-red-800 dark:text-red-300">
              {state.fieldErrors.executeConfirmation}
            </p>
          ) : null}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-100"
      >
        {pending ? "Updating…" : "Update permission ceiling"}
      </button>
    </form>
  );
}
