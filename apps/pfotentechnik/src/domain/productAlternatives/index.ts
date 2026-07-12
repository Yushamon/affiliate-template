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

  return [];
};
