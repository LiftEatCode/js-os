import type { Metadata } from "next";
import { PageHeader } from "@/components/command-center/page-header";

export const metadata: Metadata = {
  title: "Knowledge",
};

export default function KnowledgePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Knowledge"
        description="Internal JS OS and company documentation and operating knowledge."
      />

      <div className="space-y-4 rounded-lg border border-zinc-200 bg-white px-4 py-6 text-sm leading-6 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Planned
        </p>
        <p>
          A documentation browser will be implemented in Milestone 2.8. It will render and
          navigate the markdown already stored under{" "}
          <code className="font-mono text-[0.9em]">docs/</code>.
        </p>
        <p>
          Markdown files under <code className="font-mono text-[0.9em]">docs/</code> remain the
          canonical source of truth. The Knowledge UI will not create a second documentation
          database.
        </p>
        <p>
          Until then, read documentation in the repository, starting at{" "}
          <code className="font-mono text-[0.9em]">docs/README.md</code>.
        </p>
      </div>
    </div>
  );
}
