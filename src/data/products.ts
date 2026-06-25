export const products = {
  "ecoflow-stream-ultra": {
  name: "EcoFlow STREAM Ultra",
  manufacturer: "ecoflow",
  manufacturerLabel: "EcoFlow",
  brand: "EcoFlow",
  category: "Balkonspeicher",
  capacity: "1,92 kWh",
  expandable: "ja",
  useCase: "Für Haushalte mit höherem Abendverbrauch",
  recommendation:
    "Starke Wahl für Nutzer, die ein modernes, erweiterbares System suchen.",
  productUrl: "/produkt/ecoflow-stream-ultra",
  affiliateUrl: "https://amzn.to/4uTY2mc",
  image: "/images/generated/ecoflow-stream-ultra.webp",
  rating: 4.7,
  badge: "Empfehlung",
  highlights: [
    "Modular erweiterbar",
    "App-Steuerung",
    "Gut für Balkonkraftwerke geeignet"
  ]
},

  "anker-solix-solarbank-3-pro": {
    name: "Anker SOLIX Solarbank 3 Pro",
    manufacturer: "anker",
    manufacturerLabel: "Anker",
    brand: "Anker",
    category: "Balkonspeicher",
    capacity: "modellabhängig",
    expandable: "ja",
    useCase: "Für Nutzer, die ein kompaktes Markensystem suchen",
    recommendation:
      "Interessant für Haushalte, die Wert auf einfache Bedienung und ein starkes Komplettsystem legen.",
    productUrl: "/produkt/anker-solix-solarbank-3-pro",
    affiliateUrl: "https://amzn.to/4agWvPU",
    image: "/images/generated/anker-solix-solarbank-3-pro.webp",
    rating: 4.6,
    badge: "Beliebt",
    highlights: [
      "Einfache Bedienung",
      "Gute App-Integration",
      "Bekannter Hersteller"
    ]
  },

  "zendure-solarflow": {
    name: "Zendure SolarFlow",
    manufacturer: "zendure",
    manufacturerLabel: "Zendure",
    brand: "Zendure",
    category: "Balkonspeicher",
    capacity: "variabel",
    expandable: "ja",
    useCase: "Für Nutzer, die ein flexibles Speichersystem möchten",
    recommendation:
      "Spannend für alle, die modular starten und später erweitern möchten.",
    productUrl: "/produkt/zendure-solarflow",
    affiliateUrl: "https://amzn.to/4eFQuxl",
    image: "/images/generated/zendure-solarflow.webp",
    rating: 4.5,
    badge: "Flexibel",
    highlights: [
      "Modulares System",
      "Flexibel erweiterbar",
      "Für verschiedene Setups geeignet"
    ]
  },

  "solakon-one": {
    name: "Solakon ONE",
    manufacturer: "solakon",
    manufacturerLabel: "Solakon",
    brand: "Solakon",
    category: "Balkonspeicher",
    capacity: "modellabhängig",
    expandable: "modellabhängig",
    useCase: "Für Einsteiger, die eine einfache Komplettlösung suchen",
    recommendation:
      "Interessant für Nutzer, die unkompliziert in Balkonkraftwerk und Speicher starten möchten.",
    productUrl: "/produkt/solakon-one",
    affiliateUrl: "https://amzn.to/4afCBVq",
    image: "/images/generated/solakon-one.webp",
    rating: 4.4,
    badge: "Einsteiger",
    highlights: [
      "Einsteigerfreundlich",
      "Komplettlösung",
      "Einfache Nutzung"
    ]
  }
};

export type ProductKey = keyof typeof products;