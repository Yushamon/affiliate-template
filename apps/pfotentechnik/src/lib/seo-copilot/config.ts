import type { SourceType } from "./types";

export const SEO_COPILOT_PROJECT_PATH = "apps/pfotentechnik" as const;
export const PRODUCT_SCHEMA_PATH = "apps/pfotentechnik/src/content/schema/product.ts";
export const PRODUCT_CONTENT_PATH = "apps/pfotentechnik/src/content/products";
export const PRODUCT_IMAGE_ROLES = [
  "hero",
  "thumbnail",
  "comparison",
  "gallery-1",
  "gallery-2",
  "gallery-3",
] as const;

export const SOURCE_WEIGHTS: Readonly<Record<SourceType, number>> = Object.freeze({
  manufacturer: 30,
  manual: 15,
  datasheet: 15,
  "press-release": 10,
  "app-store": 8,
  "established-retailer": 7.5,
  "independent-test": 10,
  community: 3,
  unknown: 0,
});

export const CONTENT_GAP_WEIGHTS = Object.freeze({
  searchVisibility: 0.25,
  productRelevance: 0.2,
  commercialPotential: 0.15,
  missingCoverage: 0.15,
  internalLinkability: 0.1,
  sourceQuality: 0.1,
  freshness: 0.05,
});

export const NICHE_FIT_WEIGHTS = Object.freeze({
  targetAudienceOverlap: 0.25,
  internalLinkability: 0.2,
  productAvailability: 0.15,
  searchPotential: 0.15,
  commercialPotential: 0.15,
  editorialCredibility: 0.1,
});

export const DEFAULT_NICHE_MINIMUM_SCORE = 65;

export const PRODUCT_DISCOVERY_CATEGORIES = Object.freeze([
  "smart-feeders",
  "offline-feeders",
  "camera-feeders",
  "cat-feeders",
  "dog-feeders",
  "large-dog-feeders",
  "multi-pet-feeders",
  "microchip-feeders",
  "pet-fountains",
  "cat-fountains",
  "dog-fountains",
  "large-dog-fountains",
  "dog-gps-trackers",
  "cat-gps-trackers",
  "pet-cameras",
  "smart-cat-flaps",
  "automatic-water-dispensers",
  "smart-food-scales",
  "pet-sensors",
  "pet-health-trackers",
]);

export const JOB_TRANSITIONS = Object.freeze({
  pending: ["running", "cancelled"],
  running: ["awaiting-review", "blocked", "completed", "failed", "cancelled"],
  "awaiting-review": ["running", "cancelled"],
  blocked: ["pending", "cancelled"],
  completed: [],
  failed: ["pending", "cancelled"],
  cancelled: [],
} as const);
