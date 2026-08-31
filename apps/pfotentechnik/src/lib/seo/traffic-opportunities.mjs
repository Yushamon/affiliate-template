import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const REPO_ROOT = path.resolve(APP_ROOT, "../..");
const DASHBOARD_FILES = [
  path.join(APP_ROOT, "src/data/seo/search-dashboard-ranges.json"),
  path.join(APP_ROOT, "src/data/seo/gsc-dashboard-ranges.json"),
];
const RECOVERY_FILE = path.join(APP_ROOT, "reports/seo-recovery/recovery-latest.json");
const LINK_HEALTH_FILE = path.join(APP_ROOT, "reports/internal-linking/internal-link-health-audit.json");
const DEMAND_FILE = path.join(REPO_ROOT, "reports/demand-discovery/demand-depth-program-04.json");

const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const asArray = (value) => Array.isArray(value) ? value : [];

export const normalizeTrafficRoute = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "/";
  try {
    const parsed = new URL(raw, "https://pfotentechnik.de");
    const normalized = parsed.pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "");
    return normalized ? `${normalized}/` : "/";
  } catch {
    const normalized = (`/${raw.split(/[?#]/, 1)[0]}`).replace(/\/{2,}/g, "/").replace(/\/+$/, "");
    return normalized ? `${normalized}/` : "/";
  }
};

const readJson = (file) => {
  try {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
  } catch {
    return null;
  }
};

const metric = (row = {}) => ({
  clicks: finite(row.clicks),
  impressions: finite(row.impressions),
  ctr: finite(row.ctr),
  position: finite(row.position),
});

const pageType = (route) => route.startsWith("/produkt/") ? "product"
  : route.startsWith("/vergleiche/") ? "comparison"
    : route.startsWith("/hersteller/") ? "manufacturer"
      : ["/smarte-futterautomaten/", "/trinkbrunnen/", "/gps-tracker/", "/katzenklappen/", "/automatische-katzentoiletten/", "/haustierkameras/"].includes(route) ? "hub"
        : "content";

const benchmarkCtr = (position) => position <= 3 ? 8 : position <= 5 ? 5 : position <= 10 ? 3 : position <= 15 ? 2 : 1.5;

const rankingPoints = (position) => position <= 3 ? 18 : position <= 7 ? 34 : position <= 15 ? 28 : position <= 30 ? 14 : 5;

const confidenceFor = (impressions) => impressions >= 50 ? "high" : impressions >= 10 ? "medium" : "low";

const routeMetrics = (range) => new Map(asArray(range?.pages).map((row) => {
  const route = normalizeTrafficRoute(row.page);
  return [route, metric(row)];
}));

const recoveryByRoute = (recovery) => new Map(asArray(recovery?.opportunities).map((item) => [
  normalizeTrafficRoute(item.page), item,
]));

const linkGapRoutes = (report) => {
  const routes = new Set();
  for (const finding of asArray(report?.findings)) {
    if (finding?.code !== "NO_INCOMING_INTERNAL_LINK") continue;
    if (finding?.suppressed === true || finding?.status === "resolved") continue;
    routes.add(normalizeTrafficRoute(finding.targetRoute || finding.route || finding.normalizedTarget));
  }
  return routes;
};

const demandByOwner = (report) => {
  const owners = new Map();
  for (const finding of asArray(report?.findings)) {
    const route = normalizeTrafficRoute(finding.primaryIntentOwner);
    if (!route || route === "/") continue;
    const current = owners.get(route) || [];
    current.push(finding);
    owners.set(route, current);
  }
  return owners;
};

const trendSignal = (page, range) => {
  const change = range?.metrics?.change || {};
  if (!page?.impressions || !finite(change.impressions)) return "steady";
  return finite(change.impressions) >= 20 ? "growing" : finite(change.impressions) <= -20 ? "falling" : "steady";
};

const strikeClass = ({ position, impressions, trend, hasReviewSignal }) => {
  if (impressions < 10) return hasReviewSignal ? "REVIEW" : "DISCOVER";
  if (position > 0 && position <= 3) return "DEFEND";
  if (position > 3 && position <= 15) return "STRIKE";
  if (trend === "growing") return "EMERGING";
  return hasReviewSignal || (position > 0 && position <= 30) ? "REVIEW" : "DISCOVER";
};

const actionFor = (item) => {
  if (item.ctrOpportunity) return "Snippet und Intro gegen genau diese Query prüfen; Title/Meta nicht automatisch ändern.";
  if (item.internalAuthorityGap) return "Passenden fachlichen Hauptinhaltslink aus demselben Cluster prüfen und nur bei echter Nutzerhilfe ergänzen.";
  if (item.dataAssets.length) return "Bestehende strukturierte Decision Data auf dieser Owner-Seite als konkrete Entscheidungshilfe sichtbar prüfen.";
  if (item.intentSignals.length) return "Rankende URL gegen den dokumentierten Intent Owner prüfen; keine neue Konkurrenz-URL anlegen.";
  return "Bestehende Zielseite gegen Query und SERP-Intent prüfen; nur eine belegte, eng begrenzte Änderung planen.";
};

/**
 * Produces one deterministic, deduplicated opportunity per Page/Query pair.
 * It only composes already generated local signals and never changes content.
 */
export function composeTrafficOpportunities({ range, recovery = {}, linkHealth = {}, demand = {} } = {}) {
  const pages = routeMetrics(range);
  const recoveryMap = recoveryByRoute(recovery);
  const authorityGaps = linkGapRoutes(linkHealth);
  const owners = demandByOwner(demand);
  const maxImpressions = Math.max(1, ...[...pages.values()].map((value) => value.impressions));
  const rows = new Map();

  for (const raw of asArray(range?.pageQueries)) {
    const page = normalizeTrafficRoute(raw.page);
    const query = String(raw.query || "").trim().replace(/\s+/g, " ");
    if (!query || page.startsWith("/admin/")) continue;
    const key = `${page}\u0000${query.toLocaleLowerCase("de-DE")}`;
    const candidate = metric(raw);
    const current = rows.get(key);
    if (!current || candidate.impressions > current.metrics.impressions) rows.set(key, { page, query, metrics: candidate });
  }

  // Preserve recovery-only URLs as a single page-level opportunity rather than losing them.
  for (const [page, recoveryItem] of recoveryMap) {
    if ([...rows.values()].some((item) => item.page === page)) continue;
    rows.set(`${page}\u0000`, { page, query: "", metrics: metric(recoveryItem.metrics) });
  }

  const opportunities = [...rows.values()].map((row) => {
    const page = pages.get(row.page) || row.metrics;
    const recoveryItem = recoveryMap.get(row.page);
    const ownerFindings = owners.get(row.page) || [];
    const dataAssets = ownerFindings
      .filter((item) => ["structured-data", "data-asset"].includes(item.recommendation))
      .map((item) => item.structuredDataSource || item.id)
      .filter(Boolean);
    const intentSignals = ownerFindings
      .filter((item) => item.coverage === "partial")
      .map((item) => item.id);
    const internalAuthorityGap = authorityGaps.has(row.page);
    const trend = trendSignal(page, range);
    const lowData = row.metrics.impressions < 10;
    const ctrOpportunity = !lowData
      && row.metrics.position > 0
      && row.metrics.position <= 15
      && row.metrics.ctr < benchmarkCtr(row.metrics.position);
    const hasReviewSignal = internalAuthorityGap || intentSignals.length > 0 || trend === "falling" || recoveryItem?.status === "investigate";
    const zone = strikeClass({ position: row.metrics.position, impressions: row.metrics.impressions, trend, hasReviewSignal });
    const scores = {
      ranking: rankingPoints(row.metrics.position),
      impressions: Math.round(20 * Math.log1p(row.metrics.impressions) / Math.log1p(maxImpressions)),
      ctr: ctrOpportunity ? Math.round(14 * Math.max(0, 1 - row.metrics.ctr / benchmarkCtr(row.metrics.position))) : 0,
      recovery: recoveryItem ? Math.min(12, Math.round(finite(recoveryItem.score) / 8)) : 0,
      authority: internalAuthorityGap ? 10 : 0,
      dataAssets: Math.min(8, dataAssets.length * 3),
      intent: Math.min(8, intentSignals.length * 3),
      trend: trend === "growing" ? 5 : trend === "falling" ? 4 : 0,
    };
    const score = Object.values(scores).reduce((sum, value) => sum + value, 0);
    const signals = [
      "gsc-page-query",
      ...(recoveryItem ? ["recovery"] : []),
      ...(internalAuthorityGap ? ["internal-authority-gap"] : []),
      ...(dataAssets.length ? ["decision-data-ready"] : []),
      ...(intentSignals.length ? ["intent-owner-partial"] : []),
      ...(trend !== "steady" ? [`trend-${trend}`] : []),
    ];
    const item = {
      id: `traffic|${row.page}|${row.query.toLocaleLowerCase("de-DE")}`,
      page: row.page,
      query: row.query || undefined,
      pageType: pageType(row.page),
      zone,
      score,
      scores,
      confidence: confidenceFor(row.metrics.impressions),
      lowData,
      metrics: row.metrics,
      pageMetrics: page,
      trend,
      ctrOpportunity,
      internalAuthorityGap,
      dataAssets: [...new Set(dataAssets)],
      intentSignals: [...new Set(intentSignals)],
      recoveryStatus: recoveryItem?.status || null,
      signals,
    };
    return { ...item, action: actionFor(item) };
  });

  return opportunities.sort((left, right) => right.score - left.score
    || right.metrics.impressions - left.metrics.impressions
    || left.metrics.position - right.metrics.position
    || left.page.localeCompare(right.page, "de")
    || String(left.query || "").localeCompare(String(right.query || ""), "de"));
}

export function loadTrafficOpportunities() {
  const dashboard = DASHBOARD_FILES.map(readJson).find((item) => item?.ranges && typeof item.ranges === "object") || {};
  const rangeKey = dashboard.defaultRange && dashboard.ranges?.[dashboard.defaultRange]
    ? dashboard.defaultRange
    : Object.keys(dashboard.ranges || {})[0] || "";
  const range = dashboard.ranges?.[rangeKey] || null;
  const opportunities = composeTrafficOpportunities({
    range,
    recovery: readJson(RECOVERY_FILE) || {},
    linkHealth: readJson(LINK_HEALTH_FILE) || {},
    demand: readJson(DEMAND_FILE) || {},
  });
  const summary = Object.fromEntries(["STRIKE", "EMERGING", "DEFEND", "DISCOVER", "REVIEW"].map((zone) => [
    zone,
    opportunities.filter((item) => item.zone === zone).length,
  ]));
  return {
    available: Boolean(range),
    generatedAt: dashboard.generatedAt || "",
    rangeKey,
    stale: !dashboard.generatedAt || Date.now() - Date.parse(dashboard.generatedAt) > 72 * 3_600_000,
    summary: { total: opportunities.length, lowData: opportunities.filter((item) => item.lowData).length, ...summary },
    opportunities,
  };
}
