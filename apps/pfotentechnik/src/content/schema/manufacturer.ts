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

const createManufacturerImagesSchema = (image: ImageFunction) => {
  const imageSchema = createImageSchema(image);

  return z.object({
    hero: imageSchema,

    logo:
      imageSchema.optional(),

    gallery: z
      .array(imageSchema)
      .default([])
  });
};

const manufacturerSeriesSchema =
  z.object({
    key: z.string(),

    name: z.string(),

    description:
      z.string().optional(),

    suitableFor: z
      .array(z.string())
      .default([]),

    productSlugs: z
      .array(z.string())
      .default([])
  });

const manufacturerExperienceSchema =
  z.object({
    summary:
      z.string().optional(),

    positives: z
      .array(z.string())
      .default([]),

    criticism: z
      .array(z.string())
      .default([]),

    support:
      z.string().optional(),

    methodology:
      z.string().optional()
  });

const manufacturerSourceSchema =
  z.object({
    label: z.string(),

    url:
      z.string().optional(),

    description:
      z.string().optional()
  });

export const createManufacturerContentSchema = (image: ImageFunction) =>
  baseContentSchema.extend({
    type: z
      .literal("manufacturer")
      .default("manufacturer"),

    layout: z
      .literal("manufacturer")
      .default("manufacturer"),

    key: z.string(),

    name: z.string(),

    website:
      z.string().optional(),

    rating: z
      .number()
      .min(0)
      .max(5)
      .optional(),

    recommendation:
      z.string(),

    summary:
      z.string(),

    images:
      createManufacturerImagesSchema(image),

    productCategories: z
      .array(z.string())
      .default([]),

    productAreas: z
      .array(z.string())
      .default([]),

    focus: z
      .array(z.string())
      .default([]),

    suitableFor: z
      .array(z.string())
      .default([]),

    attention: z
      .array(z.string())
      .default([]),

    strengths: z
      .array(z.string())
      .default([]),

    weaknesses: z
      .array(z.string())
      .default([]),

    productSlugs: z
      .array(z.string())
      .default([]),

    featuredProductSlugs: z
      .array(z.string())
      .default([]),

    series: z
      .array(
        manufacturerSeriesSchema
      )
      .default([]),

    experience:
      manufacturerExperienceSchema
        .optional(),

    alternativeManufacturerSlugs: z
      .array(z.string())
      .default([]),

    sources: z
      .array(
        manufacturerSourceSchema
      )
      .default([]),

    faq: z
      .array(faqSchema)
      .default([])
  });

export const manufacturersCollection =
  defineCollection({
    loader: glob({
      pattern:
        "**/*.{md,mdx}",

      base:
        "./src/content/manufacturers"
    }),

    schema: ({ image }) =>
      createManufacturerContentSchema(image)
  });

export type ManufacturerContentData =
  z.infer<
    ReturnType<typeof createManufacturerContentSchema>
  >;
