"use client";

import { useActionState, type ReactNode } from "react";
import {
  createWorkItemAction,
  updateWorkItemAction,
  type WorkFormState,
} from "@/command-center/work/actions";
import {
  WORK_FORM_DEFAULTS,
  WORK_PRIORITIES,
  WORK_STATUSES,
  WORK_TYPES,
  formatWorkLabel,
} from "@/command-center/work/constants";

const inputClassName =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:outline-zinc-100";

export type WorkFormOption = {
  id: string;
  label: string;
};

export type WorkFormValues = {
  workItemId?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  workType: string;
  goalId: string;
  parentId: string;
  assignedAgentId: string;
  dueAt: string;
};

const emptyValues: WorkFormValues = {
  title: "",
  description: "",
  status: WORK_FORM_DEFAULTS.status,
  priority: WORK_FORM_DEFAULTS.priority,
  workType: WORK_FORM_DEFAULTS.workType,
  goalId: "",
  parentId: "",
  assignedAgentId: "",
  dueAt: "",
};

export function WorkItemForm({
  mode,
  values,
  goals,
  parents,
  agents,
}: {
  mode: "create" | "edit";
  values?: Partial<WorkFormValues>;
  goals: WorkFormOption[];
  parents: WorkFormOption[];
  agents: WorkFormOption[];
}) {
  const action = mode === "create" ? createWorkItemAction : updateWorkItemAction;
  const [state, formAction, pending] = useActionState<WorkFormState, FormData>(action, {});
  const merged = { ...emptyValues, ...values };

  return (
    <form action={formAction} className="space-y-5">
      {merged.workItemId ? (
        <input type="hidden" name="workItemId" value={merged.workItemId} />
      ) : null}

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
            {WORK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatWorkLabel(status)}
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
            {WORK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {formatWorkLabel(priority)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Work type" name="workType" error={state.fieldErrors?.workType}>
          <select
            id="workType"
            name="workType"
            defaultValue={merged.workType}
            className={inputClassName}
          >
            {WORK_TYPES.map((workType) => (
              <option key={workType} value={workType}>
                {formatWorkLabel(workType)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Due date" name="dueAt" error={state.fieldErrors?.dueAt}>
        <input
          id="dueAt"
          name="dueAt"
          type="date"
          defaultValue={merged.dueAt}
          className={inputClassName}
          aria-invalid={Boolean(state.fieldErrors?.dueAt)}
          aria-describedby={state.fieldErrors?.dueAt ? "dueAt-error" : undefined}
        />
      </Field>

      <Field label="Goal" name="goalId" error={state.fieldErrors?.goalId}>
        <select id="goalId" name="goalId" defaultValue={merged.goalId} className={inputClassName}>
          <option value="">None</option>
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Parent work item" name="parentId" error={state.fieldErrors?.parentId}>
        <select
          id="parentId"
          name="parentId"
          defaultValue={merged.parentId}
          className={inputClassName}
        >
          <option value="">None</option>
          {parents.map((parent) => (
            <option key={parent.id} value={parent.id}>
              {parent.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Configured assignee"
        name="assignedAgentId"
        error={state.fieldErrors?.assignedAgentId}
      >
        <select
          id="assignedAgentId"
          name="assignedAgentId"
          defaultValue={merged.assignedAgentId}
          className={inputClassName}
        >
          <option value="">None</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Assignment selects a configured organizational role. It does not start an AgentRun.
        </p>
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-100"
      >
        {pending ? "Saving…" : mode === "create" ? "Create Work Item" : "Save Work Item"}
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
