import { datasetBounds } from "@/lib/data/dataset";

/**
 * Default analysis window.
 *
 * An unbounded range looks tidy but makes the dashboard useless on arrival:
 * there is no earlier period to compare "the whole dataset" against, so every
 * KPI renders "n/a" and the trend chart shows a year of daily noise. The
 * landing view therefore defaults to the most recent 90 days *of the dataset*
 * — not of the wall clock, which would be empty for this fixed demo window.
 *
 * The default is materialised into the URL by a redirect, rather than applied
 * invisibly, so the range the numbers were computed from is always written
 * down and the view stays shareable.
 */
export const DEFAULT_WINDOW_DAYS = 90;

const DAY_MS = 86_400_000;

export function defaultRange(
  bounds = datasetBounds(),
  days = DEFAULT_WINDOW_DAYS,
): { from: string; to: string } {
  const end = new Date(`${bounds.to}T00:00:00.000Z`);
  const start = new Date(end.getTime() - (days - 1) * DAY_MS);
  const from = start.toISOString().slice(0, 10);
  return { from: from < bounds.from ? bounds.from : from, to: bounds.to };
}

/**
 * Returns the URL to redirect to when a range is missing, or `null` when the
 * incoming parameters already pin one down. Existing parameters are preserved.
 */
export function rangeRedirect(
  pathname: string,
  params: URLSearchParams,
): string | null {
  // `all=1` is the explicit opt-out used by the "Full range" control.
  if (params.get("all") === "1") return null;
  if (params.get("from") && params.get("to")) return null;

  const next = new URLSearchParams(params);
  const range = defaultRange();
  if (!next.get("from")) next.set("from", range.from);
  if (!next.get("to")) next.set("to", range.to);
  return `${pathname}?${next.toString()}`;
}
