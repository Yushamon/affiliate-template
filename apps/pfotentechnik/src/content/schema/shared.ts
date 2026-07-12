import { z } from "astro/zod";

export const faqSchema = z.object({
  question: z.string(),
  answer: z.string()
});

export const authorSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  url: z.string().optional()
});

export const hubSchema = z.object({
  sections: z.array(z.string()).default([]),
  title: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().default(100),
  featured: z.boolean().default(false)
});

export const imageSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional()
});

export const seoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  canonical: z.string().optional(),
  noindex: z.boolean().default(false),
  sitemap: z.boolean().default(true),
  priority: z.number().min(0).max(1).optional(),
  changefreq: z
    .enum([
      "always",
      "hourly",
      "daily",
      "weekly",
      "monthly",
      "yearly",
      "never"
    ])
    .optional()
});