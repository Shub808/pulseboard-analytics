/**
 * Presentation-layer formatting.
 *
 * All formatters pin an explicit locale and time zone. Letting them default to
 * the runtime's locale means server-rendered markup and the client's first
 * render disagree, which React reports as a hydration mismatch.
 */

const MONEY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const MONEY_PRECISE = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const COMPACT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const COUNT = new Intl.NumberFormat("en-US");

const DATE_SHORT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const DATE_TIME = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function formatMoneyMinor(minor: number): string {
  return MONEY.format(minor / 100);
}

export function formatMoneyMinorPrecise(minor: number): string {
  return MONEY_PRECISE.format(minor / 100);
}

export function formatMoneyCompact(minor: number): string {
  return `$${COMPACT.format(minor / 100)}`;
}

export function formatCount(value: number): string {
  return COUNT.format(value);
}

export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** Signed percentage for trend chips. `null` means "no prior period". */
export function formatDelta(ratio: number | null): string {
  if (ratio === null) return "n/a";
  const sign = ratio > 0 ? "+" : "";
  return `${sign}${(ratio * 100).toFixed(1)}%`;
}

export function formatDayShort(dayKey: string): string {
  return DATE_SHORT.format(new Date(`${dayKey}T00:00:00.000Z`));
}

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}

/** Inclusive day count between two YYYY-MM-DD keys. */
export function dayCount(from: string, to: string): number {
  const ms =
    new Date(`${to}T00:00:00.000Z`).getTime() -
    new Date(`${from}T00:00:00.000Z`).getTime();
  return Math.round(ms / 86_400_000) + 1;
}
