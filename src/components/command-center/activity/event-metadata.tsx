export function EventMetadata({ metadata }: { metadata: unknown }) {
  const rendered = formatSafe(metadata);
  if (rendered == null) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">No metadata recorded.</p>;
  }

  return (
    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs leading-5 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
      {rendered}
    </pre>
  );
}

function formatSafe(metadata: unknown): string | null {
  if (metadata == null) {
    return null;
  }
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return "Metadata could not be displayed.";
  }
}
