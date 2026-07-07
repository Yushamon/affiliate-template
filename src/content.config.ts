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

     premiumBlocks: z

      .array(

        z.object({

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
productFilter: z.string().optional(),

productLimit: z.number().optional(),
          text: z.string().optional(),

          href: z.string().optional(),

          cta: z.string().optional(),

          items: z.array(z.string()).optional(),

          cards: z

            .array(

              z.object({

                label: z.string().optional(),

                title: z.string(),

                text: z.string().optional(),

                value: z.string().optional(),

                href: z.string().optional(),

                cta: z.string().optional(),

                badge: z.string().optional(),

                productKey: z.string().optional(),

                items: z.array(z.string()).optional()

              })

            )

            .optional()

        })

      )

      .optional(),
  })
});

export const collections = {
  pages
};