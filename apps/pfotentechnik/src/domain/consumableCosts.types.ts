import type { z } from 'astro/zod';
import { consumableSchema, consumablePolicySchema, accessoryOfferSchema, costFoundationSchema } from '../content/schema/consumables.mjs';

export type Consumable = z.infer<typeof consumableSchema>;
export type ConsumablePolicy = z.infer<typeof consumablePolicySchema>;
export type AccessoryOffer = z.infer<typeof accessoryOfferSchema>;
export type CostFoundation = z.infer<typeof costFoundationSchema>;
export type ResearchValue<T> = {status:'known'; value:T} | {status:'unknown'} | {status:'notApplicable'};
