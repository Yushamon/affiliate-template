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

export type PriceAssessment = "cheap" | "fair" | "expensive" | "unknown";

export type PriceSnapshot = {
  amount: number;
  currency: string;
  fetchedAt?: string;
  previousAmount?: number;
  assessment?: PriceAssessment;
  assessmentLabel?: string;
  rangeLabel?: string;
  comparisonText?: string;
  sourceLabel?: string;
};

export type PriceState =
  | { kind: "hidden" }
  | { kind: "link-only"; link: AffiliateLink }
  | { kind: "value-only"; snapshot: PriceSnapshot }
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
  hasDifferences: boolean;
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
  heroImage: CoreImage;
  facts: Array<{ label: string; value: string }>;
  products: ComparisonProduct[];
  /** Data-driven layers derived from the complete comparison field. */
  relevantAlternatives?: ComparisonProduct[];
  technicalCandidates?: ComparisonProduct[];
  selectionReasons?: Record<string, string>;
  alternativeReasons?: Record<string, string>;
  recommendationProducts: ComparisonProduct[];
  rows: ComparisonRow[];
  filters: ComparisonFilter[];
  initialVisibleProducts: number;
  scenarioRecommendations: Array<{
    key: string;
    label: string;
    score: number;
    reason: string;
    winner: ComparisonProduct;
    alternative?: ComparisonProduct;
  }>;
  verdict: {
    title: string;
    text: string;
    winner?: ComparisonProduct;
    alternative?: ComparisonProduct;
  };
};
