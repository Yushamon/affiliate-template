import {
  getDecisionProducts,
  type ScoredDecisionProduct
} from "@affiliate-core/utils/decisionEngine";

import { decisionRules } from "./decisionRules";
import { products, type ProductKey } from "./products";

type Product = (typeof products)[ProductKey];

export const getDecisionRule = (decisionKey: string) =>
  decisionRules[decisionKey];

export const getDecisionProductRecommendations = (
  decisionKey: string
): Array<ScoredDecisionProduct<Product & { key: ProductKey }>> => {
  const rule = getDecisionRule(decisionKey);

  if (!rule) {
    return [];
  }

  const productsWithKeys = Object.fromEntries(
    Object.entries(products).map(([key, product]) => [
      key,
      {
        ...product,
        key: key as ProductKey
      }
    ])
  ) as Record<ProductKey, Product & { key: ProductKey }>;

  return getDecisionProducts(productsWithKeys, rule);
};