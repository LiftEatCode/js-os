import type { Metadata } from "next";
import { EmptyState } from "@/components/command-center/empty-state";
import { PageHeader } from "@/components/command-center/page-header";

export const metadata: Metadata = {
  title: "Activity",
};

export default function ActivityPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Activity"
        description="BusinessEvent operational history."
      />
      <EmptyState
        title="No activity timeline yet"
        description="BusinessEvent history will be implemented in Milestone 2.5. Events remain append-only in the service layer. This page does not invent timeline entries."
        status="Planned"
      />
    </div>
  );
}
