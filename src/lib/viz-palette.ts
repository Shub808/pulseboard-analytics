/**
 * Chart palette — the single source of truth.
 *
 * These values are consumed twice: directly by Recharts (which needs concrete
 * colours, because `var()` is not reliably resolved inside SVG presentation
 * attributes) and as CSS custom properties emitted into the document by
 * {@link vizPaletteCss} (so Tailwind utilities such as `bg-viz-1` and the
 * design-system swatches stay in step).
 *
 * Defining them in TypeScript and generating the CSS — rather than declaring
 * them in both places — is what keeps the two from drifting apart.
 *
 * Both modes were validated as their own palette against their own surface
 * (lightness band, chroma floor, CVD separation, normal-vision separation and
 * surface contrast). The recorded validator output is in
 * docs/adr/0004-chart-colour-system.md. Dark is a *selected* set of steps, not
 * an inversion of light.
 */

export interface VizPalette {
  /** Primary data colour: single-measure bars and the current-period series. */
  series1: string;
  series2: string;
  series3: string;
  /**
   * The comparison period. Deliberately a neutral grey rather than a second
   * categorical hue — it is a reference, not a peer series.
   */
  comparison: string;
  /** Recessive gridlines. */
  grid: string;
  /** Axis tick labels. */
  axis: string;
  /** Chart surface, used for the ring around overlapping marks. */
  surface: string;
}

export const LIGHT_VIZ: VizPalette = {
  series1: "#2a78d6",
  series2: "#eb6834",
  series3: "#1baf7a",
  comparison: "#8c9099",
  grid: "#dcdee2",
  axis: "#4d535e",
  surface: "#ffffff",
};

export const DARK_VIZ: VizPalette = {
  series1: "#3987e5",
  series2: "#d95926",
  series3: "#199e70",
  comparison: "#767b85",
  grid: "#2d323d",
  axis: "#a6abb5",
  surface: "#161a23",
};

const CSS_VARS: (keyof VizPalette)[] = [
  "series1",
  "series2",
  "series3",
  "comparison",
];

const CSS_NAMES: Record<string, string> = {
  series1: "--viz-1",
  series2: "--viz-2",
  series3: "--viz-3",
  comparison: "--viz-comparison",
};

function declarations(palette: VizPalette): string {
  return CSS_VARS.map((key) => `${CSS_NAMES[key]}:${palette[key]}`).join(";");
}

/**
 * The stylesheet injected into `<head>`. Generated from the objects above so
 * the CSS can never disagree with what Recharts is handed.
 */
export const vizPaletteCss = `:root{${declarations(LIGHT_VIZ)}}.dark{${declarations(DARK_VIZ)}}`;
