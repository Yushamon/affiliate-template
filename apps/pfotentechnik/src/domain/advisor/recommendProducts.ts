import type { AdvisorAnswers, AdvisorCapability, AdvisorFact, AdvisorMatch, AdvisorPriority, AdvisorProduct } from "./types";

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

// Only the feeder module scores products in Phase A. No cross-category ranking.
export const recommendAdvisorProducts = (products: AdvisorProduct[], answers: AdvisorAnswers): AdvisorMatch[] =>
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
