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
    visualBrief: {
      pageType: "product | comparison | guide | manufacturer | category | homepage | landingpage",
      subject: "konkretes Seitenthema oder Produkt",
      motifs: ["nur wirklich notwendige oder belegte Motive"],
      styleNotes: ["optionale konkrete Stilhinweise"],
      referenceUrls: ["optionale visuelle Primärquellen"]
    },
    implementationBrief: {
      goal: "welches konkrete Ergebnis erreicht werden soll",
      problem: "welches belegte Problem die aktuelle Seite oder der Bestand hat",
      userValue: "welche Nutzerfrage oder Kaufentscheidung danach besser gelöst wird",
      implementation: ["konkrete Änderung 1", "konkrete Änderung 2"],
      files: ["konkrete Route oder bekannte Repository-Datei"],
      doNotChange: ["Bereiche, die ohne Beleg unberührt bleiben müssen"],
      acceptanceCriteria: ["objektiv prüfbares Fertig-Kriterium"],
      verification: ["passender Test, Audit oder Build"]
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
  "ARBEITSABLAUF FÜR CHATGPT",
  "1. Arbeite die Recherche vollständig durch, bevor du eine Ausgabe erzeugst. Stelle keine Rückfragen, solange die Aufgabe mit den vorhandenen Daten sinnvoll lösbar ist.",
  "2. Prüfe jeden Befund gegen den unten enthaltenen Repository-Bestand und verwerfe Dubletten sowie bereits erledigte Punkte.",
  "3. Validiere das fertige Ergebnis intern gegen den JSON-Vertrag. Entferne unbelegte oder unvollständige Findings.",
  "4. Erzeuge anschließend eine UTF-8-Datei mit dem exakten Namen research-import.json und stelle sie als herunterladbaren Dateianhang bereit.",
  "5. Schreibe das vollständige JSON nicht zusätzlich in die Chat-Antwort. Der Nutzer soll keinen JSON-Block kopieren oder manuell als Datei speichern müssen.",
  "6. Antworte abschließend nur mit einem kurzen Ergebnistext, der Anzahl der Findings und dem Download-Link zur Datei.",
  "7. Falls deine Oberfläche technisch keine Dateien bereitstellen kann, gib ersatzweise genau einen JSON-Codeblock aus und erkläre in einem Satz, dass dies nur der technische Fallback ist.",
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
  "IMPLEMENTIERUNGS-BRIEFING",
  "- Erzeuge für jedes Finding ein implementationBrief, das unverändert in einen neuen ChatGPT- oder Codex-Chat kopiert werden kann.",
  "- goal beschreibt das konkrete Endergebnis.",
  "- problem beschreibt den belegten Ist-Zustand.",
  "- userValue erklärt die bessere Nutzerfrage oder Kaufentscheidung.",
  "- implementation enthält konkrete ausführbare Änderungen statt vager Stichworte.",
  "- files nennt nur bekannte Routen oder Repository-Dateien.",
  "- doNotChange schützt Bereiche, die nicht Teil des Problems sind.",
  "- acceptanceCriteria enthält objektiv prüfbare Fertig-Kriterien.",
  "- verification nennt Tests, Audits und den Build.",
  "- Das Briefing muss ohne weitere Interpretation als Auftrag für einen Installer-Patch funktionieren.",
  "- Das implementationBrief muss den späteren Installer als idempotent, plattformübergreifend und teillauffähig verlangen.",
  "- Verlange strukturelle Dateiänderungen statt fragiler langer String-Replacements oder komplexer dynamischer RegExp.",
  "- Verlange Backups, Ergebnisvalidierung, node --check, Prüfung vorhandener npm-Skripte und einen erfolgreichen zweiten Installerlauf.",
  "- Tests müssen Verhalten und Datenstruktur prüfen, nicht exakte Formatierung, Variablennamen oder zufällige Quelltextfragmente.",
  "- Der spätere Auftrag soll genau einen finalen Installer vorsehen und erwartbare Hotfix-Ketten vermeiden.",
  "",

  "VISUAL-BRIEFING",
  "- Erzeuge für jedes Finding ein visualBrief. Visuals sind Teil des Produktionspakets, nicht ein optionaler Nachtrag.",
  "- pageType ist product, comparison, guide, manufacturer, category, homepage oder landingpage.",
  "- motifs enthält nur Bilder, die der Nutzerfrage, Kaufentscheidung oder Erklärung einen konkreten Mehrwert geben.",
  "- Für neue Produktseiten mindestens Hero, Thumbnail, Perspektivansicht, wichtigstes Funktionsdetail und reale Nutzungssituation vorsehen.",
  "- Für Vergleiche bevorzugt Hero, Vergleichsübersicht, Entscheidungsbaum, Einsatzfälle und Zielkonflikte.",
  "- Für Ratgeber bevorzugt Hero, Übersicht, Entscheidungshilfe, Checkliste und Warnzeichen oder Grenzen.",
  "- Nutze missingVisuals und refreshPlan.visuals für individuelle Motive statt nur starre Standardlisten zu wiederholen.",
  "- Produktmotive müssen möglichst realistisch und anhand von Hersteller-Primärquellen identifizierbar sein. Keine erfundenen Details.",
  "- Der spätere ChatGPT-Master-Prompt muss alle Bilder als einzelne Outputs anfordern und einen robusten Weiter-Modus enthalten, falls ChatGPT nur ein Bild pro Antwort erzeugt.",
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
  "Gib ausschließlich valides JSON zurück – als Inhalt der Datei research-import.json: kein Markdown, keine Code-Fences, keine Einleitung und kein Text nach dem JSON.",
  "Lasse optionale Objekte weg, wenn sie nicht relevant sind. Verwende keine Platzhalterwerte in der tatsächlichen Ausgabe.",
  "Die Chat-Antwort selbst bleibt kurz und verweist auf die herunterladbare Datei; sie enthält nicht noch einmal den Dateiinhalt.",
  "",
  JSON.stringify(outputExample, null, 2)
].join("\n");

export const buildChatGptResearchPrompt = buildWeeklyResearchPrompt;
