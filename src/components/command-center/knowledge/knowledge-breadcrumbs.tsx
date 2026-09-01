import Link from "next/link";
import { KNOWLEDGE_ROUTE_PREFIX } from "@/knowledge";

export type KnowledgeCrumb = {
  label: string;
  href?: string;
};

export function KnowledgeBreadcrumbs({ items }: { items: KnowledgeCrumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? (
                <span aria-hidden="true" className="text-zinc-400 dark:text-zinc-600">
                  /
                </span>
              ) : null}
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:text-zinc-50 dark:focus-visible:outline-zinc-100"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={last ? "text-zinc-950 dark:text-zinc-50" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function knowledgeHomeCrumb(): KnowledgeCrumb {
  return { label: "Knowledge", href: KNOWLEDGE_ROUTE_PREFIX };
}
