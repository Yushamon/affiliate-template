import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type SeoMetricValues = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SeoMetricChange = SeoMetricValues;

export type SeoPageRow = SeoMetricValues & {
  page: string;
  normalizedPath: string;
};

export type SeoQueryRow = SeoMetricValues & {
  query: string;
};

export type SeoTrendRow = SeoMetricValues & {
  date: string;
};

export type SeoRecommendation = {
  priority: "high" | "medium" | "low";
  type: string;
  title: string;
  page: string;
  query?: string;
  reason: string;
  action: string;
};

export type SeoRange = {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  comparisonStartDate: string;
  comparisonEndDate: string;
  dataState: string;
  partial: boolean;
  metrics: {
    current: SeoMetricValues;
    previous: SeoMetricValues;
    change: SeoMetricChange;
  };
  pages: SeoPageRow[];
  queries: SeoQueryRow[];
  trend: SeoTrendRow[];
  recommendations: SeoRecommendation[];
};

export type SeoDiagnostic = {
  level: "info" | "warning" | "error";
  code: string;
  message: string;
  source?: string;
};

export type SeoUrlDuplicate = {
  normalizedPath: string;
  variants: string[];
};

export type SeoDashboardPayload = {
  schemaVersion: number;
  generatedAt: string;
  property: string;
  provider: "google" | "bing" | "combined";
  defaultRange: string;
  ranges: Record<string, SeoRange>;
  source: "ranges" | "single" | "none";
  fallbackMode: boolean;
  emptyMode: boolean;
  diagnostics: SeoDiagnostic[];
  urlDuplicates: SeoUrlDuplicate[];
};

type JsonObject = Record<string, unknown>;

const resolveDataFile = (name: string): string => {
  const candidates = [
    path.resolve(process.cwd(), "src/data/seo", name),
    path.resolve(process.cwd(), "apps/pfotentechnik/src/data/seo", name),
    fileURLToPath(new URL(`../../data/seo/${name}`, import.meta.url)),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
};

const DATA_FILES = {
  ranges: resolveDataFile("gsc-dashboard-ranges.json"),
  single: resolveDataFile("gsc-dashboard.json"),
};

const RANGE_LABELS: Record<string, string> = {
  "24h": "Letzte 24 Stunden",
  "7d": "Letzte 7 Tage",
  "28d": "Letzte 28 Tage",
  "3m": "Letzte 3 Monate",
  "6m": "Letzte 6 Monate",
  "12m": "Letzte 12 Monate",
};

const isObject = (value: unknown): value is JsonObject =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const stringValue = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const numberValue = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const booleanValue = (value: unknown): boolean => value === true;

const arrayValue = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const normalizeMetrics = (value: unknown): SeoMetricValues => {
  const metrics = isObject(value) ? value : {};
  return {
    clicks: numberValue(metrics.clicks),
    impressions: numberValue(metrics.impressions),
    ctr: numberValue(metrics.ctr),
    position: numberValue(metrics.position),
  };
};

export const normalizeSeoPath = (value: unknown): string => {
  const raw = stringValue(value);
  if (!raw) return "/";

  try {
    const parsed = raw.startsWith("http://") || raw.startsWith("https://")
      ? new URL(raw)
      : new URL(raw.startsWith("/") ? raw : `/${raw}`, "https://pfotentechnik.de");
    const path = parsed.pathname.replace(/\/+/g, "/").replace(/\/+$/, "");
    return path ? `${path}/` : "/";
  } catch {
    const path = raw.split(/[?#]/, 1)[0].replace(/^https?:\/\/www\./i, "https://").replace(/^https?:\/\/[^/]+/i, "");
    const normalized = `/${path}`.replace(/\/+/g, "/").replace(/\/+$/, "");
    return normalized === "" ? "/" : `${normalized}/`;
  }
};

const preferMoreInformative = <T extends SeoMetricValues>(current: T | undefined, candidate: T): T => {
  if (!current) return candidate;
  if (candidate.impressions !== current.impressions) {
    return candidate.impressions > current.impressions ? candidate : current;
  }
  return candidate.clicks > current.clicks ? candidate : current;
};

const normalizePages = (
  value: unknown,
  duplicateMap: Map<string, Set<string>>,
): SeoPageRow[] => {
  const rows = new Map<string, SeoPageRow>();

  for (const item of arrayValue(value)) {
    if (!isObject(item)) continue;
    const page = stringValue(item.page);
    if (!page) continue;
    const normalizedPath = normalizeSeoPath(page);
    const variants = duplicateMap.get(normalizedPath) ?? new Set<string>();
    variants.add(page);
    duplicateMap.set(normalizedPath, variants);

    const candidate: SeoPageRow = {
      page,
      normalizedPath,
      ...normalizeMetrics(item),
    };
    rows.set(normalizedPath, preferMoreInformative(rows.get(normalizedPath), candidate));
  }

  return [...rows.values()].sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);
};

const normalizeQueries = (value: unknown): SeoQueryRow[] => {
  const rows = new Map<string, SeoQueryRow>();
  for (const item of arrayValue(value)) {
    if (!isObject(item)) continue;
    const query = stringValue(item.query).replace(/\s+/g, " ");
    if (!query) continue;
    const key = query.toLocaleLowerCase("de-DE");
    const candidate: SeoQueryRow = { query, ...normalizeMetrics(item) };
    rows.set(key, preferMoreInformative(rows.get(key), candidate));
  }
  return [...rows.values()].sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);
};

const normalizeTrend = (value: unknown): SeoTrendRow[] => {
  const rows = new Map<string, SeoTrendRow>();
  for (const item of arrayValue(value)) {
    if (!isObject(item)) continue;
    const date = stringValue(item.date);
    if (!date) continue;
    const candidate: SeoTrendRow = { date, ...normalizeMetrics(item) };
    rows.set(date, preferMoreInformative(rows.get(date), candidate));
  }
  return [...rows.values()].sort((a, b) => a.date.localeCompare(b.date));
};

const normalizePriority = (value: unknown): SeoRecommendation["priority"] =>
  value === "high" || value === "low" ? value : "medium";

const normalizeRecommendations = (value: unknown): SeoRecommendation[] => {
  const rows = new Map<string, SeoRecommendation>();
  for (const item of arrayValue(value)) {
    if (!isObject(item)) continue;
    const title = stringValue(item.title);
    const reason = stringValue(item.reason);
    const action = stringValue(item.action);
    if (!title || !reason || !action) continue;
    const page = stringValue(item.page);
    const query = stringValue(item.query) || undefined;
    const normalized: SeoRecommendation = {
      priority: normalizePriority(item.priority),
      type: stringValue(item.type) || "gsc-recommendation",
      title,
      page: page ? normalizeSeoPath(page) : "",
      query,
      reason,
      action,
    };
    const key = [normalized.type, normalized.page, query?.toLocaleLowerCase("de-DE"), title].join("|");
    if (!rows.has(key)) rows.set(key, normalized);
  }
  return [...rows.values()];
};

const normalizeRange = (
  value: unknown,
  fallbackKey: string,
  duplicateMap: Map<string, Set<string>>,
): SeoRange | null => {
  if (!isObject(value)) return null;
  const key = stringValue(value.key) || fallbackKey;
  const metrics = isObject(value.metrics) ? value.metrics : {};
  return {
    key,
    label: stringValue(value.label) || RANGE_LABELS[key] || key,
    startDate: stringValue(value.startDate),
    endDate: stringValue(value.endDate),
    comparisonStartDate: stringValue(value.comparisonStartDate),
    comparisonEndDate: stringValue(value.comparisonEndDate),
    dataState: stringValue(value.dataState),
    partial: booleanValue(value.partial),
    metrics: {
      current: normalizeMetrics(metrics.current),
      previous: normalizeMetrics(metrics.previous),
      change: normalizeMetrics(metrics.change),
    },
    pages: normalizePages(value.pages, duplicateMap),
    queries: normalizeQueries(value.queries),
    trend: normalizeTrend(value.trend),
    recommendations: normalizeRecommendations(value.recommendations),
  };
};

const readJson = (file: string, diagnostics: SeoDiagnostic[]): JsonObject | null => {
  if (!fs.existsSync(file)) {
    diagnostics.push({
      level: "warning",
      code: "file-missing",
      message: `SEO-Datendatei fehlt: ${file}`,
      source: file,
    });
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!isObject(parsed)) {
      diagnostics.push({ level: "error", code: "invalid-root", message: "SEO-JSON muss ein Objekt enthalten.", source: file });
      return null;
    }
    return parsed;
  } catch (error) {
    diagnostics.push({
      level: "error",
      code: "json-read-failed",
      message: error instanceof Error ? error.message : "SEO-JSON konnte nicht gelesen werden.",
      source: file,
    });
    return null;
  }
};

const finalisePayload = (
  root: JsonObject,
  ranges: Record<string, SeoRange>,
  source: SeoDashboardPayload["source"],
  diagnostics: SeoDiagnostic[],
  duplicateMap: Map<string, Set<string>>,
): SeoDashboardPayload => {
  const available = Object.keys(ranges);
  const requestedDefault = stringValue(root.defaultRange);
  const defaultRange = requestedDefault && ranges[requestedDefault]
    ? requestedDefault
    : ranges["7d"]
      ? "7d"
      : available[0] ?? "";

  if (requestedDefault && requestedDefault !== defaultRange) {
    diagnostics.push({
      level: "warning",
      code: "invalid-default-range",
      message: `Der konfigurierte Standardzeitraum „${requestedDefault}“ fehlt; verwendet wird „${defaultRange || "keiner"}“.`,
    });
  }

  const urlDuplicates = [...duplicateMap.entries()]
    .filter(([, variants]) => variants.size > 1)
    .map(([normalizedPath, variants]) => ({ normalizedPath, variants: [...variants].sort() }));

  if (urlDuplicates.length) {
    diagnostics.push({
      level: "warning",
      code: "url-duplicates-normalized",
      message: `${urlDuplicates.length} technische URL-Dublette(n) wurden ohne Aufsummierung normalisiert.`,
    });
  }

  return {
    schemaVersion: numberValue(root.schemaVersion) || 1,
    generatedAt: stringValue(root.generatedAt),
    property: stringValue(root.property),
    provider: root.provider === "bing" || root.provider === "combined" ? root.provider : "google",
    defaultRange,
    ranges,
    source,
    fallbackMode: source === "single",
    emptyMode: available.length === 0,
    diagnostics,
    urlDuplicates,
  };
};

export function loadSeoDashboard(): SeoDashboardPayload {
  const diagnostics: SeoDiagnostic[] = [];
  const duplicateMap = new Map<string, Set<string>>();
  const rangesRoot = readJson(DATA_FILES.ranges, diagnostics);

  if (rangesRoot && isObject(rangesRoot.ranges)) {
    const ranges: Record<string, SeoRange> = {};
    for (const [key, value] of Object.entries(rangesRoot.ranges)) {
      const range = normalizeRange(value, key, duplicateMap);
      if (range) ranges[key] = range;
      else diagnostics.push({ level: "warning", code: "invalid-range", message: `Zeitraum „${key}“ ist kein gültiges Objekt.` });
    }
    if (Object.keys(ranges).length) {
      return finalisePayload(rangesRoot, ranges, "ranges", diagnostics, duplicateMap);
    }
    diagnostics.push({ level: "warning", code: "ranges-empty", message: "Die Multi-Zeitraum-Datei enthält keine nutzbaren Zeiträume." });
  }

  const singleRoot = readJson(DATA_FILES.single, diagnostics);
  if (singleRoot) {
    const key = stringValue(singleRoot.key) || stringValue(singleRoot.range) || "7d";
    const range = normalizeRange(singleRoot, key, duplicateMap);
    if (range) return finalisePayload(singleRoot, { [key]: range }, "single", diagnostics, duplicateMap);
  }

  diagnostics.push({ level: "error", code: "no-dashboard-data", message: "Keine nutzbaren GSC-Dashboarddaten gefunden." });
  return finalisePayload({}, {}, "none", diagnostics, duplicateMap);
}
