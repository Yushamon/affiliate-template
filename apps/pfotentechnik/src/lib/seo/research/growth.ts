import fs from "node:fs";
import path from "node:path";

export type GrowthImpact = 1 | 2 | 3 | 4 | 5;
export type GrowthHorizon = "short-term" | "strategic";

export type GrowthOpportunity = {
  id: string;
  title: string;
  reason: string;
  impact: GrowthImpact;
  horizon: GrowthHorizon;
  effort: "small" | "medium" | "large";
  type: string;
  target?: string;
  gaps: string[];
  informationGain: string;
  sourceCount: number;
  gsc?: {
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
    signal: "quick-win" | "existing-demand" | "no-signal";
  };
};

const list = <T>(value: T[] | undefined | null): T[] => Array.isArray(value) ? value : [];
const text = (value: unknown, fallback = ""): string =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const root = () =>
  process.cwd().endsWith(path.join("apps", "pfotentechnik"))
    ? process.cwd()
    : path.join(process.cwd(), "apps", "pfotentechnik");

const GSC_REPORT_CANDIDATES = [
  path.join(root(), "reports", "search", "google-search-report.json"),
  path.join(root(), "reports", "google-search-report.json"),
  path.join(root(), ".search", "reports", "google-search-report.json")
];

export const loadGrowthGscSignals = (): Map<string, any> => {
  const file = GSC_REPORT_CANDIDATES.find((candidate) => fs.existsSync(candidate));
  if (!file) return new Map();

  try {
    const report = JSON.parse(fs.readFileSync(file, "utf8"));
    const rows = [
      ...list<any>(report.topPages),
      ...list<any>(report.quickWins),
      ...list<any>(report.ctrChances)
    ];

    const byPage = new Map<string, any>();
    for (const row of rows) {
      const route = normalizeRoute(row?.page);
      if (!route) continue;
      const current = byPage.get(route);
      if (!current || Number(row?.impressions ?? 0) > Number(current?.impressions ?? 0)) {
        byPage.set(route, row);
      }
    }
    return byPage;
  } catch {
    return new Map();
  }
};

const normalizeRoute = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
    return url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  } catch {
    const raw = value.startsWith("/") ? value : `/${value}`;
    return raw.endsWith("/") ? raw : `${raw}/`;
  }
};

const inferredEffort = (item: any): "small" | "medium" | "large" => {
  const explicit = item?.opportunity?.effort;
  if (explicit === "small" || explicit === "medium" || explicit === "large") return explicit;
  const actionCount = list(item?.actions).length;
  return actionCount >= 4 ? "large" : actionCount >= 2 ? "medium" : "small";
};

const effortPenalty = (effort: string): number =>
  effort === "large" ? 16 : effort === "medium" ? 6 : 0;

const primaryTarget = (item: any): string | undefined =>
  text(item?.refreshPlan?.targetRoute) ||
  text(list<any>(item?.actions)[0]?.target) ||
  text(item?.repositoryMatch?.route) ||
  undefined;

const routeFromItem = (item: any): string => {
  const target = primaryTarget(item);
  if (!target) return "";
  if (target.includes("apps/")) return normalizeRoute(item?.repositoryMatch?.route);
  return normalizeRoute(target);
};

const pageTypeWeight = (route: string, item: any): number => {
  if (!route) return 0;
  if (route.startsWith("/vergleiche/")) return 18;
  if (item?.type === "content-refresh" && item?.repositoryMatch?.exists) return 14;
  if (route === "/smarte-futterautomaten/" || route === "/gps-tracker/" || route === "/trinkbrunnen/") return 16;
  if (route.startsWith("/produkt/")) return 5;
  if (route.startsWith("/hersteller/")) return 3;
  return 10;
};

const gscScore = (row: any): number => {
  if (!row) return 0;
  const impressions = Number(row.impressions ?? 0);
  const position = Number(row.position ?? 100);
  const ctr = Number(row.ctr ?? 0);

  let score = Math.min(35, Math.log10(impressions + 1) * 14);
  if (position >= 8 && position <= 20) score += 28;
  else if (position > 20 && position <= 30) score += 18;
  else if (position >= 4 && position < 8) score += 14;
  else if (position < 4) score += 6;

  if (impressions >= 10 && ctr < 2.5) score += 8;
  return clamp(score, 0, 60);
};

const gscData = (row: any) => {
  if (!row) return undefined;
  const impressions = Number(row.impressions ?? 0);
  const position = Number(row.position ?? 100);
  return {
    impressions,
    clicks: Number(row.clicks ?? 0),
    ctr: Number(row.ctr ?? 0),
    position,
    signal:
      position >= 8 && position <= 30 && impressions > 0
        ? "quick-win"
        : impressions > 0
          ? "existing-demand"
          : "no-signal"
  } as const;
};

const compactGaps = (item: any): string[] => {
  const explicit = [
    ...list<string>(item?.serpGap?.missingContent),
    ...list<string>(item?.serpGap?.missingDecisionTools),
    ...list<string>(item?.refreshPlan?.sectionsToUpdate),
    ...list<string>(item?.refreshPlan?.missingSections)
  ].map((entry) => text(entry)).filter(Boolean);

  if (explicit.length) return [...new Set(explicit)].slice(0, 3);

  return list<any>(item?.actions)
    .map((action) => text(action?.reason))
    .filter(Boolean)
    .slice(0, 3);
};

const informationGain = (item: any): string => {
  const explicit = text(item?.serpGap?.informationGain);
  if (explicit) return explicit;

  const gap = compactGaps(item)[0];
  if (gap) return `Diesen Punkt klarer und nützlicher lösen als bestehende Ergebnisse: ${gap}`;

  return "Die bestehende Seite um eine konkrete, entscheidungsrelevante Hilfe verbessern.";
};

const scoreItem = (item: any, gscSignals: Map<string, any>): { score: number; horizon: GrowthHorizon; row?: any } => {
  const route = routeFromItem(item);
  const row = route ? gscSignals.get(route) : undefined;
  const effort = inferredEffort(item);

  const priority = Number(item?.opportunity?.priority ?? item?.priority ?? 0);
  const confidence = Number(item?.confidence ?? 0);
  const seo = Number(item?.opportunity?.seo ?? priority);
  const ux = Number(item?.opportunity?.ux ?? priority);

  const existing = item?.repositoryMatch?.exists === true;
  const strategicNew = !existing && (
    item?.type === "topic" ||
    effort === "large" ||
    list(item?.actions).some((action: any) => action?.type === "create-page")
  );

  let score =
    priority * 0.18 +
    confidence * 0.08 +
    seo * 0.16 +
    ux * 0.18 +
    Math.min(list(item?.evidence).length, 3) * 3 +
    pageTypeWeight(route, item) +
    gscScore(row) -
    effortPenalty(effort);

  if (existing) score += 12;
  if (strategicNew && !row) score -= 24;
  if (route.startsWith("/produkt/") && !row) score -= 8;

  return {
    score,
    horizon: row || existing ? "short-term" : "strategic",
    row
  };
};

const impactFromScore = (score: number): GrowthImpact =>
  clamp(Math.round(score / 20), 1, 5) as GrowthImpact;

export const buildWeeklyGrowthOpportunities = (
  items: any[],
  limit = 5,
  gscSignals = loadGrowthGscSignals()
): GrowthOpportunity[] => {
  const ranked = list(items)
    .filter((item) => item?.status === "open" || item?.status === "planned")
    .map((item) => {
      const ranking = scoreItem(item, gscSignals);
      return {
        id: text(item?.id, "research-item"),
        title: text(item?.title, "Research-Chance"),
        reason: text(item?.reason, "Konkrete Begründung fehlt."),
        impact: impactFromScore(ranking.score),
        horizon: ranking.horizon,
        effort: inferredEffort(item),
        type: text(item?.type, "research"),
        target: primaryTarget(item),
        gaps: compactGaps(item),
        informationGain: informationGain(item),
        sourceCount: list(item?.evidence).length,
        gsc: gscData(ranking.row),
        _score: ranking.score
      };
    })
    .sort((left: any, right: any) => right._score - left._score);

  const shortTerm = ranked.filter((item: any) => item.horizon === "short-term");
  const strategic = ranked.filter((item: any) => item.horizon === "strategic");

  const selected = [
    ...shortTerm.slice(0, Math.min(4, limit)),
    ...strategic.slice(0, Math.max(0, limit - Math.min(4, shortTerm.length)))
  ];

  if (selected.length < limit) {
    for (const candidate of ranked) {
      if (selected.some((item: any) => item.id === candidate.id)) continue;
      selected.push(candidate);
      if (selected.length >= limit) break;
    }
  }

  return selected.slice(0, limit).map(({ _score, ...item }: any) => item);
};

export const impactStars = (impact: GrowthImpact): string =>
  `${"★".repeat(impact)}${"☆".repeat(5 - impact)}`;

export const informationGainLevel = (
  opportunity: GrowthOpportunity
): "stark" | "mittel" | "schwach" => {
  if (
    opportunity.gaps.length >= 2 &&
    opportunity.sourceCount >= 2 &&
    opportunity.informationGain.length >= 80
  ) return "stark";
  if (opportunity.gaps.length || opportunity.sourceCount) return "mittel";
  return "schwach";
};

export const buildClusterProgress = (clusters: any[]) =>
  list(clusters)
    .map((cluster) => ({
      id: text(cluster?.id),
      label: text(cluster?.label, text(cluster?.id, "Cluster")),
      score: clamp(Number(cluster?.score ?? 0), 0, 100),
      gaps: list<string>(cluster?.gaps).slice(0, 3),
      counts: cluster?.counts ?? {}
    }))
    .sort((left, right) => left.score - right.score);
