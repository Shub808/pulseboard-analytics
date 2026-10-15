import { guardRequest, jsonError } from "@/lib/api/respond";
import { csvFilename, toCsv } from "@/lib/csv";
import {
  CHANNEL_LABELS,
  REGION_LABELS,
  STATUS_LABELS,
} from "@/lib/data/catalog";
import { getDataset } from "@/lib/data/dataset";
import { queryAllOrders } from "@/lib/query/orders";

/** Hard ceiling so a wide-open export can't exhaust server memory. */
const MAX_EXPORT_ROWS = 25_000;

const HEADERS = [
  "Order ID",
  "Created (UTC)",
  "Customer",
  "Email",
  "Channel",
  "Region",
  "Status",
  "Items",
  "Amount (USD)",
];

/**
 * GET /api/orders/export
 *
 * Streams the *filtered* result set as CSV — the export always matches what the
 * user is looking at, because it runs the same query engine as the table.
 */
export async function GET(request: Request): Promise<Response> {
  const guard = await guardRequest(request);
  if (!guard.ok) return guard.response;

  try {
    const matching = queryAllOrders(getDataset(), guard.query);
    const truncated = matching.length > MAX_EXPORT_ROWS;
    const rows = matching.slice(0, MAX_EXPORT_ROWS).map((order) => [
      order.id,
      order.createdAt,
      order.customerName,
      order.customerEmail,
      CHANNEL_LABELS[order.channel],
      REGION_LABELS[order.region],
      STATUS_LABELS[order.status],
      order.itemCount,
      (order.amountMinor / 100).toFixed(2),
    ]);

    return new Response(toCsv(HEADERS, rows), {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${csvFilename("pulseboard-orders")}"`,
        "cache-control": "no-store",
        "x-total-matching": String(matching.length),
        "x-rows-exported": String(rows.length),
        "x-truncated": String(truncated),
      },
    });
  } catch (error) {
    console.error("GET /api/orders/export failed", error);
    return jsonError(500, {
      error: { code: "internal_error", message: "Failed to build export." },
    });
  }
}
