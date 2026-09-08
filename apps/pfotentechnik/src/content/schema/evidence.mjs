import { z } from 'astro/zod';

// Existing evidenceSources remains the sole field-level source registry.
export const provenanceTypes = ['manufacturer', 'manual', 'officialStore', 'retailer', 'ownMeasurement', 'calculated', 'independentSource', 'aggregatedUserReports'];
export const evidenceSourceSchema = z.object({
  source: z.string(), url: z.string().url(), accessedAt: z.coerce.date(),
  assertion: z.string(), fields: z.array(z.string()).min(1),
  sourceType: z.enum(provenanceTypes).optional()
});
