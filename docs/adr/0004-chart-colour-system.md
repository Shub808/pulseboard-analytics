# ADR 0004 — Chart colour is computed and validated, not chosen by eye

**Status:** accepted · **Date:** 2026-10-15

## Context

Most dashboard palettes are picked because they look nice on the designer's
monitor in light mode. The predictable results are series that collapse into
each other for the ~8% of men with a colour-vision deficiency, dark mode built
by inverting light mode, and 12px labels at 3:1 contrast.

## Decision

1. **The palette lives in TypeScript** (`src/lib/viz-palette.ts`) and the CSS
   custom properties are *generated* from it and injected in `<head>`. Recharts
   needs concrete colour values — `var()` is not reliably resolved inside SVG
   presentation attributes — while the rest of the UI needs CSS variables.
   Declaring the values in both places guarantees they drift; generating one
   from the other makes that impossible.
2. **Colour is assigned by the job it does, not by category index.** The
   ranked-bar breakdowns encode a single measure across categories, so every
   bar is the *same* hue and the magnitude does the talking; the category is
   already named in the row label. The trend chart's comparison period is drawn
   as a thin dashed neutral grey, because it is a reference, not a peer series.
3. **Dark mode is a separately chosen set of steps**, validated against the
   dark surface, not an automatic inversion.
4. **The palette was validated with a script, not an opinion.**

## Recorded validator output

Run against the project's own chart surfaces, all-pairs mode:

```
Palette (light, surface #ffffff, categorical): 3 slots
  [PASS] Lightness band         all 3 inside L 0.43–0.77
  [PASS] Chroma floor           all 3 >= 0.1
  [PASS] CVD separation         worst all-pairs #1baf7a<->#eb6834 dE 9.2 (deutan) · tritan 9.6
  [PASS] Normal-vision floor    worst all-pairs #1baf7a<->#2a78d6 dE 24.0 (normal)
  [WARN] Contrast vs surface    below 3:1 — relief required: [["#1baf7a", 2.82]]

Palette (dark, surface #161a23, categorical): 3 slots
  [PASS] Lightness band         all 3 inside L 0.48–0.67
  [PASS] Chroma floor           all 3 >= 0.1
  [PASS] CVD separation         worst all-pairs #199e70<->#d95926 dE 9.4 (deutan) · tritan 4.0
  [PASS] Normal-vision floor    worst all-pairs #199e70<->#3987e5 dE 20.9 (normal)
  [PASS] Contrast vs surface    all 3 >= 3:1
```

The light-mode contrast warning is discharged by the relief rule: every bar in
a breakdown carries a direct value label, and the breakdown is a real `<table>`
whose numbers are available to assistive technology.

## Status chips are a separate problem

Alpha-tinting a status hue over the surface and then using the same hue for the
label produced text as low as **1.66:1** (amber "Pending"). Chips therefore use
explicit background / foreground / border triplets per state
(`--chip-good-*`, `--chip-info-*`, `--chip-warn-*`, `--chip-bad-*`,
`--chip-neutral-*`), each pair verified at ≥ 4.5:1 for 12px text in both
themes. Every chip also carries a glyph and a text label, so state is never
communicated by colour alone.

These failures were found by the automated axe-core pass
(`tests/e2e/accessibility.spec.ts`), not by inspection — which is the point of
having it.

## Also rejected

- **Dual-axis charts.** Revenue and order count are different scales; plotting
  them against two y-axes lets the author manufacture any apparent correlation
  by choosing the scaling. The trend card has a measure switcher instead, so
  there is always exactly one axis.
- **A pie or donut for the channel split.** Angle is harder to compare than
  length, and the ranked bar list carries the value, the share and the order
  count in the same row.
