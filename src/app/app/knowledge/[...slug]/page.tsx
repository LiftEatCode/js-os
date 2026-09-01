import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getKnowledgeDocumentBySlug,
  getKnowledgeNavigation,
  KNOWLEDGE_ROUTE_PREFIX,
  knowledgeHrefForSlug,
  listKnowledgeDocuments,
  slugFromParamSegments,
  stripMatchingTitleHeading,
} from "@/knowledge";
import {
  KnowledgeBreadcrumbs,
  knowledgeHomeCrumb,
} from "@/components/command-center/knowledge/knowledge-breadcrumbs";
import {
  KnowledgeMobileNav,
  KnowledgeNav,
} from "@/components/command-center/knowledge/knowledge-nav";
import { MarkdownContent } from "@/components/command-center/knowledge/markdown-content";
import { PageHeader } from "@/components/command-center/page-header";

type KnowledgeDocumentParams = {
  slug: string[];
};

export function generateStaticParams(): Array<{ slug: string[] }> {
  return listKnowledgeDocuments().map((document) => ({
    slug: document.slug.split("/"),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<KnowledgeDocumentParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const joined = slugFromParamSegments(slug);
  const document = joined ? getKnowledgeDocumentBySlug(joined) : null;
  return {
    title: document?.title ?? "Knowledge",
  };
}

export default async function KnowledgeDocumentPage({
  params,
}: {
  params: Promise<KnowledgeDocumentParams>;
}) {
  const { slug } = await params;
  const joined = slugFromParamSegments(slug);
  const document = joined ? getKnowledgeDocumentBySlug(joined) : null;
  if (!document) {
    notFound();
  }

  const navigation = getKnowledgeNavigation();
  const body = stripMatchingTitleHeading(document.content, document.title);

  return (
    <div className="space-y-6">
      <KnowledgeBreadcrumbs
        items={[
          knowledgeHomeCrumb(),
          {
            label: document.sectionLabel,
            href: `${KNOWLEDGE_ROUTE_PREFIX}#section-${document.section}`,
          },
          { label: document.title, href: knowledgeHrefForSlug(document.slug) },
        ]}
      />

      <PageHeader
        title={document.title}
        description={document.description}
        meta={
          <p>
            {document.sectionLabel} · {document.relativePath}
            {document.status ? ` · ${document.status}` : ""}
          </p>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <KnowledgeMobileNav sections={navigation} currentSlug={document.slug} />
        <aside className="hidden lg:block">
          <div className="sticky top-6 max-h-[calc(100dvh-4rem)] overflow-y-auto pr-2">
            <KnowledgeNav sections={navigation} currentSlug={document.slug} />
          </div>
        </aside>
        <article className="min-w-0">
          {body.trim().length === 0 ? (
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              This document has no additional body content.
            </p>
          ) : (
            <MarkdownContent markdown={body} relativePath={document.relativePath} />
          )}
        </article>
      </div>
    </div>
  );
}
