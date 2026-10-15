"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Popover } from "@/components/ui/popover";
import { dayCount } from "@/lib/format";

export interface DateRangeValue {
  from: string | undefined;
  to: string | undefined;
}

/** Relative presets, resolved against the dataset's own last day. */
export const RANGE_PRESETS = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
  { id: "365d", label: "Last 12 months", days: 365 },
] as const;

const DAY_MS = 86_400_000;

export function presetRange(
  datasetEnd: string,
  days: number,
): { from: string; to: string } {
  const end = new Date(`${datasetEnd}T00:00:00.000Z`);
  const start = new Date(end.getTime() - (days - 1) * DAY_MS);
  return { from: start.toISOString().slice(0, 10), to: datasetEnd };
}

/**
 * Date range control.
 *
 * Presets are resolved against the *dataset's* last day rather than "today",
 * because the demo data is a fixed historical window — a "Last 7 days" preset
 * anchored to the wall clock would silently return an empty dashboard.
 */
export function DateRangeControl({
  value,
  bounds,
  onChange,
}: {
  value: DateRangeValue;
  bounds: { from: string; to: string };
  onChange: (next: DateRangeValue) => void;
}) {
  const from = value.from ?? bounds.from;
  const to = value.to ?? bounds.to;

  // The draft is stored together with the committed range it was seeded from,
  // so a change made elsewhere (preset, reset, browser back button) reseeds it
  // during render instead of in an effect.
  const [draft, setDraft] = useState({
    seed: `${from}|${to}`,
    from,
    to,
    error: undefined as string | undefined,
  });
  const seed = `${from}|${to}`;
  if (draft.seed !== seed) {
    setDraft({ seed, from, to, error: undefined });
  }
  const { from: draftFrom, to: draftTo, error } = draft;
  const setDraftFrom = (next: string) =>
    setDraft((current) => ({ ...current, from: next, error: undefined }));
  const setDraftTo = (next: string) =>
    setDraft((current) => ({ ...current, to: next, error: undefined }));
  const setError = (message: string) =>
    setDraft((current) => ({ ...current, error: message }));

  const label = `${from} → ${to}`;

  return (
    <Popover
      label={
        <span className="flex items-center gap-1.5">
          <svg aria-hidden="true" viewBox="0 0 20 20" className="size-3.5 text-muted" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="4.5" width="14" height="12" rx="2" />
            <path d="M3 8.5h14M7 3v3M13 3v3" strokeLinecap="round" />
          </svg>
          <span className="tabular hidden sm:inline">{label}</span>
          <span className="sm:hidden">Dates</span>
        </span>
      }
      srHint="date range — open to change"
      panelClassName="w-72"
    >
      {(close) => (
        <div className="flex flex-col gap-3 p-1">
          <div>
            <p className="px-1 pb-1 text-xs font-medium text-muted">Presets</p>
            <div className="grid grid-cols-2 gap-1">
              {RANGE_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  size="sm"
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    onChange(presetRange(bounds.to, preset.days));
                    close();
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-line pt-3">
            <Field label="From">
              {({ id, describedBy }) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  type="date"
                  value={draftFrom}
                  min={bounds.from}
                  max={bounds.to}
                  onChange={(event) => setDraftFrom(event.target.value)}
                />
              )}
            </Field>
            <Field label="To" error={error}>
              {({ id, describedBy }) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  type="date"
                  value={draftTo}
                  min={bounds.from}
                  max={bounds.to}
                  invalid={Boolean(error)}
                  onChange={(event) => setDraftTo(event.target.value)}
                />
              )}
            </Field>
          </div>

          <p className="px-1 text-xs text-subtle">
            Dataset covers {bounds.from} to {bounds.to} (
            {dayCount(bounds.from, bounds.to)} days).
          </p>

          <div className="flex justify-between gap-2 border-t border-line pt-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onChange({ from: undefined, to: undefined });
                close();
              }}
            >
              Full range
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                if (!draftFrom || !draftTo) {
                  setError("Both dates are required.");
                  return;
                }
                if (draftFrom > draftTo) {
                  setError("The start date must not be after the end date.");
                  return;
                }
                onChange({ from: draftFrom, to: draftTo });
                close();
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </Popover>
  );
}
