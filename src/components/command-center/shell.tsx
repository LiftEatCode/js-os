"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  COMMAND_CENTER_NAV,
  isCommandCenterNavActive,
  NavIcon,
  type CommandCenterNavItem,
} from "./nav";

type CommandCenterShellProps = {
  children: ReactNode;
  environment: string;
};

export function CommandCenterShell({ children, environment }: CommandCenterShellProps) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navPathname, setNavPathname] = useState(pathname);
  const titleId = useId();

  if (pathname !== navPathname) {
    setNavPathname(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (mobileOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [mobileOpen]);

  return (
    <div className="flex min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-zinc-950 focus:px-3 focus:py-2 focus:text-sm focus:text-white dark:focus:bg-zinc-50 dark:focus:text-zinc-950"
      >
        Skip to main content
      </a>

      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex dark:border-zinc-800 dark:bg-zinc-950">
        <BrandHeader />
        <nav className="flex-1 px-3 py-3" aria-label="Command Center">
          <NavList pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        </nav>
        <SystemFooter environment={environment} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <BrandMark compact />
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
            aria-expanded={mobileOpen}
            aria-controls="command-center-mobile-nav"
            onClick={() => setMobileOpen(true)}
          >
            Menu
          </button>
        </header>

        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      <dialog
        ref={dialogRef}
        id="command-center-mobile-nav"
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-72 max-w-[90vw] border-r border-zinc-200 bg-white p-0 text-zinc-950 backdrop:bg-zinc-950/40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
        aria-labelledby={titleId}
        onClose={() => setMobileOpen(false)}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
            <div>
              <p id={titleId} className="text-sm font-semibold tracking-tight">
                JS OS
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                JS Solutions Operating System
              </p>
            </div>
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-2 py-1 text-sm text-zinc-800 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
              onClick={() => setMobileOpen(false)}
            >
              Close
            </button>
          </div>
          <nav className="flex-1 px-3 py-3" aria-label="Command Center">
            <NavList pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </nav>
          <SystemFooter environment={environment} />
        </div>
      </dialog>
    </div>
  );
}

function BrandHeader() {
  return (
    <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
      <BrandMark />
    </div>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/app"
      className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
    >
      <span className="block text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        JS OS
      </span>
      {compact ? null : (
        <span className="mt-0.5 block text-xs leading-4 text-zinc-500 dark:text-zinc-400">
          JS Solutions Operating System
        </span>
      )}
    </Link>
  );
}

function SystemFooter({ environment }: { environment: string }) {
  return (
    <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        System
      </p>
      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{environment}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        Unauthenticated. Auth is future work.
      </p>
    </div>
  );
}

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <ul className="space-y-0.5">
      {COMMAND_CENTER_NAV.map((item) => (
        <li key={item.href}>
          <NavLink item={item} pathname={pathname} onNavigate={onNavigate} />
        </li>
      ))}
    </ul>
  );
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: CommandCenterNavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isCommandCenterNavActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={item.description}
      onClick={onNavigate}
      className={[
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
        active
          ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
      ].join(" ")}
    >
      <NavIcon name={item.icon} />
      <span>{item.label}</span>
    </Link>
  );
}
