import {
  CONTENT_GAP_WEIGHTS,
  DEFAULT_NICHE_MINIMUM_SCORE,
  NICHE_FIT_WEIGHTS,
  SOURCE_WEIGHTS,
} from "./config.ts";
import type {
  CommercialPotential,
  Confidence,
  MarketSignal,
  NicheOpportunity,
  SourceEvidence,
} from "./types";

const clamp = (value: number, minimum = 0, maximum = 100) =>
  Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : 0));

export const confidenceFromScore = (score: number): Confidence =>
  score >= 80 ? "high" : score >= 60 ? "medium" : "low";

export const scoreSourceEvidence = (sources: SourceEvidence[]): number => {
  const unique = new Map(sources.map((source) => [source.url, source]));
  let score = 0;
  const retailerDomains = new Set<string>();
  for (const source of unique.values()) {
    const base = SOURCE_WEIGHTS[source.sourceType] ?? 0;
    score += base * clamp(source.confidence, 0, 1);
    if (source.sourceType === "established-retailer") retailerDomains.add(source.domain);
  }
  if (retailerDomains.size >= 2) score += 7.5;
  return Math.round(clamp(score));
};

export const scoreValidation = ({
  sources,
  germanyAvailable,
  currentAvailability,
}: {
  sources: SourceEvidence[];
  germanyAvailable?: boolean;
  currentAvailability?: boolean;
}) => {
  let score = scoreSourceEvidence(sources);
  if (germanyAvailable) score += 10;
  if (currentAvailability) score += 10;
  const finalScore = Math.round(clamp(score));
  return {
    score: finalScore,
    confidence: confidenceFromScore(finalScore),
    recommendation:
      finalScore >= 80
        ? "Hohe Sicherheit; redaktionellen Preflight starten."
        : finalScore >= 60
          ? "Brauchbar; manuelle Quellenprüfung erforderlich."
          : finalScore >= 40
            ? "Unsicher; nicht zur Anlage freigeben."
            : "Unzureichend validiert; Produktanlage blockieren.",
  };
};

export const scoreContentGap = (input: {
  searchVisibility: number;
  productRelevance: number;
  commercialPotential: number;
  missingCoverage: number;
  internalLinkability: number;
  sourceQuality: number;
  freshness: number;
}) => {
  const score = Object.entries(CONTENT_GAP_WEIGHTS).reduce(
    (sum, [key, weight]) => sum + clamp(input[key as keyof typeof input]) * weight,
    0,
  );
  return Math.round(clamp(score));
};

export const scoreNicheFit = (
  input: Pick<
    NicheOpportunity,
    | "targetAudienceOverlap"
    | "internalLinkability"
    | "productAvailability"
    | "searchPotential"
    | "commercialPotential"
    | "editorialCredibility"
  >,
  minimumScore = DEFAULT_NICHE_MINIMUM_SCORE,
) => {
  const score = Object.entries(NICHE_FIT_WEIGHTS).reduce(
    (sum, [key, weight]) => sum + clamp(input[key as keyof typeof input]) * weight,
    0,
  );
  const rounded = Math.round(clamp(score));
  return {
    score: rounded,
    recommended: rounded >= clamp(minimumScore),
    confidence: confidenceFromScore(rounded),
  };
};

export const classifyCommercialPotential = (signals: {
  purchaseIntent: number;
  retailerCoverage: number;
  comparisonFit: number;
  followUpPurchases: number;
  competition: number;
}): { level: CommercialPotential; score: number; rationale: string } => {
  const score = Math.round(
    clamp(
      clamp(signals.purchaseIntent) * 0.3 +
        clamp(signals.retailerCoverage) * 0.2 +
        clamp(signals.comparisonFit) * 0.25 +
        clamp(signals.followUpPurchases) * 0.1 +
        (100 - clamp(signals.competition)) * 0.15,
    ),
  );
  return {
    level: score >= 70 ? "high" : score >= 45 ? "medium" : "low",
    score,
    rationale:
      "Redaktionelle Schätzung aus Kaufintention, Händlerabdeckung, Vergleichstauglichkeit, möglichen Folgekäufen und Wettbewerb; keine Umsatz- oder Conversion-Prognose.",
  };
};

export const validateMarketSignal = (signal: MarketSignal): string[] => {
  const errors: string[] = [];
  if (!signal.source?.url || !signal.source.observedAt) errors.push("Marktsignal benötigt Quelle und Beobachtungsdatum.");
  if (!signal.limitation?.trim()) errors.push("Marktsignal benötigt eine Einschränkung.");
  if (signal.confidence < 0 || signal.confidence > 1) errors.push("Confidence muss zwischen 0 und 1 liegen.");
  if (
    /verkaufszahl|sales|units sold/i.test(signal.unit ?? "") &&
    signal.type !== "manufacturer-units"
  ) {
    errors.push("Nicht belegte Nachfrageindikatoren dürfen nicht als Verkaufszahlen bezeichnet werden.");
  }
  return errors;
};
