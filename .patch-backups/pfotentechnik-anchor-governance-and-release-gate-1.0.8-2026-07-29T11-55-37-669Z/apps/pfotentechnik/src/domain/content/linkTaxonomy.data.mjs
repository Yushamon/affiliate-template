/**
 * Zentrale Datenbasis für Inline-Links, Related Content, Next Steps,
 * Content Graph, SEO-Co-Pilot und Audit. Nur anchorAliases werden verlinkt.
 */
export const BLOCKED_ANCHORS = [
  "Hund", "Hunde", "Katze", "Katzen", "Tier", "Tiere", "App", "Kamera",
  "Wasser", "Futter", "Nassfutter", "Trockenfutter", "Akku", "Filter",
  "Reinigung", "Vergleich", "Test", "Ratgeber", "Kaufberatung", "Produkt",
  "Hersteller"
];

export const LINK_TAXONOMY = [
  {
    id: "hub:futterautomaten",
    href: "/smarte-futterautomaten/",
    title: "Smarte Futterautomaten",
    targetGroup: "hub",
    topics: ["futterautomaten", "haustiertechnik"],
    anchorAliases: [
      "Futterautomat", "Futterautomaten", "smarter Futterautomat",
      "smarte Futterautomaten", "Fütterungsautomat", "Fütterungsautomaten",
      "automatischer Futterspender", "automatische Futterspender", "Napfautomat",
      "Napfautomaten"
    ],
    exclusiveAnchors: ["Futterautomat", "Futterautomaten"],
    contextTerms: [
      "Mikrochip-Futterautomat", "RFID-Futterautomat", "Zugangskontrolle",
      "Futterklau", "Doppelnapf", "Portionierung", "Batterie-Backup",
      "Stromausfall", "Offline-Betrieb", "Nassfutter", "Trockenfutter",
      "Hund", "Katze", "App", "Kamera"
    ],
    intentTerms: ["Überblick", "Orientierung", "Grundlagen"],
    priority: "high",
    cornerstone: true
  },
  {
    id: "knowledge:futterautomat-hund",
    href: "/futterautomat-hund/",
    title: "Futterautomat für Hunde",
    targetGroup: "knowledge",
    topics: ["futterautomaten", "hunde"],
    anchorAliases: ["Futterautomat für Hunde", "Futterautomaten für Hunde"],
    contextTerms: ["Hund", "Hunde", "Portionsgröße", "große Hunde"],
    intentTerms: ["Kaufberatung", "welcher", "passend"],
    priority: "high"
  },
  {
    id: "knowledge:futterautomat-nassfutter",
    href: "/vergleiche/beste-futterautomaten-fuer-nassfutter/",
    title: "Futterautomat für Nassfutter",
    targetGroup: "knowledge",
    topics: ["futterautomaten", "ernaehrung", "nassfutter"],
    anchorAliases: ["Futterautomat für Nassfutter", "Futterautomaten für Nassfutter"],
    contextTerms: ["Nassfutter", "Kühlung", "Hygiene", "Reinigung"],
    intentTerms: ["Kaufberatung", "welcher", "passend"],
    priority: "high"
  },
  {
    id: "knowledge:futterautomat-kamera",
    href: "/vergleiche/beste-futterautomaten-mit-kamera/",
    title: "Futterautomat mit Kamera",
    targetGroup: "knowledge",
    topics: ["futterautomaten", "haustierkameras"],
    anchorAliases: ["Futterautomat mit Kamera", "Futterautomaten mit Kamera", "Futterkamera"],
    contextTerms: ["Kamera", "App", "Livebild", "Zwei-Wege-Audio"],
    intentTerms: ["Kaufberatung", "Funktionen"],
    priority: "normal"
  },
  {
    id: "comparison:beste-futterautomaten-hunde",
    href: "/vergleiche/beste-futterautomaten-fuer-hunde/",
    title: "Beste Futterautomaten für Hunde",
    targetGroup: "comparison",
    topics: ["futterautomaten", "hunde"],
    anchorAliases: [
      "beste Futterautomaten für Hunde", "Futterautomaten für Hunde im Vergleich",
      "Futterautomaten für Hunde vergleichen"
    ],
    contextTerms: ["Hund", "Hunde", "Modelle", "Testsieger"],
    intentTerms: ["vergleichen", "beste Modelle", "Testsieger", "Kaufentscheidung"],
    priority: "high"
  },
  {
    id: "comparison:beste-futterautomaten-nassfutter",
    href: "/vergleiche/beste-futterautomaten-fuer-nassfutter/",
    title: "Beste Futterautomaten für Nassfutter",
    targetGroup: "comparison",
    topics: ["futterautomaten", "nassfutter"],
    anchorAliases: [
      "beste Futterautomaten für Nassfutter", "Futterautomaten für Nassfutter im Vergleich"
    ],
    contextTerms: ["Nassfutter", "Kühlung", "Modelle"],
    intentTerms: ["vergleichen", "beste Modelle", "Testsieger"],
    priority: "high"
  },
  {
    id: "hub:trinkbrunnen",
    href: "/trinkbrunnen/",
    title: "Trinkbrunnen für Haustiere",
    targetGroup: "hub",
    topics: ["trinkbrunnen", "haustiertechnik"],
    anchorAliases: ["Trinkbrunnen", "Haustierbrunnen", "Wasserbrunnen für Haustiere", "Trinkstation für Haustiere"],
    exclusiveAnchors: ["Trinkbrunnen"],
    contextTerms: [
      "Katzenbrunnen", "Hundebrunnen", "Wasserbrunnen", "Trinkstation", "Wasserspender",
      "Biofilm", "Filterwechsel", "Pumpe", "Kalk", "UVC", "Edelstahl", "Keramik",
      "Sensorbetrieb", "Akkubetrieb", "Wasser", "Filter", "Reinigung"
    ],
    intentTerms: ["Überblick", "Orientierung", "Grundlagen"],
    priority: "high",
    cornerstone: true
  },
  {
    id: "knowledge:trinkbrunnen-hund",
    href: "/trinkbrunnen-hund/",
    title: "Trinkbrunnen für Hunde",
    targetGroup: "knowledge",
    topics: ["trinkbrunnen", "hunde"],
    anchorAliases: ["Trinkbrunnen für Hunde", "Hundebrunnen"],
    contextTerms: ["Hund", "Hunde", "Trinkmenge"],
    intentTerms: ["Kaufberatung", "sinnvoll", "passend"],
    priority: "high"
  },
  {
    id: "knowledge:trinkbrunnen-katze",
    href: "/trinkbrunnen-fuer-katzen-sinnvoll/",
    title: "Trinkbrunnen für Katzen",
    targetGroup: "knowledge",
    topics: ["trinkbrunnen", "katzen"],
    anchorAliases: ["Trinkbrunnen für Katzen", "Katzenbrunnen für Katzen"],
    contextTerms: ["Katze", "Katzen", "Trinkmenge", "Niere"],
    intentTerms: ["sinnvoll", "Vorteile", "Gesundheit"],
    priority: "normal"
  },
  {
    id: "comparison:beste-trinkbrunnen-katzen",
    href: "/vergleiche/beste-trinkbrunnen-fuer-katzen/",
    title: "Beste Trinkbrunnen für Katzen",
    targetGroup: "comparison",
    topics: ["trinkbrunnen", "katzen"],
    anchorAliases: ["beste Trinkbrunnen für Katzen", "Trinkbrunnen für Katzen im Vergleich", "Katzenbrunnen im Vergleich"],
    contextTerms: ["Katze", "Katzen", "Modelle", "Material"],
    intentTerms: ["vergleichen", "beste Modelle", "Testsieger"],
    priority: "high"
  },
  {
    id: "hub:gps-tracker",
    href: "/gps-tracker/",
    title: "GPS-Tracker für Hunde und Katzen",
    targetGroup: "hub",
    topics: ["gps-tracker", "haustiertechnik"],
    anchorAliases: ["GPS-Tracker", "GPS Tracker", "Haustiertracker", "Tiertracker", "GPS-Ortungsgerät"],
    exclusiveAnchors: ["GPS-Tracker", "GPS Tracker"],
    contextTerms: [
      "Mobilfunktracker", "VHF-Tracker", "Bluetooth-Tag", "Ortungsgerät", "Tierortung",
      "Geozaun", "GPS-Genauigkeit", "Reichweite", "Abo", "Halsbandbefestigung", "Datenschutz",
      "Hund", "Katze", "Akku"
    ],
    intentTerms: ["Überblick", "Orientierung", "Grundlagen"],
    priority: "high",
    cornerstone: true
  },
  {
    id: "knowledge:gps-ohne-abo",
    href: "/vergleiche/gps-tracker-ohne-abo/",
    title: "GPS-Tracker ohne Abo",
    targetGroup: "knowledge",
    topics: ["gps-tracker", "abo"],
    anchorAliases: ["GPS-Tracker ohne Abo", "GPS Tracker ohne Abo"],
    contextTerms: ["Abo", "Mobilfunk", "laufende Kosten", "VHF"],
    intentTerms: ["ohne Abo", "Kosten", "Alternative"],
    priority: "high"
  },
  {
    id: "hub:haustiertechnik",
    href: "/smarte-haustiertechnik/",
    title: "Smarte Haustiertechnik",
    targetGroup: "hub",
    topics: ["haustiertechnik"],
    anchorAliases: ["smarte Haustiertechnik", "Smart Pet Tech", "Pet Tech"],
    exclusiveAnchors: ["smarte Haustiertechnik", "Pet Tech"],
    contextTerms: [
      "Futterautomaten", "Trinkbrunnen", "GPS-Tracker", "Haustierkamera",
      "smarte Katzenklappe", "automatische Katzentoilette", "Aktivitätstracker", "Gesundheitstracker"
    ],
    intentTerms: ["Überblick", "Orientierung", "Technik"],
    priority: "high",
    cornerstone: true
  },
  {
    id: "topic:haustierkameras",
    href: null,
    title: "Haustierkameras",
    targetGroup: "knowledge",
    topics: ["haustierkameras", "haustiertechnik"],
    anchorAliases: [],
    contextTerms: ["Haustierkamera", "Futterkamera", "Kamera", "App", "Livebild"],
    intentTerms: ["Überwachung", "Benachrichtigung"],
    priority: "normal"
  },
  {
    id: "topic:katzenklappen",
    href: null,
    title: "Smarte Katzenklappen",
    targetGroup: "knowledge",
    topics: ["katzenklappen", "haustiertechnik", "katzen"],
    anchorAliases: [],
    contextTerms: ["smarte Katzenklappe", "Mikrochip-Katzenklappe", "Zugangskontrolle", "Katze"],
    intentTerms: ["Kaufberatung", "Einbau"],
    priority: "normal"
  },
  {
    id: "topic:katzentoiletten",
    href: null,
    title: "Automatische Katzentoiletten",
    targetGroup: "knowledge",
    topics: ["katzentoiletten", "haustiertechnik", "katzen"],
    anchorAliases: [],
    contextTerms: ["automatische Katzentoilette", "selbstreinigende Katzentoilette", "Katze", "Reinigung"],
    intentTerms: ["Kaufberatung", "Hygiene"],
    priority: "normal"
  },
  {
    id: "topic:gesundheit",
    href: null,
    title: "Gesundheit",
    targetGroup: "knowledge",
    topics: ["gesundheit"],
    anchorAliases: [],
    contextTerms: ["Gesundheitstracker", "Tierarzt", "trinkt zu wenig", "trinkt viel", "frisst nicht", "Durchfall", "Erbrechen"],
    intentTerms: ["Ursache", "Problem", "Symptome", "Fehlerbehebung"],
    priority: "normal"
  },
  {
    id: "topic:ernaehrung",
    href: null,
    title: "Ernährung",
    targetGroup: "knowledge",
    topics: ["ernaehrung"],
    anchorAliases: [],
    contextTerms: ["Nassfutter", "Trockenfutter", "Portionierung", "Futtermenge", "Kalorien", "Fütterungszeiten"],
    intentTerms: ["wie viel", "Ursache", "Anleitung"],
    priority: "normal"
  }
];

export const normalizeTaxonomyTerm = (value = "") => String(value)
  .trim()
  .toLocaleLowerCase("de-DE")
  .normalize("NFKD")
  .replace(/\p{Diacritic}/gu, "")
  .replace(/ß/g, "ss")
  .replace(/[^a-z0-9]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

export const normalizeTaxonomyPath = (value = "") => {
  if (!value) return "";
  const base = String(value).split("#")[0].split("?")[0];
  const leading = base.startsWith("/") ? base : `/${base}`;
  return leading.endsWith("/") ? leading : `${leading}/`;
};

export const BLOCKED_ANCHOR_SET = new Set(BLOCKED_ANCHORS.map(normalizeTaxonomyTerm));

export const isBlockedAnchor = (value) => BLOCKED_ANCHOR_SET.has(normalizeTaxonomyTerm(value));

export const taxonomyEntriesForHref = (href) => {
  const normalized = normalizeTaxonomyPath(href);
  return LINK_TAXONOMY.filter((entry) => entry.href && normalizeTaxonomyPath(entry.href) === normalized);
};

export const getCornerstoneEntries = () => LINK_TAXONOMY.filter((entry) => entry.cornerstone && entry.href);

const containsTerm = (haystack, term) => {
  const normalizedHaystack = ` ${normalizeTaxonomyTerm(haystack)} `;
  const normalizedTerm = normalizeTaxonomyTerm(term);
  return normalizedTerm && normalizedHaystack.includes(` ${normalizedTerm} `);
};

export const detectTaxonomyTopics = (values) => {
  const text = (Array.isArray(values) ? values : [values]).filter(Boolean).join(" ");
  const topics = new Set();
  for (const entry of LINK_TAXONOMY) {
    const signals = [...entry.anchorAliases, ...entry.contextTerms, ...(entry.intentTerms ?? [])];
    if (signals.some((term) => containsTerm(text, term))) {
      entry.topics.forEach((topic) => topics.add(topic));
    }
  }
  return [...topics].sort((a, b) => a.localeCompare(b, "de"));
};

export const detectTaxonomyIntents = (values) => {
  const text = (Array.isArray(values) ? values : [values]).filter(Boolean).join(" ");
  const normalized = normalizeTaxonomyTerm(text);
  const intents = new Set();
  if (/\b(vergleich|vergleichen|beste|testsieger|modelle)\b/.test(normalized)) intents.add("comparison");
  if (/\b(kaufberatung|kaufentscheidung|welcher|welche|passend|auswahl)\b/.test(normalized)) intents.add("buying-guide");
  if (/\b(wie|anleitung|reinigen|wechseln|befestigen|einrichten|pflegen)\b/.test(normalized)) intents.add("how-to");
  if (/\b(problem|ursache|fehler|funktioniert nicht|hilfe|losung)\b/.test(normalized)) intents.add("troubleshooting");
  if (/\b(testbericht|modell|produkt|datenblatt)\b/.test(normalized)) intents.add("product");
  if (/\b(hersteller|marke|anbieter)\b/.test(normalized)) intents.add("manufacturer");
  if (intents.size === 0) intents.add("informational");
  return [...intents];
};

export const sanitizeAnchorAliases = (values = []) => [...new Map(
  values
    .map((value) => String(value ?? "").trim())
    .filter((value) => value.length >= 4 && !isBlockedAnchor(value))
    .map((value) => [normalizeTaxonomyTerm(value), value])
).values()];
