import type { ApiErrorBody } from "@/lib/api/respond";
import type { MetricsSummary, Order, Paginated } from "@/types/domain";

/**
 * Typed fetch layer.
 *
 * `fetch` does not reject on 4xx/5xx, which is the single most common cause of
 * dashboards that render "0" instead of an error. Every response goes through
 * `request()` so a non-OK status becomes a thrown `ApiError` that TanStack
 * Query can surface, with the server's own message where one exists.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly issues?: { path: string; message: string }[];

  constructor(
    status: number,
    code: string,
    message: string,
    issues?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.issues = issues;
  }

  /** Retrying a 4xx will just fail again — only 5xx/network errors are worth it. */
  get isRetryable(): boolean {
    return this.status >= 500;
  }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { signal, headers: { accept: "application/json" } });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "network_error", "Network request failed. Check your connection.");
  }

  if (!response.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // Non-JSON error body (proxy error page, truncated response, …).
    }
    throw new ApiError(
      response.status,
      body?.error.code ?? "internal_error",
      body?.error.message ?? `Request failed with status ${response.status}.`,
      body?.error.issues,
    );
  }

  return (await response.json()) as T;
}

export function fetchOrders(
  search: string,
  signal?: AbortSignal,
): Promise<Paginated<Order>> {
  return request(`/api/orders?${search}`, signal);
}

export function fetchMetrics(
  search: string,
  signal?: AbortSignal,
): Promise<MetricsSummary> {
  return request(`/api/metrics?${search}`, signal);
}

export interface DatasetMeta {
  demoData: boolean;
  notice: string;
  seed: number;
  bounds: { from: string; to: string };
  totalOrders: number;
  facets: {
    status: { value: string; label: string }[];
    channel: { value: string; label: string }[];
    region: { value: string; label: string }[];
  };
}

export function fetchMeta(signal?: AbortSignal): Promise<DatasetMeta> {
  return request("/api/meta", signal);
}

export function exportUrl(search: string): string {
  return `/api/orders/export?${search}`;
}
