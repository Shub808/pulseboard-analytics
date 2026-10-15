import { beforeAll, describe, expect, it } from "vitest";

import { getDataset } from "@/lib/data/dataset";
import {
  filterOrders,
  matchesSearch,
  paginate,
  previousWindow,
  queryOrders,
  sortOrders,
} from "@/lib/query/orders";
import { parseOrdersQuery, type OrdersQuery } from "@/lib/query/schema";
import type { Order } from "@/types/domain";

function query(overrides: Record<string, string | string[]> = {}): OrdersQuery {
  const parsed = parseOrdersQuery(overrides);
  if (!parsed.ok) throw new Error(`Invalid test query: ${JSON.stringify(parsed.issues)}`);
  return parsed.query;
}

let orders: Order[];

beforeAll(() => {
  orders = getDataset();
});

describe("dataset", () => {
  it("is deterministic across calls", () => {
    const a = getDataset();
    const b = getDataset();
    expect(a.length).toBe(b.length);
    expect(a[0]).toEqual(b[0]);
    expect(a.at(-1)).toEqual(b.at(-1));
  });

  it("is sorted newest-first and spans the documented window", () => {
    expect(orders.length).toBeGreaterThan(5_000);
    expect(orders[0]!.createdAt >= orders.at(-1)!.createdAt).toBe(true);
    expect(orders.at(-1)!.createdAt.slice(0, 10)).toBe("2025-10-01");
    expect(orders[0]!.createdAt.slice(0, 10)).toBe("2026-09-30");
  });

  it("contains no real email domains", () => {
    expect(orders.every((order) => order.customerEmail.endsWith("@example.com"))).toBe(true);
  });
});

describe("filterOrders", () => {
  it("restricts to the inclusive date range", () => {
    const filtered = filterOrders(orders, query({ from: "2026-01-01", to: "2026-01-31" }));
    expect(filtered.length).toBeGreaterThan(0);
    for (const order of filtered) {
      const day = order.createdAt.slice(0, 10);
      expect(day >= "2026-01-01").toBe(true);
      expect(day <= "2026-01-31").toBe(true);
    }
  });

  it("treats multiple facet values as OR within a facet", () => {
    const filtered = filterOrders(orders, query({ status: "paid,refunded" }));
    expect(new Set(filtered.map((o) => o.status))).toEqual(new Set(["paid", "refunded"]));
  });

  it("treats different facets as AND", () => {
    const filtered = filterOrders(orders, query({ status: "paid", channel: "retail" }));
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((o) => o.status === "paid" && o.channel === "retail")).toBe(true);
  });

  it("applies minAmount in major units against minor-unit data", () => {
    const filtered = filterOrders(orders, query({ minAmount: "1000" }));
    expect(filtered.every((o) => o.amountMinor >= 100_000)).toBe(true);
  });

  it("searches id, name and email case-insensitively", () => {
    const sample = orders[42]!;
    expect(matchesSearch(sample, sample.id.toLowerCase())).toBe(true);
    expect(matchesSearch(sample, sample.customerName.toUpperCase())).toBe(true);
    expect(matchesSearch(sample, sample.customerEmail)).toBe(true);
    expect(matchesSearch(sample, "zzz-definitely-not-present")).toBe(false);
  });
});

describe("sortOrders", () => {
  it("sorts ascending and descending by amount", () => {
    const asc = sortOrders(orders.slice(0, 200), "amountMinor", "asc");
    const desc = sortOrders(orders.slice(0, 200), "amountMinor", "desc");
    expect(asc[0]!.amountMinor).toBeLessThanOrEqual(asc.at(-1)!.amountMinor);
    expect(desc[0]!.amountMinor).toBeGreaterThanOrEqual(desc.at(-1)!.amountMinor);
  });

  it("does not mutate the input array", () => {
    const input = orders.slice(0, 50);
    const snapshot = input.map((o) => o.id);
    sortOrders(input, "customerName", "asc");
    expect(input.map((o) => o.id)).toEqual(snapshot);
  });

  it("produces a total order so pagination is stable", () => {
    // Sorting by a low-cardinality column is where unstable sorts leak rows
    // between pages; `id` is the documented tiebreaker.
    const sorted = sortOrders(orders.slice(0, 500), "status", "asc");
    const pageOne = sorted.slice(0, 25).map((o) => o.id);
    const again = sortOrders(orders.slice(0, 500), "status", "asc")
      .slice(0, 25)
      .map((o) => o.id);
    expect(again).toEqual(pageOne);
  });
});

describe("paginate", () => {
  const rows = Array.from({ length: 57 }, (_, index) => index);

  it("reports the correct page count and slices the window", () => {
    const page = paginate(rows, 2, 25);
    expect(page.pageCount).toBe(3);
    expect(page.total).toBe(57);
    expect(page.rows).toEqual(rows.slice(25, 50));
  });

  it("clamps a page beyond the end rather than returning nothing", () => {
    const page = paginate(rows, 99, 25);
    expect(page.page).toBe(3);
    expect(page.rows.length).toBe(7);
  });

  it("handles an empty result set", () => {
    const page = paginate([], 1, 25);
    expect(page).toMatchObject({ total: 0, pageCount: 1, page: 1 });
    expect(page.rows).toEqual([]);
  });
});

describe("previousWindow", () => {
  it("returns the equal-length window immediately before the range", () => {
    expect(previousWindow("2026-01-08", "2026-01-14")).toEqual({
      from: "2026-01-01",
      to: "2026-01-07",
    });
  });

  it("handles a single-day range", () => {
    expect(previousWindow("2026-03-02", "2026-03-02")).toEqual({
      from: "2026-03-01",
      to: "2026-03-01",
    });
  });

  it("crosses a month boundary correctly", () => {
    expect(previousWindow("2026-03-01", "2026-03-31")).toEqual({
      from: "2026-01-29",
      to: "2026-02-28",
    });
  });
});

describe("queryOrders", () => {
  it("filters, sorts and paginates together", () => {
    const page = queryOrders(
      orders,
      query({ status: "paid", sort: "amountMinor", dir: "desc", pageSize: "10" }),
    );
    expect(page.rows).toHaveLength(10);
    expect(page.rows.every((o) => o.status === "paid")).toBe(true);
    for (let i = 1; i < page.rows.length; i += 1) {
      expect(page.rows[i - 1]!.amountMinor).toBeGreaterThanOrEqual(
        page.rows[i]!.amountMinor,
      );
    }
  });

  it("never returns overlapping rows across consecutive pages", () => {
    const first = queryOrders(orders, query({ page: "1", pageSize: "50" }));
    const second = queryOrders(orders, query({ page: "2", pageSize: "50" }));
    const ids = new Set(first.rows.map((o) => o.id));
    expect(second.rows.some((o) => ids.has(o.id))).toBe(false);
  });
});
