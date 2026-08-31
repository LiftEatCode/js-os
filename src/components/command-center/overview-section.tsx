import Link from "next/link";
import type { ReactNode } from "react";

type OverviewSectionProps = {
  title: string;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
};

export function OverviewSection({ title, href, hrefLabel, children }: OverviewSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {title}
        </h2>
        {href && hrefLabel ? (
          <Link
            href={href}
            className="text-sm text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 dark:focus-visible:outline-zinc-100"
          >
            {hrefLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
