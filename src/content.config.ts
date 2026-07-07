import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const premiumCardSchema = z.object({
  label: z.string().optional(),
  title: z.string(),
  text: z.string().optional(),
  value: z.string().optional(),
  href: z.string().optional(),
  cta: z.string().optional(),
  badge: z.string().optional(),
  productKey: z.string().optional(),
  items: z.array(z.string()).optional()
});

const premiumRowSchema = z.object({
  label: z.string().optional(),
  left: z.string().optional(),
  right: z.string().optional(),
  title: z.string().optional(),
  text: z.string().optional(),
  value: z.string().optional(),
  recommendation: z.string().optional(),
  href: z.string().optional()
});

const premiumBlockSchema = z.object({
  type: z.enum([
    "answer",
    "quickFacts",
    "scenarios",
    "decision",
    "steps",
    "products",
    "checks",
    "mistakes",
    "expert",
    "vde",
    "recommendation",
    "checklist",

    "quickAnswer",
    "comparison",
    "decisionMatrix",
    "buyerTypes",
    "prosCons",
    "myths",
    "stats",
    "timeline",
    "calculatorCTA",
    "relatedGuides"
  ]),

  eyebrow: z.string().optional(),

  title: z.string().optional(),

  question: z.string().optional(),

  answer: z.string().optional(),

  text: z.string().optional(),

  href: z.string().optional(),

  cta: z.string().optional(),

  productFilter: z.string().optional(),

  productLimit: z.number().optional(),

  headers: z.array(z.string()).optional(),

  rows: z.array(premiumRowSchema).optional(),

  bullets: z.array(z.string()).optional(),

  items: z.array(z.string()).optional(),

  cards: z.array(premiumCardSchema).optional()
});

const pages = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/pages"
  }),

  schema: z.object({
    title: z.string(),

    seoTitle: z.string().optional(),

    slug: z.string(),

    description: z.string(),

    seoDescription: z.string().optional(),

    category: z.string(),

    categoryLabel: z.string(),

    tags: z.array(z.string()).default([]),

    author: z
      .object({
        name: z.string(),
        role: z.string().optional()
      })
      .optional(),

    publishedAt: z.string().optional(),

    updatedAt: z.string().optional(),

    faq: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string()
        })
      )
      .optional(),

    intent: z.string().optional(),

    topic: z.string().optional(),

    hubPriority: z.number().optional(),

    heroImage: z.string().optional(),

    heroPrompt: z.string().optional(),

    ogImage: z.string().optional(),

    featured: z.boolean().optional(),

    premiumBlocks: z.array(premiumBlockSchema).optional()
  })
});

export const collections = {
  pages
};