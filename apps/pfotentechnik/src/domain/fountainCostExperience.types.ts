export type FountainCostExperienceModel = {
  state: "FULL" | "COST_ONLY" | "OFFER_ONLY" | "INFO_ONLY";
  heading: string;
  filterName: string;
  interval: string | null;
  annualCost: null | { visible: string; accessible: string };
  requirementKnown: boolean;
  requirement?: boolean;
  conditionalCostNote: string | null;
  offer: null | { packLabel: string; priceLabel: string | null; merchantLabel: string | null };
  affiliate: null | { url: string; label: string; rel: string; target: "_blank" };
  methodology: string | null;
  evidence: { interval: string | null; cost: string | null; price: string | null };
};
