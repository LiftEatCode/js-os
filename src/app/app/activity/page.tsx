import type { Metadata } from "next";
import Link from "next/link";
import { getJsSolutionsOrganization, listBusinessEvents } from "@/business-state";
import {
  BUSINESS_EVENT_SOURCE_TYPES,
  formatEventTypeLabel,
  formatSourceType,
} from "@/command-center/activity/constants";
import { sortBusinessEvents } from "@/command-center/activity/ordering";
import {
  parseActivityLimit,
  parseEventTypeFilter,
  parseSourceTypeFilter,
} from "@/command-center/activity/parse";
import { formatBusinessInstant } from "@/command-center/overview/format";
import { PageHeader } from "@/components/command-center/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Activity",
};

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{
    sourceType?: string | string[];
    eventType?: string | string[];
    limit?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const sourceType = parseSourceTypeFilter(params.sourceType);
  const eventType = parseEventTypeFilter(params.eventType);
  const limit = parseActivityLimit(params.limit);
  const organization = await getJsSolutionsOrganization();
  const events = sortBusinessEvents(
    await listBusinessEvents({
      organizationId: organization.id,
      sourceType,
      eventType,
      limit,
    }),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Activity"
        description="What has happened inside JS OS. BusinessEvents are append-only operational facts, not chat history."
      />

      <ActivityFilters sourceType={sourceType} eventType={eventType ?? ""} />

      {events.length === 0 ? (
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {sourceType || eventType
            ? "No business events match these filters."
            : "No business events have been recorded yet."}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/app/activity/${event.id}`}
                className="block px-4 py-3 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
              >
                <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{event.title}</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {formatEventTypeLabel(event.eventType)} · {event.eventType} ·{" "}
                  {formatSourceType(event.sourceType)}
                  {event.sourceId ? ` · ${event.sourceId}` : ""}
                  {` · ${formatBusinessInstant(event.occurredAt, organization.timezone) ?? "—"}`}
                </p>
                {event.description ? (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{event.description}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActivityFilters({
  sourceType,
  eventType,
}: {
  sourceType?: string;
  eventType: string;
}) {
  return (
    <form method="get" action="/app/activity" className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="sourceType"
            className="block text-sm font-medium text-zinc-950 dark:text-zinc-50"
          >
            Source type
          </label>
          <select
            id="sourceType"
            name="sourceType"
            defaultValue={sourceType ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:outline-zinc-100"
          >
            <option value="">All</option>
            {BUSINESS_EVENT_SOURCE_TYPES.map((value) => (
              <option key={value} value={value}>
                {formatSourceType(value)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="eventType"
            className="block text-sm font-medium text-zinc-950 dark:text-zinc-50"
          >
            Event type
          </label>
          <input
            id="eventType"
            name="eventType"
            type="search"
            defaultValue={eventType}
            placeholder="work.completed"
            autoComplete="off"
            spellCheck={false}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:outline-zinc-100"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-100"
        >
          Apply Filters
        </button>
        <Link
          href="/app/activity"
          className="text-sm text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 dark:focus-visible:outline-zinc-100"
        >
          Clear
        </Link>
      </div>
    </form>
  );
}
