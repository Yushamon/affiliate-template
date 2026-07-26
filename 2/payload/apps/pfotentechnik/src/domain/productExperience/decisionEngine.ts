import type { PriceTier } from "../price/types.ts";
import { priceTierDistance } from "../price/tier.ts";

export type ProductDecisionProfile = {
  productName: string;
  categoryKey?: string;
  usesFoodQuestions?: boolean;
  editorialScore?: number;
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
  neutrals: string[];
  risks: string[];
  mismatchKeys: string[];
};

type DecisionCheck = {
  key: string;
  weight: number;
  factor: number;
  positive?: string;
  neutral?: string;
  risk?: string;
};

const hasKnownValues = (values: string[]) => values.length > 0;

export const evaluateDecision = (
  profile: ProductDecisionProfile,
  answers: DecisionAnswers
): DecisionEvaluation => {
  const checks: DecisionCheck[] = [];
  const usesFoodQuestions = profile.usesFoodQuestions !== false;

  if (answers.animal) {
    const known = hasKnownValues(profile.animals);
    const match = known && profile.animals.includes(answers.animal);
    checks.push({
      key: "animal",
      weight: 22,
      factor: !known ? 0.75 : match ? 1 : 0,
      positive: known && match ? "Die ausgewiesene Tierart passt." : undefined,
      neutral: !known ? "Die Eignung für die gewählte Tierart ist nicht eindeutig dokumentiert." : undefined,
      risk: known && !match ? "Das Produkt ist für die gewählte Tierart nicht ausgewiesen." : undefined
    });
  }

  if (answers.animalCount != null) {
    const multiple = answers.animalCount > 1;
    const unknown = profile.supportsMultiplePets == null;
    const factor = !multiple ? 1 : unknown ? 0.65 : profile.supportsMultiplePets ? 1 : 0.35;
    checks.push({
      key: "multi-pet",
      weight: 10,
      factor,
      positive: !multiple || profile.supportsMultiplePets === true
        ? "Die Anzahl der Tiere passt zum vorgesehenen Einsatz."
        : undefined,
      neutral: multiple && unknown
        ? "Die Eignung für mehrere Tiere ist nicht eindeutig belegt."
        : undefined,
      risk: multiple && profile.supportsMultiplePets === false
        ? "Für mehrere Tiere fehlen klare Mehrtierfunktionen oder getrennte Zugänge."
        : undefined
    });
  }

  if (usesFoodQuestions && answers.dryFood != null) {
    const known = hasKnownValues(profile.foodTypes);
    const supports = known && profile.foodTypes.includes("dry");
    const factor = !answers.dryFood ? 1 : !known ? 0.7 : supports ? 1 : 0;
    checks.push({
      key: "dry-food",
      weight: 12,
      factor,
      positive: answers.dryFood && supports ? "Trockenfutter wird unterstützt." : undefined,
      neutral: !answers.dryFood
        ? "Trockenfutter wird für diesen Einsatz nicht benötigt."
        : !known
          ? "Die Eignung für Trockenfutter ist nicht eindeutig dokumentiert."
          : undefined,
      risk: answers.dryFood && known && !supports
        ? "Trockenfutter ist für dieses Modell nicht ausgewiesen."
        : undefined
    });
  }

  if (usesFoodQuestions && answers.wetFood != null) {
    const known = hasKnownValues(profile.foodTypes);
    const supports = known && profile.foodTypes.includes("wet");
    const factor = !answers.wetFood ? 1 : !known ? 0.7 : supports ? 1 : 0;
    checks.push({
      key: "wet-food",
      weight: 12,
      factor,
      positive: answers.wetFood && supports ? "Nassfutter wird unterstützt." : undefined,
      neutral: !answers.wetFood
        ? "Nassfutter wird für diesen Einsatz nicht benötigt."
        : !known
          ? "Die Eignung für Nassfutter ist nicht eindeutig dokumentiert."
          : undefined,
      risk: answers.wetFood && known && !supports
        ? "Nassfutter ist mit diesem Produkttyp nicht sinnvoll vorgesehen."
        : undefined
    });
  }

  if (answers.budget) {
    const flexible = answers.budget === "flexible";
    const unknown = profile.priceTier === "unknown";
    const distance = flexible || unknown ? 0 : priceTierDistance(profile.priceTier, answers.budget);
    const factor = flexible ? 1 : unknown ? 0.7 : distance === 0 ? 1 : distance === 1 ? 0.65 : 0.25;
    checks.push({
      key: "budget",
      weight: 14,
      factor,
      positive: !flexible && !unknown && factor >= 0.9
        ? "Das Preisniveau passt zur Budgetwahl."
        : undefined,
      neutral: flexible
        ? "Das Budget war für die Auswahl nicht entscheidend."
        : unknown
          ? "Für dieses Produkt liegt noch kein belastbarer Preis vor."
          : undefined,
      risk: !flexible && !unknown && factor < 0.7
        ? "Das Preisniveau liegt außerhalb der gewählten Budgetklasse."
        : undefined
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
        : profile.worksOffline === true
          ? 1
          : profile.hasWifi === false
            ? 1
            : unknown
              ? 0.7
              : 0.35;

    checks.push({
      key: requiresWifi ? "wifi" : answers.wifi === "offline" ? "offline" : "wifi-optional",
      weight: 15,
      factor,
      positive: factor >= 0.9 && !optional
        ? requiresWifi
          ? "WLAN-Funktionen sind vorhanden."
          : "Der Betrieb ist ohne WLAN sinnvoll möglich."
        : undefined,
      neutral: optional
        ? "WLAN und App waren für die Auswahl nicht entscheidend."
        : unknown
          ? "Die WLAN- beziehungsweise Offline-Eignung ist nicht eindeutig dokumentiert."
          : undefined,
      risk: factor < 0.7
        ? requiresWifi
          ? "WLAN-Funktionen fehlen oder sind nicht eindeutig belegt."
          : "Der gewünschte Offline-Betrieb ist nicht klar abgesichert."
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
      weight: 15,
      factor,
      positive: required && profile.hasCamera
        ? "Eine Kamera ist vorhanden."
        : unwanted && profile.hasCamera === false
          ? "Das Produkt verzichtet auf eine Kamera."
          : undefined,
      neutral: optional
        ? "Eine Kamera war für die Auswahl nicht entscheidend."
        : unknown
          ? "Die Kameraausstattung ist nicht eindeutig dokumentiert."
          : undefined,
      risk: required && factor < 0.7
        ? "Das Produkt besitzt keine ausgewiesene Kamera."
        : unwanted && factor < 0.7
          ? "Das Produkt besitzt eine Kamera, obwohl du darauf verzichten möchtest."
          : undefined
    });
  }

  const total = usesFoodQuestions ? 7 : 5;
  const completed = checks.length;
  const answeredWeight = checks.reduce((sum, item) => sum + item.weight, 0);
  const achievedWeight = checks.reduce((sum, item) => sum + item.weight * item.factor, 0);
  const score = answeredWeight ? Math.round((achievedWeight / answeredWeight) * 100) : 0;
  const positives = checks.map((item) => item.positive).filter(Boolean) as string[];
  const neutrals = checks.map((item) => item.neutral).filter(Boolean) as string[];
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
    neutrals,
    risks,
    mismatchKeys
  };
};

export const evaluateProductDecision = evaluateDecision;
