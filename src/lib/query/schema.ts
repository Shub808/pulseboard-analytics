import { z } from "zod";

import { CHANNELS, ORDER_STATUSES, REGIONS } from "@/types/domain";

/**
 * The URL is the single source of truth for dashboard state.
 *
 * Every filter lives in the query string, which means a filtered view is
 * shareable and survives a reload. That also makes the query string an
 * untrusted input boundary, so it is parsed and clamped here — once — and the
 * rest of the application only ever sees a validated `OrdersQuery`.
 */

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export const SORTABLE_FIELDS = [
  "createdAt",
  "customerName",
  "amountMinor",
  "itemCount",
  "status",
  "channel",
  "region",
] as const;
export type SortField = (typeof SORTABLE_FIELDS)[number];

export const PAGE_SIZES = [10, 25, 50, 100] as const;

/** Accepts `?status=paid&status=shipped` and `?status=paid,shipped`. */
function multiValue<T extends readonly [string, ...string[]]>(values: T) {
  const member = z.enum(values);
  return z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((raw) => {
      if (raw === undefined) return [] as z.infer<typeof member>[];
      const parts = (Array.isArray(raw) ? raw : [raw])
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter(Boolean);
      const allowed = parts.filter(
        (value): value is z.infer<typeof member> =>
          member.safeParse(value).success,
      );
      return [...new Set(allowed)];
    });
}

/**
 * `new Date("2026-02-31")` does not throw — JavaScript silently rolls the
 * overflow forward to 3 March. A `Date.parse` check therefore accepts
 * impossible calendar dates, so the value is round-tripped back to a day key
 * and compared.
 */
export function isRealDay(value: string): boolean {
  if (!DAY.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString().slice(0, 10) === value;
}

const dayString = z
  .string()
  .regex(DAY, "Expected a YYYY-MM-DD date")
  .refine(isRealDay, { message: "Not a real calendar date" });

export const ordersQuerySchema = z
  .object({
    from: dayString.optional(),
    to: dayString.optional(),
    q: z
      .string()
      .trim()
      .max(120, "Search terms are limited to 120 characters")
      .optional()
      .transform((value) => value || undefined),
    status: multiValue(ORDER_STATUSES),
    channel: multiValue(CHANNELS),
    region: multiValue(REGIONS),
    minAmount: z.coerce.number().min(0).max(1_000_000).optional(),
    /**
     * Demo-only fault injection, kept in the schema (rather than read straight
     * off the URL in the route handler) so it survives the client's
     * canonical-query round trip and is validated like every other parameter.
     */
    simulate: z.enum(["error", "slow"]).optional(),
    sort: z.enum(SORTABLE_FIELDS).default("createdAt"),
    dir: z.enum(["asc", "desc"]).default("desc"),
    page: z.coerce.number().int().min(1).max(100_000).default(1),
    pageSize: z.coerce
      .number()
      .int()
      .refine(
        (value): value is (typeof PAGE_SIZES)[number] =>
          (PAGE_SIZES as readonly number[]).includes(value),
        { message: `pageSize must be one of ${PAGE_SIZES.join(", ")}` },
      )
      .default(25),
  })
  // A reversed range is a user mistake, not a reason to 400 — swap it.
  .transform((value) => {
    if (value.from && value.to && value.from > value.to) {
      return { ...value, from: value.to, to: value.from };
    }
    return value;
  });

export type OrdersQuery = z.infer<typeof ordersQuerySchema>;

/** Parses `URLSearchParams` (repeated keys included) into a plain record. */
export function searchParamsToRecord(
  params: URLSearchParams,
): Record<string, string | string[]> {
  const record: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const all = params.getAll(key);
    record[key] = all.length > 1 ? all : all[0]!;
  }
  return record;
}

export type ParseResult =
  | { ok: true; query: OrdersQuery }
  | { ok: false; issues: { path: string; message: string }[] };

export function parseOrdersQuery(
  input: Record<string, string | string[] | undefined> | URLSearchParams,
): ParseResult {
  const record =
    input instanceof URLSearchParams ? searchParamsToRecord(input) : input;
  const result = ordersQuerySchema.safeParse(record);
  if (result.success) return { ok: true, query: result.data };
  return {
    ok: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.join(".") || "(root)",
      message: issue.message,
    })),
  };
}
