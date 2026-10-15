import { guardRequest, jsonError, jsonOk } from "@/lib/api/respond";
import { datasetBounds, getDataset } from "@/lib/data/dataset";
import { computeMetrics } from "@/lib/query/metrics";

/**
 * GET /api/metrics
 *
 * Returns KPI values with period-over-period comparison, a dense daily series
 * for the selected window, the matching previous-period series, and revenue
 * breakdowns by channel and region.
 */
export async function GET(request: Request): Promise<Response> {
  const guard = await guardRequest(request);
  if (!guard.ok) return guard.response;

  try {
    const summary = computeMetrics(
      getDataset(),
      guard.query,
      datasetBounds(),
    );
    return jsonOk(summary);
  } catch (error) {
    console.error("GET /api/metrics failed", error);
    return jsonError(500, {
      error: { code: "internal_error", message: "Failed to compute metrics." },
    });
  }
}
