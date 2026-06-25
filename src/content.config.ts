import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const pages = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/pages"
  }),

  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),

    category: z.string(),
    categoryLabel: z.string(),

    tags: z.array(z.string()).default([]),

    faq: z.array(
      z.object({
        question: z.string(),
        answer: z.string()
      })
    ).optional(),

    intent: z.string().optional(),

    topic: z.string().optional(),

    hubPriority: z.number().optional(),

    heroImage: z.string().optional(),

    heroPrompt: z.string().optional(),

    ogImage: z.string().optional(),

    featured: z.boolean().optional()
  })
});

export const collections = {
  pages
};