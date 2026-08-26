import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { splitFrontmatter } from "../authority-distribution/gps-subscriptions.mjs";

export const DEMAND_STATUSES = ["covered", "partial", "fragmented", "missing", "overcovered", "uncertain"];
export const SOURCE_SIGNAL_TYPES = ["google-search-signal", "bing", "gsc", "competitor-serp", "community", "manufacturer", "existing-research"];

const STOP = new Set("aber als am an auf aus bei bis das dem den der die ein eine einer eines fuer für im in ist kann kein keine mit nach oder ohne und vom von was welche welcher wie wird zu zum zur".split(" "));
const clean = (value) => String(value ?? "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, " ").trim();
const SEMANTIC_TERMS = {
  selbstreinigend: ["wartung", "reinigung"],
  wartungsfrei: ["wartung", "reinigung"],
  gewohnungsablauf: ["gewohnung", "eingewohnung", "akzeptanz"],
  internetausfall: ["offline", "cloud", "wlan"],
  herstellerdienstausfall: ["offline", "cloud"],
};
const tokens = (value) => {
  const base = clean(value).split(/\s+/).filter((token) => token.length > 2 && !STOP.has(token));
  return [...new Set(base.flatMap((token) => [token, ...(SEMANTIC_TERMS[token] ?? [])]))];
};
const overlap = (left, right) => {
  const a = tokens(left); const b = new Set(tokens(right));
  return a.length ? a.filter((token) => b.has(token)).length / a.length : 0;
};
const unique = (items) => [...new Set(items.filter(Boolean))];
const route = (value) => {
  const raw = String(value ?? "").replace(/^https?:\/\/[^/]+/i, "").split(/[?#]/, 1)[0];
  if (!raw.startsWith("/")) return "";
  return raw.endsWith("/") ? raw : `${raw}/`;
};
const noiseQuery = (query) => /(?:filetype:|site:|\s-[a-z]|\b(?:abs|fods)\b)/i.test(query);

export function inferCluster(value) {
  const text = clean(value);
  const rules = [
    ["futterautomaten", /futter|futterautomat|nassfutter|trockenfutter|futterung/],
    ["gps-tracker", /gps|tracker|tractive|weenect|garmin|paj|pawfit/],
    ["trinkbrunnen", /trinkbrunnen|katzenbrunnen|pumpe|wasser/],
    ["katzenklappen", /katzenklappe|mikrochipklappe|tailgating/],
    ["automatische-katzentoiletten", /katzentoilette|katzenklo|streu/],
    ["haustierkameras", /haustierkamera|hundekamera|katzenkamera|pet cam|indoor kamera/],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] ?? "unknown";
}

export function inferIntent(value) {
  const text = clean(value);
  if (/warum|wie funktioniert|was ist/.test(text)) return "informational";
  if (/vergleich|beste|welche|oder|vs|fur 2|fuer 2|mit |ohne |kleine|grosse/.test(text)) return "commercial-investigation";
  if (/reinigen|einsetzen|ausfall|funktioniert|problem|pieps/.test(text)) return "problem-solving";
  if (/^[a-z0-9 ]{3,45}$/.test(text) && /tractive|weenect|garmin|petkit|paj/.test(text)) return "product-navigation";
  return "informational";
}

function signal(provider, details) {
  const type = provider === "google" ? "gsc" : provider === "bing" ? "bing" : provider;
  return { type, ...details };
}

export function nodesFromGroundTruth(report, discoveredAt) {
  return (report?.nodes ?? []).map((item) => ({
    id: `research:${item.id}`,
    cluster: item.cluster,
    topic: item.id,
    userProblem: item.demand,
    intent: inferIntent(item.demand),
    sourceSignals: [signal("existing-research", { source: "demand-enhancement-1", evidence: item.finding, references: item.evidence ?? [], observedStatus: item.beforeStatus })],
    candidateQueries: [],
    discoveredAt,
    confidence: item.confidence === "high" ? "high" : item.confidence === "low" ? "low" : "medium",
    expectedOwner: route(item.intentOwner),
    sourceFile: item.sourceFile,
    groundTruth: { beforeStatus: item.beforeStatus, afterStatus: item.afterStatus, skipped: item.skipped },
  }));
}

export function nodesFromSearch(search, { rangeKey = "28d", limit = 12 } = {}) {
  const range = search?.ranges?.[rangeKey];
  if (!range) return [];
  const groups = new Map();
  for (const row of range.queries ?? []) {
    if (!row?.query || noiseQuery(row.query) || Number(row.impressions) <= 0) continue;
    const cluster = inferCluster(row.query);
    if (cluster === "unknown") continue;
    const intent = inferIntent(row.query);
    const signature = `${cluster}|${intent}|${tokens(row.query).sort().slice(0, 5).join("-")}`;
    const current = groups.get(signature) ?? { cluster, intent, queries: [], signals: [] };
    current.queries.push(row.query);
    for (const provider of row.sources ?? []) current.signals.push(signal(provider, {
      query: row.query,
      impressions: row.providers?.[provider]?.impressions ?? row.impressions,
      clicks: row.providers?.[provider]?.clicks ?? row.clicks,
      position: row.providers?.[provider]?.position ?? row.position,
      range: rangeKey,
    }));
    groups.set(signature, current);
  }
  return [...groups.values()].slice(0, limit).map((group, index) => ({
    id: `search:${group.cluster}:${index + 1}:${tokens(group.queries[0]).slice(0, 4).join("-")}`,
    cluster: group.cluster,
    topic: group.queries[0],
    userProblem: group.queries[0],
    intent: group.intent,
    sourceSignals: group.signals,
    candidateQueries: unique(group.queries),
    discoveredAt: search.generatedAt,
    confidence: unique(group.signals.map((item) => item.type)).length >= 2 ? "high" : "medium",
  }));
}

export async function loadContentDocuments(appRoot, graph) {
  const documents = [];
  for (const node of graph?.nodes ?? []) {
    if (!node.sourceFile) continue;
    const file = path.join(appRoot, node.sourceFile.replace(/^apps\/pfotentechnik\//, ""));
    try {
      const raw = await fs.readFile(file, "utf8");
      const frontmatter = yaml.load(splitFrontmatter(raw, file)) ?? {};
      const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
      const headings = [...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => match[1]);
      documents.push({ ...node, frontmatter, body, headings, route: route(node.route) });
    } catch {}
  }
  return documents;
}

function searchRouteHints(node, search, rangeKey) {
  const queries = new Set((node.candidateQueries ?? []).map(clean));
  const hints = [];
  for (const row of search?.ranges?.[rangeKey]?.pageQueries ?? []) {
    if (!queries.has(clean(row.query))) continue;
    const target = route(row.page);
    if (target) hints.push(target);
  }
  return unique(hints);
}

export function scoreDocument(node, document, { hintedRoutes = [] } = {}) {
  const demand = `${node.topic} ${node.userProblem} ${(node.candidateQueries ?? []).join(" ")}`;
  const titleScore = overlap(demand, `${document.title} ${document.description}`);
  const headingScore = overlap(demand, document.headings.join(" "));
  const bodyScore = overlap(demand, document.body);
  const graphScore = overlap(demand, `${(document.topics ?? []).join(" ")} ${(document.tags ?? []).join(" ")} ${(document.aliases ?? []).join(" ")}`);
  const clusterMatch = clean(document.cluster).includes(clean(node.cluster).replace(/-/g, " ")) || clean(node.cluster).includes(clean(document.cluster));
  const expected = node.expectedOwner && document.route === node.expectedOwner;
  const searchHint = hintedRoutes.includes(document.route);
  const fromSearch = String(node.id).startsWith("search:");
  const score = Math.min(1, fromSearch
    ? titleScore * .32 + headingScore * .22 + bodyScore * .08 + graphScore * .08 + (clusterMatch ? .06 : 0) + (searchHint ? .2 : 0)
    : titleScore * .22 + headingScore * .25 + bodyScore * .23 + graphScore * .15 + (clusterMatch ? .08 : 0) + (expected ? .12 : 0) + (searchHint ? .12 : 0));
  return { score: Number(score.toFixed(3)), signals: { titleScore, headingScore, bodyScore, graphScore, clusterMatch, expectedOwner: Boolean(expected), searchPageQuery: searchHint } };
}

function classify(ranked, node) {
  const best = ranked[0]; const second = ranked[1];
  if (!best || best.score < .16) return "missing";
  if (node.expectedOwner && best.document.route === node.expectedOwner && best.score >= .35) return "covered";
  const competing = ranked.filter((item) => item.score >= .55 && item.score >= best.score * .9 && item.document.type === best.document.type);
  if (competing.length >= 3 && !node.expectedOwner) return "overcovered";
  if (second && !node.expectedOwner && best.score >= .3 && second.score >= best.score * .92 && best.document.route !== second.document.route && best.document.type === second.document.type) return "fragmented";
  if (best.score >= .38) return "covered";
  if (best.score >= .22) return "partial";
  return "uncertain";
}

const actionFor = (status, owner) => ({
  covered: "Keine Content-Aktion.",
  partial: `Bestehende Intent-Owner-Seite ${owner || "manuell"} auf die konkrete Inhaltslücke prüfen.`,
  fragmented: "Intent Ownership und mögliche Konsolidierung manuell prüfen.",
  missing: "Nur als Research Candidate vormerken; keine Seite automatisch erzeugen.",
  overcovered: "Als mögliches Kannibalisierungs-Finding auditieren; nichts automatisch ändern.",
  uncertain: "Manuell prüfen; Signal reicht für keine Content-Entscheidung.",
})[status];

export function matchDemandNodes(nodes, documents, { search = null, rangeKey = "28d" } = {}) {
  return nodes.map((node) => {
    const hintedRoutes = searchRouteHints(node, search, rangeKey);
    const ranked = documents.map((document) => ({ document, ...scoreDocument(node, document, { hintedRoutes }) }))
      .sort((a, b) => b.score - a.score || a.document.route.localeCompare(b.document.route));
    const status = classify(ranked, node);
    const best = ranked[0];
    const searchOwner = ranked.find((item) => item.signals.searchPageQuery)?.document.route;
    const owner = node.expectedOwner || searchOwner || best?.document.route || null;
    const resolvedOwner = ["fragmented", "overcovered"].includes(status) && !node.expectedOwner && !searchOwner ? null : owner;
    const evidenceTypes = unique(node.sourceSignals.map((item) => item.type));
    const confidence = evidenceTypes.length >= 2 && best?.score >= .38 ? "high" : best?.score >= .3 || node.confidence === "high" ? "medium" : "low";
    const publicationBlocked = Boolean(node.publicationGate && node.publicationGate !== "ready" && node.publicationGate !== "validated");
    const gap = publicationBlocked ? `Das referenzierte Data Finding steht auf ${node.publicationGate}; daraus wird keine Content-Aktion abgeleitet.`
      : status === "covered" ? null
      : status === "missing" ? "Kein ausreichend passender bestehender Inhalt nachweisbar."
      : status === "fragmented" ? `Ähnlich starke Matches auf ${ranked.slice(0, 3).map((item) => item.document.route).join(", ")}.`
      : status === "overcovered" ? `Mindestens drei starke Inhaltsmatches ohne eindeutigen Owner: ${ranked.filter((item) => item.score >= .38).slice(0, 5).map((item) => item.document.route).join(", ")}.`
      : status === "partial" ? `Der beste Match ${owner} deckt nur einen Teil der Problembegriffe in Überschriften, Inhalt und Graph-Metadaten ab.`
      : "Die vorhandenen Signale ergeben keinen stabilen Match.";
    return {
      demandNodeId: node.id,
      cluster: node.cluster,
      userProblem: node.userProblem,
      demandEvidence: node.sourceSignals,
      intentOwner: resolvedOwner,
      status,
      gap,
      recommendedAction: publicationBlocked ? "Keine Content-Aktion; Data Finding zuerst fachlich validieren." : actionFor(status, resolvedOwner),
      confidence,
      newPageRequired: status === "missing",
      publicationBlocked,
      matchEvidence: ranked.slice(0, 3).map((item) => ({ route: item.document.route, title: item.document.title, score: item.score, signals: item.signals })),
      groundTruth: node.groundTruth,
    };
  });
}

export function activeOpportunities(matches, limit = 20) {
  return matches.filter((item) => item.status !== "covered").slice(0, limit);
}

export function renderOpportunities({ generatedAt, matches, infrastructure, inputs }) {
  const counts = Object.fromEntries(DEMAND_STATUSES.map((status) => [status, matches.filter((item) => item.status === status).length]));
  const active = activeOpportunities(matches);
  const rows = active.length ? active.map((item) => `| ${item.cluster} | ${item.userProblem.replace(/\|/g, "\\|")} | ${item.intentOwner ?? "–"} | ${item.status} | ${item.confidence} | ${item.newPageRequired ? "true" : "false"} |`).join("\n") : "Keine aktiven Opportunities; alle aktuellen Nodes sind abgedeckt.";
  return `# Demand Discovery\n\nGeneriert: ${generatedAt}\n\n## Trennung der Systeme\n\n- **Interne Matching Engine:** ordnet belegte Demand Nodes vorhandenen Seiten zu. Sie verwendet Content, Überschriften, Frontmatter, Content Graph, Search-Page-Query-Signale und vorhandene Intent-Owner.\n- **Externe Demand Discovery:** stammt in diesem Lauf ausschließlich aus vorhandenen GSC-/Bing-Queries und bestehender Research-Evidence. Für neue Wettbewerber-, Community- oder SERP-Signale ist weiterhin eine ausdrücklich konfigurierte Web-/SERP-Quelle nötig.\n\nKeine Nachfrage, kein Suchvolumen und keine SERP-Beobachtung wird erfunden.\n\n## Wiederverwendete Infrastruktur\n\n${infrastructure.map((item) => `- ${item}`).join("\n")}\n\n## Datenstand\n\n- Search: ${inputs.searchGeneratedAt ?? "nicht verfügbar"}\n- Google: ${inputs.googleUpdatedAt ?? "nicht verfügbar"}\n- Bing: ${inputs.bingUpdatedAt ?? "nicht verfügbar"}\n- Content Graph: ${inputs.graphGeneratedAt ?? "nicht verfügbar"}\n- Research Ground Truth: ${inputs.groundTruthGeneratedAt ?? "nicht verfügbar"}\n\n## Matching-Ergebnis\n\n${DEMAND_STATUSES.map((status) => `- ${status}: ${counts[status]}`).join("\n")}\n\nAktive Opportunities: ${active.length} von maximal 20.\n\n| Cluster | Nutzerproblem | Intent Owner | Status | Confidence | new-page-required |\n|---|---|---|---|---|---|\n${rows}\n\n## Manuelle Prüfung\n\n${active.length ? active.map((item) => `### ${item.userProblem}\n\n- Demand Evidence: ${unique(item.demandEvidence.map((signal) => signal.type)).join(", ")}\n- Konkreter Gap: ${item.gap}\n- Empfohlene Aktion: ${item.recommendedAction}\n`).join("\n") : "Keine aktive Inhaltsaktion. Die Ground-Truth-Fälle bleiben als Regression erhalten."}\n\n## Admin-Integration\n\nIm bestehenden Research-/SEO-Bereich genügt eine Arbeitsliste **Demand Discovery**. Sie liest \`demand-matching.json\`, zeigt standardmäßig nur \`partial\`, \`missing\`, \`fragmented\` und \`overcovered\` und bietet Statusfilter. Keine neue App, keine Scoresammlung und keine schreibende Aktion sind erforderlich.\n\n## Guardrails\n\nDie Pipeline schreibt ausschließlich Reports. Sie erstellt oder ändert weder Seiten noch Texte, Redirects, Titles, Descriptions, Canonicals, Affiliate-Daten, Social Posts oder Outreach. \`missing\` bedeutet ausschließlich Research Candidate.\n`;
}
