import { guardRequest, jsonError, jsonOk } from "@/lib/api/respond";
import { getDataset } from "@/lib/data/dataset";
import { queryOrders } from "@/lib/query/orders";

/**
 * GET /api/orders
 *
 * Filtering, sorting and pagination all happen on the server. The client never
 * downloads the full dataset, which is what keeps the table responsive as the
 * demo dataset grows.
 */
export async function GET(request: Request): Promise<Response> {
  const guard = await guardRequest(request);
  if (!guard.ok) return guard.response;

  try {
    const page = queryOrders(getDataset(), guard.query);
    return jsonOk(page);
  } catch (error) {
    console.error("GET /api/orders failed", error);
    return jsonError(500, {
      error: { code: "internal_error", message: "Failed to query orders." },
    });
  }
}
