import { getInternalLinkRuleWeight } from "@affiliate-core/linking/rules";
import type { InternalLinkGroup } from "@affiliate-core/linking/types";
import { detectLinkIntents, detectLinkTopics, type LinkTopic, normalizeTaxonomyTerm } from "./content/linkTaxonomy";
import { scoreMultiTopicContext } from "./content/linkingSemantics";

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

type RecommendationFamily =
  | "futterautomaten"
  | "trinkbrunnen"
  | "gps-tracker"
  | "katzenklappen"
  | "haustierkameras";

type Context = {
  animal?: "dog" | "cat";
  petSize?: "small" | "medium" | "large";
  family?: RecommendationFamily;
  topics: Set<LinkTopic>;
  intents: Set<string>;
  tokens: Set<string>;
};

const normalize = (value: unknown) => normalizeTaxonomyTerm(String(value ?? ""));
const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : value == null ? [] : [value];
const collectValues = (data: Record<string, any>) => [
  data.slug, data.title, data.name, data.description, data.summary, data.recommendation,
  typeof data.category === "string" ? data.category : data.category?.key,
  data.categoryLabel, data.linkContext, data.contentPlatform?.cluster, data.contentPlatform?.intent,
  data.manufacturer?.name, data.manufacturer?.slug,
  ...asArray(data.tags), ...asArray(data.features), ...asArray(data.useCase),
  ...asArray(data.productCategories), ...asArray(data.linking?.contexts),
  ...asArray(data.linking?.keywords), ...asArray(data.comparisonFilters?.foodType),
  ...asArray(data.comparisonFilters?.features)
].filter(Boolean);
const collectText = (data: Record<string, any>) => normalize(collectValues(data).join(" "));

const detectAnimal = (data: Record<string, any>, text: string) => {
  const explicit = data.recommendationJourney?.animal ?? data.contentPlatform?.animal;
  if (explicit === "dog" || explicit === "cat") return explicit;
  const filters = asArray(data.comparisonFilters?.animal);
  if (filters.length === 1 && (filters[0] === "dog" || filters[0] === "cat")) return filters[0];
  const dog = /\b(hund|hunde|dog|dogs)\b/.test(text);
  const cat = /\b(katze|katzen|cat|cats)\b/.test(text);
  return dog !== cat ? (dog ? "dog" : "cat") : undefined;
};
const detectPetSize = (data: Record<string, any>, text: string) => {
  const explicit = data.recommendationJourney?.petSize;
  if (["small", "medium", "large"].includes(explicit)) return explicit;
  const filters = asArray(data.comparisonFilters?.petSize);
  if (filters.length === 1 && ["small", "medium", "large"].includes(String(filters[0]))) return filters[0] as "small" | "medium" | "large";
  if (/\b(gross|grosse|grosser|large)\b/.test(text)) return "large";
  if (/\b(mittel|mittelgross|medium)\b/.test(text)) return "medium";
  if (/\b(klein|kleine|kleiner|small)\b/.test(text)) return "small";
  return undefined;
};

export const detectRecommendationTopics = (data: Record<string, any>) =>
  detectLinkTopics(collectValues(data));

const FAMILY_PATTERNS: Array<[RecommendationFamily, RegExp]> = [
  ["trinkbrunnen", /\b(trinkbrunnen|wasserbrunnen|pet fountain|drinking fountain|fountain)\b/],
  ["futterautomaten", /\b(futterautomat|futterautomaten|futterspender|automatic feeder|pet feeder|feeder)\b/],
  ["gps-tracker", /\b(gps tracker|gps-tracker|haustiertracker|ortungstracker|tracking halsband)\b/],
  ["katzenklappen", /\b(katzenklappe|katzenklappen|mikrochipklappe|cat flap)\b/],
  ["haustierkameras", /\b(haustierkamera|tierkamera|pet camera|kamera fuer haustiere)\b/]
];

const detectRecommendationFamily = (
  data: Record<string, any>,
  topics: LinkTopic[],
  normalizedText: string
): RecommendationFamily | undefined => {
  const topicFamily = topics.find((topic): topic is RecommendationFamily =>
    ["futterautomaten", "trinkbrunnen", "gps-tracker", "katzenklappen", "haustierkameras"].includes(topic)
  );
  if (topicFamily) return topicFamily;

  const category = normalize([
    typeof data.category === "string" ? data.category : data.category?.key,
    typeof data.category === "object" ? data.category?.label : "",
    data.contentPlatform?.cluster,
    ...asArray(data.hub?.sections)
  ].filter(Boolean).join(" "));

  for (const [family, pattern] of FAMILY_PATTERNS) {
    if (pattern.test(category)) return family;
  }

  for (const [family, pattern] of FAMILY_PATTERNS) {
    if (pattern.test(normalizedText)) return family;
  }

  return undefined;
};

const buildContext = (data: Record<string, any>): Context => {
  const text = collectText(data);
  const topics = detectRecommendationTopics(data);
  return {
    animal: detectAnimal(data, text),
    petSize: detectPetSize(data, text),
    family: detectRecommendationFamily(data, topics, text),
    topics: new Set(topics),
    intents: new Set(detectLinkIntents(collectValues(data))),
    tokens: new Set(text.split(/\s+/).filter((token) => token.length >= 4))
  };
};
const hasCompatibleRecommendationTopic = (source: Context, candidate: Context) => {
  if (source.family && candidate.family && source.family !== candidate.family) {
    return false;
  }
  if (source.topics.size === 0 || candidate.topics.size === 0) {
    return !source.family || !candidate.family || source.family === candidate.family;
  }
  return overlapCount(source.topics, candidate.topics) > 0;
};
const overlapCount = <T>(left: Set<T>, right: Set<T>) => [...left].filter((value) => right.has(value)).length;
const scoreContext = (source: Context, candidate: Context) => {
  let score = scoreMultiTopicContext({
    sourceTopics: [...source.topics],
    candidateTopics: [...candidate.topics],
    sourceIntents: [...source.intents],
    candidateIntents: [...candidate.intents],
    tokenOverlap: overlapCount(source.tokens, candidate.tokens)
  }).score;
  if (source.animal && candidate.animal) score += source.animal === candidate.animal ? 10 : -16;
  if (source.petSize && candidate.petSize) score += source.petSize === candidate.petSize ? 7 : -7;
  return score;
};
const isMoneyGuide = (data: Record<string, any>) =>
  data.recommendationJourney?.mode === "filtered" ||
  ["buying-guide", "comparison-support"].includes(data.contentPlatform?.intent) ||
  /\b(kaufberatung|welcher|beste|passende)\b/.test(collectText(data));
const groupFor = (data: Record<string, any>): InternalLinkGroup => {
  if (data.type === "product") return "product";
  if (data.type === "manufacturer") return "manufacturer";
  if (data.type === "comparison" || /\bvergleich\b/.test(normalize(data.layout))) return "comparison";
  return "knowledge";
};
const rank = <T extends RecommendationEntry>(
  source: Record<string, any>,
  candidates: T[],
  extra: (entry: T) => number = () => 0
) => {
  const sourceContext = buildContext(source);
  const sourceGroup = groupFor(source);
  return candidates
    .map((entry) => {
      const candidateContext = buildContext(entry.data);
      if (!hasCompatibleRecommendationTopic(sourceContext, candidateContext)) {
        return { entry, score: Number.NEGATIVE_INFINITY };
      }
      return {
        entry,
        score: scoreContext(sourceContext, candidateContext) + extra(entry) +
          getInternalLinkRuleWeight({ sourceGroup, targetGroup: groupFor(entry.data), targetPath: String(entry.data.slug ?? "") }) / 8
      };
    })
    .filter(({ score }) => Number.isFinite(score) && score > 0)
    .sort((a, b) => b.score - a.score || normalize(a.entry.data.slug).localeCompare(normalize(b.entry.data.slug), "de"));
};

export const getBestMoneyGuide = (source: Record<string, any>, pages: RecommendationEntry[], currentSlug?: string) => rank(
  source,
  pages.filter((entry) => entry.data.slug !== currentSlug && isMoneyGuide(entry.data)),
  (entry) => (entry.data.recommendationJourney?.mode === "filtered" ? 7 : 0) +
    (entry.data.contentPlatform?.intent === "buying-guide" ? 5 : 0) + Math.min(Number(entry.data.hubPriority ?? 0) / 20, 4)
)[0]?.entry;
export const getBestComparison = (source: Record<string, any>, comparisons: RecommendationEntry[]) => rank(
  source, comparisons,
  (entry) => (/\bbeste\b/.test(collectText(entry.data)) ? 4 : 0) + (/\bvergleich\b/.test(collectText(entry.data)) ? 2 : 0)
)[0]?.entry;
export const getBestProduct = (source: Record<string, any>, products: RecommendationEntry[]) => rank(
  source,
  products.filter((entry) => !["discontinued", "legacy"].includes(entry.data.productStatus)),
  (entry) => Math.min(Number(entry.data.score ?? 0) / 15, 7) + Math.min(Number(entry.data.rating ?? 0), 5)
)[0]?.entry;

const productLink = (entry: RecommendationEntry): RecommendationLink => ({
  kind: "product", eyebrow: "Top-Empfehlung", title: entry.data.title,
  text: entry.data.recommendation ?? "Öffne die vollständige redaktionelle Einordnung dieses Modells.",
  href: `/produkt/${entry.data.slug}/`, label: "Produkt ansehen",
  image: entry.data.images ? {
    src: entry.data.images.comparison?.src ?? entry.data.images.thumbnail?.src ?? entry.data.images.hero?.src ?? entry.data.images.comparison ?? entry.data.images.thumbnail ?? entry.data.images.hero,
    alt: entry.data.images.comparison?.alt ?? entry.data.images.thumbnail?.alt ?? entry.data.images.hero?.alt ?? entry.data.title
  } : undefined,
  score: typeof entry.data.score === "number" ? entry.data.score : typeof entry.data.rating === "number" ? Math.round(entry.data.rating * 20) : undefined,
  highlights: [...asArray(entry.data.strengths), ...asArray(entry.data.features)].map(String).filter(Boolean).slice(0, 3)
});
const comparisonLink = (entry: RecommendationEntry, products: RecommendationEntry[] = []): RecommendationLink => {
  const explicit = asArray(entry.data.items).map((item) => typeof item === "string" ? item : item && typeof item === "object" ? String((item as Record<string, any>).slug ?? "") : "").filter(Boolean);
  const automatic = products.filter((product) => asArray(product.data.comparisons).includes(entry.data.slug)).map((product) => String(product.data.slug));
  const count = new Set([...explicit, ...automatic]).size;
  return {
    kind: "comparison", eyebrow: "Vergleich", title: entry.data.title,
    text: entry.data.description ?? "Vergleiche passende Modelle direkt miteinander.",
    href: `/vergleiche/${entry.data.slug}/`, label: "Zum Vergleich",
    stat: { value: count > 0 ? String(count) : "Alle", label: count === 1 ? "Modell" : "Modelle" },
    highlights: ["Pfotentechnik-Score", "Modelle direkt filtern", "Stärken und Grenzen vergleichen"]
  };
};
const guideLink = (entry: RecommendationEntry): RecommendationLink => ({
  eyebrow: "Kaufberatung", title: entry.data.title,
  text: entry.data.description ?? "Ordne die wichtigsten Anforderungen vor der Auswahl genauer ein.",
  href: `/${entry.data.slug}/`, label: "Kaufberatung lesen"
});

export const buildMoneyPageNextSteps = ({ page, comparisons, products }: { page: Record<string, any>; comparisons: RecommendationEntry[]; products: RecommendationEntry[] }) => {
  const product = getBestProduct(page, products);
  const comparison = getBestComparison(page, comparisons);
  return [...(product ? [productLink(product)] : []), ...(comparison ? [comparisonLink(comparison, products)] : [])].slice(0, 2);
};
export const buildComparisonNextSteps = ({ comparison, pages, products }: { comparison: Record<string, any>; pages: RecommendationEntry[]; products: RecommendationEntry[] }) => {
  const guide = getBestMoneyGuide(comparison, pages);
  const product = getBestProduct(comparison, products);
  return [...(guide ? [guideLink(guide)] : []), ...(product ? [productLink(product)] : [])].slice(0, 2);
};
export const buildProductNextSteps = ({ product, pages, comparisons }: { product: Record<string, any>; pages: RecommendationEntry[]; comparisons: RecommendationEntry[] }) => {
  const comparison = getBestComparison(product, comparisons);
  const guide = getBestMoneyGuide(product, pages);
  return [...(comparison ? [comparisonLink(comparison)] : []), ...(guide ? [guideLink(guide)] : [])].slice(0, 2);
};
export const buildManufacturerNextSteps = ({ manufacturer, pages, comparisons, products }: { manufacturer: Record<string, any>; pages: RecommendationEntry[]; comparisons: RecommendationEntry[]; products: RecommendationEntry[] }) => {
  const ownProducts = products.filter((entry) => entry.data.manufacturer?.slug === manufacturer.slug || entry.data.manufacturer?.key === manufacturer.key || asArray(manufacturer.productSlugs).includes(entry.data.slug));
  const source = { ...manufacturer, tags: [...asArray(manufacturer.tags), ...ownProducts.flatMap((entry) => asArray(entry.data.tags))], features: ownProducts.flatMap((entry) => asArray(entry.data.features)) };
  const comparison = getBestComparison(source, comparisons);
  const guide = getBestMoneyGuide(source, pages);
  return [...(comparison ? [comparisonLink(comparison)] : []), ...(guide ? [guideLink(guide)] : [])].slice(0, 2);
};
