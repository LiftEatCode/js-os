import { loadCommandCenter } from '@/command-center/command/load';
import { CommandCenterView } from '@/components/command-center/command-center-view';

export const dynamic = 'force-dynamic';

export default async function CommandPage() {
  const state = await loadCommandCenter();

  if (!state) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">JS OS</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-100">JS Solutions is not configured</h1>
          <p className="mt-3 text-sm text-slate-400">Run the business-state bootstrap or configure the js-solutions organization before opening the Command Center.</p>
        </div>
      </main>
    );
  }

  return <CommandCenterView state={state} />;
}
