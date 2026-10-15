import type { Metadata } from "next";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { OrdersView } from "@/components/dashboard/orders-view";
import { Skeleton } from "@/components/ui/states";
import { rangeRedirect } from "@/lib/query/defaults";
import { toSearchParams } from "@/lib/query/search-params";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage(props: PageProps<"/orders">) {
  const target = rangeRedirect("/orders", toSearchParams(await props.searchParams));
  // `typedRoutes` checks literal hrefs; the target is this same route with a
  // query string appended, so the assertion is safe.
  if (target) redirect(target as Route);

  return (
    <Suspense fallback={<Skeleton className="h-[70vh] w-full" />}>
      <OrdersView />
    </Suspense>
  );
}
