export const recommendations = {
  vergleich: {
    recommendedProduct:
      "ecoflow-stream-ultra",

    comparisonProducts: [
      "ecoflow-stream-ultra",
      "anker-solix-solarbank-3-pro",
      "zendure-solarflow"
    ],

    ctaTitle:
      "Die besten Balkonspeicher vergleichen",

    ctaText:
      "Vergleiche die aktuell beliebtesten Speicherlösungen für Balkonkraftwerke.",

    ctaUrl:
      "/beste-balkonspeicher"
  },

  kosten: {
    recommendedProduct:
      "ecoflow-stream-ultra",

    comparisonProducts: [
      "ecoflow-stream-ultra",
      "anker-solix-solarbank-3-pro"
    ],

    ctaTitle:
      "Kosten und Wirtschaftlichkeit vergleichen",

    ctaText:
      "Finde heraus, welche Speicherlösung zu deinem Budget passt.",

    ctaUrl:
      "/balkonspeicher-vergleich"
  },

  mieter: {
    recommendedProduct:
      "anker-solix-solarbank-3-pro",

    comparisonProducts: [
      "anker-solix-solarbank-3-pro",
      "ecoflow-stream-ultra"
    ],

    ctaTitle:
      "Geeignete Speicher für Mieter",

    ctaText:
      "Vergleiche flexible und leicht transportierbare Speichersysteme.",

    ctaUrl:
      "/beste-balkonspeicher"
  },

  nachruesten: {
    recommendedProduct:
      "ecoflow-stream-ultra",

    comparisonProducts: [
      "ecoflow-stream-ultra",
      "zendure-solarflow"
    ],

    ctaTitle:
      "Speicher nachrüsten",

    ctaText:
      "Vergleiche Systeme, die sich gut für bestehende Balkonkraftwerke eignen.",

    ctaUrl:
      "/balkonspeicher-vergleich"
  },

  groesse: {
    recommendedProduct:
      "ecoflow-stream-ultra",

    comparisonProducts: [
      "ecoflow-stream-ultra",
      "anker-solix-solarbank-3-pro",
      "zendure-solarflow"
    ],

    ctaTitle:
      "Passende Speichergröße finden",

    ctaText:
      "Vergleiche Speicherlösungen für unterschiedliche Haushaltsgrößen.",

    ctaUrl:
      "/beste-balkonspeicher"
  }
};

export type RecommendationType =
  keyof typeof recommendations;