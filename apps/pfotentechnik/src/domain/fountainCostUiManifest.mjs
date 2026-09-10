export const FOUNTAIN_COST_UI_STATES = Object.freeze(["FULL", "COST_ONLY", "OFFER_ONLY", "INFO_ONLY", "HIDE"]);

const cost = (slug, costOfferId, extra = {}) => ({
  slug, costRenderable: true, offerRenderable: true, affiliateCtaRenderable: false,
  costOfferId, consumableId: "primary-filter-0", evidenceReadiness: "verified",
  reason: "Berechenbare Filterkosten; kein exakt konsistentes affiliate-fähiges Angebot.", ...extra
});
const info = (slug, extra = {}) => ({
  slug, state: "INFO_ONLY", costRenderable: false, offerRenderable: false,
  affiliateCtaRenderable: false, evidenceReadiness: "partial",
  reason: "Wartungs- oder Filterinformation vorhanden, aber keine belastbare Jahreskostenangabe.", ...extra
});
const full = (slug, costOfferId, affiliateAsin, affiliatePackSize) => cost(slug, costOfferId, {
  state: "FULL", affiliateCtaRenderable: true, affiliateAsin, affiliatePackSize,
  reason: "Berechenbare Filterkosten und exakt verifiziertes Amazon-Direktangebot."
});

export const fountainCostUiManifest = Object.freeze([
  cost("cat-mate-shell-fountain", "primary-filter-35b1-zooplus", { state: "COST_ONLY" }),
  { slug: "oneisall-7l-dog-water-fountain", state: "OFFER_ONLY", costRenderable: false, offerRenderable: true, affiliateCtaRenderable: false, consumableId: "primary-filter-0", costOfferId: "primary-filter-0-eu-standard", evidenceReadiness: "verified", reason: "Kompatibles Kaufangebot vorhanden; Wechselintervall und Jahreskosten nicht belastbar." },
  cost("petkit-eversweet-max-cordless", "primary-filter-0-eu-standard", { state: "COST_ONLY" }),
  info("petkit-eversweet-ultra", { consumableId: "waterTreatment-0" }),
  cost("petlibro-dockstream-rfid-smart", "primary-filter-0-eu-standard", { state: "COST_ONLY" }),
  cost("petlibro-glacier-ultrafiltration", "primary-filter-0-eu-standard", { state: "COST_ONLY" }),
  info("petlibro-stainless-steel-fountain", { consumableId: "primary-filter-0" }),
  cost("xiaomi-smart-pet-fountain-2", "primary-filter-35b1-techpunt", { state: "COST_ONLY" }),
  full("cat-mate-335-pet-fountain", "primary-filter-0-eu-standard", "B073Q3D82W", 6),
  info("feelneedy-fn-w18-8l-katzenbrunnen", { consumableId: "primary-filter-0" }),
  info("oneisall-3-2l-cordless-fountain", { consumableId: "primary-filter-0" }),
  full("petkit-eversweet-3-pro-uvc", "primary-filter-0-eu-standard", "B0BVQPJRLH", 5),
  cost("petlibro-dockstream-2-smart", "primary-filter-0-eu-standard", { state: "COST_ONLY", conflicts: ["COST_INPUT_OFFER_MISMATCH"], reason: "4er-Kosteninput bleibt vom 8er-Amazon-Angebot getrennt." }),
  cost("petlibro-dockstream-2-smart-cordless", "primary-filter-0-eu-standard", { state: "COST_ONLY", conflicts: ["COST_INPUT_OFFER_MISMATCH"], reason: "4er-Kosteninput bleibt vom 8er-Amazon-Angebot getrennt." }),
  full("catit-pixi-smart-trinkbrunnen", "primary-filter-0-eu-standard", "B095CFB3VZ", 6),
  info("oneisall-2-2l-cordless-fountain", { consumableId: "primary-filter-0" }),
  info("oneisall-3-5l-cordless-fountain", { consumableId: "primary-filter-0" }),
  info("petkit-eversweet-5-mini", { consumableId: "primary-filter-0" }),
  cost("petkit-eversweet-max-2-uvc", "primary-filter-35b1-petkit-eu", { state: "COST_ONLY" }),
  full("petkit-eversweet-solo-2-fountain", "primary-filter-0-eu-standard", "B0BVQPJRLH", 5),
  full("petkit-eversweet-solo-se", "primary-filter-0-eu-standard", "B0BVQPJRLH", 5),
  info("petlibro-capsule-dog-fountain", { consumableId: "primary-filter-0" }),
  cost("petlibro-dockstream-cordless", "primary-filter-0-eu-standard", { state: "COST_ONLY", conflicts: ["COST_INPUT_OFFER_MISMATCH"], reason: "4er-Kosteninput bleibt vom 8er-Amazon-Angebot getrennt." }),
  cost("petsafe-streamside-trinkbrunnen", "primary-filter-35b1-hommel-gbr", { state: "COST_ONLY" })
]);

export const fountainCostUiManifestBySlug = new Map(fountainCostUiManifest.map((entry) => [entry.slug, entry]));
