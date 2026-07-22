import fs from "node:fs";
import path from "node:path";

export type SeoMetricSet = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SeoRangeDataset = {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  comparisonStartDate: string;
  comparisonEndDate: string;
  partial: boolean;
  metrics: {
    current: SeoMetricSet;
    previous: SeoMetricSet;
    change: SeoMetricSet;
  };
  pages: Array<Record<string, unknown>>;
  queries: Array<Record<string, unknown>>;
  trend: Array<Record<string, unknown>>;
  recommendations: Array<Record<string, unknown>>;
};

export type SeoDashboardPayload = {
  schemaVersion: number;
  generatedAt: string;
  property: string;
  defaultRange: string;
  ranges: Record<string, SeoRangeDataset>;
  fallbackMode?: boolean;
  emptyMode?: boolean;
};

const emptyMetrics: SeoMetricSet = {
  clicks: 0,
  impressions: 0,
  ctr: 0,
  position: 0,
};

function emptyRange(): SeoRangeDataset {
  return {
    key: "7d",
    label: "Letzte 7 Tage",
    startDate: "",
    endDate: "",
    comparisonStartDate: "",
    comparisonEndDate: "",
    partial: false,
    metrics: {
      current: { ...emptyMetrics },
      previous: { ...emptyMetrics },
      change: { ...emptyMetrics },
    },
    pages: [],
    queries: [],
    trend: [],
    recommendations: [],
  };
}

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

export function loadSeoDashboard(): SeoDashboardPayload {
  const dataDir = path.resolve(process.cwd(), "src/data/seo");
  const rangesFile = path.join(dataDir, "gsc-dashboard-ranges.json");
  const legacyFile = path.join(dataDir, "gsc-dashboard.json");

  const rangesPayload = readJson<SeoDashboardPayload>(rangesFile);
  if (rangesPayload?.ranges && Object.keys(rangesPayload.ranges).length > 0) {
    return rangesPayload;
  }

  const legacy = readJson<Record<string, any>>(legacyFile);
  if (legacy) {
    const range = emptyRange();

    range.startDate = legacy.startDate || "";
    range.endDate = legacy.endDate || "";
    range.comparisonStartDate = legacy.comparisonStartDate || "";
    range.comparisonEndDate = legacy.comparisonEndDate || "";
    range.partial = Boolean(legacy.partial);
    range.metrics = legacy.metrics || range.metrics;
    range.pages = legacy.pages || [];
    range.queries = legacy.queries || [];
    range.trend = legacy.trend || [];
    range.recommendations = legacy.recommendations || [];

    return {
      schemaVersion: 1,
      generatedAt: legacy.generatedAt || new Date().toISOString(),
      property: legacy.property || "sc-domain:pfotentechnik.de",
      defaultRange: "7d",
      ranges: { "7d": range },
      fallbackMode: true,
    };
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    property: "sc-domain:pfotentechnik.de",
    defaultRange: "7d",
    ranges: { "7d": emptyRange() },
    emptyMode: true,
  };
}
