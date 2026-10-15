import { describe, expect, it } from "vitest";

import {
  averageOrderValueMinor,
  buildSeries,
  computeMetrics,
  isRevenueBearing,
  refundRate,
  sumRevenueMinor,
  toKpi,
} from "@/lib/query/metrics";
import { getDataset, datasetBounds } from "@/lib/data/dataset";
import { parseOrdersQuery, type OrdersQuery } from "@/lib/query/schema";
import type { Order } from "@/types/domain";

function order(partial: Partial<Order>): Order {
  return {
    id: "ORD-000001",
    createdAt: "2026-01-05T10:00:00.000Z",
    customerName: "Test Person",
    customerEmail: "test.person@example.com",
    channel: "web",
    region: "namer",
    status: "paid",
    amountMinor: 10_000,
    itemCount: 1,
    currency: "USD",
    ...partial,
  };
}

function q(overrides: Record<string, string> = {}): OrdersQuery {
  const parsed = parseOrdersQuery(overrides);
  if (!parsed.ok) throw new Error("invalid test query");
  return parsed.query;
}

describe("revenue recognition", () => {
  it("counts only paid and shipped orders as revenue", () => {
    expect(isRevenueBearing(order({ status: "paid" }))).toBe(true);
    expect(isRevenueBearing(order({ status: "shipped" }))).toBe(true);
    expect(isRevenueBearing(order({ status: "pending" }))).toBe(false);
    expect(isRevenueBearing(order({ status: "refunded" }))).toBe(false);
    expect(isRevenueBearing(order({ status: "cancelled" }))).toBe(false);
  });

  it("excludes non-revenue statuses from the total", () => {
    const rows = [
      order({ id: "a", status: "paid", amountMinor: 5_000 }),
      order({ id: "b", status: "shipped", amountMinor: 2_500 }),
      order({ id: "c", status: "refunded", amountMinor: 9_999 }),
      order({ id: "d", status: "cancelled", amountMinor: 1_000 }),
    ];
    expect(sumRevenueMinor(rows)).toBe(7_500);
  });

  it("averages over revenue-bearing orders only", () => {
    const rows = [
      order({ id: "a", status: "paid", amountMinor: 4_000 }),
      order({ id: "b", status: "paid", amountMinor: 6_000 }),
      order({ id: "c", status: "cancelled", amountMinor: 100_000 }),
    ];
    expect(averageOrderValueMinor(rows)).toBe(5_000);
  });

  it("returns zero rather than NaN for an empty set", () => {
    expect(averageOrderValueMinor([])).toBe(0);
    expect(refundRate([])).toBe(0);
    expect(sumRevenueMinor([])).toBe(0);
  });
});

describe("toKpi", () => {
  it("computes the fractional change", () => {
    expect(toKpi(120, 100).changeRatio).toBeCloseTo(0.2);
    expect(toKpi(80, 100).changeRatio).toBeCloseTo(-0.2);
  });

  it("reports null (not Infinity) when the previous period is zero", () => {
    const kpi = toKpi(50, 0);
    expect(kpi.changeRatio).toBeNull();
    expect(kpi.direction).toBe("flat");
  });

  it("inverts the direction for metrics where lower is better", () => {
    expect(toKpi(0.1, 0.2, { lowerIsBetter: true }).direction).toBe("up");
    expect(toKpi(0.3, 0.2, { lowerIsBetter: true }).direction).toBe("down");
    expect(toKpi(0.3, 0.2).direction).toBe("up");
  });

  it("treats sub-0.05% movement as flat", () => {
    expect(toKpi(1000.1, 1000).direction).toBe("flat");
  });
});

describe("buildSeries", () => {
  it("emits one dense point per day, including days with no orders", () => {
    const series = buildSeries(
      [order({ createdAt: "2026-01-02T12:00:00.000Z", amountMinor: 1_000 })],
      "2026-01-01",
      "2026-01-05",
    );
    expect(series.map((p) => p.date)).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
      "2026-01-05",
    ]);
    expect(series[1]).toMatchObject({ orders: 1, revenueMinor: 1_000 });
    expect(series[0]).toMatchObject({ orders: 0, revenueMinor: 0 });
  });

  it("counts a refunded order in volume but not in revenue", () => {
    const series = buildSeries(
      [order({ createdAt: "2026-01-01T01:00:00.000Z", status: "refunded", amountMinor: 7_000 })],
      "2026-01-01",
      "2026-01-01",
    );
    expect(series[0]).toMatchObject({ orders: 1, revenueMinor: 0 });
  });

  it("ignores orders outside the requested window", () => {
    const series = buildSeries(
      [order({ createdAt: "2025-12-31T23:00:00.000Z" })],
      "2026-01-01",
      "2026-01-02",
    );
    expect(series.every((p) => p.orders === 0)).toBe(true);
  });
});

describe("computeMetrics", () => {
  const dataset = getDataset();
  const bounds = datasetBounds();

  it("returns a series whose length matches the selected window", () => {
    const summary = computeMetrics(dataset, q({ from: "2026-06-01", to: "2026-06-30" }), bounds);
    expect(summary.series).toHaveLength(30);
    expect(summary.previousSeries).toHaveLength(30);
  });

  it("keeps the breakdowns consistent with total revenue", () => {
    const summary = computeMetrics(dataset, q({ from: "2026-06-01", to: "2026-06-30" }), bounds);
    const channelTotal = summary.byChannel.reduce((s, x) => s + x.revenueMinor, 0);
    const regionTotal = summary.byRegion.reduce((s, x) => s + x.revenueMinor, 0);
    expect(channelTotal).toBe(summary.revenue.value);
    expect(regionTotal).toBe(summary.revenue.value);
  });

  it("matches the series total against the headline revenue KPI", () => {
    const summary = computeMetrics(dataset, q({ from: "2026-05-01", to: "2026-05-31" }), bounds);
    const seriesTotal = summary.series.reduce((s, p) => s + p.revenueMinor, 0);
    expect(seriesTotal).toBe(summary.revenue.value);
  });

  it("applies the same non-date filters to the comparison period", () => {
    const filtered = computeMetrics(
      dataset,
      q({ from: "2026-06-01", to: "2026-06-30", channel: "retail" }),
      bounds,
    );
    const unfiltered = computeMetrics(
      dataset,
      q({ from: "2026-06-01", to: "2026-06-30" }),
      bounds,
    );
    // A channel-filtered view must compare like with like, so its previous
    // period total has to be strictly smaller than the unfiltered one.
    expect(filtered.revenue.previousValue).toBeLessThan(
      unfiltered.revenue.previousValue,
    );
    expect(filtered.byChannel.filter((s) => s.orders > 0)).toHaveLength(1);
  });

  it("sorts breakdowns by revenue, descending", () => {
    const summary = computeMetrics(dataset, q(), bounds);
    const values = summary.byChannel.map((s) => s.revenueMinor);
    expect([...values].sort((a, b) => b - a)).toEqual(values);
  });
});
