"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { RankedBars } from "@/components/charts/ranked-bars";
import { TrendChart, TrendLegend, type TrendMeasure } from "@/components/charts/trend-chart";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { KpiCard, KpiCardSkeleton } from "@/components/dashboard/kpi-card";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { useDashboardState } from "@/hooks/use-dashboard-state";
import { fetchMeta, fetchMetrics } from "@/lib/api/client";
import {
  dayCount,
  formatCount,
  formatMoneyMinor,
  formatMoneyMinorPrecise,
  formatPercent,
} from "@/lib/format";

const MEASURES: { id: TrendMeasure; label: string }[] = [
  { id: "revenue", label: "Revenue" },
  { id: "orders", label: "Orders" },
];

export function Overview() {
  const state = useDashboardState();
  const [measure, setMeasure] = useState<TrendMeasure>("revenue");

  const meta = useQuery({
    queryKey: ["meta"],
    queryFn: ({ signal }) => fetchMeta(signal),
    staleTime: Infinity,
  });

  const metrics = useQuery({
    queryKey: ["metrics", state.search],
    queryFn: ({ signal }) => fetchMetrics(state.search, signal),
    // Keep the previous window's numbers on screen while the new ones load, so
    // changing a filter doesn't flash the whole page back to skeletons.
    placeholderData: (previous) => previous,
  });

  const range =
    state.query.from && state.query.to
      ? `${state.query.from} → ${state.query.to} (${dayCount(state.query.from, state.query.to)} days)`
      : meta.data
        ? `Full dataset: ${meta.data.bounds.from} → ${meta.data.bounds.to}`
        : "Full dataset";

  const summary = metrics.data;

  return (
    <div className="mx-auto flex max-w-[84rem] flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-ink">Operations overview</h1>
        <p className="text-xs text-muted">{range}</p>
      </header>

      <FilterBar state={state} meta={meta.data} />

      {metrics.isError ? (
        <Card>
          <ErrorState
            title="Couldn't load metrics"
            message={(metrics.error as Error).message}
            onRetry={() => void metrics.refetch()}
            retrying={metrics.isFetching}
          />
        </Card>
      ) : (
        <>
          <section
            aria-label="Key performance indicators"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            {!summary ? (
              <>
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
              </>
            ) : (
              <>
                <KpiCard
                  label="Revenue"
                  value={formatMoneyMinor(summary.revenue.value)}
                  kpi={summary.revenue}
                  previousFormatted={formatMoneyMinor(summary.revenue.previousValue)}
                  hint="Paid and shipped orders only."
                />
                <KpiCard
                  label="Orders"
                  value={formatCount(summary.orders.value)}
                  kpi={summary.orders}
                  previousFormatted={formatCount(summary.orders.previousValue)}
                  hint="All statuses, including refunds."
                />
                <KpiCard
                  label="Avg. order value"
                  value={formatMoneyMinorPrecise(summary.averageOrderValue.value)}
                  kpi={summary.averageOrderValue}
                  previousFormatted={formatMoneyMinorPrecise(
                    summary.averageOrderValue.previousValue,
                  )}
                  hint="Revenue ÷ revenue-bearing orders."
                />
                <KpiCard
                  label="Refund rate"
                  value={formatPercent(summary.refundRate.value)}
                  kpi={summary.refundRate}
                  previousFormatted={formatPercent(summary.refundRate.previousValue)}
                  hint="Lower is better."
                />
              </>
            )}
          </section>

          <Card>
            <CardHeader
              title={measure === "revenue" ? "Revenue over time" : "Orders over time"}
              description="Compared with the immediately preceding window of equal length."
              action={
                <div
                  role="radiogroup"
                  aria-label="Trend measure"
                  className="flex rounded-(--radius-control) border border-line p-0.5"
                >
                  {MEASURES.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={measure === option.id}
                      onClick={() => setMeasure(option.id)}
                      className={
                        measure === option.id
                          ? "rounded-sm bg-brand-600 px-2.5 py-1 text-xs font-medium text-white"
                          : "rounded-sm px-2.5 py-1 text-xs text-muted hover:text-ink"
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              }
            />
            <CardBody>
              {!summary ? (
                <Skeleton className="h-[272px] w-full" />
              ) : summary.series.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted">
                  No data in the selected range.
                </p>
              ) : (
                <>
                  <TrendLegend />
                  <div className="mt-2">
                    <TrendChart
                      series={summary.series}
                      previousSeries={summary.previousSeries}
                      measure={measure}
                    />
                  </div>
                </>
              )}
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Revenue by channel"
                description="Share of revenue in the selected range."
                as="h3"
              />
              <CardBody>
                {!summary ? (
                  <Skeleton className="h-36 w-full" />
                ) : (
                  <RankedBars
                    slices={summary.byChannel}
                    caption="Revenue, share of revenue and order count by sales channel"
                  />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Revenue by region"
                description="Share of revenue in the selected range."
                as="h3"
              />
              <CardBody>
                {!summary ? (
                  <Skeleton className="h-36 w-full" />
                ) : (
                  <RankedBars
                    slices={summary.byRegion}
                    caption="Revenue, share of revenue and order count by region"
                  />
                )}
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted">
                Want the row-level data behind these numbers?
              </p>
              <Link
                href={`/orders?${state.search}`}
                className="inline-flex h-8 items-center rounded-(--radius-control) bg-brand-600 px-3 text-xs font-medium text-white transition-colors hover:bg-brand-700"
              >
                Open orders table with these filters
              </Link>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
