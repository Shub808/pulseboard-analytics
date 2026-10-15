import { describe, expect, it } from "vitest";

import { defaultRange, rangeRedirect } from "@/lib/query/defaults";
import { parseOrdersQuery } from "@/lib/query/schema";

/**
 * The query string is an untrusted input boundary: anybody can hand-edit the
 * URL. These tests pin the behaviour we rely on everywhere downstream —
 * defaults, coercion, rejection of junk, and the swap of a reversed range.
 */
describe("parseOrdersQuery", () => {
  it("applies defaults for an empty query", () => {
    const result = parseOrdersQuery({});
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.query).toMatchObject({
      sort: "createdAt",
      dir: "desc",
      page: 1,
      pageSize: 25,
      status: [],
      channel: [],
      region: [],
    });
    expect(result.query.q).toBeUndefined();
  });

  it("accepts repeated and comma-separated facet values and de-duplicates them", () => {
    const repeated = parseOrdersQuery({ status: ["paid", "paid", "refunded"] });
    const commaSeparated = parseOrdersQuery({ status: "paid,refunded" });
    expect(repeated.ok && repeated.query.status).toEqual(["paid", "refunded"]);
    expect(commaSeparated.ok && commaSeparated.query.status).toEqual([
      "paid",
      "refunded",
    ]);
  });

  it("silently drops facet values outside the allowed vocabulary", () => {
    const result = parseOrdersQuery({ channel: "web,not-a-channel" });
    expect(result.ok && result.query.channel).toEqual(["web"]);
  });

  it("coerces numeric params from strings", () => {
    const result = parseOrdersQuery({ page: "3", pageSize: "50", minAmount: "12.5" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.query.page).toBe(3);
    expect(result.query.pageSize).toBe(50);
    expect(result.query.minAmount).toBe(12.5);
  });

  it("rejects a pageSize that is not an offered option", () => {
    const result = parseOrdersQuery({ pageSize: "999" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((issue) => issue.path === "pageSize")).toBe(true);
  });

  it("rejects malformed and impossible dates", () => {
    expect(parseOrdersQuery({ from: "01-01-2026" }).ok).toBe(false);
    expect(parseOrdersQuery({ from: "2026-02-31" }).ok).toBe(false);
  });

  it("swaps a reversed date range instead of failing", () => {
    const result = parseOrdersQuery({ from: "2026-03-01", to: "2026-01-01" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.query.from).toBe("2026-01-01");
    expect(result.query.to).toBe("2026-03-01");
  });

  it("normalises a blank search term to undefined", () => {
    const result = parseOrdersQuery({ q: "   " });
    expect(result.ok && result.query.q).toBeUndefined();
  });

  it("parses URLSearchParams with repeated keys", () => {
    const params = new URLSearchParams();
    params.append("region", "apac");
    params.append("region", "emea");
    const result = parseOrdersQuery(params);
    expect(result.ok && result.query.region).toEqual(["apac", "emea"]);
  });
});

describe("default range redirect", () => {
  it("adds a 90-day window when the URL pins no range", () => {
    const target = rangeRedirect("/", new URLSearchParams());
    expect(target).toBe("/?from=2026-07-03&to=2026-09-30");
  });

  it("preserves existing parameters while adding the range", () => {
    const target = rangeRedirect("/orders", new URLSearchParams("status=paid&page=3"));
    expect(target).toContain("status=paid");
    expect(target).toContain("page=3");
    expect(target).toContain("from=2026-07-03");
  });

  it("does not redirect when a range is already present", () => {
    expect(
      rangeRedirect("/", new URLSearchParams("from=2026-01-01&to=2026-01-31")),
    ).toBeNull();
  });

  it("respects the explicit full-range opt-out", () => {
    expect(rangeRedirect("/", new URLSearchParams("all=1"))).toBeNull();
  });

  it("clamps the window to the start of the dataset", () => {
    const range = defaultRange({ from: "2026-09-01", to: "2026-09-30" }, 90);
    expect(range).toEqual({ from: "2026-09-01", to: "2026-09-30" });
  });
});
