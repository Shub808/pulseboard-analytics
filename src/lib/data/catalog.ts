import type { Channel, OrderStatus, Region } from "@/types/domain";

/**
 * Human-readable labels and generation weights for the synthetic dataset.
 * Weights are tuned so the demo data looks plausible rather than uniform —
 * a uniform distribution makes every chart look like noise.
 */

export const CHANNEL_LABELS: Record<Channel, string> = {
  web: "Web storefront",
  "mobile-app": "Mobile app",
  marketplace: "Marketplace",
  "partner-api": "Partner API",
  retail: "Retail POS",
};

export const REGION_LABELS: Record<Region, string> = {
  apac: "APAC",
  emea: "EMEA",
  latam: "LATAM",
  namer: "North America",
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  shipped: "Shipped",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

export const CHANNEL_WEIGHTS: Record<Channel, number> = {
  web: 38,
  "mobile-app": 27,
  marketplace: 18,
  "partner-api": 11,
  retail: 6,
};

export const REGION_WEIGHTS: Record<Region, number> = {
  namer: 40,
  emea: 29,
  apac: 22,
  latam: 9,
};

export const STATUS_WEIGHTS: Record<OrderStatus, number> = {
  paid: 54,
  shipped: 26,
  pending: 11,
  refunded: 6,
  cancelled: 3,
};

/**
 * Fictional name parts. Every customer in the demo dataset is generated from
 * these lists — no real person's data is present anywhere in this project.
 */
export const FIRST_NAMES = [
  "Ada", "Bruno", "Carla", "Dev", "Elif", "Farid", "Greta", "Hana",
  "Ivan", "Jun", "Kiran", "Lena", "Mateo", "Nadia", "Omar", "Priya",
  "Quinn", "Rosa", "Sven", "Tara", "Ugo", "Vera", "Wes", "Xiulan",
  "Yara", "Zane",
] as const;

export const LAST_NAMES = [
  "Alvarez", "Bauer", "Chen", "Dasgupta", "Eriksen", "Ferraro", "Gupta",
  "Haugen", "Ibrahim", "Jansen", "Kowalski", "Lindqvist", "Moreau",
  "Nakamura", "Oyelaran", "Petrov", "Quintana", "Rahman", "Silva",
  "Tanaka", "Ubaldi", "Vargas", "Walsh", "Xu", "Yilmaz", "Zito",
] as const;
