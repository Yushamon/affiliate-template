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
  foodType: Array<"dry" | "wet">;
  app?: boolean;
  camera?: boolean;
  access?: "open" | "microchip";
  backupPower?: boolean;
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
