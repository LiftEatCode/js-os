"use client";

import { useActionState } from "react";
import { updateGoalProgressAction, type GoalFormState } from "@/command-center/goals/actions";

const inputClassName =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:outline-zinc-100";

export function GoalProgressForm({
  goalId,
  currentValue,
}: {
  goalId: string;
  currentValue: string;
}) {
  const [state, formAction, pending] = useActionState<GoalFormState, FormData>(
    updateGoalProgressAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="goalId" value={goalId} />
      {state.error ? (
        <p className="text-sm text-red-800 dark:text-red-300" role="alert">
          {state.error}
        </p>
      ) : null}
      <div>
        <label
          htmlFor="progress-currentValue"
          className="block text-sm font-medium text-zinc-950 dark:text-zinc-50"
        >
          Current value
        </label>
        <input
          id="progress-currentValue"
          name="currentValue"
          inputMode="decimal"
          defaultValue={currentValue}
          className={inputClassName}
          aria-invalid={Boolean(state.fieldErrors?.currentValue)}
          aria-describedby={state.fieldErrors?.currentValue ? "progress-currentValue-error" : undefined}
        />
        {state.fieldErrors?.currentValue ? (
          <p id="progress-currentValue-error" className="mt-1 text-sm text-red-800 dark:text-red-300">
            {state.fieldErrors.currentValue}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
      >
        {pending ? "Updating…" : "Update progress"}
      </button>
    </form>
  );
}
