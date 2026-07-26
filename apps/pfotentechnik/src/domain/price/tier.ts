import type { PriceTier } from "./types.ts";

export const PRICE_TIER_ORDER: PriceTier[] = [
  "budget",
  "midrange",
  "premium"
];

export const priceTierIndex = (tier: PriceTier): number =>
  PRICE_TIER_ORDER.indexOf(tier);

export const priceTierDistance = (left: PriceTier, right: PriceTier): number => {
  const leftIndex = priceTierIndex(left);
  const rightIndex = priceTierIndex(right);
  if (leftIndex < 0 || rightIndex < 0) return 0;
  return Math.abs(leftIndex - rightIndex);
};

export const isLowerPriceTier = (candidate: PriceTier, current: PriceTier): boolean => {
  const candidateIndex = priceTierIndex(candidate);
  const currentIndex = priceTierIndex(current);
  return candidateIndex >= 0 && currentIndex >= 0 && candidateIndex < currentIndex;
};

export const isHigherPriceTier = (candidate: PriceTier, current: PriceTier): boolean => {
  const candidateIndex = priceTierIndex(candidate);
  const currentIndex = priceTierIndex(current);
  return candidateIndex >= 0 && currentIndex >= 0 && candidateIndex > currentIndex;
};
