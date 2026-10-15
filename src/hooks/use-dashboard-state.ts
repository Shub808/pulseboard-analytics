"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { PAGE_SIZES, parseOrdersQuery, type OrdersQuery, type SortField } from "@/lib/query/schema";

/**
 * Dashboard state, stored in the URL.
 *
 * Why the URL and not a store: every filter combination becomes a shareable,
 * bookmarkable, back-button-able address, and the server can validate and
 * render the same state on first paint. A Redux/Zustand store would duplicate
 * that state and then need syncing with the address bar in both directions.
 *
 * Mutations use `router.replace` with `scroll: false` so adjusting a filter
 * doesn't flood history or jump the page to the top.
 */
export interface DashboardState {
  /** Validated query, with defaults applied. */
  query: OrdersQuery;
  /** Canonical query string to send to the API. */
  search: string;
  /** Validation problems found in the current URL, if any. */
  issues: { path: string; message: string }[];
  activeFilterCount: number;
  setDateRange: (from: string | undefined, to: string | undefined) => void;
  setSearchTerm: (term: string) => void;
  toggleFacet: (
    facet: "status" | "channel" | "region",
    value: string,
  ) => void;
  clearFacet: (facet: "status" | "channel" | "region") => void;
  setSort: (field: SortField) => void;
  setPage: (page: number) => void;
  setPageSize: (size: (typeof PAGE_SIZES)[number]) => void;
  resetAll: () => void;
}

const FACET_KEYS = ["status", "channel", "region"] as const;

/**
 * The query an empty URL resolves to. Parsed once from the schema so defaults
 * can never drift away from the validator.
 */
const DEFAULT_QUERY: OrdersQuery = (() => {
  const result = parseOrdersQuery({});
  if (!result.ok) {
    throw new Error("Orders query schema has no valid default");
  }
  return result.query;
})();

/** Serialises a validated query back into a stable, minimal query string. */
export function buildSearch(query: OrdersQuery): string {
  const params = new URLSearchParams();
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.q) params.set("q", query.q);
  for (const key of FACET_KEYS) {
    const values = query[key];
    if (values.length > 0) params.set(key, values.join(","));
  }
  if (query.minAmount !== undefined) {
    params.set("minAmount", String(query.minAmount));
  }
  if (query.simulate) params.set("simulate", query.simulate);
  // Explicit opt-out marker so the server-side default-range redirect knows
  // the user chose the unbounded view rather than simply not having one.
  if (!query.from && !query.to) params.set("all", "1");
  params.set("sort", query.sort);
  params.set("dir", query.dir);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  return params.toString();
}

export function useDashboardState(): DashboardState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const parsed = useMemo(
    () => parseOrdersQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  // An invalid URL must not blank the dashboard. We fall back to the default
  // query and surface the problem in the UI instead.
  const query = parsed.ok ? parsed.query : DEFAULT_QUERY;

  const issues = parsed.ok ? [] : parsed.issues;

  const commit = useCallback(
    (next: OrdersQuery) => {
      // `typedRoutes` checks literal hrefs against the real route tree.
      // `usePathname()` returns a plain `string`, so the assertion here is the
      // documented escape hatch for a route composed at runtime — the
      // pathname always comes from the router itself.
      router.replace(`${pathname}?${buildSearch(next)}` as Route, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  const setDateRange = useCallback(
    (from: string | undefined, to: string | undefined) => {
      commit({ ...query, from, to, page: 1 });
    },
    [commit, query],
  );

  const setSearchTerm = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      commit({ ...query, q: trimmed === "" ? undefined : trimmed, page: 1 });
    },
    [commit, query],
  );

  const toggleFacet = useCallback(
    (facet: "status" | "channel" | "region", value: string) => {
      const current = query[facet] as string[];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      commit({ ...query, [facet]: next, page: 1 } as OrdersQuery);
    },
    [commit, query],
  );

  const clearFacet = useCallback(
    (facet: "status" | "channel" | "region") => {
      commit({ ...query, [facet]: [], page: 1 } as OrdersQuery);
    },
    [commit, query],
  );

  const setSort = useCallback(
    (field: SortField) => {
      // Clicking the active column flips direction; a new column starts
      // descending, which is what users expect of money and date columns.
      const dir =
        query.sort === field ? (query.dir === "asc" ? "desc" : "asc") : "desc";
      commit({ ...query, sort: field, dir, page: 1 });
    },
    [commit, query],
  );

  const setPage = useCallback(
    (page: number) => commit({ ...query, page }),
    [commit, query],
  );

  const setPageSize = useCallback(
    (pageSize: (typeof PAGE_SIZES)[number]) =>
      commit({ ...query, pageSize, page: 1 }),
    [commit, query],
  );

  const resetAll = useCallback(() => {
    router.replace(pathname as Route, { scroll: false });
  }, [pathname, router]);

  const activeFilterCount =
    query.status.length +
    query.channel.length +
    query.region.length +
    (query.q ? 1 : 0) +
    (query.minAmount !== undefined ? 1 : 0);

  return {
    query,
    search: buildSearch(query),
    issues,
    activeFilterCount,
    setDateRange,
    setSearchTerm,
    toggleFacet,
    clearFacet,
    setSort,
    setPage,
    setPageSize,
    resetAll,
  };
}
