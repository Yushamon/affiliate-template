import type { ImageMetadata } from "astro";

export type ComparisonImage = {
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

export type FuturePrice =
  | { kind: "hidden" }
  | {
      kind: "live";
      amount: number;
      currency: string;
      fetchedAt: string;
      previousAmount?: number;
    };

export type ComparisonProductView = {
  slug: string;
  title: string;
  manufacturer?: string;
  href: string;
  image?: ComparisonImage;
  recommendation?: string;
  rating?: number;
  badge?: string;
  strengths: string[];
  attention: string[];
  affiliate?: AffiliateLink;
  price?: FuturePrice;
};

export type ComparisonCriterionView = {
  key: string;
  label: string;
  description?: string;
};

export type ComparisonTableRow = {
  criterion: ComparisonCriterionView;
  values: Array<{
    productSlug: string;
    value: string;
  }>;
};

export type ComparisonHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  image?: ComparisonImage;
  facts?: Array<{
    label: string;
    value: string;
  }>;
};
