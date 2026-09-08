import { z } from "astro/zod";

export const productAffiliateSchema =
  z.object({
    provider: z
      .string()
      .optional(),

    label: z
      .string()
      .default(
        "Aktuellen Preis prüfen"
      ),

    url: z.string(),

    rel: z
      .string()
      .default(
        "sponsored nofollow noopener"
      ),

    target: z
      .enum([
        "_blank",
        "_self"
      ])
      .default("_blank")
  });

export const productPriceSourceSchema =
  z.object({
    id: z.string(),
    label: z.string(),
    type: z
      .enum([
        "merchant",
        "affiliate",
        "editorial",
        "manual",
        "unknown"
      ])
      .default("unknown"),
    url: z.string().url().optional()
  });

export const productPriceRangeSchema =
  z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
    sampleSize: z.number().int().nonnegative(),
    generatedAt: z.coerce.date().optional(),
    source: z.literal("category-engine").default("category-engine")
  });

export const productPriceSchema =
  z.object({
    current: z.number().positive().nullable().default(null),
    currency: z.string().length(3).default("EUR"),
    status: z
      .enum([
        "cheap",
        "fair",
        "expensive",
        "unknown"
      ])
      .default("unknown"),
    range: productPriceRangeSchema.optional(),
    comparisonText: z.string().optional(),
    checkedAt: z.coerce.date().optional(),
    affiliateUrl: z.string().url().optional(),
    source: productPriceSourceSchema.optional()
  })
  .default({
    current: null,
    currency: "EUR",
    status: "unknown"
  });

export const productPriceStateSchema = z.enum([
  "available",
  "unknown",
  "removed",
  "stale"
]);

export const productAvailabilitySchema = z.enum([
  "available",
  "temporarily-unavailable",
  "out-of-stock",
  "discontinued",
  "unknown"
]);

