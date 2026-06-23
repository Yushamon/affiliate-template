export const products = {
  "ecoflow-stream-ultra": {
    name: "EcoFlow Stream Ultra",
    brand: "EcoFlow",
    category: "Balkonspeicher",
    capacity: "1,92 kWh",
    price: "Preis prüfen",
    rating: 4.7,
    image: "/images/generated/ecoflow-stream-ultra.webp",
    affiliateUrl: "#",
    highlights: [
      "modular erweiterbar",
      "App-Steuerung",
      "für Balkonkraftwerke geeignet"
    ]
  },

  "anker-solix-solarbank-2": {
    name: "Anker SOLIX Solarbank 2",
    brand: "Anker",
    category: "Balkonspeicher",
    capacity: "1,6 kWh",
    price: "Preis prüfen",
    rating: 4.6,
    image: "/images/generated/anker-solix-solarbank-2.webp",
    affiliateUrl: "#",
    highlights: [
      "kompakte Bauweise",
      "bekannter Hersteller",
      "gute App-Integration"
    ]
  },

  "zendure-solarflow": {
    name: "Zendure SolarFlow",
    brand: "Zendure",
    category: "Balkonspeicher",
    capacity: "variabel",
    price: "Preis prüfen",
    rating: 4.5,
    image: "/images/generated/zendure-solarflow.webp",
    affiliateUrl: "#",
    highlights: [
      "modulares System",
      "flexibel erweiterbar",
      "für verschiedene Setups geeignet"
    ]
  }
};

export type ProductKey = keyof typeof products;