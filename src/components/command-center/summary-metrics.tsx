import Link from "next/link";
import type { OverviewMetric } from "@/command-center/overview/load";

export function SummaryMetrics({ metrics }: { metrics: OverviewMetric[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map((metric) => (
        <li key={metric.label}>
          <Link
            href={metric.href}
            className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:focus-visible:outline-zinc-100"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {metric.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
              {metric.value}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
