import { stripLeadingIcon } from "@affiliate-core/utils/content";
import type { AlternativeRecommendation } from "@affiliate-core/components/product/alternativeRecommendation.types";
import type { ProductEntry } from "../index";

type ProductFeature = {
  kind: string;
  icon: string;
  headline: string;
  reason: string;
  difference: string;
  terms: string[];
};

const features: ProductFeature[] = [
  { kind: "wet-food", icon: "🥣", headline: "Wenn du überwiegend Nassfutter fütterst", reason: "Dieses Modell ist auf frische oder gekühlte Mahlzeiten ausgelegt.", difference: "Anders als klassische Trockenfutterautomaten unterstützt dieses Modell die sichere Aufbewahrung von Nassfutter.", terms: ["nassfutter", "wet food", "wetfood", "gekühlt", "kühlung"] },
  { kind: "access-control", icon: "🔐", headline: "Wenn mehrere Tiere getrennt gefüttert werden sollen", reason: "Dieses Modell schützt einzelne Portionen vor anderen Tieren im Haushalt.", difference: "RFID oder Mikrochip ermöglichen einen kontrollierten Zugang zum Futter.", terms: ["rfid", "mikrochip", "microchip", "zugangskontrolle", "futterneid"] },
  { kind: "camera", icon: "📷", headline: "Wenn du dein Tier aus der Ferne sehen möchtest", reason: "Dieses Modell bietet zusätzliche Kontrolle durch eine integrierte Kamera.", difference: "Mahlzeiten und Verhalten lassen sich per Video überprüfen.", terms: ["kamera", "camera", "video", "livebild", "live bild"] },
  { kind: "app", icon: "📱", headline: "Wenn dir App-Steuerung besonders wichtig ist", reason: "Dieses Modell eignet sich für flexible Zeitpläne und Steuerung aus der Ferne.", difference: "Portionen, Zeitpläne und Statusmeldungen lassen sich über das Smartphone verwalten.", terms: ["app", "wlan", "wifi", "wi-fi", "smartphone"] },
  { kind: "multi-pet", icon: "🐾", headline: "Wenn du mehrere Tiere versorgen möchtest", reason: "Dieses Modell ist stärker auf Mehrtierhaushalte ausgerichtet.", difference: "Die Fütterung lässt sich besser auf mehrere Tiere oder getrennte Portionen abstimmen.", terms: ["mehrere tiere", "mehrere katzen", "mehrkatzen", "mehrtier", "zwei näpfe", "dual"] },
  { kind: "compact", icon: "↘", headline: "Wenn du möglichst wenig Stellfläche hast", reason: "Dieses Modell eignet sich besser für kleinere Wohnbereiche.", difference: "Die Bauform ist stärker auf Platzersparnis als auf maximale Kapazität ausgelegt.", terms: ["kompakt", "platzsparend", "kleine wohnung"] },
  { kind: "value", icon: "💰", headline: "Wenn dir Preis-Leistung wichtiger ist", reason: "Dieses Modell konzentriert sich auf die wichtigsten Funktionen ohne unnötige Extras.", difference: "Du erhältst eine solide Grundausstattung und verzichtest auf einzelne Premiumfunktionen.", terms: ["preis-leistung", "preisleistung", "günstig", "budget", "einsteiger"] }
];

const normalizeText = (value: unknown) => String(value ?? "").toLowerCase()
  .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
  .replace(/[^a-z0-9]+/g, " ").trim();

const getArrayText = (value: unknown) => Array.isArray(value)
  ? value.map((item) => stripLeadingIcon(String(item))).join(" ")
  : "";

const getProductText = (entry: ProductEntry) => {
  const product = entry.data;
  return normalizeText([
    product.title, product.category.key, product.category.label, product.useCase,
    product.recommendation, product.review.summary, product.review.verdict,
    getArrayText(product.decision.bestFor), getArrayText(product.decision.attention),
    getArrayText(product.strengths), getArrayText(product.weaknesses),
    getArrayText(product.features), getArrayText(product.tags),
    product.specs.map((spec) => `${spec.label} ${String(spec.value)}`).join(" ")
  ].filter(Boolean).join(" "));
};

const cleanTags = (entry: ProductEntry) => {
  const ignored = new Set(["katze", "katzen", "hund", "hunde", "haustier", "haustiere", "haushalt", "haushalte"]);
  return entry.data.decision.bestFor
    .map((item) => stripLeadingIcon(item).replace(/^[✓✔☑•]+\s*/, "").trim())
    .filter(Boolean).filter((item) => !ignored.has(normalizeText(item))).slice(0, 3);
};

export const getFutterautomatenAlternatives = (
  currentProduct: ProductEntry,
  products: ProductEntry[],
  limit = 3
): AlternativeRecommendation[] => {
  const currentText = getProductText(currentProduct);
  const candidates = products
    .filter((candidate) => candidate.id !== currentProduct.id && candidate.data.category.key === currentProduct.data.category.key)
    .sort((a, b) => (b.data.score ?? 0) - (a.data.score ?? 0));
  const recommendations: AlternativeRecommendation[] = [];
  const usedKinds = new Set<string>();

  for (const candidate of candidates) {
    if (recommendations.length >= limit) break;
    const candidateText = getProductText(candidate);
    const feature = features.find((item) =>
      item.terms.some((term) => candidateText.includes(normalizeText(term))) &&
      !item.terms.some((term) => currentText.includes(normalizeText(term))) &&
      !usedKinds.has(item.kind)
    );
    if (!feature) continue;

    recommendations.push({
      productKey: candidate.data.slug,
      name: candidate.data.title,
      url: candidate.data.productUrl ?? `/produkt/${candidate.data.slug}`,
      image: candidate.data.images.hero,
      score: candidate.data.score ?? 0,
      rating: candidate.data.rating,
      icon: feature.icon,
      headline: feature.headline,
      reason: feature.reason,
      difference: feature.difference,
      tags: cleanTags(candidate)
    });
    usedKinds.add(feature.kind);
  }

  return recommendations;
};
