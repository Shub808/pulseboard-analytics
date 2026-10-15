"use client";

import { useEffect, useState } from "react";

import { DateRangeControl } from "@/components/dashboard/date-range";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/badge";
import { CheckboxRow, Field, TextInput } from "@/components/ui/field";
import { Popover } from "@/components/ui/popover";
import type { DatasetMeta } from "@/lib/api/client";
import type { DashboardState } from "@/hooks/use-dashboard-state";

const FACETS = [
  { key: "status", label: "Status" },
  { key: "channel", label: "Channel" },
  { key: "region", label: "Region" },
] as const;

/**
 * Search input with debounce.
 *
 * Every keystroke would otherwise push a new URL and fire a request. 300 ms is
 * long enough to coalesce typing and short enough to feel immediate; the input
 * stays fully controlled locally so the caret never jumps while the debounce is
 * pending.
 */
function SearchBox({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (term: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [committed, setCommitted] = useState(value);

  // React's documented pattern for resetting local state when a prop changes:
  // adjust during render rather than in an effect, so there is no extra
  // render pass and no stale frame on the screen.
  if (value !== committed) {
    setCommitted(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onCommit(draft), 300);
    return () => clearTimeout(timer);
  }, [draft, value, onCommit]);

  return (
    <Field label="Search orders" hideLabel className="w-full sm:w-64">
      {({ id }) => (
        <div className="relative">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <circle cx="9" cy="9" r="5.5" />
            <path d="m13.2 13.2 3.3 3.3" strokeLinecap="round" />
          </svg>
          <TextInput
            id={id}
            type="search"
            className="pl-8"
            placeholder="Order ID, name or email"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
      )}
    </Field>
  );
}

export function FilterBar({
  state,
  meta,
}: {
  state: DashboardState;
  meta: DatasetMeta | undefined;
}) {
  const bounds = meta?.bounds ?? { from: "", to: "" };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={state.query.q ?? ""} onCommit={state.setSearchTerm} />

        {meta ? (
          <DateRangeControl
            value={{ from: state.query.from, to: state.query.to }}
            bounds={bounds}
            onChange={({ from, to }) => state.setDateRange(from, to)}
          />
        ) : null}

        {FACETS.map((facet) => {
          const options = meta?.facets[facet.key] ?? [];
          const selected = state.query[facet.key] as string[];
          return (
            <Popover
              key={facet.key}
              label={facet.label}
              srHint="filter"
              badge={selected.length || undefined}
            >
              {() => (
                <div className="flex flex-col gap-0.5">
                  {options.length === 0 ? (
                    <p className="px-1.5 py-1 text-xs text-subtle">
                      Loading options…
                    </p>
                  ) : (
                    options.map((option) => (
                      <CheckboxRow
                        key={option.value}
                        label={option.label}
                        checked={selected.includes(option.value)}
                        onChange={() =>
                          state.toggleFacet(facet.key, option.value)
                        }
                      />
                    ))
                  )}
                  {selected.length > 0 ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1 justify-start"
                      onClick={() => state.clearFacet(facet.key)}
                    >
                      Clear {facet.label.toLowerCase()}
                    </Button>
                  ) : null}
                </div>
              )}
            </Popover>
          );
        })}

        {state.activeFilterCount > 0 ? (
          <Button size="sm" variant="ghost" onClick={state.resetAll}>
            Reset all
          </Button>
        ) : null}
      </div>

      {/* Active filters are echoed as removable chips: a popover-only UI hides
          what is currently applied, which is how people end up confused by a
          dashboard that "shows the wrong numbers". */}
      {state.activeFilterCount > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-subtle">Active:</span>
          {state.query.q ? (
            <Chip>
              Search “{state.query.q}”
              <button
                type="button"
                onClick={() => state.setSearchTerm("")}
                className="ml-1 text-subtle hover:text-ink"
                aria-label={`Remove search filter ${state.query.q}`}
              >
                ×
              </button>
            </Chip>
          ) : null}
          {FACETS.flatMap((facet) =>
            (state.query[facet.key] as string[]).map((value) => {
              const label =
                meta?.facets[facet.key].find((o) => o.value === value)?.label ??
                value;
              return (
                <Chip key={`${facet.key}:${value}`}>
                  {facet.label}: {label}
                  <button
                    type="button"
                    onClick={() => state.toggleFacet(facet.key, value)}
                    className="ml-1 text-subtle hover:text-ink"
                    aria-label={`Remove ${facet.label} filter ${label}`}
                  >
                    ×
                  </button>
                </Chip>
              );
            }),
          )}
        </div>
      ) : null}

      {state.issues.length > 0 ? (
        <div
          role="alert"
          className="rounded-(--radius-control) border border-chip-warn-br bg-chip-warn-bg px-3 py-2 text-xs text-chip-warn-fg"
        >
          <p className="font-medium">
            Some URL parameters were invalid and have been ignored:
          </p>
          <ul className="mt-1 list-disc pl-4">
            {state.issues.map((issue) => (
              <li key={`${issue.path}-${issue.message}`}>
                <code>{issue.path}</code>: {issue.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
