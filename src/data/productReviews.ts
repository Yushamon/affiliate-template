import type { ProductKey } from "./products";

export const productReviews: Record<ProductKey, {
  summary: string;
  verdict: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
  notFor: string[];
  ratings: {
    installation: number;
    app: number;
    flexibility: number;
    pricePerformance: number;
    expandability: number;
  };
}> = {
  "ecoflow-stream-ultra": {
    summary:
      "Eine der stärksten Komplettlösungen für Balkonkraftwerke mit sehr guter App, hoher Erweiterbarkeit und starkem Energie-Ökosystem.",
    verdict:
      "Die EcoFlow STREAM Ultra eignet sich besonders für Haushalte, die langfristig planen und ihr Balkonkraftwerk später erweitern möchten.",
    pros: [
      "Sehr gute App-Steuerung",
      "Starkes Energie-Ökosystem",
      "Modular erweiterbar",
      "Für Balkonkraftwerke optimiert",
      "Interessant für größere Haushalte"
    ],
    cons: [
      "Höherer Anschaffungspreis",
      "Nicht jede Funktion wird von jedem Haushalt benötigt"
    ],
    bestFor: [
      "Familien",
      "Homeoffice",
      "800-Watt-Balkonkraftwerke",
      "Langfristige Ausbaupläne"
    ],
    notFor: [
      "Sehr kleine Haushalte",
      "Sehr geringes Budget",
      "Haushalte ohne regelmäßige Solarüberschüsse"
    ],
    ratings: {
      installation: 5,
      app: 5,
      flexibility: 5,
      pricePerformance: 4,
      expandability: 5
    }
  },

  "anker-solix-solarbank-3-pro": {
    summary:
      "Eine besonders benutzerfreundliche Lösung für alle, die ein einfaches Komplettsystem mit guter App suchen.",
    verdict:
      "Die Anker SOLIX Solarbank 3 Pro ist ideal für Einsteiger und komfortorientierte Nutzer, die möglichst wenig Aufwand möchten.",
    pros: [
      "Sehr einfache Bedienung",
      "Intuitive App",
      "Schnelle Installation",
      "Hohe Alltagstauglichkeit",
      "Bekannter Hersteller"
    ],
    cons: [
      "Etwas weniger flexibel als sehr modulare Systeme",
      "Höherer Einstiegspreis"
    ],
    bestFor: [
      "Einsteiger",
      "Paare",
      "Familien",
      "Komfortorientierte Nutzer"
    ],
    notFor: [
      "Technikbastler",
      "Sehr individuelle Speicherkonzepte"
    ],
    ratings: {
      installation: 5,
      app: 5,
      flexibility: 4,
      pricePerformance: 4,
      expandability: 4
    }
  },

  "zendure-solarflow": {
    summary:
      "Eine sehr flexible Lösung für Nutzer, die ihr Balkonkraftwerk modular erweitern oder nachrüsten möchten.",
    verdict:
      "Zendure SolarFlow überzeugt besonders bei Nachrüstung, Modularität und langfristiger Erweiterbarkeit.",
    pros: [
      "Sehr modular",
      "Hohe Erweiterbarkeit",
      "Ideal für Nachrüstung",
      "Flexible Speichergrößen",
      "Gutes Preis-Leistungs-Verhältnis"
    ],
    cons: [
      "Etwas komplexere Planung",
      "Nicht ganz so intuitiv wie Anker"
    ],
    bestFor: [
      "Nachrüstung",
      "Technikinteressierte",
      "Modulare Erweiterungen",
      "Langfristige Planung"
    ],
    notFor: [
      "Nutzer mit Wunsch nach maximaler Einfachheit"
    ],
    ratings: {
      installation: 4,
      app: 4,
      flexibility: 5,
      pricePerformance: 5,
      expandability: 5
    }
  },

  "solakon-one": {
    summary:
      "Eine einfache Einstiegslösung für kleinere Haushalte, Mieter und Nutzer, die unkompliziert starten möchten.",
    verdict:
      "Solakon ONE eignet sich besonders für Einsteiger, die eine verständliche Komplettlösung ohne viel Komplexität suchen.",
    pros: [
      "Einsteigerfreundlich",
      "Einfache Komplettlösung",
      "Übersichtliche Bedienung",
      "Für Balkonkraftwerke optimiert"
    ],
    cons: [
      "Weniger flexibel als EcoFlow oder Zendure",
      "Kleinere Produktauswahl"
    ],
    bestFor: [
      "Singles",
      "Mieter",
      "Einsteiger",
      "Kleine Haushalte"
    ],
    notFor: [
      "Große Haushalte",
      "Sehr hohe Stromverbräuche",
      "Maximale Erweiterbarkeit"
    ],
    ratings: {
      installation: 5,
      app: 4,
      flexibility: 3,
      pricePerformance: 4,
      expandability: 3
    }
  }
};