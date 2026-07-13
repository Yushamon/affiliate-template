import type { CollectionEntry } from "astro:content";
import type { AlternativeRecommendation } from "@affiliate-core/components/product/alternativeRecommendation.types";
import { getFutterautomatenAlternatives } from "./categories/futterautomaten";

export type ProductEntry = CollectionEntry<"products">;

export const getAlternativeRecommendations = (
  currentProduct: ProductEntry,
  products: ProductEntry[],
  limit = 3
): AlternativeRecommendation[] => {
  const category = currentProduct.data.category.key.toLowerCase().trim();

  if (category.includes("futterautomat") || category.includes("fütter")) {
    return getFutterautomatenAlternatives(currentProduct, products, limit);
  }

  if (category.includes("trinkbrunnen")) {
    const preferred = new Map(
      currentProduct.data.alternatives.map((slug, index) => [slug, index])
    );

    return products
      .filter((candidate) =>
        candidate.id !== currentProduct.id &&
        candidate.data.category.key.toLowerCase().trim().includes("trinkbrunnen")
      )
      .sort((a, b) => {
        const aPreferred = preferred.get(a.data.slug) ?? Number.MAX_SAFE_INTEGER;
        const bPreferred = preferred.get(b.data.slug) ?? Number.MAX_SAFE_INTEGER;
        return aPreferred - bPreferred ||
          (b.data.score ?? b.data.rating * 20) - (a.data.score ?? a.data.rating * 20);
      })
      .slice(0, limit)
      .map((candidate) => ({
        productKey: candidate.data.slug,
        name: candidate.data.title,
        url: candidate.data.productUrl ?? `/produkt/${candidate.data.slug}/`,
        image: candidate.data.images.comparison?.src ?? candidate.data.images.hero.src,
        score: candidate.data.score ?? Math.round(candidate.data.rating * 20),
        rating: candidate.data.rating,
        icon: "",
        headline: candidate.data.decision.bestFor[0]
          ? `Wenn ${candidate.data.decision.bestFor[0].toLowerCase()} wichtig ist`
          : "Eine passende Alternative",
        reason: candidate.data.recommendation,
        difference: candidate.data.review.verdict,
        tags: candidate.data.decision.bestFor.slice(0, 3)
      }));
  }

  return [];
};
