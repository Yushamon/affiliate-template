type DecisionRule = {
  id: string;
  title: string;
  description: string;
  requiredUseCases?: string[];
  weights: Record<string, number>;
  limit: number;
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
    limit: 3
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