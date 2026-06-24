export const products = {
  "ecoflow-stream-ultra": {
    name: "EcoFlow Stream Ultra",
    manufacturer: "ecoflow",
    manufacturerLabel: "EcoFlow",
    brand: "EcoFlow",
    category: "Balkonspeicher",
    capacity: "1,92 kWh",
    expandable: "ja",
    useCase: "Für Haushalte mit höherem Abendverbrauch",
    recommendation:
      "Starke Wahl für Nutzer, die ein modernes, erweiterbares System suchen.",
    priceLabel: "Preis prüfen",
    affiliateUrl: "#",
    image: "/images/generated/ecoflow-stream-ultra.webp",
    rating: 4.7,
    badge: "Empfehlung",
    highlights: [
      "Modular erweiterbar",
      "App-Steuerung",
      "Gut für Balkonkraftwerke geeignet"
    ]
  },

  "anker-solix-solarbank-2": {
    name: "Anker SOLIX Solarbank 2",
    manufacturer: "anker",
    manufacturerLabel: "Anker",
    brand: "Anker",
    category: "Balkonspeicher",
    capacity: "1,6 kWh",
    expandable: "modellabhängig",
    useCase: "Für Nutzer, die ein kompaktes Markensystem suchen",
    recommendation:
      "Interessant für Haushalte, die Wert auf einfache Bedienung legen.",
    priceLabel: "Preis prüfen",
    affiliateUrl: "#",
    image: "/images/generated/anker-solix-solarbank-2.webp",
    rating: 4.6,
    badge: "Beliebt",
    highlights: [
      "Kompakte Bauweise",
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
    priceLabel: "Preis prüfen",
    affiliateUrl: "#",
    image: "/images/generated/zendure-solarflow.webp",
    rating: 4.5,
    badge: "Flexibel",
    highlights: [
      "Modulares System",
      "Flexibel erweiterbar",
      "Für verschiedene Setups geeignet"
    ]
  }
};

export type ProductKey = keyof typeof products;