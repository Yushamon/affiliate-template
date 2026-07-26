export type PriceAssessment = "cheap" | "fair" | "expensive" | "unknown";
export type PriceTier = "budget" | "midrange" | "premium" | "unknown";

export type PriceSource = {
  id: string;
  label: string;
  type: "merchant" | "affiliate" | "editorial" | "unknown";
  url?: string;
};

export type ProductPriceSnapshot = {
  slug: string;
  categoryKey: string;
  current: number | null;
  currency: string;
  status: PriceAssessment;
  comparisonText?: string;
  checkedAt?: string;
  affiliateUrl?: string;
  source?: PriceSource;
  explicitTier?: PriceTier;
};

export type CategoryPriceRange = {
  categoryKey: string;
  currency: string;
  min: number;
  max: number;
  lowThreshold: number;
  highThreshold: number;
  median: number;
  bands: {
    budget: { min: number; max: number };
    midrange: { min: number; max: number };
    premium: { min: number; max: number };
  };
  sampleSize: number;
  generatedAt: string;
  source: "category-engine";
};

export type ProductPriceInsight = ProductPriceSnapshot & {
  range: CategoryPriceRange | null;
  assessment: PriceAssessment;
  assessmentLabel: string;
  tier: PriceTier;
  formattedCurrent: string | null;
  formattedRange: string | null;
  generatedComparisonText: string;
  isStale: boolean;
  freshnessDays: number | null;
};

export interface PriceAdapter<TProduct = unknown> {
  readonly id: string;
  supports(product: TProduct): boolean;
  read(product: TProduct): ProductPriceSnapshot | null;
}
