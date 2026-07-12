import {
  defineCollection
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
  imageSchema
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

const productImagesSchema =
  z.object({
    hero: imageSchema,

    thumbnail:
      imageSchema.optional(),

    comparison:
      imageSchema.optional(),

    gallery: z
      .array(imageSchema)
      .default([])
  });

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

export const productContentSchema =
  baseContentSchema.extend({
    type: z
      .literal("product")
      .default("product"),

    layout: z
      .literal("product")
      .default("product"),

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
      productImagesSchema,

    affiliate:
      productAffiliateSchema
        .optional(),

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
      .default([])
  });

export const productsCollection =
  defineCollection({
    loader: glob({
      pattern:
        "**/*.{md,mdx}",

      base:
        "./src/content/products"
    }),

    schema:
      productContentSchema
  });

export type ProductContentData =
  z.infer<
    typeof productContentSchema
  >;
