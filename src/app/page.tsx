import type { Route } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Overview } from "@/components/dashboard/overview";
import { Skeleton } from "@/components/ui/states";
import { rangeRedirect } from "@/lib/query/defaults";
import { toSearchParams } from "@/lib/query/search-params";

/**
 * The dashboard reads its state from the query string, so the page is dynamic
 * at the request boundary. Before rendering it pins down a default analysis
 * window (see lib/query/defaults.ts) so the landing view always has a
 * comparable previous period, and the `Suspense` boundary lets the shell
 * stream while the client component resolves `useSearchParams()`.
 */
export default async function OverviewPage(props: PageProps<"/">) {
  const target = rangeRedirect("/", toSearchParams(await props.searchParams));
  // `typedRoutes` checks literal hrefs; the target is this same route with a
  // query string appended, so the assertion is safe.
  if (target) redirect(target as Route);

  return (
    <Suspense fallback={<Skeleton className="h-[70vh] w-full" />}>
      <Overview />
    </Suspense>
  );
}
