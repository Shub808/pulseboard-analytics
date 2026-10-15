# ADR 0002 — `cacheComponents` (Partial Prerendering) is deliberately off

**Status:** accepted · **Date:** 2026-10-15

## Context

`create-next-app` scaffolds Next.js 16 with `cacheComponents: true`. The
upgrade guide is explicit that this is not a rename-only flag: it opts the app
into the Cache Components model, surfaces build errors for uncached data
outside a `<Suspense>` boundary, and changes how dynamic access is treated.

## Decision

Removed from `next.config.ts`.

## Rationale

Every route in this app is driven by the query string, and the data it renders
is per-request by definition. There is no meaningful static shell to prerender
beyond the layout, which Next already streams. Enabling an opt-in caching model
to gain nothing, while taking on build-time constraints I would then have to
work around, is complexity without a payoff.

The rest of the Next.js 16 defaults are kept: Turbopack for dev and build,
async request APIs, and the ESLint flat config.

## Revisit when

The app gains genuinely static, cacheable segments — a marketing page, a
published report snapshot — at which point `cacheComponents` plus explicit
`"use cache"` boundaries becomes worth the migration.
