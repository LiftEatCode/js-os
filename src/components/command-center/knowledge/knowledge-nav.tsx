import Link from "next/link";
import type { KnowledgeSection } from "@/knowledge";
import { knowledgeHrefForSlug } from "@/knowledge";

export function KnowledgeNav({
  sections,
  currentSlug,
}: {
  sections: KnowledgeSection[];
  currentSlug?: string;
}) {
  return (
    <nav aria-label="Documentation" className="space-y-5">
      {sections.map((section) => (
        <div key={section.id}>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.documents.map((document) => {
              const active = document.slug === currentSlug;
              return (
                <li key={document.slug}>
                  <Link
                    href={knowledgeHrefForSlug(document.slug)}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "block rounded-md px-2 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
                      active
                        ? "bg-zinc-100 font-medium text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
                    ].join(" ")}
                  >
                    {document.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function KnowledgeMobileNav({
  sections,
  currentSlug,
}: {
  sections: KnowledgeSection[];
  currentSlug?: string;
}) {
  return (
    <details className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:hidden">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-50 dark:focus-visible:outline-zinc-100">
        Documentation
      </summary>
      <div className="max-h-[70vh] overflow-y-auto border-t border-zinc-200 px-2 py-3 dark:border-zinc-800">
        <KnowledgeNav sections={sections} currentSlug={currentSlug} />
      </div>
    </details>
  );
}
