import fs from "node:fs";
import {
  loadSeoDashboard,
  type SeoDiagnostic,
  type SeoRange,
  type SeoRecommendation,
} from "../loadDashboard";
import type { AdvisorCategory, AdvisorOpportunity } from "./types";
import {
  buildSeoWorkPackages,
  type ContentQualityInput,
  type SeoWorkPackage,
} from "./work-packages";
import { mergeGeneratedPackagesIntoWorkspace } from "../../seo-copilot/package-workflow.mjs";
import { readCopilotWorkspace } from "../../seo-copilot/store.mjs";
import { topicalAuthorityOpportunities } from "./topical-authority-plan";

const MAX_SEARCH_RECOMMENDATIONS = 8;
const MAX_CONTENT_FINDINGS = 8;
const MAX_VISIBLE_PACKAGES = 12;

const priorityWeight = { high: 3, medium: 2, low: 1 } as const;
const attentionStatusWeight: Record<string, number> = {
  "needs-work": 8,
  "review-due": 7,
  "verification-pending": 6,
  "sent-to-codex": 5,
  open: 4,
  "waiting-window": 3,
  snoozed: 2,
  verified: 1,
};

const readContentQualityItems = (): ContentQualityInput[] => {
  const file = new URL("../../../generated/content-quality-advisor.json", import.meta.url);
  if (!fs.existsSync(file)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!Array.isArray(parsed.items)) return [];
    return parsed.items
      .filter((item: ContentQualityInput) =>
        item?.priority === "high"
        || (item?.priority === "medium" && item?.confidence !== "low"))
      .sort((left: ContentQualityInput, right: ContentQualityInput) =>
        priorityWeight[right.priority] - priorityWeight[left.priority]
        || right.confidence.localeCompare(left.confidence)
        || left.id.localeCompare(right.id, "de"))
      .slice(0, MAX_CONTENT_FINDINGS);
  } catch {
    return [];
  }
};

const categoryFor = (item: Pick<SeoRecommendation, "type" | "source">): AdvisorCategory => {
  const value = `${item.type} ${item.source ?? ""}`.toLocaleLowerCase("de-DE");
  if (/cannibal|duplicate/.test(value)) return "cannibalization";
  if (/internal.?link|anchor|link/.test(value)) return "internal-link";
  if (/eeat|trust|author|quelle/.test(value)) return "eeat";
  if (/content.?gap|intent|missing.?content/.test(value)) return "content-gap";
  if (/ctr|snippet|title|meta/.test(value)) return "ctr";
  if (/technical|index|canonical|redirect|schema/.test(value)) return "technical";
  return "ranking";
};

const stableId = (value: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `essential-search|${(hash >>> 0).toString(36)}`;
};

const opportunityFromRecommendation = (
  item: SeoRecommendation,
  range: SeoRange,
): AdvisorOpportunity => {
  const category = categoryFor(item);
  const page = range.pages.find((candidate) => candidate.normalizedPath === item.page);
  const query = item.query
    ? range.queries.find((candidate) => candidate.query.toLocaleLowerCase("de-DE") === item.query?.toLocaleLowerCase("de-DE"))
    : undefined;
  const metrics = page ?? query;
  const high = item.priority === "high";
  return {
    id: stableId([item.type, item.page, item.query, item.title].filter(Boolean).join("|")),
    title: item.title,
    description: item.reason,
    category,
    priority: high ? "high" : "medium",
    impact: high ? 4.5 : 3.4,
    effortValue: category === "technical" ? 2.5 : 2,
    effort: "niedrig",
    confidence: metrics && metrics.impressions >= 30 ? 0.86 : metrics ? 0.68 : 0.6,
    score: high ? 86 : 66,
    estimatedMinutes: category === "technical" ? 45 : 30,
    forecast: {
      ctrPotential: 0,
      positionPotential: 0,
      clickPotential: 0,
      trafficPotential: 0,
      confidence: metrics ? 0.68 : 0.5,
      assumptions: [],
      dataBasis: "Vorhandene Search-Empfehlung; keine zusätzliche Forecast-Berechnung im kompakten Copilot.",
    },
    url: item.page || undefined,
    query: item.query,
    rationale: item.reason,
    nextAction: item.action,
    source: item.source ?? "search-dashboard",
    rangeKey: range.key,
    lowData: !metrics || metrics.impressions < 10,
    expectedBenefit: high ? "hoch" : "mittel",
    steps: [
      "Den Befund gegen die aktuelle Zielseite und Search-Daten prüfen.",
      "Nur die konkrete, belegte Änderung im bestehenden Scope umsetzen.",
      "Passenden Audit und Release-Gate ausführen.",
    ],
    pageType: item.page?.startsWith("/produkt/")
      ? "Produkt"
      : item.page?.startsWith("/vergleiche/")
        ? "Vergleich"
        : item.page?.startsWith("/hersteller/")
          ? "Hersteller"
          : "Seite",
    dataBasis: {
      impressions: metrics?.impressions ?? 0,
      clicks: metrics?.clicks ?? 0,
      ctr: metrics?.ctr ?? 0,
      position: metrics?.position ?? 0,
      note: "Kompakter Copilot aus dem bereits synchronisierten Search-Dashboard.",
    },
    prompt: "",
    codexPrompt: "",
  };
};

const opportunityFromDiagnostic = (
  item: SeoDiagnostic,
  range: SeoRange,
): AdvisorOpportunity => ({
  id: stableId(`diagnostic|${item.code}|${item.source ?? ""}`),
  title: `SEO-Datenfehler: ${item.code}`,
  description: item.message,
  category: "technical",
  priority: "high",
  impact: 4.8,
  effortValue: 2,
  effort: "niedrig",
  confidence: 0.98,
  score: 94,
  estimatedMinutes: 30,
  forecast: {
    ctrPotential: 0,
    positionPotential: 0,
    clickPotential: 0,
    trafficPotential: 0,
    confidence: 0,
    assumptions: [],
    dataBasis: "Loader-Diagnose",
  },
  rationale: item.message,
  nextAction: "Die Datenquelle oder den Sync gezielt reparieren und danach den kompakten Copilot neu bauen.",
  source: item.source ?? "seo-dashboard",
  rangeKey: range.key,
  lowData: false,
  expectedBenefit: "hoch",
  steps: [
    "Die genannte Datenquelle prüfen.",
    "Nur den konkreten Loader- oder Sync-Fehler korrigieren.",
    "Search-Sync und Release-Gate erneut ausführen.",
  ],
  pageType: "Technik",
  affectedFile: item.source,
  dataBasis: { note: item.message },
  prompt: "",
  codexPrompt: "",
});

const opportunityFromQualityFinding = (
  item: any,
  range: SeoRange,
): AdvisorOpportunity => {
  const area = String(item.area || "");
  const category: AdvisorCategory = /cannibal/.test(area)
    ? "cannibalization"
    : /link|anchor/.test(area)
      ? "internal-link"
      : /eeat|trust|author/.test(area)
        ? "eeat"
        : /content|coverage|recommendation/.test(area)
          ? "content-gap"
          : "technical";
  return {
    id: item.id,
    title: item.description,
    description: item.description,
    category,
    priority: item.priority?.level ?? "medium",
    impact: Math.max(1, Math.min(5, (item.priority?.score ?? 50) / 20)),
    effortValue: Math.max(1, Math.min(5, (item.priority?.factors?.effort ?? 50) / 20)),
    effort: (item.priority?.factors?.effort ?? 50) >= 70 ? "hoch" : (item.priority?.factors?.effort ?? 50) >= 40 ? "mittel" : "niedrig",
    confidence: Math.max(0, Math.min(1, (item.confidence ?? 70) / 100)),
    score: item.priority?.score ?? 50,
    estimatedMinutes: Math.round(15 + (item.priority?.factors?.effort ?? 50) * 0.9),
    forecast: {
      ctrPotential: 0,
      positionPotential: 0,
      clickPotential: 0,
      trafficPotential: 0,
      confidence: 0,
      assumptions: [],
      dataBasis: "Zentral normalisierter Audit-Befund; keine erfundene Search-Prognose.",
    },
    url: item.urls?.[0],
    rationale: item.impact,
    nextAction: item.recommendedAction,
    source: item.source,
    rangeKey: range.key,
    lowData: item.confidence < 60,
    expectedBenefit: item.priority?.level === "high" ? "hoch" : item.priority?.level === "medium" ? "mittel" : "niedrig",
    steps: [
      "Den normalisierten Befund im angegebenen Audit-Report gegenprüfen.",
      "Nur den konkreten Scope ändern; bestehende URLs und belegte Inhalte erhalten.",
      "Quell-Audit und zentrales Release-Gate erneut ausführen.",
    ],
    pageType: /product|produkt/.test(area) ? "Produkt" : /comparison|vergleich/.test(area) ? "Vergleich" : "Quality Operations",
    affectedFile: item.files?.[0],
    dataBasis: { note: `${item.source}; ${item.type}; Status ${item.status}.` },
    prompt: "",
    codexPrompt: "",
  };
};

const selectEssentialPackages = (packages: SeoWorkPackage[]): SeoWorkPackage[] =>
  [...packages]
    .filter((pkg) =>
      pkg.status !== "verified"
      && (pkg.status !== "open" || pkg.priority !== "low")
      && (pkg.status !== "snoozed" || Boolean(pkg.snoozedUntil)))
    .sort((left, right) =>
      (attentionStatusWeight[right.status] ?? 0) - (attentionStatusWeight[left.status] ?? 0)
      || right.impact - left.impact
      || right.confidence - left.confidence
      || left.effortValue - right.effortValue
      || left.id.localeCompare(right.id, "de"))
    .slice(0, MAX_VISIBLE_PACKAGES);

const loadSeoWorkPackageDataUncached = async () => {
  const payload = loadSeoDashboard();
  const range = payload.ranges[payload.defaultRange] ?? Object.values(payload.ranges)[0];
  if (!range) {
    return {
      defaultRange: "",
      generatedAt: payload.generatedAt,
      ranges: {},
      summary: { visible: 0, hidden: 0, searchRecommendations: 0, contentFindings: 0 },
    };
  }

  const workspace = readCopilotWorkspace();
  const activeQualityFindings = workspace.qualityFindings
    .filter((item: any) => ["open", "in-progress", "waiting", "manual-review", "regression"].includes(item.status))
    .filter((item: any) => item.priority?.level === "high" || item.priority?.level === "medium")
    .sort((left: any, right: any) => (right.priority?.score ?? 0) - (left.priority?.score ?? 0))
    .slice(0, 24);
  const searchRecommendations = (activeQualityFindings.length ? [] : range.recommendations)
    .filter((item) => item.priority === "high" || item.priority === "medium")
    .sort((left, right) => priorityWeight[right.priority] - priorityWeight[left.priority])
    .slice(0, MAX_SEARCH_RECOMMENDATIONS);
  const contentQualityItems = activeQualityFindings.length ? [] : readContentQualityItems();
  const opportunities = [
    ...topicalAuthorityOpportunities,
    ...payload.diagnostics
      .filter((item) => item.level === "error")
      .slice(0, 2)
      .map((item) => opportunityFromDiagnostic(item, range)),
    ...activeQualityFindings.map((item: any) => opportunityFromQualityFinding(item, range)),
    ...searchRecommendations.map((item) => opportunityFromRecommendation(item, range)),
  ];
  const allPackages = buildSeoWorkPackages({
    opportunities,
    rangeKey: range.key,
    contentQuality: contentQualityItems,
    storedPackages: workspace.workPackages,
  });
  const packages = selectEssentialPackages(allPackages);
  const activeTaskIds = [...new Set([
    ...opportunities.map((item) => item.id),
    ...contentQualityItems.map((item) => item.id),
  ])];

  mergeGeneratedPackagesIntoWorkspace(allPackages);

  return {
    defaultRange: range.key,
    generatedAt: payload.generatedAt,
    ranges: {
      [range.key]: {
        label: range.label,
        packages,
        activeTaskIds,
        individualTasks: [],
      },
    },
    summary: {
      visible: packages.length,
      hidden: Math.max(0, allPackages.length - packages.length),
      searchRecommendations: searchRecommendations.length,
      contentFindings: contentQualityItems.length,
      qualityFindings: activeQualityFindings.length,
    },
  };
};

let seoWorkPackageDataPromise: ReturnType<typeof loadSeoWorkPackageDataUncached> | undefined;

export const loadSeoWorkPackageData = () => {
  seoWorkPackageDataPromise ??= loadSeoWorkPackageDataUncached();
  return seoWorkPackageDataPromise;
};
