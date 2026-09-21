import { z } from 'astro/zod';
import { commerceOfferCoreSchema } from './commerce.mjs';
import { evidenceSourceSchema } from './evidence.mjs';

export const fact = value => z.discriminatedUnion('status', [
  z.object({status:z.literal('known'), value}).strict(),
  z.object({status:z.literal('unknown')}).strict(),
  z.object({status:z.literal('notApplicable')}).strict()
]);
const positive = z.number().finite().positive();
const interval = z.object({minDays:positive, maxDays:positive}).strict()
  .refine(v => v.minDays <= v.maxDays, 'minDays must not exceed maxDays');
export const compatibilitySchema = fact(z.array(z.string().min(1)).min(1));
export const accessoryOfferSchema = commerceOfferCoreSchema.strict().superRefine((v,c) => {
  if (v.price.current != null && (!v.price.checkedAt || !v.price.source?.url || !['merchant','affiliate'].includes(v.price.source?.type))) {
    c.addIssue({code:'custom',message:'Accessory price needs merchant source URL and price timestamp.'});
  }
  for (const url of [v.price.source?.url,v.price.affiliateUrl,v.affiliate?.url].filter(Boolean)) {
    if (!url.startsWith('https://')) c.addIssue({code:'custom',message:'Commerce destinations must use HTTPS.'});
  }
});
export const accessoryOffersSchema = z.array(accessoryOfferSchema).superRefine((v,c) => {
  if (new Set(v.map(x=>x.id)).size !== v.length) c.addIssue({code:'custom',message:'Offer IDs must be unique within an item.'});
});
export const consumableSchema = z.object({
  id:z.string().min(1), type:z.enum(['filter','sponge','prefilter','waterTreatment','cleaningConsumable']), name:z.string().min(1),
  required:fact(z.boolean()).optional(),
  dependency:fact(z.enum(['proprietary','generic'])).optional(),
  filterType:fact(z.string().min(1)).optional(),
  packSize:fact(positive.int()).optional(),
  replacementInterval:fact(interval).optional(),
  compatibility:compatibilitySchema.optional(),
  partNumber:fact(z.string().min(1)).optional(),
  offers:accessoryOffersSchema.optional()
}).strict();
export const consumablesSchema = z.array(consumableSchema).superRefine((v,c) => {
  if (new Set(v.map(x=>x.id)).size !== v.length) c.addIssue({code:'custom',message:'Consumable IDs must be unique.'});
});
export const consumablePolicySchema = z.object({
  filterPresent:fact(z.boolean()).optional(),
  filterlessOperationPossible:fact(z.boolean()).optional(),
  inventoryComplete:fact(z.boolean()).optional()
}).strict();
// Reuse repairability.parts: no second replacement-part inventory or availability flag.
export const replacementCommerceShape = {
  id:z.string().min(1).optional(), name:z.string().min(1).optional(),
  compatibility:compatibilitySchema.optional(), offers:accessoryOffersSchema.optional()
};
export const fountainOperatingShape = {
  powerType:fact(z.enum(['mains','battery','mainsAndBattery'])).optional(),
  batteryRuntime:fact(z.object({minDays:positive,maxDays:positive,conditions:z.string().min(1)}).strict().refine(v=>v.minDays<=v.maxDays)).optional(),
  lowWaterShutdown:fact(z.boolean()).optional(), waterLevelVisible:fact(z.boolean()).optional(),
  pumpRemovable:fact(z.boolean()).optional(), dishwasherSafeParts:fact(z.array(z.string().min(1))).optional()
};

// Exact field paths reference the existing evidenceSources array. No inferred evidence.
export function validateFoundationEvidence(product, context) {
  const sources = product.evidenceSources ?? [];
  const issue = (path,message) => context.addIssue({code:'custom',path:path.split('.'),message});
  const evidenceFor = path => sources.filter(s=>s.fields?.includes(path) && s.sourceType && s.sourceType !== 'calculated');
  function walk(value,path) {
    if (!value || typeof value !== 'object') return;
    if (value.status === 'known') {
      const evidence = evidenceFor(path);
      if (!evidence.length) issue(path,'Known research fact requires typed evidenceSources with exact field path.');
      if (path.endsWith('.replacementInterval') && !evidence.some(s=>['manufacturer','manual','officialStore'].includes(s.sourceType))) issue(path,'Manufacturer replacement interval requires official evidence.');
      if (path.endsWith('filterlessOperationPossible') && value.value === true && !evidence.some(s=>['manufacturer','manual','officialStore'].includes(s.sourceType))) issue(path,'Filterless operation needs official confirmation.');
      return;
    }
    for (const [key,child] of Object.entries(value)) if (key !== 'offers') walk(child,path ? path+'.'+key:key);
  }
  walk(product.consumables,'consumables'); walk(product.consumablePolicy,'consumablePolicy');
  for (const key of Object.keys(fountainOperatingShape)) walk(product.comparisonData?.fountain?.[key],'comparisonData.fountain.'+key);
  for (const [i,part] of (product.repairability?.parts ?? []).entries()) {
    walk(part.compatibility,`repairability.parts.${i}.compatibility`);
    if (part.offers?.length && !part.id) issue(`repairability.parts.${i}.id`,'Commerce-linked replacement part needs stable ID.');
  }
  if (product.consumablePolicy?.filterPresent?.value === false && product.consumables?.some(x=>x.type==='filter')) issue('consumablePolicy.filterPresent','Absent filter conflicts with filter inventory.');
  if (product.consumablePolicy?.filterlessOperationPossible?.value === true && product.consumables?.some(x=>x.type==='filter' && x.required?.value === true)) issue('consumablePolicy.filterlessOperationPossible','Filterless operation conflicts with required filter.');
}

// Narrow validation projection, also usable by calculations and repository QA.
export const costFoundationSchema = z.object({
  slug:z.string().optional(), evidenceSources:z.array(evidenceSourceSchema).optional(),
  consumables:consumablesSchema.optional(), consumablePolicy:consumablePolicySchema.optional(),
  repairability:z.object({parts:z.array(z.object(replacementCommerceShape).passthrough()).optional()}).passthrough().optional(),
  comparisonData:z.object({fountain:z.object(fountainOperatingShape).passthrough().optional()}).passthrough().optional()
}).passthrough().superRefine(validateFoundationEvidence);
