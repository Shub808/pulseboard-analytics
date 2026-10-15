"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ExportButton } from "@/components/dashboard/export-button";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { OrderDetailDialog } from "@/components/dashboard/order-detail";
import {
  ORDERS_TABLE_COLUMN_COUNT,
  OrdersTable,
} from "@/components/dashboard/orders-table";
import { Pagination } from "@/components/dashboard/pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/ui/states";
import { useDashboardState } from "@/hooks/use-dashboard-state";
import { fetchMeta, fetchOrders } from "@/lib/api/client";
import { formatCount } from "@/lib/format";
import type { Order } from "@/types/domain";

export function OrdersView() {
  const state = useDashboardState();
  const [selected, setSelected] = useState<Order | null>(null);

  const meta = useQuery({
    queryKey: ["meta"],
    queryFn: ({ signal }) => fetchMeta(signal),
    staleTime: Infinity,
  });

  const orders = useQuery({
    queryKey: ["orders", state.search],
    queryFn: ({ signal }) => fetchOrders(state.search, signal),
    // Pagination without this flashes an empty table between pages.
    placeholderData: (previous) => previous,
  });

  const page = orders.data;
  const isRefreshing = orders.isFetching && !orders.isPending;

  return (
    <div className="mx-auto flex max-w-[84rem] flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Orders</h1>
          <p className="text-xs text-muted">
            {page
              ? `${formatCount(page.total)} ${page.total === 1 ? "order matches" : "orders match"} the current filters`
              : "Loading orders…"}
          </p>
        </div>
        <ExportButton search={state.search} />
      </header>

      <FilterBar state={state} meta={meta.data} />

      <Card className="overflow-hidden">
        {orders.isError ? (
          <ErrorState
            title="Couldn't load orders"
            message={(orders.error as Error).message}
            onRetry={() => void orders.refetch()}
            retrying={orders.isFetching}
          />
        ) : orders.isPending ? (
          <table className="w-full border-collapse">
            <TableSkeleton columns={ORDERS_TABLE_COLUMN_COUNT} />
          </table>
        ) : page && page.rows.length === 0 ? (
          <EmptyState
            title="No orders match these filters"
            description="Try widening the date range or clearing a status, channel or region filter."
            action={
              state.activeFilterCount > 0 ? (
                <Button size="sm" variant="secondary" onClick={state.resetAll}>
                  Reset all filters
                </Button>
              ) : null
            }
          />
        ) : page ? (
          <>
            <OrdersTable
              orders={page.rows}
              sort={state.query.sort}
              dir={state.query.dir}
              onSort={state.setSort}
              onSelect={setSelected}
              busy={isRefreshing}
            />
            <Pagination
              page={page}
              onPageChange={state.setPage}
              onPageSizeChange={state.setPageSize}
            />
          </>
        ) : null}
      </Card>

      <p className="text-xs text-subtle">
        Demo mode: append <code>?simulate=error</code> or{" "}
        <code>?simulate=slow</code> to this URL to exercise the error and
        loading states against the real API.
      </p>

      <OrderDetailDialog order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
