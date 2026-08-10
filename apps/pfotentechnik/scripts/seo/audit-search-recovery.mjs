#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DIST_ROOT = path.join(APP_ROOT, "dist");
const REPORT_ROOT = path.join(APP_ROOT, "reports", "seo-recovery");
const DATA_ROOT = path.join(APP_ROOT, "src", "data", "seo");
const REDIRECT_FILE = path.join(APP_ROOT, "public", "_redirects");
const GSC_FILE = path.join(DATA_ROOT, "gsc-dashboard-ranges.json");
const STRICT = process.argv.includes("--strict");
const WRITE_DASHBOARD = !STRICT || process.argv.includes("--write-dashboard");
const argValue = (name, fallback) => {
  const hit = process.argv.find((item) => item.startsWith(name + "="));
  return hit ? hit.slice(name.length + 1) : fallback;
};
const PRIMARY_RANGE = argValue("--range", "28d");
const CONTEXT_RANGE = argValue("--context", "3m");
const CANONICAL_ORIGIN = "https://pfotentechnik.de";

const normalizeRoute = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "/";
  try {
    const url = new URL(raw.startsWith("http://") || raw.startsWith("https://") ? raw : raw.startsWith("/") ? CANONICAL_ORIGIN + raw : CANONICAL_ORIGIN + "/" + raw);
    const pathname = url.pathname.replace(/\/+/g, "/").replace(/\/+$/, "");
    return pathname ? pathname + "/" : "/";
  } catch {
    const clean = ("/" + raw.split(/[?#]/, 1)[0]).replace(/\/+/g, "/").replace(/\/+$/, "");
    return clean ? clean + "/" : "/";
  }
};

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

const walk = (dir, predicate) => {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(absolute);
      else if (!predicate || predicate(absolute)) out.push(absolute);
    }
  }
  return out;
};

const routeForHtml = (file) => {
  const relative = path.relative(DIST_ROOT, file).replace(/\\/g, "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return normalizeRoute("/" + relative.slice(0, -10));
  return normalizeRoute("/" + relative.replace(/\.html$/i, ""));
};

const metricsMap = (range) => {
  const map = new Map();
  for (const row of range && Array.isArray(range.pages) ? range.pages : []) {
    const route = normalizeRoute(row.page);
    const candidate = {
      clicks: Number(row.clicks) || 0,
      impressions: Number(row.impressions) || 0,
      ctr: Number(row.ctr) || 0,
      position: Number(row.position) || 0
    };
    const current = map.get(route);
    if (!current || candidate.impressions > current.impressions || (candidate.impressions === current.impressions && candidate.clicks > current.clicks)) map.set(route, candidate);
  }
  return map;
};

const pageQueryMap = (range) => {
  const map = new Map();
  for (const row of range && Array.isArray(range.pageQueries) ? range.pageQueries : []) {
    const route = normalizeRoute(row.page);
    if (!map.has(route)) map.set(route, []);
    map.get(route).push({
      query: String(row.query || "").trim(),
      clicks: Number(row.clicks) || 0,
      impressions: Number(row.impressions) || 0,
      ctr: Number(row.ctr) || 0,
      position: Number(row.position) || 0
    });
  }
  for (const rows of map.values()) rows.sort((a, b) => b.impressions - a.impressions || a.position - b.position);
  return map;
};

const emptyMetrics = () => ({ clicks: 0, impressions: 0, ctr: 0, position: 0 });
const findings = [];
const addFinding = (severity, code, subject, message) => findings.push({ severity, code, subject, message });

const redirectMap = new Map();
if (fs.existsSync(REDIRECT_FILE)) {
  for (const rawLine of fs.readFileSync(REDIRECT_FILE, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;
    const sourceRaw = parts[0];
    const targetRaw = parts[1];
    const status = Number(parts[2] || 301);
    if (![301, 308].includes(status)) continue;
    if (/[*:]/.test(sourceRaw) || /[*:]/.test(targetRaw.replace(/^https?:\/\//, ""))) continue;
    const source = normalizeRoute(sourceRaw);
    const target = normalizeRoute(targetRaw);
    if (source === target) {
      addFinding("error", "REDIRECT_SELF", source, "Permanent Redirect zeigt auf sich selbst.");
      continue;
    }
    if (redirectMap.has(source) && redirectMap.get(source).target !== target) {
      addFinding("error", "REDIRECT_CONFLICT", source, "Mehrere permanente Ziele: " + redirectMap.get(source).target + " und " + target + ".");
      continue;
    }
    redirectMap.set(source, { source, target, status });
  }
} else {
  addFinding("error", "REDIRECT_FILE_MISSING", "public/_redirects", "Redirect-Datei fehlt.");
}

const distAvailable = fs.existsSync(DIST_ROOT);
const routeInfo = new Map();
const incomingLinks = new Map();
const sitemapRoutes = new Set();

if (distAvailable) {
  for (const file of walk(DIST_ROOT, (candidate) => candidate.endsWith(".html"))) {
    const html = fs.readFileSync(file, "utf8");
    const route = routeForHtml(file);
    const canonicalMatch =
      html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
    const robots = [
      ...html.matchAll(/<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/gi),
      ...html.matchAll(/<meta\b[^>]*content=["']([^"']*)["'][^>]*name=["']robots["']/gi)
    ].map((match) => match[1].toLowerCase()).join(",");
    const canonical = canonicalMatch ? normalizeRoute(canonicalMatch[1]) : "";
    const noindex = /(?:^|[,\s])noindex(?:[,\s]|$)/i.test(robots);
    routeInfo.set(route, { route, canonical, noindex, file: path.relative(APP_ROOT, file).replace(/\\/g, "/") });

    for (const match of html.matchAll(/\bhref=["']([^"'#]+)["']/gi)) {
      const raw = match[1];
      if (/^(?:mailto:|tel:|javascript:)/i.test(raw)) continue;
      let url;
      try { url = new URL(raw, CANONICAL_ORIGIN + route); } catch { continue; }
      if (!["pfotentechnik.de", "www.pfotentechnik.de"].includes(url.hostname.toLowerCase())) continue;
      const target = normalizeRoute(url.pathname);
      incomingLinks.set(target, (incomingLinks.get(target) || 0) + 1);
    }
  }

  for (const file of walk(DIST_ROOT, (candidate) => /sitemap.*\.xml$/i.test(candidate))) {
    const xml = fs.readFileSync(file, "utf8");
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/gi)) sitemapRoutes.add(normalizeRoute(match[1]));
  }
}

const gsc = readJson(GSC_FILE);
const ranges = gsc && gsc.ranges && typeof gsc.ranges === "object" ? gsc.ranges : {};
const primary = ranges[PRIMARY_RANGE] || null;
const context = ranges[CONTEXT_RANGE] || null;
if (!gsc) addFinding("warning", "GSC_DATA_MISSING", "gsc-dashboard-ranges.json", "GSC-Zeitraumdaten fehlen; Recovery-Signale und Opportunities bleiben leer.");
else if (!primary) addFinding("warning", "GSC_PRIMARY_RANGE_MISSING", PRIMARY_RANGE, "Primärer GSC-Zeitraum fehlt.");
if (gsc && gsc.provider && gsc.provider !== "google") addFinding("error", "GSC_PROVIDER_INVALID", String(gsc.provider), "Recovery darf ausschließlich Google-Search-Console-Daten verwenden.");

const primaryMetrics = metricsMap(primary);
const contextMetrics = metricsMap(context);
const primaryQueries = pageQueryMap(primary);

const resolveFinalTarget = (source) => {
  const seen = new Set([source]);
  const chain = [];
  let current = source;
  while (redirectMap.has(current) && chain.length < 12) {
    const next = redirectMap.get(current).target;
    chain.push(next);
    if (seen.has(next)) return { final: next, chain, loop: true };
    seen.add(next);
    current = next;
  }
  return { final: current, chain, loop: false };
};

const migrations = [];
for (const entry of redirectMap.values()) {
  const chain = resolveFinalTarget(entry.source);
  const target = entry.target;
  const targetInfo = routeInfo.get(target);
  const sourceInfo = routeInfo.get(entry.source);
  const technicalIssues = [];

  if (chain.loop) technicalIssues.push("Redirect-Schleife");
  if (chain.chain.length > 1) technicalIssues.push("mehrstufige Redirect-Kette");
  if (distAvailable) {
    if (!targetInfo) technicalIssues.push("Ziel fehlt im Build");
    if (sourceInfo) technicalIssues.push("alte URL wird weiterhin als HTML gebaut");
    if (targetInfo && targetInfo.noindex) technicalIssues.push("Ziel ist noindex");
    if (targetInfo && targetInfo.canonical !== target) technicalIssues.push("Self-Canonical fehlt oder zeigt auf " + (targetInfo.canonical || "kein Canonical"));
    if (!sitemapRoutes.has(target)) technicalIssues.push("Ziel fehlt in Sitemap");
    if (sitemapRoutes.has(entry.source)) technicalIssues.push("alte URL steht noch in Sitemap");
    if ((incomingLinks.get(entry.source) || 0) > 0) technicalIssues.push("interne Links zeigen noch auf alte URL");
  }

  for (const issue of technicalIssues) addFinding("error", "MIGRATION_TECHNICAL", entry.source + " -> " + target, issue + ".");
  const oldPrimary = primaryMetrics.get(entry.source) || emptyMetrics();
  const newPrimary = primaryMetrics.get(target) || emptyMetrics();
  const oldContext = contextMetrics.get(entry.source) || emptyMetrics();
  const newContext = contextMetrics.get(target) || emptyMetrics();

  let status = "healthy";
  if (technicalIssues.length) status = "risk";
  else if (oldPrimary.impressions >= 2 && newPrimary.impressions === 0) status = "watch";
  else if (oldPrimary.impressions > 0 && newPrimary.impressions > 0) status = "transferring";
  else if (oldPrimary.impressions > 0) status = "watch";

  migrations.push({
    source: entry.source,
    target,
    finalTarget: chain.final,
    status,
    redirectStatus: entry.status,
    oneHop: chain.chain.length === 1,
    technicalIssues,
    technical: {
      distAvailable,
      targetBuilt: Boolean(targetInfo),
      sourceBuilt: Boolean(sourceInfo),
      canonical: targetInfo ? targetInfo.canonical : "",
      noindex: targetInfo ? targetInfo.noindex : false,
      sourceInSitemap: sitemapRoutes.has(entry.source),
      targetInSitemap: sitemapRoutes.has(target),
      sourceInternalLinks: incomingLinks.get(entry.source) || 0,
      targetInternalLinks: incomingLinks.get(target) || 0
    },
    signal: {
      primaryRange: PRIMARY_RANGE,
      primaryOld: oldPrimary,
      primaryNew: newPrimary,
      contextRange: CONTEXT_RANGE,
      contextOld: oldContext,
      contextNew: newContext
    }
  });
}

migrations.sort((a, b) => {
  const rank = { risk: 0, watch: 1, transferring: 2, healthy: 3 };
  return rank[a.status] - rank[b.status] ||
    b.signal.primaryOld.impressions - a.signal.primaryOld.impressions ||
    b.signal.primaryNew.impressions - a.signal.primaryNew.impressions;
});

const redirectSources = new Set(migrations.map((row) => row.source));
const redirectTargets = new Map();
for (const row of migrations) {
  if (!redirectTargets.has(row.target)) redirectTargets.set(row.target, []);
  redirectTargets.get(row.target).push(row);
}

const benchmarkCtr = (position) => {
  if (position <= 3) return 8;
  if (position <= 5) return 5;
  if (position <= 10) return 3;
  if (position <= 20) return 1.5;
  return 1;
};
const rankingScore = (position, impressions) => {
  if (!impressions || !position) return 0;
  if (position <= 3) return 12;
  if (position <= 5) return 18;
  if (position <= 10) return 30;
  if (position <= 20) return 28;
  if (position <= 30) return 20;
  if (position <= 40) return 12;
  return 4;
};
const commercialScore = (route) => {
  if (route.startsWith("/vergleiche/")) return 10;
  if (route.startsWith("/produkt/")) return 9;
  if (route.startsWith("/hersteller/")) return 6;
  if (["/smarte-futterautomaten/", "/trinkbrunnen/", "/gps-tracker/", "/katzenklappen/", "/automatische-katzentoiletten/", "/haustierkameras/"].includes(route)) return 8;
  return 4;
};
const typeForRoute = (route) => {
  if (route.startsWith("/vergleiche/")) return "comparison";
  if (route.startsWith("/produkt/")) return "product";
  if (route.startsWith("/hersteller/")) return "manufacturer";
  if (["/smarte-futterautomaten/", "/trinkbrunnen/", "/gps-tracker/", "/katzenklappen/", "/automatische-katzentoiletten/", "/haustierkameras/"].includes(route)) return "hub";
  return "content";
};
const actionFor = (type, position) => {
  if (type === "comparison") return position <= 15
    ? "Intent-Ownership festigen, unabhängige Evidenz schärfen und gezielte interne/externe Links aufbauen."
    : "SERP-Intent und Konkurrenz-Gaps prüfen, bevor weiterer Content ergänzt wird.";
  if (type === "product") return "Externe Evidenz, konkrete Schwächen/Stärken, Snippet und kontextuelle interne Links verbessern.";
  if (type === "manufacturer") return "Marken- und Modellabdeckung schärfen und die wichtigsten Produktziele intern priorisieren.";
  if (type === "hub") return "Hub als Verteiler stärken; keine zusätzlichen konkurrierenden Intent-Seiten erzeugen.";
  return position <= 15
    ? "Antwort oberhalb des Folds präzisieren und passende Hub-/Vergleichslinks stärken."
    : "Suchintention gegen die rankende Seite prüfen; nur bei klarer Lücke gezielt überarbeiten.";
};

const primaryRows = primary && Array.isArray(primary.pages) ? primary.pages : [];
const maxImpressions = Math.max(1, ...primaryRows.map((row) => Number(row.impressions) || 0));
const opportunities = [];

for (const row of primaryRows) {
  const route = normalizeRoute(row.page);
  if (redirectSources.has(route) || route.startsWith("/admin/")) continue;
  const info = routeInfo.get(route);
  if (distAvailable && (!info || info.noindex)) continue;

  const impressions = Number(row.impressions) || 0;
  const clicks = Number(row.clicks) || 0;
  const ctr = Number(row.ctr) || 0;
  const position = Number(row.position) || 0;
  if (!impressions || !position) continue;

  const queries = primaryQueries.get(route) || [];
  const contextRow = contextMetrics.get(route) || emptyMetrics();
  const scores = {
    ranking: rankingScore(position, impressions),
    impressions: Math.round(20 * Math.log1p(impressions) / Math.log1p(maxImpressions)),
    ctrPotential: impressions >= 3 && position <= 20 ? Math.round(15 * Math.max(0, 1 - ctr / benchmarkCtr(position))) : 0,
    queryMatch: queries.length ? Math.min(15, 7 + Math.min(8, queries.length * 2)) : 0,
    context: contextRow.impressions > impressions ? 10 : contextRow.impressions > 0 ? 6 : 0,
    commercial: commercialScore(route)
  };
  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  const type = typeForRoute(route);
  const migrationRows = redirectTargets.get(route) || [];
  const status = position <= 5 ? "defend" : position <= 15 ? "push" : position <= 30 ? "improve" : "investigate";
  const confidence = impressions >= 20 ? "high" : impressions >= 5 ? "medium" : "low";

  opportunities.push({
    page: route,
    type,
    status,
    confidence,
    score: total,
    scores,
    metrics: { clicks, impressions, ctr, position },
    contextMetrics: contextRow,
    queries: queries.slice(0, 6),
    migrationSources: migrationRows.map((item) => item.source),
    action: actionFor(type, position)
  });
}

opportunities.sort((a, b) => b.score - a.score || b.metrics.impressions - a.metrics.impressions || a.metrics.position - b.metrics.position);

const technicalErrors = findings.filter((item) => item.severity === "error").length;
const warnings = findings.filter((item) => item.severity === "warning").length;
const summary = {
  redirects: migrations.length,
  migrationRisk: migrations.filter((row) => row.status === "risk").length,
  migrationWatch: migrations.filter((row) => row.status === "watch").length,
  transferring: migrations.filter((row) => row.status === "transferring").length,
  technicalErrors,
  warnings,
  opportunities: opportunities.length,
  distAvailable
};

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: {
    provider: "google",
    gscFile: path.relative(APP_ROOT, GSC_FILE).replace(/\\/g, "/"),
    redirectFile: path.relative(APP_ROOT, REDIRECT_FILE).replace(/\\/g, "/"),
    primaryRange: PRIMARY_RANGE,
    contextRange: CONTEXT_RANGE
  },
  summary,
  migrations,
  opportunities,
  findings
};

fs.mkdirSync(REPORT_ROOT, { recursive: true });
fs.mkdirSync(DATA_ROOT, { recursive: true });
fs.writeFileSync(path.join(REPORT_ROOT, "recovery-latest.json"), JSON.stringify(output, null, 2) + "\n", "utf8");
if (WRITE_DASHBOARD) fs.writeFileSync(path.join(DATA_ROOT, "recovery-dashboard.json"), JSON.stringify(output, null, 2) + "\n", "utf8");

const migrationLines = migrations.slice(0, 40).map((row) =>
  "- **" + row.status.toUpperCase() + "** `" + row.source + "` → `" + row.target + "` · " +
  PRIMARY_RANGE + ": alt " + row.signal.primaryOld.impressions + " / neu " + row.signal.primaryNew.impressions + " Impr." +
  (row.technicalIssues.length ? " · " + row.technicalIssues.join("; ") : "")
);
const opportunityLines = opportunities.slice(0, 30).map((row, index) =>
  (index + 1) + ". **" + row.page + "** · Score " + row.score + "/100 · " +
  row.metrics.impressions + " Impr. · Pos. " + row.metrics.position.toFixed(1) + " · " + row.action
);

const markdown = [
  "# SEO Recovery & GSC Opportunity",
  "",
  "- Quelle: ausschließlich Google Search Console",
  "- Primärzeitraum: " + PRIMARY_RANGE,
  "- Kontextzeitraum: " + CONTEXT_RANGE,
  "- Permanente Redirects: " + summary.redirects,
  "- Technische Fehler: " + summary.technicalErrors,
  "- Signal-Watch: " + summary.migrationWatch,
  "- Transfer sichtbar: " + summary.transferring,
  "- Opportunities: " + summary.opportunities,
  "- Build-Prüfung verfügbar: " + (summary.distAvailable ? "ja" : "nein"),
  "",
  "## Migration Recovery",
  "",
  ...(migrationLines.length ? migrationLines : ["Keine permanenten Redirects gefunden."]),
  "",
  "## GSC Opportunities",
  "",
  ...(opportunityLines.length ? opportunityLines : ["Keine belastbaren GSC-Seitensignale vorhanden."]),
  "",
  "## Findings",
  "",
  ...(findings.length ? findings.map((item) => "- **" + item.severity.toUpperCase() + " · " + item.code + "** " + item.subject + ": " + item.message) : ["Keine Findings."]),
  ""
].join("\n");

fs.writeFileSync(path.join(REPORT_ROOT, "recovery-latest.md"), markdown, "utf8");

console.log("SEO Recovery & GSC Opportunity");
console.log("Quelle: Google Search Console");
console.log("Redirects:", summary.redirects);
console.log("Technische Fehler:", summary.technicalErrors);
console.log("Signal-Watch:", summary.migrationWatch);
console.log("Transfer sichtbar:", summary.transferring);
console.log("Opportunities:", summary.opportunities);
console.log("Report:", path.relative(APP_ROOT, path.join(REPORT_ROOT, "recovery-latest.md")));
if (STRICT && technicalErrors > 0) process.exitCode = 1;
