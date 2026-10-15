/**
 * Core domain types for PulseBoard.
 *
 * These types are the contract between the synthetic data layer, the
 * server-side query engine and the UI. They are intentionally free of any
 * framework or transport concerns.
 */

export const ORDER_STATUSES = [
  "paid",
  "pending",
  "shipped",
  "refunded",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CHANNELS = [
  "web",
  "mobile-app",
  "marketplace",
  "partner-api",
  "retail",
] as const;
export type Channel = (typeof CHANNELS)[number];

export const REGIONS = ["apac", "emea", "latam", "namer"] as const;
export type Region = (typeof REGIONS)[number];

export interface Order {
  id: string;
  /** ISO-8601 instant the order was created (UTC). */
  createdAt: string;
  customerName: string;
  customerEmail: string;
  channel: Channel;
  region: Region;
  status: OrderStatus;
  /** Order total in minor units (cents) to avoid floating point drift. */
  amountMinor: number;
  itemCount: number;
  /** ISO-4217 code. The demo dataset is single-currency by design. */
  currency: "USD";
}

/** A single point in a time series. `date` is a YYYY-MM-DD day key (UTC). */
export interface SeriesPoint {
  date: string;
  revenueMinor: number;
  orders: number;
}

export interface BreakdownSlice {
  key: string;
  label: string;
  revenueMinor: number;
  orders: number;
}

export type TrendDirection = "up" | "down" | "flat";

export interface KpiValue {
  /** Current-period value. Money values are minor units. */
  value: number;
  /** Same metric over the immediately preceding window of equal length. */
  previousValue: number;
  /** Fractional change vs. previous period, or null when previous is zero. */
  changeRatio: number | null;
  direction: TrendDirection;
}

export interface MetricsSummary {
  revenue: KpiValue;
  orders: KpiValue;
  averageOrderValue: KpiValue;
  refundRate: KpiValue;
  series: SeriesPoint[];
  previousSeries: SeriesPoint[];
  byChannel: BreakdownSlice[];
  byRegion: BreakdownSlice[];
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
