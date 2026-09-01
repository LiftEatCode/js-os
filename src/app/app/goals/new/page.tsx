import type { Metadata } from "next";
import Link from "next/link";
import { isCommandCenterWriteEnabled } from "@/command-center/write-access";
import { GoalForm } from "@/components/command-center/goals/goal-form";
import { PageHeader } from "@/components/command-center/page-header";
import { ReadOnlyNotice } from "@/components/command-center/read-only-notice";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create Goal",
};

export default function NewGoalPage() {
  const writesEnabled = isCommandCenterWriteEnabled();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Create Goal"
        description="Define a strategic objective for JS Solutions. Defaults to Draft until you choose otherwise."
        actions={
          <Link
            href="/app/goals"
            className="text-sm text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 dark:focus-visible:outline-zinc-100"
          >
            Back to Goals
          </Link>
        }
      />
      {writesEnabled ? <GoalForm mode="create" /> : <ReadOnlyNotice />}
    </div>
  );
}
