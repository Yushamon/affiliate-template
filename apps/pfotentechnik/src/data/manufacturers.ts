import { products, type ProductKey } from "./products";

export interface Manufacturer {
  key: string;
  name: string;
  slug: string;
  description: string;
  website: string;
  focus: string[];
  productCategories: string[];
  strengths: string[];
  limitations: string[];
  country?: string;
  rating?: number;

ratings?: {
  innovation: number;
  quality: number;
  app: number;
  support: number;
  value: number;
};

productAreas?: Array<{
  name: string;
  description: string;
}>;

series?: Array<{
  name: string;
  suitableFor: string;
  description: string;
}>;

suitableFor?: string[];

lessSuitableFor?: string[];

customerExperience?: {
  summary: string;
  positives: string[];
  criticism: string[];
  supportAssessment: string;
};

alternatives?: string[];

faq?: Array<{
  question: string;
  answer: string;
}>;

sources?: Array<{
  label: string;
  url: string;
}>;
  products: ProductKey[];
}

type ManufacturerInput = Omit<Manufacturer, "products">;

const createManufacturer = (manufacturer: ManufacturerInput): Manufacturer => ({
  ...manufacturer,
  products: (Object.entries(products) as Array<[ProductKey, (typeof products)[ProductKey]]>)
    .filter(([, product]) => product.manufacturer === manufacturer.key)
    .sort(([, a], [, b]) => b.ranking.overall - a.ranking.overall)
    .map(([key]) => key)
});

export const manufacturers = [
  createManufacturer({
  key: "petlibro",
  name: "Petlibro",
  slug: "petlibro",

  description:
    "Petlibro entwickelt smarte Haustiertechnik mit Schwerpunkt auf automatischer Fütterung, Trinkbrunnen und vernetzten Lösungen für Katzen und Hunde. Die Marke ist besonders für modernes Design, eine vergleichsweise übersichtliche App und ein breites Sortiment an Futterautomaten bekannt.",

  website: "https://de.petlibro.com",

  focus: [
    "Smarte Futterautomaten",
    "Nassfutter- und RFID-Lösungen",
    "Trinkbrunnen und vernetzte Haustiertechnik"
  ],

  productCategories: [
    "Futterautomaten",
    "Trinkbrunnen",
    "RFID-Fütterung",
    "Haustierkameras"
  ],

  strengths: [
    "Breite Auswahl für unterschiedliche Fütterungssituationen",
    "Moderne App mit Zeitplänen, Protokollen und Benachrichtigungen",
    "Eigenständige Lösungen für Nassfutter und RFID-Zugang",
    "Ansprechendes, meist kompaktes Produktdesign",
    "Viele Modelle mit Notstrom- oder Batterielösung"
  ],

  limitations: [
    "Viele Modelle liegen preislich über einfachen Offline-Automaten",
    "App- und Modellversionen können sich regional unterscheiden",
    "Einzelne Nutzer berichten über WLAN- oder App-Probleme",
    "Zubehör und Ersatzteile sind nicht für jedes Modell gleich gut verfügbar"
  ],

  rating: 4.6,

  ratings: {
    innovation: 4.8,
    quality: 4.6,
    app: 4.5,
    support: 4.2,
    value: 4.3
  },

  productAreas: [
    {
      name: "Futterautomaten",
      description:
        "Petlibro bietet klassische Trockenfutterautomaten, Modelle mit Kamera, RFID-Zugang und aktive Kühlung für Nassfutter."
    },
    {
      name: "Trinkbrunnen",
      description:
        "Das Sortiment umfasst kompakte und appfähige Trinkbrunnen mit Filter- und teilweise Verbrauchsüberwachung."
    },
    {
      name: "RFID-Fütterung",
      description:
        "Mit RFID-Modellen richtet sich Petlibro an Mehrtierhaushalte mit getrennten Futterplänen und Futterneid."
    },
    {
      name: "Haustierkameras",
      description:
        "Kamerafunktionen sind teilweise direkt in Futterautomaten integriert und ergänzen Livebild, Ereignisse und Benachrichtigungen."
    }
  ],

  series: [
    {
      name: "Granary",
      suitableFor:
        "Allround-Nutzung und größere Trockenfuttervorräte",
      description:
        "Die Granary-Serie deckt klassische Smart-Feeder sowie Varianten mit Kamera ab und ist die breiteste Produktlinie von Petlibro."
    },
    {
      name: "Air",
      suitableFor:
        "Kleine Haushalte und kompakte Stellflächen",
      description:
        "Die Air-Serie ist kompakter aufgebaut und wird als klassische sowie als appfähige Variante angeboten."
    },
    {
      name: "Polar",
      suitableFor:
        "Zeitgesteuerte Nassfütterung",
      description:
        "Polar nutzt aktive Kühlung und richtet sich an Halter, die vorbereitete Nassfutterportionen länger frisch halten möchten."
    },
    {
      name: "One RFID",
      suitableFor:
        "Mehrtierhaushalte und Schutz vor Futterdiebstahl",
      description:
        "Die One-Serie verbindet automatische Portionierung mit einem geschützten Zugang über einen RFID-Halsbandanhänger."
    },
    {
      name: "Space",
      suitableFor:
        "Designorientierte Haushalte mit App-Steuerung",
      description:
        "Space kombiniert eine moderne Bauform mit den typischen Smart-Feeder-Funktionen der Marke."
    }
  ],

  suitableFor: [
    "Berufstätige mit festen oder wechselnden Fütterungszeiten",
    "Katzenhalter mit Bedarf an kleinen, planbaren Portionen",
    "Mehrtierhaushalte mit Futterneid oder getrennten Rationen",
    "Nutzer, die App-Steuerung und Fütterungsprotokolle wünschen",
    "Haushalte, die eine moderne und kompakte Produktgestaltung bevorzugen"
  ],

  lessSuitableFor: [
    "Nutzer, die bewusst vollständig auf App und Cloud-Funktionen verzichten möchten",
    "Sehr preisbewusste Käufer mit ausschließlich einfachen Timer-Anforderungen",
    "Haushalte, die für jedes Produkt eine langfristig garantierte lokale Ersatzteilversorgung erwarten"
  ],

  customerExperience: {
    summary:
      "Über verschiedene Käuferbewertungen und Produkttests hinweg werden vor allem die einfache Einrichtung, das moderne Design und die zuverlässige Fütterung positiv hervorgehoben. Kritische Rückmeldungen betreffen vor allem vereinzelte WLAN- oder App-Probleme sowie uneinheitliche Erfahrungen bei Reklamationen und Ersatzteilen.",

    positives: [
      "Viele Nutzer beschreiben Einrichtung und tägliche Bedienung als unkompliziert.",
      "Zeitpläne und Fütterungsprotokolle werden häufig als zuverlässig und alltagstauglich bewertet.",
      "Design, Materialanmutung und kompakte Bauformen werden regelmäßig gelobt.",
      "Mehrere Tests heben die übersichtliche App und die gute Funktionsabdeckung hervor.",
      "Der Support wird in vielen Bewertungen als schnell, freundlich und lösungsorientiert beschrieben."
    ],

    criticism: [
      "Einzelne Nutzer berichten über Verbindungsprobleme nach Einrichtung oder App-Updates.",
      "Die ausgegebene Portionsmenge kann je nach Futterform leicht schwanken.",
      "Erfahrungen mit Garantieabwicklung und Ersatzteilen fallen nicht durchgehend einheitlich aus.",
      "Einige Funktionen und Modellvarianten unterscheiden sich je nach Region und verwendeter App."
    ],

    supportAssessment:
      "Petlibro nennt für den deutschen Support eine Antwortzeit von bis zu 48 Stunden an Werktagen. Viele öffentliche Bewertungen berichten von schneller und hilfreicher Unterstützung, während andere Plattformen auch deutlich kritischere Einzelfälle enthalten. Insgesamt wirkt der Support erreichbar und überwiegend lösungsorientiert, sollte bei Garantiefällen aber nicht als durchgehend gleich schnell vorausgesetzt werden."
  },

  alternatives: [
    "petkit",
    "surefeed",
    "cat-mate"
  ],

  faq: [
    {
      question: "Ist Petlibro eine gute Marke?",
      answer:
        "Petlibro gehört zu den etablierten Anbietern smarter Haustiertechnik. Besonders stark ist die Marke bei automatischer Fütterung, App-Steuerung und spezialisierten Lösungen für Nassfutter oder Mehrtierhaushalte."
    },
    {
      question: "Welche Petlibro-Serie passt zu mir?",
      answer:
        "Granary eignet sich als vielseitige Allround-Serie, Air für kompakte Stellflächen, Polar für Nassfutter und One RFID für getrennte Fütterung in Mehrtierhaushalten."
    },
    {
      question: "Wie gut ist die Petlibro-App?",
      answer:
        "Die App wird überwiegend als übersichtlich und gut bedienbar beschrieben. Je nach Modell werden Zeitpläne, Protokolle, Benachrichtigungen und Kamerafunktionen unterstützt. Einzelne Nutzer berichten jedoch über gelegentliche Verbindungsprobleme."
    },
    {
      question: "Wie ist der Petlibro-Support?",
      answer:
        "Die Erfahrungen sind insgesamt eher positiv, aber nicht vollständig einheitlich. Petlibro nennt eine Antwortzeit von bis zu 48 Stunden an Werktagen. Bei komplexeren Garantie- oder Ersatzteilfällen kann die Bearbeitung länger dauern."
    },
    {
      question: "Bietet Petlibro nur Futterautomaten an?",
      answer:
        "Nein. Neben Futterautomaten bietet Petlibro auch Trinkbrunnen, RFID-Lösungen und weitere vernetzte Haustierprodukte an."
    }
  ],

  sources: [
    {
      label: "Petlibro Deutschland",
      url: "https://de.petlibro.com"
    },
    {
      label: "Petlibro Help Center",
      url: "https://petlibro.com/pages/help-center"
    },
    {
      label: "Petlibro Kontakt und Support",
      url: "https://de.petlibro.com/pages/contact-us"
    },
    {
      label: "Petlibro Garantiebedingungen",
      url: "https://petlibro.com/pages/return-policy"
    },
    {
      label: "Trustpilot Erfahrungen",
      url: "https://de.trustpilot.com/review/petlibro.com"
    },
    {
      label: "Cybernews Produkterfahrung",
      url:
        "https://cybernews.com/reviews/petlibro-automatic-cat-feeder-review/"
    },
    {
      label: "WIRED Petlibro Einschätzung",
      url: "https://www.wired.com/story/petlibro-discount-code"
    }
  ]
}),
  createManufacturer({
    key: "petkit", name: "PETKIT", slug: "petkit",
    description: "PETKIT verbindet Futterautomaten mit einem größeren Pet-Tech-Ökosystem. Die Modelle reichen von kompakten Vorratsautomaten bis zu Kamera- und Dual-Hopper-Lösungen.",
    website: "https://petkit.com", focus: ["Pet-Tech-Ökosystem", "App-Steuerung", "Kamera und Mehrkammer-Systeme"],
    productCategories: ["Futterautomaten", "Trinkbrunnen", "Weitere Pet-Tech-Geräte"], strengths: ["Verschiedene Baugrößen", "App-Integration", "Modelle für spezielle Trockenfutter-Szenarien"],
    limitations: ["Funktionsumfang unterscheidet sich deutlich je Modell", "Cloud- und App-Funktionen erhöhen die Komplexität"]
  }),
  createManufacturer({
    key: "cat-mate", name: "Cat Mate / Closer Pets", slug: "cat-mate", country: "Vereinigtes Königreich",
    description: "Cat Mate ist eine Marke von Closer Pets und konzentriert sich unter anderem auf zeitgesteuerte Fachautomaten. Der C500 ist besonders für vorbereitete Nass- oder Mischfütterung relevant.",
    website: "https://closerpets.com", focus: ["Fachautomaten", "Nassfutter", "Lokale Timer ohne App"],
    productCategories: ["Futterautomaten", "Trinkbrunnen", "Haustierklappen"], strengths: ["Einfache lokale Bedienung", "Fächer statt Trockenfutter-Förderkanal", "Ersatzteile und Zubehör im Sortiment"],
    limitations: ["Weniger Fernfunktionen", "Kühlakkus ersetzen keine aktive Kühlung"]
  }),
  createManufacturer({
    key: "xiaomi", name: "Xiaomi", slug: "xiaomi", country: "China",
    description: "Xiaomi ordnet Futterautomaten in das Xiaomi-Home-Ökosystem ein. Relevant sind App-Steuerung, Sensorik und eine auf Trockenfutter ausgerichtete Produktlogik.",
    website: "https://www.mi.com/de", focus: ["Smart Home", "App-Steuerung", "Trockenfutter-Automation"],
    productCategories: ["Futterautomaten", "Smart-Home-Geräte"], strengths: ["Einbindung in Xiaomi Home", "Status- und Füllstandsfunktionen", "Breite europäische Markenpräsenz"],
    limitations: ["Region und App-Kompatibilität müssen zusammenpassen", "Nicht für jede Tiergröße oder Futterform geeignet"]
  }),
  createManufacturer({
    key: "surefeed", name: "SureFeed / Sure Petcare", slug: "surefeed", country: "Vereinigtes Königreich",
    description: "SureFeed konzentriert sich auf mikrochipgesteuerten Futterzugang. Die Systeme sind besonders für Mehrtierhaushalte und getrennte Rationen gedacht, nicht primär als zeitgesteuerte Vorratsautomaten.",
    website: "https://www.surepetcare.com/de-de/futterautomat", focus: ["Mikrochip-Erkennung", "Mehrtierhaushalte", "Nass- und Trockenfutter"],
    productCategories: ["Mikrochip-Futterautomaten", "Haustierklappen"], strengths: ["Individueller Futterzugang", "App-Auswertung beim Connect-Modell", "Batteriebetrieb"],
    limitations: ["Connect-Funktionen benötigen einen separaten Hub", "Keine automatische Vorratsdosierung"]
  }),
  createManufacturer({
    key: "honeyguardian", name: "HoneyGuardian", slug: "honeyguardian",
    description: "HoneyGuardian führt klassische und vernetzte Vorratsautomaten in mehreren Größen. Beim Kauf ist die konkrete Modellnummer wichtiger als ein allgemeiner Produktname.",
    website: "https://www.honeyguardian.com", focus: ["Vorratsautomaten", "App-Modelle", "Preis-Leistung"],
    productCategories: ["Futterautomaten", "Trinkbrunnen", "Katzentoiletten"], strengths: ["Mehrere Behältergrößen", "Modelle mit Edelstahl-Napf", "Basis- und App-Varianten"],
    limitations: ["Modellbezeichnungen im Handel sind nicht immer einheitlich", "Deutsche Verfügbarkeit kann schwanken"]
  }),
  createManufacturer({
    key: "wopet", name: "WOPET", slug: "wopet",
    description: "WOPET bietet große Trockenfutterautomaten mit App, Zeitplänen und teilweise Kamera an. Der Patrol F07 Pro steht für den klassischen 6-Liter-WLAN-Ansatz.",
    website: "https://wopet.com", focus: ["Große Vorratsautomaten", "WLAN-Steuerung", "Modelle mit Kamera"],
    productCategories: ["Futterautomaten"], strengths: ["Großer Vorrat", "Viele planbare Mahlzeiten", "Breiter Portionsbereich"],
    limitations: ["Modellvarianten und Apps sorgfältig abgleichen", "EU-Verfügbarkeit ist nicht bei allen Ausführungen stabil"]
  }),
  createManufacturer({
    key: "oneisall", name: "oneisall", slug: "oneisall",
    description: "oneisall führt Futterautomaten für ein oder zwei Tiere und betreibt einen europäischen Shop. Im Fokus stehen große Vorräte und Varianten mit Doppelschale.",
    website: "https://de.oneisall.com", focus: ["Zwei-Katzen-Lösungen", "Vorratsautomaten", "App-Varianten"],
    productCategories: ["Futterautomaten", "Pflegegeräte", "Weitere Pet-Tech-Produkte"], strengths: ["EU-Shop", "Modelle mit zwei Futterplätzen", "Große Behälter"],
    limitations: ["Doppelschalen bieten keine individuelle Zugangskontrolle", "Varianten mit und ohne App müssen unterschieden werden"]
  }),
  createManufacturer({
    key: "imipaw", name: "IMIPAW", slug: "imipaw",
    description: "IMIPAW konzentriert sich auf einfache programmierbare Futterautomaten. Die Modelle sind vor allem als lokale Timer-Lösungen ohne umfangreiches Ökosystem interessant.",
    website: "https://imipaw.com", focus: ["Lokale Timer", "Kompakte Automaten", "Batteriebetrieb"],
    productCategories: ["Futterautomaten"], strengths: ["Einfache Grundfunktion", "Ohne WLAN nutzbare Modelle", "Kompakte Bauformen"],
    limitations: ["Modellnamen im Handel können variieren", "Weniger App- und Support-Infrastruktur"]
  }),
  createManufacturer({
    key: "pawbby", name: "PAWBBY", slug: "pawbby",
    description: "PAWBBY entwickelt verschiedene Pet-Tech-Produkte und führt Futterautomaten im Smart-Home-Umfeld. Regionale Modell- und App-Kompatibilität sollte besonders genau geprüft werden.",
    website: "https://pawbby.com/de", focus: ["Smart Home", "App-Futterautomaten", "Weitere Pet-Tech-Kategorien"],
    productCategories: ["Futterautomaten", "Katzentoiletten", "Haustierpflege"], strengths: ["Breites Pet-Tech-Themenspektrum", "Vernetzte Produktvarianten", "Smart-Home-Ausrichtung"],
    limitations: ["Deutsche Produktverfügbarkeit schwankt", "Modellnummer und App-Region sind vor dem Kauf abzugleichen"]
  })
] as const satisfies readonly Manufacturer[];

export type ManufacturerSlug = (typeof manufacturers)[number]["slug"];

export function getManufacturerBySlug(slug: string) {
  return manufacturers.find((manufacturer) => manufacturer.slug === slug);
}
