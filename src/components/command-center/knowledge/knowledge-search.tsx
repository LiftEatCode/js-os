import { KNOWLEDGE_ROUTE_PREFIX } from "@/knowledge";

export function KnowledgeSearchForm({ query }: { query?: string }) {
  return (
    <form action={KNOWLEDGE_ROUTE_PREFIX} method="get" className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1">
        <label
          htmlFor="knowledge-q"
          className="block text-sm font-medium text-zinc-950 dark:text-zinc-50"
        >
          Search documentation
        </label>
        <input
          id="knowledge-q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Approval, agent, roadmap…"
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:outline-zinc-100"
        />
      </div>
      <button
        type="submit"
        className="inline-flex items-center rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-100"
      >
        Search
      </button>
    </form>
  );
}
