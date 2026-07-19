import type { CollectionEntry } from "astro:content";
import type { AdvisorProduct } from "./types";

export const mapProductToAdvisor = (
  entry: CollectionEntry<"products">
): AdvisorProduct => {
  const data = entry.data;
  const slug = entry.id.replace(/\.(md|mdx)$/i, "");

  return {
    id: entry.id,
    slug,
    title: data.title,
    description: data.description,
    recommendation: data.recommendation,
    rating: data.rating,
    score: data.score,
    bestFor: data.decision.bestFor,
    attention: data.decision.attention,
    strengths: data.strengths,
    weaknesses: data.weaknesses,
    features: data.features,
    useCase: data.useCase,
    priceCategory:
      data.priceCategory ??
      data.comparisonFilters?.priceTier,
    foodType: data.comparisonFilters?.foodType ?? [],
    app: data.comparisonFilters?.app,
    camera: data.comparisonFilters?.camera,
    access: data.comparisonFilters?.access,
    backupPower: data.comparisonFilters?.backupPower,
    route: `/produkt/${slug}/`
  };
};
