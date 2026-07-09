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
    "checklist"
  ]),
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  text: z.string().optional(),
  href: z.string().optional(),
  cta: z.string().optional(),
  productFilter: z.string().optional(),
  productLimit: z.number().optional(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
  imageKey: z.enum([
    "hero",
    "feature",
    "inline",
    "comparison",
    "guide",
    "faq",
    "product",
    "category",
    "decision",
    "calculator",
    "manufacturer",
    "feederHero",
    "feederComparison",
    "feederWetFood"
  ]).optional(),
  items: z.array(z.string()).optional(),
  cards: z.array(premiumCardSchema).optional()
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().optional(),
    slug: z.string(),
    description: z.string(),
    seoDescription: z.string().optional(),
    category: z.string(),
    categoryLabel: z.string(),
    categoryPath: z.string().optional(),
    tags: z.array(z.string()).default([]),
    author: z.object({
      name: z.string(),
      role: z.string().optional(),
      url: z.string().optional()
    }).optional(),
    publishedAt: z.string().optional(),
    updatedAt: z.string().optional(),
    hubPriority: z.number().optional(),
    project: z.string().optional(),
    heroImage: z.string().optional(),
    heroImageKey: z.enum([
      "hero",
      "feature",
      "inline",
      "comparison",
      "guide",
      "faq",
      "product",
      "category",
      "feederHero",
      "feederComparison",
      "feederWetFood"
    ]).optional(),
    ogImage: z.string().optional(),
    faq: z.array(
      z.object({
        question: z.string(),
        answer: z.string()
      })
    ).optional(),
    comparisonProducts: z.array(z.string()).optional(),
    decisionKey: z.string().optional(),
    comparisonRecommendation: z.object({
      title: z.string(),
      text: z.string(),
      tableTitle: z.string().optional(),
      cardsTitle: z.string().optional(),
      criteria: z.array(z.string()).optional()
    }).optional(),
    healthBridge: z.object({
      eyebrow: z.string(),
      title: z.string(),
      text: z.string(),
      href: z.string(),
      cta: z.string()
    }).optional(),
    closingCta: z.object({
      title: z.string(),
      text: z.string(),
      productKey: z.string(),
      primaryLabel: z.string(),
      secondaryHref: z.string(),
      secondaryLabel: z.string()
    }).optional(),
    premiumBlocks: z.array(premiumBlockSchema).optional()
  })
});

export const collections = { pages };
