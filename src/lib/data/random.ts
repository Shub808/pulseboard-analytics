/**
 * Deterministic pseudo-random helpers.
 *
 * The demo dataset must be byte-for-byte reproducible: the server, the test
 * suite and any CI run have to agree on the same numbers, otherwise snapshot
 * assertions and KPI expectations are meaningless. `Math.random()` cannot give
 * us that, so we use a small seeded PRNG (mulberry32) instead.
 */

export type Rng = () => number;

/** mulberry32 — 32-bit seeded PRNG. Fast, tiny, good enough for fixtures. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] inclusive. */
export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error("pick() called with an empty list");
  return items[randInt(rng, 0, items.length - 1)]!;
}

/**
 * Picks an item using relative weights. Weights must be positive and the same
 * length as `items`.
 */
export function pickWeighted<T>(
  rng: Rng,
  items: readonly T[],
  weights: readonly number[],
): T {
  if (items.length !== weights.length) {
    throw new Error("pickWeighted() requires items and weights of equal length");
  }
  const total = weights.reduce((sum, w) => sum + w, 0);
  let threshold = rng() * total;
  for (let i = 0; i < items.length; i += 1) {
    threshold -= weights[i]!;
    if (threshold <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}
