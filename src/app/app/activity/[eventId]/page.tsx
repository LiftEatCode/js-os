import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBusinessEventById, getJsSolutionsOrganization } from "@/business-state";
import { formatEventTypeLabel, formatSourceType } from "@/command-center/activity/constants";
import { isEventUuid } from "@/command-center/activity/parse";
import { formatBusinessInstant } from "@/command-center/overview/format";
import { EventMetadata } from "@/components/command-center/activity/event-metadata";
import { PageHeader } from "@/components/command-center/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Activity Event",
};

export default async function ActivityEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  if (!isEventUuid(eventId)) {
    notFound();
  }

  const organization = await getJsSolutionsOrganization();
  const event = await getBusinessEventById(eventId);
  if (!event || event.organizationId !== organization.id) {
    notFound();
  }

  const timeZone = organization.timezone;

  return (
    <div className="space-y-8">
      <PageHeader
        title={event.title}
        description={event.description ?? "Operational BusinessEvent."}
        actions={
          <Link
            href="/app/activity"
            className="text-sm text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 dark:focus-visible:outline-zinc-100"
          >
            Back to Activity
          </Link>
        }
        meta={
          <p>
            {formatEventTypeLabel(event.eventType)} · {formatSourceType(event.sourceType)}
          </p>
        }
      />

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Info label="Event type" value={event.eventType} />
        <Info label="Source type" value={formatSourceType(event.sourceType)} />
        <Info label="Source ID" value={event.sourceId ?? "None"} />
        <Info
          label="Occurred"
          value={formatBusinessInstant(event.occurredAt, timeZone) ?? "—"}
        />
        <Info
          label="Recorded"
          value={formatBusinessInstant(event.createdAt, timeZone) ?? "—"}
        />
      </dl>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Metadata
        </h2>
        <EventMetadata metadata={event.metadata} />
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-zinc-950 dark:text-zinc-50">{value}</dd>
    </div>
  );
}
