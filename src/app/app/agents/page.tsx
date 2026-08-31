import type { Metadata } from "next";
import { EmptyState } from "@/components/command-center/empty-state";
import { PageHeader } from "@/components/command-center/page-header";

export const metadata: Metadata = {
  title: "Agents",
};

export default function AgentsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Agents"
        description="Organizational AI role definitions and activity."
      />
      <EmptyState
        title="No agent console yet"
        description="AgentDefinition visibility and later AgentRun history will be implemented in Milestone 2.7. An AgentDefinition row is not an operational autonomous agent. This page does not invoke models."
        status="Planned"
      />
    </div>
  );
}
