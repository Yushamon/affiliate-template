import type { CollectionEntry } from "astro:content";

type ProductEntry = CollectionEntry<"products">;

export type RecommendationScenario = {
  key: string;
  label: string;
  winnerSlug: string;
  alternativeSlug?: string;
  score: number;
  reason: string;
};

export type AutomaticRecommendationResult = {
  enabled: boolean;
  winnerSlug?: string;
  alternativeSlug?: string;
  title: string;
  text: string;
  scenarios: RecommendationScenario[];
};

type Input = {
  comparison: CollectionEntry<"comparisons">;
  products: ProductEntry[];
  itemSlugs: string[];
};

type ScenarioDefinition = {
  key: string;
  label: string;
  targetLiters?: number;
  minimumLiters?: number;
  petSize?: "small" | "medium" | "large";
  priority?: "value" | "smart" | "camera" | "battery" | "lightweight" | "no-subscription";
};

export function buildAutomaticRecommendations({
  comparison,
  products,
  itemSlugs
}: Input): AutomaticRecommendationResult {
  const data = comparison.data;
  const config = data.automaticRecommendations;
  const enabled = config?.enabled ?? false;

  if (!enabled) {
    return {
      enabled: false,
      winnerSlug: data.recommendation.winnerSlug,
      alternativeSlug: data.recommendation.alternativeSlug,
      title: data.recommendation.title,
      text: data.recommendation.text,
      scenarios: []
    };
  }

  const candidates = products.filter((product) =>
    itemSlugs.includes(product.data.slug)
  );

  if (candidates.length === 0) {
    return {
      enabled: true,
      winnerSlug: data.recommendation.winnerSlug,
      alternativeSlug: data.recommendation.alternativeSlug,
      title: data.recommendation.title,
      text: data.recommendation.text,
      scenarios: []
    };
  }

  const family = resolveFamily(data.group, candidates);
  const audience = resolveAudience(data.slug, candidates);
  const definitions = buildScenarioDefinitions(family, audience, config?.scenarios);

  const overall = rankProducts(candidates, {
    key: "overall",
    label: "Gesamtempfehlung"
  }, family, audience);

  const scenarios = definitions.flatMap((definition) => {
    const ranking = rankProducts(candidates, definition, family, audience);
    const winner = ranking[0];
    if (!winner) return [];

    return [{
      key: definition.key,
      label: definition.label,
      winnerSlug: winner.product.data.slug,
      alternativeSlug: ranking[1]?.product.data.slug,
      score: winner.score,
      reason: winner.reason
    }];
  });

  const winner = overall[0];
  const alternative = overall[1];

  return {
    enabled: true,
    winnerSlug: winner?.product.data.slug,
    alternativeSlug: alternative?.product.data.slug,
    title: winner
      ? `${winner.product.data.title} ist die stärkste Gesamtoption`
      : data.recommendation.title,
    text: winner
      ? `Die automatische Einordnung berücksichtigt Produktbewertung, dokumentierte Eignung und die für diesen Vergleich relevanten Szenarien. ${winner.reason}`
      : data.recommendation.text,
    scenarios
  };
}

function resolveFamily(group: string, products: ProductEntry[]) {
  const normalized = normalize(group);
  const categories = new Set(products.map((product) => product.data.category.key));

  if (/trinkbrunnen|waterfountain/.test(normalized)) return "water-fountain";
  if (/gps|tracker/.test(normalized) || categories.has("gps-tracker")) return "gps-tracker";
  if (/futterautomat|feeder/.test(normalized)) return "feeder";
  return "generic";
}

function resolveAudience(slug: string, products: ProductEntry[]) {
  const normalized = normalize(slug);
  if (/katze|katzen/.test(normalized)) return "cat";
  if (/hund|hunde/.test(normalized)) return "dog";

  const animals = products.flatMap(
    (product) => product.data.comparisonFilters?.animal ?? []
  );
  if (animals.length && animals.every((animal) => animal === "cat")) return "cat";
  if (animals.length && animals.every((animal) => animal === "dog")) return "dog";
  return "mixed";
}

function buildScenarioDefinitions(
  family: string,
  audience: string,
  configured?: Array<{ key: string; label: string }>
): ScenarioDefinition[] {
  if (configured?.length) return configured;

  if (family === "water-fountain" && audience === "dog") {
    return [
      { key: "small-dog", label: "Kleine Hunde", targetLiters: 2.5, minimumLiters: 1.5, petSize: "small" },
      { key: "medium-dog", label: "Mittelgroße Hunde", targetLiters: 3.5, minimumLiters: 2.5, petSize: "medium" },
      { key: "large-dog", label: "Große Hunde", targetLiters: 5.5, minimumLiters: 4, petSize: "large" },
      { key: "multi-dog", label: "Mehrhundehaushalte", targetLiters: 7, minimumLiters: 5 }
    ];
  }

  if (family === "water-fountain") {
    return [
      { key: "single-cat", label: "Eine Katze", targetLiters: 2.2, minimumLiters: 1.5 },
      { key: "multi-cat", label: "Mehrkatzenhaushalte", targetLiters: 3.5, minimumLiters: 2.5 },
      { key: "easy-cleaning", label: "Einfache Reinigung" }
    ];
  }

  if (family === "gps-tracker") {
    return [
      { key: "lightweight", label: "Leichte Tiere", priority: "lightweight" },
      { key: "battery", label: "Lange Akkulaufzeit", priority: "battery" },
      { key: "no-subscription", label: "Ohne laufendes Mobilfunkabo", priority: "no-subscription" }
    ];
  }

  if (family === "feeder") {
    return [
      { key: "value", label: "Preis-Leistung", priority: "value" },
      { key: "smart", label: "App und smarte Funktionen", priority: "smart" },
      { key: "camera", label: "Kamera und Kontrolle", priority: "camera" }
    ];
  }

  return [
    { key: "value", label: "Preis-Leistung", priority: "value" },
    { key: "premium", label: "Premium-Empfehlung" }
  ];
}

function rankProducts(
  products: ProductEntry[],
  scenario: ScenarioDefinition,
  family: string,
  audience: string
) {
  return products
    .map((product) => scoreProduct(product, scenario, family, audience))
    .sort((a, b) =>
      b.score - a.score ||
      b.baseScore - a.baseScore ||
      a.product.data.title.localeCompare(b.product.data.title, "de")
    );
}

function scoreProduct(
  product: ProductEntry,
  scenario: ScenarioDefinition,
  family: string,
  audience: string
) {
  const data = product.data;
  const baseScore = Number(data.score ?? Math.round(data.rating * 20));
  const evidence = collectEvidence(product);
  let score = baseScore;

  const animals = data.comparisonFilters?.animal ?? [];
  if (audience === "dog") {
    if (animals.includes("dog")) score += 10;
    if (animals.length && !animals.includes("dog")) score -= 45;
  }
  if (audience === "cat") {
    if (animals.includes("cat")) score += 10;
    if (animals.length && !animals.includes("cat")) score -= 45;
  }

  if (scenario.petSize) {
    const sizes = data.comparisonFilters?.petSize ?? [];
    if (sizes.includes(scenario.petSize)) score += 18;
    if (sizes.length && !sizes.includes(scenario.petSize)) score -= 28;
  }

  if (family === "water-fountain") {
    const liters = extractCapacityLiters(product);
    if (Number.isFinite(liters) && scenario.targetLiters) {
      score += Math.max(0, 24 - Math.abs(liters - scenario.targetLiters) * 7);
    }
    if (Number.isFinite(liters) && scenario.minimumLiters && liters < scenario.minimumLiters) {
      score -= 40;
    }
    if (scenario.key === "large-dog" && Number.isFinite(liters)) {
      if (liters < 4) score -= 35;
      if (liters >= 5) score += 25;
    }
    if (scenario.key === "multi-dog" && Number.isFinite(liters)) {
      if (liters < 5) score -= 30;
      if (liters >= 6) score += 25;
    }
    if (/edelstahl|stainless/.test(evidence)) score += 5;
    if (/standfest|rutschfest|breite trinkflaeche/.test(evidence)) score += 6;
    if (/spuelmaschine|leicht zu reinigen|zerlegbar/.test(evidence)) score += 6;
  }

  if (scenario.priority === "camera") {
    score += data.comparisonFilters?.camera ? 25 : -20;
  }
  if (scenario.priority === "smart") {
    score += data.comparisonFilters?.app ? 20 : -12;
  }
  if (scenario.priority === "value") {
    if (data.priceCategory === "budget") score += 18;
    if (data.priceCategory === "midrange") score += 10;
    if (data.priceCategory === "premium") score -= 5;
  }
  if (scenario.priority === "battery") {
    score += Math.min(Number(data.gps?.batteryMaxDays ?? 0) * 2, 30);
  }
  if (scenario.priority === "lightweight") {
    const grams = data.gps?.deviceWeightGrams ?? data.gps?.totalWeightGrams;
    if (typeof grams === "number") score += Math.max(0, 35 - grams);
  }
  if (scenario.priority === "no-subscription") {
    score += data.gps?.subscriptionRequired === false ? 30 : -25;
  }

  const reason = buildReason(product, scenario, family);

  return {
    product,
    baseScore,
    score: Math.round(score * 10) / 10,
    reason
  };
}

function buildReason(
  product: ProductEntry,
  scenario: ScenarioDefinition,
  family: string
) {
  if (family === "water-fountain") {
    const liters = extractCapacityLiters(product);
    if (Number.isFinite(liters)) {
      return `${formatNumber(liters)} Liter dokumentierte Kapazität und der beste Szenario-Score für „${scenario.label}“.`;
    }
  }

  return `Bester gewichteter Score für „${scenario.label}“ auf Basis der gepflegten Produktdaten.`;
}

function extractCapacityLiters(product: ProductEntry) {
  const text = [
    product.data.capacity,
    ...product.data.specs
      .filter((spec) => /kapazitaet|kapazität|volumen|fassungsvermoegen|fassungsvermögen/i.test(spec.label))
      .map((spec) => String(spec.value))
  ].filter(Boolean).join(" ");

  const liters = text.match(/(\d+(?:[.,]\d+)?)\s*l(?:iter)?\b/i);
  if (liters) return Number.parseFloat(liters[1].replace(",", "."));

  const ml = text.match(/(\d+(?:[.,]\d+)?)\s*ml\b/i);
  if (ml) return Number.parseFloat(ml[1].replace(",", ".")) / 1000;

  return Number.NaN;
}

function collectEvidence(product: ProductEntry) {
  const data = product.data;
  return normalize([
    data.title,
    data.recommendation,
    data.useCase ?? "",
    data.capacity ?? "",
    ...data.features,
    ...data.strengths,
    ...data.weaknesses,
    ...data.decision.bestFor,
    ...data.decision.attention,
    ...data.specs.map((spec) => `${spec.label}: ${String(spec.value)}`)
  ].join(" "));
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase("de")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 1
  }).format(value);
}
