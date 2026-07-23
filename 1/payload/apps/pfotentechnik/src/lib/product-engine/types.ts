export type Animal = "dog" | "cat" | "both" | "unknown";
export type PetSize = "small" | "medium" | "large" | "all" | "unknown";

export interface ProductImage {
  src: string;
  alt?: string;
  caption?: string;
  type?: "hero" | "thumbnail" | "comparison" | "gallery" | "detail" | "app" | "size-comparison";
}

export interface ProductDecision {
  title?: string;
  goodFor?: string[];
  notFor?: string[];
}

export interface ProductQuickFact {
  label: string;
  value: string;
  note?: string;
  icon?: string;
}

export interface ProductSuitabilityEntry {
  label?: string;
  score: number;
  note?: string;
}

export interface ProductContextSpec {
  label: string;
  value: string;
  context?: string;
  icon?: string;
}

export interface ProductAlternative {
  title: string;
  slug?: string;
  url?: string;
  image?: string;
  reason?: string;
  badge?: string;
}

export interface ProductTrust {
  testStatus?: string;
  testedAt?: string;
  updatedAt?: string;
  method?: string;
  sources?: string[];
  firmware?: string;
}

export interface ProductIntelligence {
  animal: Animal;
  petSize: PetSize[];
  category?: string;
  manufacturer?: string;
  gps?: boolean;
  app?: boolean;
  camera?: boolean;
  subscription?: "required" | "optional" | "none" | "unknown";
  waterproof?: string | boolean;
  outdoor?: boolean;
  multiPet?: boolean;
  seniorFriendly?: boolean;
  inferredTargetGroups: string[];
  inferredWarnings: string[];
  inferredBenefits: string[];
}

export interface NormalizedProduct {
  slug?: string;
  title?: string;
  description?: string;
  category?: string;
  manufacturer?: string;
  images: ProductImage[];
  decision?: ProductDecision;
  quickFacts: ProductQuickFact[];
  suitability: Record<string, ProductSuitabilityEntry>;
  pros: string[];
  cons: string[];
  contextSpecs: ProductContextSpec[];
  alternatives: ProductAlternative[];
  trust?: ProductTrust;
  faq: unknown[];
  intelligence: ProductIntelligence;
  source: "legacy" | "hybrid" | "standard-2";
}
