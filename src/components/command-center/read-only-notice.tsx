export function ReadOnlyNotice() {
  return (
    <p
      className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
      role="status"
    >
      Command Center writes are disabled. Goal changes are currently available only in
      explicitly enabled local development.
    </p>
  );
}
