import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type RecoveryMetrics = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type RecoveryMigration = {
  source: string;
  target: string;
  finalTarget: string;
  status: "risk" | "watch" | "transferring" | "healthy";
  redirectStatus: number;
  oneHop: boolean;
  technicalIssues: string[];
  technical: {
    distAvailable: boolean;
    targetBuilt: boolean;
    sourceBuilt: boolean;
    canonical: string;
    noindex: boolean;
    sourceInSitemap: boolean;
    targetInSitemap: boolean;
    sourceInternalLinks: number;
    targetInternalLinks: number;
  };
  signal: {
    primaryRange: string;
    primaryOld: RecoveryMetrics;
    primaryNew: RecoveryMetrics;
    contextRange: string;
    contextOld: RecoveryMetrics;
    contextNew: RecoveryMetrics;
  };
};

export type RecoveryOpportunity = {
  page: string;
  type: "comparison" | "product" | "manufacturer" | "hub" | "content";
  status: "defend" | "push" | "improve" | "investigate";
  confidence: "high" | "medium" | "low";
  score: number;
  scores: Record<string, number>;
  metrics: RecoveryMetrics;
  contextMetrics: RecoveryMetrics;
  queries: Array<RecoveryMetrics & { query: string }>;
  migrationSources: string[];
  action: string;
};

export type SeoRecoveryPayload = {
  available: boolean;
  schemaVersion: number;
  generatedAt: string;
  source: {
    provider: "google";
    gscFile: string;
    redirectFile: string;
    primaryRange: string;
    contextRange: string;
  };
  summary: {
    redirects: number;
    migrationRisk: number;
    migrationWatch: number;
    transferring: number;
    technicalErrors: number;
    warnings: number;
    opportunities: number;
    distAvailable: boolean;
  };
  migrations: RecoveryMigration[];
  opportunities: RecoveryOpportunity[];
  findings: Array<{
    severity: "error" | "warning" | "info";
    code: string;
    subject: string;
    message: string;
  }>;
};

const resolveCandidate = (relative: string): string[] => [
  path.resolve(process.cwd(), relative),
  path.resolve(process.cwd(), "apps/pfotentechnik", relative),
  fileURLToPath(new URL("../../" + relative.replace(/^src\//, ""), import.meta.url)),
];

const emptyPayload = (): SeoRecoveryPayload => ({
  available: false,
  schemaVersion: 1,
  generatedAt: "",
  source: {
    provider: "google",
    gscFile: "src/data/seo/gsc-dashboard-ranges.json",
    redirectFile: "public/_redirects",
    primaryRange: "28d",
    contextRange: "3m",
  },
  summary: {
    redirects: 0,
    migrationRisk: 0,
    migrationWatch: 0,
    transferring: 0,
    technicalErrors: 0,
    warnings: 0,
    opportunities: 0,
    distAvailable: false,
  },
  migrations: [],
  opportunities: [],
  findings: [],
});

export function loadSeoRecovery(): SeoRecoveryPayload {
  const candidates = [
    ...resolveCandidate("src/data/seo/recovery-dashboard.json"),
    path.resolve(process.cwd(), "reports/seo-recovery/recovery-latest.json"),
    path.resolve(process.cwd(), "apps/pfotentechnik/reports/seo-recovery/recovery-latest.json"),
  ];

  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<SeoRecoveryPayload>;
      if (parsed?.source?.provider !== "google") continue;
      const gscCandidates = resolveCandidate("src/data/seo/gsc-dashboard-ranges.json");
      const gscGeneratedAt = gscCandidates
        .filter((candidate) => fs.existsSync(candidate))
        .map((candidate) => {
          try {
            return JSON.parse(fs.readFileSync(candidate, "utf8"))?.generatedAt as string | undefined;
          } catch {
            return undefined;
          }
        })
        .find(Boolean);
      const recoveryIsStale = Boolean(
        gscGeneratedAt
        && parsed.generatedAt
        && Date.parse(gscGeneratedAt) > Date.parse(parsed.generatedAt)
      );
      if (recoveryIsStale) return emptyPayload();
      return {
        ...emptyPayload(),
        ...parsed,
        available: true,
        source: { ...emptyPayload().source, ...(parsed.source || {}) },
        summary: { ...emptyPayload().summary, ...(parsed.summary || {}) },
        migrations: Array.isArray(parsed.migrations) ? parsed.migrations : [],
        opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
        findings: Array.isArray(parsed.findings) ? parsed.findings : [],
      } as SeoRecoveryPayload;
    } catch {
      continue;
    }
  }

  return emptyPayload();
}
