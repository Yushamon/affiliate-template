import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    category: z.string(),
    categoryLabel: z.string(),
    tags: z.array(z.string()).default([]),
    author: z.object({
      name: z.string(),
      role: z.string().optional()
    }),
    publishedAt: z.string(),
    updatedAt: z.string()
  })
});

export const collections = { pages };
