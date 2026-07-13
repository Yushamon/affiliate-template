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

const comparisonItemSchema =
  z.object({
    slug: z.string(),

    label:
      z.string().optional(),

    type: z
      .enum([
        "product",
        "manufacturer"
      ]),

    recommendation:
      z.string().optional(),

    values: z
      .record(
        z.string(),
        z.union([
          z.string(),
          z.number(),
          z.boolean()
        ])
      )
      .default({})
  });

const comparisonCriterionSchema =
  z.object({
    key: z.string(),

    label: z.string(),

    description:
      z.string().optional(),

    weight: z
      .number()
      .min(0)
      .optional()
  });

const comparisonResultSchema =
  z.object({
    title: z.string(),

    text: z.string(),

    winnerSlug:
      z.string().optional(),

    alternativeSlug:
      z.string().optional()
  });

export const createComparisonContentSchema = (image: ImageFunction) =>
  baseContentSchema.extend({
    type: z
      .literal("comparison")
      .default("comparison"),

    layout: z
      .literal("comparison")
      .default("comparison"),

    comparisonType: z
      .enum([
        "product",
        "manufacturer",
        "feature",
        "use-case",
        "category"
      ]),

    group: z.string(),

    icon:
      z.string().optional(),

    heroImage:
      createImageSchema(image).optional(),

    items: z
      .array(
        comparisonItemSchema
      )
      .min(2),

    criteria: z
      .array(
        comparisonCriterionSchema
      )
      .default([]),

    recommendation:
      comparisonResultSchema,

    tableTitle:
      z.string().optional(),

    cardsTitle:
      z.string().optional(),

    faq: z
      .array(faqSchema)
      .default([])
  });

export const comparisonsCollection =
  defineCollection({
    loader: glob({
      pattern:
        "**/*.{md,mdx}",

      base:
        "./src/content/comparisons"
    }),

    schema: ({ image }) =>
      createComparisonContentSchema(image)
  });

export type ComparisonContentData =
  z.infer<
    ReturnType<typeof createComparisonContentSchema>
  >;
