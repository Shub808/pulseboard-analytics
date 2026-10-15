"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Route-level error boundary. Catches render-time failures in the segment so a
 * single broken component doesn't blank the whole application.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In a real deployment this is where the error reporter would be called.
    console.error("Unhandled route error", error);
  }, [error]);

  return (
    <Card className="mx-auto mt-10 max-w-lg px-6 py-8 text-center">
      <h1 className="text-base font-semibold text-ink">
        This view failed to render
      </h1>
      <p className="mt-2 text-xs text-muted">
        {error.message || "An unexpected error occurred."}
      </p>
      {error.digest ? (
        <p className="mt-1 font-mono text-xs text-subtle">
          Reference: {error.digest}
        </p>
      ) : null}
      <Button variant="primary" className="mt-5" onClick={reset}>
        Try again
      </Button>
    </Card>
  );
}
