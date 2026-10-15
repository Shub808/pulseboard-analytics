# ADR 0005 — Fonts are self-hosted from npm, not fetched from Google Fonts

**Status:** accepted · **Date:** 2026-10-15

## Context

`next/font/google` fetches font CSS and binaries from `fonts.googleapis.com`
*at build time*. That makes the build depend on a third-party host being
reachable. It is not, in several environments that matter: an air-gapped or
proxy-restricted CI runner, a corporate network with an egress allow-list, or
a build container with no general internet access.

This was not a hypothetical. The first production build of this project failed
with `next/font: Failed to fetch Inter from Google Fonts` because the build
environment's egress policy did not permit `fonts.googleapis.com`.

## Decision

Install the font binaries as npm packages (`@fontsource-variable/inter`,
`@fontsource-variable/jetbrains-mono`) and import them in the root layout. The
`--font-sans` / `--font-mono` design tokens name them first and fall back to a
system stack.

## Consequences

- The build depends only on the npm registry, which CI already needs.
- The deployed app makes **no third-party request for fonts** — better for
  privacy, and one fewer connection on the critical path.
- Both faces are variable, so one file per family covers every weight used.
- Font files are versioned in `package-lock.json` like any other dependency,
  so the rendering is reproducible.
- The trade-off is a slightly larger `node_modules` and giving up Google's CDN
  caching, which modern browsers partition per-site anyway.
