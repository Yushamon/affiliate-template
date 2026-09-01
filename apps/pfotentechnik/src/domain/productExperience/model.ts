import { buildPriceIndex, type PriceIndex } from "../price/engine.ts";
import type { ProductPriceInsight } from "../price/types.ts";
import { isHigherPriceTier, isLowerPriceTier } from "../price/tier.ts";
import type { ProductDecisionProfile } from "./decisionEngine.ts";
import { uniqueTextItems } from "./contentLists.ts";
import { calculateProductScore } from "../productScore.ts";
import { buildDecisionFacts } from "./consequences";
import { deriveProductOperations, isAutoRecommendationEligible } from "../../lib/product-operations/policy.mjs";
import { resolveProductMedia } from "../comparison/mediaResolver.mjs";

const list = <T>(value: T[] | undefined | null): T[] => Array.isArray(value) ? value : [];
const text = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    const candidate = (value as any).label ?? (value as any).name ?? (value as any).title ?? (value as any).value;
    return candidate == null ? fallback : String(candidate).trim();
  }
  return fallback;
};

const normalize = (value: unknown): string => text(value)
  .toLocaleLowerCase("de-DE")
  .replaceAll("ä", "ae")
  .replaceAll("ö", "oe")
  .replaceAll("ü", "ue")
  .replaceAll("ß", "ss")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const slugOf = (entry: any): string => text(entry?.data?.slug ?? entry?.slug ?? entry?.id).replace(/\.mdx?$/i, "");
const dataOf = (entry: any): any => entry?.data ?? entry ?? {};
const categoryKey = (entry: any): string => normalize(dataOf(entry)?.category?.key ?? dataOf(entry)?.category?.label);
const calculatedEditorialScore = (data: any): number | null =>
  calculateProductScore(data).score;

const editorialScore = (data: any): number =>
  calculatedEditorialScore(data) ?? 0;

const imageSource = (entry: any) => entry?.src ?? entry;
const imageAlt = (entry: any, fallback: string) => text(entry?.alt, fallback);
const productTextCache = new WeakMap<object, string>();
const priceIndexCache = new WeakMap<object, PriceIndex>();

const collectProductText = (data: any): string => {
  if (import.meta.env.PROD && data && typeof data === "object") {
    const cached = productTextCache.get(data);
    if (cached !== undefined) return cached;
  }
  const value = normalize([
    data.title,
    data.description,
    data.recommendation,
    data.useCase,
    ...list<string>(data.features),
    ...list<string>(data.tags),
    ...list<string>(data.decision?.bestFor),
    ...list<string>(data.decision?.attention),
    ...list<string>(data.strengths),
    ...list<string>(data.weaknesses),
    ...list<any>(data.specs).map((item) => `${text(item?.label)} ${text(item?.value)}`)
  ].filter(Boolean).join(" "));
  if (import.meta.env.PROD && data && typeof data === "object") {
    productTextCache.set(data, value);
  }
  return value;
};

const getPriceIndex = (products: any[], currentEntry: any): PriceIndex => {
  if (!products.length) return buildPriceIndex([currentEntry]);
  if (!import.meta.env.PROD) return buildPriceIndex(products);
  const cached = priceIndexCache.get(products);
  if (cached) return cached;
  const created = buildPriceIndex(products);
  priceIndexCache.set(products, created);
  return created;
};

const booleanFromText = (haystack: string, positive: string[], negative: string[] = []): boolean | null => {
  if (negative.some((term) => haystack.includes(normalize(term)))) return false;
  if (positive.some((term) => haystack.includes(normalize(term)))) return true;
  return null;
};

const specValueFor = (data: any, ...labels: string[]): string => {
  const normalizedLabels = labels.map(normalize);
  const match = list<any>(data?.specs).find((item) => {
    const label = normalize(item?.label);
    return normalizedLabels.some((candidate) => label === candidate || label.includes(candidate));
  });
  return text(match?.value);
};

const booleanFromSpecs = (data: any, labels: string[]): boolean | null => {
  const value = specValueFor(data, ...labels);
  if (!value) return null;
  const normalizedValue = normalize(value);
  if (["nein", "kein", "ohne", "nicht vorhanden", "nicht vorgesehen"].some((term) => normalizedValue.includes(term))) {
    return false;
  }
  return true;
};

const batteryCapabilityFromSpecs = (data: any): boolean | null => {
  const explicitBattery = specValueFor(data, "Akku", "Akkubetrieb");
  if (explicitBattery) {
    const normalizedBattery = normalize(explicitBattery);
    if (["nein", "kein", "ohne", "nicht vorhanden", "nicht vorgesehen"].some((term) => normalizedBattery.includes(term))) {
      return false;
    }
    return true;
  }

  const power = normalize(specValueFor(data, "Stromversorgung", "Netzbetrieb", "Power"));
  if (!power) return null;
  if (["backup", "notstrom", "ausfallsicherung"].some((term) => power.includes(term))) return false;
  if (["akkubetrieb", "wiederaufladbar", "kabellos", "cordless", "batteriebetrieb"].some((term) => power.includes(term))) {
    return true;
  }
  if (["netzteil", "netzbetrieb", "netzanschluss"].some((term) => power.includes(term))) return false;
  return null;
};

const foodTypesFromData = (data: any): string[] => {
  const structured = [
    ...list<string>(data.comparisonFilters?.foodType),
    ...list<string>(data.comparisonData?.general?.foodType)
  ]
    .flatMap((value) => {
      const normalized = normalize(value);
      return [
        normalized === "dry" || normalized.includes("trocken") ? "dry" : "",
        normalized === "wet" || normalized.includes("nass") || normalized.includes("feucht") ? "wet" : ""
      ];
    })
    .filter(Boolean);

  if (structured.length > 0) return [...new Set(structured)];

  const specification = normalize(specValueFor(data, "Futterart", "Futtertyp", "Futter"));
  return [
    specification.includes("trocken") ? "dry" : "",
    specification.includes("nass") || specification.includes("feucht") ? "wet" : ""
  ].filter(Boolean);
};

const joinGerman = (values: string[]): string => {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} und ${values[1]}`;
  return `${values.slice(0, -1).join(", ")} und ${values.at(-1)}`;
};

const dogSuitabilityLabel = (petSizes: string[]): string => {
  const sizes = new Set(petSizes.map(normalize));
  const small = sizes.has("small") || sizes.has("klein");
  const medium = sizes.has("medium") || sizes.has("mittel") || sizes.has("mittelgross");
  const large = sizes.has("large") || sizes.has("gross");

  if (small && medium && !large) return "kleine bis mittelgroße Hunde";
  if (!small && medium && large) return "mittelgroße bis große Hunde";
  if (small && !medium && large) return "kleine und große Hunde";
  if (small && !medium && !large) return "kleine Hunde";
  if (!small && medium && !large) return "mittelgroße Hunde";
  if (!small && !medium && large) return "große Hunde";
  return "Hunde";
};

const buildSuitabilitySummary = (
  profile: Pick<ProductDecisionProfile, "animals" | "petSizes">,
  idealFor: string[],
  fallback: string
): string => {
  const animals = new Set(profile.animals.map(normalize));
  const labels: string[] = [];
  if (animals.has("cat")) labels.push("Katzen");
  if (animals.has("dog")) labels.push(dogSuitabilityLabel(profile.petSizes));
  if (labels.length > 0) return joinGerman(labels);

  const explicit = idealFor.find((item) => {
    const normalized = normalize(item);
    return normalized.includes("katze") || normalized.includes("hund") || normalized.includes("tier");
  });
  return explicit ?? idealFor[0] ?? fallback;
};

const decisionProfileFor = (data: any, price: ProductPriceInsight | undefined): ProductDecisionProfile => {
  const haystack = collectProductText(data);
  const normalizedCategory = normalize(data.category?.key ?? data.category?.label);
  const usesFoodQuestions = [
    "futterautomat",
    "futterautomaten",
    "futterspender",
    "feeder"
  ].some((term) => normalizedCategory.includes(term));
  const animals = list<string>(data.comparisonFilters?.animal ?? data.comparisonData?.general?.animal)
    .map((value) => normalize(value))
    .map((value) => value === "hund" || value === "hunde" ? "dog" : value === "katze" || value === "katzen" ? "cat" : value)
    .filter((value) => value === "dog" || value === "cat");
  const foodTypes = usesFoodQuestions
    ? foodTypesFromData(data)
    : [];

  const hasWifi = typeof data.comparisonFilters?.app === "boolean"
    ? data.comparisonFilters.app
    : booleanFromSpecs(data, ["WLAN", "WiFi", "App"])
      ?? booleanFromText(haystack, ["wlan", "wifi", "wi fi", "app steuerung"], ["ohne wlan", "ohne app"]);

  const hasCamera = typeof data.comparisonFilters?.camera === "boolean"
    ? data.comparisonFilters.camera
    : booleanFromSpecs(data, ["Kamera", "Camera"])
      ?? booleanFromText(haystack, ["kamera", "camera", "video"], ["ohne kamera", "keine kamera"]);

  const supportsMultiplePets = booleanFromText(
    haystack,
    ["mehrtier", "mehrere tiere", "zwei katzen", "mehrkatzen", "dual hopper", "zwei naepfe", "rfid", "mikrochip"],
    ["nur ein tier", "einzeltier"]
  );
  const worksOffline = booleanFromText(
    haystack,
    ["offline", "ohne wlan", "lokal gespeicherte zeitplaene", "batteriebetrieb"],
    ["cloud pflicht", "nur mit wlan", "internet erforderlich"]
  ) ?? (hasWifi === false ? true : null);

  return {
    productName: text(data.title, "Dieses Produkt"),
    categoryKey: normalizedCategory,
    usesFoodQuestions,
    editorialScore: editorialScore(data),
    animals: [...new Set(animals)],
    petSizes: list<string>(data.comparisonFilters?.petSize ?? data.comparisonData?.general?.petSize).map(normalize),
    foodTypes: [...new Set(foodTypes)],
    supportsMultiplePets,
    hasWifi,
    worksOffline,
    hasCamera,
    priceTier: price?.tier ?? "unknown"
  };
};

const candidateScore = (current: any, candidate: any): number => {
  const currentData = dataOf(current);
  const candidateData = dataOf(candidate);
  let score = editorialScore(candidateData);
  if (categoryKey(current) === categoryKey(candidate)) score += 500;

  const currentAnimals = new Set(list<string>(currentData.comparisonFilters?.animal));
  const candidateAnimals = new Set(list<string>(candidateData.comparisonFilters?.animal));
  if ([...currentAnimals].some((value) => candidateAnimals.has(value))) score += 100;

  const currentFood = new Set(list<string>(currentData.comparisonFilters?.foodType));
  const candidateFood = new Set(list<string>(candidateData.comparisonFilters?.foodType));
  if ([...currentFood].some((value) => candidateFood.has(value))) score += 70;

  return score;
};


const toAlternative = (entry: any, type: string, label: string, reason: string, price?: ProductPriceInsight) => {
  const data = dataOf(entry);
  const slug = slugOf(entry);
  const media = resolveProductMedia(data.images);
  const decisionProfile = decisionProfileFor(data, price);
  return {
    type,
    label,
    title: text(data.title, slug),
    href: text(data.productUrl, `/produkt/${slug}/`),
    image: media ? { src: media.src ?? media, alt: imageAlt(media, text(data.title, slug)) } : null,
    score: editorialScore(data),
    priceLabel: price?.formattedCurrent,
    reason,
    decisionProfile,
    matchKeys: type === "cheaper"
      ? ["budget"]
      : type === "large-dog"
        ? ["animal", "multi-pet"]
        : type === "two-cats"
          ? ["multi-pet"]
          : type === "wet-food"
            ? ["wet-food"]
            : type === "offline"
              ? ["offline"]
              : type === "camera"
                ? ["camera"]
                : ["budget", "camera", "wifi"]
  };
};

const intelligentAlternatives = (
  current: any,
  allProducts: any[],
  priceIndex: PriceIndex,
  fallbackRecommendations: any[]
) => {
  const currentSlug = slugOf(current);
  const currentData = dataOf(current);
  const currentPrice = priceIndex.bySlug.get(currentSlug);
  const currentAnimals = new Set(list<string>(currentData.comparisonFilters?.animal));
  const candidates = allProducts
    .filter((entry) => slugOf(entry) !== currentSlug && categoryKey(entry) === categoryKey(current) && isAutoRecommendationEligible(deriveProductOperations(dataOf(entry))))
    .sort((left, right) => candidateScore(current, right) - candidateScore(current, left));
  const used = new Set<string>();
  const output: any[] = [];

  const pick = (
    type: string,
    label: string,
    reason: string,
    predicate: (entry: any, price: ProductPriceInsight | undefined, haystack: string) => boolean
  ) => {
    const match = candidates.find((entry) => {
      const slug = slugOf(entry);
      if (used.has(slug)) return false;
      return predicate(entry, priceIndex.bySlug.get(slug), collectProductText(dataOf(entry)));
    });
    if (!match) return;
    used.add(slugOf(match));
    output.push(toAlternative(match, type, label, reason, priceIndex.bySlug.get(slugOf(match))));
  };

  pick(
    "cheaper",
    "Günstigere Alternative",
    "Sinnvoll, wenn der Preis wichtiger ist als die maximale Ausstattung.",
    (_entry, price) => Boolean(
      currentPrice?.current != null && price?.current != null
        ? price.current < currentPrice.current * 0.92
        : price && currentPrice && isLowerPriceTier(price.tier, currentPrice.tier)
    )
  );
  pick(
    "premium",
    "Premium-Alternative",
    "Mehr Ausstattung oder ein höherer redaktioneller Score, wenn das Budget zweitrangig ist.",
    (entry, price) => Boolean(
      (currentPrice && price && isHigherPriceTier(price.tier, currentPrice.tier)) ||
      editorialScore(dataOf(entry)) >= editorialScore(currentData) + 5
    )
  );
  pick(
    "large-dog",
    "Beste Wahl für große Hunde",
    "Die Produktdaten weisen dieses Modell ausdrücklich für große Hunde oder hohe Kapazität aus.",
    (entry, _price, haystack) =>
      (currentAnimals.size === 0 || currentAnimals.has("dog")) &&
      list<string>(dataOf(entry).comparisonFilters?.animal).includes("dog") &&
      (list<string>(dataOf(entry).comparisonFilters?.petSize).includes("large") || haystack.includes("grosse hunde"))
  );
  pick(
    "two-cats",
    "Beste Wahl für zwei Katzen",
    "Mehrtiereignung, getrennte Zugänge oder eine auf zwei Katzen ausgelegte Nutzung sind klarer belegt.",
    (entry, _price, haystack) =>
      (currentAnimals.size === 0 || currentAnimals.has("cat")) &&
      list<string>(dataOf(entry).comparisonFilters?.animal).includes("cat") &&
      ["zwei katzen", "mehrkatzen", "mehrtier", "rfid", "mikrochip", "dual"].some((term) => haystack.includes(normalize(term)))
  );
  pick(
    "wet-food",
    "Bessere Wahl für Nassfutter",
    "Dieses Modell ist für Nassfutter, Kühlung oder vorportionierte Schalen vorgesehen.",
    (entry, _price, haystack) =>
      list<string>(dataOf(entry).comparisonFilters?.foodType).includes("wet") || haystack.includes("nassfutter")
  );
  pick(
    "offline",
    "Bessere Wahl ohne WLAN",
    "Dieses Modell lässt sich unabhängiger von App, Konto und Cloud betreiben.",
    (entry, _price, haystack) =>
      dataOf(entry).comparisonFilters?.app === false || haystack.includes("ohne wlan") || haystack.includes("offline")
  );
  pick(
    "camera",
    "Bessere Wahl mit Kamera",
    "Eine integrierte Kamera erleichtert die visuelle Kontrolle von Fütterung und Verhalten.",
    (entry, _price, haystack) => dataOf(entry).comparisonFilters?.camera === true || haystack.includes("kamera")
  );

  for (const recommendation of fallbackRecommendations) {
    if (output.length >= 4) break;
    const slug = text(recommendation.productKey ?? recommendation.slug);
    if (!slug || used.has(slug)) continue;
    const entry = allProducts.find((candidate) => slugOf(candidate) === slug);
    if (!entry || !isAutoRecommendationEligible(deriveProductOperations(dataOf(entry)))) continue;
    used.add(slug);
    output.push(toAlternative(
      entry,
      "editorial",
      text(recommendation.headline, "Redaktionelle Alternative"),
      text(recommendation.reason, "Passt zu einem anderen Nutzungsschwerpunkt."),
      priceIndex.bySlug.get(slug)
    ));
  }

  return output.slice(0, 6);
};

const timelineFor = (data: any) => {
  const category = normalize(data.category?.key ?? data.category?.label);
  const experience = data.experience ?? {};
  const specs = list<any>(data.specs);
  const spec = (...labels: string[]) => specs.find((item) => labels.some((label) => normalize(item?.label) === normalize(label)))?.value;
  const isFountain = category.includes("trinkbrunnen");
  const isTracker = category.includes("gps") || category.includes("tracker");

  return [
    {
      step: "01",
      title: "Einrichten",
      text: text(
        experience.setup ?? experience.support,
        isTracker
          ? "Gerät laden, App koppeln und die Ortung zunächst in vertrauter Umgebung prüfen."
          : data.comparisonFilters?.app
            ? "App, Zeitpläne und Benachrichtigungen zuerst mit einer kontrollierten Testphase einrichten."
            : "Standort, Stromversorgung und mechanische Funktion vor der ersten unbeaufsichtigten Nutzung prüfen."
      )
    },
    {
      step: "02",
      title: isFountain ? "Wasser bereitstellen" : isTracker ? "Im Alltag tragen" : "Routine starten",
      text: text(experience.summary ?? data.review?.summary ?? data.recommendation)
    },
    {
      step: "03",
      title: "Kontrollieren",
      text: text(
        experience.reliability,
        isTracker
          ? "Akkustand, Befestigung und letzte Ortung regelmäßig kontrollieren."
          : "Statusanzeigen und tatsächliche Nutzung am Tier prüfen. App-Protokolle sind kein vollständiger Nutzungsnachweis."
      )
    },
    {
      step: "04",
      title: isTracker ? "Laden und pflegen" : "Reinigen und nachstellen",
      text: text(
        experience.maintenance ?? spec("Reinigung", "Filterwechsel"),
        isFountain
          ? "Trinkfläche, Tank, Pumpe und Filter nach Nutzung und Wasserqualität reinigen beziehungsweise wechseln."
          : "Kontaktflächen und bewegliche Teile regelmäßig reinigen; Portionen oder Einstellungen nach Veränderungen erneut prüfen."
      )
    }
  ].filter((item) => item.text);
};

const evidenceLabels: Record<string, string> = {
  "hands-on-testing": "Eigene praktische Prüfung",
  "manufacturer-documentation": "Herstellerdokumentation",
  "technical-specifications": "Technische Spezifikationen",
  "comparative-analysis": "Vergleichsanalyse",
  "user-feedback": "Nutzerfeedback als ergänzender Hinweis"
};

export const buildProductExperienceModel = ({
  currentEntry,
  allProducts = [],
  reviewProduct = {},
  alternativeRecommendations = []
}: {
  currentEntry: any;
  allProducts?: any[];
  reviewProduct?: any;
  alternativeRecommendations?: any[];
}) => {
  const data = dataOf(currentEntry);
  const slug = slugOf(currentEntry);
  const priceIndex = getPriceIndex(allProducts, currentEntry);
  const price = priceIndex.bySlug.get(slug);
  const operations = deriveProductOperations(data);
  const galleryEntries = [
    data.images?.hero,
    ...list<any>(data.images?.gallery)
  ].filter(Boolean).filter((entry, index, values) => {
    const key = text(imageSource(entry)?.src ?? imageSource(entry));
    return values.findIndex((candidate) => text(imageSource(candidate)?.src ?? imageSource(candidate)) === key) === index;
  });
  const gallery = galleryEntries.map((entry, index) => ({
    src: imageSource(entry),
    alt: imageAlt(entry, index === 0 ? text(data.title) : `${text(data.title)} – Ansicht ${index + 1}`),
    caption: text(entry?.caption)
  }));
  const reviewScore = Number(reviewProduct.score);
  const scoreRaw = Number.isFinite(reviewScore) && reviewScore > 0
    ? reviewScore
    : calculatedEditorialScore(data);
  const score = scoreRaw == null
    ? null
    : scoreRaw > 0 && scoreRaw <= 10
      ? Math.round(scoreRaw * 10)
      : Math.max(0, Math.min(100, Math.round(scoreRaw)));
  const limitations = uniqueTextItems([
    ...list<string>(data.weaknesses),
    ...list<string>(reviewProduct.weaknesses),
    ...list<string>(reviewProduct.cons)
  ]);
  const idealCandidates = uniqueTextItems([
    ...list<string>(data.decision?.bestFor),
    ...list<string>(reviewProduct.bestFor)
  ]);
  const attentionCandidates = uniqueTextItems([
    ...list<string>(data.decision?.attention),
    ...list<string>(reviewProduct.attention)
  ]);
  const strengthCandidates = uniqueTextItems([
    ...list<string>(data.strengths),
    ...list<string>(reviewProduct.strengths),
    ...list<string>(reviewProduct.pros),
    ...list<string>(reviewProduct.highlights)
  ], { exclude: limitations });
  const idealFor = uniqueTextItems(
    idealCandidates.length ? idealCandidates : list<string>(data.tags),
    { limit: 4 }
  );
  const notFor = uniqueTextItems(
    attentionCandidates.length ? attentionCandidates : limitations,
    { limit: 4 }
  );
  const benefits = strengthCandidates.slice(0, 4);
  const decisionProfile = decisionProfileFor(data, price);
  const suitabilitySummary = buildSuitabilitySummary(
    decisionProfile,
    idealFor,
    text(data.category?.label ?? data.category, "Geeignete Haustiere")
  );
  const alternatives = intelligentAlternatives(currentEntry, allProducts, priceIndex, alternativeRecommendations);
  const editorial = data.editorial ?? {};
  const evidence = list<string>(editorial.evidence).map((item) => evidenceLabels[item] ?? item);
  const normalizedCategory = categoryKey(currentEntry);



  const categoryKind = normalizedCategory.includes("futter")
    ? "feeder"
    : normalizedCategory.includes("trink") || normalizedCategory.includes("brunnen")
      ? "fountain"
      : normalizedCategory.includes("gps") || normalizedCategory.includes("tracker")
        ? "tracker"
        : normalizedCategory.includes("katzenklappe") || normalizedCategory.includes("cat flap")
          ? "cat-flap"
          : "generic";
  const specsText = normalize(list<any>(data.specs).map((item) => `${text(item?.label)} ${text(item?.value)}`).join(" "));
  const categoryFitProfile = {
    productName: text(data.title, "Dieses Produkt"),
    category: categoryKind,
    animals: decisionProfile.animals,
    petSizes: decisionProfile.petSizes,
    foodTypes: decisionProfile.foodTypes,
    supportsMultiplePets: decisionProfile.supportsMultiplePets,
    hasWifi: decisionProfile.hasWifi,
    worksOffline: decisionProfile.worksOffline,
    hasCamera: decisionProfile.hasCamera,
    hasBattery: batteryCapabilityFromSpecs(data),
    material: specsText,
    subscriptionRequired: booleanFromText(specsText, ["abo erforderlich", "abonnement", "monatliche kosten"], ["ohne abo", "kein abo"]),
    suitableForOutdoor: booleanFromText(specsText, ["wasserdicht", "wasserfest", "ip67", "ip68", "outdoor"], ["nur innen"]),
    supportsChip: booleanFromText(specsText, ["mikrochip", "chip erkennung", "rfid"], ["ohne chip"]),
    hasTimer: booleanFromText(specsText, ["timer", "zeitsteuerung", "sperrzeiten"], ["ohne timer"]),
    installTypes: [
      specsText.includes("tuer") || specsText.includes("tur") ? "door" : "",
      specsText.includes("wand") ? "wall" : "",
      specsText.includes("glas") ? "glass" : ""
    ].filter(Boolean)
  };

  const decisionFacts = buildDecisionFacts(data, list<any>(data.specs)
    .map((item) => ({ label: text(item?.label), value: text(item?.value) }))
    .filter((item) => item.label && item.value));

  const purchaseMistakes = list<any>(data.purchaseMistakes)
    .map((item) => {
      const title = text(item?.title);
      const reason = text(item?.reason);
      const betterChoiceLabel = text(item?.betterChoice?.label);
      const betterChoiceHref = text(item?.betterChoice?.href);
      if (!title || !reason) return null;
      return {
        title,
        reason,
        betterChoice: betterChoiceLabel && betterChoiceHref
          ? { label: betterChoiceLabel, href: betterChoiceHref }
          : null
      };
    })
    .filter(Boolean);

  const externalEvidence = data.externalEvidence ?? {};
  const professionalReviews = list<any>(externalEvidence.professionalReviews)
    .map((item) => ({
      publisher: text(item?.publisher), title: text(item?.title), url: text(item?.url),
      methodology: text(item?.methodology, "unknown"),
      rating: item?.rating ? { value: Number(item.rating.value), scale: Number(item.rating.scale) } : null
    })).filter((item) => item.publisher && item.url);
  const userReviewSources = list<any>(externalEvidence.userReviews)
    .map((item) => ({
      platform: text(item?.platform), url: text(item?.url),
      rating: Number.isFinite(Number(item?.rating)) ? Number(item.rating) : null,
      scale: Number.isFinite(Number(item?.scale)) ? Number(item.scale) : 5,
      reviewCount: Number.isFinite(Number(item?.reviewCount)) ? Number(item.reviewCount) : null
    })).filter((item) => item.platform && item.url);
  const rawCommunity = data.communityInsights ?? {};
  const normalizeCommunityInsight = (item: any) => {
    if (typeof item === "string") return { text: item, confidence: "medium" as const };
    const insightText = text(item?.text ?? item?.label ?? item?.title);
    if (!insightText) return null;
    const confidence = ["high", "medium", "low"].includes(item?.confidence)
      ? item.confidence
      : "medium";
    const sourceCount = Number(item?.sourceCount);
    return {
      text: insightText,
      confidence,
      sourceCount: Number.isFinite(sourceCount) && sourceCount > 0 ? sourceCount : undefined,
      assessment: text(item?.assessment)
    };
  };
  const consensus = externalEvidence.consensus ?? {};
  const consensusItem = (item: any) => ({
    text: text(item?.finding),
    confidence: ["high","medium","low"].includes(item?.confidence) ? item.confidence : "medium",
    sourceCount: Number.isFinite(Number(item?.sourceCount)) ? Number(item.sourceCount) : undefined,
    assessment: text(item?.assessment)
  });
  const consensusPositives = list<any>(consensus.strengths).map(consensusItem).filter((item) => item.text);
  const consensusNegatives = list<any>(consensus.weaknesses).map(consensusItem).filter((item) => item.text);
  const communityInsights = {
    positives: consensusPositives.length ? consensusPositives : list<any>(rawCommunity.positives).map(normalizeCommunityInsight).filter(Boolean),
    negatives: consensusNegatives.length ? consensusNegatives : list<any>(rawCommunity.negatives).map(normalizeCommunityInsight).filter(Boolean),
    editorialAssessment: text(consensus.editorialAssessment) || text(rawCommunity.editorialAssessment),
    sourcePlatforms: userReviewSources.map((item) => item.platform)
  };
  const evidenceItems = list<string>(editorial.evidence)
    .map((item) => ({ label: evidenceLabels[item] ?? item }))
    .filter((item) => item.label);
  const evidenceSummary = {
    items: evidenceItems,
    professionalReviews,
    userReviewSources,
    externalNote: text(externalEvidence.note),
    handsOn: editorial.testedHandsOn
      ? {
          date: text(editorial.testedAt),
          duration: text(editorial.testDuration),
          scope: list<string>(editorial.testScope)
        }
      : null
  };
  const usageHeading = editorial.testedHandsOn
    ? "So hat sich das Produkt in der Nutzung gezeigt"
    : "So funktioniert die Nutzung laut Dokumentation und Quellen";
  const usageEyebrow = editorial.testedHandsOn
    ? "Eigener Praxistest"
    : "Nutzung verständlich eingeordnet";

  const healthNote = normalizedCategory.includes("trinkbrunnen")
    ? "Ein Trinkbrunnen kann die Wasseraufnahme erleichtern, ersetzt aber keine Beobachtung. Deutlich verändertes Trinkverhalten sollte unabhängig vom Gerät eingeordnet werden."
    : normalizedCategory.includes("gps") || normalizedCategory.includes("tracker")
      ? "Ein GPS-Tracker ergänzt Aufsicht und sichere Routinen. Ortung, Akku und Mobilfunkabdeckung sind keine Garantie dafür, dass jedes Risiko rechtzeitig erkannt wird."
      : "Automatisierte Fütterung unterstützt Routinen, ersetzt aber nicht die Kontrolle von Futteraufnahme, Gewicht und Allgemeinzustand. Veränderungen sollten nicht nur anhand von App-Protokollen beurteilt werden.";

  return {
    slug,
    name: text(data.title, "Produkt"),
    manufacturer: text(data.manufacturer?.name ?? data.manufacturer),
    manufacturerHref: data.manufacturer?.href || (data.manufacturer?.slug ? `/hersteller/${data.manufacturer.slug}/` : null),
    category: text(data.category?.label ?? data.category),
    categoryHref: text(data.category?.path, "/vergleiche/"),
    recommendation: operations.availability === "discontinued"
      ? "Dieses Produkt ist eingestellt. Die redaktionelle Einordnung bleibt dokumentiert; für einen Kauf sind die verfügbaren Alternativen relevanter."
      : operations.availability === "temporarily-unavailable"
        ? "Dieses Produkt ist vorübergehend nicht verfügbar. Die Qualitätsbewertung bleibt bestehen, aktuell sollte jedoch eine Alternative geprüft werden."
        : operations.availability === "out-of-stock"
          ? "Dieses Produkt ist aktuell nicht lieferbar. Die Qualitätsbewertung bleibt bestehen, eine Kaufempfehlung wird derzeit nicht ausgespielt."
          : text(data.recommendation ?? data.description),
    reviewSummary: text(data.review?.summary ?? data.description),
    reviewVerdict: text(data.review?.verdict ?? data.recommendation),
    score,
    scoreLabel: score == null ? "Noch nicht bewertet" : score >= 90 ? "Hervorragend" : score >= 80 ? "Sehr gut" : score >= 70 ? "Gut" : score > 0 ? "Mit Einschränkungen" : "Noch offen",
    gallery,
    idealFor,
    suitabilitySummary,
    notFor,
    benefits,
    mainLimitation: limitations[0] ?? notFor[0] ?? "Keine zentrale Einschränkung redaktionell hinterlegt.",
    operations,
    price,
    affiliate: {
      url: text(reviewProduct.affiliate?.url ?? price?.affiliateUrl ?? data.affiliate?.url),
      label: price?.formattedCurrent
        ? `Preis bei ${price.source?.label ?? "Händler"} prüfen`
        : text(data.affiliate?.label, "Preis und Verfügbarkeit prüfen"),
      rel: text(data.affiliate?.rel, "sponsored nofollow noopener"),
      target: data.affiliate?.target === "_self" ? "_self" : "_blank"
    },
    comparisonHref: list<string>(data.comparisons)[0]
      ? `/vergleiche/${list<string>(data.comparisons)[0]}/`
      : text(data.category?.path, "/vergleiche/"),
    comparisonLabel: "Im Vergleich einordnen",
    decisionProfile: decisionProfileFor(data, price),
    alternatives,
    timeline: timelineFor(data),
    categoryFitProfile,
    decisionFacts,
    purchaseMistakes,
    evidenceSummary,
    communityInsights,
    usageHeading,
    usageEyebrow,
    trustCards: [
      {
        title: "Warum empfehlen wir dieses Produkt?",
        text: text(data.review?.verdict ?? data.recommendation)
      },
      {
        title: "Woher stammen die Daten?",
        text: text(
          data.experience?.methodology,
          evidence.length
            ? `Die Einordnung stützt sich auf ${evidence.join(", ")}.`
            : "Die Einordnung stützt sich auf dokumentierte Produktdaten und den Vergleich mit ähnlichen Modellen."
        )
      },
      {
        title: "Was konnten wir nicht prüfen?",
        text: editorial.testedHandsOn
          ? text(editorial.note, "Nicht jede Langzeitwirkung, App-Änderung oder Nutzungssituation lässt sich vollständig abbilden.")
          : text(editorial.note, "Kein eigener Langzeittest. Haltbarkeit, App-Stabilität und Verhalten in jedem Haushalt bleiben deshalb teilweise offen.")
      },
      {
        title: "Redaktionelle Einschätzung",
        text: text(data.review?.summary ?? data.recommendation)
      }
    ],
    pros: strengthCandidates.length ? strengthCandidates : benefits,
    cons: limitations.length ? limitations : [limitations[0] ?? notFor[0] ?? "Keine zentrale Einschränkung redaktionell hinterlegt."],
    specs: list<any>(data.specs).map((item) => ({ label: text(item?.label), value: text(item?.value) })).filter((item) => item.label && item.value),
    healthNote,
    faq: list<any>(data.faq).map((item) => ({ question: text(item?.question), answer: text(item?.answer) })).filter((item) => item.question && item.answer),
    updatedAt: data.updatedAt instanceof Date ? data.updatedAt.toISOString() : text(data.updatedAt ?? data.publishedAt)
  };
};

export type ProductExperienceModel = ReturnType<typeof buildProductExperienceModel>;
