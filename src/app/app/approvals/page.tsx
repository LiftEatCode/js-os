import type { Metadata } from "next";
import { EmptyState } from "@/components/command-center/empty-state";
import { PageHeader } from "@/components/command-center/page-header";

export const metadata: Metadata = {
  title: "Approvals",
};

export default function ApprovalsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Approvals"
        description="Actions waiting for owner authorization."
      />
      <EmptyState
        title="No approval queue yet"
        description="The approval queue will be implemented in Milestone 2.6. Approval remains authorization, not execution. This page does not show sample requests."
        status="Planned"
      />
    </div>
  );
}
