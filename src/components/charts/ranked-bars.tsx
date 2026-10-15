"use client";

import { formatCount, formatMoneyMinor, formatPercent } from "@/lib/format";
import type { BreakdownSlice } from "@/types/domain";

/**
 * Ranked bar list for a single measure across categories.
 *
 * Built from plain HTML rather than the charting library on purpose:
 *  - the categories are already identified by their labels, so painting each
 *    bar a different hue would add colour without adding information — one hue
 *    encodes the magnitude and nothing else;
 *  - every bar carries a direct value label, which is also the relief for the
 *    light-mode contrast warning on low-contrast series colours;
 *  - it is a real `<table>` underneath, so the numbers are available to screen
 *    readers and can be copied, which an SVG chart does not give you.
 */
export function RankedBars({
  slices,
  caption,
  emptyLabel = "No data in this range",
}: {
  slices: BreakdownSlice[];
  caption: string;
  emptyLabel?: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.revenueMinor, 0);
  const max = Math.max(...slices.map((slice) => slice.revenueMinor), 1);
  const visible = slices.filter((slice) => slice.orders > 0);

  if (visible.length === 0) {
    return <p className="py-6 text-center text-xs text-muted">{emptyLabel}</p>;
  }

  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">Category</th>
          <th scope="col">Revenue</th>
          <th scope="col">Share of revenue</th>
          <th scope="col">Orders</th>
        </tr>
      </thead>
      <tbody>
        {visible.map((slice) => {
          const share = total === 0 ? 0 : slice.revenueMinor / total;
          return (
            <tr key={slice.key} className="align-middle">
              <th
                scope="row"
                className="w-[38%] py-1.5 pr-3 text-left text-xs font-medium text-muted"
              >
                {slice.label}
              </th>
              <td className="py-1.5">
                <div
                  className="h-2.5 rounded-sm bg-viz-1"
                  style={{ width: `${Math.max((slice.revenueMinor / max) * 100, 1.5)}%` }}
                  role="presentation"
                />
              </td>
              <td className="tabular w-24 py-1.5 pl-3 text-right text-xs font-medium text-ink">
                {formatMoneyMinor(slice.revenueMinor)}
              </td>
              <td className="tabular w-14 py-1.5 pl-2 text-right text-xs text-subtle">
                {formatPercent(share, 0)}
              </td>
              <td className="tabular w-16 py-1.5 pl-2 text-right text-xs text-subtle">
                {formatCount(slice.orders)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
