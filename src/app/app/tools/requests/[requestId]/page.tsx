import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJsSolutionsOrganization } from "@/business-state";
import { loadToolRequestDetailView } from "@/command-center/tools/load-tool-request-detail-view";
import { isToolRequestUuid } from "@/command-center/tools/parse";
import { ToolRequestDetailView } from "@/components/command-center/tools/tool-request-detail-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tool Request",
};

export default async function ToolRequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  if (!isToolRequestUuid(requestId)) {
    notFound();
  }

  const organization = await getJsSolutionsOrganization();
  const detail = await loadToolRequestDetailView(organization.id, requestId);
  if (!detail || detail.organization.id !== organization.id) {
    notFound();
  }

  return <ToolRequestDetailView detail={detail} />;
}
