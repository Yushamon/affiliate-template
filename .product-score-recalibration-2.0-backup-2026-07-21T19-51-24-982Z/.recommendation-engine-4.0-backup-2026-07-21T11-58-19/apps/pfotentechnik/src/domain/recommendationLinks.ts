type ContentEntryLike = { data: Record<string, any> };

type RecommendationLink = {
  eyebrow: string;
  title: string;
  text: string;
  href: string;
  label: string;
};

type Context = {
  animal?: "dog" | "cat";
  petSize?: "small" | "medium" | "large";
  topic?: "feeder" | "fountain" | "gps";
  tokens: Set<string>;
};

const normalize = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");

const collectText = (data: Record<string, any>) =>
  normalize([
    data.slug,
    data.title,
    data.description,
    data.category,
    data.categoryLabel,
    data.linkContext,
    ...(Array.isArray(data.tags) ? data.tags : []),
    ...(Array.isArray(data.features) ? data.features : []),
    ...(Array.isArray(data.useCase) ? data.useCase : [data.useCase]),
    ...(Array.isArray(data.linking?.contexts) ? data.linking.contexts : []),
    ...(Array.isArray(data.linking?.keywords) ? data.linking.keywords : [])
  ].filter(Boolean).join(" "));

const detectAnimal = (data: Record<string, any>, text: string) => {
  const explicit = data.recommendationJourney?.animal ?? data.contentPlatform?.animal;
  if (explicit === "dog" || explicit === "cat") return explicit;

  const filters = data.comparisonFilters?.animal;
  if (Array.isArray(filters) && filters.length === 1) return filters[0];

  const dog = /\b(hund|hunde|dog|dogs)\b/.test(text);
  const cat = /\b(katze|katzen|cat|cats)\b/.test(text);
  if (dog && !cat) return "dog";
  if (cat && !dog) return "cat";
  return undefined;
};

const detectPetSize = (data: Record<string, any>, text: string) => {
  const explicit = data.recommendationJourney?.petSize;
  if (["small", "medium", "large"].includes(explicit)) return explicit;

  const filters = data.comparisonFilters?.petSize;
  if (Array.isArray(filters) && filters.length === 1) return filters[0];

  if (/\b(gross|grosse|grosser|large)\b/.test(text)) return "large";
  if (/\b(mittel|mittelgross|medium)\b/.test(text)) return "medium";
  if (/\b(klein|kleine|kleiner|small)\b/.test(text)) return "small";
  return undefined;
};

const detectTopic = (text: string): Context["topic"] => {
  if (/\b(gps|tracker|ortung|halsband)\b/.test(text)) return "gps";
  if (/\b(trinkbrunnen|wasserbrunnen|fountain|trinken)\b/.test(text)) return "fountain";
  if (/\b(futterautomat|futterautomaten|feeder|fuetterung)\b/.test(text)) return "feeder";
  return undefined;
};

const buildContext = (data: Record<string, any>): Context => {
  const text = collectText(data);
  return {
    animal: detectAnimal(data, text),
    petSize: detectPetSize(data, text),
    topic: detectTopic(text),
    tokens: new Set(text.split(/[^a-z0-9-]+/).filter((token) => token.length >= 4))
  };
};

const overlapScore = (a: Set<string>, b: Set<string>) => {
  let score = 0;
  for (const token of a) if (b.has(token)) score += 1;
  return Math.min(score, 5);
};

const compatibilityScore = (source: Context, candidate: Context) => {
  let score = overlapScore(source.tokens, candidate.tokens);
  if (source.topic && candidate.topic) score += source.topic === candidate.topic ? 12 : -20;
  if (source.animal && candidate.animal) score += source.animal === candidate.animal ? 8 : -12;
  if (source.petSize && candidate.petSize) score += source.petSize === candidate.petSize ? 5 : -5;
  return score;
};

const isMoneyGuide = (data: Record<string, any>) => {
  const intent = data.contentPlatform?.intent;
  const text = collectText(data);
  if (data.recommendationJourney?.mode === "filtered") return true;
  if (intent === "buying-guide" || intent === "comparison-support") return true;
  return /\bkaufberatung\b/.test(text);
};

const rank = <T extends ContentEntryLike>(
  source: Record<string, any>,
  candidates: T[],
  extraScore: (entry: T) => number = () => 0
) => {
  const sourceContext = buildContext(source);
  return candidates
    .map((entry) => ({
      entry,
      score: compatibilityScore(sourceContext, buildContext(entry.data)) + extraScore(entry)
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) =>
      b.score - a.score || normalize(a.entry.data.slug).localeCompare(normalize(b.entry.data.slug))
    );
};

export const getBestMoneyGuide = (
  source: Record<string, any>,
  pages: ContentEntryLike[],
  currentSlug?: string
) => {
  const candidates = pages.filter((entry) => entry.data.slug !== currentSlug && isMoneyGuide(entry.data));
  return rank(source, candidates, (entry) => {
    let score = 0;
    if (entry.data.recommendationJourney?.mode === "filtered") score += 5;
    if (entry.data.contentPlatform?.intent === "buying-guide") score += 3;
    return score;
  })[0]?.entry;
};

export const getBestComparison = (
  source: Record<string, any>,
  comparisons: ContentEntryLike[]
) => rank(source, comparisons, (entry) => /\bbeste\b|\bvergleich\b/.test(collectText(entry.data)) ? 2 : 0)[0]?.entry;

export const getBestProduct = (
  source: Record<string, any>,
  products: ContentEntryLike[]
) => rank(
  source,
  products.filter((entry) => entry.data.productStatus !== "discontinued" && entry.data.productStatus !== "legacy"),
  (entry) => Math.min(Number(entry.data.score ?? 0) / 20, 5) + Math.min(Number(entry.data.rating ?? 0), 5)
)[0]?.entry;

export const buildComparisonNextSteps = ({ comparison, pages, products }: {
  comparison: Record<string, any>;
  pages: ContentEntryLike[];
  products: ContentEntryLike[];
}): RecommendationLink[] => {
  const guide = getBestMoneyGuide(comparison, pages);
  const product = getBestProduct(comparison, products);
  const items: RecommendationLink[] = [];

  if (guide) items.push({
    eyebrow: "Kaufberatung",
    title: guide.data.title,
    text: guide.data.description ?? "Ordne die wichtigsten Anforderungen vor der Produktauswahl genauer ein.",
    href: `/${guide.data.slug}/`,
    label: "Kaufberatung lesen"
  });

  if (product) items.push({
    eyebrow: "Top-Empfehlung",
    title: product.data.title,
    text: product.data.recommendation ?? "Öffne die vollständige redaktionelle Einordnung dieses Modells.",
    href: `/produkt/${product.data.slug}/`,
    label: "Produkt ansehen"
  });

  return items.slice(0, 2);
};

export const buildProductNextSteps = ({ product, pages, comparisons }: {
  product: Record<string, any>;
  pages: ContentEntryLike[];
  comparisons: ContentEntryLike[];
}): RecommendationLink[] => {
  const comparison = getBestComparison(product, comparisons);
  const guide = getBestMoneyGuide(product, pages);
  const items: RecommendationLink[] = [];

  if (comparison) items.push({
    eyebrow: "Vergleich",
    title: comparison.data.title,
    text: comparison.data.description ?? "Vergleiche das Modell mit passenden Alternativen.",
    href: `/vergleiche/${comparison.data.slug}/`,
    label: "Zum Vergleich"
  });

  if (guide) items.push({
    eyebrow: "Kaufberatung",
    title: guide.data.title,
    text: guide.data.description ?? "Prüfe die wichtigsten Anforderungen für diesen Anwendungsfall.",
    href: `/${guide.data.slug}/`,
    label: "Kaufberatung lesen"
  });

  return items.slice(0, 2);
};
