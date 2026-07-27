import {
  defineCollection,
  type ImageFunction
} from "astro:content";

import {
  glob
} from "astro/loaders";

import { z } from "astro/zod";

import {
  baseContentSchema
} from "./base";

import {
  faqSchema,
  createImageSchema
} from "./shared";

const productManufacturerSchema =
  z.object({
    key: z.string(),
    name: z.string(),
    slug: z.string()
  });

const productCategorySchema =
  z.object({
    key: z.string(),
    label: z.string(),
    path: z.string().optional()
  });

const createProductImagesSchema = (image: ImageFunction) => {
  const imageSchema = createImageSchema(image);

  return z.object({
    hero: imageSchema,

    thumbnail:
      imageSchema.optional(),

    comparison:
      imageSchema.optional(),

    gallery: z
      .array(imageSchema)
      .default([])
  });
};

const productAffiliateSchema =
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

const productConversionSchema =
  z.object({
    badge: z
      .enum([
        "testsieger",
        "top-empfehlung",
        "preis-leistungs-tipp",
        "premium-tipp",
        "spezialempfehlung",
        "none"
      ])
      .default("none"),

    primaryCtaLabel: z
      .string()
      .optional(),

    secondaryCtaLabel: z
      .string()
      .default(
        "Preis und Verfügbarkeit prüfen"
      ),

    showSecondaryCta: z
      .boolean()
      .default(true)
  })
  .optional();



const productPriceSourceSchema =
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

const productPriceRangeSchema =
  z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
    sampleSize: z.number().int().nonnegative(),
    generatedAt: z.coerce.date().optional(),
    source: z.literal("category-engine").default("category-engine")
  });

const productPriceSchema =
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

const productPriceStateSchema = z.enum([
  "available",
  "unknown",
  "removed",
  "stale"
]);

const productAvailabilitySchema = z.enum([
  "available",
  "temporarily-unavailable",
  "out-of-stock",
  "discontinued",
  "unknown"
]);

const productRecommendationStatusSchema = z.enum([
  "recommended",
  "limited",
  "archived"
]);

const productEditorialStatusSchema = z.enum([
  "complete",
  "recommended",
  "required",
  "archived"
]);

const productMaintenanceStatusSchema = z.enum([
  "complete",
  "recommended",
  "required",
  "archived"
]);

const productEditorialSchema =
  z.object({
    assessmentType: z
      .enum([
        "hands-on-test",
        "editorial-review",
        "data-review"
      ])
      .default("editorial-review"),

    evidence: z
      .array(
        z.enum([
          "hands-on-testing",
          "manufacturer-documentation",
          "technical-specifications",
          "comparative-analysis",
          "user-feedback"
        ])
      )
      .default([
        "manufacturer-documentation",
        "technical-specifications",
        "comparative-analysis"
      ]),

    testedHandsOn: z
      .boolean()
      .default(false),

    lastVerifiedAt: z
      .coerce
      .date()
      .optional(),

    note: z
      .string()
      .optional()
  })
  .optional();

const productDecisionSchema =
  z.object({
    bestFor: z
      .array(z.string())
      .default([]),

    attention: z
      .array(z.string())
      .default([])
  });

const productReviewSchema =
  z.object({
    summary: z.string(),
    verdict: z.string()
  });

const productExperienceSchema =
  z.object({
    summary: z.string(),

    positives: z
      .array(z.string())
      .default([]),

    criticism: z
      .array(z.string())
      .default([]),

    support: z
      .string()
      .optional(),

    methodology: z
      .string()
      .optional(),

    maintenance: z
      .string()
      .optional(),

    reliability: z
      .string()
      .optional()
  });

const productSpecSchema =
  z.object({
    label: z.string(),

    value: z.union([
      z.string(),
      z.number(),
      z.boolean()
    ])
  });

const productGpsSchema =
  z.object({
    animal: z.array(z.enum(["dog", "cat"])).min(1),
    minimumPetWeightKg: z.number().nonnegative().optional(),
    maximumPetWeightKg: z.number().positive().optional(),
    deviceWeightGrams: z.number().positive().optional(),
    totalWeightGrams: z.number().positive().optional(),
    weightBasis: z.enum(["device", "including-collar", "system"]).default("device"),
    subscriptionRequired: z.boolean(),
    includedServiceMonths: z.number().int().nonnegative().default(0),
    transmission: z.enum(["lte", "vhf", "bluetooth", "other"]),
    batteryMaxDays: z.number().positive().optional(),
    batteryCondition: z.string().optional(),
    waterproofRating: z.string().optional(),
    liveTracking: z.boolean().default(false),
    virtualFence: z.boolean().default(false),
    activityTracking: z.boolean().default(false),
    attachmentType: z.enum([
      "clip",
      "collar",
      "safety-collar",
      "collar-attachment",
      "harness",
      "other"
    ]).optional()
  })
  .optional();

const comparisonPrimitiveSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null()
]);

const comparisonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    comparisonPrimitiveSchema,
    z.array(comparisonPrimitiveSchema),
    z.record(z.string(), comparisonValueSchema)
  ])
);

const comparisonRecordSchema =
  z.record(
    z.string(),
    comparisonValueSchema
  );

const productComparisonDataSchema = z
  .object({
    version: z.literal(1).optional(),
    general: comparisonRecordSchema.optional(),
    feeder: comparisonRecordSchema.optional(),
    fountain: comparisonRecordSchema.optional(),
    gps: comparisonRecordSchema.optional(),
    editorial: comparisonRecordSchema.optional(),
    custom: comparisonRecordSchema.optional()
  })
  .catchall(comparisonValueSchema)
  .optional();

const productComparisonFiltersSchema =
  z.object({
    animal: z
      .array(z.enum(["dog", "cat"]))
      .default([]),

    petSize: z
      .array(z.enum(["small", "medium", "large"]))
      .default([]),

    foodType: z
      .array(
        z.enum([
          "dry",
          "wet"
        ])
      )
      .default([]),

    app: z
      .boolean()
      .optional(),

    camera: z
      .boolean()
      .optional(),

    access: z
      .enum([
        "open",
        "microchip"
      ])
      .optional(),

    backupPower: z
      .boolean()
      .optional(),

    reservoirLiters: z.number().positive().optional(),
    portionGrams: z.number().positive().optional(),
    portionMl: z.number().positive().optional(),
    maxPortionsPerMeal: z.number().int().positive().optional(),
    maxMealGrams: z.number().positive().optional(),
    maxMealMl: z.number().positive().optional(),
    kibbleMaxMm: z.number().positive().optional(),
    manufacturerSizeClaim: z.enum(["large","all-dogs","small-medium","small","max-40cm","cats-small-pets","unknown"]).default("unknown"),
    largeDogFit: z.enum(["technical-fit","conditional","limited","unknown"]).default("unknown"),
    largeDogFitReason: z.string().optional(),

    priceTier: z
      .enum([
        "budget",
        "midrange",
        "premium"
      ])
      .optional()
  })
  .optional()
  .default({
    animal: [],
    petSize: [],
    foodType: []
  });

export const createProductContentSchema = (image: ImageFunction) =>
  baseContentSchema.extend({
    type: z
      .literal("product")
      .default("product"),

    layout: z
      .literal("product")
      .default("product"),

    testStatus: z.enum([
      "hands-on",
      "editorial-review",
      "manufacturer-data",
      "long-term-test",
      "not-tested"
    ]),

    productStatus: z.enum([
      "active",
      "discontinued",
      "legacy",
      "unknown"
    ]),

    recommendation:
      z.string(),

    manufacturer:
      productManufacturerSchema,

    category:
      productCategorySchema,

    productUrl:
      z.string()
      .optional(),

    images:
      createProductImagesSchema(image),

    affiliate:
      productAffiliateSchema
        .optional(),

    conversion:
      productConversionSchema,

    price:
      productPriceSchema,


    priceState: productPriceStateSchema.default("unknown"),
    priceUpdated: z.coerce.date().optional(),
    priceAvailable: z.boolean().default(false),
    affiliateAvailable: z.boolean().default(false),
    availability: productAvailabilitySchema.default("unknown"),
    availabilityReason: z.string().max(500).optional(),
    availabilityUpdated: z.coerce.date().optional(),
    editorialStatus: productEditorialStatusSchema.default("complete"),
    recommendationStatus: productRecommendationStatusSchema.default("limited"),
    maintenanceStatus: productMaintenanceStatusSchema.default("required"),

    editorial:
      productEditorialSchema,
    rating: z
      .number()
      .min(0)
      .max(5),

    score: z
      .number()
      .min(0)
      .max(100)
      .optional(),

    ratings: z
      .record(
        z.string(),
        z
          .number()
          .min(0)
          .max(5)
      )
      .default({}),

    decision:
      productDecisionSchema,

    review:
      productReviewSchema,

    strengths: z
      .array(z.string())
      .default([]),

    weaknesses: z
      .array(z.string())
      .default([]),

    experience:
      productExperienceSchema
        .optional(),

    alternatives: z
      .array(z.string())
      .default([]),

    comparisons: z
      .array(z.string())
      .default([]),

    specs: z
      .array(
        productSpecSchema
      )
      .default([]),

    faq: z
      .array(faqSchema)
      .default([]),

    priceCategory: z
      .enum([
        "budget",
        "midrange",
        "premium"
      ])
      .optional(),

    useCase: z
      .string()
      .optional(),

    capacity: z
      .string()
      .optional(),

    expandable: z
      .union([
        z.string(),
        z.boolean()
      ])
      .optional(),

    features: z
      .array(z.string())
      .default([]),

    gps: productGpsSchema,

    comparisonData:
      productComparisonDataSchema,

    comparisonFilters:
      productComparisonFiltersSchema
  });

export const productsCollection =
  defineCollection({
    loader: glob({
      pattern:
        "**/*.{md,mdx}",

      base:
        "./src/content/products"
    }),

    schema: ({ image }) =>
      createProductContentSchema(image)
  });

export type ProductContentData =
  z.infer<
    ReturnType<typeof createProductContentSchema>
  >;
