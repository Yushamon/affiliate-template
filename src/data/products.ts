export const products = {
  "ecoflow-stream-ultra": {
    name: "EcoFlow STREAM Ultra",
    manufacturer: "ecoflow",
    manufacturerLabel: "EcoFlow",
    brand: "EcoFlow",
    category: "Balkonspeicher",

    capacity: "1,92 kWh",
    expandable: "ja",

    useCase:
      "Für Haushalte mit höherem Abendverbrauch und Nutzer, die ein modernes Komplettsystem suchen.",

    recommendation:
      "Eine der aktuell interessantesten Lösungen für Balkonkraftwerke. Besonders stark bei Erweiterbarkeit und App-Steuerung.",

    priceLabel: "Preis prüfen",

    affiliateUrl: "#",

    image:
      "/images/generated/ecoflow-stream-ultra.webp",

    rating: 4.8,

    badge: "Empfehlung",

    highlights: [
      "Modular erweiterbar",
      "Moderne App-Steuerung",
      "Speziell für Balkonkraftwerke geeignet"
    ]
  },

  "anker-solix-solarbank-3-pro": {
    name: "Anker SOLIX Solarbank 3 Pro",

    manufacturer: "anker",
    manufacturerLabel: "Anker",

    brand: "Anker",

    category: "Balkonspeicher",

    capacity: "variabel",

    expandable: "ja",

    useCase:
      "Für Nutzer, die ein modernes Komplettsystem mit hoher Flexibilität suchen.",

    recommendation:
      "Aktuelles Spitzenmodell von Anker. Besonders interessant für Nutzer, die langfristig planen.",

    priceLabel: "Preis prüfen",

    affiliateUrl: "#",

    image:
      "/images/generated/anker-solix-solarbank-3-pro.webp",

    rating: 4.9,

    badge: "Testsieger",

    highlights: [
      "Aktuelle Generation",
      "Hohe Flexibilität",
      "Starke App-Anbindung"
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

    useCase:
      "Für Nutzer, die modular starten und später erweitern möchten.",

    recommendation:
      "Sehr flexibel und deshalb besonders interessant für wechselnde Anforderungen.",

    priceLabel: "Preis prüfen",

    affiliateUrl: "#",

    image:
      "/images/generated/zendure-solarflow.webp",

    rating: 4.7,

    badge: "Flexibel",

    highlights: [
      "Modulares System",
      "Flexibel erweiterbar",
      "Große Systemauswahl"
    ]
  },

  "solakon-one": {
    name: "Solakon ONE",

    manufacturer: "solakon",
    manufacturerLabel: "Solakon",

    brand: "Solakon",

    category: "Balkonspeicher",

    capacity: "variabel",

    expandable: "ja",

    useCase:
      "Für Nutzer, die ein aktuelles Komplettsystem für Balkonkraftwerke suchen.",

    recommendation:
      "Spannende Alternative zu den etablierten Marktführern mit Fokus auf einfache Nutzung.",

    priceLabel: "Preis prüfen",

    affiliateUrl: "#",

    image:
      "/images/generated/solakon-one.webp",

    rating: 4.6,

    badge: "Newcomer",

    highlights: [
      "Moderne Plattform",
      "Einfache Einrichtung",
      "Für Balkonkraftwerke optimiert"
    ]
  }
};

export type ProductKey =
  keyof typeof products;