import type { ImageMetadata } from "astro";

export type CoreImage = {
  src: ImageMetadata | string;
  alt?: string;
};

export type AffiliateLink = {
  provider?: string;
  label: string;
  url: string;
  rel?: string;
  target?: "_blank" | "_self";
};

export type PriceSnapshot = {
  amount: number;
  currency: string;
  fetchedAt: string;
  previousAmount?: number;
};

export type PriceState =
  | { kind: "hidden" }
  | { kind: "link-only"; link: AffiliateLink }
  | { kind: "live"; link: AffiliateLink; snapshot: PriceSnapshot };

export type ProductFilterValues = Record<string, string[]>;

export type ComparisonProduct = {
  slug: string;
  title: string;
  manufacturer?: string;
  href: string;
  image?: CoreImage;
  recommendation?: string;
  rating?: number;
  badge?: string;
  strengths: string[];
  attention: string[];
  affiliate?: AffiliateLink;
  price: PriceState;
  filterValues: ProductFilterValues;
};

export type ComparisonCriterion = {
  key: string;
  label: string;
  description?: string;
};

export type ComparisonCell = {
  productSlug: string;
  value: string;
};

export type ComparisonRow = {
  criterion: ComparisonCriterion;
  cells: ComparisonCell[];
};

export type ComparisonFilterOption = {
  value: string;
  label: string;
};

export type ComparisonFilter = {
  key: string;
  label: string;
  options: ComparisonFilterOption[];
};

export type ComparisonViewModel = {
  title: string;
  description: string;
  eyebrow: string;
  heroImage?: CoreImage;
  facts: Array<{ label: string; value: string }>;
  products: ComparisonProduct[];
  recommendationProducts: ComparisonProduct[];
  rows: ComparisonRow[];
  filters: ComparisonFilter[];
  verdict: {
    title: string;
    text: string;
    winner?: ComparisonProduct;
    alternative?: ComparisonProduct;
  };
};
