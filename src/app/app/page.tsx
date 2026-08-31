import { loadOverview } from "@/command-center/overview/load";
import { OverviewView } from "@/components/command-center/overview-view";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const data = await loadOverview();
  return <OverviewView data={data} />;
}
