export function ApprovalPayload({ payload }: { payload: unknown }) {
  if (payload == null) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">No action payload recorded.</p>
    );
  }

  const toolSummary = toolRequestSummary(payload);

  let rendered: string;
  try {
    rendered = JSON.stringify(payload, null, 2);
  } catch {
    rendered = "Payload could not be displayed.";
  }

  return (
    <div className="space-y-3">
      {toolSummary ? (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Tool
            </dt>
            <dd className="mt-1 text-zinc-950 dark:text-zinc-50">{toolSummary.toolName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Capability
            </dt>
            <dd className="mt-1 text-zinc-950 dark:text-zinc-50">
              {toolSummary.toolSlug} · v{toolSummary.toolVersion}
            </dd>
          </div>
        </dl>
      ) : null}
      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs leading-5 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
        {rendered}
      </pre>
    </div>
  );
}

function toolRequestSummary(payload: unknown): {
  toolName: string;
  toolSlug: string;
  toolVersion: string | number;
} | null {
  if (payload == null || typeof payload !== "object") {
    return null;
  }
  const value = payload as {
    kind?: unknown;
    toolName?: unknown;
    toolSlug?: unknown;
    toolVersion?: unknown;
  };
  if (value.kind !== "tool_request" || typeof value.toolName !== "string") {
    return null;
  }
  return {
    toolName: value.toolName,
    toolSlug: typeof value.toolSlug === "string" ? value.toolSlug : "Unknown tool",
    toolVersion: typeof value.toolVersion === "number" || typeof value.toolVersion === "string"
      ? value.toolVersion
      : "—",
  };
}
