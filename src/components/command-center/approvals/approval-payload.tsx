export function ApprovalPayload({ payload }: { payload: unknown }) {
  if (payload == null) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">No action payload recorded.</p>
    );
  }

  let rendered: string;
  try {
    rendered = JSON.stringify(payload, null, 2);
  } catch {
    rendered = "Payload could not be displayed.";
  }

  return (
    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs leading-5 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
      {rendered}
    </pre>
  );
}
