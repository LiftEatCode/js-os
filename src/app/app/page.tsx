import { EmptyState } from "@/components/command-center/empty-state";
import { PageHeader } from "@/components/command-center/page-header";

const upcomingAreas = [
  {
    title: "Owner Attention",
    description: "Items that need an owner decision. Milestone 2.2.",
  },
  {
    title: "Active Goals",
    description: "Live strategic objectives and progress. Milestone 2.3.",
  },
  {
    title: "Current Work",
    description: "WorkItems in motion across JS Solutions. Milestone 2.4.",
  },
  {
    title: "Pending Approvals",
    description: "Authorization queue. Milestone 2.6.",
  },
  {
    title: "Recent Activity",
    description: "BusinessEvent history. Milestone 2.5.",
  },
  {
    title: "Agent Status",
    description: "AgentDefinitions and later run visibility. Milestone 2.7.",
  },
] as const;

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description="Current company state and owner attention. This shell is in place; live business overview arrives in Milestone 2.2."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {upcomingAreas.map((area) => (
          <EmptyState
            key={area.title}
            title={area.title}
            description={area.description}
            status="Planned"
          />
        ))}
      </div>
    </div>
  );
}
