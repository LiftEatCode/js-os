import Link from "next/link";
import { KNOWLEDGE_ROUTE_PREFIX } from "@/knowledge";

export default function KnowledgeDocumentNotFound() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Document not found
      </h1>
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        That Knowledge path is not in the documentation index. Only Markdown files under docs/
        are published here.
      </p>
      <Link
        href={KNOWLEDGE_ROUTE_PREFIX}
        className="inline-flex text-sm font-medium text-zinc-950 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-50 dark:focus-visible:outline-zinc-100"
      >
        Back to Knowledge
      </Link>
    </div>
  );
}
