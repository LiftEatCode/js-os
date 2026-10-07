import type { Metadata } from "next";
import { getJsSolutionsOrganization } from "@/business-state";
import { loadToolsDashboard } from "@/command-center/tools/load-tools-dashboard";
import {
  parseToolRequestStatusFilter,
  parseToolSlugFilter,
} from "@/command-center/tools/parse";
import { ToolsView } from "@/components/command-center/tools/tools-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tools",
};

type ToolsSearchParams = {
  status?: string | string[];
  toolSlug?: string | string[];
};

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<ToolsSearchParams>;
}) {
  const params = await searchParams;
  const status = parseToolRequestStatusFilter(params.status);
  const toolSlug = parseToolSlugFilter(params.toolSlug);
  const organization = await getJsSolutionsOrganization();
  const dashboard = await loadToolsDashboard(
    {
      id: organization.id,
      name: organization.name,
      timezone: organization.timezone,
    },
    { status, toolSlug },
  );

  return <ToolsView dashboard={dashboard} />;
}
