"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const CONTROL =
  "h-9 w-full rounded-(--radius-control) border border-line-strong bg-surface px-2.5 text-sm text-ink placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-60";

export interface FieldProps {
  label: string;
  /** Hides the label visually but keeps it for assistive technology. */
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: (ids: { id: string; describedBy: string | undefined }) => ReactNode;
}

/**
 * Label + hint + error wrapper.
 *
 * Centralising `htmlFor`/`id`/`aria-describedby` wiring is the difference
 * between a form that is accessible and one that only looks accessible: every
 * control gets a programmatically associated label and its error text is
 * announced, without each call site having to remember.
 */
export function Field({
  label,
  hideLabel = false,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label
        htmlFor={id}
        className={cn(
          "text-xs font-medium text-muted",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </label>
      {children({ id, describedBy })}
      {hint ? (
        <p id={hintId} className="text-xs text-subtle">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-chip-bad-fg">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  className,
  invalid,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, invalid && "border-negative", className)}
      {...rest}
    />
  );
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CONTROL, "pr-8", className)} {...rest}>
      {children}
    </select>
  );
}

export function CheckboxRow({
  label,
  checked,
  onChange,
  count,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  count?: number;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-(--radius-control) px-1.5 py-1 text-sm text-ink hover:bg-surface-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-3.5 accent-brand-600"
      />
      <span className="flex-1">{label}</span>
      {count !== undefined ? (
        <span className="tabular text-xs text-subtle">{count}</span>
      ) : null}
    </label>
  );
}
