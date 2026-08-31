type EmptyStateProps = {
  title: string;
  description: string;
  status?: string;
};

export function EmptyState({ title, description, status = "Planned" }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-8 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {status}
      </p>
      <p className="mt-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">{title}</p>
      <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}
