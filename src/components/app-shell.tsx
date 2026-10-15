"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";

/**
 * Set `NEXT_PUBLIC_REPO_URL` to surface a "Source" link in the header. The
 * link is omitted entirely when the variable is absent, so no deployment ever
 * ships a dead placeholder.
 */
const REPO_URL = process.env.NEXT_PUBLIC_REPO_URL;

const NAV = [
  { href: "/", label: "Overview", hint: "KPIs and trends" },
  { href: "/orders", label: "Orders", hint: "Operational table" },
  { href: "/system", label: "Design system", hint: "Tokens and components" },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "rounded-(--radius-control) px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-brand-600/12 font-medium text-brand-700 dark:text-brand-200"
                : "text-muted hover:bg-surface-muted hover:text-ink",
            )}
          >
            <span className="block">{item.label}</span>
            <span className="block text-xs text-subtle">{item.hint}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="flex size-7 items-center justify-center rounded-md bg-brand-600 text-sm font-bold text-white"
      >
        P
      </span>
      <span className="text-sm font-semibold text-ink">PulseBoard</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // The drawer must close on navigation, otherwise it covers the page the user
  // just asked for. That is derived state, not a side effect: the open flag is
  // stored together with the route it was opened on, so a route change closes
  // it during render with no extra pass and no effect.
  const [drawer, setDrawer] = useState({ open: false, route: pathname });
  const drawerOpen = drawer.open && drawer.route === pathname;
  const setDrawerOpen = (open: boolean) => setDrawer({ open, route: pathname });

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Skip link: the first tab stop on the page, so keyboard users are not
          forced through the whole nav on every route. */}
      <a
        href="#main"
        className="sr-only-focusable absolute top-2 left-2 z-50 rounded-(--radius-control) bg-brand-600 px-3 py-1.5 text-sm text-white"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-expanded={drawerOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation"
            className="rounded-(--radius-control) p-1.5 text-muted hover:bg-surface-muted hover:text-ink lg:hidden"
          >
            <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3.5 6h13M3.5 10h13M3.5 14h13" strokeLinecap="round" />
            </svg>
          </button>
          <Wordmark />
          <span className="ml-1 hidden rounded-full border border-chip-warn-br bg-chip-warn-bg px-2 py-0.5 text-xs text-chip-warn-fg sm:inline">
            Demo data
          </span>
          <div className="ml-auto flex items-center gap-2">
            {REPO_URL ? (
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="hidden text-xs text-muted hover:text-ink sm:inline"
              >
                Source
              </a>
            ) : null}
            <ThemeToggle />
          </div>
        </div>

        {drawerOpen ? (
          <div id="mobile-nav" className="border-t border-line px-3 py-2 lg:hidden">
            <NavList onNavigate={() => setDrawerOpen(false)} />
          </div>
        ) : null}
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-line px-3 py-4 lg:block">
          <NavList />
          <p className="mt-6 px-2.5 text-xs leading-relaxed text-subtle">
            Personal portfolio project. All records are synthetic and generated
            from a fixed seed.
          </p>
        </aside>

        <main id="main" className="min-w-0 flex-1 px-4 py-5 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
