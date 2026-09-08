import { costFoundationSchema, accessoryOfferSchema } from '../content/schema/consumables.mjs';

const DAY = 86400000;
const known = fact => fact?.status === 'known' ? fact.value : undefined;
const unavailable = (status, reasons) => ({status, reasons, unitCost:null, annualCostLow:null, annualCostHigh:null, threeYearConsumableCost:null, provenance:null});

function currentOffer(offer, now, maxPriceAgeDays) {
  const parsed = accessoryOfferSchema.safeParse(offer);
  if (!parsed.success) return {status:'invalidData',reasons:['invalidOffer']};
  const price = parsed.data.price;
  if (price.current == null || parsed.data.priceState !== 'available' || parsed.data.availability !== 'available') return {status:'insufficientData',reasons:['currentAvailablePrice']};
  const age = +new Date(now) - +new Date(price.checkedAt);
  if (!Number.isFinite(age) || !Number.isFinite(maxPriceAgeDays) || maxPriceAgeDays < 0 || age < 0 || age > maxPriceAgeDays*DAY) return {status:'insufficientData',reasons:['freshPriceTimestamp']};
  return {price, offer:parsed.data};
}

/** Amortized consumption, not packs purchased. No rounding or inferred price selection. */
export function calculateConsumableCost({product, consumableId, offerId, now = new Date(), maxPriceAgeDays = 30}) {
  const parsed = costFoundationSchema.safeParse(product);
  if (!parsed.success) return unavailable('invalidData',parsed.error.issues.map(x=>x.path.join('.')+': '+x.message));
  const index = product.consumables?.findIndex(x=>x.id===consumableId) ?? -1;
  if (index < 0) return unavailable('insufficientData',['consumable']);
  const item = product.consumables[index];
  if (item.replacementInterval?.status === 'notApplicable') return unavailable('notApplicable',['noRecurringInterval']);
  const packSize = known(item.packSize), range = known(item.replacementInterval);
  const reasons = [];
  if (packSize === undefined) reasons.push('packSize');
  if (range === undefined) reasons.push('replacementInterval');
  const compatibility = known(item.compatibility);
  if (!compatibility || !product.slug || !compatibility.includes(product.slug)) reasons.push('exactCompatibility');
  const offerIndex = item.offers?.findIndex(o=>o.id===offerId) ?? -1;
  if (offerIndex < 0) reasons.push('selectedOffer');
  if (reasons.length) return unavailable('insufficientData',reasons);
  const snapshot = currentOffer(item.offers[offerIndex],now,maxPriceAgeDays);
  if (!snapshot.price) return unavailable(snapshot.status,snapshot.reasons);
  const {price} = snapshot;
  const unitCost = price.current / packSize;
  const annualCostLow = unitCost * (365 / range.maxDays);
  const annualCostHigh = unitCost * (365 / range.minDays);
  if (![unitCost,annualCostLow,annualCostHigh,3*annualCostHigh].every(Number.isFinite)) return unavailable('invalidData',['numericOverflow']);
  const fieldPaths = ['packSize','replacementInterval','compatibility','required','dependency'].map(k=>`consumables.${index}.${k}`);
  return {status:'calculated',reasons:[],currency:price.currency,unitCost,annualCostLow,annualCostHigh,
    threeYearConsumableCost:{low:3*annualCostLow,high:3*annualCostHigh},
    mandatory:known(item.required) ?? null,
    provenance:{sourceType:'calculated',formulaVersion:'consumable-cost-v1',
      formula:'unit = packPrice / packSize; annualLow = unit * 365 / maxDays; annualHigh = unit * 365 / minDays; threeYear = annual * 3',
      calculatedAt:new Date(now).toISOString(), productSlug:product.slug,consumableId,offerId,
      priceField:`consumables.${index}.offers.${offerIndex}.price`,priceTimestamp:new Date(price.checkedAt).toISOString(),
      inputs:{packPrice:price.current,currency:price.currency,packSize,minDays:range.minDays,maxDays:range.maxDays},
      source:price.source,fieldPaths,
      evidence:(product.evidenceSources ?? []).filter(s=>s.fields.some(f=>fieldPaths.includes(f))).map(s=>structuredClone(s)),
      assumptions:['365 days/year','constant selected price and interval for projection','amortized use; no pack rounding, shipping, electricity or failure-dependent replacements']
    }};
}

/** No replacementParts parameter: repairability parts never enter mandatory recurring TCO. */
export function calculateThreeYearCost({product, purchaseOffer, offerIds = {}, now = new Date(), maxPriceAgeDays = 30}) {
  const insufficient = reasons => ({status:'insufficientData',reasons,threeYearCost:null,mandatoryRecurring:null,optional:[],provenance:null});
  const parsed = costFoundationSchema.safeParse(product);
  if (!parsed.success) return {...insufficient(['invalidFoundation']),status:'invalidData'};
  if (known(product.consumablePolicy?.inventoryComplete) !== true) return insufficient(['completeConsumableInventory']);
  const purchase = currentOffer(purchaseOffer,now,maxPriceAgeDays);
  if (!purchase.price) return {...insufficient(purchase.reasons),status:purchase.status};
  const mandatory = [], optional = [];
  for (const item of product.consumables ?? []) {
    const required = known(item.required);
    if (required === undefined) return insufficient(['requirement:'+item.id]);
    const calculation = calculateConsumableCost({product,consumableId:item.id,offerId:offerIds[item.id],now,maxPriceAgeDays});
    if (!required) { optional.push({consumableId:item.id,calculation}); continue; }
    if (calculation.status !== 'calculated') return insufficient(['mandatoryCost:'+item.id,...calculation.reasons]);
    if (calculation.currency !== purchase.price.currency) return insufficient(['currencyMismatch']);
    mandatory.push(calculation);
  }
  const low = mandatory.reduce((sum,c)=>sum+c.annualCostLow,0), high = mandatory.reduce((sum,c)=>sum+c.annualCostHigh,0);
  const threeYearCost = {low:purchase.price.current + 3*low,high:purchase.price.current + 3*high};
  if (!Object.values(threeYearCost).every(Number.isFinite)) return {...insufficient(['numericOverflow']),status:'invalidData'};
  return {status:'calculated',reasons:[],currency:purchase.price.currency,threeYearCost,mandatoryRecurring:{annualLow:low,annualHigh:high},optional,
    provenance:{sourceType:'calculated',formulaVersion:'three-year-cost-v1',formula:'purchasePrice + 3 * mandatoryAnnualConsumables',calculatedAt:new Date(now).toISOString(),
      purchaseOffer:structuredClone(purchase.offer),consumables:mandatory.map(x=>x.provenance),inventoryEvidence:(product.evidenceSources??[]).filter(s=>s.fields.includes('consumablePolicy.inventoryComplete')),
      exclusions:['optional consumables','failure-dependent replacement parts','electricity','shipping'],assumption:'constant prices; zero mandatory consumables only when inventory is explicitly complete'}};
}
