# ADR 0003 — Dependency budget

**Status:** accepted · **Date:** 2026-10-15

## Context

Dashboards accrete libraries: a date picker, a table library, a class-name
merger, an icon pack, a chart library, a state manager. Each one is a bundle
cost, an upgrade obligation and a supply-chain surface.

## Decision

A dependency has to earn its place by doing something genuinely hard. The
runtime dependencies are:

| Package | Why it is here |
|---|---|
| `next`, `react`, `react-dom` | The framework. |
| `@tanstack/react-query` | Server-state: caching, deduplication, request cancellation, retry policy, `placeholderData`. Hand-rolling this correctly is a large amount of subtle code. |
| `recharts` | A responsive, accessible-ish SVG chart with a usable tooltip and axis layout. Writing this from scratch is weeks, not hours. |
| `zod` | Runtime validation at the untrusted URL boundary, with types inferred from the same schema. |
| `@fontsource-variable/*` | Self-hosted font files (see ADR 0005). |

Deliberately **not** added:

- **A table library.** The table needs sorting, pagination and filtering — all
  of which happen on the server here. What is left is markup, and hand-written
  markup is what makes the accessibility work (`aria-sort`, `scope`, `caption`,
  one focusable control per row) possible without fighting an abstraction.
- **A date-picker library.** Two `<input type="date">` plus four presets covers
  the requirement with a native, accessible, localised, zero-byte control.
- **`clsx` + `tailwind-merge`.** `lib/cn.ts` is ten lines. The variant maps in
  this codebase never emit conflicting utilities for the same CSS property, so
  merge semantics are not needed.
- **An icon library.** The handful of icons used are inline SVG, each marked
  `aria-hidden`.
- **A state manager.** See ADR 0001.
- **A component library.** The primitives in `components/ui` are small and
  purpose-built, and a design system is part of what this project is meant to
  demonstrate.

## Consequences

Fewer upgrades, a smaller bundle, and no abstraction between the code and the
accessibility semantics. The cost is that primitives such as the popover and
the modal had to be written and tested rather than installed — which is why
the modal is built on the platform's `<dialog>` rather than a hand-rolled
focus trap.
