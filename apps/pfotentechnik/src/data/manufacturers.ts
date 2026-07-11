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
  key: "petkit",
  name: "PETKIT",
  slug: "petkit",

  description:
    "PETKIT gehört weltweit zu den bekanntesten Herstellern smarter Haustiertechnik. Das Unternehmen entwickelt vernetzte Futterautomaten, Trinkbrunnen, selbstreinigende Katzentoiletten und weiteres intelligentes Zubehör mit einem klaren Fokus auf Design, Automatisierung und App-Steuerung.",

  website: "https://petkit.com",

  focus: [
    "Smarte Futterautomaten",
    "Selbstreinigende Katzentoiletten",
    "Trinkbrunnen",
    "Vernetztes Haustierzubehör"
  ],

  productCategories: [
    "Futterautomaten",
    "Trinkbrunnen",
    "Katzentoiletten",
    "Haustierzubehör"
  ],

  strengths: [
    "Sehr hohe Innovationsgeschwindigkeit",
    "Modernes Premium-Design",
    "Großes Smart-Pet-Ökosystem",
    "Intuitive App mit vielen Funktionen",
    "Hochwertige Verarbeitung"
  ],

  limitations: [
    "Premiumpreise",
    "Teilweise Cloud-Abhängigkeit",
    "Nicht alle Produkte weltweit verfügbar",
    "Ersatzteile teilweise teuer"
  ],

  rating: 4.7,

  ratings: {
    innovation: 5.0,
    quality: 4.8,
    app: 4.7,
    support: 4.2,
    value: 4.2
  },

  productAreas: [
    {
      name: "Futterautomaten",
      description:
        "Automatische Futterautomaten mit WLAN, App-Steuerung, Kamera und intelligenten Fütterungsfunktionen."
    },
    {
      name: "Trinkbrunnen",
      description:
        "Intelligente Trinkbrunnen mit mehrstufiger Filtertechnik und leisem Betrieb."
    },
    {
      name: "Selbstreinigende Katzentoiletten",
      description:
        "Automatische Katzentoiletten mit Sensorik, App-Anbindung und Gesundheitsfunktionen."
    },
    {
      name: "Smartes Haustierzubehör",
      description:
        "Ergänzende Produkte wie Futterbehälter, Pflegezubehör und weitere intelligente Lösungen."
    }
  ],

  series: [
    {
      name: "Fresh Element",
      suitableFor: "klassische automatische Fütterung",
      description:
        "Automatische Trockenfutterautomaten mit App-Steuerung und unterschiedlichen Behältergrößen."
    },
    {
      name: "YumShare",
      suitableFor: "Premium-Fütterung mit Kamera",
      description:
        "Die modernste PETKIT-Serie mit App, Kamera und erweiterten Smart-Funktionen."
    },
    {
      name: "Eversweet",
      suitableFor: "Trinkbrunnen",
      description:
        "Intelligente Trinkbrunnen mit leisem Betrieb und mehrstufigem Filtersystem."
    },
    {
      name: "Pura",
      suitableFor: "Automatische Katzentoiletten",
      description:
        "Selbstreinigende Katzentoiletten mit Sensorik und Gesundheitsfunktionen."
    }
  ],

  suitableFor: [
    "Technikaffine Tierhalter",
    "Smart-Home-Nutzer",
    "Berufstätige",
    "Premium-Käufer",
    "Mehrkatzenhaushalte"
  ],

  lessSuitableFor: [
    "Sehr preisbewusste Käufer",
    "Nutzer ohne App",
    "Haushalte mit reinem Offline-Betrieb"
  ],

  customerExperience: {
    summary:
      "PETKIT wird von vielen Käufern für Design, Verarbeitung und Innovationskraft gelobt. Besonders positiv werden die App sowie das Zusammenspiel verschiedener PETKIT-Produkte bewertet. Kritik betrifft hauptsächlich den höheren Preis und gelegentliche Software- oder Cloud-Themen.",

    positives: [
      "Sehr hochwertige Verarbeitung",
      "Modernes Design",
      "Großes Smart-Pet-Ökosystem",
      "Leise Produkte",
      "Regelmäßige Weiterentwicklung"
    ],

    criticism: [
      "Premiumpreise",
      "Cloud-Abhängigkeit einzelner Funktionen",
      "Gelegentliche App-Probleme nach Updates",
      "Ersatzteile teilweise teuer"
    ],

    supportAssessment:
      "Der Support wird insgesamt überwiegend positiv bewertet. Viele Käufer berichten über kompetente Hilfe und regelmäßige Softwareupdates. Bei Garantie- oder Ersatzteilanfragen werden jedoch vereinzelt längere Bearbeitungszeiten genannt."
  },

  alternatives: [
    "petlibro",
    "surefeed",
    "cat-mate"
  ],

  faq: [
    {
      question: "Ist PETKIT eine gute Marke?",
      answer:
        "PETKIT gehört zu den innovativsten Herstellern smarter Haustiertechnik und überzeugt besonders durch hochwertige Verarbeitung, moderne App-Steuerung und ein breites Produktportfolio."
    },
    {
      question: "Woher kommt PETKIT?",
      answer:
        "PETKIT wurde in China gegründet und vertreibt seine Produkte heute weltweit. Für Europa existieren eigene Vertriebs- und Supportstrukturen."
    },
    {
      question: "Wie gut ist die PETKIT App?",
      answer:
        "Die PETKIT App zählt zu den umfangreichsten Lösungen im Smart-Pet-Bereich und bietet Zeitpläne, Benachrichtigungen sowie die Verwaltung mehrerer Geräte."
    },
    {
      question: "Welche PETKIT Serie eignet sich am besten?",
      answer:
        "Fresh Element eignet sich als klassischer Smart-Feeder. YumShare richtet sich an Nutzer mit höheren Ansprüchen und zusätzlichen Kamerafunktionen."
    },
    {
      question: "Bietet PETKIT nur Futterautomaten an?",
      answer:
        "Nein. PETKIT entwickelt außerdem Trinkbrunnen, selbstreinigende Katzentoiletten sowie weiteres intelligentes Haustierzubehör."
    },
    {
      question: "Wie sind die Erfahrungen mit dem Support?",
      answer:
        "Die Erfahrungen fallen überwiegend positiv aus. Einzelne Käufer berichten jedoch von längeren Bearbeitungszeiten bei Garantie- oder Ersatzteilanfragen."
    }
  ],

  sources: [
    {
      label: "PETKIT Global",
      url: "https://petkit.com"
    },
    {
      label: "PETKIT Europe",
      url: "https://www.petkit-eu.com"
    },
    {
      label: "PETKIT Germany",
      url: "https://petkitgermany.com"
    },
    {
      label: "Trustpilot",
      url: "https://www.trustpilot.com"
    }
  ]
}),
  createManufacturer({
  key: "cat-mate",
  name: "Cat Mate",
  slug: "cat-mate",

  description:
    "Cat Mate gehört zur Marke Closer Pets und entwickelt seit vielen Jahren zuverlässige Fütterungslösungen für Hunde und Katzen. Der Schwerpunkt liegt auf einfach bedienbaren Futterautomaten ohne komplizierte Technik, die besonders für Nassfutter, Wochenendtrips und preisbewusste Tierhalter interessant sind.",

  website: "https://closerpets.com",

  focus: [
    "Nassfutter",
    "Zeitgesteuerte Fütterung",
    "Einfache Bedienung",
    "Batteriebetrieb"
  ],

  productCategories: [
    "Futterautomaten",
    "Trinkbrunnen",
    "Haustierklappen"
  ],

  strengths: [
    "Sehr einfache Bedienung",
    "Zuverlässige Technik",
    "Ideal für Nassfutter",
    "Lange Batterielaufzeit",
    "Gute Ersatzteilversorgung"
  ],

  limitations: [
    "Keine App",
    "Keine Kamera",
    "Keine Smart-Home-Funktionen",
    "Weniger Innovation als moderne Wettbewerber"
  ],

  rating: 4.4,

  ratings: {
    innovation: 3.2,
    quality: 4.5,
    app: 1.0,
    support: 4.3,
    value: 4.7
  },

  productAreas: [
    {
      name: "Futterautomaten",
      description:
        "Zeitgesteuerte Futterautomaten für Nass- und Trockenfutter."
    },
    {
      name: "Trinkbrunnen",
      description:
        "Trinkbrunnen für Katzen und Hunde."
    },
    {
      name: "Haustierklappen",
      description:
        "Elektronische und klassische Haustierklappen."
    }
  ],

  series: [
    {
      name: "C200",
      suitableFor: "Zwei Mahlzeiten",
      description:
        "Einfacher Nass- und Trockenfutterautomat für kurze Abwesenheiten."
    },
    {
      name: "C300",
      suitableFor: "Drei Mahlzeiten",
      description:
        "Ideal für Wochenenden oder längere Arbeitstage."
    },
    {
      name: "C500",
      suitableFor: "Fünf Mahlzeiten",
      description:
        "Der vielseitigste Cat Mate Futterautomat mit Kühlakku."
    }
  ],

  suitableFor: [
    "Preisbewusste Käufer",
    "Nassfutter",
    "Senioren",
    "Wochenendtrips",
    "Nutzer ohne WLAN"
  ],

  lessSuitableFor: [
    "Smart-Home-Nutzer",
    "App-Steuerung",
    "Fernüberwachung",
    "Technik-Enthusiasten"
  ],

  customerExperience: {
    summary:
      "Cat Mate wird von vielen Käufern für seine einfache Bedienung und hohe Zuverlässigkeit gelobt. Die Produkte funktionieren meist viele Jahre problemlos. Kritik richtet sich vor allem gegen den fehlenden Smart-Funktionsumfang.",

    positives: [
      "Sehr zuverlässig",
      "Einfach einzurichten",
      "Ideal für Nassfutter",
      "Leicht zu reinigen",
      "Sehr gutes Preis-Leistungs-Verhältnis"
    ],

    criticism: [
      "Keine App",
      "Keine Kamera",
      "Mechanische Bedienung",
      "Wenige Komfortfunktionen"
    ],

    supportAssessment:
      "Closer Pets bietet eine gute Ersatzteilversorgung und wird im Support überwiegend positiv bewertet. Besonders die lange Verfügbarkeit älterer Modelle wird häufig gelobt."
  },

  alternatives: [
    "petlibro",
    "surefeed",
    "petkit"
  ],

  faq: [
    {
      question: "Ist Cat Mate eine gute Marke?",
      answer:
        "Ja. Cat Mate gehört seit vielen Jahren zu den etablierten Herstellern einfacher und zuverlässiger Futterautomaten."
    },
    {
      question: "Für wen eignet sich Cat Mate?",
      answer:
        "Besonders für Nutzer, die einen unkomplizierten Futterautomaten ohne App oder WLAN suchen."
    },
    {
      question: "Kann Cat Mate auch Nassfutter?",
      answer:
        "Ja. Besonders die Modelle C200, C300 und C500 eignen sich sehr gut für Nassfutter."
    },
    {
      question: "Wie sind die Erfahrungen mit dem Support?",
      answer:
        "Die Erfahrungen sind überwiegend positiv. Ersatzteile sind häufig auch für ältere Modelle erhältlich."
    },
    {
      question: "Bietet Cat Mate Smart-Home-Funktionen?",
      answer:
        "Nein. Cat Mate setzt bewusst auf einfache und zuverlässige Offline-Lösungen."
    }
  ],

  sources: [
    {
      label: "Closer Pets",
      url: "https://closerpets.com"
    },
    {
      label: "Closer Pets Support",
      url: "https://support.closerpets.com"
    },
    {
      label: "Trustpilot",
      url: "https://www.trustpilot.com"
    }
  ]
}),
 createManufacturer({
  key: "xiaomi",
  name: "Xiaomi",
  slug: "xiaomi",

  description:
    "Xiaomi entwickelt ein breites Smart-Home-Ökosystem und bietet mit seinen Smart Pet Produkten auch automatische Futterautomaten und weiteres intelligentes Haustierzubehör an. Im Mittelpunkt stehen die Integration in das Xiaomi-Ökosystem, eine moderne App sowie ein attraktives Preis-Leistungs-Verhältnis.",

  website: "https://www.mi.com",

  focus: [
    "Smart Home",
    "Automatische Futterautomaten",
    "IoT-Produkte",
    "App-Steuerung"
  ],

  productCategories: [
    "Futterautomaten",
    "Smart Home",
    "Haustierzubehör"
  ],

  strengths: [
    "Sehr gutes Preis-Leistungs-Verhältnis",
    "Nahtlose Integration ins Xiaomi Smart Home",
    "Moderne Mi Home App",
    "Hochwertiges Design",
    "Leiser Betrieb"
  ],

  limitations: [
    "Kleines Sortiment im Haustierbereich",
    "Teilweise regionale Unterschiede bei der App",
    "Weniger Speziallösungen als Petlibro oder PETKIT"
  ],

  rating: 4.4,

  ratings: {
    innovation: 4.6,
    quality: 4.5,
    app: 4.6,
    support: 4.0,
    value: 4.8
  },

  productAreas: [
    {
      name: "Futterautomaten",
      description:
        "Smarte Futterautomaten mit Integration in die Mi Home App."
    },
    {
      name: "Smart Home",
      description:
        "Haustierprodukte sind Teil des umfangreichen Xiaomi Smart-Home-Ökosystems."
    }
  ],

  series: [
    {
      name: "Smart Pet Feeder",
      suitableFor: "Smart-Home-Nutzer",
      description:
        "Automatische Futterautomaten mit Mi Home App und Zeitsteuerung."
    }
  ],

  suitableFor: [
    "Xiaomi Smart Home",
    "Technikaffine Nutzer",
    "Berufstätige",
    "Katzenhalter",
    "Preisbewusste Käufer"
  ],

  lessSuitableFor: [
    "RFID-Fütterung",
    "Nassfutter",
    "Große Produktauswahl"
  ],

  customerExperience: {
    summary:
      "Der Xiaomi Smart Pet Feeder wird häufig für seine Verarbeitung, den leisen Betrieb und die Integration in die Mi Home App gelobt. Kritik betrifft vor allem die geringe Produktauswahl und regionale Unterschiede einzelner App-Funktionen.",

    positives: [
      "Sehr leiser Betrieb",
      "Hochwertige Verarbeitung",
      "Gelungene Mi Home Integration",
      "Modernes Design",
      "Gutes Preis-Leistungs-Verhältnis"
    ],

    criticism: [
      "Nur wenige Haustierprodukte",
      "Regionale Unterschiede in der App",
      "Weniger Spezialfunktionen als Petlibro oder PETKIT"
    ],

    supportAssessment:
      "Der Support entspricht dem allgemeinen Xiaomi-Support. Viele Nutzer berichten von unkomplizierter Hilfe, allerdings erfolgt der Support nicht ausschließlich über eine Haustierproduktsparte."
  },

  alternatives: [
    "petlibro",
    "petkit",
    "wopet"
  ],

  faq: [
    {
      question: "Ist Xiaomi eine gute Marke für Futterautomaten?",
      answer:
        "Ja. Xiaomi bietet hochwertige Smart-Futterautomaten mit sehr guter Integration in die Mi Home App und einem attraktiven Preis-Leistungs-Verhältnis."
    },
    {
      question: "Für wen eignet sich Xiaomi besonders?",
      answer:
        "Vor allem für Nutzer, die bereits andere Xiaomi Smart-Home-Produkte verwenden."
    },
    {
      question: "Welche App nutzt Xiaomi?",
      answer:
        "Alle Haustierprodukte werden über die Mi Home App verwaltet."
    },
    {
      question: "Wie sind die Erfahrungen mit dem Support?",
      answer:
        "Die Erfahrungen entsprechen weitgehend dem allgemeinen Xiaomi-Kundendienst und werden überwiegend positiv bewertet."
    },
    {
      question: "Bietet Xiaomi mehrere Futterautomaten an?",
      answer:
        "Aktuell konzentriert sich Xiaomi auf wenige Modelle und bietet ein deutlich kleineres Sortiment als spezialisierte Hersteller."
    }
  ],

  sources: [
    {
      label: "Xiaomi Global",
      url: "https://www.mi.com"
    },
    {
      label: "Mi Home",
      url: "https://home.mi.com"
    },
    {
      label: "Amazon Kundenbewertungen",
      url: "https://www.amazon.de"
    }
  ]
}),
  createManufacturer({
  key: "surefeed",
  name: "SureFeed",
  slug: "surefeed",

  description:
    "SureFeed gehört zu den bekanntesten Herstellern intelligenter Fütterungssysteme für Katzen und kleine Hunde. Die Marke konzentriert sich auf Mikrochip- und RFID-gestützte Lösungen, mit denen einzelne Tiere gezielt gefüttert werden können. Besonders in Mehrkatzenhaushalten gilt SureFeed seit Jahren als Referenz.",

  website: "https://www.surepetcare.com",

  focus: [
    "Mikrochip-Fütterung",
    "RFID-Fütterung",
    "Mehrtierhaushalte",
    "Individuelle Fütterung"
  ],

  productCategories: [
    "Mikrochip-Futterautomaten",
    "RFID-Fütterung",
    "Smarte Haustierprodukte"
  ],

  strengths: [
    "Pionier im Bereich Mikrochip-Fütterung",
    "Sehr zuverlässige Tiererkennung",
    "Ideal gegen Futterdiebstahl",
    "Einfache Bedienung",
    "Sehr hohe Alltagstauglichkeit"
  ],

  limitations: [
    "Kleineres Produktsortiment",
    "Wenig Smart-Home-Funktionen",
    "Design wirkt funktionaler als moderner Wettbewerber",
    "Premiumpreis"
  ],

  rating: 4.7,

  ratings: {
    innovation: 4.8,
    quality: 4.8,
    app: 3.9,
    support: 4.4,
    value: 4.3
  },

  productAreas: [
    {
      name: "Mikrochip-Fütterung",
      description:
        "SureFeed ist Marktführer bei Futternäpfen und Futterautomaten mit Mikrochip-Erkennung."
    },
    {
      name: "RFID-Lösungen",
      description:
        "Alternativ können RFID-Halsbandanhänger verwendet werden."
    },
    {
      name: "Smarte Haustiertechnik",
      description:
        "Neben Fütterungssystemen entwickelt Sure Petcare weitere vernetzte Haustierlösungen."
    }
  ],

  series: [
    {
      name: "Microchip Pet Feeder",
      suitableFor: "Mehrtierhaushalte",
      description:
        "Automatische Öffnung nur für das berechtigte Tier über Mikrochip oder RFID."
    },
    {
      name: "Microchip Connect",
      suitableFor: "App-Nutzer",
      description:
        "Erweitert den Microchip Pet Feeder um App-Steuerung und Fütterungsprotokolle."
    }
  ],

  suitableFor: [
    "Mehrtierhaushalte",
    "Katzen mit Spezialfutter",
    "Diätfütterung",
    "Tiere mit Futterneid",
    "Haushalte mit unterschiedlichen Futterplänen"
  ],

  lessSuitableFor: [
    "Große Trockenfuttervorräte",
    "Automatische Portionierung mehrerer Mahlzeiten",
    "Preisbewusste Käufer"
  ],

  customerExperience: {
    summary:
      "SureFeed wird von vielen Katzenhaltern als äußerst zuverlässige Lösung gegen Futterdiebstahl beschrieben. Besonders gelobt werden die präzise Mikrochip-Erkennung und die einfache Bedienung. Kritik gibt es hauptsächlich am Preis und am vergleichsweise kleinen Produktsortiment.",

    positives: [
      "Sehr zuverlässige Mikrochip-Erkennung",
      "Ideal für mehrere Katzen",
      "Robuste Verarbeitung",
      "Lange Batterielaufzeit",
      "Einfache Einrichtung"
    ],

    criticism: [
      "Hoher Preis",
      "Relativ kleines Produktsortiment",
      "Connect-Funktionen wirken teilweise etwas veraltet",
      "Keine automatische Portionierung"
    ],

    supportAssessment:
      "Der Support wird überwiegend positiv bewertet. Viele Käufer berichten von kompetenter Hilfe bei Einrichtung und Garantie. Insgesamt gilt SureFeed als zuverlässiger Hersteller mit guter Ersatzteilversorgung."
  },

  alternatives: [
    "petlibro",
    "petkit",
    "cat-mate"
  ],

  faq: [
    {
      question: "Ist SureFeed eine gute Marke?",
      answer:
        "Ja. SureFeed gilt als einer der führenden Hersteller für Mikrochip-Fütterung und wird besonders in Mehrkatzenhaushalten empfohlen."
    },
    {
      question: "Wie funktioniert die Mikrochip-Erkennung?",
      answer:
        "Der Futternapf erkennt den implantierten Tierchip oder einen RFID-Anhänger und öffnet sich ausschließlich für das berechtigte Tier."
    },
    {
      question: "Für wen eignet sich SureFeed?",
      answer:
        "Vor allem für Haushalte mit mehreren Katzen oder Tieren mit unterschiedlichen Ernährungsplänen."
    },
    {
      question: "Bietet SureFeed auch klassische Futterautomaten an?",
      answer:
        "Der Schwerpunkt liegt auf kontrolliertem Napfzugang über Mikrochip und RFID, nicht auf großen Vorratsautomaten."
    },
    {
      question: "Wie sind die Erfahrungen mit dem Support?",
      answer:
        "Die Erfahrungen fallen überwiegend positiv aus. Besonders Ersatzteile und Garantieabwicklung werden häufig gelobt."
    }
  ],

  sources: [
    {
      label: "Sure Petcare",
      url: "https://www.surepetcare.com"
    },
    {
      label: "SureFeed Support",
      url: "https://support.surepetcare.com"
    },
    {
      label: "Trustpilot",
      url: "https://www.trustpilot.com"
    }
  ]
}),
  createManufacturer({
  key: "honeyguardian",
  name: "HoneyGuardian",
  slug: "honeyguardian",

  description:
    "HoneyGuardian entwickelt automatische Futterautomaten für Katzen und Hunde mit Schwerpunkt auf einfacher Bedienung, großen Vorratsbehältern und einem attraktiven Preis-Leistungs-Verhältnis. Das Sortiment umfasst klassische Timer-Modelle sowie WLAN-Futterautomaten für den Alltag.",

  website: "https://www.honeyguardian.com",

  focus: [
    "Automatische Futterautomaten",
    "Große Vorratsbehälter",
    "App-Steuerung",
    "Preis-Leistungs-Segment"
  ],

  productCategories: [
    "Futterautomaten",
    "Haustierzubehör"
  ],

  strengths: [
    "Große Futterbehälter",
    "Einfache Bedienung",
    "Gutes Preis-Leistungs-Verhältnis",
    "Auch Modelle für zwei Tiere verfügbar",
    "Leichte Reinigung"
  ],

  limitations: [
    "Kleineres Produktsortiment",
    "Weniger Smart-Funktionen als Premium-Hersteller",
    "App abhängig vom Modell",
    "Geringere Markenbekanntheit"
  ],

  rating: 4.2,

  ratings: {
    innovation: 3.9,
    quality: 4.2,
    app: 4.0,
    support: 4.0,
    value: 4.6
  },

  productAreas: [
    {
      name: "Futterautomaten",
      description:
        "Automatische Trockenfutterautomaten für Katzen und Hunde mit unterschiedlichen Behältergrößen."
    },
    {
      name: "Mehrtierlösungen",
      description:
        "Einige Modelle verteilen das Futter gleichzeitig auf zwei Futternäpfe."
    }
  ],

  series: [
    {
      name: "A-Serie",
      suitableFor: "Preisbewusste Käufer",
      description:
        "Offline-Futterautomaten mit einfacher Bedienung und großem Vorratsbehälter."
    },
    {
      name: "S-Serie",
      suitableFor: "App-Steuerung",
      description:
        "Smart-Modelle mit WLAN und Fernsteuerung."
    }
  ],

  suitableFor: [
    "Preisbewusste Käufer",
    "Katzen",
    "Kleine Hunde",
    "Mehrtierhaushalte",
    "Berufstätige"
  ],

  lessSuitableFor: [
    "Premium-Ansprüche",
    "Kamerafunktionen",
    "Smart-Home-Enthusiasten"
  ],

  customerExperience: {
    summary:
      "HoneyGuardian wird häufig für die einfache Bedienung und das gute Preis-Leistungs-Verhältnis gelobt. Besonders positiv werden die großen Vorratsbehälter bewertet. Kritik richtet sich hauptsächlich gegen den geringeren Smart-Funktionsumfang und die kleinere Produktauswahl.",

    positives: [
      "Große Vorratsbehälter",
      "Leichte Einrichtung",
      "Gute Portionierung",
      "Attraktiver Preis",
      "Einfache Reinigung"
    ],

    criticism: [
      "Weniger Smart-Funktionen",
      "Kleineres Sortiment",
      "App nicht bei allen Modellen verfügbar",
      "Geringere Markenbekanntheit"
    ],

    supportAssessment:
      "Die öffentlichen Erfahrungen mit dem Support sind überwiegend positiv. Besonders bei Einrichtungsfragen berichten viele Käufer von schneller Hilfe. Da HoneyGuardian in Europa kleiner aufgestellt ist als einige Wettbewerber, können Ersatzteile und Garantiefälle im Einzelfall etwas länger dauern."
  },

  alternatives: [
    "wopet",
    "petlibro",
    "cat-mate"
  ],

  faq: [
    {
      question: "Ist HoneyGuardian eine gute Marke?",
      answer:
        "HoneyGuardian bietet solide Futterautomaten mit gutem Preis-Leistungs-Verhältnis und richtet sich vor allem an preisbewusste Tierhalter."
    },
    {
      question: "Für wen eignet sich HoneyGuardian?",
      answer:
        "Vor allem für Katzenhalter und kleine Hunde, die einen unkomplizierten Futterautomaten mit großem Vorratsbehälter suchen."
    },
    {
      question: "Gibt es HoneyGuardian Modelle mit App?",
      answer:
        "Ja. Die S-Serie unterstützt WLAN und App-Steuerung, während die A-Serie auf klassische Offline-Bedienung setzt."
    },
    {
      question: "Wie sind die Erfahrungen mit dem Support?",
      answer:
        "Die Erfahrungen sind überwiegend positiv. Bei Garantie- und Ersatzteilanfragen kann die Bearbeitung teilweise etwas länger dauern."
    },
    {
      question: "Welche HoneyGuardian Serie ist die beste?",
      answer:
        "Für klassische Timer-Fütterung eignet sich die A-Serie. Wer eine App-Steuerung wünscht, sollte zur S-Serie greifen."
    }
  ],

  sources: [
    {
      label: "HoneyGuardian",
      url: "https://www.honeyguardian.com"
    },
    {
      label: "HoneyGuardian Support",
      url: "https://www.honeyguardian.com/pages/contact-us"
    },
    {
      label: "Amazon Kundenbewertungen",
      url: "https://www.amazon.de"
    }
  ]
}),
  createManufacturer({
  key: "wopet",
  name: "WOPET",
  slug: "wopet",

  description:
    "WOPET entwickelt automatische Futterautomaten und weitere smarte Haustierprodukte mit einem klaren Fokus auf ein attraktives Preis-Leistungs-Verhältnis. Die Marke bietet sowohl einfache Offline-Modelle als auch WLAN-Futterautomaten mit Kamera und App-Steuerung und zählt weltweit zu den größten Anbietern in diesem Segment.",

  website: "https://wopet.com",

  focus: [
    "Automatische Futterautomaten",
    "App-Steuerung",
    "Kameramodelle",
    "Preis-Leistungs-Segment"
  ],

  productCategories: [
    "Futterautomaten",
    "Trinkbrunnen",
    "Haustierzubehör"
  ],

  strengths: [
    "Große Modellauswahl",
    "Sehr gutes Preis-Leistungs-Verhältnis",
    "Viele WLAN-Modelle",
    "Kameramodelle verfügbar",
    "Für Katzen und Hunde geeignet"
  ],

  limitations: [
    "Verarbeitung je nach Modell unterschiedlich",
    "App weniger umfangreich als bei Premium-Herstellern",
    "Viele Modellvarianten können unübersichtlich sein",
    "Softwareupdates erscheinen unregelmäßiger"
  ],

  rating: 4.3,

  ratings: {
    innovation: 4.1,
    quality: 4.2,
    app: 4.0,
    support: 4.0,
    value: 4.8
  },

  productAreas: [
    {
      name: "Futterautomaten",
      description:
        "Breites Sortiment von einfachen Timer-Geräten bis zu WLAN-Modellen mit Kamera."
    },
    {
      name: "Trinkbrunnen",
      description:
        "Automatische Trinkbrunnen für Katzen und Hunde."
    },
    {
      name: "Haustierzubehör",
      description:
        "Weitere Produkte für Fütterung und Alltag mit Haustieren."
    }
  ],

  series: [
    {
      name: "Cube Air",
      suitableFor: "App-Steuerung",
      description:
        "Kompakte WLAN-Futterautomaten mit App und flexiblen Zeitplänen."
    },
    {
      name: "Pioneer",
      suitableFor: "Großer Vorrat",
      description:
        "Große Futterautomaten mit bis zu 7 Litern Fassungsvermögen."
    },
    {
      name: "Patrol",
      suitableFor: "Kameraüberwachung",
      description:
        "Premium-Modelle mit integrierter Kamera und Livebild."
    },
    {
      name: "Heritage",
      suitableFor: "Design und Kamera",
      description:
        "Moderne Kamera-Futterautomaten mit hochwertiger Optik."
    }
  ],

  suitableFor: [
    "Preisbewusste Käufer",
    "Berufstätige",
    "Katzenhalter",
    "Hundebesitzer",
    "Nutzer mit Wunsch nach App-Steuerung"
  ],

  lessSuitableFor: [
    "Premium-Ansprüche",
    "Komplexe Smart-Home-Integrationen",
    "Mikrochip-Fütterung"
  ],

  customerExperience: {
    summary:
      "WOPET wird häufig für das gute Preis-Leistungs-Verhältnis gelobt. Besonders positiv werden die einfache Bedienung und die große Auswahl hervorgehoben. Kritik betrifft vor allem Unterschiede zwischen einzelnen Modellgenerationen und eine teilweise einfachere App als bei Premium-Herstellern.",

    positives: [
      "Sehr gutes Preis-Leistungs-Verhältnis",
      "Große Produktauswahl",
      "Einfache Einrichtung",
      "Viele WLAN-Modelle",
      "Kameramodelle verfügbar"
    ],

    criticism: [
      "App wirkt teilweise einfacher als bei Premium-Herstellern",
      "Qualität variiert je nach Modell",
      "Softwareupdates erscheinen unregelmäßig",
      "Teilweise unterschiedliche Modellbezeichnungen"
    ],

    supportAssessment:
      "Der Support wird insgesamt ordentlich bewertet. Viele Käufer erhalten schnelle Hilfe bei Einrichtung und Garantie. Einzelne Nutzer berichten jedoch von längeren Bearbeitungszeiten bei internationalen Ersatzteillieferungen."
  },

  alternatives: [
    "petlibro",
    "petkit",
    "cat-mate"
  ],

  faq: [
    {
      question: "Ist WOPET eine gute Marke?",
      answer:
        "WOPET gehört zu den bekanntesten Herstellern automatischer Futterautomaten und überzeugt vor allem mit einem sehr guten Preis-Leistungs-Verhältnis."
    },
    {
      question: "Für wen eignet sich WOPET?",
      answer:
        "Besonders für Käufer, die App-Steuerung und moderne Funktionen zu einem attraktiven Preis suchen."
    },
    {
      question: "Wie gut ist die WOPET App?",
      answer:
        "Die App bietet alle wichtigen Funktionen für Zeitpläne und Fernfütterung. Im Vergleich zu Premium-Herstellern fällt der Funktionsumfang etwas einfacher aus."
    },
    {
      question: "Wie sind die Erfahrungen mit dem Support?",
      answer:
        "Die Erfahrungen sind überwiegend positiv. Bei internationalen Ersatzteillieferungen kann es jedoch vereinzelt zu längeren Wartezeiten kommen."
    },
    {
      question: "Bietet WOPET auch Modelle mit Kamera an?",
      answer:
        "Ja. Besonders die Patrol- und Heritage-Serien verfügen über integrierte Kamerafunktionen."
    }
  ],

  sources: [
    {
      label: "WOPET",
      url: "https://wopet.com"
    },
    {
      label: "WOPET Support",
      url: "https://wopet.com/pages/contact-us"
    },
    {
      label: "Amazon Kundenbewertungen",
      url: "https://www.amazon.de"
    }
  ]
}),
  createManufacturer({
  key: "oneisall",
  name: "oneisall",
  slug: "oneisall",

  description:
    "oneisall entwickelt vor allem Produkte für die Fellpflege von Hunden und Katzen und hat sein Sortiment in den vergangenen Jahren um automatische Futterautomaten erweitert. Die Marke richtet sich vor allem an preisbewusste Tierhalter, die moderne Funktionen zu einem attraktiven Preis suchen.",

  website: "https://oneisall.com",

  focus: [
    "Automatische Futterautomaten",
    "Tierpflege",
    "Preis-Leistungs-Produkte",
    "Haustierzubehör"
  ],

  productCategories: [
    "Futterautomaten",
    "Tierpflege",
    "Haustierzubehör"
  ],

  strengths: [
    "Attraktives Preis-Leistungs-Verhältnis",
    "Einfache Bedienung",
    "Modernes Design",
    "Großes Sortiment für Tierhalter",
    "Leicht verständliche App"
  ],

  limitations: [
    "Kleineres Sortiment an Futterautomaten",
    "Weniger Premiumfunktionen",
    "Noch geringe Markenbekanntheit im Bereich Fütterung"
  ],

  rating: 4.2,

  ratings: {
    innovation: 4.0,
    quality: 4.2,
    app: 4.1,
    support: 4.0,
    value: 4.6
  },

  productAreas: [
    {
      name: "Futterautomaten",
      description:
        "Automatische Trockenfutterautomaten mit App-Steuerung."
    },
    {
      name: "Tierpflege",
      description:
        "Schermaschinen, Fellpflegegeräte und weiteres Zubehör."
    }
  ],

  series: [
    {
      name: "Automatic Feeder",
      suitableFor: "Preisbewusste Käufer",
      description:
        "Automatische Futterautomaten mit App und einfacher Bedienung."
    }
  ],

  suitableFor: [
    "Preisbewusste Käufer",
    "Katzen",
    "Kleine Hunde",
    "Berufstätige"
  ],

  lessSuitableFor: [
    "Premiumsegment",
    "RFID-Fütterung",
    "Kameraüberwachung"
  ],

  customerExperience: {
    summary:
      "oneisall wird vor allem für das gute Preis-Leistungs-Verhältnis und die einfache Einrichtung gelobt. Käufer bewerten die Geräte häufig als unkompliziert und alltagstauglich. Kritik betrifft überwiegend den geringeren Funktionsumfang gegenüber Premium-Herstellern.",

    positives: [
      "Sehr gutes Preis-Leistungs-Verhältnis",
      "Leichte Einrichtung",
      "Moderne Optik",
      "Leiser Betrieb",
      "Übersichtliche App"
    ],

    criticism: [
      "Kleineres Produktsortiment",
      "Weniger Smart-Funktionen",
      "Kaum Speziallösungen"
    ],

    supportAssessment:
      "Die öffentlichen Erfahrungen mit dem Support sind überwiegend positiv. Besonders einfache Garantie- und Einrichtungsfragen werden häufig schnell beantwortet."
  },

  alternatives: [
    "wopet",
    "petlibro",
    "xiaomi"
  ],

  faq: [
    {
      question: "Ist oneisall eine gute Marke?",
      answer:
        "oneisall überzeugt besonders durch ein attraktives Preis-Leistungs-Verhältnis und unkomplizierte Produkte für Tierhalter."
    },
    {
      question: "Für wen eignet sich oneisall?",
      answer:
        "Vor allem für preisbewusste Käufer, die einen modernen Futterautomaten mit einfacher Bedienung suchen."
    },
    {
      question: "Bietet oneisall auch Tierpflegeprodukte an?",
      answer:
        "Ja. Die Marke ist insbesondere für Schermaschinen und Fellpflegeprodukte bekannt."
    },
    {
      question: "Wie sind die Erfahrungen mit dem Support?",
      answer:
        "Die Erfahrungen fallen überwiegend positiv aus. Besonders bei Einrichtungsfragen berichten viele Käufer von schneller Unterstützung."
    },
    {
      question: "Wie schneidet oneisall im Vergleich zu Petlibro oder PETKIT ab?",
      answer:
        "oneisall konzentriert sich stärker auf ein gutes Preis-Leistungs-Verhältnis, während Petlibro und PETKIT ein breiteres Premium-Portfolio mit mehr Spezialfunktionen bieten."
    }
  ],

  sources: [
    {
      label: "oneisall",
      url: "https://oneisall.com"
    },
    {
      label: "Amazon Kundenbewertungen",
      url: "https://www.amazon.de"
    }
  ]
}),
  createManufacturer({
  key: "imipaw",
  name: "IMIPAW",
  slug: "imipaw",

  description:
    "IMIPAW entwickelt automatische Futterautomaten und weiteres Haustierzubehör mit einem klaren Fokus auf einfache Bedienung und ein attraktives Preis-Leistungs-Verhältnis. Die Marke richtet sich vor allem an Tierhalter, die einen unkomplizierten Einstieg in automatische Fütterung suchen.",

  website: "https://imipaw.com",

  focus: [
    "Automatische Futterautomaten",
    "Preis-Leistungs-Produkte",
    "Einfache Bedienung"
  ],

  productCategories: [
    "Futterautomaten",
    "Haustierzubehör"
  ],

  strengths: [
    "Einfache Einrichtung",
    "Attraktive Preise",
    "Leichte Bedienung",
    "Kompakte Bauweise"
  ],

  limitations: [
    "Kleines Produktsortiment",
    "Weniger Smart-Funktionen",
    "Geringe Markenbekanntheit",
    "Kaum Speziallösungen"
  ],

  rating: 4.0,

  ratings: {
    innovation: 3.8,
    quality: 4.0,
    app: 3.9,
    support: 3.8,
    value: 4.5
  },

  productAreas: [
    {
      name: "Futterautomaten",
      description:
        "Automatische Trockenfutterautomaten für Katzen und kleine Hunde."
    },
    {
      name: "Haustierzubehör",
      description:
        "Ergänzende Produkte für den täglichen Einsatz mit Haustieren."
    }
  ],

  series: [
    {
      name: "Automatic Pet Feeder",
      suitableFor: "Preisbewusste Käufer",
      description:
        "Kompakte automatische Futterautomaten mit einfacher Bedienung."
    }
  ],

  suitableFor: [
    "Einsteiger",
    "Preisbewusste Käufer",
    "Katzen",
    "Kleine Hunde"
  ],

  lessSuitableFor: [
    "Premiumansprüche",
    "RFID-Fütterung",
    "Kameraüberwachung",
    "Smart-Home-Enthusiasten"
  ],

  customerExperience: {
    summary:
      "IMIPAW wird häufig als unkomplizierte und preiswerte Lösung beschrieben. Käufer loben insbesondere die einfache Einrichtung und die zuverlässige Portionierung. Kritik richtet sich hauptsächlich gegen den geringeren Funktionsumfang im Vergleich zu Premium-Herstellern.",

    positives: [
      "Sehr einfache Bedienung",
      "Leichte Einrichtung",
      "Gute Preis-Leistung",
      "Zuverlässige Portionierung"
    ],

    criticism: [
      "Wenige Smart-Funktionen",
      "Kleines Produktsortiment",
      "Kaum Premiumfunktionen"
    ],

    supportAssessment:
      "Öffentliche Erfahrungen mit dem Support sind insgesamt positiv, allerdings existieren deutlich weniger Erfahrungsberichte als bei den großen Marken."
  },

  alternatives: [
    "oneisall",
    "wopet",
    "xiaomi"
  ],

  faq: [
    {
      question: "Ist IMIPAW eine gute Marke?",
      answer:
        "IMIPAW bietet solide automatische Futterautomaten mit einem guten Preis-Leistungs-Verhältnis und richtet sich vor allem an Einsteiger."
    },
    {
      question: "Für wen eignet sich IMIPAW?",
      answer:
        "Vor allem für Katzenhalter und kleine Hunde, die einen unkomplizierten Futterautomaten ohne Premiumpreis suchen."
    },
    {
      question: "Wie sind die Erfahrungen mit dem Support?",
      answer:
        "Die vorhandenen Erfahrungsberichte fallen überwiegend positiv aus, die Datenbasis ist jedoch deutlich kleiner als bei etablierten Premium-Herstellern."
    },
    {
      question: "Welche Alternative gibt es zu IMIPAW?",
      answer:
        "Preislich ähnliche Alternativen sind oneisall oder WOPET. Wer mehr Smart-Funktionen sucht, sollte Petlibro oder PETKIT vergleichen."
    }
  ],

  sources: [
    {
      label: "IMIPAW",
      url: "https://imipaw.com"
    },
    {
      label: "Amazon Kundenbewertungen",
      url: "https://www.amazon.de"
    }
  ]
}),
  createManufacturer({
  key: "pawbby",
  name: "PAWBBY",
  slug: "pawbby",

  description:
    "PAWBBY entwickelt smarte Haustierprodukte und gehört zum Xiaomi-Ökosystem. Die Marke konzentriert sich auf moderne, preisgünstige Lösungen für den Alltag und richtet sich insbesondere an Nutzer, die bereits Mi Home oder andere Xiaomi-Produkte verwenden.",

  website: "https://www.pawbby.com",

  focus: [
    "Smarte Futterautomaten",
    "Smart Home",
    "Preis-Leistungs-Produkte"
  ],

  productCategories: [
    "Futterautomaten",
    "Haustierzubehör"
  ],

  strengths: [
    "Sehr gutes Preis-Leistungs-Verhältnis",
    "Moderne Optik",
    "Mi-Home-Integration",
    "Leiser Betrieb"
  ],

  limitations: [
    "Kleines Produktsortiment",
    "Kaum Spezialfunktionen",
    "Außerhalb Asiens noch wenig verbreitet"
  ],

  rating: 4.1,

  ratings: {
    innovation: 4.2,
    quality: 4.1,
    app: 4.2,
    support: 3.9,
    value: 4.6
  },

  productAreas: [
    {
      name: "Futterautomaten",
      description:
        "Automatische Futterautomaten für Katzen und kleine Hunde."
    },
    {
      name: "Smart Home",
      description:
        "Einbindung in das Xiaomi Smart-Home-Umfeld."
    }
  ],

  series: [
    {
      name: "Smart Pet Feeder",
      suitableFor: "Smart-Home-Nutzer",
      description:
        "Kompakte WLAN-Futterautomaten mit App-Steuerung."
    }
  ],

  suitableFor: [
    "Preisbewusste Käufer",
    "Xiaomi-Nutzer",
    "Katzenhalter"
  ],

  lessSuitableFor: [
    "Premiumsegment",
    "RFID-Lösungen",
    "Nassfutter"
  ],

  customerExperience: {
    summary:
      "PAWBBY wird überwiegend als günstige Alternative zu Xiaomi bewertet. Käufer loben insbesondere die einfache Bedienung und das moderne Design. Kritik betrifft vor allem die noch kleine Produktpalette.",

    positives: [
      "Gutes Preis-Leistungs-Verhältnis",
      "Leiser Betrieb",
      "Moderne App",
      "Kompakte Bauform"
    ],

    criticism: [
      "Kleines Sortiment",
      "Noch geringe Markenbekanntheit",
      "Weniger Zusatzfunktionen"
    ],

    supportAssessment:
      "Da PAWBBY eng mit dem Xiaomi-Ökosystem verbunden ist, unterscheiden sich Supportwege je nach Region. Insgesamt fallen die Erfahrungen überwiegend positiv aus."
  },

  alternatives: [
    "xiaomi",
    "oneisall",
    "wopet"
  ],

  faq: [
    {
      question: "Ist PAWBBY eine gute Marke?",
      answer:
        "PAWBBY bietet moderne Smart-Futterautomaten mit gutem Preis-Leistungs-Verhältnis und richtet sich insbesondere an Xiaomi-Nutzer."
    },
    {
      question: "Gehört PAWBBY zu Xiaomi?",
      answer:
        "PAWBBY ist Teil des Xiaomi-Ökosystems und arbeitet eng mit der Mi-Home-Plattform zusammen."
    },
    {
      question: "Für wen eignet sich PAWBBY?",
      answer:
        "Vor allem für preisbewusste Nutzer, die bereits Xiaomi Smart-Home-Produkte verwenden."
    },
    {
      question: "Wie sind die Erfahrungen mit dem Support?",
      answer:
        "Die Erfahrungen sind überwiegend positiv, unterscheiden sich jedoch je nach Region."
    }
  ],

  sources: [
    {
      label: "PAWBBY",
      url: "https://www.pawbby.com"
    },
    {
      label: "Amazon Kundenbewertungen",
      url: "https://www.amazon.de"
    }
  ]
})
] as const satisfies readonly Manufacturer[];

export type ManufacturerSlug = (typeof manufacturers)[number]["slug"];

export function getManufacturerBySlug(slug: string) {
  return manufacturers.find((manufacturer) => manufacturer.slug === slug);
}
