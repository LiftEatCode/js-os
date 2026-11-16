import { z } from "zod";

const httpUrl = z.url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol));
const discoverySchema = z.object({
  runs: z.array(z.object({
    id: z.string(),
    requestedLocation: z.string(),
    requestedIndustries: z.array(z.string()),
    radiusMiles: z.number().nullable(),
    requestedLimit: z.number(),
    returnedCount: z.number(),
    completedAt: z.iso.datetime().nullable(),
    campaign: z.object({ name: z.string() }),
  })),
  selectedRunId: z.string().nullable(),
  businesses: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string().nullable(),
    location: z.string().nullable(),
    website: httpUrl.nullable(),
    listingUrl: httpUrl,
    status: z.string(),
    existingClient: z.boolean(),
    priorOutreach: z.boolean(),
  })),
});

export async function loadDiscoveryResults(runId?: string) {
  const origin = process.env.JS_GROWTH_DISCOVERY_ORIGIN?.trim();
  const secret = process.env.JS_OS_DISCOVERY_SECRET?.trim();
  if (!origin || !secret) return { status: "unconfigured" } as const;

  try {
    const url = new URL("/api/integrations/js-os/discovery", origin);
    if (runId) url.searchParams.set("run", runId);
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "error",
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(8_000),
    });
    if (response.status === 404 && runId) return { status: "missing" } as const;
    if (!response.ok) return { status: "error" } as const;
    return { status: "ok", data: discoverySchema.parse(await response.json()) } as const;
  } catch {
    return { status: "error" } as const;
  }
}
