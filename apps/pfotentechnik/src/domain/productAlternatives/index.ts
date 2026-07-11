import {
  products,
  type ProductKey
} from "@app/data/products";

import type {
  AlternativeRecommendation
} from "@affiliate-core/components/product/alternativeRecommendation.types";

import {
  getFutterautomatenAlternatives
} from "./categories/futterautomaten";

export const getAlternativeRecommendations =
  (
    currentProductKey: ProductKey,
    limit = 3
  ): AlternativeRecommendation[] => {
    const product =
      products[currentProductKey];

    if (!product) {
      return [];
    }

    const category =
      String(
        product.category ?? ""
      )
        .toLowerCase()
        .trim();

    if (
      category.includes(
        "futterautomat"
      ) ||
      category.includes(
        "fütter"
      )
    ) {
      return getFutterautomatenAlternatives(
        currentProductKey,
        limit
      );
    }

    return [];
  };