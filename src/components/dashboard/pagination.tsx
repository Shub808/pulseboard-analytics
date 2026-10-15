"use client";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { formatCount } from "@/lib/format";
import { PAGE_SIZES } from "@/lib/query/schema";
import type { Paginated } from "@/types/domain";

export function Pagination<T>({
  page,
  onPageChange,
  onPageSizeChange,
}: {
  page: Paginated<T>;
  onPageChange: (next: number) => void;
  onPageSizeChange: (next: (typeof PAGE_SIZES)[number]) => void;
}) {
  const first = page.total === 0 ? 0 : (page.page - 1) * page.pageSize + 1;
  const last = Math.min(page.page * page.pageSize, page.total);

  return (
    <nav
      aria-label="Orders pagination"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3"
    >
      {/* `aria-live` so the row range is announced after a page change — a
          keyboard user otherwise gets no feedback that anything happened. */}
      <p className="tabular text-xs text-muted" aria-live="polite">
        {page.total === 0
          ? "No matching orders"
          : `${formatCount(first)}–${formatCount(last)} of ${formatCount(page.total)}`}
      </p>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-muted">
          Rows
          <Select
            className="h-8 w-20"
            value={page.pageSize}
            onChange={(event) =>
              onPageSizeChange(
                Number(event.target.value) as (typeof PAGE_SIZES)[number],
              )
            }
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </label>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            onClick={() => onPageChange(page.page - 1)}
            disabled={page.page <= 1}
            aria-label="Prev page"
          >
            Prev
          </Button>
          <span className="tabular px-1.5 text-xs text-muted">
            {page.page} / {page.pageCount}
          </span>
          <Button
            size="sm"
            onClick={() => onPageChange(page.page + 1)}
            disabled={page.page >= page.pageCount}
            aria-label="Next page"
          >
            Next
          </Button>
        </div>
      </div>
    </nav>
  );
}
