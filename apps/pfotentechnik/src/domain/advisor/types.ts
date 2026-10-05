import type { ProductContentData } from "../../content/schema/product";
import type { ResearchValue } from "../consumableCosts.types";

// Reuse the existing five-state capability vocabulary: unavailable = UNSUPPORTED.
export type AdvisorCapability = NonNullable<ProductContentData["multiPet"]>["sharedUse"];
export type AdvisorFact<T> = ResearchValue<T>;
export type AdvisorCommonFacts = {
  animals: AdvisorFact<AdvisorPet[]>;
  petSizes: AdvisorFact<Array<"small" | "medium" | "large">>;
  foodTypes: AdvisorFact<Array<"dry" | "wet">>;
  app: AdvisorCapability;
  camera: AdvisorCapability;
  accessControl: AdvisorFact<"open" | "microchip">;
  backupPower: AdvisorCapability;
  offlineSchedule: AdvisorCapability;
  failureModes: Partial<Record<keyof NonNullable<ProductContentData["failureModes"]>, AdvisorCapability>>;
  multiPet: { sharedUse: AdvisorCapability; individualAccess: AdvisorCapability };
};

export type AdvisorPet = "cat" | "dog";
export type AdvisorPetCount = "one" | "multiple";
export type AdvisorFood = "dry" | "wet" | "mixed";
export type AdvisorBudget = "budget" | "midrange" | "premium" | "open";
export type AdvisorPriority =
  | "camera"
  | "app"
  | "offline"
  | "backup"
  | "microchip"
  | "simple";
export type AdvisorDecisionStyle = "best-match" | "safe-choice";

export type AdvisorAnswers = {
  pet: AdvisorPet;
  petCount: AdvisorPetCount;
  food: AdvisorFood;
  priorities: AdvisorPriority[];
  budget: AdvisorBudget;
  decisionStyle: AdvisorDecisionStyle;
};

export type AdvisorProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  recommendation: string;
  rating: number;
  score?: number;
  bestFor: string[];
  attention: string[];
  strengths: string[];
  weaknesses: string[];
  features: string[];
  useCase?: string;
  priceCategory?: "budget" | "midrange" | "premium";
  category: string;
  common: AdvisorCommonFacts;
  specific: {
    gps?: Pick<NonNullable<ProductContentData["gps"]>, "minimumPetWeightKg" | "deviceWeightGrams" | "subscriptionRequired" | "batteryMaxDays" | "liveTracking" | "virtualFence">;
    feeder?: ProductContentData["dispensingPrecision"];
    litterBox?: { compatibility: ProductContentData["litterCompatibility"]; limits: ProductContentData["sensorLimits"] };
  };
  route: string;
};

export type AdvisorFit = "excellent" | "good" | "limited" | "none";

export type AdvisorMatch = {
  product: AdvisorProduct;
  score: number;
  fit: AdvisorFit;
  reasons: string[];
  cautions: string[];
  exclusions: string[];
  matchedPriorities: AdvisorPriority[];
};

export type AdvisorGuide = {
  title: string;
  href: string;
  description: string;
  when: (answers: AdvisorAnswers) => boolean;
};
