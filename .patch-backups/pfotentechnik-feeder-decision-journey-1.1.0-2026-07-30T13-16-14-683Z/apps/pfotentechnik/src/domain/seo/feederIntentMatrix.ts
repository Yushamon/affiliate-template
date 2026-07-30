export type FeederIntentStage =
  | "hub"
  | "problem"
  | "use-case"
  | "audience"
  | "feature"
  | "comparison"
  | "maintenance";

export type FeederIntentDefinition = {
  id: string;
  stage: FeederIntentStage;
  label: string;
  question: string;
  ownerPatterns: RegExp[];
  relatedPatterns: RegExp[];
  nextCandidates: string[];
};

export const FEEDER_HUB_ROUTE = "/smarte-futterautomaten/";

export const FEEDER_INTENTS: FeederIntentDefinition[] = [
  {
    id: "hub",
    stage: "hub",
    label: "Orientierung",
    question: "Welche Futterautomaten-Art passt grundsätzlich zu meinem Bedarf?",
    ownerPatterns: [/^smarte-futterautomaten$/],
    relatedPatterns: [/futterautomat/i],
    nextCandidates: [
      "/vergleiche/beste-futterautomaten/",
      "/futterautomat-katze/",
      "/futterautomat-hund/",
    ],
  },
  {
    id: "berufstaetige",
    stage: "audience",
    label: "Für Berufstätige",
    question: "Welcher Automat überbrückt Arbeitstage zuverlässig?",
    ownerPatterns: [
      /^futterautomat-fuer-berufstaetige$/,
      /^beste-futterautomaten-fuer-berufstaetige$/,
    ],
    relatedPatterns: [/berufstaet/i, /arbeitstag/i],
    nextCandidates: [
      "/vergleiche/beste-futterautomaten-fuer-berufstaetige/",
      "/futterautomat-im-urlaub/",
      FEEDER_HUB_ROUTE,
    ],
  },
  {
    id: "hund",
    stage: "audience",
    label: "Für Hunde",
    question: "Welcher Futterautomat passt zu Größe, Portion und Fressverhalten des Hundes?",
    ownerPatterns: [/^futterautomat-hund$/, /^beste-futterautomaten-fuer-hunde$/],
    relatedPatterns: [/futterautomat.*hund/i, /hund.*futterautomat/i],
    nextCandidates: [
      "/vergleiche/beste-futterautomaten-fuer-hunde/",
      "/hund-frisst-zu-schnell/",
      FEEDER_HUB_ROUTE,
    ],
  },
  {
    id: "katze",
    stage: "audience",
    label: "Für Katzen",
    question: "Welcher Automat passt zu Futterart, Portionsgröße und Katzenhaushalt?",
    ownerPatterns: [/^futterautomat-katze$/, /^beste-futterautomaten-fuer-katzen$/],
    relatedPatterns: [/futterautomat.*katze/i, /katze.*futterautomat/i],
    nextCandidates: [
      "/vergleiche/beste-futterautomaten-fuer-katzen/",
      "/vergleiche/beste-futterautomaten-fuer-seniorenkatzen/",
      FEEDER_HUB_ROUTE,
    ],
  },
  {
    id: "mehrtierhaushalt",
    stage: "use-case",
    label: "Mehrere Tiere",
    question: "Wie werden Futterzugriff und Portionen bei mehreren Tieren getrennt?",
    ownerPatterns: [/mehrtierhaushalt/i, /mehrere-(katzen|tiere)/i],
    relatedPatterns: [/mehrtier/i, /mehrere.*(katzen|tiere)/i, /mikrochip/i],
    nextCandidates: [
      "/vergleiche/beste-futterautomaten-fuer-mehrtierhaushalte/",
      "/vergleiche/mikrochip-futterautomaten/",
      FEEDER_HUB_ROUTE,
    ],
  },
  {
    id: "nassfutter",
    stage: "feature",
    label: "Nassfutter",
    question: "Wie bleibt Nassfutter bis zur Fütterung sicher und frisch?",
    ownerPatterns: [/nassfutterautomat/i, /futterautomat.*nassfutter/i],
    relatedPatterns: [/nassfutter/i, /kuehl/i],
    nextCandidates: [
      "/vergleiche/nassfutterautomaten/",
      "/futterautomat-nassfutter/",
      FEEDER_HUB_ROUTE,
    ],
  },
  {
    id: "ohne-wlan",
    stage: "feature",
    label: "Ohne WLAN",
    question: "Welcher Automat funktioniert zuverlässig ohne Cloud oder WLAN?",
    ownerPatterns: [/ohne-wlan/i, /offline/i],
    relatedPatterns: [/ohne-wlan/i, /offline/i, /ohne-app/i],
    nextCandidates: [
      "/vergleiche/beste-futterautomaten-ohne-wlan/",
      "/futterautomat-ohne-wlan/",
      FEEDER_HUB_ROUTE,
    ],
  },
  {
    id: "akku",
    stage: "feature",
    label: "Mit Akku",
    question: "Welcher Automat bleibt bei Stromausfall oder ohne Steckdose nutzbar?",
    ownerPatterns: [/mit-akku/i, /akku/i],
    relatedPatterns: [/akku/i, /batterie/i, /stromausfall/i],
    nextCandidates: [
      "/vergleiche/beste-futterautomaten-mit-akku/",
      FEEDER_HUB_ROUTE,
    ],
  },
  {
    id: "kamera",
    stage: "feature",
    label: "Mit Kamera",
    question: "Wann bringt eine Kamera echten Mehrwert bei der Fütterung?",
    ownerPatterns: [/mit-kamera/i, /kamera.*futterautomat/i],
    relatedPatterns: [/kamera/i, /video/i],
    nextCandidates: [
      "/vergleiche/beste-futterautomaten-mit-kamera/",
      FEEDER_HUB_ROUTE,
    ],
  },
  {
    id: "budget",
    stage: "comparison",
    label: "Nach Budget",
    question: "Welche Modelle bieten im gesetzten Budget die sinnvollsten Funktionen?",
    ownerPatterns: [/unter-\d+-euro/i, /guenstig/i, /budget/i],
    relatedPatterns: [/unter-\d+-euro/i, /guenstig/i, /budget/i],
    nextCandidates: [
      "/vergleiche/beste-futterautomaten-unter-100-euro/",
      FEEDER_HUB_ROUTE,
    ],
  },
  {
    id: "fressverhalten",
    stage: "problem",
    label: "Fressverhalten",
    question: "Wie lassen sich Schlingen, unregelmäßige Fütterung oder Futterneid lösen?",
    ownerPatterns: [/hund-frisst-zu-schnell/i, /schling/i, /futterneid/i],
    relatedPatterns: [/frisst-zu-schnell/i, /schling/i, /futterneid/i],
    nextCandidates: [
      "/hund-frisst-zu-schnell/",
      "/vergleiche/beste-futterautomaten-fuer-hunde/",
      FEEDER_HUB_ROUTE,
    ],
  },
  {
    id: "urlaub",
    stage: "use-case",
    label: "Urlaub und Abwesenheit",
    question: "Was kann ein Futterautomat während Abwesenheit leisten – und was nicht?",
    ownerPatterns: [/futterautomat-im-urlaub/i, /urlaub/i, /abwesenheit/i],
    relatedPatterns: [/urlaub/i, /abwesenheit/i],
    nextCandidates: [
      "/futterautomat-im-urlaub/",
      "/vergleiche/beste-futterautomaten-fuer-berufstaetige/",
      FEEDER_HUB_ROUTE,
    ],
  },
  {
    id: "pflege",
    stage: "maintenance",
    label: "Reinigung und Betrieb",
    question: "Wie bleibt der Automat hygienisch, leise und zuverlässig?",
    ownerPatterns: [/reinig/i, /hygiene/i, /wie-laut/i, /wartung/i],
    relatedPatterns: [/reinig/i, /hygiene/i, /laut/i, /wartung/i],
    nextCandidates: [
      "/wie-laut-sind-automatische-futterautomaten/",
      FEEDER_HUB_ROUTE,
    ],
  },
];

export function normalizeFeederRoute(value: string): string {
  const route = value.startsWith("/") ? value : `/${value}`;
  return route.endsWith("/") ? route : `${route}/`;
}

export function getFeederIntent(slug: string): FeederIntentDefinition | null {
  const normalized = slug.replace(/^\/|\/$/g, "");

  return (
    FEEDER_INTENTS.find((intent) =>
      intent.ownerPatterns.some((pattern) => pattern.test(normalized)),
    ) ??
    FEEDER_INTENTS.find((intent) =>
      intent.relatedPatterns.some((pattern) => pattern.test(normalized)),
    ) ??
    (/futterautomat/i.test(normalized) ? FEEDER_INTENTS[0] : null)
  );
}

export function buildFeederJourney(
  slug: string,
  availableRoutes: Iterable<string>,
): Array<{ href: string; label: string; kind: string }> {
  const intent = getFeederIntent(slug);
  if (!intent) return [];

  const routes = new Set(
    [...availableRoutes].map((route) => normalizeFeederRoute(route)),
  );
  const current = normalizeFeederRoute(slug);

  const candidates = [
    ...intent.nextCandidates,
    ...(intent.id === "hub" ? [] : [FEEDER_HUB_ROUTE]),
  ];

  const labels = new Map<string, string>([
    ["/smarte-futterautomaten/", "Grundlagen und Auswahlkriterien"],
    ["/vergleiche/beste-futterautomaten/", "Alle Modelle vergleichen"],
    ["/vergleiche/beste-futterautomaten-fuer-hunde/", "Futterautomaten für Hunde vergleichen"],
    ["/vergleiche/beste-futterautomaten-fuer-katzen/", "Futterautomaten für Katzen vergleichen"],
    ["/vergleiche/beste-futterautomaten-fuer-berufstaetige/", "Modelle für lange Arbeitstage vergleichen"],
    ["/vergleiche/beste-futterautomaten-fuer-mehrtierhaushalte/", "Lösungen für mehrere Tiere vergleichen"],
    ["/vergleiche/beste-futterautomaten-ohne-wlan/", "Offline-Modelle vergleichen"],
    ["/vergleiche/beste-futterautomaten-mit-akku/", "Akku-Modelle vergleichen"],
    ["/vergleiche/beste-futterautomaten-mit-kamera/", "Kamera-Modelle vergleichen"],
    ["/vergleiche/beste-futterautomaten-unter-100-euro/", "Modelle unter 100 Euro vergleichen"],
    ["/hund-frisst-zu-schnell/", "Schlingen gezielt einordnen"],
    ["/futterautomat-im-urlaub/", "Grenzen bei Abwesenheit prüfen"],
  ]);

  return [...new Set(candidates.map(normalizeFeederRoute))]
    .filter((route) => route !== current && routes.has(route))
    .slice(0, 3)
    .map((href) => ({
      href,
      label: labels.get(href) ?? "Passenden nächsten Schritt öffnen",
      kind: href.startsWith("/vergleiche/") ? "Vergleich" : "Ratgeber",
    }));
}
