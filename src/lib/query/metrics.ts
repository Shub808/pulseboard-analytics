import {
  CHANNEL_LABELS,
  REGION_LABELS,
} from "@/lib/data/catalog";
import { dayKey, parseDayKey } from "@/lib/data/dataset";
import { filterOrders, previousWindow } from "@/lib/query/orders";
import type { OrdersQuery } from "@/lib/query/schema";
import {
  CHANNELS,
  REGIONS,
  type BreakdownSlice,
  type KpiValue,
  type MetricsSummary,
  type Order,
  type SeriesPoint,
  type TrendDirection,
} from "@/types/domain";

const DAY_MS = 86_400_000;

/** Revenue counts money actually collected: refunds and cancellations don't. */
export function isRevenueBearing(order: Order): boolean {
  return order.status === "paid" || order.status === "shipped";
}

export function sumRevenueMinor(orders: Order[]): number {
  return orders.reduce(
    (total, order) => total + (isRevenueBearing(order) ? order.amountMinor : 0),
    0,
  );
}

/**
 * `lowerIsBetter` flips the semantics of the trend arrow: refund rate going
 * down is good news, and a dashboard that paints that red is worse than no
 * dashboard.
 */
export function toKpi(
  value: number,
  previousValue: number,
  options: { lowerIsBetter?: boolean } = {},
): KpiValue {
  const changeRatio =
    previousValue === 0 ? null : (value - previousValue) / previousValue;
  let direction: TrendDirection = "flat";
  if (changeRatio !== null && Math.abs(changeRatio) >= 0.0005) {
    const rising = changeRatio > 0;
    direction = options.lowerIsBetter
      ? rising
        ? "down"
        : "up"
      : rising
        ? "up"
        : "down";
  }
  return { value, previousValue, changeRatio, direction };
}

/**
 * Builds a dense daily series: every day in `[from, to]` gets a point, even
 * when no orders landed. Sparse series make charts lie about gaps.
 */
export function buildSeries(
  orders: Order[],
  from: string,
  to: string,
): SeriesPoint[] {
  const buckets = new Map<string, SeriesPoint>();
  const start = parseDayKey(from);
  const end = parseDayKey(to);
  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    const key = dayKey(new Date(t));
    buckets.set(key, { date: key, revenueMinor: 0, orders: 0 });
  }
  for (const order of orders) {
    const bucket = buckets.get(order.createdAt.slice(0, 10));
    if (!bucket) continue;
    bucket.orders += 1;
    if (isRevenueBearing(order)) bucket.revenueMinor += order.amountMinor;
  }
  return [...buckets.values()];
}

function breakdown<K extends string>(
  orders: Order[],
  keys: readonly K[],
  labels: Record<K, string>,
  keyOf: (order: Order) => K,
): BreakdownSlice[] {
  const totals = new Map<K, BreakdownSlice>(
    keys.map((key) => [
      key,
      { key, label: labels[key], revenueMinor: 0, orders: 0 },
    ]),
  );
  for (const order of orders) {
    const slice = totals.get(keyOf(order));
    if (!slice) continue;
    slice.orders += 1;
    if (isRevenueBearing(order)) slice.revenueMinor += order.amountMinor;
  }
  return [...totals.values()].sort((a, b) => b.revenueMinor - a.revenueMinor);
}

export function refundRate(orders: Order[]): number {
  if (orders.length === 0) return 0;
  const refunded = orders.filter((o) => o.status === "refunded").length;
  return refunded / orders.length;
}

export function averageOrderValueMinor(orders: Order[]): number {
  const paying = orders.filter(isRevenueBearing);
  if (paying.length === 0) return 0;
  return Math.round(sumRevenueMinor(paying) / paying.length);
}

/**
 * Computes the full KPI + chart payload for a query.
 *
 * The comparison period reuses the same filters (channel, region, search) and
 * only shifts the date window, so a channel-filtered view compares like with
 * like.
 */
export function computeMetrics(
  orders: Order[],
  query: OrdersQuery,
  bounds: { from: string; to: string },
): MetricsSummary {
  const from = query.from ?? bounds.from;
  const to = query.to ?? bounds.to;

  const current = filterOrders(orders, { ...query, from, to });
  const prevRange = previousWindow(from, to);
  const previous = filterOrders(orders, {
    ...query,
    from: prevRange.from,
    to: prevRange.to,
  });

  return {
    revenue: toKpi(sumRevenueMinor(current), sumRevenueMinor(previous)),
    orders: toKpi(current.length, previous.length),
    averageOrderValue: toKpi(
      averageOrderValueMinor(current),
      averageOrderValueMinor(previous),
    ),
    refundRate: toKpi(refundRate(current), refundRate(previous), {
      lowerIsBetter: true,
    }),
    series: buildSeries(current, from, to),
    previousSeries: buildSeries(previous, prevRange.from, prevRange.to),
    byChannel: breakdown(
      current,
      CHANNELS,
      CHANNEL_LABELS,
      (order) => order.channel,
    ),
    byRegion: breakdown(current, REGIONS, REGION_LABELS, (o) => o.region),
  };
}
