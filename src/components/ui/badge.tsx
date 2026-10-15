import { cn } from "@/lib/cn";
import { STATUS_LABELS } from "@/lib/data/catalog";
import type { OrderStatus } from "@/types/domain";

/**
 * Each status maps to a background/foreground/border token triplet rather than
 * an alpha tint of the status hue. Tinting the surface and reusing the hue for
 * the label produced text as low as 1.7:1, which the axe-core pass rejects.
 */
const STATUS_STYLES: Record<OrderStatus, string> = {
  paid: "bg-chip-good-bg text-chip-good-fg border-chip-good-br",
  shipped: "bg-chip-info-bg text-chip-info-fg border-chip-info-br",
  pending: "bg-chip-warn-bg text-chip-warn-fg border-chip-warn-br",
  refunded: "bg-chip-bad-bg text-chip-bad-fg border-chip-bad-br",
  cancelled: "bg-chip-neutral-bg text-chip-neutral-fg border-chip-neutral-br",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-line bg-surface-muted px-2 py-0.5 text-xs text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
