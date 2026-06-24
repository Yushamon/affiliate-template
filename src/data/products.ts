export const products = {
  "ecoflow-stream-ultra": {
    name: "EcoFlow Stream Ultra",
    brand: "EcoFlow",
    category: "Balkonspeicher",
    capacity: "1,92 kWh",
    expandable: "ja",
    useCase: "Für Haushalte mit höherem Abendverbrauch",
    recommendation: "Starke Wahl für Nutzer, die ein modernes, erweiterbares System suchen.",
    priceLabel: "Preis prüfen",
    affiliateUrl: "#",
    image: "/images/generated/ecoflow-stream-ultra.webp",
    rating: 4.7,
    badge: "Empfehlung",
    highlights: [
      "Modular erweiterbar",
      "App-Steuerung",
      "Gut für Balkonkraftwerke geeignet"
    ],
    pros: [
      "hohe Flexibilität",
      "moderne Steuerung",
      "starke Markenbekanntheit"
    ],
    cons: [
      "Preis abhängig vom Set",
      "für kleine Haushalte eventuell überdimensioniert"
    ]
  },

  "anker-solix-solarbank-2": {
    name: "Anker SOLIX Solarbank 2",
    brand: "Anker",
    category: "Balkonspeicher",
    capacity: "1,6 kWh",
    expandable: "modellabhängig",
    useCase: "Für Nutzer, die ein kompaktes Markensystem suchen",
    recommendation: "Interessant für Haushalte, die Wert auf einfache Bedienung und bekannte Herstellerqualität legen.",
    priceLabel: "Preis prüfen",
    affiliateUrl: "#",
    image: "/images/generated/anker-solix-solarbank-2.webp",
    rating: 4.6,
    badge: "Beliebt",
    highlights: [
      "Kompakte Bauweise",
      "Gute App-Integration",
      "Bekannter Hersteller"
    ],
    pros: [
      "einfaches System",
      "gute Markenwahrnehmung",
      "kompakte Lösung"
    ],
    cons: [
      "Erweiterbarkeit prüfen",
      "nicht für jedes Setup optimal"
    ]
  },

  "zendure-solarflow": {
    name: "Zendure SolarFlow",
    brand: "Zendure",
    category: "Balkonspeicher",
    capacity: "variabel",
    expandable: "ja",
    useCase: "Für Nutzer, die ein flexibles Speichersystem möchten",
    recommendation: "Spannend für alle, die modular starten und später erweitern möchten.",
    priceLabel: "Preis prüfen",
    affiliateUrl: "#",
    image: "/images/generated/zendure-solarflow.webp",
    rating: 4.5,
    badge: "Flexibel",
    highlights: [
      "Modulares System",
      "Flexibel erweiterbar",
      "Für verschiedene Setups geeignet"
    ],
    pros: [
      "hohe Flexibilität",
      "modularer Aufbau",
      "gute Erweiterbarkeit"
    ],
    cons: [
      "Set-Konfiguration genau prüfen",
      "je nach Ausstattung unterschiedlich teuer"
    ]
  }
};

export type ProductKey = keyof typeof products;