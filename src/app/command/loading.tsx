export default function CommandLoading() {
  return (
    <main className="mx-auto max-w-7xl animate-pulse space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="h-24 rounded-xl border border-slate-800 bg-slate-950" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-24 rounded-xl border border-slate-800 bg-slate-950" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-64 rounded-xl border border-slate-800 bg-slate-950" />)}
      </div>
      <div className="h-64 rounded-xl border border-slate-800 bg-slate-950" />
    </main>
  );
}
