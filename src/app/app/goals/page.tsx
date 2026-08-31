import type { Metadata } from "next";
import { EmptyState } from "@/components/command-center/empty-state";
import { PageHeader } from "@/components/command-center/page-header";

export const metadata: Metadata = {
  title: "Goals",
};

export default function GoalsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Goals"
        description="Strategic objectives and measurable progress."
      />
      <EmptyState
        title="No goal management yet"
        description="Goal management will be implemented in Milestone 2.3. Company Goal rows have not been defined yet. This page does not invent metrics or sample objectives."
        status="Planned"
      />
    </div>
  );
}
