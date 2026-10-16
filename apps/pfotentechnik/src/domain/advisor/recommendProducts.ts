import type { AdvisorAnswers, AdvisorCapability, AdvisorFact, AdvisorMatch, AdvisorPriority, AdvisorProduct, AdvisorSession, AdvisorDecisionMatch, AdvisorRequirement } from "./types";

export const matchesFact = <T>(fact: AdvisorFact<T[]>, value: T): AdvisorCapability =>
  fact.status === "known" ? (fact.value.includes(value) ? "supported" : "unavailable") : fact.status;

export const priorityMatch = (product: AdvisorProduct, priority: AdvisorPriority): AdvisorCapability => {
  const facts = product.common;
  switch (priority) {
    case "camera": return facts.camera;
    case "app": return facts.app;
    case "offline": return facts.offlineSchedule;
    case "backup": return facts.backupPower;
    case "microchip": return facts.accessControl.status === "known"
      ? facts.accessControl.value === "microchip" ? "supported" : "unavailable"
      : facts.accessControl.status;
    case "simple": return facts.app === "unavailable" && facts.camera === "unavailable" ? "supported"
      : facts.app === "supported" || facts.camera === "supported" ? "unavailable" : "unknown";
  }
};

const labels: Record<AdvisorPriority, string> = {
  camera: "Kamera", app: "App-Steuerung", offline: "Zeitplan ohne Internet",
  backup: "Notstrom", microchip: "Mikrochip-Zugang", simple: "Betrieb ohne App und Kamera"
};

// Legacy feeder behavior remains compatible; B1 sessions use the same entry point.
const recommendFeederProducts = (products: AdvisorProduct[], answers: AdvisorAnswers): AdvisorMatch[] =>
  products.map((product): AdvisorMatch => {
    let score = 28;
    let uncertain = false;
    const reasons: string[] = [], cautions: string[] = [], exclusions: string[] = [];
    const matchedPriorities: AdvisorPriority[] = [];
    const assess = (state: AdvisorCapability, label: string, weight: number, hard = false) => {
      if (state === "supported") { score += weight; reasons.push(`${label}: dokumentiert`); }
      else if (state === "unavailable") {
        if (hard) exclusions.push(`${label}: nicht unterstützt`);
        else { score -= 5; cautions.push(`${label}: nicht unterstützt`); }
      } else {
        uncertain = true;
        cautions.push(`${label}: ${state === "partial" ? "nur teilweise unterstützt" : state === "notApplicable" ? "nicht anwendbar" : "nicht ausreichend dokumentiert"}`);
      }
    };
    if (!["futterautomat", "futterautomaten"].includes(product.category)) exclusions.push("Kein Futterautomat");
    assess(matchesFact(product.common.animals, answers.pet), answers.pet === "cat" ? "Eignung für Katzen" : "Eignung für Hunde", 10, true);
    const food = product.common.foodTypes;
    if (answers.food === "mixed") {
      const state = food.status === "known"
        ? food.value.includes("dry") && food.value.includes("wet") ? "supported" : "partial"
        : food.status;
      assess(state, "Nass- und Trockenfutter", 25);
    } else assess(matchesFact(food, answers.food), answers.food === "dry" ? "Trockenfutter" : "Nassfutter", 25, true);
    if (answers.petCount === "multiple") {
      assess(product.common.multiPet.individualAccess, "Individueller Zugang für mehrere Tiere", 18);
    }
    for (const priority of answers.priorities) {
      const state = priorityMatch(product, priority);
      if (state === "supported") matchedPriorities.push(priority);
      assess(state, labels[priority], priority === "microchip" ? 17 : 11, priority === "microchip");
    }
    if (answers.budget !== "open" && product.priceCategory === answers.budget) {
      score += 10; reasons.push("passt zur gewählten Preisklasse");
    } else if (answers.budget !== "open" && product.priceCategory) {
      score -= 3; cautions.push("liegt außerhalb der bevorzugten Preisklasse");
    } else if (answers.budget !== "open") cautions.push("Preisklasse nicht eingeordnet");
    // Match score is separate from the unchanged editorial product score.
    score += Math.round(product.rating * 2) + Math.round((product.score ?? product.rating * 20) / 25);
    score = Math.max(0, Math.min(100, score));
    return { product, score,
      fit: exclusions.length ? "none" : uncertain ? "limited" : score >= 78 ? "excellent" : score >= 60 ? "good" : "limited",
      reasons: [...new Set(reasons)], cautions: [...new Set(cautions)], exclusions, matchedPriorities };
  }).sort((left, right) => {
    if (left.exclusions.length !== right.exclusions.length) return left.exclusions.length - right.exclusions.length;
    if (answers.decisionStyle === "safe-choice" && left.cautions.length !== right.cautions.length) return left.cautions.length - right.cautions.length;
    return right.score - left.score;
  });


const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2 : undefined;
};
// Numeric preferences compare documented values with the median of eligible models.
// Missing values never count as matches. These relative thresholds are not safety limits.
const requirementState = (product: AdvisorProduct, r: AdvisorRequirement, pool: AdvisorProduct[]): 'pass' | 'unknown' | 'unsupported' => {
  const fact = product.decisionFacts?.[r.field];
  if (fact?.status !== 'known') return 'unknown';
  const value = fact.value;
  let passes = false;
  if (r.operator === 'includes') passes = Array.isArray(value) && value.includes(String(r.desired));
  else if (r.operator === 'minimum') passes = typeof value === 'number' && typeof r.desired === 'number' && r.desired >= value;
  else if (r.operator === 'higher' || r.operator === 'lower') {
    const values = pool.flatMap(p => {
      const f = p.decisionFacts?.[r.field];
      return f?.status === 'known' && typeof f.value === 'number' ? [f.value] : [];
    });
    const threshold = median(values);
    if (threshold == null || typeof value !== 'number') return 'unknown';
    passes = r.operator === 'higher' ? value >= threshold : value <= threshold;
  } else passes = value === r.desired;
  return passes ? 'pass' : 'unsupported';
};
const recommendDecisionProducts = (products: AdvisorProduct[], session: AdvisorSession): AdvisorDecisionMatch[] => {
  const category = session.category === 'gps' ? 'gps-tracker' : 'trinkbrunnen';
  const selected = products.filter(p => p.category === category);
  const eligible = selected.filter(p => session.requirements.every(r => requirementState(p, r, selected) !== 'unsupported'));
  return selected.map((product): AdvisorDecisionMatch => {
    const match: AdvisorDecisionMatch = { product, status: 'pass', reasons: [], cautions: [...(product.decisionCautions ?? [])], exclusions: [], preferenceMatches: [], unknowns: [], unresolvedRequirements: [], failedRequirements: [] };
    for (const r of [...session.requirements, ...session.preferences]) {
      const state = requirementState(product, r, eligible);
      if (state === 'pass') {
        match.reasons.push(r.label + (r.operator === 'higher' || r.operator === 'lower' ? ': im Vergleich zur Mitte der dokumentierten passenden Modelle' : ''));
        if (r.importance === 'preference') match.preferenceMatches.push(r.field);
      } else if (state === 'unknown') {
        match.unknowns.push(`${r.label}: nicht eindeutig dokumentiert${r.importance === 'hard' ? ' — vor dem Kauf klären' : ' (Präferenz)'}.`);
        if (r.importance === 'hard') match.unresolvedRequirements.push(r);
      } else if (r.importance === 'hard') {
        match.exclusions.push(`${r.label}: dokumentierte Eigenschaft widerspricht deiner Auswahl.`);
        match.failedRequirements.push(r);
      } else match.cautions.push(`${r.label}: erfüllt diese Präferenz nicht.`);
    }
    const facts = product.decisionFacts;
    for (const [key, unit] of [['deviceWeight', 'g Gerätegewicht'], ['capacity', 'Liter Wasserreserve']] as const) {
      const f = facts?.[key];
      if (f?.status === 'known') match.reasons.push(`${f.value} ${unit} dokumentiert`);
    }
    const material = facts?.material;
    if (material?.status === 'known' && Array.isArray(material.value)) match.reasons.push(`Dokumentiertes Material: ${material.value.join('; ')}`);
    const cordless = facts?.cordless;
    if (cordless?.status === 'known' && cordless.value === true && !match.reasons.includes('Betrieb ohne Steckdose')) match.reasons.push('Akku-/kabelloser Betrieb dokumentiert');
    const dishwasher = facts?.dishwasher;
    if (dishwasher?.status === 'known' && dishwasher.value === true && !session.answers.priorities.includes('cleaning')) match.reasons.push('Spülmaschinengeeignete Teile dokumentiert');
    match.preferenceMatches = [...new Set(match.preferenceMatches)];
    match.reasons = [...new Set(match.reasons)];
    match.status = match.failedRequirements.length ? 'unsupported' : match.unresolvedRequirements.length ? 'possible' : 'pass';
    return match;
  }).sort((a, b) => {
    const order = { pass: 0, possible: 1, unsupported: 2 };
    return order[a.status] - order[b.status]
      || b.preferenceMatches.length - a.preferenceMatches.length
      || Number(b.product.recommendationStatus === 'recommended') - Number(a.product.recommendationStatus === 'recommended')
      || (b.product.score ?? 0) - (a.product.score ?? 0)
      || a.product.slug.localeCompare(b.product.slug);
  });
};
export function recommendAdvisorProducts(products: AdvisorProduct[], answers: AdvisorAnswers): AdvisorMatch[];
export function recommendAdvisorProducts(products: AdvisorProduct[], session: AdvisorSession): AdvisorDecisionMatch[];
export function recommendAdvisorProducts(products: AdvisorProduct[], input: AdvisorAnswers | AdvisorSession): AdvisorMatch[] | AdvisorDecisionMatch[] {
  return 'requirements' in input ? recommendDecisionProducts(products, input) : recommendFeederProducts(products, input);
}
export const decisionResultState = (matches: AdvisorDecisionMatch[]) => {
  const visible = matches.filter(m => m.status !== 'unsupported');
  const hasPass = visible.some(m => m.status === 'pass');
  const blocked = visible.length ? visible.flatMap(m => m.unresolvedRequirements) : matches.flatMap(m => m.failedRequirements);
  return {
    visible,
    message: hasPass ? '' : visible.length
      ? 'Kein Modell erfüllt alle Anforderungen anhand der dokumentierten Daten eindeutig.'
      : 'Deine Kombination ist aktuell sehr eng.',
    constraints: [...new Map(blocked.map(r => [r.field, r])).values()]
  };
};
