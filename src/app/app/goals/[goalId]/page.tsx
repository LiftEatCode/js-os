import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGoalById, getJsSolutionsOrganization } from "@/business-state";
import { formatGoalLabel } from "@/command-center/goals/constants";
import { isGoalUuid, instantToDateInput } from "@/command-center/goals/parse";
import { formatBusinessDate, formatBusinessInstant } from "@/command-center/overview/format";
import { isCommandCenterWriteEnabled } from "@/command-center/write-access";
import { GoalForm } from "@/components/command-center/goals/goal-form";
import { GoalMetric } from "@/components/command-center/goals/goal-metric";
import { GoalProgressForm } from "@/components/command-center/goals/goal-progress-form";
import { PageHeader } from "@/components/command-center/page-header";
import { ReadOnlyNotice } from "@/components/command-center/read-only-notice";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Goal",
};

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ goalId: string }>;
}) {
  const { goalId } = await params;
  if (!isGoalUuid(goalId)) {
    notFound();
  }

  const organization = await getJsSolutionsOrganization();
  const goal = await getGoalById(goalId);
  if (!goal || goal.organizationId !== organization.id) {
    notFound();
  }

  const writesEnabled = isCommandCenterWriteEnabled();
  const timeZone = organization.timezone;

  return (
    <div className="space-y-8">
      <PageHeader
        title={goal.title}
        description={goal.description ?? "Strategic objective for JS Solutions."}
        actions={
          <Link
            href="/app/goals"
            className="text-sm text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 dark:focus-visible:outline-zinc-100"
          >
            Back to Goals
          </Link>
        }
        meta={
          <p>
            {formatGoalLabel(goal.status)} · {formatGoalLabel(goal.priority)} ·{" "}
            {formatGoalLabel(goal.timeHorizon)}
          </p>
        }
      />

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Info
          label="Target date"
          value={formatBusinessDate(goal.targetDate, timeZone) ?? "None"}
        />
        <Info label="Created" value={formatBusinessInstant(goal.createdAt, timeZone) ?? "—"} />
        <Info label="Updated" value={formatBusinessInstant(goal.updatedAt, timeZone) ?? "—"} />
        <Info
          label="Completed"
          value={
            goal.completedAt
              ? (formatBusinessInstant(goal.completedAt, timeZone) ?? "—")
              : "Not completed"
          }
        />
      </dl>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Metric
        </h2>
        <GoalMetric
          metricName={goal.metricName}
          metricUnit={goal.metricUnit}
          currentValue={goal.currentValue}
          targetValue={goal.targetValue}
        />
      </section>

      {writesEnabled ? (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Progress
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Updates current value only. No percentage completion is inferred.
            </p>
            <GoalProgressForm goalId={goal.id} currentValue={goal.currentValue ?? ""} />
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Edit Goal
            </h2>
            <GoalForm
              mode="edit"
              values={{
                goalId: goal.id,
                title: goal.title,
                description: goal.description ?? "",
                status: goal.status,
                priority: goal.priority,
                timeHorizon: goal.timeHorizon,
                targetDate: instantToDateInput(goal.targetDate, timeZone),
                metricName: goal.metricName ?? "",
                metricUnit: goal.metricUnit ?? "",
                targetValue: goal.targetValue ?? "",
                currentValue: goal.currentValue ?? "",
              }}
            />
          </section>
        </>
      ) : (
        <ReadOnlyNotice />
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-zinc-950 dark:text-zinc-50">{value}</dd>
    </div>
  );
}
