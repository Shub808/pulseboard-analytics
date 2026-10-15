import { jsonOk } from "@/lib/api/respond";
import {
  CHANNEL_LABELS,
  REGION_LABELS,
  STATUS_LABELS,
} from "@/lib/data/catalog";
import {
  DEFAULT_DATASET_OPTIONS,
  datasetBounds,
  getDataset,
} from "@/lib/data/dataset";
import { CHANNELS, ORDER_STATUSES, REGIONS } from "@/types/domain";

/**
 * GET /api/meta
 *
 * Facet options and dataset provenance. Exposed so the UI never hard-codes the
 * filter vocabulary and reviewers can see exactly what the demo data is.
 */
export function GET(): Response {
  const bounds = datasetBounds();
  return jsonOk({
    demoData: true,
    notice:
      "All records are synthetic, generated from a fixed PRNG seed. No real customer data is present.",
    seed: DEFAULT_DATASET_OPTIONS.seed,
    bounds,
    totalOrders: getDataset().length,
    facets: {
      status: ORDER_STATUSES.map((v) => ({ value: v, label: STATUS_LABELS[v] })),
      channel: CHANNELS.map((v) => ({ value: v, label: CHANNEL_LABELS[v] })),
      region: REGIONS.map((v) => ({ value: v, label: REGION_LABELS[v] })),
    },
  });
}
