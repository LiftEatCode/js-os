import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/command-center/page-header";
import { loadDiscoveryResults } from "@/integrations/js-growth/discovery";

export const metadata: Metadata = { title: "Prospects", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string | string[] }>;
}) {
  const { run } = await searchParams;
  // Command Center has no operator authentication yet.
  const result = process.env.NODE_ENV === "development"
    ? await loadDiscoveryResults(typeof run === "string" ? run : undefined)
    : { status: "local-only" } as const;

  return (
    <div className="space-y-6">
      <PageHeader title="Prospects" description="Browse completed business discovery runs from JS Growth." />
      {result.status === "local-only" && <p>Prospect results are available in local development until Command Center has operator sign-in.</p>}
      {result.status === "unconfigured" && <p>Configure the JS Growth discovery origin and shared token to load prospect results.</p>}
      {result.status === "error" && <p>Couldn’t load JS Growth results. Check the discovery connection and try again.</p>}
      {result.status === "missing" && <p>That discovery run is unavailable. <Link className="underline" href="/app/prospects">Open the latest run</Link>.</p>}
      {result.status === "ok" && (() => {
        const { runs, selectedRunId, businesses } = result.data;
        const selected = runs.find((item) => item.id === selectedRunId);
        return (
          <>
            {runs.length > 0 ? (
              <form method="get" className="flex flex-wrap items-end gap-3">
                <label className="grid gap-1 text-sm">
                  Discovery run
                  <select name="run" defaultValue={selectedRunId ?? undefined} className="max-w-full rounded-md border border-zinc-300 bg-transparent p-2">
                    {runs.map((item) => <option key={item.id} value={item.id}>{item.campaign.name} · {item.completedAt?.slice(0, 16).replace("T", " ")} UTC</option>)}
                  </select>
                </label>
                <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm">View run</button>
              </form>
            ) : <p>No completed discovery runs yet. Run discovery from JS Growth Prospecting.</p>}
            {selected && (
              <p className="text-sm text-zinc-500">
                {selected.requestedLocation} · {selected.requestedIndustries.join(", ") || "All industries"}
                {selected.radiusMiles ? ` · Requested radius ${selected.radiusMiles} mi` : ""}
                {" · "}{businesses.length} saved results · {selected.returnedCount} returned · Limit {selected.requestedLimit}
              </p>
            )}
            {selected && businesses.length === 0 && <p>This run saved no businesses.</p>}
            {businesses.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Businesses returned by the selected discovery run</caption>
                  <thead><tr>{["Business", "Category", "Location", "Links", "Discovery status"].map((label) => <th key={label} scope="col" className="whitespace-nowrap p-3">{label}</th>)}</tr></thead>
                  <tbody>
                    {businesses.map((business) => (
                      <tr key={business.id} className="border-t border-zinc-200 dark:border-zinc-800">
                        <th scope="row" className="p-3 font-semibold">{business.name}</th>
                        <td className="p-3">{business.category ?? "Unknown"}</td>
                        <td className="p-3">{business.location ?? "Unknown"}</td>
                        <td className="space-y-1 p-3">
                          <a className="block underline" href={business.listingUrl} target="_blank" rel="noreferrer">Google Maps</a>
                          {business.website ? <a className="block underline" href={business.website} target="_blank" rel="noreferrer">Website</a> : <span>No listed website</span>}
                        </td>
                        <td className="p-3">
                          <span className="capitalize">{business.status.toLowerCase().replaceAll("_", " ")}</span>
                          {business.existingClient && <span className="block">Existing client</span>}
                          {business.priorOutreach && <span className="block">Prior outreach</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
