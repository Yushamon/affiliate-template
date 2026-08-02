export type ResearchPromptInput = {
  generatedAt: string;
  clusters: any[];
  products?: number;
  manufacturers?: number;
  comparisons?: number;
  pages?: number;
};

const compactClusters = (clusters: any[]) =>
  clusters.map((cluster) => ({
    id: cluster.id,
    label: cluster.label,
    score: cluster.score,
    status: cluster.status,
    gaps: cluster.gaps ?? [],
    counts: cluster.counts ?? {},
    routes: (cluster.documents ?? []).slice(0, 60).map((document: any) => ({
      type: document.type,
      title: document.title,
      route: document.route
    }))
  }));

const outputExample = {
  version: 2,
  updatedAt: "ISO-8601",
  provider: "manual-chatgpt",
  scope: ["Cluster"],
  items: [{
    id: "stabile-kebab-case-id",
    type: "topic | product | manufacturer | content-refresh",
    title: "konkreter Vorschlag",
    status: "open",
    priority: 0,
    confidence: 0,
    reason: "konkrete, belegte Begründung",
    repositoryMatch: { exists: false, similarRoutes: [] },
    opportunity: {
      seo: 0,
      ux: 0,
      business: 0,
      freshness: 0,
      effort: "small | medium | large",
      priority: 0,
      reason: "Begründung der Priorisierung"
    },
    serpGap: {
      score: 0,
      query: "untersuchte Suchanfrage",
      analyzedResults: 0,
      missingContent: [],
      missingVisuals: [],
      missingCalculators: [],
      missingDecisionTools: [],
      competitorPatterns: [],
      informationGain: "eigenständiger Mehrwert"
    },
    lifecycle: {
      state: "new | announced | updated | successor | discontinued | recalled | firmware-update | app-update | unchanged",
      affectedComparisons: []
    },
    refreshPlan: {
      targetRoute: "optional",
      changeType: "expand | correct | restructure | consolidate | update-data | improve-ux",
      missingSections: [],
      sectionsToUpdate: [],
      factsToVerify: [],
      visuals: [],
      decisionTools: [],
      faqUpdates: [],
      schemaUpdates: [],
      internalLinks: [],
      affectedProducts: [],
      affectedComparisons: []
    },
    impact: {
      affectedPages: [],
      affectedComparisons: [],
      affectedProducts: [],
      estimatedContentHours: 0,
      estimatedImageHours: 0,
      estimatedSeoImpact: "low | medium | high"
    },
    actionBundle: {
      id: "optional-bundle-id",
      title: "zusammengehöriger Arbeitsblock",
      sequence: []
    },
    actions: [{
      type: "create-page | update-page | create-product | update-product | update-manufacturer | update-comparison | add-internal-links | manual-review",
      target: "Route, Slug oder Datei",
      reason: "warum"
    }],
    evidence: [{
      source: "Quelle",
      url: "https://...",
      note: "konkret belegte Aussage",
      accessedAt: "ISO-8601"
    }],
    discoveredAt: "ISO-8601",
    lastConfirmedAt: "ISO-8601"
  }]
};

export const buildWeeklyResearchPrompt = (input: ResearchPromptInput): string => [
  "Du führst die wöchentliche externe Research-Runde für PfotenTechnik.de durch.",
  "",
  "Dieser Prompt ist vollständig eigenständig und kann direkt in ChatGPT mit aktiviertem Webzugriff verwendet werden.",
  "Recherchiere im Web. Nutze für technische Produktdaten, Modellwechsel, Rückrufe, Firmware und Markteinführungen bevorzugt Hersteller-Primärquellen.",
  "",
  "ZIEL",
  "Finde ausschließlich belegte Chancen, die den bestehenden PfotenTechnik-Bestand sinnvoll verbessern. Erzeuge keinen Content nur deshalb, weil ein verwandtes Keyword existiert.",
  "",
  "UNTERSUCHUNGSBEREICHE",
  "1. Fehlende eigenständige Themen und Suchintentionen.",
  "2. Neue oder wesentlich aktualisierte Produkte, einschließlich angekündigter Modelle.",
  "3. Relevante Hersteller, Modellreihen und Sortimentserweiterungen.",
  "4. Konkrete Refresh-Chancen für bestehende Inhalte.",
  "5. SERP- und Information-Gaps bestehender Hubs, Vergleiche und Ratgeber.",
  "6. Produkt-Lifecycle: Nachfolger, eingestellte Modelle, Rückrufe, Firmware-, App- und Kompatibilitätsänderungen.",
  "",
  "ENTSCHEIDUNGSREGELN",
  "- Prüfe zuerst, ob ein neuer Befund als Abschnitt oder Update auf einer bestehenden Seite besser aufgehoben ist.",
  "- Empfehle eine neue Seite nur bei eigenständiger Suchintention, eigenständiger Nutzeraufgabe und ausreichend belegbarem Mehrwert.",
  "- Keine Farbvarianten, Marketplace-Dubletten oder bloße Händler-Neulistungen als neue Produkte.",
  "- Keine Verkaufszahlen, Beliebtheit oder Marktführerschaft aus Rankings, Rezensionen oder Händlerpositionen ableiten.",
  "- Jede Empfehlung benötigt mindestens einen konkreten Beleg. Produkte und Lifecycle-Änderungen benötigen möglichst eine Hersteller-Primärquelle.",
  "- Behaupte keinen eigenen Produkttest.",
  "- Nutze keine erfundenen Suchvolumina oder Traffic-Prognosen.",
  "- Fasse zusammengehörige Änderungen als Action Bundle zusammen.",
  "",
  "SERP- UND INFORMATION-GAP-PRÜFUNG",
  "- Untersuche bei relevanten bestehenden Suchintentionen möglichst die ersten zehn organischen Ergebnisse.",
  "- Dokumentiere nur wiederkehrende oder klar relevante Muster.",
  "- Prüfe fehlende Inhalte, Tabellen, Rechner, Visuals, FAQs, Entscheidungshilfen, Sicherheitsinformationen und Praxisschritte.",
  "- Formuliere den Information Gain konkret. PfotenTechnik soll nicht nur Wettbewerber nachbauen.",
  "- analyzedResults muss der Zahl der tatsächlich geprüften organischen Ergebnisse entsprechen.",
  "",
  "REFRESH-PRÜFUNG",
  "- Nenne die konkrete bestehende Route.",
  "- Trenne Faktenkorrektur, Datenupdate, strukturelle Überarbeitung, UX-Verbesserung und inhaltliche Erweiterung.",
  "- Benenne betroffene Produktseiten, Vergleiche, interne Links, strukturierte Daten, Bilder und FAQs.",
  "- Schätze Aufwand konservativ in Stunden.",
  "",
  "PRIORISIERUNG",
  "- Bewerte SEO-Nutzen, UX-Nutzen, geschäftliche Relevanz und Aktualitätsdruck jeweils von 0 bis 100.",
  "- effort ist small, medium oder large.",
  "- opportunity.priority ist eine nachvollziehbare Gesamtpriorität von 0 bis 100.",
  "",
  `Repository-Stand: ${input.generatedAt}`,
  `Bestand: ${input.pages ?? 0} Ratgeber/Hubs, ${input.comparisons ?? 0} Vergleiche, ${input.products ?? 0} Produkte, ${input.manufacturers ?? 0} Hersteller.`,
  "",
  "CLUSTERSTRUKTUR",
  JSON.stringify(compactClusters(input.clusters), null, 2),
  "",
  "AUSGABE",
  "Gib ausschließlich valides JSON zurück. Kein Markdown, keine Code-Fences, keine Einleitung und kein Text nach dem JSON.",
  "Lasse optionale Objekte weg, wenn sie nicht relevant sind. Verwende keine Platzhalterwerte in der tatsächlichen Ausgabe.",
  "",
  JSON.stringify(outputExample, null, 2)
].join("\n");

export const buildChatGptResearchPrompt = buildWeeklyResearchPrompt;
