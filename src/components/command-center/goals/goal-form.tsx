"use client";

import { useActionState, type ReactNode } from "react";
import {
  createGoalAction,
  updateGoalAction,
  type GoalFormState,
} from "@/command-center/goals/actions";
import {
  GOAL_FORM_DEFAULTS,
  GOAL_PRIORITIES,
  GOAL_STATUSES,
  GOAL_TIME_HORIZONS,
  formatGoalLabel,
} from "@/command-center/goals/constants";

const inputClassName =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:outline-zinc-100";

export type GoalFormValues = {
  goalId?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  timeHorizon: string;
  targetDate: string;
  metricName: string;
  metricUnit: string;
  targetValue: string;
  currentValue: string;
};

const emptyValues: GoalFormValues = {
  title: "",
  description: "",
  status: GOAL_FORM_DEFAULTS.status,
  priority: GOAL_FORM_DEFAULTS.priority,
  timeHorizon: GOAL_FORM_DEFAULTS.timeHorizon,
  targetDate: "",
  metricName: "",
  metricUnit: "",
  targetValue: "",
  currentValue: "",
};

export function GoalForm({
  mode,
  values,
}: {
  mode: "create" | "edit";
  values?: Partial<GoalFormValues>;
}) {
  const action = mode === "create" ? createGoalAction : updateGoalAction;
  const [state, formAction, pending] = useActionState<GoalFormState, FormData>(action, {});
  const merged = { ...emptyValues, ...values };

  return (
    <form action={formAction} className="space-y-5">
      {merged.goalId ? <input type="hidden" name="goalId" value={merged.goalId} /> : null}

      {state.error ? (
        <p className="text-sm text-red-800 dark:text-red-300" role="alert">
          {state.error}
        </p>
      ) : null}

      <Field label="Title" name="title" error={state.fieldErrors?.title} required>
        <input
          id="title"
          name="title"
          required
          defaultValue={merged.title}
          className={inputClassName}
          aria-invalid={Boolean(state.fieldErrors?.title)}
          aria-describedby={state.fieldErrors?.title ? "title-error" : undefined}
        />
      </Field>

      <Field label="Description" name="description">
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={merged.description}
          className={inputClassName}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Status" name="status" error={state.fieldErrors?.status}>
          <select id="status" name="status" defaultValue={merged.status} className={inputClassName}>
            {GOAL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatGoalLabel(status)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Priority" name="priority" error={state.fieldErrors?.priority}>
          <select
            id="priority"
            name="priority"
            defaultValue={merged.priority}
            className={inputClassName}
          >
            {GOAL_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {formatGoalLabel(priority)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Time horizon" name="timeHorizon" error={state.fieldErrors?.timeHorizon}>
          <select
            id="timeHorizon"
            name="timeHorizon"
            defaultValue={merged.timeHorizon}
            className={inputClassName}
          >
            {GOAL_TIME_HORIZONS.map((horizon) => (
              <option key={horizon} value={horizon}>
                {formatGoalLabel(horizon)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Target date" name="targetDate" error={state.fieldErrors?.targetDate}>
        <input
          id="targetDate"
          name="targetDate"
          type="date"
          defaultValue={merged.targetDate}
          className={inputClassName}
          aria-invalid={Boolean(state.fieldErrors?.targetDate)}
          aria-describedby={state.fieldErrors?.targetDate ? "targetDate-error" : undefined}
        />
      </Field>

      <fieldset className="space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <legend className="px-1 text-sm font-medium text-zinc-950 dark:text-zinc-50">
          Metric (optional)
        </legend>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Current and target are displayed as stored values. JS OS does not infer a completion
          percentage because metric direction is not modeled.
        </p>
        <Field label="Metric name" name="metricName">
          <input
            id="metricName"
            name="metricName"
            defaultValue={merged.metricName}
            className={inputClassName}
          />
        </Field>
        <Field label="Metric unit" name="metricUnit">
          <input
            id="metricUnit"
            name="metricUnit"
            defaultValue={merged.metricUnit}
            className={inputClassName}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current value" name="currentValue" error={state.fieldErrors?.currentValue}>
            <input
              id="currentValue"
              name="currentValue"
              inputMode="decimal"
              defaultValue={merged.currentValue}
              className={inputClassName}
              aria-invalid={Boolean(state.fieldErrors?.currentValue)}
              aria-describedby={state.fieldErrors?.currentValue ? "currentValue-error" : undefined}
            />
          </Field>
          <Field label="Target value" name="targetValue" error={state.fieldErrors?.targetValue}>
            <input
              id="targetValue"
              name="targetValue"
              inputMode="decimal"
              defaultValue={merged.targetValue}
              className={inputClassName}
              aria-invalid={Boolean(state.fieldErrors?.targetValue)}
              aria-describedby={state.fieldErrors?.targetValue ? "targetValue-error" : undefined}
            />
          </Field>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-100"
      >
        {pending ? "Saving…" : mode === "create" ? "Create Goal" : "Save Goal"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  required,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-950 dark:text-zinc-50">
        {label}
        {required ? <span className="sr-only"> required</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-800 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
