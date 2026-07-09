import type { ProductKey, ProductRatings } from "./products";

interface ProductReviewData {
  summary: string;
  verdict: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
  notFor: string[];
  ratings: ProductRatings;
}

export const productReviews: Partial<Record<ProductKey, ProductReviewData>> = {};
