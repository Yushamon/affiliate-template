import { z } from 'astro/zod';

// Preserve the original strings for review and exact-text approvals.
const nonBlank = z.string().refine(value => value.trim().length > 0, 'Darf nicht leer sein.');
export const productDecisionFactSchema = z.object({
  label: nonBlank,
  value: nonBlank,
  consequence: nonBlank
}).strict();

export const productDecisionFactsSchema = z.array(productDecisionFactSchema).default([]);

export const decisionFactApprovalRegistrySchema = z.object({
  version: z.literal(1),
  approvals: z.array(z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    reviewedAt: z.string().datetime({ offset: true }),
    reviewReference: nonBlank
  }).strict())
}).strict();
