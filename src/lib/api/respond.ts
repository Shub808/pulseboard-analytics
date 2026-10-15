import { parseOrdersQuery, type OrdersQuery } from "@/lib/query/schema";

/** Shape returned for every 4xx/5xx from the API surface. */
export interface ApiErrorBody {
  error: {
    code: "invalid_query" | "simulated_failure" | "internal_error";
    message: string;
    issues?: { path: string; message: string }[];
  };
}

export function jsonError(
  status: number,
  body: ApiErrorBody,
  headers: Record<string, string> = {},
): Response {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store", ...headers },
  });
}

export function jsonOk<T>(
  data: T,
  headers: Record<string, string> = {},
): Response {
  return Response.json(data, {
    status: 200,
    // The dataset is deterministic but filtered per request; `no-store` keeps
    // the demo honest about what is and isn't cached.
    headers: { "cache-control": "no-store", ...headers },
  });
}

/**
 * Demo-only fault injection.
 *
 * `?simulate=error` and `?simulate=slow` let the UI's error and loading states
 * be exercised from the browser (and from e2e tests) without mocking the
 * network. This is a deliberate affordance of the demo build, not an accident:
 * reviewers can see the failure paths actually work.
 */
export async function applySimulation(
  mode: "error" | "slow" | null,
): Promise<Response | null> {
  if (mode === "error") {
    return jsonError(500, {
      error: {
        code: "simulated_failure",
        message:
          "Simulated upstream failure (triggered by ?simulate=error). The UI error state is intentional.",
      },
    });
  }
  if (mode === "slow") {
    await new Promise((resolve) => setTimeout(resolve, 2_500));
  }
  return null;
}

export type GuardResult =
  | { ok: true; query: OrdersQuery; url: URL }
  | { ok: false; response: Response };

/** Parses + validates the query string, or returns a ready-made 400/500. */
export async function guardRequest(request: Request): Promise<GuardResult> {
  const url = new URL(request.url);
  const parsed = parseOrdersQuery(url.searchParams);

  // Fault injection is checked first so `?simulate=error` can be combined with
  // any other parameters, but only after parsing so the value is validated.
  const simulated = await applySimulation(
    parsed.ok ? (parsed.query.simulate ?? null) : null,
  );
  if (simulated) return { ok: false, response: simulated };

  if (!parsed.ok) {
    return {
      ok: false,
      response: jsonError(400, {
        error: {
          code: "invalid_query",
          message: "One or more query parameters were rejected.",
          issues: parsed.issues,
        },
      }),
    };
  }
  return { ok: true, query: parsed.query, url };
}
