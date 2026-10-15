"use client";

import { StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { CHANNEL_LABELS, REGION_LABELS } from "@/lib/data/catalog";
import { formatCount, formatDateTime, formatMoneyMinorPrecise } from "@/lib/format";
import type { SortField } from "@/lib/query/schema";
import type { Order } from "@/types/domain";

interface Column {
  field: SortField | null;
  label: string;
  align?: "right";
  className?: string;
}

const COLUMNS: Column[] = [
  { field: "createdAt", label: "Created" },
  { field: "customerName", label: "Customer" },
  { field: "channel", label: "Channel", className: "hidden md:table-cell" },
  { field: "region", label: "Region", className: "hidden lg:table-cell" },
  { field: "status", label: "Status" },
  { field: "itemCount", label: "Items", align: "right", className: "hidden sm:table-cell" },
  { field: "amountMinor", label: "Amount", align: "right" },
];

/**
 * Orders table.
 *
 * Accessibility details that are easy to skip and expensive to retrofit:
 *  - sortable headers are real `<button>`s inside `<th scope="col">`, and the
 *    header carries `aria-sort` so screen readers announce the current order;
 *  - each row has one focusable control (the order ID button) rather than a
 *    click handler on `<tr>`, so the row is reachable by keyboard and
 *    announced as an action;
 *  - `aria-busy` marks the table while a background refetch is in flight, and
 *    the stale rows stay visible instead of collapsing to a spinner.
 */
export function OrdersTable({
  orders,
  sort,
  dir,
  onSort,
  onSelect,
  busy = false,
}: {
  orders: Order[];
  sort: SortField;
  dir: "asc" | "desc";
  onSort: (field: SortField) => void;
  onSelect: (order: Order) => void;
  busy?: boolean;
}) {
  return (
    // A horizontally scrollable region has to be focusable, otherwise a
    // keyboard-only user cannot scroll it (axe: scrollable-region-focusable).
    <div
      className="overflow-x-auto"
      tabIndex={0}
      role="group"
      aria-label="Orders table, scrolls horizontally"
    >
      <table
        className="w-full min-w-[46rem] border-collapse text-sm"
        aria-busy={busy || undefined}
      >
        <caption className="sr-only">
          Orders matching the current filters. Column headers are buttons that
          change the sort order.
        </caption>
        <thead>
          <tr className="bg-surface-muted/60">
            {COLUMNS.map((column) => {
              const active = column.field !== null && column.field === sort;
              return (
                <th
                  key={column.label}
                  scope="col"
                  aria-sort={
                    active
                      ? dir === "asc"
                        ? "ascending"
                        : "descending"
                      : column.field
                        ? "none"
                        : undefined
                  }
                  className={cn(
                    "border-b border-line px-3 py-2 text-left text-xs font-semibold text-muted",
                    column.align === "right" && "text-right",
                    column.className,
                  )}
                >
                  {column.field ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.field as SortField)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-sm hover:text-ink",
                        column.align === "right" && "flex-row-reverse",
                        active && "text-ink",
                      )}
                    >
                      {column.label}
                      <span aria-hidden="true" className="text-[0.625rem]">
                        {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="border-b border-line last:border-0 hover:bg-surface-muted/60"
            >
              <td className="px-3 py-2.5 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onSelect(order)}
                  className="group flex flex-col items-start text-left"
                >
                  <span className="font-mono text-xs font-medium text-brand-600 group-hover:underline dark:text-brand-300">
                    {order.id}
                  </span>
                  <span className="tabular text-xs text-subtle">
                    {formatDateTime(order.createdAt)}
                  </span>
                  <span className="sr-only">View order details</span>
                </button>
              </td>
              <td className="max-w-[14rem] px-3 py-2.5">
                <span className="block truncate text-ink">
                  {order.customerName}
                </span>
                <span className="block truncate text-xs text-subtle">
                  {order.customerEmail}
                </span>
              </td>
              <td className="hidden px-3 py-2.5 text-muted md:table-cell">
                {CHANNEL_LABELS[order.channel]}
              </td>
              <td className="hidden px-3 py-2.5 text-muted lg:table-cell">
                {REGION_LABELS[order.region]}
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge status={order.status} />
              </td>
              <td className="tabular hidden px-3 py-2.5 text-right text-muted sm:table-cell">
                {formatCount(order.itemCount)}
              </td>
              <td className="tabular px-3 py-2.5 text-right font-medium text-ink">
                {formatMoneyMinorPrecise(order.amountMinor)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const ORDERS_TABLE_COLUMN_COUNT = COLUMNS.length;
