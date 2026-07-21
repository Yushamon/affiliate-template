export type RecommendationEntry = { data: Record<string, any> };
export type RecommendationLink = {
  kind?: "product" | "comparison" | "guide" | "manufacturer";
  eyebrow: string;
  title: string;
  text?: string;
  href: string;
  label: string;
  image?: { src: any; alt?: string };
  score?: number;
  stat?: { value: string; label: string };
  highlights?: string[];
};

type Topic = "feeder" | "fountain" | "gps" | "cat-flap" | "litter-box" | "health" | "nutrition";
type Context = {
  animal?: "dog" | "cat";
  petSize?: "small" | "medium" | "large";
  topic?: Topic;
  tokens: Set<string>;
};

const normalize = (value: unknown) =>
  String(value ?? "").toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ").trim();

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : value == null ? [] : [value];

const collectText = (data: Record<string, any>) =>
  normalize([
    data.slug, data.title, data.name, data.description, data.summary,
    data.recommendation, data.category, data.categoryLabel, data.linkContext,
    data.contentPlatform?.cluster, data.contentPlatform?.intent,
    data.manufacturer?.name, data.manufacturer?.slug,
    ...asArray(data.tags), ...asArray(data.features), ...asArray(data.useCase),
    ...asArray(data.productCategories), ...asArray(data.linking?.contexts),
    ...asArray(data.linking?.keywords), ...asArray(data.comparisonFilters?.foodType),
    ...asArray(data.comparisonFilters?.features)
  ].filter(Boolean).join(" "));

const detectAnimal = (data: Record<string, any>, text: string) => {
  const explicit = data.recommendationJourney?.animal ?? data.contentPlatform?.animal;
  if (explicit === "dog" || explicit === "cat") return explicit;
  const filters = asArray(data.comparisonFilters?.animal);
  if (filters.length === 1 && (filters[0] === "dog" || filters[0] === "cat")) return filters[0];
  const dog = /\b(hund|hunde|dog|dogs)\b/.test(text);
  const cat = /\b(katze|katzen|cat|cats)\b/.test(text);
  if (dog && !cat) return "dog";
  if (cat && !dog) return "cat";
  return undefined;
};

const detectPetSize = (data: Record<string, any>, text: string) => {
  const explicit = data.recommendationJourney?.petSize;
  if (["small", "medium", "large"].includes(explicit)) return explicit;
  const filters = asArray(data.comparisonFilters?.petSize);
  if (filters.length === 1 && ["small", "medium", "large"].includes(String(filters[0]))) {
    return filters[0] as "small" | "medium" | "large";
  }
  if (/\b(gross|grosse|grosser|large)\b/.test(text)) return "large";
  if (/\b(mittel|mittelgross|medium)\b/.test(text)) return "medium";
  if (/\b(klein|kleine|kleiner|small)\b/.test(text)) return "small";
  return undefined;
};

const detectTopic = (text: string): Topic | undefined => {
  if (/\b(gps|tracker|ortung|halsband)\b/.test(text)) return "gps";
  if (/\b(trinkbrunnen|wasserbrunnen|fountain)\b/.test(text)) return "fountain";
  if (/\b(katzenklappe|cat flap|microchip flap)\b/.test(text)) return "cat-flap";
  if (/\b(katzentoilette|litter box|selbstreinigend)\b/.test(text)) return "litter-box";
  if (/\b(futterautomat|futterautomaten|feeder|fuetterungsroboter)\b/.test(text)) return "feeder";
  if (/\b(futter|ernaehrung|kalorien|nassfutter|trockenfutter)\b/.test(text)) return "nutrition";
  if (/\b(tierarzt|durchfall|erbrechen|mued|frisst nicht|trinkt)\b/.test(text)) return "health";
  return undefined;
};

const buildContext = (data: Record<string, any>): Context => {
  const text = collectText(data);
  return {
    animal: detectAnimal(data, text),
    petSize: detectPetSize(data, text),
    topic: detectTopic(text),
    tokens: new Set(text.split(/\s+/).filter((token) => token.length >= 4))
  };
};

const overlap = (a: Set<string>, b: Set<string>) => {
  let score = 0;
  for (const token of a) if (b.has(token)) score += 1;
  return Math.min(score, 8);
};

const scoreContext = (source: Context, candidate: Context) => {
  let score = overlap(source.tokens, candidate.tokens);
  if (source.topic && candidate.topic) score += source.topic === candidate.topic ? 18 : -24;
  if (source.animal && candidate.animal) score += source.animal === candidate.animal ? 10 : -16;
  if (source.petSize && candidate.petSize) score += source.petSize === candidate.petSize ? 7 : -7;
  return score;
};

const isMoneyGuide = (data: Record<string, any>) => {
  const intent = data.contentPlatform?.intent;
  return data.recommendationJourney?.mode === "filtered" ||
    intent === "buying-guide" ||
    intent === "comparison-support" ||
    /\b(kaufberatung|welcher|beste|passende)\b/.test(collectText(data));
};

const rank = <T extends RecommendationEntry>(
  source: Record<string, any>,
  candidates: T[],
  extra: (entry: T) => number = () => 0
) => {
  const sourceContext = buildContext(source);
  return candidates
    .map((entry) => ({ entry, score: scoreContext(sourceContext, buildContext(entry.data)) + extra(entry) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || normalize(a.entry.data.slug).localeCompare(normalize(b.entry.data.slug)));
};

export const getBestMoneyGuide = (
  source: Record<string, any>, pages: RecommendationEntry[], currentSlug?: string
) => rank(
  source,
  pages.filter((entry) => entry.data.slug !== currentSlug && isMoneyGuide(entry.data)),
  (entry) =>
    (entry.data.recommendationJourney?.mode === "filtered" ? 7 : 0) +
    (entry.data.contentPlatform?.intent === "buying-guide" ? 5 : 0) +
    Math.min(Number(entry.data.hubPriority ?? 0) / 20, 4)
)[0]?.entry;

export const getBestComparison = (
  source: Record<string, any>, comparisons: RecommendationEntry[]
) => rank(
  source,
  comparisons,
  (entry) => (/\bbeste\b/.test(collectText(entry.data)) ? 4 : 0) +
    (/\bvergleich\b/.test(collectText(entry.data)) ? 2 : 0)
)[0]?.entry;

export const getBestProduct = (
  source: Record<string, any>, products: RecommendationEntry[]
) => rank(
  source,
  products.filter((entry) => !["discontinued", "legacy"].includes(entry.data.productStatus)),
  (entry) => Math.min(Number(entry.data.score ?? 0) / 15, 7) + Math.min(Number(entry.data.rating ?? 0), 5)
)[0]?.entry;

const productLink = (entry: RecommendationEntry): RecommendationLink => ({
  kind: "product",
  eyebrow: "Top-Empfehlung",
  title: entry.data.title,
  text: entry.data.recommendation ?? "Öffne die vollständige redaktionelle Einordnung dieses Modells.",
  href: `/produkt/${entry.data.slug}/`,
  label: "Produkt ansehen",
  image: entry.data.images
    ? {
        src:
          entry.data.images.comparison?.src ??
          entry.data.images.thumbnail?.src ??
          entry.data.images.hero?.src ??
          entry.data.images.comparison ??
          entry.data.images.thumbnail ??
          entry.data.images.hero,
        alt:
          entry.data.images.comparison?.alt ??
          entry.data.images.thumbnail?.alt ??
          entry.data.images.hero?.alt ??
          entry.data.title
      }
    : undefined,
  score:
    typeof entry.data.score === "number"
      ? entry.data.score
      : typeof entry.data.rating === "number"
        ? Math.round(entry.data.rating * 20)
        : undefined,
  highlights: [
    ...asArray(entry.data.strengths),
    ...asArray(entry.data.features)
  ].map((value) => String(value)).filter(Boolean).slice(0, 3)
});
const comparisonLink = (entry: RecommendationEntry): RecommendationLink => ({
  kind: "comparison",
  eyebrow: "Vergleich",
  title: entry.data.title,
  text: entry.data.description ?? "Vergleiche passende Modelle direkt miteinander.",
  href: `/vergleiche/${entry.data.slug}/`,
  label: "Zum Vergleich",
  stat: {
    value: String(asArray(entry.data.items).length || "Alle"),
    label: asArray(entry.data.items).length === 1 ? "Modell" : "Modelle"
  },
  highlights: [
    "Pfotentechnik-Score",
    "Modelle direkt filtern",
    "Stärken und Grenzen vergleichen"
  ]
});
const guideLink = (entry: RecommendationEntry): RecommendationLink => ({
  eyebrow: "Kaufberatung", title: entry.data.title,
  text: entry.data.description ?? "Ordne die wichtigsten Anforderungen vor der Auswahl genauer ein.",
  href: `/${entry.data.slug}/`, label: "Kaufberatung lesen"
});

export const buildMoneyPageNextSteps = ({ page, comparisons, products }: {
  page: Record<string, any>; comparisons: RecommendationEntry[]; products: RecommendationEntry[];
}): RecommendationLink[] => {
  const product = getBestProduct(page, products);
  const comparison = getBestComparison(page, comparisons);
  return [...(product ? [productLink(product)] : []), ...(comparison ? [comparisonLink(comparison)] : [])].slice(0, 2);
};

export const buildComparisonNextSteps = ({ comparison, pages, products }: {
  comparison: Record<string, any>; pages: RecommendationEntry[]; products: RecommendationEntry[];
}): RecommendationLink[] => {
  const guide = getBestMoneyGuide(comparison, pages);
  const product = getBestProduct(comparison, products);
  return [...(guide ? [guideLink(guide)] : []), ...(product ? [productLink(product)] : [])].slice(0, 2);
};

export const buildProductNextSteps = ({ product, pages, comparisons }: {
  product: Record<string, any>; pages: RecommendationEntry[]; comparisons: RecommendationEntry[];
}): RecommendationLink[] => {
  const comparison = getBestComparison(product, comparisons);
  const guide = getBestMoneyGuide(product, pages);
  return [...(comparison ? [comparisonLink(comparison)] : []), ...(guide ? [guideLink(guide)] : [])].slice(0, 2);
};

export const buildManufacturerNextSteps = ({ manufacturer, pages, comparisons, products }: {
  manufacturer: Record<string, any>; pages: RecommendationEntry[];
  comparisons: RecommendationEntry[]; products: RecommendationEntry[];
}): RecommendationLink[] => {
  const ownProducts = products.filter((entry) =>
    entry.data.manufacturer?.slug === manufacturer.slug ||
    entry.data.manufacturer?.key === manufacturer.key ||
    asArray(manufacturer.productSlugs).includes(entry.data.slug)
  );
  const source = {
    ...manufacturer,
    tags: [...asArray(manufacturer.tags), ...ownProducts.flatMap((entry) => asArray(entry.data.tags))],
    features: ownProducts.flatMap((entry) => asArray(entry.data.features))
  };
  const comparison = getBestComparison(source, comparisons);
  const guide = getBestMoneyGuide(source, pages);
  return [...(comparison ? [comparisonLink(comparison)] : []), ...(guide ? [guideLink(guide)] : [])].slice(0, 2);
};
