export const products = {
  "ecoflow-stream-ultra": {
    name: "EcoFlow Stream Ultra",
    brand: "EcoFlow",
    capacity: "1,92 kWh",
    priceLabel: "Preis prüfen",
    affiliateUrl: "#",
    rating: 4.7,
    highlights: [
      "Modular erweiterbar",
      "App-Steuerung",
      "Ideal für Balkonkraftwerke"
    ]
  },

  "anker-solix-solarbank-2": {
    name: "Anker SOLIX Solarbank 2",
    brand: "Anker",
    capacity: "1,6 kWh",
    priceLabel: "Preis prüfen",
    affiliateUrl: "#",
    rating: 4.6,
    highlights: [
      "Kompakte Bauweise",
      "Starke App",
      "Bekannter Hersteller"
    ]
  }
};

export type ProductKey = keyof typeof products;