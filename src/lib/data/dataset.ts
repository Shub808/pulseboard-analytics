import {
  CHANNEL_WEIGHTS,
  FIRST_NAMES,
  LAST_NAMES,
  REGION_WEIGHTS,
  STATUS_WEIGHTS,
} from "@/lib/data/catalog";
import { createRng, pick, pickWeighted, randInt } from "@/lib/data/random";
import {
  CHANNELS,
  ORDER_STATUSES,
  REGIONS,
  type Order,
} from "@/types/domain";

export interface DatasetOptions {
  /** PRNG seed. Same seed in, same dataset out. */
  seed: number;
  /** How many days of history to generate, ending at `endDate`. */
  days: number;
  /** Inclusive last day of the dataset, as a YYYY-MM-DD UTC day key. */
  endDate: string;
  /** Mean orders per day before weekday/seasonal shaping. */
  baseOrdersPerDay: number;
}

export const DEFAULT_DATASET_OPTIONS: DatasetOptions = {
  seed: 20_260_101,
  days: 365,
  endDate: "2026-09-30",
  baseOrdersPerDay: 42,
};

/** Milliseconds in one day. */
const DAY_MS = 86_400_000;

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDayKey(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

/**
 * Multiplier applied to a day's order volume. Combines:
 *  - a weekly rhythm (weekends are quieter for B2B-ish traffic),
 *  - a slow upward growth trend across the window,
 *  - a mild seasonal wave.
 *
 * Exported so the shaping logic can be unit-tested independently of the
 * (much larger) order generator.
 */
export function volumeMultiplier(dayIndex: number, totalDays: number): number {
  const weekday = dayIndex % 7;
  const weekly = weekday === 5 || weekday === 6 ? 0.72 : 1.06;
  const growth = 0.78 + (dayIndex / Math.max(totalDays - 1, 1)) * 0.52;
  const seasonal = 1 + 0.12 * Math.sin((dayIndex / 30.5) * Math.PI);
  return weekly * growth * seasonal;
}

/**
 * Generates a deterministic order dataset.
 *
 * Cost is linear in the number of orders (~15k for the defaults), so callers
 * should use {@link getDataset} rather than regenerating per request.
 */
export function generateOrders(options: DatasetOptions): Order[] {
  const rng = createRng(options.seed);
  const end = parseDayKey(options.endDate);
  const orders: Order[] = [];
  let sequence = 0;

  for (let dayIndex = 0; dayIndex < options.days; dayIndex += 1) {
    const dayStart = new Date(
      end.getTime() - (options.days - 1 - dayIndex) * DAY_MS,
    );
    const shaped =
      options.baseOrdersPerDay * volumeMultiplier(dayIndex, options.days);
    const jitter = 0.85 + rng() * 0.3;
    const count = Math.max(1, Math.round(shaped * jitter));

    for (let i = 0; i < count; i += 1) {
      sequence += 1;
      const channel = pickWeighted(
        rng,
        CHANNELS,
        CHANNELS.map((c) => CHANNEL_WEIGHTS[c]),
      );
      const region = pickWeighted(
        rng,
        REGIONS,
        REGIONS.map((r) => REGION_WEIGHTS[r]),
      );
      const status = pickWeighted(
        rng,
        ORDER_STATUSES,
        ORDER_STATUSES.map((s) => STATUS_WEIGHTS[s]),
      );

      const first = pick(rng, FIRST_NAMES);
      const last = pick(rng, LAST_NAMES);
      const itemCount = randInt(rng, 1, 7);

      // Channel-dependent basket sizes keep the breakdown charts interesting.
      const unitFloor = channel === "partner-api" ? 7_500 : 2_400;
      const unitCeiling = channel === "partner-api" ? 48_000 : 19_500;
      const unitMinor = randInt(rng, unitFloor, unitCeiling);

      orders.push({
        id: `ORD-${String(sequence).padStart(6, "0")}`,
        createdAt: new Date(
          dayStart.getTime() +
            randInt(rng, 0, 23) * 3_600_000 +
            randInt(rng, 0, 59) * 60_000,
        ).toISOString(),
        customerName: `${first} ${last}`,
        customerEmail: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
        channel,
        region,
        status,
        amountMinor: unitMinor * itemCount,
        itemCount,
        currency: "USD",
      });
    }
  }

  // Newest first — the most common default ordering in an operations table.
  orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return orders;
}

let cached: { key: string; orders: Order[] } | null = null;

/**
 * Returns the process-wide demo dataset, generating it at most once per
 * distinct option set. In a real system this module would be replaced by a
 * database repository; the rest of the app only depends on the array.
 */
export function getDataset(
  options: DatasetOptions = DEFAULT_DATASET_OPTIONS,
): Order[] {
  const key = JSON.stringify(options);
  if (cached?.key === key) return cached.orders;
  cached = { key, orders: generateOrders(options) };
  return cached.orders;
}

/** Inclusive date bounds of the demo dataset, as YYYY-MM-DD day keys. */
export function datasetBounds(
  options: DatasetOptions = DEFAULT_DATASET_OPTIONS,
): { from: string; to: string } {
  const end = parseDayKey(options.endDate);
  const start = new Date(end.getTime() - (options.days - 1) * DAY_MS);
  return { from: dayKey(start), to: dayKey(end) };
}
