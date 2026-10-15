import { describe, expect, it } from "vitest";

import { GET as getMeta } from "@/app/api/meta/route";
import { GET as getMetrics } from "@/app/api/metrics/route";
import { GET as getOrders } from "@/app/api/orders/route";
import { GET as getExport } from "@/app/api/orders/export/route";
import type { MetricsSummary, Order, Paginated } from "@/types/domain";

/**
 * Route-handler integration tests.
 *
 * The handlers are plain `(Request) => Response` functions, so they can be
 * invoked directly with a real `Request` — no dev server, no HTTP, no mocking
 * of Next internals. That covers the whole request path: query validation,
 * the query engine, serialisation and headers.
 */
const BASE = "http://localhost:3000";

function req(path: string): Request {
  return new Request(`${BASE}${path}`);
}

describe("GET /api/orders", () => {
  it("returns the first page with defaults", async () => {
    const response = await getOrders(req("/api/orders"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = (await response.json()) as Paginated<Order>;
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(25);
    expect(body.rows).toHaveLength(25);
    expect(body.total).toBeGreaterThan(1_000);
  });

  it("honours filters, sort and pagination from the query string", async () => {
    const response = await getOrders(
      req("/api/orders?status=paid&channel=retail&sort=amountMinor&dir=desc&pageSize=10&page=2"),
    );
    const body = (await response.json()) as Paginated<Order>;
    expect(body.page).toBe(2);
    expect(body.rows).toHaveLength(10);
    expect(body.rows.every((row) => row.status === "paid")).toBe(true);
    expect(body.rows.every((row) => row.channel === "retail")).toBe(true);
  });

  it("rejects an invalid query with 400 and machine-readable issues", async () => {
    const response = await getOrders(req("/api/orders?pageSize=7&from=not-a-date"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("invalid_query");
    expect(body.error.issues.map((i: { path: string }) => i.path)).toEqual(
      expect.arrayContaining(["pageSize", "from"]),
    );
  });

  it("surfaces the simulated failure used to exercise the UI error state", async () => {
    const response = await getOrders(req("/api/orders?simulate=error"));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("simulated_failure");
  });
});

describe("GET /api/metrics", () => {
  it("returns KPIs and a dense series for the requested window", async () => {
    const response = await getMetrics(
      req("/api/metrics?from=2026-06-01&to=2026-06-30"),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as MetricsSummary;
    expect(body.series).toHaveLength(30);
    expect(body.previousSeries).toHaveLength(30);
    expect(body.revenue.value).toBeGreaterThan(0);
    expect(body.byChannel.length).toBeGreaterThan(0);
    expect(body.refundRate.value).toBeGreaterThanOrEqual(0);
    expect(body.refundRate.value).toBeLessThan(1);
  });

  it("returns zeroed KPIs rather than erroring for a range with no data", async () => {
    const response = await getMetrics(
      req("/api/metrics?from=2026-09-29&to=2026-09-30&channel=retail&q=zzz-no-match"),
    );
    const body = (await response.json()) as MetricsSummary;
    expect(body.revenue.value).toBe(0);
    expect(body.orders.value).toBe(0);
    expect(body.series).toHaveLength(2);
  });
});

describe("GET /api/orders/export", () => {
  it("serves a CSV attachment whose rows match the filter", async () => {
    const response = await getExport(
      req("/api/orders/export?status=refunded&from=2026-09-01&to=2026-09-30"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toMatch(
      /attachment; filename="pulseboard-orders-.*\.csv"/,
    );

    const text = await response.text();
    const lines = text.trimEnd().split("\r\n");
    expect(lines[0]).toBe(
      "Order ID,Created (UTC),Customer,Email,Channel,Region,Status,Items,Amount (USD)",
    );
    const exported = Number(response.headers.get("x-rows-exported"));
    expect(lines).toHaveLength(exported + 1);
    expect(lines.slice(1).every((line) => line.includes("Refunded"))).toBe(true);
  });

  it("reports whether the row cap truncated the export", async () => {
    const response = await getExport(req("/api/orders/export"));
    expect(response.headers.get("x-truncated")).toBe("false");
    expect(Number(response.headers.get("x-total-matching"))).toBeGreaterThan(0);
  });
});

describe("GET /api/meta", () => {
  it("advertises the demo dataset and the facet vocabulary", async () => {
    const response = getMeta();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.demoData).toBe(true);
    expect(body.notice).toMatch(/synthetic/i);
    expect(body.facets.status.length).toBe(5);
    expect(body.facets.channel.length).toBe(5);
    expect(body.facets.region.length).toBe(4);
    expect(body.bounds.from < body.bounds.to).toBe(true);
  });
});
