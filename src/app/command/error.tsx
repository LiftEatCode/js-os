'use client';

export default function CommandError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="rounded-xl border border-rose-900/50 bg-slate-950 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400">Command Center unavailable</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100">JS OS could not load the current business state.</h1>
        <button type="button" onClick={reset} className="mt-5 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900">Retry</button>
      </div>
    </main>
  );
}
