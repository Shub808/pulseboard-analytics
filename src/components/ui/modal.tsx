"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import { cn } from "@/lib/cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Accessible modal built on the platform's `<dialog>` element.
 *
 * `showModal()` gives us, for free and correctly: focus moved into the dialog,
 * a real focus trap, the rest of the page marked inert, `Escape` to dismiss,
 * and the top-layer stacking that otherwise needs a portal plus z-index
 * wrangling. Hand-rolled focus traps are a well-known source of accessibility
 * bugs, so we delegate instead. We only add: body scroll locking, a
 * backdrop-click affordance, and routing `cancel`/`close` back into React
 * state so the DOM never disagrees with the `open` prop.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onCancel={(event) => {
        // Let React own the open state rather than the DOM closing itself.
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        // A click that lands on the dialog element itself (not its content
        // box) is a backdrop click.
        if (event.target === dialogRef.current) onClose();
      }}
      className={cn(
        "m-auto w-[min(calc(100vw-2rem),36rem)] rounded-(--radius-card) border border-line bg-surface p-0 text-ink shadow-card",
        "backdrop:bg-black/50 backdrop:backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="-mr-1 rounded-(--radius-control) p-1.5 text-muted hover:bg-surface-muted hover:text-ink"
        >
          <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="m6 6 8 8M14 6l-8 8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {/* The body scrolls, so it needs to be focusable for keyboard-only
          users (axe: scrollable-region-focusable). */}
      <div
        tabIndex={0}
        role="group"
        aria-label={`${title} details`}
        className="max-h-[70vh] overflow-y-auto px-5 py-4"
      >
        {children}
      </div>
      {footer ? (
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}
