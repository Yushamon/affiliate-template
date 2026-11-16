import { z } from 'astro/zod';
import { evidenceSourceSchema } from './evidence.mjs';

export const productEditorialPatchSchema = z.object({
  model: z.string().trim().min(1).optional(),
  mpn: z.string().trim().min(1).optional(),
  asin: z.string().regex(/^[A-Z0-9]{10}$/).optional(),
  priceAutomation: z.enum(['automatic', 'editorial']).optional(),
  ratings: z.record(z.string().min(1), z.number().min(0).max(5)).refine(value => Object.keys(value).length > 0).optional(),
  editorialStatus: z.enum(['complete', 'recommended', 'required', 'archived']).optional(),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }).optional(),
  evidenceSources: z.array(evidenceSourceSchema.refine(source => /^https?:\/\//i.test(source.url), 'Quellen müssen HTTP(S)-URLs verwenden.')).optional(),
  methodology: z.string().trim().min(20).optional()
}).strict().refine(value => Object.keys(value).length > 0, 'Keine redaktionellen Felder übergeben.');
