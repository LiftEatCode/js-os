import Link from "next/link";

export default function GoalNotFound() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Goal not found
      </h1>
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        That Goal does not exist for JS Solutions, or the identifier is not valid.
      </p>
      <Link
        href="/app/goals"
        className="inline-flex text-sm font-medium text-zinc-950 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-50 dark:focus-visible:outline-zinc-100"
      >
        Back to Goals
      </Link>
    </div>
  );
}
