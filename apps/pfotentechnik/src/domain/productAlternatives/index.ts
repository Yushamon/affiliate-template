/* PfotenTechnik Product Alternatives 8.2.0 */
import type { CollectionEntry } from "astro:content";
import type { AlternativeRecommendation } from "@affiliate-core/components/product/alternativeRecommendation.types";
import { getFutterautomatenAlternatives } from "./categories/futterautomaten";

export type ProductEntry = CollectionEntry<"products">;

const cleanVisibleLabel = (value: string) =>
  value
    .replace(
      /^\s*(?:[✓✔☑✅✕✖×❌✗✘•\-–—]+\s*)+/u,
      ""
    )
    .trim();

const normalizeLabel = (value: unknown) =>
  cleanVisibleLabel(String(value ?? ""))
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("de-DE")
    .trim();

const capitalizeFirst = (value: string) => {
  const cleaned = cleanVisibleLabel(value);

  return cleaned
    ? cleaned.charAt(0).toLocaleUpperCase("de-DE") +
        cleaned.slice(1)
    : cleaned;
};

const formatVisibleLabel = (value: string) => {
  const normalized = normalizeLabel(value);

  const labels: Record<string, string> = {
    "große hunde": "Große Hunde",
    "grosse hunde": "Große Hunde",
    "größere hunde": "Größere Hunde",
    "groessere hunde": "Größere Hunde",
    "mittelgroße hunde": "Mittelgroße Hunde",
    "mittelgrosse hunde": "Mittelgroße Hunde",
    "kleine hunde": "Kleine Hunde",
    "große katzen": "Große Katzen",
    "grosse katzen": "Große Katzen",
    "kleine katzen": "Kleine Katzen",
    "katzen": "Katzen",
    "hunde": "Hunde",
    "mehrhundehaushalte": "Mehrhundehaushalte",
    "mehrkatzenhaushalte": "Mehrkatzenhaushalte",
    "mehrtierhaushalte": "Mehrtierhaushalte",
    "hoher wasserbedarf": "Hoher Wasserbedarf",
    "niedriger wasserbedarf": "Niedriger Wasserbedarf",
    "großes volumen": "Großes Volumen",
    "grosses volumen": "Großes Volumen",
    "breite trinkfläche": "Breite Trinkfläche",
    "breite trinkflaeche": "Breite Trinkfläche",
    "mit app": "Mit App",
    "ohne app": "Ohne App",
    "mit kamera": "Mit Kamera",
    "ohne kamera": "Ohne Kamera",
    "mit akku": "Mit Akku",
    "ohne akku": "Ohne Akku",
    "nassfutter": "Nassfutter",
    "trockenfutter": "Trockenfutter",
    "edelstahl": "Edelstahl",
    "kunststoff": "Kunststoff",
    "keramik": "Keramik",
    "preis leistung": "Preis-Leistung"
  };

  return labels[normalized] ?? capitalizeFirst(value);
};

const formatAlternativeHeadline = (value: string) => {
  const normalized = normalizeLabel(value);

  const headlines: Record<string, string> = {
    "große hunde": "Für große Hunde",
    "grosse hunde": "Für große Hunde",
    "größere hunde": "Für größere Hunde",
    "groessere hunde": "Für größere Hunde",
    "mittelgroße hunde": "Für mittelgroße Hunde",
    "mittelgrosse hunde": "Für mittelgroße Hunde",
    "kleine hunde": "Für kleine Hunde",
    "große katzen": "Für große Katzen",
    "grosse katzen": "Für große Katzen",
    "kleine katzen": "Für kleine Katzen",
    "katzen": "Für Katzen",
    "hunde": "Für Hunde",
    "mehrhundehaushalte": "Für Mehrhundehaushalte",
    "mehrkatzenhaushalte": "Für Mehrkatzenhaushalte",
    "mehrtierhaushalte": "Für Mehrtierhaushalte",
    "hoher wasserbedarf": "Bei hohem Wasserbedarf",
    "niedriger wasserbedarf": "Bei niedrigem Wasserbedarf",
    "großes volumen": "Wenn viel Volumen benötigt wird",
    "grosses volumen": "Wenn viel Volumen benötigt wird",
    "breite trinkfläche": "Für eine breite Trinkfläche",
    "breite trinkflaeche": "Für eine breite Trinkfläche",
    "mit app": "Mit App",
    "ohne app": "Ohne App",
    "mit kamera": "Mit Kamera",
    "ohne kamera": "Ohne Kamera",
    "mit akku": "Mit Akku",
    "ohne akku": "Ohne Akku",
    "nassfutter": "Für Nassfutter",
    "trockenfutter": "Für Trockenfutter",
    "edelstahl": "Mit Edelstahl",
    "preis leistung": "Als Preis-Leistungs-Alternative"
  };

  return headlines[normalized] ?? `Für ${formatVisibleLabel(value)}`;
};

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const stringArray = (value: unknown): string[] =>
  asArray(value)
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);

const categoryKey = (entry: ProductEntry) => {
  const data = entry.data as any;
  const category = data.category;

  return normalizeLabel(
    typeof category === "string"
      ? category
      : category?.key ?? category?.label
  );
};

const slugOf = (entry: ProductEntry) => {
  const data = entry.data as any;
  return String(data.slug ?? entry.id).replace(/\.mdx?$/i, "");
};

const normalizeAnimal = (value: string) => {
  const normalized = normalizeLabel(value);

  if (["dog", "hund", "hunde"].includes(normalized)) return "dog";
  if (["cat", "katze", "katzen"].includes(normalized)) return "cat";

  return normalized;
};

const normalizeSize = (value: string) => {
  const normalized = normalizeLabel(value);

  if (["small", "klein", "kleine", "kleiner"].includes(normalized)) {
    return "small";
  }

  if (
    ["medium", "mittel", "mittelgroß", "mittelgross"].includes(normalized)
  ) {
    return "medium";
  }

  if (
    ["large", "groß", "gross", "große", "grosse"].includes(normalized)
  ) {
    return "large";
  }

  return normalized;
};

const collectAnimals = (entry: ProductEntry) => {
  const data = entry.data as any;

  return new Set(
    [
      ...stringArray(data.gps?.animal),
      ...stringArray(data.comparisonFilters?.animal),
      ...stringArray(data.comparisonData?.general?.animal),
      ...stringArray(data.comparisonData?.gps?.animal)
    ].map(normalizeAnimal)
  );
};

const collectSizes = (entry: ProductEntry) => {
  const data = entry.data as any;

  return new Set(
    [
      ...stringArray(data.comparisonFilters?.petSize),
      ...stringArray(data.comparisonData?.general?.petSize)
    ].map(normalizeSize)
  );
};

const intersects = (left: Set<string>, right: Set<string>) =>
  [...left].some((value) => right.has(value));

const isCompatible = (
  current: ProductEntry,
  candidate: ProductEntry
) => {
  const currentAnimals = collectAnimals(current);
  const candidateAnimals = collectAnimals(candidate);
  const currentSizes = collectSizes(current);
  const candidateSizes = collectSizes(candidate);

  if (
    currentAnimals.size > 0 &&
    candidateAnimals.size > 0 &&
    !intersects(currentAnimals, candidateAnimals)
  ) {
    return false;
  }

  if (
    currentSizes.size > 0 &&
    candidateSizes.size > 0 &&
    !intersects(currentSizes, candidateSizes)
  ) {
    return false;
  }

  return true;
};

const editorialScore = (entry: ProductEntry) => {
  const data = entry.data as any;
  const raw = Number(data.score ?? data.rating ?? 0);

  if (!Number.isFinite(raw)) return 0;
  return raw <= 5 ? raw * 20 : raw;
};

const fallbackRank = (
  current: ProductEntry,
  candidate: ProductEntry
) => {
  const currentAnimals = collectAnimals(current);
  const candidateAnimals = collectAnimals(candidate);
  const currentSizes = collectSizes(current);
  const candidateSizes = collectSizes(candidate);

  const animalFit =
    currentAnimals.size > 0 &&
    candidateAnimals.size > 0 &&
    intersects(currentAnimals, candidateAnimals)
      ? 1000
      : 0;

  const sizeFit =
    currentSizes.size > 0 &&
    candidateSizes.size > 0 &&
    intersects(currentSizes, candidateSizes)
      ? 250
      : 0;

  return animalFit + sizeFit + editorialScore(candidate);
};

const toRecommendation = (
  candidate: ProductEntry
): AlternativeRecommendation => {
  const data = candidate.data as any;
  const bestFor = stringArray(data.decision?.bestFor);
  const primaryUseCase = bestFor[0];
  const images = data.images ?? {};
  const review = data.review ?? {};

  return {
    productKey: slugOf(candidate),
    name: String(data.title ?? data.name ?? slugOf(candidate)),
    url:
      data.productUrl ??
      `/produkt/${slugOf(candidate)}/`,
    image:
      images.comparison?.src ??
      images.thumbnail?.src ??
      images.hero?.src ??
      images.hero,
    score: Math.round(editorialScore(candidate)),
    rating: Number(data.rating ?? 0),
    icon: "",
    headline: primaryUseCase
      ? formatAlternativeHeadline(primaryUseCase)
      : "Eine passende Alternative",
    reason: String(
      data.recommendation ??
        data.description ??
        "Passende Alternative im direkten Vergleich."
    ),
    difference: String(
      review.verdict ??
        review.summary ??
        data.description ??
        ""
    ),
    tags: bestFor.slice(0, 3).map(formatVisibleLabel)
  };
};

const explicitEntries = (
  currentProduct: ProductEntry,
  products: ProductEntry[]
) => {
  const data = currentProduct.data as any;
  const requested = stringArray(data.alternatives);
  const bySlug = new Map(
    products.map((product) => [slugOf(product), product])
  );

  return requested
    .map((slug) => bySlug.get(slug))
    .filter(
      (candidate): candidate is ProductEntry =>
        Boolean(candidate && candidate.id !== currentProduct.id)
    );
};

export const getAlternativeRecommendations = (
  currentProduct: ProductEntry,
  products: ProductEntry[],
  limit = 3
): AlternativeRecommendation[] => {
  const explicit = explicitEntries(currentProduct, products);
  const explicitSlugs = new Set(explicit.map(slugOf));
  const result: AlternativeRecommendation[] =
    explicit.map(toRecommendation);

  if (result.length >= limit) {
    return result.slice(0, limit);
  }

  const category = categoryKey(currentProduct);

  if (
    category.includes("futterautomat") ||
    category.includes("fütter")
  ) {
    const specialized = getFutterautomatenAlternatives(
      currentProduct,
      products,
      Math.max(limit * 3, limit)
    ).filter(
      (recommendation) =>
        !explicitSlugs.has(recommendation.productKey)
    );

    return [...result, ...specialized].slice(0, limit);
  }

  const fallback = products
    .filter(
      (candidate) =>
        candidate.id !== currentProduct.id &&
        !explicitSlugs.has(slugOf(candidate)) &&
        categoryKey(candidate) === category &&
        isCompatible(currentProduct, candidate)
    )
    .sort(
      (left, right) =>
        fallbackRank(currentProduct, right) -
          fallbackRank(currentProduct, left) ||
        slugOf(left).localeCompare(slugOf(right), "de")
    )
    .slice(0, Math.max(0, limit - result.length))
    .map(toRecommendation);

  return [...result, ...fallback].slice(0, limit);
};
