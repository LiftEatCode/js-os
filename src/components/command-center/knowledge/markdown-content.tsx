import type { ReactNode } from "react";
import Link from "next/link";
import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { rewriteDocsHref } from "@/knowledge";

const linkClassName =
  "text-zinc-950 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-50 dark:decoration-zinc-600 dark:hover:decoration-zinc-50 dark:focus-visible:outline-zinc-100";

const headingClassName =
  "scroll-mt-20 font-semibold tracking-tight text-zinc-950 dark:text-zinc-50";

function MarkdownAnchor({
  href,
  children,
  relativePath,
}: {
  href?: string;
  children: ReactNode;
  relativePath: string;
}) {
  const rewritten = rewriteDocsHref(href ?? "", relativePath);
  if (rewritten.kind === "external") {
    return (
      <a href={rewritten.href} target="_blank" rel="noreferrer" className={linkClassName}>
        {children}
      </a>
    );
  }
  if (rewritten.kind === "knowledge" || rewritten.kind === "anchor") {
    return (
      <Link href={rewritten.href} className={linkClassName}>
        {children}
      </Link>
    );
  }
  return (
    <a href={rewritten.href} className={linkClassName}>
      {children}
    </a>
  );
}

function markdownComponents(relativePath: string): Components {
  return {
    h1: ({ children, id }) => (
      <h2 id={id} className={`mt-2 text-2xl ${headingClassName}`}>
        {children}
      </h2>
    ),
    h2: ({ children, id }) => (
      <h2 id={id} className={`mt-10 text-lg ${headingClassName}`}>
        {children}
      </h2>
    ),
    h3: ({ children, id }) => (
      <h3 id={id} className={`mt-8 text-base ${headingClassName}`}>
        {children}
      </h3>
    ),
    h4: ({ children, id }) => (
      <h4 id={id} className={`mt-6 text-sm ${headingClassName}`}>
        {children}
      </h4>
    ),
    p: ({ children }) => (
      <p className="mt-4 text-sm leading-7 text-zinc-700 dark:text-zinc-300">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="pl-1">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="mt-4 border-l-2 border-zinc-300 pl-4 text-sm leading-7 text-zinc-600 dark:border-zinc-600 dark:text-zinc-400">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-8 border-zinc-200 dark:border-zinc-800" />,
    strong: ({ children }) => (
      <strong className="font-semibold text-zinc-950 dark:text-zinc-50">{children}</strong>
    ),
    em: ({ children }) => <em>{children}</em>,
    a: ({ href, children }) => (
      <MarkdownAnchor href={href} relativePath={relativePath}>
        {children}
      </MarkdownAnchor>
    ),
    code: ({ className, children }) => {
      const language = /language-([a-z0-9]+)/i.exec(className ?? "")?.[1];
      const inline = !className && !String(children).includes("\n");
      if (inline) {
        return (
          <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.85em] text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
            {children}
          </code>
        );
      }
      return (
        <code
          className={`block font-mono text-[0.8rem] leading-6 text-zinc-100 ${className ?? ""}`}
          data-language={language}
        >
          {language ? (
            <span className="mb-2 block text-[0.65rem] font-medium uppercase tracking-wide text-zinc-400">
              {language}
            </span>
          ) : null}
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-950 p-4 dark:bg-zinc-900">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm text-zinc-700 dark:text-zinc-300">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="border-b border-zinc-200 dark:border-zinc-700">{children}</thead>
    ),
    th: ({ children }) => (
      <th className="px-3 py-2 font-semibold text-zinc-950 dark:text-zinc-50">{children}</th>
    ),
    td: ({ children }) => (
      <td className="border-t border-zinc-200 px-3 py-2 align-top dark:border-zinc-800">
        {children}
      </td>
    ),
  };
}

export function MarkdownContent({
  markdown,
  relativePath,
}: {
  markdown: string;
  relativePath: string;
}) {
  return (
    <div className="max-w-none">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={markdownComponents(relativePath)}
      >
        {markdown}
      </Markdown>
    </div>
  );
}
