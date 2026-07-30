export type FeederDecisionStage =
  | "orientation"
  | "problem"
  | "evaluation"
  | "decision"
  | "support";

export type FeederIntentDefinition = {
  id: string;
  stage: FeederDecisionStage;
  label: string;
  question: string;
  ownerPatterns: RegExp[];
  relatedPatterns: RegExp[];
  nextCandidates: string[];
  fallbackCandidates: string[];
};

export const FEEDER_HUB_ROUTE = "/smarte-futterautomaten/";

export const FEEDER_INTENTS: FeederIntentDefinition[] = [
  {
    id: "hub",
    stage: "orientation",
    label: "Orientierung",
    question: "Welche Art Futterautomat passt grundsätzlich zu deinem Bedarf?",
    ownerPatterns: [/^smarte-futterautomaten$/],
    relatedPatterns: [/futterautomat/i],
    nextCandidates: [
      "/vergleiche/beste-futterautomaten/",
      "/futterautomat-katze/",
      "/futterautomat-hund/",
    ],
    fallbackCandidates: [],
  },
  {
    id: "berufstaetige",
    stage: "problem",
    label: "Lange Arbeitstage",
    question: "Welche Lösung überbrückt Arbeitstage zuverlässig, ohne Betreuung vorzutäuschen?",
    ownerPatterns: [
      /^futterautomat-fuer-berufstaetige$/,
      /^beste-futterautomaten-fuer-berufstaetige$/,
    ],
    relatedPatterns: [/berufstaet/i, /arbeitstag/i],
    nextCandidates: [
      "/vergleiche/beste-futterautomaten-fuer-berufstaetige/",
      "/futterautomat-im-urlaub/",
    ],
    fallbackCandidates: [FEEDER_HUB_ROUTE],
  },
  {
    id: "hund",
    stage: "evaluation",
    label: "Für Hunde",
    question: "Welcher Automat passt zu Größe, Portion und Fressverhalten des Hundes?",
    ownerPatterns: [/^futterautomat-hund$/, /^beste-futterautomaten-fuer-hunde$/],
    relatedPatterns: [/futterautomat.*hund/i, /hund.*futterautomat/i],
    nextCandidates: [
      "/vergleiche/beste-futterautomaten-fuer-hunde/",
      "/hund-frisst-zu-schnell/",
    ],
    fallbackCandidates: [FEEDER_HUB_ROUTE],
  },
  {
    id: "katze",
    stage: "evaluation",
    label: "Für Katzen",
    question: "Welcher Automat passt zu Futterart, Portion und Katzenhaushalt?",
    ownerPatterns: [/^futterautomat-katze$/, /^beste-futterautomaten-fuer-katzen$/],
    relatedPatterns: [/futterautomat.*katze/i, /katze.*futterautomat/i],
    nextCandidates: [
      "/vergleiche/beste-futterautomaten-fuer-katzen/",
      "/vergleiche/beste-futterautomaten-fuer-seniorenkatzen/",
    ],
    fallbackCandidates: [FEEDER_HUB_ROUTE],
  },
  {
    id: "mehrtierhaushalt",
    stage: "problem",
    label: "Mehrere Tiere",
    question: "Wie werden Futterzugriff und Portionen bei mehreren Tieren sinnvoll getrennt?",
    ownerPatterns: [/mehrtierhaushalt/i, /mehrere-(katzen|tiere)/i],
    relatedPatterns: [/mehrtier/i, /mehrere.*(katzen|tiere)/i, /mikrochip/i],
    nextCandidates: [
      "/vergleiche/beste-futterautomaten-fuer-mehrtierhaushalte/",
      "/vergleiche/mikrochip-futterautomaten/",
    ],
    fallbackCandidates: [FEEDER_HUB_ROUTE],
  },
  {
    id: "nassfutter",
    stage: "evaluation",
    label: "Nassfutter",
    question: "Welche Technik hält Nassfutter bis zur Fütterung ausreichend frisch?",
    ownerPatterns: [/nassfutterautomat/i, /futterautomat.*nassfutter/i],
    relatedPatterns: [/nassfutter/i, /kuehl/i],
    nextCandidates: [
      "/vergleiche/nassfutterautomaten/",
      "/futterautomat-nassfutter/",
    ],
    fallbackCandidates: [FEEDER_HUB_ROUTE],
  },
  {
    id: "ohne-wlan",
    stage: "evaluation",
    label: "Ohne WLAN",
    question: "Welcher Automat funktioniert zuverlässig ohne Cloud, App oder WLAN?",
    ownerPatterns: [/ohne-wlan/i, /offline/i],
    relatedPatterns: [/ohne-wlan/i, /offline/i, /ohne-app/i],
    nextCandidates: [
      "/vergleiche/beste-futterautomaten-ohne-wlan/",
      "/futterautomat-ohne-wlan/",
    ],
    fallbackCandidates: [FEEDER_HUB_ROUTE],
  },
  {
    id: "akku",
    stage: "evaluation",
    label: "Mit Akku",
    question: "Welches Modell bleibt bei Stromausfall oder ohne Steckdose nutzbar?",
    ownerPatterns: [/mit-akku/i, /akku/i],
    relatedPatterns: [/akku/i, /batterie/i, /stromausfall/i],
    nextCandidates: ["/vergleiche/beste-futterautomaten-mit-akku/"],
    fallbackCandidates: [FEEDER_HUB_ROUTE],
  },
  {
    id: "kamera",
    stage: "evaluation",
    label: "Mit Kamera",
    question: "Wann bringt eine Kamera bei der Fütterung tatsächlich Mehrwert?",
    ownerPatterns: [/mit-kamera/i, /kamera.*futterautomat/i],
    relatedPatterns: [/kamera/i, /video/i],
    nextCandidates: ["/vergleiche/beste-futterautomaten-mit-kamera/"],
    fallbackCandidates: [FEEDER_HUB_ROUTE],
  },
  {
    id: "budget",
    stage: "decision",
    label: "Budgetentscheidung",
    question: "Welche Modelle liefern innerhalb des Budgets die sinnvollste Ausstattung?",
    ownerPatterns: [/unter-\d+-euro/i, /guenstig/i, /budget/i],
    relatedPatterns: [/unter-\d+-euro/i, /guenstig/i, /budget/i],
    nextCandidates: ["/vergleiche/beste-futterautomaten-unter-100-euro/"],
    fallbackCandidates: [FEEDER_HUB_ROUTE],
  },
  {
    id: "fressverhalten",
    stage: "problem",
    label: "Fressverhalten",
    question: "Hilft hier ein Automat, eine andere Fütterungsroutine oder ein Slow Feeder?",
    ownerPatterns: [/hund-frisst-zu-schnell/i, /schling/i, /futterneid/i],
    relatedPatterns: [/frisst-zu-schnell/i, /schling/i, /futterneid/i],
    nextCandidates: [
      "/hund-frisst-zu-schnell/",
      "/vergleiche/beste-futterautomaten-fuer-hunde/",
    ],
    fallbackCandidates: [FEEDER_HUB_ROUTE],
  },
  {
    id: "urlaub",
    stage: "problem",
    label: "Urlaub und Abwesenheit",
    question: "Was kann ein Automat während Abwesenheit leisten – und wo braucht es Betreuung?",
    ownerPatterns: [/futterautomat-im-urlaub/i, /urlaub/i, /abwesenheit/i],
    relatedPatterns: [/urlaub/i, /abwesenheit/i],
    nextCandidates: [
      "/futterautomat-im-urlaub/",
      "/vergleiche/beste-futterautomaten-fuer-berufstaetige/",
    ],
    fallbackCandidates: [FEEDER_HUB_ROUTE],
  },
  {
    id: "pflege",
    stage: "support",
    label: "Betrieb und Pflege",
    question: "Wie bleibt der Automat hygienisch, leise und zuverlässig?",
    ownerPatterns: [/reinig/i, /hygiene/i, /wie-laut/i, /wartung/i],
    relatedPatterns: [/reinig/i, /hygiene/i, /laut/i, /wartung/i],
    nextCandidates: [
      "/futterautomat-richtig-reinigen/",
      "/wie-laut-sind-automatische-futterautomaten/",
    ],
    fallbackCandidates: [FEEDER_HUB_ROUTE],
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

const LABELS = new Map<string, string>([
  ["/smarte-futterautomaten/", "Auswahlkriterien neu einordnen"],
  ["/vergleiche/beste-futterautomaten/", "Alle relevanten Modelle vergleichen"],
  ["/vergleiche/beste-futterautomaten-fuer-hunde/", "Modelle für Hunde vergleichen"],
  ["/vergleiche/beste-futterautomaten-fuer-katzen/", "Modelle für Katzen vergleichen"],
  ["/vergleiche/beste-futterautomaten-fuer-berufstaetige/", "Modelle für lange Arbeitstage vergleichen"],
  ["/vergleiche/beste-futterautomaten-fuer-mehrtierhaushalte/", "Lösungen für mehrere Tiere vergleichen"],
  ["/vergleiche/beste-futterautomaten-ohne-wlan/", "Offline-Modelle vergleichen"],
  ["/vergleiche/beste-futterautomaten-mit-akku/", "Akku-Modelle vergleichen"],
  ["/vergleiche/beste-futterautomaten-mit-kamera/", "Kamera-Modelle vergleichen"],
  ["/vergleiche/beste-futterautomaten-unter-100-euro/", "Modelle unter 100 Euro vergleichen"],
  ["/hund-frisst-zu-schnell/", "Schlingen und Fütterungsroutine prüfen"],
  ["/futterautomat-im-urlaub/", "Grenzen bei Abwesenheit prüfen"],
  ["/futterautomat-richtig-reinigen/", "Reinigung und Hygiene vertiefen"],
]);

export function buildFeederDecisionJourney(
  slug: string,
  availableRoutes: Iterable<string>,
): Array<{ href: string; label: string; kind: "Ratgeber" | "Vergleich" }> {
  const intent = getFeederIntent(slug);
  if (!intent) return [];

  const routes = new Set(
    [...availableRoutes].map((route) => normalizeFeederRoute(route)),
  );
  const current = normalizeFeederRoute(slug);

  return [
    ...intent.nextCandidates,
    ...intent.fallbackCandidates,
  ]
    .map(normalizeFeederRoute)
    .filter((route, index, all) => all.indexOf(route) === index)
    .filter((route) => route !== current && routes.has(route))
    .slice(0, 3)
    .map((href) => ({
      href,
      label: LABELS.get(href) ?? "Passenden nächsten Schritt öffnen",
      kind: href.startsWith("/vergleiche/") ? "Vergleich" : "Ratgeber",
    }));
}
