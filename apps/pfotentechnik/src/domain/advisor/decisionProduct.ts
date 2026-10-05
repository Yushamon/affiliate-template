import type { CollectionEntry } from 'astro:content';
import type { AdvisorFact, AdvisorProduct } from './types';
import { mapProductToAdvisor } from './mapProduct.ts';
import { calculateConsumableCost } from '../consumableCosts.mjs';

const unknown = (): AdvisorFact<any> => ({ status: 'unknown' });
const fact = (value: unknown): AdvisorFact<any> => value == null ? unknown() : { status: 'known', value };
const known = (value: any) => value?.status === 'known' ? value.value : undefined;
// Raw GPS data avoids turning schema-defaulted missing booleans into documented FALSE.
export const mapDecisionProduct = (entry: CollectionEntry<'products'>, raw: any, foundation?: any, now = new Date()): AdvisorProduct => {
  const product = mapProductToAdvisor(entry);
  const image = entry.data.images?.thumbnail ?? entry.data.images?.hero;
  if (image) product.image = { src: typeof image.src === 'string' ? image.src : image.src.src, alt: image.alt };
  const gps = raw.gps;
  const facts: NonNullable<AdvisorProduct['decisionFacts']> = {
    animal: fact(gps?.animal?.length ? gps.animal : raw.comparisonFilters?.animal?.length ? raw.comparisonFilters.animal : undefined),
    multiPet: fact(raw.multiPet?.sharedUse === 'supported' ? true : raw.multiPet?.sharedUse === 'unavailable' ? false : undefined)
  };
  product.decisionCautions = [];
  if (product.category === 'gps-tracker') {
    facts.animal = fact(gps?.animal?.length ? gps.animal : undefined);
    Object.assign(facts, {
      minimumWeight: fact(gps?.minimumPetWeightKg), subscription: fact(gps?.subscriptionRequired),
      deviceWeight: fact(gps?.deviceWeightGrams), batteryDays: fact(gps?.batteryMaxDays),
      live: fact(gps?.liveTracking), fence: fact(gps?.virtualFence), activity: fact(gps?.activityTracking)
    });
    if (gps?.subscriptionRequired === true) product.decisionCautions.push('Abo erforderlich.');
    if (gps?.batteryMaxDays) product.decisionCautions.push(`Akkulaufzeit bis zu ${gps.batteryMaxDays} Tage: Hersteller-Maximalwert, abhängig von Nutzung${gps.batteryCondition ? ` (${gps.batteryCondition})` : ''}.`);
  } else {
    const fountain = raw.comparisonData?.fountain ?? {};
    const researched = foundation?.data?.comparisonData?.fountain ?? {};
    const operating = (key: string) => fountain[key] ?? researched[key];
    const material: string[] | undefined = fountain.material;
    let power = known(operating('powerType'));
    const researchPower = known(researched.powerType);
    const conflicts: string[] = foundation?.research?.conflicts ?? [];
    const conflictingPower = power && (researchPower && researchPower !== power || typeof fountain.battery === 'boolean' && fountain.battery !== (power !== 'mains'));
    if (conflictingPower || conflicts.some(c => /netz|akku|powerType|stromversorgung/i.test(c))) {
      power = undefined;
      product.decisionCautions.push('Netz-/Akkudaten widersprechen sich; Betrieb ohne Steckdose vor dem Kauf klären.');
    }
    Object.assign(facts, {
      capacity: fact(fountain.capacityLiters), material: fact(material?.length ? material : undefined),
      steel: fact(material?.length ? material.some(m => /edelstahl|stainless/i.test(m)) : undefined),
      cordless: fact(power ? power !== 'mains' : undefined),
      dishwasher: fact(known(operating('dishwasherSafeParts'))?.length != null ? known(operating('dishwasherSafeParts')).length > 0 : typeof fountain.dishwasherSafe === 'boolean' ? fountain.dishwasherSafe : undefined),
      filterCost: unknown()
    });
    if (power === 'mains') product.decisionCautions.push('Nur Netzbetrieb dokumentiert.');
    if (material?.length) product.decisionCautions.push(`Material laut Dokumentation: ${material.join('; ')}. Daraus folgt keine vollständig kunststofffreie Trinkfläche.`);
    if (foundation) {
      const filter = foundation.data.consumables?.find((c: any) => c.type === 'filter');
      if (filter) {
        const calculation = calculateConsumableCost({ product: foundation.data, consumableId: filter.id, offerId: foundation.representativeOfferIds?.[filter.id], now });
        if (calculation.status === 'calculated') {
          facts.filterCost = fact(calculation.annualCostHigh);
          product.decisionCautions.push(`Filterkosten: ca. ${Math.round(calculation.annualCostLow)}–${Math.round(calculation.annualCostHigh)} € pro Jahr nach Hersteller-Wechselintervall; keine vollständigen Folgekosten. Preisstand: ${calculation.provenance.priceTimestamp.slice(0, 10)}.`);
        }
      }
    }
  }
  product.decisionFacts = facts;
  return product;
};
export const isDecisionAdvisorProduct = (entry: CollectionEntry<'products'>) =>
  ['gps-tracker', 'trinkbrunnen'].includes(entry.data.category.key)
  && !['discontinued', 'legacy'].includes(entry.data.productStatus)
  && entry.data.recommendationStatus !== 'archived';
