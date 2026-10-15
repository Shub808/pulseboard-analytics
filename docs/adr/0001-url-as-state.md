# ADR 0001 — The URL is the single source of truth for dashboard state

**Status:** accepted · **Date:** 2026-10-15

## Context

A dashboard's state is a date range, a search term, three multi-select facets,
a sort field and direction, and a page. That state has to survive a reload, be
shareable with a colleague, work with the browser's back button, and be
readable by the server so the first paint is correct.

The obvious alternative is a client store (Redux Toolkit, Zustand, React
Context). My day job uses Redux Toolkit, so this was the default I had to
argue myself out of.

## Decision

All of it lives in the query string. `lib/query/schema.ts` parses and
validates it with Zod, exactly once, at the boundary; everything downstream
receives an already-validated `OrdersQuery`.

## Consequences

**Good**

- A filtered view is a URL. "Here's the EMEA refund spike" is a link.
- Reload, back, forward and bookmarking all work with no extra code.
- The same validated object drives the server route handlers and the client
  queries, so the table and the CSV export can never disagree about what is
  being asked for.
- `useQuery({ queryKey: ["orders", search] })` gets correct caching for free,
  because the canonical query string *is* the cache key.

**Costs**

- Every filter change is a `router.replace`, so state updates are a little
  slower than `setState`. Mitigated by `placeholderData` keeping the previous
  result on screen and by debouncing the search input.
- The query string has to be canonicalised (`buildSearch`) so that two
  equivalent filter sets produce the same cache key.
- Anyone can hand-edit the URL, which makes it an untrusted input. That is
  handled rather than hoped away: invalid values are reported in the UI
  instead of silently blanking the dashboard.

## Where a store would still win

If this app grew cross-page client state that is not addressable — an undo
stack, a multi-step wizard, optimistic mutations queued offline — a store
would earn its place alongside the URL, not instead of it.
