import { products, type ProductKey } from "./products";

export function getWeightedProductScore(productKey: ProductKey) {
  return products[productKey]?.ranking.overall ?? 0;
}

export function getScoreLabel(score: number) {
  if (score >= 92) return "Hervorragend";
  if (score >= 88) return "Sehr gut";
  if (score >= 82) return "Gut";
  return "Solide";
}

export function getScoredProducts() {
  return Object.entries(products)
    .map(([key, product]) => ({
      key: key as ProductKey,
      product,
      score: getWeightedProductScore(key as ProductKey)
    }))
    .sort((a, b) => b.score - a.score);
}
