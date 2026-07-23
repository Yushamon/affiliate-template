import { normalizeSeoPath, type SeoQueryRow } from "../loadDashboard";
import { calculatePriorityScore, effectFromScore, effortLabel, priorityFromScore } from "./score";
import {
  buildConversionInsights,
  buildEditorialCalendar,
  buildForecast,
  buildGraphGaps,
  estimateMinutes,
  quickWins,
} from "./intelligence";
import type {
  AdvisorCategory,
  AdvisorOpportunity,
  CannibalizationFinding,
  ContentDocument,
  ContentGapFinding,
  EeatFinding,
  LinkRecommendation,
  SeoAdvisorInput,
  SeoAdvisorResult,
} from "./types";

const STOP_WORDS = new Set([
  "aber", "alle", "als", "auch", "bei", "beste", "besten", "das", "den", "der", "die", "ein", "eine",
  "einer", "fuer", "für", "im", "in", "ist", "mit", "oder", "ohne", "und", "von", "was", "wie", "zu",
]);

const HUBS: Record<string, { route: string; title: string }> = {
  futterautomaten: { route: "/smarte-futterautomaten/", title: "Smarte Futterautomaten" },
  trinkbrunnen: { route: "/trinkbrunnen/", title: "Trinkbrunnen für Haustiere" },
  "gps-tracker": { route: "/gps-tracker/", title: "GPS-Tracker für Hunde und Katzen" },
  ernaehrung: { route: "/futterautomat-und-ernaehrung/", title: "Fütterung und Ernährung" },
  ernahrung: { route: "/futterautomat-und-ernaehrung/", title: "Fütterung und Ernährung" },
};

const normalizeText = (value: string): string =>
  value.toLocaleLowerCase("de-DE").normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, " ").trim();

const TOKEN_ALIASES: Record<string, string> = {
  futterautomaten: "futterautomat",
  futterungsautomat: "futterautomat",
  futterungsautomaten: "futterautomat",
  futterungsroboter: "futterautomat",
  katzenbrunnen: "trinkbrunnen",
  trinkbrunnenvergleich: "trinkbrunnen",
  katzen: "katze",
  hunde: "hund",
  trackern: "tracker",
  trackers: "tracker",
};

const canonicalToken = (token: string): string => TOKEN_ALIASES[token] ?? token;

const tokens = (value: string): string[] =>
  [...new Set(normalizeText(value).split(/\s+/).filter((token) => (token.length > 2 || /^\d+$/.test(token)) && !STOP_WORDS.has(token)).map(canonicalToken))];

const overlap = (left: string[], right: string[]): number => {
  if (!left.length || !right.length) return 0;
  const set = new Set(left);
  return right.filter((token) => set.has(token)).length / right.length;
};

const jaccard = (left: string[], right: string[]): number => {
  const union = new Set([...left, ...right]);
  if (!union.size) return 0;
  const rightSet = new Set(right);
  return left.filter((token) => rightSet.has(token)).length / union.size;
};

const stableId = (...parts: Array<string | number | undefined>): string =>
  parts.filter((part) => part !== undefined).join("|").toLocaleLowerCase("de-DE").replace(/[^a-z0-9|/-]+/g, "-");

const pageType = (route: string): string => {
  if (route.startsWith("/vergleiche/")) return "Vergleich";
  if (route.startsWith("/produkt/")) return "Produkt";
  if (route.startsWith("/hersteller/")) return "Hersteller";
  if (Object.values(HUBS).some((hub) => hub.route === route)) return "Cornerstone";
  return "Ratgeber";
};

const strategicFactor = (route: string): number => {
  const type = pageType(route);
  if (type === "Cornerstone") return 1.15;
  if (type === "Vergleich" || type === "Produkt") return 1.1;
  if (type === "Hersteller") return 1.04;
  return 1;
};

const confidenceFor = (impressions: number): number => {
  if (impressions >= 100) return 0.9;
  if (impressions >= 30) return 0.78;
  if (impressions >= 10) return 0.64;
  return 0.45;
};

const ctrBenchmark = (position: number): number => {
  if (position <= 3) return 8;
  if (position <= 5) return 5;
  if (position <= 10) return 3;
  if (position <= 20) return 1.5;
  return 0.8;
};

const matchDocument = (route: string, documents: ContentDocument[]): ContentDocument | undefined => {
  const normalized = normalizeSeoPath(route);
  return documents.find((document) => normalizeSeoPath(document.route) === normalized);
};

const bestQueryForDocument = (document: ContentDocument | undefined, queries: SeoQueryRow[]): SeoQueryRow | undefined => {
  if (!document) return undefined;
  const titleTokens = tokens(`${document.title} ${document.slug}`);
  return [...queries]
    .map((query) => {
      const queryTokens = tokens(query.query);
      const numericTokens = queryTokens.filter((token) => /^\d+$/.test(token));
      const numericMismatch = numericTokens.some((token) => !titleTokens.includes(token));
      const overlyGenericBrandQuery = queryTokens.length === 1 && document.pageType !== "Hersteller" && titleTokens.length > 2;
      return { query, score: numericMismatch || overlyGenericBrandQuery ? 0 : overlap(titleTokens, queryTokens) };
    })
    .filter((candidate) => candidate.score >= 0.6)
    .sort((a, b) => b.score - a.score || b.query.impressions - a.query.impressions)[0]?.query;
};

const buildPrompt = (opportunity: Omit<AdvisorOpportunity, "prompt" | "codexPrompt">): string => [
  "Du arbeitest an PfotenTechnik.de, einer deutschsprachigen Wissensplattform für smarte Haustiertechnik.",
  `Betroffene URL: ${opportunity.url ?? "nicht eindeutig einer URL zugeordnet"}`,
  `Betroffene Datei: ${opportunity.affectedFile ?? "Route zuerst zur Quelldatei auflösen"}`,
  opportunity.query ? `Search-Suchanfrage: ${opportunity.query}` : "Search-Suchanfrage: keine eindeutige Query-Zuordnung vorhanden",
  `Search-Daten (${opportunity.rangeKey}, Quelle: ${opportunity.source}): ${opportunity.dataBasis.impressions ?? 0} Impressionen, ${opportunity.dataBasis.clicks ?? 0} Klicks, CTR ${(opportunity.dataBasis.ctr ?? 0).toFixed(2)} %, Position ${(opportunity.dataBasis.position ?? 0).toFixed(1)}.`,
  `Problem: ${opportunity.description}`,
  `Ziel: ${opportunity.nextAction}`,
  "Maßnahmen:",
  ...opportunity.steps.map((step) => `- ${step}`),
  "Qualitätsanforderungen:",
  "- Bestehende Inhalte, URLs, Bilder, Komponenten und Frontmatter-Strukturen beibehalten.",
  "- Keine unbelegten Aussagen, erfundenen Messwerte oder künstliche Textverlängerung ergänzen.",
  "- Suchintention klarer bedienen, interne Verlinkung semantisch sinnvoll halten und Kannibalisierung vermeiden.",
  "Akzeptanzkriterien:",
  "- Die Maßnahme ist anhand der genannten Search-Daten nachvollziehbar.",
  "- Bestehende PfotenTechnik-Standards sind eingehalten.",
  "- Build und vorhandene SEO-/Content-Audits bestehen.",
].join("\n");

const buildCodexPrompt = (opportunity: Omit<AdvisorOpportunity, "prompt" | "codexPrompt">): string => [
  "Arbeite im Repository Yushamon/affiliate-template.",
  "Projektpfad: apps/pfotentechnik.",
  opportunity.affectedFile
    ? `Vermutlich betroffene Datei: ${opportunity.affectedFile}`
    : `Betroffene URL: ${opportunity.url ?? "nicht eindeutig"}. Löse zuerst die Route zur tatsächlichen Quelldatei auf; nicht raten.`,
  opportunity.query ? `Suchanfrage: ${opportunity.query}` : "Nutze nur die vorhandene Search-Datenbasis; keine Query erfinden.",
  `Aufgabe: ${opportunity.nextAction}`,
  ...opportunity.steps.map((step) => `- ${step}`),
  "Respektiere die bestehende Astro-Architektur, Komponenten, Content-Standards und Slugs.",
  "Füge keine unnötigen Dependencies hinzu und ändere nichts außerhalb dieses Scopes.",
  "Führe danach npm run build:pfotentechnik sowie die tatsächlich vorhandenen SEO-/Content-Audits aus.",
  "Fasse geänderte Dateien, Datenbezug, Tests und verbleibende Einschränkungen zusammen.",
].join("\n");

const finishOpportunity = (
  opportunity: Omit<AdvisorOpportunity, "prompt" | "codexPrompt">,
  technical = true,
): AdvisorOpportunity => ({
  ...opportunity,
  prompt: buildPrompt(opportunity),
  codexPrompt: technical ? buildCodexPrompt(opportunity) : undefined,
});

const makeOpportunity = ({
  category,
  title,
  description,
  url,
  query,
  rationale,
  nextAction,
  source,
  rangeKey,
  impressions = 0,
  clicks = 0,
  ctr = 0,
  position = 0,
  impact,
  effortValue,
  confidence,
  steps,
  document,
  maxImpressions,
}: {
  category: AdvisorCategory;
  title: string;
  description: string;
  url?: string;
  query?: string;
  rationale: string;
  nextAction: string;
  source: string;
  rangeKey: string;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  position?: number;
  impact: number;
  effortValue: number;
  confidence: number;
  steps: string[];
  document?: ContentDocument;
  maxImpressions: number;
}): AdvisorOpportunity => {
  const visibilityFactor = maxImpressions > 0 ? 0.85 + Math.min(0.35, impressions / maxImpressions * 0.35) : 0.85;
  const score = calculatePriorityScore({ impact, confidence, effort: effortValue, visibilityFactor, strategicFactor: strategicFactor(url ?? "") });
  return finishOpportunity({
    id: stableId(category, url, query, title),
    title,
    description,
    category,
    priority: priorityFromScore(score),
    impact,
    effortValue,
    effort: effortLabel(effortValue),
    confidence,
    score,
    estimatedMinutes: estimateMinutes(effortValue),
    forecast: buildForecast({ impressions, ctr, position, confidence, rangeKey }),
    url,
    query,
    rationale,
    nextAction,
    source,
    rangeKey,
    lowData: impressions < 20,
    expectedBenefit: effectFromScore(score),
    steps,
    pageType: pageType(url ?? ""),
    affectedFile: document?.filePath,
    dataBasis: { impressions, clicks, ctr, position, note: impressions < 20 ? "Geringe Datenbasis – als Signal, nicht als Beweis behandeln." : undefined },
  });
};

const analyseEeat = (documents: ContentDocument[], visibleRoutes: Set<string>): EeatFinding[] => {
  const sourcePattern = /(?:^|\n)#{1,3}\s+quellen|\*\*quellen:?\*\*|https?:\/\//i;
  const qualitySourcePattern = /aaha\.org|wsava\.org|vcahospitals\.com|cornell\.edu|icatcare\.org|pmc\.ncbi\.nlm\.nih\.gov|europa\.eu|edpb\.europa\.eu|gps\.gov|support\.|manual|bedienungsanleitung/i;
  const ymylPattern = /krank|gesund|tierarzt|durchfall|erbrechen|niere|gewicht|trinkt (viel|wenig)|frisst nicht|medizin|dehydrat|vergift/i;
  const medicalNoticePattern = /tierarzt|tierärzt|fachlich abklären|kein ersatz für|notfall/i;
  const methodologyPattern = /methodik|bewertungsgrundlage|so bewerten|testmethod|redaktionell geprüft|datenbasis/i;

  return documents.map((document) => {
    const combined = `${document.title}\n${document.description}\n${document.body}`;
    const ymyl = ymylPattern.test(combined);
    const signals = [
      { ok: document.authorPresent, points: 15, missing: "Explizite Autorenangabe im Frontmatter" },
      { ok: document.authorVisible, points: 10, missing: "Sichtbare Autorenzeile" },
      { ok: Boolean(document.publishedAt), points: 10, missing: "Veröffentlichungsdatum" },
      { ok: Boolean(document.updatedAt), points: 10, missing: "Aktualisierungsdatum" },
      { ok: sourcePattern.test(document.body), points: 18, missing: "Nachvollziehbarer Quellenabschnitt" },
      { ok: qualitySourcePattern.test(document.body), points: 12, missing: "Hochwertige Primär- oder Fachquelle" },
      { ok: !ymyl || medicalNoticePattern.test(combined), points: 15, missing: "Medizinischer Sicherheitshinweis bei YMYL-Inhalt" },
      { ok: document.hasMethodology || methodologyPattern.test(combined), points: 10, missing: "Transparente Methodik oder Bewertungsgrundlage" },
    ];
    const score = signals.reduce((sum, signal) => sum + (signal.ok ? signal.points : 0), 0);
    const missingSignals = signals.filter((signal) => !signal.ok).map((signal) => signal.missing);
    const evidence = signals.filter((signal) => signal.ok).map((signal) => signal.missing.replace(/^Explizite /, "").replace(/^Nachvollziehbarer /, "").replace(/^Hochwertige /, ""));
    const routeHasData = visibleRoutes.has(normalizeSeoPath(document.route));
    return {
      id: stableId("eeat", document.route),
      route: document.route,
      filePath: document.filePath,
      title: document.title,
      score,
      missingSignals,
      recommendation: missingSignals.length ? `Als Nächstes ergänzen oder redaktionell prüfen: ${missingSignals[0]}.` : "Keine offensichtliche EEAT-Lücke in den lokal prüfbaren Signalen.",
      priority: score < 55 && routeHasData ? "high" : score < 70 ? "medium" : "low",
      evidence,
    } satisfies EeatFinding;
  }).sort((a, b) => {
    const routeWeight = (item: EeatFinding) => visibleRoutes.has(normalizeSeoPath(item.route)) ? 0 : 1;
    return routeWeight(a) - routeWeight(b) || a.score - b.score;
  });
};

const analyseContentGaps = (queries: SeoQueryRow[], documents: ContentDocument[], lowDomainData: boolean): ContentGapFinding[] => {
  const minimum = lowDomainData ? 2 : 10;
  return queries.filter((query) => query.impressions >= minimum && !/\bsite:|^-|\s-\w|https?:/i.test(query.query)).map((query) => {
    const queryTokens = tokens(query.query);
    const comparisonIntent = /\b(test|vergleich|beste[nr]?)\b/i.test(query.query);
    const productIntent = /\b(kaufen|preis|modell|produkt)\b/i.test(query.query);
    const matches = documents.map((document) => {
      const titleScore = overlap(tokens(`${document.title} ${document.slug} ${document.description} ${document.topics.join(" ")}`), queryTokens);
      const bodyScore = overlap(tokens(document.body.slice(0, 5000)), queryTokens);
      const intentBonus = comparisonIntent && document.pageType === "Vergleich"
        ? 0.24
        : productIntent && document.pageType === "Produkt"
          ? 0.16
          : 0;
      return { document, score: Math.min(1, Math.max(titleScore, bodyScore * 0.45) + intentBonus), titleScore, bodyScore };
    }).sort((a, b) => b.score - a.score);
    const best = matches[0];
    const lowData = query.impressions < 10;
    const standalone = query.impressions >= 10 && queryTokens.length >= 2 && (!best || best.score < 0.25);
    const kind: ContentGapFinding["kind"] = !best || best.score < 0.25
      ? standalone ? "fehlende-zielseite" : "beobachten"
      : best.titleScore < 0.5 && best.bodyScore >= 0.35
        ? "abschnitt-ausbauen"
        : best.score < 0.58
          ? "intent-mismatch"
          : "beobachten";
    const matchStrength: ContentGapFinding["matchStrength"] = !best || best.score < 0.25 ? "keine" : best.score < 0.58 ? "schwach" : "passend";
    const recommendation = kind === "fehlende-zielseite"
      ? "Eigenständige Suchintention gegen bestehende Seiten und Kannibalisierungsrisiko prüfen; erst danach eine neue Zielseite planen."
      : kind === "abschnitt-ausbauen"
        ? `Den bestehenden Abschnitt auf ${best.document.route} gezielt auf die Query-Intention ausbauen.`
        : kind === "intent-mismatch"
          ? `Title/H1 und Abschnittsstruktur von ${best?.document.route} auf Intent-Passung prüfen; keine neue Seite ohne klare Abgrenzung.`
          : "Daten sammeln und die Query in einer passenden bestehenden Seite oder FAQ berücksichtigen; aktuell keine neue Seite anlegen.";
    return {
      id: stableId("gap", query.query),
      query: query.query,
      impressions: query.impressions,
      position: query.position,
      matchedRoute: best?.document.route,
      matchStrength,
      kind,
      rationale: `${query.impressions} Impressionen bei Position ${query.position.toFixed(1)}; beste lokale Intent-Übereinstimmung ${Math.round((best?.score ?? 0) * 100)} %.`,
      recommendation,
      lowData,
    } satisfies ContentGapFinding;
  }).filter((finding) => finding.kind !== "beobachten" || finding.impressions >= 5)
    .sort((a, b) => b.impressions - a.impressions);
};

const analyseCannibalization = (input: SeoAdvisorInput): CannibalizationFinding[] => {
  const findings: CannibalizationFinding[] = input.payload.urlDuplicates.map((duplicate) => ({
    id: stableId("duplicate", duplicate.normalizedPath),
    routes: duplicate.variants,
    intent: duplicate.normalizedPath,
    evidence: `GSC enthält ${duplicate.variants.length} technische Varianten derselben normalisierten URL. Die Werte wurden nicht addiert.`,
    risk: "mittel",
    kind: "technische-url-dublette",
    recommendation: "Host-, Slash- und Canonical-Signale prüfen; erst nach technischer Bestätigung Redirect oder Canonical anpassen.",
  }));

  const rankedRoutes = new Set(input.range.pages.map((row) => row.normalizedPath));
  for (let index = 0; index < input.documents.length; index += 1) {
    const left = input.documents[index];
    const leftTokens = tokens(`${left.title} ${left.slug}`);
    for (let cursor = index + 1; cursor < input.documents.length; cursor += 1) {
      const right = input.documents[cursor];
      const similarity = jaccard(leftTokens, tokens(`${right.title} ${right.slug}`));
      if (similarity < 0.62) continue;
      const bothVisible = rankedRoutes.has(normalizeSeoPath(left.route)) && rankedRoutes.has(normalizeSeoPath(right.route));
      const hierarchy = left.pageType !== right.pageType && (left.pageType === "Vergleich" || right.pageType === "Vergleich");
      findings.push({
        id: stableId("cannibal", left.route, right.route),
        routes: [left.route, right.route],
        intent: [...new Set(leftTokens.filter((token) => tokens(`${right.title} ${right.slug}`).includes(token)))].join(" "),
        evidence: `${Math.round(similarity * 100)} % Titel-/Slug-Ähnlichkeit${bothVisible ? "; beide URLs sind im gewählten GSC-Zeitraum sichtbar, eine Page-Query-Zuordnung fehlt jedoch" : "; keine belastbare gemeinsame Query-Zuordnung vorhanden"}.`,
        risk: hierarchy && bothVisible ? "mittel" : "niedrig",
        kind: hierarchy ? "sinnvolle-hierarchie" : "geringe-datenbasis",
        recommendation: hierarchy
          ? "Intent von Hub/Ratgeber und Vergleich in Title, H1 und interner Verlinkung klar differenzieren; zunächst beobachten."
          : "Beobachten und erst bei gemeinsamer Query-Evidenz Intent differenzieren, Inhalte zusammenführen oder technische Maßnahmen erwägen.",
      });
    }
  }
  return findings.sort((a, b) => ({ hoch: 0, mittel: 1, niedrig: 2 }[a.risk] - { hoch: 0, mittel: 1, niedrig: 2 }[b.risk])).slice(0, 12);
};

const analyseLinks = (documents: ContentDocument[], graph: SeoAdvisorInput["graph"], visibleRoutes: Set<string>): LinkRecommendation[] => {
  const nodeByRoute = new Map(graph.nodes.map((node) => [normalizeSeoPath(node.route), node]));
  const recommendations: LinkRecommendation[] = [];

  for (const document of documents) {
    const sourcePath = normalizeSeoPath(document.route);
    const node = nodeByRoute.get(sourcePath);
    const cluster = node?.cluster || document.cluster;
    const hub = HUBS[cluster];
    if (!hub || sourcePath === hub.route) continue;
    const alreadyLinked = document.body.includes(`](${hub.route}`) || document.body.includes(`href="${hub.route}`) || document.body.includes(`href='${hub.route}`);
    if (alreadyLinked) continue;
    const sharedTopics = (node?.topics ?? document.topics).filter((topic) => tokens(hub.title).includes(normalizeText(topic))).length;
    recommendations.push({
      id: stableId("link", sourcePath, hub.route),
      sourceRoute: sourcePath,
      sourceFile: document.filePath,
      targetRoute: hub.route,
      anchorText: hub.title,
      context: `Im Abschnitt, der „${document.title}“ in den übergeordneten Themenbereich einordnet.`,
      rationale: `Der Content Graph ordnet die Seite dem Cluster „${cluster}“ zu${sharedTopics ? ` und zeigt ${sharedTopics} gemeinsames Thema` : ""}; im Quelldokument ist kein Link zum Hub vorhanden.`,
      priority: visibleRoutes.has(sourcePath) ? "high" : "medium",
    });
  }
  return recommendations.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority])).slice(0, 12);
};

const dedupeOpportunities = (items: AdvisorOpportunity[]): AdvisorOpportunity[] => {
  const byKey = new Map<string, AdvisorOpportunity>();
  for (const item of items) {
    const key = item.url ? `${item.category}|${normalizeSeoPath(item.url)}` : `${item.category}|${normalizeText(item.query ?? item.title)}`;
    const current = byKey.get(key);
    if (!current || item.score > current.score) byKey.set(key, item);
  }
  return [...byKey.values()].sort((a, b) => b.score - a.score || (b.dataBasis.impressions ?? 0) - (a.dataBasis.impressions ?? 0));
};

export const buildSeoAdvisor = (input: SeoAdvisorInput): SeoAdvisorResult => {
  const { range, documents } = input;
  const providerLabel = input.payload.provider === "combined" ? "Google + Bing Combined" : input.payload.provider === "bing" ? "Bing Webmaster Tools" : "Google Search Console";
  const totalImpressions = range.metrics.current.impressions;
  const lowDomainData = totalImpressions < 1000;
  const maxImpressions = Math.max(1, ...range.pages.map((row) => row.impressions));
  const minimumImpressions = lowDomainData ? 5 : 20;
  const opportunities: AdvisorOpportunity[] = [];

  for (const row of range.pages) {
    if (row.impressions < minimumImpressions) continue;
    const document = matchDocument(row.normalizedPath, documents);
    const query = bestQueryForDocument(document, range.queries);
    const confidence = confidenceFor(row.impressions);

    if (row.position >= 4 && row.position <= 20) {
      opportunities.push(makeOpportunity({
        category: "ranking",
        title: "Bestehende Seite in Reichweite der Top-Ergebnisse stärken",
        description: `Die Seite liegt auf Position ${row.position.toFixed(1)} und hat bereits messbare Sichtbarkeit.`,
        url: row.normalizedPath,
        query: query?.query,
        rationale: `${row.impressions} Impressionen bei Position ${row.position.toFixed(1)}; das ist ein realistischer Optimierungskorridor ohne Ranking-Versprechen.`,
        nextAction: "Suchintention, Antworttiefe und passende interne Links gezielt verbessern.",
        source: `${providerLabel} + lokaler Content Graph`,
        rangeKey: range.key,
        impressions: row.impressions, clicks: row.clicks, ctr: row.ctr, position: row.position,
        impact: row.impressions >= 30 ? 4 : 3,
        effortValue: document ? 2.5 : 3,
        confidence,
        steps: [
          "Rankende Suchintention gegen Title, H1 und Einstieg prüfen.",
          "Fehlende direkte Antwort oder belegbare Detailtiefe ergänzen.",
          "Relevante interne Links aus Hub- und Clusterseiten prüfen.",
          "Snippet-Änderungen erst nach Prüfung vorhandener Meta-Daten vornehmen.",
        ],
        document,
        maxImpressions,
      }));
    }

    const benchmark = ctrBenchmark(row.position);
    if (row.position <= 20 && row.ctr < benchmark) {
      opportunities.push(makeOpportunity({
        category: "ctr",
        title: "Snippet und Suchintention prüfen",
        description: `Die CTR von ${row.ctr.toFixed(2)} % liegt unter dem konservativen internen Vergleichswert von ${benchmark.toFixed(1)} % für diesen Positionsbereich.`,
        url: row.normalizedPath,
        query: query?.query,
        rationale: `${row.impressions} Impressionen liefern ein ${row.impressions < 20 ? "noch schwaches" : "verwertbares"} Snippet-Signal; keine Klickprognose wird abgeleitet.`,
        nextAction: "Title und Description auf Klarheit, Intent und konkreten Nutzen prüfen.",
        source: providerLabel,
        rangeKey: range.key,
        impressions: row.impressions, clicks: row.clicks, ctr: row.ctr, position: row.position,
        impact: row.impressions >= 30 ? 4 : 3,
        effortValue: 2,
        confidence: Math.max(0.4, confidence - 0.08),
        steps: [
          "SERP-Intent anhand der vorhandenen Query-Signale bestimmen.",
          "Title und Description auf eindeutigen Nutzen und Seiteninhalt abgleichen.",
          "Keine unbelegten Superlative oder erfundenen Testaussagen verwenden.",
          "Nach Änderung im nächsten Search-Snapshot beobachten.",
        ],
        document,
        maxImpressions,
      }));
    }
  }

  for (const recommendation of range.recommendations) {
    const document = matchDocument(recommendation.page, documents);
    const row = range.pages.find((page) => page.normalizedPath === normalizeSeoPath(recommendation.page));
    opportunities.push(makeOpportunity({
      category: recommendation.type.includes("ctr") ? "ctr" : "ranking",
      title: recommendation.title,
      description: recommendation.reason,
      url: recommendation.page || undefined,
      query: recommendation.query,
      rationale: recommendation.reason,
      nextAction: recommendation.action,
      source: `Vorhandene ${recommendation.source ?? input.payload.provider}-Regel`,
      rangeKey: range.key,
      impressions: row?.impressions ?? 0, clicks: row?.clicks ?? 0, ctr: row?.ctr ?? 0, position: row?.position ?? 0,
      impact: recommendation.priority === "high" ? 4 : 3,
      effortValue: 2.5,
      confidence: confidenceFor(row?.impressions ?? 0),
      steps: [recommendation.action, "Änderung gegen vorhandenen Content und interne Links prüfen.", "Ergebnis im nächsten Search-Snapshot beobachten."],
      document,
      maxImpressions,
    }));
  }

  const visibleRoutes = new Set(range.pages.map((row) => row.normalizedPath));
  const eeat = analyseEeat(documents, visibleRoutes);
  const contentGaps = analyseContentGaps(range.queries, documents, lowDomainData);
  const cannibalization = analyseCannibalization(input);
  const linkRecommendations = analyseLinks(documents, input.graph, visibleRoutes);

  for (const finding of eeat.filter((item) => item.priority !== "low" && visibleRoutes.has(normalizeSeoPath(item.route))).slice(0, 5)) {
    const row = range.pages.find((page) => page.normalizedPath === normalizeSeoPath(finding.route));
    const document = matchDocument(finding.route, documents);
    opportunities.push(makeOpportunity({
      category: "eeat",
      title: "Redaktionelle Vertrauenssignale vervollständigen",
      description: `${finding.title} erreicht intern ${finding.score}/100 Punkten bei lokal prüfbaren EEAT-Signalen. Dies ist kein Google-Score.`,
      url: finding.route,
      rationale: finding.missingSignals.join(", "),
      nextAction: finding.recommendation,
      source: "Lokale Content- und Layoutanalyse",
      rangeKey: range.key,
      impressions: row?.impressions ?? 0, clicks: row?.clicks ?? 0, ctr: row?.ctr ?? 0, position: row?.position ?? 0,
      impact: finding.score < 55 ? 4 : 3,
      effortValue: 2.5,
      confidence: 0.88,
      steps: finding.missingSignals.slice(0, 3).map((signal) => `${signal} anhand belastbarer vorhandener Angaben ergänzen.`),
      document,
      maxImpressions,
    }));
  }

  for (const link of linkRecommendations.filter((item) => item.priority === "high").slice(0, 5)) {
    const row = range.pages.find((page) => page.normalizedPath === link.sourceRoute);
    const document = matchDocument(link.sourceRoute, documents);
    opportunities.push(makeOpportunity({
      category: "internal-link",
      title: "Clusterseite mit Cornerstone verbinden",
      description: `${link.sourceRoute} enthält keinen erkennbaren Link zu ${link.targetRoute}.`,
      url: link.sourceRoute,
      rationale: link.rationale,
      nextAction: `Kontextuellen Link mit dem Anker „${link.anchorText}“ zu ${link.targetRoute} prüfen und ergänzen.`,
      source: "Content Graph + lokale Linkprüfung",
      rangeKey: range.key,
      impressions: row?.impressions ?? 0, clicks: row?.clicks ?? 0, ctr: row?.ctr ?? 0, position: row?.position ?? 0,
      impact: 3,
      effortValue: 1.5,
      confidence: 0.92,
      steps: [link.context, `Ankertext „${link.anchorText}“ natürlich in den Satz integrieren.`, "Vorher prüfen, dass kein semantisch gleichwertiger Link bereits vorhanden ist."],
      document,
      maxImpressions,
    }));
  }

  for (const gap of contentGaps.filter((item) => item.kind !== "beobachten" && item.impressions >= 5).slice(0, 4)) {
    const queryRow = range.queries.find((query) => normalizeText(query.query) === normalizeText(gap.query));
    const document = gap.matchedRoute ? matchDocument(gap.matchedRoute, documents) : undefined;
    opportunities.push(makeOpportunity({
      category: "content-gap",
      title: gap.kind === "fehlende-zielseite" ? "Eigenständige Suchintention prüfen" : "Bestehende Zielseite besser auf Query-Intent ausrichten",
      description: gap.rationale,
      url: gap.matchedRoute,
      query: gap.query,
      rationale: `${gap.rationale} ${gap.lowData ? "Die Datenbasis ist gering; keine neue Seite automatisch anlegen." : ""}`.trim(),
      nextAction: gap.recommendation,
      source: `${providerLabel} Queries + lokale Titel, Slugs, Beschreibungen und Inhalte`,
      rangeKey: range.key,
      impressions: gap.impressions,
      clicks: queryRow?.clicks ?? 0,
      ctr: queryRow?.ctr ?? 0,
      position: gap.position,
      impact: gap.kind === "fehlende-zielseite" ? 3.5 : 3,
      effortValue: gap.kind === "fehlende-zielseite" ? 4 : 3,
      confidence: confidenceFor(gap.impressions),
      steps: [
        "Eigenständigkeit der Suchintention gegen bestehende Seiten prüfen.",
        gap.matchedRoute ? `Vorhandene Abdeckung auf ${gap.matchedRoute} inhaltlich prüfen.` : "Passende bestehende Route suchen, bevor eine neue Seite geplant wird.",
        "Kannibalisierungsrisiko dokumentieren und konservativ entscheiden.",
      ],
      document,
      maxImpressions,
    }));
  }

  for (const finding of cannibalization.filter((item) => item.kind === "technische-url-dublette").slice(0, 3)) {
    const normalizedRoute = normalizeSeoPath(finding.intent);
    const row = range.pages.find((page) => page.normalizedPath === normalizedRoute);
    const document = matchDocument(normalizedRoute, documents);
    opportunities.push(makeOpportunity({
      category: "technical",
      title: "Technische URL-Dublette prüfen",
      description: finding.evidence,
      url: normalizedRoute,
      rationale: finding.evidence,
      nextAction: finding.recommendation,
      source: "Normalisierte Search-Seiten-URLs",
      rangeKey: range.key,
      impressions: row?.impressions ?? 0,
      clicks: row?.clicks ?? 0,
      ctr: row?.ctr ?? 0,
      position: row?.position ?? 0,
      impact: 3,
      effortValue: 2.5,
      confidence: 0.9,
      steps: [
        "Canonical, interne Links und Host-Weiterleitung für beide URL-Varianten prüfen.",
        "Nicht addierte Search-Varianten gegen den Serverstatus abgleichen.",
        "Redirect oder Canonical nur bei bestätigter technischer Dublette anpassen.",
      ],
      document,
      maxImpressions,
    }));
  }

  const sorted = dedupeOpportunities(opportunities);
  const selectionScore = (item: AdvisorOpportunity): number => {
    const searchOpportunity = item.category === "ranking" || item.category === "ctr";
    const realisticPosition = (item.dataBasis.position ?? 0) >= 4 && (item.dataBasis.position ?? 0) <= 20;
    return item.score + (searchOpportunity ? 14 : 0) + (realisticPosition ? 10 : 0) + (item.pageType === "Cornerstone" || item.pageType === "Vergleich" || item.pageType === "Produkt" ? 4 : 0);
  };
  const prioritizedForToday = [...sorted].sort((a, b) => selectionScore(b) - selectionScore(a) || b.score - a.score);
  const topTasks: AdvisorOpportunity[] = [];
  const usedTargets = new Set<string>();
  for (const item of prioritizedForToday) {
    const target = item.url ? normalizeSeoPath(item.url) : normalizeText(item.query ?? item.title);
    if (usedTargets.has(target)) continue;
    usedTargets.add(target);
    topTasks.push(item);
    if (topTasks.length === 5) break;
  }

  const trafficWin = [...sorted]
    .filter((item) => (item.category === "ranking" || item.category === "ctr") && (item.dataBasis.position ?? 0) >= 4 && (item.dataBasis.position ?? 0) <= 20)
    .sort((a, b) => selectionScore(b) - selectionScore(a) || b.score - a.score)[0] ?? topTasks[0];
  const graphGaps = buildGraphGaps(input);
  const editorialCalendar = buildEditorialCalendar(documents);
  const conversionInsights = buildConversionInsights(input);

  return {
    range,
    dataConfidence: totalImpressions >= 3000 ? "hoch" : totalImpressions >= 1000 ? "mittel" : "gering",
    dataNotice: lowDomainData
      ? `Der Zeitraum enthält ${totalImpressions} Impressionen. Empfehlungen sind konservative Arbeitshypothesen und keine Beweise oder Traffic-Prognosen.`
      : `Der Zeitraum enthält ${totalImpressions} Impressionen; einzelne Aufgaben bleiben anhand ihrer URL-Daten gekennzeichnet.`,
    opportunities: sorted,
    topTasks,
    quickWins: quickWins(sorted),
    trafficWin,
    eeat: eeat.slice(0, 12),
    contentGaps: contentGaps.slice(0, 12),
    cannibalization,
    linkRecommendations,
    graphGaps,
    editorialCalendar,
    conversionInsights,
    history: {
      hasComparison: false,
      message: "Noch keine historische Vergleichsbasis: Die vorhandene Datei enthält mehrere Zeitfenster desselben Snapshots, aber keine früheren Advisor-Snapshots.",
      snapshots: input.payload.generatedAt
        ? [{ generatedAt: input.payload.generatedAt, rangeKey: range.key, metrics: range.metrics.current }]
        : [],
    },
  };
};
