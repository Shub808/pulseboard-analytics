"use client";

import { useTheme } from "@/components/theme-provider";
import { DARK_VIZ, LIGHT_VIZ, type VizPalette } from "@/lib/viz-palette";

/**
 * The chart palette for the active theme.
 *
 * A pure lookup, with no effect and no DOM read: the palette lives in
 * TypeScript (see `lib/viz-palette.ts`) and the CSS variables are generated
 * from it, so there is nothing to synchronise at runtime.
 */
export function useVizColors(): VizPalette {
  const { resolved } = useTheme();
  return resolved === "dark" ? DARK_VIZ : LIGHT_VIZ;
}

export type { VizPalette } from "@/lib/viz-palette";
