import { products, type ProductKey } from "./products";

export type ScoreCategoryKey =
  | "usability"
  | "expandability"
  | "app"
  | "installation"
  | "pricePerformance"
  | "support";

export type ProductScore = {
  label: string;
  weight: number;
  description: string;
};

export const scoreCategories: Record<ScoreCategoryKey, ProductScore> = {
  usability: {
    label: "Alltag & Bedienung",
    weight: 25,
    description:
      "Wie einfach lässt sich der Speicher im Alltag bedienen?"
  },

  expandability: {
    label: "Erweiterbarkeit",
    weight: 20,
    description:
      "Kann das System später sinnvoll erweitert werden?"
  },

  app: {
    label: "App & Software",
    weight: 15,
    description:
      "Wie gut lassen sich Energieflüsse, Ladezustand und Einstellungen steuern?"
  },

  installation: {
    label: "Installation",
    weight: 15,
    description:
      "Wie einfach ist Einrichtung oder Nachrüstung?"
  },

  pricePerformance: {
    label: "Preis-Leistung",
    weight: 15,
    description:
      "Wie gut passt der Gegenwert zum Preis?"
  },

  support: {
    label: "Garantie & Support",
    weight: 10,
    description:
      "Wie überzeugend sind Hersteller, Garantie und langfristige Betreuung?"
  }
};

export const productScores: Partial<Record<ProductKey, Record<ScoreCategoryKey, number>>> = {
  "ecoflow-stream-ultra": {
    usability: 92,
    expandability: 96,
    app: 95,
    installation: 90,
    pricePerformance: 82,
    support: 88
  },

  "anker-solix-solarbank-3-pro": {
    usability: 96,
    expandability: 88,
    app: 94,
    installation: 95,
    pricePerformance: 82,
    support: 90
  },

  "zendure-solarflow": {
    usability: 84,
    expandability: 95,
    app: 84,
    installation: 82,
    pricePerformance: 90,
    support: 84
  },

  "solakon-one": {
    usability: 88,
    expandability: 78,
    app: 80,
    installation: 90,
    pricePerformance: 86,
    support: 80
  }
};

export function getWeightedProductScore(productKey: ProductKey) {
  const rankingScore = products[productKey].ranking.overall;
  const scores = productScores[productKey];

  if (!scores) {
    return rankingScore;
  }

  const totalWeight = Object.values(scoreCategories).reduce(
    (sum, category) => sum + category.weight,
    0
  );

  const weightedScore = Object.entries(scores).reduce(
    (sum, [key, value]) => {
      const category = scoreCategories[key as ScoreCategoryKey];

      return sum + value * category.weight;
    },
    0
  );

  return rankingScore ?? Math.round(weightedScore / totalWeight);
}

export function getScoredProducts() {
  return Object.entries(products)
    .map(([key, product]) => {
      const productKey = key as ProductKey;

      return {
        key: productKey,
        product,
        score: getWeightedProductScore(productKey),
        scores: productScores[productKey]
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function getProductRank(productKey: ProductKey) {
  const index = getScoredProducts().findIndex(({ key }) => key === productKey);

  return index === -1 ? null : index + 1;
}

export function getBestScoredProductByUseCase(tag: string) {
  return getScoredProducts().find(({ product }) =>
    (product.useCases ?? product.recommendationTags).includes(tag)
  ) ?? null;
}

export function getScoreLabel(score: number) {
  if (score >= 90) {
    return "Sehr stark";
  }

  if (score >= 80) {
    return "Stark";
  }

  if (score >= 70) {
    return "Gut";
  }

  return "Solide";
}
