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

const decisionJourneySchema = z.object({
  cluster: z.string(),
  stage: z.enum(["orientation", "problem", "evaluation", "decision", "support"]),
  intent: z.string(),
  primaryQuestion: z.string(),
  next: z.array(z.string()).default([]),
  fallback: z.array(z.string()).default([])
});

const evidenceSourceSchema = z.object({
  source: z.string(),
  url: z.string().url(),
  accessedAt: z.coerce.date(),
  assertion: z.string(),
  fields: z.array(z.string()).min(1)
});

export const baseContentSchema = z.object({
  title: z.string(),
  slug: z.string(),

  type: contentTypeSchema,
  layout: contentLayoutSchema,

  description: z.string(),

  /** Explizite, eindeutige Namensvarianten. Keine semantischen Gruppen. */
  aliases: z
    .array(z.string())
    .default([]),

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
    .optional(),

  decisionJourney: decisionJourneySchema.optional(),

  evidenceSources: z
    .array(evidenceSourceSchema)
    .default([])
});

export type BaseContentData =
  z.infer<
    typeof baseContentSchema
  >;
