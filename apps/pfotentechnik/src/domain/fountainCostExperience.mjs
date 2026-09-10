import { calculateConsumableCost } from "./consumableCosts.mjs";
import { ACCESSORY_COMMERCE_STATUS, classifyAccessoryOffer } from "./accessoryCommerce.mjs";

const known = (fact) => fact?.status === "known" ? fact.value : undefined;
const money = (value, currency = "EUR") => new Intl.NumberFormat("de-DE", {
  style: "currency", currency, maximumFractionDigits: 0
}).format(Math.round(value));

function intervalLabel(interval) {
  if (!interval) return null;
  const { minDays, maxDays } = interval;
  const inWeeks = minDays % 7 === 0 && maxDays % 7 === 0;
  const low = inWeeks ? minDays / 7 : minDays;
  const high = inWeeks ? maxDays / 7 : maxDays;
  const unit = inWeeks ? (high === 1 ? "Woche" : "Wochen") : (high === 1 ? "Tag" : "Tage");
  return low === high ? `alle ${low} ${unit}` : `alle ${low}–${high} ${unit}`;
}

function costDisplay(calculation) {
  if (calculation?.status !== "calculated") return null;
  const low = Math.round(calculation.annualCostLow);
  const high = Math.round(calculation.annualCostHigh);
  return {
    visible: low === high ? `ca. ${money(low, calculation.currency)} pro Jahr` : `${money(low, calculation.currency)}–${money(high, calculation.currency)} pro Jahr`,
    accessible: low === high ? `etwa ${low} Euro pro Jahr` : `${low} bis ${high} Euro pro Jahr`,
    low, high, currency: calculation.currency,
    provenance: {
      sourceType: calculation.provenance.sourceType,
      priceTimestamp: calculation.provenance.priceTimestamp,
      inputs: calculation.provenance.inputs,
      source: calculation.provenance.source,
      evidence: calculation.provenance.evidence
    }
  };
}

export function buildFountainCostExperience({
  enabled = false,
  manifestEntry,
  datasetRecord,
  trackingId = "",
  now = new Date()
} = {}) {
  if (!enabled || !manifestEntry || manifestEntry.state === "HIDE") return null;
  if (!datasetRecord || datasetRecord.slug !== manifestEntry.slug) return null;

  const product = datasetRecord.data;
  const consumable = product.consumables?.find((item) => item.id === manifestEntry.consumableId)
    ?? product.consumables?.find((item) => item.type === "filter")
    ?? product.consumables?.[0];
  if (!consumable) return null;

  const selectedOffer = consumable.offers?.find((offer) => offer.id === manifestEntry.costOfferId) ?? null;
  const calculation = manifestEntry.costRenderable && manifestEntry.costOfferId
    ? calculateConsumableCost({ product, consumableId: consumable.id, offerId: manifestEntry.costOfferId, now })
    : null;
  const annualCost = costDisplay(calculation);
  const interval = known(consumable.replacementInterval);
  const packSize = known(consumable.packSize);
  const requirement = known(consumable.required);

  let affiliate = null;
  if (manifestEntry.affiliateCtaRenderable && manifestEntry.affiliateAsin) {
    const decision = classifyAccessoryOffer({
      offer: { price: { source: { url: `https://www.amazon.de/dp/${manifestEntry.affiliateAsin}` } }, priceState: "available", availability: "available" },
      productSlug: manifestEntry.slug,
      compatibility: consumable.compatibility,
      exactProductIdentity: true,
      candidatePackSize: manifestEntry.affiliatePackSize,
      costInputPackSize: packSize,
      merchant: "amazon",
      affiliateMechanismAvailable: true,
      trackingId
    });
    if (decision.status === ACCESSORY_COMMERCE_STATUS.AFFILIATE_READY) {
      affiliate = { url: decision.affiliateUrl, label: "Ersatzfilter ansehen", rel: "sponsored nofollow noopener", target: "_blank" };
    }
  }

  return {
    state: manifestEntry.state,
    heading: "Filter & laufende Kosten",
    filterName: consumable.name,
    interval: intervalLabel(interval),
    annualCost,
    requirementKnown: requirement !== undefined,
    requirement,
    conditionalCostNote: requirement === undefined && annualCost
      ? "Bei Nutzung nach dem Hersteller-Wechselintervall entstehen rechnerisch diese Filterkosten."
      : null,
    offer: manifestEntry.offerRenderable && selectedOffer ? {
      packLabel: packSize ? `${packSize} Ersatzfilter` : "Passendes Ersatzfilter-Angebot",
      priceLabel: selectedOffer.price?.current != null ? money(selectedOffer.price.current, selectedOffer.price.currency) : null,
      merchantLabel: selectedOffer.price?.source?.label ?? null
    } : null,
    affiliate,
    methodology: annualCost
      ? "Berechnet aus aktuellem Filterpreis, Packungsgröße und dem vom Hersteller angegebenen Wechselintervall."
      : null,
    evidence: {
      interval: interval ? "Wechselintervall: Herstellerangabe" : null,
      cost: annualCost ? "Jahreskosten: PfotenTechnik-Berechnung" : null,
      price: selectedOffer?.price?.source?.label ? `Preis: ${selectedOffer.price.source.label}` : null
    },
    conflicts: [...(manifestEntry.conflicts ?? [])],
    pumpCostsIncluded: false,
    totalCostOfOwnership: null,
    datasetComparison: null
  };
}
