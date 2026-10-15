import { dayKey, parseDayKey } from "@/lib/data/dataset";
import type { OrdersQuery, SortField } from "@/lib/query/schema";
import type { Order, Paginated } from "@/types/domain";

/**
 * The query engine. Pure functions over an in-memory array today; the same
 * signatures map cleanly onto SQL (`WHERE` / `ORDER BY` / `LIMIT OFFSET`) if
 * the dataset is ever moved behind a real database.
 *
 * Keeping this layer free of React, Next.js and `fetch` is what makes the
 * filtering rules cheap to unit-test.
 */

export function matchesSearch(order: Order, term: string): boolean {
  const needle = term.toLowerCase();
  return (
    order.id.toLowerCase().includes(needle) ||
    order.customerName.toLowerCase().includes(needle) ||
    order.customerEmail.toLowerCase().includes(needle)
  );
}

export function filterOrders(orders: Order[], query: OrdersQuery): Order[] {
  const statuses = new Set(query.status);
  const channels = new Set(query.channel);
  const regions = new Set(query.region);

  return orders.filter((order) => {
    const day = order.createdAt.slice(0, 10);
    if (query.from && day < query.from) return false;
    if (query.to && day > query.to) return false;
    if (statuses.size > 0 && !statuses.has(order.status)) return false;
    if (channels.size > 0 && !channels.has(order.channel)) return false;
    if (regions.size > 0 && !regions.has(order.region)) return false;
    if (
      query.minAmount !== undefined &&
      order.amountMinor < Math.round(query.minAmount * 100)
    ) {
      return false;
    }
    if (query.q && !matchesSearch(order, query.q)) return false;
    return true;
  });
}

const COMPARATORS: Record<SortField, (a: Order, b: Order) => number> = {
  createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt),
  customerName: (a, b) => a.customerName.localeCompare(b.customerName),
  amountMinor: (a, b) => a.amountMinor - b.amountMinor,
  itemCount: (a, b) => a.itemCount - b.itemCount,
  status: (a, b) => a.status.localeCompare(b.status),
  channel: (a, b) => a.channel.localeCompare(b.channel),
  region: (a, b) => a.region.localeCompare(b.region),
};

export function sortOrders(
  orders: Order[],
  sort: SortField,
  dir: "asc" | "desc",
): Order[] {
  const compare = COMPARATORS[sort];
  const sign = dir === "asc" ? 1 : -1;
  // `id` is the tiebreaker so the ordering is total and pagination is stable.
  return [...orders].sort((a, b) => {
    const primary = compare(a, b);
    if (primary !== 0) return primary * sign;
    return a.id.localeCompare(b.id) * sign;
  });
}

export function paginate<T>(
  rows: T[],
  page: number,
  pageSize: number,
): Paginated<T> {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  // Clamp rather than return an empty page: filters often shrink the result
  // set while the user is parked on page 7.
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    pageCount,
  };
}

export function queryOrders(
  orders: Order[],
  query: OrdersQuery,
): Paginated<Order> {
  const filtered = filterOrders(orders, query);
  const sorted = sortOrders(filtered, query.sort, query.dir);
  return paginate(sorted, query.page, query.pageSize);
}

/** Every matching row, ignoring pagination. Used by the CSV export route. */
export function queryAllOrders(orders: Order[], query: OrdersQuery): Order[] {
  return sortOrders(filterOrders(orders, query), query.sort, query.dir);
}

const DAY_MS = 86_400_000;

/**
 * The window of equal length immediately before `[from, to]`.
 *
 * Period-over-period comparison is the whole point of the KPI cards, and
 * getting the arithmetic wrong is the classic way to ship a dashboard that
 * lies. Both bounds are inclusive, so a 7-day window compares against the 7
 * days that end the day before `from`.
 */
export function previousWindow(
  from: string,
  to: string,
): { from: string; to: string } {
  const start = parseDayKey(from);
  const end = parseDayKey(to);
  const lengthDays = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  const prevEnd = new Date(start.getTime() - DAY_MS);
  const prevStart = new Date(prevEnd.getTime() - (lengthDays - 1) * DAY_MS);
  return { from: dayKey(prevStart), to: dayKey(prevEnd) };
}
