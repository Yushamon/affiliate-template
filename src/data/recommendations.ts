export const recommendations = {
  general: {
    recommendedProduct:
      "ecoflow-stream-ultra",

    comparisonProducts: [
      "ecoflow-stream-ultra",
      "anker-solix-solarbank-2",
      "zendure-solarflow"
    ]
  },

  budget: {
    recommendedProduct:
      "anker-solix-solarbank-2",

    comparisonProducts: [
      "anker-solix-solarbank-2",
      "ecoflow-stream-ultra"
    ]
  },

  flexible: {
    recommendedProduct:
      "zendure-solarflow",

    comparisonProducts: [
      "zendure-solarflow",
      "ecoflow-stream-ultra"
    ]
  }
};

export type RecommendationType =
  keyof typeof recommendations;