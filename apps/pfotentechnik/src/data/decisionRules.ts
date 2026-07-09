
type DecisionSource = {
  label: string;
  href: string;
};

type DecisionRule = {
  id: string;
  title: string;
  description: string;
  requiredUseCases?: string[];
  weights: Record<string, number>;
  limit: number;
  summary?: string[];
  suitableFor?: string[];
  notSuitableFor?: string[];
  checklist?: string[];
  commonMistakes?: string[];
  alternatives?: Array<{
    label: string;
    text: string;
  }>;
  decisionTree?: string[];
  sources?: DecisionSource[];
};

type DecisionRuleMap = Record<string, DecisionRule>;

export const decisionRules: DecisionRuleMap = {
  kleineHunde: {
    id: "kleineHunde",
    title: "Futterautomaten für kleine Hunde",
    description:
      "Empfehlungen für kleine Hunde mit Fokus auf zuverlässige Portionierung, einfache Reinigung und gutes Preis-Leistungs-Verhältnis.",
    requiredUseCases: ["hund"],
    weights: {
      portionierung: 3,
      reinigung: 2,
      zuverlaessigkeit: 2,
      preisleistung: 2,
      sicherheit: 1
    },
    limit: 3
  },

  welpen: {
    id: "welpen",
    title: "Futterautomaten für Welpen",
    description:
      "Empfehlungen für Welpen mit Fokus auf kleine Portionen, zuverlässige Fütterungspläne und einfache Bedienung.",
    requiredUseCases: ["hund", "portionierung"],
    weights: {
      portionierung: 4,
      zuverlaessigkeit: 3,
      reinigung: 2,
      sicherheit: 2,
      app: 1
    },
    limit: 3,
    summary: [
      "Ein Futterautomat eignet sich besonders für Welpen mit mehreren kleinen Mahlzeiten pro Tag.",
      "Wichtiger als ein großer Vorratsbehälter sind zuverlässige Portionierung und einfache Reinigung.",
      "Modelle mit App erleichtern Anpassungen im Alltag, sind aber kein Muss.",
      "Ein Futterautomat ersetzt keine Betreuung oder tierärztliche Beratung."
    ],
    suitableFor: [
      "Welpen mit mehreren Mahlzeiten täglich",
      "Berufstätige Hundebesitzer",
      "Familien mit festen Fütterungsroutinen",
      "Haushalte, in denen mehrere Personen denselben Fütterungsplan nutzen"
    ],
    notSuitableFor: [
      "Welpen mit akuten gesundheitlichen Auffälligkeiten",
      "Haushalte, die überwiegend Nassfutter oder BARF füttern",
      "Sehr junge Welpen, die noch eng begleitet werden müssen"
    ],
    checklist: [
      "Unterstützt der Automat die gewünschte Anzahl täglicher Mahlzeiten?",
      "Lassen sich kleine Portionen zuverlässig einstellen?",
      "Ist der Futternapf leicht zu reinigen?",
      "Gibt es eine Notstrom- oder Batterie-Absicherung?",
      "Passt der Automat zur verwendeten Futterart?"
    ],
    commonMistakes: [
      "Einen Automaten wählen, der nur sehr große Portionen ausgeben kann.",
      "Die Reinigung zu unterschätzen.",
      "Ausschließlich nach dem Preis zu entscheiden.",
      "Die Stromversorgung und mögliche Backup-Lösungen nicht zu berücksichtigen.",
      "Den Futterautomaten als Ersatz für Betreuung oder Beobachtung zu betrachten."
    ],
    alternatives: [
      {
        label: "Manuelle Fütterung",
        text: "Sinnvoll, wenn der Welpe noch sehr jung ist oder eng begleitet werden soll."
      },
      {
        label: "Nassfutterautomat",
        text: "Sinnvoll, wenn hauptsächlich Nassfutter genutzt wird."
      },
      {
        label: "Slow Feeder",
        text: "Sinnvoll, wenn der Welpe sehr schnell frisst."
      },
      {
        label: "Fütterung durch Betreuungsperson",
        text: "Sinnvoll, wenn der Welpe noch nicht zuverlässig allein bleiben kann."
      }
    ],
    decisionTree: [
      "Mehrere kleine Portionen täglich: Achte besonders auf Portionierungsgenauigkeit.",
      "Häufig allein zu Hause: Ein Modell mit App kann sinnvoll sein.",
      "Ausschließlich Nassfutter: Prüfe spezielle Nassfutterautomaten.",
      "Neigung zum Schlingen: Ziehe zusätzlich einen Slow Feeder in Betracht."
    ],
    sources: [
      {
        label: "FEDIAF – Nutritional Guidelines",
        href: "https://europeanpetfood.org/self-regulation/nutritional-guidelines/"
      },
      {
        label: "WSAVA – Global Nutrition Guidelines",
        href: "https://wsava.org/global-guidelines/global-nutrition-guidelines/"
      },
      {
        label: "AAHA – Nutrition and Weight Management Guidelines",
        href: "https://www.aaha.org/resources/2021-aaha-nutrition-and-weight-management-guidelines/home/"
      }
    ]
  },

  seniorenkatzen: {
    id: "seniorenkatzen",
    title: "Futterautomaten für Seniorenkatzen",
    description:
      "Empfehlungen für ältere Katzen mit Fokus auf Routine, einfache Reinigung und zuverlässige Fütterung.",
    requiredUseCases: ["katze"],
    weights: {
      zuverlaessigkeit: 3,
      reinigung: 3,
      portionierung: 2,
      sicherheit: 2,
      app: 1
    },
    limit: 3
  },

  berufstaetige: {
    id: "berufstaetige",
    title: "Futterautomaten für Berufstätige",
    description:
      "Empfehlungen für planbare Fütterung während Arbeitstagen, Homeoffice oder längerer Abwesenheit.",
    requiredUseCases: ["app"],
    weights: {
      app: 4,
      zuverlaessigkeit: 3,
      portionierung: 2,
      sicherheit: 2,
      preisleistung: 1
    },
    limit: 3
  },

  mehrtierhaushalte: {
    id: "mehrtierhaushalte",
    title: "Futterautomaten für Mehrtierhaushalte",
    description:
      "Empfehlungen für Haushalte mit mehreren Tieren, Futterneid oder unterschiedlichem Fressverhalten.",
    requiredUseCases: ["mehrere-tiere"],
    weights: {
      sicherheit: 3,
      zuverlaessigkeit: 3,
      portionierung: 2,
      app: 2,
      reinigung: 1
    },
    limit: 3
  },

  unter100: {
    id: "unter100",
    title: "Futterautomaten unter 100 Euro",
    description:
      "Preisbewusste Empfehlungen mit Fokus auf solide Grundfunktionen und gutes Preis-Leistungs-Verhältnis.",
    requiredUseCases: ["preisleistung"],
    weights: {
      preisleistung: 4,
      zuverlaessigkeit: 2,
      portionierung: 2,
      reinigung: 1,
      sicherheit: 1
    },
    limit: 3
  },

  unter200: {
    id: "unter200",
    title: "Futterautomaten unter 200 Euro",
    description:
      "Empfehlungen im mittleren Preisbereich mit stärkerem Fokus auf App, Komfort und Alltagstauglichkeit.",
    weights: {
      preisleistung: 3,
      app: 2,
      portionierung: 2,
      zuverlaessigkeit: 2,
      reinigung: 1
    },
    limit: 3
  },

  akku: {
    id: "akku",
    title: "Futterautomaten mit Akku oder Backup",
    description:
      "Empfehlungen für Haushalte, in denen Stromausfälle oder flexible Platzierung eine Rolle spielen.",
    requiredUseCases: ["batteriebetrieb"],
    weights: {
      zuverlaessigkeit: 3,
      sicherheit: 3,
      portionierung: 2,
      preisleistung: 1,
      reinigung: 1
    },
    limit: 3
  },

  edelstahlNapf: {
    id: "edelstahlNapf",
    title: "Futterautomaten mit Edelstahlnapf",
    description:
      "Empfehlungen für Nutzer, denen Reinigung, Hygiene und robuste Futterschalen besonders wichtig sind.",
    weights: {
      reinigung: 4,
      sicherheit: 2,
      zuverlaessigkeit: 2,
      preisleistung: 1,
      portionierung: 1
    },
    limit: 3
  },

  gegenSchlingen: {
    id: "gegenSchlingen",
    title: "Futterautomaten gegen Schlingen",
    description:
      "Empfehlungen für Tiere, die zu schnellem Fressen neigen und von kleineren Portionen profitieren können.",
    requiredUseCases: ["portionierung"],
    weights: {
      portionierung: 4,
      sicherheit: 3,
      zuverlaessigkeit: 2,
      reinigung: 1
    },
    limit: 3
  }
};