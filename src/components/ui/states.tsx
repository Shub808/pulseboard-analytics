"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-surface-muted", className)}
    />
  );
}

/**
 * Loading placeholder for a table body. Rendering the real row geometry (not a
 * single spinner) keeps the layout from jumping when data arrives.
 */
export function TableSkeleton({
  rows = 8,
  columns = 7,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <tbody>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={rowIndex} className="border-t border-line">
          {Array.from({ length: columns }, (_, colIndex) => (
            <td key={colIndex} className="px-3 py-3">
              <Skeleton
                className="h-3.5"
                // Varied widths read as content rather than as a grid of bars.
                />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div
        aria-hidden="true"
        className="mb-1 flex size-9 items-center justify-center rounded-full border border-line bg-surface-muted text-muted"
      >
        <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="9" cy="9" r="5.5" />
          <path d="m13 13 4 4" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? (
        <p className="max-w-sm text-xs text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retrying = false,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center"
    >
      <div
        aria-hidden="true"
        className="mb-1 flex size-9 items-center justify-center rounded-full border border-chip-bad-br bg-chip-bad-bg text-chip-bad-fg"
      >
        <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M10 6.5v5M10 14.2h.01" strokeLinecap="round" />
          <circle cx="10" cy="10" r="7.2" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {message ? (
        <p className="max-w-md text-xs text-muted">{message}</p>
      ) : null}
      {onRetry ? (
        <Button
          variant="secondary"
          size="sm"
          className="mt-2"
          onClick={onRetry}
          loading={retrying}
        >
          Try again
        </Button>
      ) : null}
    </div>
  );
}
