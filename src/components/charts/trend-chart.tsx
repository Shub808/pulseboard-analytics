"use client";

import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useVizColors } from "@/hooks/use-viz-colors";
import {
  formatCount,
  formatDayShort,
  formatMoneyCompact,
  formatMoneyMinor,
} from "@/lib/format";
import type { SeriesPoint } from "@/types/domain";

export type TrendMeasure = "revenue" | "orders";

interface MergedPoint {
  index: number;
  currentDate: string;
  previousDate: string | null;
  current: number;
  previous: number | null;
}

/**
 * Period-over-period trend.
 *
 * Two deliberate choices:
 *  - **One y-axis.** The measure switcher shows revenue *or* orders. A
 *    dual-axis chart (money on the left, counts on the right) lets the author
 *    pick any visual relationship they like by scaling the axes, so it is
 *    never used here.
 *  - **The comparison period is not a peer series.** It is drawn as a thin
 *    dashed neutral-grey line rather than a second categorical colour, because
 *    it is a reference, not a category. That also keeps the chart readable for
 *    colour-vision-deficient viewers without relying on hue.
 */
export function TrendChart({
  series,
  previousSeries,
  measure,
  height = 272,
}: {
  series: SeriesPoint[];
  previousSeries: SeriesPoint[];
  measure: TrendMeasure;
  height?: number;
}) {
  const colors = useVizColors();

  const data = useMemo<MergedPoint[]>(() => {
    const read = (point: SeriesPoint) =>
      measure === "revenue" ? point.revenueMinor : point.orders;
    return series.map((point, index) => {
      const prior = previousSeries[index];
      return {
        index,
        currentDate: point.date,
        previousDate: prior?.date ?? null,
        current: read(point),
        previous: prior ? read(prior) : null,
      };
    });
  }, [series, previousSeries, measure]);

  const formatValue =
    measure === "revenue" ? formatMoneyMinor : (v: number) => formatCount(v);
  const formatAxis =
    measure === "revenue" ? formatMoneyCompact : (v: number) => formatCount(v);

  // Sparse ticks: ~6 labels regardless of window length, so a 365-day range
  // doesn't turn the x-axis into a smear.
  const tickInterval = Math.max(0, Math.ceil(data.length / 6) - 1);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.series1} stopOpacity={0.28} />
              <stop offset="100%" stopColor={colors.series1} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {/* Horizontal rules only — vertical gridlines compete with the data. */}
          <CartesianGrid
            vertical={false}
            stroke={colors.grid}
            strokeDasharray="2 4"
          />
          <XAxis
            dataKey="index"
            tickFormatter={(index: number) =>
              formatDayShort(data[index]?.currentDate ?? "")
            }
            interval={tickInterval}
            tick={{ fill: colors.axis, fontSize: 11 }}
            axisLine={{ stroke: colors.grid }}
            tickLine={false}
            minTickGap={8}
          />
          <YAxis
            tickFormatter={formatAxis}
            tick={{ fill: colors.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={62}
          />
          <Tooltip
            cursor={{ stroke: colors.axis, strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as MergedPoint | undefined;
              if (!point) return null;
              return (
                <div className="rounded-(--radius-control) border border-line bg-surface-raised px-3 py-2 text-xs shadow-card">
                  <p className="font-semibold text-ink">
                    {formatDayShort(point.currentDate)}
                  </p>
                  <dl className="mt-1.5 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2 rounded-full"
                        style={{ background: colors.series1 }}
                      />
                      <dt className="text-muted">This period</dt>
                      <dd className="tabular ml-auto font-medium text-ink">
                        {formatValue(point.current)}
                      </dd>
                    </div>
                    {point.previous !== null ? (
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="h-0.5 w-2.5 rounded-full"
                          style={{ background: colors.comparison }}
                        />
                        <dt className="text-muted">
                          Previous
                          {point.previousDate
                            ? ` (${formatDayShort(point.previousDate)})`
                            : ""}
                        </dt>
                        <dd className="tabular ml-auto font-medium text-muted">
                          {formatValue(point.previous)}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="current"
            name="This period"
            stroke={colors.series1}
            strokeWidth={2}
            fill="url(#trend-fill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: colors.surface }}
          />
          <Line
            type="monotone"
            dataKey="previous"
            name="Previous period"
            stroke={colors.comparison}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            activeDot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * HTML legend. Kept out of the SVG so it inherits real text tokens and stays
 * selectable and screen-reader friendly.
 */
export function TrendLegend() {
  const colors = useVizColors();
  return (
    <ul className="flex flex-wrap items-center gap-4 text-xs text-muted">
      <li className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-2 rounded-full"
          style={{ background: colors.series1 }}
        />
        This period
      </li>
      <li className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="h-0.5 w-3 rounded-full"
          style={{ background: colors.comparison }}
        />
        Previous period
      </li>
    </ul>
  );
}
