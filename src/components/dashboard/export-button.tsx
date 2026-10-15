"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { exportUrl } from "@/lib/api/client";

/**
 * CSV export.
 *
 * Fetched rather than linked so failures are visible: a plain `<a download>`
 * that hits a 500 navigates the user to an error page or silently saves an
 * HTML file named `.csv`. Here the response is validated, turned into a blob
 * and handed to a synthetic anchor, and the server's `x-truncated` header is
 * surfaced to the user when the export hit the row cap.
 */
export function ExportButton({ search }: { search: string }) {
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "working" } | { kind: "error"; message: string } | { kind: "done"; note: string }
  >({ kind: "idle" });

  async function run() {
    setState({ kind: "working" });
    try {
      const response = await fetch(exportUrl(search), {
        headers: { accept: "text/csv" },
      });
      if (!response.ok) {
        throw new Error(
          `Export failed with status ${response.status}. Please try again.`,
        );
      }
      const exported = response.headers.get("x-rows-exported") ?? "?";
      const truncated = response.headers.get("x-truncated") === "true";
      const blob = await response.blob();
      const filename =
        /filename="([^"]+)"/.exec(
          response.headers.get("content-disposition") ?? "",
        )?.[1] ?? "pulseboard-orders.csv";

      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(href);

      setState({
        kind: "done",
        note: truncated
          ? `Exported the first ${exported} rows (server row cap reached).`
          : `Exported ${exported} rows.`,
      });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Export failed.",
      });
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="secondary"
        loading={state.kind === "working"}
        onClick={() => void run()}
        iconLeft={
          <svg aria-hidden="true" viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M10 3.5v9M6.5 9l3.5 3.5L13.5 9M4 16h12" strokeLinecap="round" />
          </svg>
        }
      >
        Export CSV
      </Button>
      {/* Status is announced, not just coloured. */}
      <p
        aria-live="polite"
        className={
          state.kind === "error"
            ? "text-xs text-chip-bad-fg"
            : "text-xs text-subtle"
        }
      >
        {state.kind === "error"
          ? state.message
          : state.kind === "done"
            ? state.note
            : ""}
      </p>
    </div>
  );
}
