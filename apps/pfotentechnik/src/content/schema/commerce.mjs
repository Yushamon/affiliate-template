import { z } from "astro/zod";
import { evidenceSourceSchema } from './evidence.mjs';

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
    comparisonKey: z.string().optional(),
    shipping: z.number().nonnegative().nullable().optional(),
    variantLabel: z.string().optional(),
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

// Shared by device and consumable offers; legacy single-merchant fields remain valid.
export const commerceOfferCoreSchema = z.object({
  id: z.string().min(1), price: productPriceSchema, affiliate: productAffiliateSchema.optional(),
  priceState: productPriceStateSchema, availability: productAvailabilitySchema
});
export const productOfferSchema = commerceOfferCoreSchema.extend({
  merchant: z.string().min(1), network: z.enum(['partnernet', 'awin', 'adcell', 'none']),
  program: z.string().optional(), officialProductUrl: z.string().url().optional(),
  mappingStatus: z.enum(['verified', 'unresolved', 'invalid']),
  verifiedAt: z.coerce.date().optional(), identityNote: z.string().optional(),
  commerceDataProvider: z.enum(['shopify-product', 'structured-html', 'manual']),
  variantId: z.string().optional(), variantLabel: z.string().optional(), expectedSku: z.string().optional(),
  comparisonKey: z.string().optional(), shipping: z.number().nonnegative().nullable().optional(),
  lastAttemptAt: z.coerce.date().optional(), error: z.string().optional(),
  evidenceSources: z.array(evidenceSourceSchema).default([])
}).strict().superRefine((value, ctx) => {
  if (value.mappingStatus === 'verified' && (!value.officialProductUrl?.startsWith('https://') || !value.verifiedAt || !value.evidenceSources.length)) ctx.addIssue({code:'custom',message:'Verified offer needs HTTPS destination, verification date and provenance.'});
  if (value.mappingStatus === 'verified' && value.commerceDataProvider === 'shopify-product') {
    try {
      if (!value.expectedSku || !value.variantId || new URL(value.officialProductUrl).searchParams.get('variant') !== value.variantId) throw new Error();
    } catch { ctx.addIssue({code:'custom',message:'Verified Shopify offer needs matching destination variant, variant ID and SKU.'}); }
  }
});
export const productOffersSchema = z.array(productOfferSchema).default([]).superRefine((offers, ctx) => {
  if (new Set(offers.map(o => o.id)).size !== offers.length) ctx.addIssue({code:'custom',message:'Offer IDs must be unique.'});
});

