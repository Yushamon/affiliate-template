import { getComparisonSelectionRule } from "../comparison/comparisonSelectionRegistry.ts";

export type CategoryComparisonRoute = {
  slug: string;
  question: string;
  why: string;
  showInCategoryChapter?: boolean;
};

export type CategoryDecisionRoutingEntry = {
  categoryLabel: string;
  categoryHref: string;
  selectionCategory: string;
  primaryComparison: CategoryComparisonRoute & {
    title: string;
    text: string;
    cta: string;
  };
  secondaryComparisons: CategoryComparisonRoute[];
  overview: {
    rank: number;
    tier: "primary" | "additional" | "specialist";
    rationale: string;
  };
};

export const categoryDecisionRouting = {
  "smarte-futterautomaten": {
    categoryLabel: "Futterautomaten",
    categoryHref: "/smarte-futterautomaten/",
    selectionCategory: "futterautomaten",
    primaryComparison: {
      slug: "beste-futterautomaten-fuer-katzen",
      title: "Futterautomaten vergleichen",
      text: "Finde heraus, welche Bauart zu Futterart, Tierzahl, Portionierung und deinem Alltag passt.",
      cta: "Zum Futterautomaten-Vergleich",
      question: "Welcher Automat passt zur Katze und ihrer Futterart?",
      why: "Trennt Trockenfutter-Allrounder, Nassfutter-Fächer und Zugangssysteme."
    },
    secondaryComparisons: [
      { slug: "beste-futterautomaten-fuer-hunde", question: "Welche Bauart passt zu Größe und Ration des Hundes?", why: "Ordnet Kapazität, Napfhöhe und Portionsgrenzen nach Einsatz ein." },
      { slug: "beste-futterautomaten-fuer-nassfutter", question: "Wie bleiben vorbereitete Nassfutterportionen geschützt?", why: "Vergleicht Fachzahl, Kühlprinzip, Standzeit und Reinigung." },
      { slug: "beste-futterautomaten-fuer-zwei-katzen", question: "Verteilen oder Tiere wirklich trennen?", why: "Macht den Unterschied zwischen Doppelschale und Zugangskontrolle sichtbar." },
      { slug: "beste-futterautomaten-ohne-wlan", question: "Welche Automaten behalten ihre Kernfunktion ohne Cloud?", why: "Trennt lokale Zeitpläne, Stromreserve und optionale App-Funktionen.", showInCategoryChapter: false },
      { slug: "beste-futterautomaten-mit-kamera", question: "Wann hilft eine Kamera bei der Fütterung wirklich?", why: "Ordnet Sichtkontrolle, Cloud-Abhängigkeit und Grenzen der Fressmengenbeobachtung ein.", showInCategoryChapter: false }
    ],
    overview: {
      rank: 1,
      tier: "primary",
      rationale: "Breiteste Produkt- und Vergleichsabdeckung; direkter kommerzieller GSC-Owner vorhanden."
    }
  },
  trinkbrunnen: {
    categoryLabel: "Trinkbrunnen",
    categoryHref: "/trinkbrunnen/",
    selectionCategory: "trinkbrunnen",
    primaryComparison: {
      slug: "beste-trinkbrunnen-fuer-katzen",
      title: "Trinkbrunnen vergleichen",
      text: "Vergleiche Trinkfläche, Geräusch, Reinigung, Material und Betriebsart für deinen Katzenalltag.",
      cta: "Zum Trinkbrunnen-Vergleich",
      question: "Welche Trinkfläche funktioniert im Katzenalltag?",
      why: "Vergleicht Zugang, Geräusch, Reinigung, Material und Betrieb."
    },
    secondaryComparisons: [
      { slug: "beste-trinkbrunnen-fuer-hunde", question: "Welcher Brunnen passt zu Hundegröße und Standort?", why: "Ordnet Volumen, Stabilität und Trinkgeometrie ein." }
    ],
    overview: {
      rank: 2,
      tier: "primary",
      rationale: "Zweitgrößte Produktwelt; vollständige Katzen- und Hunde-Vergleiche plus sichtbare Wartungssignale."
    }
  },
  "gps-tracker": {
    categoryLabel: "GPS-Tracker",
    categoryHref: "/gps-tracker/",
    selectionCategory: "gps-tracker",
    primaryComparison: {
      slug: "beste-gps-tracker-fuer-hunde",
      title: "GPS-Tracker vergleichen",
      text: "Vergleiche Befestigung, Ortungsweg, Akkulaufzeit, Abdeckung und laufende Kosten für den realen Einsatz.",
      cta: "Zum GPS-Tracker-Vergleich",
      question: "Welcher Tracker hält im Hundealltag?",
      why: "Vergleicht Befestigung, Ortungsweg, Akku und Live-Modus."
    },
    secondaryComparisons: [
      { slug: "beste-gps-tracker-fuer-katzen", question: "Wie klein und sicher muss ein Katzentracker sein?", why: "Ordnet Gewicht, Halsbandlösung und Ortungsleistung ein." },
      { slug: "gps-tracker-ohne-abo", question: "Welche Systeme funktionieren ohne laufendes Mobilfunkabo?", why: "Zeigt Reichweiten- und Infrastrukturkompromisse statt nur den Preis." },
      { slug: "gps-tracker-mit-langer-akkulaufzeit", question: "Welche Laufzeit bleibt unter realen Bedingungen?", why: "Stellt Maximalwerte und ihre Bedingungen gegenüber." }
    ],
    overview: {
      rank: 3,
      tier: "primary",
      rationale: "Strategische Sicherheitskategorie mit mehreren vollständigen Entscheidungsvergleichen und vorhandenen Produktsignalen."
    }
  },
  "automatische-katzentoiletten": {
    categoryLabel: "Automatische Katzentoiletten",
    categoryHref: "/automatische-katzentoiletten/",
    selectionCategory: "katzentoiletten",
    primaryComparison: {
      slug: "beste-automatische-katzentoiletten",
      title: "Katzentoiletten vergleichen",
      text: "Vergleiche Einstieg, Bauform, Sensorik, Streu-Kompatibilität und Folgekosten passend zur Katze.",
      cta: "Zum Katzentoiletten-Vergleich",
      question: "Welches Sicherheits- und Raumkonzept passt zur Katze?",
      why: "Vergleicht Einstieg, Bauform, Sensorik, Streu, Reinigung und laufende Kosten."
    },
    secondaryComparisons: [],
    overview: {
      rank: 4,
      tier: "additional",
      rationale: "Breite aktuelle Produktbasis und vollständiger Hauptvergleich, aber nur eine Vergleichsroute."
    }
  },
  haustierkameras: {
    categoryLabel: "Haustierkameras",
    categoryHref: "/haustierkameras/",
    selectionCategory: "haustierkameras",
    primaryComparison: {
      slug: "beste-haustierkameras",
      title: "Haustierkameras vergleichen",
      text: "Vergleiche Blickbereich, Speicherung, Interaktion, Cloud-Abhängigkeit und Gesamtkosten nach deiner Aufgabe.",
      cta: "Zum Haustierkamera-Vergleich",
      question: "Welche Kameraklasse passt zur eigentlichen Aufgabe?",
      why: "Vergleicht stationäre, interaktive und mobile Lösungen samt Speicherung und Kosten."
    },
    secondaryComparisons: [],
    overview: {
      rank: 5,
      tier: "additional",
      rationale: "Kommerziell relevante Produktwelt mit vollständigem Hauptvergleich, aber kleinerer Produkt- und Vergleichsbreite."
    }
  },
  katzenklappen: {
    categoryLabel: "Katzenklappen",
    categoryHref: "/katzenklappen/",
    selectionCategory: "katzenklappen",
    primaryComparison: {
      slug: "beste-mikrochip-katzenklappen",
      title: "Katzenklappen vergleichen",
      text: "Vergleiche Zugang, Richtungsrechte, Durchgang, Einbau und lokale Funktion für deinen Haushalt.",
      cta: "Zum Katzenklappen-Vergleich",
      question: "Welche Klappe kontrolliert den Zugang zuverlässig?",
      why: "Vergleicht Durchgang, Tier-IDs, lokale Regeln, Einbau und Dämmung."
    },
    secondaryComparisons: [
      { slug: "katzenklappen-mit-app-und-beuteerkennung", question: "Wann bringen App und Beuteerkennung echten Zusatznutzen?", why: "Trennt lokale Kernfunktion, Fernzugriff und Erkennungsgrenzen." }
    ],
    overview: {
      rank: 6,
      tier: "specialist",
      rationale: "Wichtige, aber enger abgegrenzte Spezialkategorie; alte Featured-Reihenfolge war kein Nachfragesignal."
    }
  }
} as const satisfies Record<string, CategoryDecisionRoutingEntry>;

export type CategoryDecisionRoutingSlug = keyof typeof categoryDecisionRouting;

export const getComparisonHref = (comparisonSlug: string) =>
  `/vergleiche/${comparisonSlug}/`;

export const getCategoryRouteForComparison = (comparisonSlug: string) => {
  const selectionCategory = getComparisonSelectionRule(comparisonSlug)?.category;

  for (const [categorySlug, route] of Object.entries(categoryDecisionRouting)) {
    if (
      route.primaryComparison.slug === comparisonSlug ||
      route.secondaryComparisons.some((comparison) => comparison.slug === comparisonSlug) ||
      route.selectionCategory === selectionCategory
    ) {
      return {
        categorySlug: categorySlug as CategoryDecisionRoutingSlug,
        categoryLabel: route.categoryLabel,
        categoryHref: route.categoryHref,
        isPrimary: route.primaryComparison.slug === comparisonSlug
      };
    }
  }
  return undefined;
};
