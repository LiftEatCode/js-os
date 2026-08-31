"use client";

export default function CommandCenterError() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Command Center unavailable
      </h1>
      <p className="max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Foundational JS Solutions business state could not be loaded. Database connection
        details are not shown. If this is local development, confirm the development
        bootstrap has been run.
      </p>
    </div>
  );
}
