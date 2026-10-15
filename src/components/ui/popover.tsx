"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

export interface PopoverProps {
  label: ReactNode;
  /**
   * Extra words appended to the trigger's accessible name, rendered
   * visually-hidden *inside* the button.
   *
   * It is not an `aria-label`: an `aria-label` that does not contain the
   * visible text violates WCAG 2.5.3 (Label in Name) and breaks voice
   * control, because the user says what they can see. A hidden suffix keeps
   * the visible text in the name while still distinguishing "Status" the
   * filter from "Status" the sortable column header.
   */
  srHint?: string;
  /** Count shown as a badge on the trigger, e.g. active filter count. */
  badge?: number;
  /** Receives a `close` callback so panel content can dismiss the popover. */
  children: (close: () => void) => ReactNode;
  className?: string;
  panelClassName?: string;
}

/**
 * Disclosure popover for filter panels.
 *
 * Keyboard and screen-reader behaviour is explicit: the trigger owns
 * `aria-expanded`/`aria-controls`, `Escape` dismisses, and a pointer-down
 * outside the component closes it.
 *
 * Focus restoration is handled in an effect rather than inside the `close`
 * callback. When the panel unmounts, the browser drops focus to `<body>`; the
 * effect notices that and returns focus to the trigger, so a keyboard user
 * lands back where they were. Doing it this way also keeps `close` a pure
 * state setter, with no DOM read during render.
 */
export function Popover({
  label,
  srHint,
  badge,
  children,
  className,
  panelClassName,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const panelId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (wasOpen.current && !open && document.activeElement === document.body) {
      triggerRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Stop the key reaching an enclosing dialog, which would close that too.
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-(--radius-control) border border-line-strong bg-surface px-2.5 text-sm text-ink transition-colors hover:bg-surface-muted",
          open && "border-brand-500 bg-surface-muted",
        )}
      >
        {label}
        {srHint ? <span className="sr-only">{srHint}</span> : null}
        {badge ? (
          <span className="tabular rounded-full bg-brand-600 px-1.5 text-[0.6875rem] font-semibold text-white">
            {badge}
          </span>
        ) : null}
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={cn(
            "size-3 text-muted transition-transform",
            open && "rotate-180",
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m5 8 5 5 5-5" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <div
          id={panelId}
          className={cn(
            "absolute left-0 z-30 mt-1.5 w-60 rounded-(--radius-card) border border-line bg-surface-raised p-2 shadow-card",
            panelClassName,
          )}
        >
          {children(close)}
        </div>
      ) : null}
    </div>
  );
}
