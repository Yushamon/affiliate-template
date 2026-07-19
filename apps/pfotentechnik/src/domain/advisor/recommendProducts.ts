import type {
  AdvisorAnswers,
  AdvisorMatch,
  AdvisorPriority,
  AdvisorProduct
} from "./types";

const searchableText = (product: AdvisorProduct) =>
  [
    product.title,
    product.description,
    product.recommendation,
    product.useCase,
    ...product.bestFor,
    ...product.attention,
    ...product.strengths,
    ...product.weaknesses,
    ...product.features
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("de-DE");

const hasAny = (product: AdvisorProduct, terms: string[]) => {
  const haystack = searchableText(product);
  return terms.some((term) =>
    haystack.includes(term.toLocaleLowerCase("de-DE"))
  );
};

const priorityLabels: Record<AdvisorPriority, string> = {
  camera: "Kamera",
  app: "App-Steuerung",
  offline: "Offline-Betrieb",
  backup: "Notstrom",
  microchip: "Mikrochip-Zugang",
  simple: "einfache Bedienung"
};

const priorityMatch = (
  product: AdvisorProduct,
  priority: AdvisorPriority
) => {
  switch (priority) {
    case "camera":
      return product.camera === true || hasAny(product, ["kamera"]);
    case "app":
      return product.app === true || hasAny(product, ["app"]);
    case "offline":
      return hasAny(product, [
        "offline",
        "ohne wlan",
        "ohne internet",
        "lokaler zeitplan",
        "zeitplan ohne internet"
      ]);
    case "backup":
      return (
        product.backupPower === true ||
        hasAny(product, ["notstrom", "batterie", "backup"])
      );
    case "microchip":
      return (
        product.access === "microchip" ||
        hasAny(product, ["mikrochip"])
      );
    case "simple":
      return (
        product.app !== true &&
        product.camera !== true &&
        hasAny(product, [
          "einfach",
          "ohne app",
          "manuell",
          "übersichtlich"
        ])
      );
  }
};

const animalMatch = (
  product: AdvisorProduct,
  pet: AdvisorAnswers["pet"]
) =>
  pet === "cat"
    ? hasAny(product, ["katze", "katzen", "mehrkatzen"])
    : hasAny(product, ["hund", "hunde"]);

export const recommendAdvisorProducts = (
  products: AdvisorProduct[],
  answers: AdvisorAnswers
): AdvisorMatch[] => {
  return products
    .map((product) => {
      let score = 28;
      const reasons: string[] = [];
      const cautions: string[] = [];
      const exclusions: string[] = [];
      const matchedPriorities: AdvisorPriority[] = [];

      const supportsDry = product.foodType.includes("dry");
      const supportsWet = product.foodType.includes("wet");

      if (answers.food === "dry") {
        if (supportsDry) {
          score += 25;
          reasons.push("für Trockenfutter geeignet");
        } else {
          exclusions.push("nicht für Trockenfutter ausgewiesen");
        }
      }

      if (answers.food === "wet") {
        if (supportsWet) {
          score += 25;
          reasons.push("für Nassfutter geeignet");
        } else {
          exclusions.push("nicht für Nassfutter ausgewiesen");
        }
      }

      if (answers.food === "mixed") {
        if (supportsDry && supportsWet) {
          score += 25;
          reasons.push("für Nass- und Trockenfutter geeignet");
        } else if (supportsDry || supportsWet) {
          score -= 8;
          cautions.push(
            "deckt nur eine der gewünschten Futterarten ab"
          );
        } else {
          exclusions.push(
            "keine passende Futterart dokumentiert"
          );
        }
      }

      if (animalMatch(product, answers.pet)) {
        score += 10;
        reasons.push(
          answers.pet === "cat"
            ? "für Katzen eingeordnet"
            : "für Hunde eingeordnet"
        );
      }

      if (answers.petCount === "multiple") {
        const multiPetSuitable =
          product.access === "microchip" ||
          hasAny(product, [
            "mehrtier",
            "mehrkatzen",
            "mehrere tiere",
            "futterneid",
            "mikrochip"
          ]);

        if (multiPetSuitable) {
          score += 18;
          reasons.push(
            "für mehrere Tiere besonders relevant"
          );
        } else {
          score -= 8;
          cautions.push(
            "keine eindeutige Zugangskontrolle für mehrere Tiere"
          );
        }
      }

      for (const priority of answers.priorities) {
        if (priorityMatch(product, priority)) {
          matchedPriorities.push(priority);
          score += priority === "microchip" ? 17 : 11;
          reasons.push(`${priorityLabels[priority]} vorhanden`);
        } else if (priority === "microchip") {
          exclusions.push(
            "keine Mikrochip-Zugangskontrolle"
          );
        } else {
          score -= 5;
          cautions.push(
            `${priorityLabels[priority]} nicht eindeutig dokumentiert`
          );
        }
      }

      if (
        answers.budget !== "open" &&
        product.priceCategory === answers.budget
      ) {
        score += 10;
        reasons.push("passt zur gewählten Preisklasse");
      } else if (
        answers.budget !== "open" &&
        product.priceCategory
      ) {
        score -= 3;
        cautions.push(
          "liegt außerhalb der bevorzugten Preisklasse"
        );
      }

      score += Math.round(product.rating * 2);
      score += Math.round(
        (product.score ?? product.rating * 20) / 25
      );

      score = Math.max(0, Math.min(100, score));

      const fit =
        exclusions.length > 0
          ? "none"
          : score >= 78
            ? "excellent"
            : score >= 60
              ? "good"
              : score >= 38
                ? "limited"
                : "none";

      return {
        product,
        score,
        fit,
        reasons: [...new Set(reasons)].slice(0, 5),
        cautions: [...new Set(cautions)].slice(0, 4),
        exclusions: [...new Set(exclusions)],
        matchedPriorities
      };
    })
    .sort((left, right) => {
      if (
        left.exclusions.length !== right.exclusions.length
      ) {
        return (
          left.exclusions.length -
          right.exclusions.length
        );
      }

      if (
        answers.decisionStyle === "safe-choice" &&
        left.cautions.length !== right.cautions.length
      ) {
        return left.cautions.length - right.cautions.length;
      }

      return right.score - left.score;
    });
};
