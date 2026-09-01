import type { Metadata } from "next";
import Link from "next/link";
import {
  getFeaturedKnowledgeDocuments,
  getKnowledgeSections,
  knowledgeHrefForSlug,
  searchKnowledge,
} from "@/knowledge";
import { KnowledgeSearchForm } from "@/components/command-center/knowledge/knowledge-search";
import { PageHeader } from "@/components/command-center/page-header";

export const metadata: Metadata = {
  title: "Knowledge",
};

type KnowledgeSearchParams = {
  q?: string | string[];
};

function firstQuery(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<KnowledgeSearchParams>;
}) {
  const params = await searchParams;
  const query = firstQuery(params.q);
  const sections = getKnowledgeSections();
  const total = sections.reduce((sum, section) => sum + section.documents.length, 0);
  const featured = getFeaturedKnowledgeDocuments();
  const results = query ? searchKnowledge(query) : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Knowledge"
        description="Canonical JS Solutions operating knowledge. Markdown files under docs/ are the source of truth. This browser is read-only: it does not edit files, copy them into a database, or search with AI."
      />

      <KnowledgeSearchForm query={query} />

      {query ? (
        <section className="space-y-3" aria-live="polite">
          <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
            Search results
            <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">
              {results.length} for “{query}”
            </span>
          </h2>
          {results.length === 0 ? (
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              No documentation matched that query.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
              {results.map((hit) => (
                <li key={hit.slug}>
                  <Link
                    href={knowledgeHrefForSlug(hit.slug)}
                    className="block px-4 py-3 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
                  >
                    <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{hit.title}</p>
                    <p className="mt-0.5 text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
                      {hit.sectionLabel} · {hit.relativePath}
                    </p>
                    {hit.excerpt ? (
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{hit.excerpt}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Documents
              </dt>
              <dd className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">{total}</dd>
            </div>
            <div className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Sections
              </dt>
              <dd className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                {sections.length}
              </dd>
            </div>
            <div className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Source
              </dt>
              <dd className="mt-1 text-sm font-medium text-zinc-950 dark:text-zinc-50">docs/</dd>
            </div>
          </dl>

          {featured.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">Start here</h2>
              <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
                {featured.map((document) => (
                  <li key={document.slug}>
                    <Link
                      href={knowledgeHrefForSlug(document.slug)}
                      className="block px-4 py-3 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
                    >
                      <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                        {document.title}
                      </p>
                      <p className="mt-0.5 text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
                        {document.sectionLabel}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {sections.length === 0 ? (
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              No Markdown documents were found under docs/.
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {sections.map((section) => (
                <section
                  key={section.id}
                  id={`section-${section.id}`}
                  className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {section.label}
                    <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">
                      {section.documents.length}
                    </span>
                  </h2>
                  <ul className="mt-3 space-y-1">
                    {section.documents.map((document) => (
                      <li key={document.slug}>
                        <Link
                          href={knowledgeHrefForSlug(document.slug)}
                          className="text-sm text-zinc-700 underline-offset-4 hover:text-zinc-950 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50 dark:focus-visible:outline-zinc-100"
                        >
                          {document.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
