import type { Metadata } from "next";
import { EmptyState } from "@/components/command-center/empty-state";
import { PageHeader } from "@/components/command-center/page-header";

export const metadata: Metadata = {
  title: "Work",
};

export default function WorkPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Work"
        description="WorkItems across JS Solutions."
      />
      <EmptyState
        title="No work queue yet"
        description="WorkItem lists and management will be implemented in Milestone 2.4. This page does not create or display sample work."
        status="Planned"
      />
    </div>
  );
}
