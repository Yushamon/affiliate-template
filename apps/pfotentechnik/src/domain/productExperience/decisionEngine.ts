import type { PriceTier } from "../price/types.ts";
import { priceTierDistance } from "../price/tier.ts";

export type ProductDecisionProfile = {
  productName: string;
  animals: string[];
  petSizes: string[];
  foodTypes: string[];
  supportsMultiplePets: boolean | null;
  hasWifi: boolean | null;
  worksOffline: boolean | null;
  hasCamera: boolean | null;
  priceTier: PriceTier;
};

export type DecisionAnswers = {
  animal?: "dog" | "cat";
  animalCount?: number;
  dryFood?: boolean;
  wetFood?: boolean;
  budget?: PriceTier | "flexible";
  wifi?: "required" | "optional" | "offline";
  camera?: "required" | "optional" | "unwanted";
};

export type DecisionEvaluation = {
  score: number;
  completed: number;
  total: number;
  isComplete: boolean;
  verdict: "strong" | "conditional" | "weak" | "open";
  headline: string;
  explanation: string;
  positives: string[];
  risks: string[];
  mismatchKeys: string[];
};

const hasKnownValues = (values: string[]) => values.length > 0;

export const evaluateDecision = (
  profile: ProductDecisionProfile,
  answers: DecisionAnswers
): DecisionEvaluation => {
  const checks: Array<{
    key: string;
    answered: boolean;
    weight: number;
    factor: number;
    positive?: string;
    risk?: string;
  }> = [];

  if (answers.animal) {
    const known = hasKnownValues(profile.animals);
    const match = !known || profile.animals.includes(answers.animal);
    checks.push({
      key: "animal",
      answered: true,
      weight: 22,
      factor: match ? 1 : 0,
      positive: match ? "Die ausgewiesene Tierart passt." : undefined,
      risk: match ? undefined : "Das Produkt ist für die gewählte Tierart nicht ausgewiesen."
    });
  }

  if (answers.animalCount != null) {
    const multiple = answers.animalCount > 1;
    const unknown = profile.supportsMultiplePets == null;
    const factor = !multiple ? 1 : unknown ? 0.65 : profile.supportsMultiplePets ? 1 : 0.35;
    checks.push({
      key: "multi-pet",
      answered: true,
      weight: 10,
      factor,
      positive: factor >= 0.9 ? "Die Anzahl der Tiere passt zum vorgesehenen Einsatz." : undefined,
      risk: factor < 0.7 ? "Für mehrere Tiere fehlen klare Mehrtierfunktionen oder getrennte Zugänge." : undefined
    });
  }

  if (answers.dryFood != null) {
    const known = hasKnownValues(profile.foodTypes);
    const supports = !known || profile.foodTypes.includes("dry");
    const factor = !answers.dryFood ? 1 : supports ? 1 : 0;
    checks.push({
      key: "dry-food",
      answered: true,
      weight: 12,
      factor,
      positive: answers.dryFood && supports ? "Trockenfutter wird unterstützt." : undefined,
      risk: answers.dryFood && !supports ? "Trockenfutter ist für dieses Modell nicht ausgewiesen." : undefined
    });
  }

  if (answers.wetFood != null) {
    const known = hasKnownValues(profile.foodTypes);
    const supports = !known || profile.foodTypes.includes("wet");
    const factor = !answers.wetFood ? 1 : supports ? 1 : 0;
    checks.push({
      key: "wet-food",
      answered: true,
      weight: 12,
      factor,
      positive: answers.wetFood && supports ? "Nassfutter wird unterstützt." : undefined,
      risk: answers.wetFood && !supports ? "Nassfutter ist mit diesem Produkttyp nicht sinnvoll vorgesehen." : undefined
    });
  }

  if (answers.budget) {
    const flexible = answers.budget === "flexible";
    const unknown = profile.priceTier === "unknown";
    const distance = flexible || unknown ? 0 : priceTierDistance(profile.priceTier, answers.budget);
    const factor = flexible ? 1 : unknown ? 0.7 : distance === 0 ? 1 : distance === 1 ? 0.65 : 0.25;
    checks.push({
      key: "budget",
      answered: true,
      weight: 14,
      factor,
      positive: factor >= 0.9 ? "Das Preisniveau passt zur Budgetwahl." : undefined,
      risk: factor < 0.7 ? "Das Preisniveau liegt außerhalb der gewählten Budgetklasse." : undefined
    });
  }

  if (answers.wifi != null) {
    const unknown = profile.hasWifi == null;
    const optional = answers.wifi === "optional";
    const requiresWifi = answers.wifi === "required";
    const factor = optional
      ? 1
      : requiresWifi
        ? unknown ? 0.7 : profile.hasWifi ? 1 : 0.25
        : profile.worksOffline === true ? 1 : profile.hasWifi === false ? 1 : unknown ? 0.7 : 0.35;
    checks.push({
      key: requiresWifi ? "wifi" : answers.wifi === "offline" ? "offline" : "wifi-optional",
      answered: true,
      weight: 15,
      factor,
      positive: factor >= 0.9 && !optional
        ? requiresWifi ? "WLAN-Funktionen sind vorhanden." : "Der Betrieb ist ohne WLAN sinnvoll möglich."
        : undefined,
      risk: factor < 0.7
        ? requiresWifi ? "WLAN-Funktionen fehlen oder sind nicht eindeutig belegt." : "Der gewünschte Offline-Betrieb ist nicht klar abgesichert."
        : undefined
    });
  }

  if (answers.camera != null) {
    const unknown = profile.hasCamera == null;
    const optional = answers.camera === "optional";
    const required = answers.camera === "required";
    const unwanted = answers.camera === "unwanted";
    const factor = optional
      ? 1
      : required
        ? unknown ? 0.65 : profile.hasCamera ? 1 : 0.15
        : unknown ? 0.8 : profile.hasCamera ? 0.65 : 1;
    checks.push({
      key: required ? "camera" : unwanted ? "camera-unwanted" : "camera-optional",
      answered: true,
      weight: 15,
      factor,
      positive: required && profile.hasCamera ? "Eine Kamera ist vorhanden." : unwanted && profile.hasCamera === false ? "Das Produkt verzichtet auf eine Kamera." : undefined,
      risk: required && factor < 0.7 ? "Das Produkt besitzt keine ausgewiesene Kamera." : unwanted && factor < 0.7 ? "Das Produkt besitzt eine Kamera, obwohl du darauf verzichten möchtest." : undefined
    });
  }

  const total = 7;
  const completed = checks.length;
  const answeredWeight = checks.reduce((sum, item) => sum + item.weight, 0);
  const achievedWeight = checks.reduce((sum, item) => sum + item.weight * item.factor, 0);
  const score = answeredWeight ? Math.round((achievedWeight / answeredWeight) * 100) : 0;
  const positives = checks.map((item) => item.positive).filter(Boolean) as string[];
  const risks = checks.map((item) => item.risk).filter(Boolean) as string[];
  const mismatchKeys = checks.filter((item) => item.factor < 0.7).map((item) => item.key);
  const isComplete = completed === total;

  const verdict = completed === 0
    ? "open"
    : score >= 82 && mismatchKeys.length === 0
      ? "strong"
      : score >= 62
        ? "conditional"
        : "weak";

  const headline = verdict === "strong"
    ? "Passt sehr gut zu deinen Angaben"
    : verdict === "conditional"
      ? "Passt, aber nicht ohne Einschränkung"
      : verdict === "weak"
        ? "Eine Alternative passt voraussichtlich besser"
        : "Beantworte die Fragen für eine persönliche Einordnung";

  const explanation = !isComplete
    ? `Zwischenstand nach ${completed} von ${total} Antworten. Die Bewertung wird mit jeder Auswahl genauer.`
    : verdict === "strong"
      ? `${profile.productName} deckt die gewählten Anforderungen ohne einen deutlichen Zielkonflikt ab.`
      : verdict === "conditional"
        ? `${profile.productName} erfüllt einen großen Teil der Anforderungen. Die genannten Einschränkungen sollten vor dem Kauf bewusst akzeptiert werden.`
        : `${profile.productName} verfehlt mindestens eine zentrale Anforderung. Die vorgeschlagene Alternative sollte zuerst geprüft werden.`;

  return {
    score,
    completed,
    total,
    isComplete,
    verdict,
    headline,
    explanation,
    positives,
    risks,
    mismatchKeys
  };
};

export const evaluateProductDecision = evaluateDecision;
