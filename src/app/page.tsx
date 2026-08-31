import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    default: "JS OS",
    template: "%s · JS OS",
  },
  description: "Internal operating system for JS Solutions.",
};

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 font-sans text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16">
        <p className="text-sm font-semibold tracking-tight">JS OS</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          JS Solutions Operating System
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Internal command layer for business state, work, approvals, and later bounded AI
          coordination. This is not JS Growth.
        </p>
        <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          The Command Center is currently unauthenticated development functionality. Auth is
          future work.
        </p>
        <div className="mt-8">
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-100"
          >
            Open Command Center
          </Link>
        </div>
      </main>
    </div>
  );
}
