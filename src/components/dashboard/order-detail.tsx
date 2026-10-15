"use client";

import { useQuery } from "@tanstack/react-query";

import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { fetchOrders } from "@/lib/api/client";
import { CHANNEL_LABELS, REGION_LABELS } from "@/lib/data/catalog";
import {
  formatCount,
  formatDateTime,
  formatMoneyMinorPrecise,
} from "@/lib/format";
import type { Order } from "@/types/domain";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-right text-xs font-medium text-ink">{value}</dd>
    </div>
  );
}

/**
 * Order detail with customer history.
 *
 * The history panel is a second, independently-cached query keyed by the
 * customer's email, and it is only issued while the dialog is open
 * (`enabled`). That keeps the table view from prefetching a request per row.
 */
export function OrderDetailDialog({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  const email = order?.customerEmail;

  const history = useQuery({
    queryKey: ["customer-history", email],
    enabled: Boolean(email),
    queryFn: ({ signal }) =>
      fetchOrders(
        new URLSearchParams({
          q: email ?? "",
          pageSize: "10",
          sort: "createdAt",
          dir: "desc",
        }).toString(),
        signal,
      ),
  });

  return (
    <Modal
      open={order !== null}
      onClose={onClose}
      title={order ? `Order ${order.id}` : "Order"}
      description="Synthetic demo record — no real customer data."
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {order ? (
        <div className="space-y-5">
          <section>
            <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
              Order
            </h3>
            <dl className="divide-y divide-line">
              <Row label="Status" value={<StatusBadge status={order.status} />} />
              <Row label="Created (UTC)" value={<span className="tabular">{formatDateTime(order.createdAt)}</span>} />
              <Row label="Channel" value={CHANNEL_LABELS[order.channel]} />
              <Row label="Region" value={REGION_LABELS[order.region]} />
              <Row label="Items" value={<span className="tabular">{formatCount(order.itemCount)}</span>} />
              <Row
                label="Total"
                value={
                  <span className="tabular text-sm">
                    {formatMoneyMinorPrecise(order.amountMinor)} {order.currency}
                  </span>
                }
              />
            </dl>
          </section>

          <section>
            <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
              Customer
            </h3>
            <dl className="divide-y divide-line">
              <Row label="Name" value={order.customerName} />
              <Row label="Email" value={<span className="font-mono">{order.customerEmail}</span>} />
            </dl>
          </section>

          <section>
            <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
              Recent orders from this customer
            </h3>
            {history.isPending ? (
              <div className="space-y-1.5">
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
                <Skeleton className="h-8" />
              </div>
            ) : history.isError ? (
              <ErrorState
                title="Couldn't load history"
                message={(history.error as Error).message}
                onRetry={() => void history.refetch()}
                retrying={history.isFetching}
              />
            ) : (
              <ul className="divide-y divide-line rounded-(--radius-control) border border-line">
                {history.data?.rows.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-3 px-2.5 py-2 text-xs"
                  >
                    <span className="font-mono text-muted">{row.id}</span>
                    <span className="tabular flex-1 text-subtle">
                      {formatDateTime(row.createdAt)}
                    </span>
                    <StatusBadge status={row.status} />
                    <span className="tabular w-20 text-right font-medium text-ink">
                      {formatMoneyMinorPrecise(row.amountMinor)}
                    </span>
                  </li>
                ))}
                {history.data && history.data.rows.length === 0 ? (
                  <li className="px-2.5 py-3 text-xs text-subtle">
                    No other orders found.
                  </li>
                ) : null}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </Modal>
  );
}
