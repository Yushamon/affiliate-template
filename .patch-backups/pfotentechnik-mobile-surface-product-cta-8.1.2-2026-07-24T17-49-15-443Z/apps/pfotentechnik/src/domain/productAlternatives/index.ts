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

const normalizeLabel = (value: string) =>
  cleanVisibleLabel(value)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("de-DE");

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

  return (
    headlines[normalized] ??
    `Für ${formatVisibleLabel(value)}`
  );
};

export const getAlternativeRecommendations = (
  currentProduct: ProductEntry,
  products: ProductEntry[],
  limit = 3
): AlternativeRecommendation[] => {
  const category = currentProduct.data.category.key
    .toLowerCase()
    .trim();

  if (
    category.includes("futterautomat") ||
    category.includes("fütter")
  ) {
    return getFutterautomatenAlternatives(
      currentProduct,
      products,
      limit
    );
  }

  if (category.includes("trinkbrunnen")) {
    const preferred = new Map(
      currentProduct.data.alternatives.map(
        (slug, index) => [slug, index]
      )
    );

    return products
      .filter(
        (candidate) =>
          candidate.id !== currentProduct.id &&
          candidate.data.category.key
            .toLowerCase()
            .trim()
            .includes("trinkbrunnen")
      )
      .sort((a, b) => {
        const aPreferred =
          preferred.get(a.data.slug) ??
          Number.MAX_SAFE_INTEGER;
        const bPreferred =
          preferred.get(b.data.slug) ??
          Number.MAX_SAFE_INTEGER;

        return (
          aPreferred -
            bPreferred ||
          (b.data.score ?? b.data.rating * 20) -
            (a.data.score ?? a.data.rating * 20)
        );
      })
      .slice(0, limit)
      .map((candidate) => {
        const primaryUseCase =
          candidate.data.decision.bestFor[0];

        return {
          productKey: candidate.data.slug,
          name: candidate.data.title,
          url:
            candidate.data.productUrl ??
            `/produkt/${candidate.data.slug}/`,
          image:
            candidate.data.images.comparison?.src ??
            candidate.data.images.hero.src,
          score:
            candidate.data.score ??
            Math.round(candidate.data.rating * 20),
          rating: candidate.data.rating,
          icon: "",
          headline: primaryUseCase
            ? formatAlternativeHeadline(primaryUseCase)
            : "Eine passende Alternative",
          reason: candidate.data.recommendation,
          difference: candidate.data.review.verdict,
          tags: candidate.data.decision.bestFor
            .slice(0, 3)
            .map(formatVisibleLabel)
        };
      });
  }

  return [];
};
