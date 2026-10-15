import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatDelta } from "@/lib/format";
import { Skeleton } from "@/components/ui/states";
import type { KpiValue } from "@/types/domain";

const DIRECTION_STYLES = {
  up: "border-chip-good-br bg-chip-good-bg text-chip-good-fg",
  down: "border-chip-bad-br bg-chip-bad-bg text-chip-bad-fg",
  flat: "border-chip-neutral-br bg-chip-neutral-bg text-chip-neutral-fg",
} as const;

/**
 * Trend chip.
 *
 * Carries an arrow glyph and a readable label in addition to the colour, so the
 * direction survives greyscale printing, colour-vision deficiency and
 * forced-colors mode. `direction` is already polarity-corrected upstream (for
 * refund rate, "down" is the good news), which is why the arrow is derived
 * from the raw ratio and the colour from the direction.
 */
function DeltaChip({ kpi, comparisonLabel }: { kpi: KpiValue; comparisonLabel: string }) {
  const rising = kpi.changeRatio !== null && kpi.changeRatio > 0;
  const flat = kpi.direction === "flat";
  return (
    <span
      // Exposed for tests and for debugging: the polarity decision is
      // business logic, so it should be assertable without reading classes.
      data-direction={kpi.direction}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs font-medium",
        DIRECTION_STYLES[kpi.direction],
      )}
    >
      <span aria-hidden="true">{flat ? "→" : rising ? "↑" : "↓"}</span>
      <span className="tabular">{formatDelta(kpi.changeRatio)}</span>
      <span className="sr-only">{comparisonLabel}</span>
    </span>
  );
}

export interface KpiCardProps {
  label: string;
  value: string;
  kpi: KpiValue;
  previousFormatted: string;
  /** Short explanation of how the metric is computed. */
  hint?: string;
}

export function KpiCard({
  label,
  value,
  kpi,
  previousFormatted,
  hint,
}: KpiCardProps) {
  return (
    <Card className="px-4 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">
          {label}
        </p>
        <DeltaChip
          kpi={kpi}
          comparisonLabel={`compared with the previous period (${previousFormatted})`}
        />
      </div>
      <p className="tabular mt-2 text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs text-subtle">
        vs <span className="tabular">{previousFormatted}</span> previous period
      </p>
      {hint ? <p className="mt-1.5 text-xs text-subtle">{hint}</p> : null}
    </Card>
  );
}

export function KpiCardSkeleton() {
  return (
    <Card className="px-4 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-7 w-28" />
      <Skeleton className="mt-2 h-3 w-36" />
    </Card>
  );
}
