import type { CollectionEntry } from "astro:content";
import {
  getDecisionProducts,
  type ScoredDecisionProduct
} from "@affiliate-core/utils/decisionEngine";
import { decisionRules } from "./rules";

type ProductEntry = CollectionEntry<"products">;

type DecisionProduct = {
  key: string;
  name: string;
  useCases: string[];
  ratings: Record<string, number>;
  rating: number;
};

const normalizeCriterion = (value: string) =>
  value
    .toLocaleLowerCase("de")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]/g, "");

const toDecisionProduct = (entry: ProductEntry): DecisionProduct => {
  const textualUseCases = [
    ...entry.data.tags,
    ...entry.data.features,
    ...entry.data.decision.bestFor,
    entry.data.useCase ?? ""
  ];

  return {
    key: entry.data.slug,
    name: entry.data.title,
    useCases: Array.from(new Set([
      ...entry.data.tags.map(normalizeCriterion),
      ...textualUseCases
        .flatMap((value) => value.split(/[^\p{L}\p{N}-]+/u))
        .map(normalizeCriterion)
        .filter(Boolean)
    ])),
    ratings: Object.fromEntries(
      Object.entries(entry.data.ratings).map(([key, value]) => [
        normalizeCriterion(key),
        value
      ])
    ),
    rating: entry.data.rating
  };
};

export const getDecisionRule = (decisionKey: string) =>
  decisionRules[decisionKey];

export const getDecisionProductRecommendations = (
  decisionKey: string,
  products: ProductEntry[]
): Array<ScoredDecisionProduct<DecisionProduct>> => {
  const rule = getDecisionRule(decisionKey);

  if (!rule) {
    return [];
  }

  const catalog = Object.fromEntries(
    products.map((entry) => [entry.data.slug, toDecisionProduct(entry)])
  );

  return getDecisionProducts(catalog, rule);
};
