import { z } from "astro/zod";

import {
  authorSchema,
  hubSchema,
  seoSchema
} from "./shared";

export const contentTypeSchema = z.enum([
  "page",
  "product",
  "manufacturer",
  "comparison",
  "knowledge"
]);

export const contentLayoutSchema = z.enum([
  "page",
  "product",
  "manufacturer",
  "comparison",
  "knowledge"
]);

export const baseContentSchema = z.object({
  title: z.string(),
  slug: z.string(),

  type: contentTypeSchema,
  layout: contentLayoutSchema,

  description: z.string(),

  author: authorSchema.optional(),

  publishedAt: z.string().optional(),
  updatedAt: z.string().optional(),

  tags: z
    .array(z.string())
    .default([]),

  hub: hubSchema.optional(),

  seo: seoSchema.optional(),

  navigation: z
    .object({
      show: z
        .boolean()
        .default(false),

      label: z
        .string()
        .optional(),

      section: z
        .string()
        .optional(),

      order: z
        .number()
        .default(100)
    })
    .optional(),

  related: z
    .object({
      tags: z
        .array(z.string())
        .default([]),

      exclude: z
        .array(z.string())
        .default([]),

      limit: z
        .number()
        .int()
        .positive()
        .default(4)
    })
    .optional()
});

export type BaseContentData =
  z.infer<
    typeof baseContentSchema
  >;