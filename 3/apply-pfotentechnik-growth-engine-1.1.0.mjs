#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-growth-engine-1.1.0";
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const runBuild = !args.has("--no-build");

function findRoot(start) {
  let directory = path.resolve(start);
  for (let index = 0; index < 14; index += 1) {
    if (fs.existsSync(path.join(directory, "apps", "pfotentechnik", "package.json"))) return directory;
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const growthFile = "apps/pfotentechnik/src/lib/seo/research/growth.ts";
const workbenchFile = "apps/pfotentechnik/src/components/admin/ResearchWorkbench.astro";
const testFile = "apps/pfotentechnik/test/seo-growth-engine-1.1.0.test.mjs";

for (const relative of [
  "apps/pfotentechnik/src/lib/seo/research/store.ts",
  "apps/pfotentechnik/src/components/admin/ResearchWorkbench.astro",
  "apps/pfotentechnik/src/lib/search/providers/google/report.mjs"
]) {
  if (!fs.existsSync(path.join(ROOT, relative))) throw new Error(`Erforderliche Datei fehlt: ${relative}`);
}

let workbench = fs.readFileSync(path.join(ROOT, workbenchFile), "utf8");
if (!workbench.includes("buildWeeklyGrowthOpportunities")) {
  throw new Error("Growth Engine 1.0.0 ist nicht installiert. Bitte zuerst 1.0.0 installieren.");
}

if (!workbench.includes("const signalLabel")) {
  workbench = workbench.replace(
    'const gainLabel = { stark: "Stark", mittel: "Mittel", schwach: "Schwach" };',
    'const gainLabel = { stark: "Stark", mittel: "Mittel", schwach: "Schwach" };\nconst signalLabel = { "quick-win": "GSC-Chance", "existing-demand": "bereits sichtbar", "no-signal": "ohne Signal" };'
  );
}

if (!workbench.includes("item.gsc &&")) {
  workbench = workbench.replace(
    '<span>{item.sourceCount} {item.sourceCount === 1 ? "Beleg" : "Belege"}</span>',
    '<span>{item.sourceCount} {item.sourceCount === 1 ? "Beleg" : "Belege"}</span>\n                {item.gsc && <span>{signalLabel[item.gsc.signal]} · {item.gsc.impressions} Impr. · Pos. {item.gsc.position.toFixed(1)}</span>}'
  );
}

if (!workbench.includes('item.horizon === "short-term"')) {
  workbench = workbench.replace(
    '<h3>{item.title}</h3>',
    '<p class="growth-horizon">{item.horizon === "short-term" ? "Kurzfristiger Wachstumshebel" : "Strategischer Authority-Aufbau"}</p>\n              <h3>{item.title}</h3>'
  );
  workbench = workbench.replace(
    '  .growth-card h3 {',
    '  .growth-horizon {\n    margin-top: .55rem;\n    color: var(--seo-text-muted, #5f6875);\n    font-size: .78rem;\n    font-weight: 800;\n    text-transform: uppercase;\n  }\n\n  .growth-card h3 {'
  );
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const GROWTH = path.join(APP, "src", "lib", "seo", "research", "growth.ts");
const WORKBENCH = path.join(APP, "src", "components", "admin", "ResearchWorkbench.astro");

test("Growth Engine nutzt GSC-Signale", () => {
  const source = fs.readFileSync(GROWTH, "utf8");
  assert.match(source, /google-search-report\.json/);
  assert.match(source, /gscScore/);
  assert.match(source, /position >= 8 && position <= 20/);
  assert.match(source, /impressions/);
});

test("Bestehende Seiten werden vor großen neuen Clustern bevorzugt", () => {
  const source = fs.readFileSync(GROWTH, "utf8");
  assert.match(source, /if \(existing\) score \+= 12/);
  assert.match(source, /strategicNew && !row/);
  assert.match(source, /score -= 24/);
});

test("Top 5 enthalten bevorzugt kurzfristige Hebel", () => {
  const source = fs.readFileSync(GROWTH, "utf8");
  assert.match(source, /shortTerm\.slice\(0, Math\.min\(4, limit\)\)/);
  assert.match(source, /strategic\.slice/);
});

test("Cockpit zeigt GSC-Kontext und Zeithorizont kompakt", () => {
  const source = fs.readFileSync(WORKBENCH, "utf8");
  assert.match(source, /GSC-Chance/);
  assert.match(source, /Kurzfristiger Wachstumshebel/);
  assert.match(source, /Strategischer Authority-Aufbau/);
});
`;

const files = new Map([
  [growthFile, "import fs from \"node:fs\";\nimport path from \"node:path\";\n\nexport type GrowthImpact = 1 | 2 | 3 | 4 | 5;\nexport type GrowthHorizon = \"short-term\" | \"strategic\";\n\nexport type GrowthOpportunity = {\n  id: string;\n  title: string;\n  reason: string;\n  impact: GrowthImpact;\n  horizon: GrowthHorizon;\n  effort: \"small\" | \"medium\" | \"large\";\n  type: string;\n  target?: string;\n  gaps: string[];\n  informationGain: string;\n  sourceCount: number;\n  gsc?: {\n    impressions: number;\n    clicks: number;\n    ctr: number;\n    position: number;\n    signal: \"quick-win\" | \"existing-demand\" | \"no-signal\";\n  };\n};\n\nconst list = <T>(value: T[] | undefined | null): T[] => Array.isArray(value) ? value : [];\nconst text = (value: unknown, fallback = \"\"): string =>\n  typeof value === \"string\" && value.trim() ? value.trim() : fallback;\nconst clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));\n\nconst root = () =>\n  process.cwd().endsWith(path.join(\"apps\", \"pfotentechnik\"))\n    ? process.cwd()\n    : path.join(process.cwd(), \"apps\", \"pfotentechnik\");\n\nconst GSC_REPORT_CANDIDATES = [\n  path.join(root(), \"reports\", \"search\", \"google-search-report.json\"),\n  path.join(root(), \"reports\", \"google-search-report.json\"),\n  path.join(root(), \".search\", \"reports\", \"google-search-report.json\")\n];\n\nexport const loadGrowthGscSignals = (): Map<string, any> => {\n  const file = GSC_REPORT_CANDIDATES.find((candidate) => fs.existsSync(candidate));\n  if (!file) return new Map();\n\n  try {\n    const report = JSON.parse(fs.readFileSync(file, \"utf8\"));\n    const rows = [\n      ...list<any>(report.topPages),\n      ...list<any>(report.quickWins),\n      ...list<any>(report.ctrChances)\n    ];\n\n    const byPage = new Map<string, any>();\n    for (const row of rows) {\n      const route = normalizeRoute(row?.page);\n      if (!route) continue;\n      const current = byPage.get(route);\n      if (!current || Number(row?.impressions ?? 0) > Number(current?.impressions ?? 0)) {\n        byPage.set(route, row);\n      }\n    }\n    return byPage;\n  } catch {\n    return new Map();\n  }\n};\n\nconst normalizeRoute = (value: unknown): string => {\n  if (typeof value !== \"string\" || !value.trim()) return \"\";\n  try {\n    const url = new URL(value);\n    return url.pathname.endsWith(\"/\") ? url.pathname : `${url.pathname}/`;\n  } catch {\n    const raw = value.startsWith(\"/\") ? value : `/${value}`;\n    return raw.endsWith(\"/\") ? raw : `${raw}/`;\n  }\n};\n\nconst inferredEffort = (item: any): \"small\" | \"medium\" | \"large\" => {\n  const explicit = item?.opportunity?.effort;\n  if (explicit === \"small\" || explicit === \"medium\" || explicit === \"large\") return explicit;\n  const actionCount = list(item?.actions).length;\n  return actionCount >= 4 ? \"large\" : actionCount >= 2 ? \"medium\" : \"small\";\n};\n\nconst effortPenalty = (effort: string): number =>\n  effort === \"large\" ? 16 : effort === \"medium\" ? 6 : 0;\n\nconst primaryTarget = (item: any): string | undefined =>\n  text(item?.refreshPlan?.targetRoute) ||\n  text(list<any>(item?.actions)[0]?.target) ||\n  text(item?.repositoryMatch?.route) ||\n  undefined;\n\nconst routeFromItem = (item: any): string => {\n  const target = primaryTarget(item);\n  if (!target) return \"\";\n  if (target.includes(\"apps/\")) return normalizeRoute(item?.repositoryMatch?.route);\n  return normalizeRoute(target);\n};\n\nconst pageTypeWeight = (route: string, item: any): number => {\n  if (!route) return 0;\n  if (route.startsWith(\"/vergleiche/\")) return 18;\n  if (item?.type === \"content-refresh\" && item?.repositoryMatch?.exists) return 14;\n  if (route === \"/smarte-futterautomaten/\" || route === \"/gps-tracker/\" || route === \"/trinkbrunnen/\") return 16;\n  if (route.startsWith(\"/produkt/\")) return 5;\n  if (route.startsWith(\"/hersteller/\")) return 3;\n  return 10;\n};\n\nconst gscScore = (row: any): number => {\n  if (!row) return 0;\n  const impressions = Number(row.impressions ?? 0);\n  const position = Number(row.position ?? 100);\n  const ctr = Number(row.ctr ?? 0);\n\n  let score = Math.min(35, Math.log10(impressions + 1) * 14);\n  if (position >= 8 && position <= 20) score += 28;\n  else if (position > 20 && position <= 30) score += 18;\n  else if (position >= 4 && position < 8) score += 14;\n  else if (position < 4) score += 6;\n\n  if (impressions >= 10 && ctr < 2.5) score += 8;\n  return clamp(score, 0, 60);\n};\n\nconst gscData = (row: any) => {\n  if (!row) return undefined;\n  const impressions = Number(row.impressions ?? 0);\n  const position = Number(row.position ?? 100);\n  return {\n    impressions,\n    clicks: Number(row.clicks ?? 0),\n    ctr: Number(row.ctr ?? 0),\n    position,\n    signal:\n      position >= 8 && position <= 30 && impressions > 0\n        ? \"quick-win\"\n        : impressions > 0\n          ? \"existing-demand\"\n          : \"no-signal\"\n  } as const;\n};\n\nconst compactGaps = (item: any): string[] => {\n  const explicit = [\n    ...list<string>(item?.serpGap?.missingContent),\n    ...list<string>(item?.serpGap?.missingDecisionTools),\n    ...list<string>(item?.refreshPlan?.sectionsToUpdate),\n    ...list<string>(item?.refreshPlan?.missingSections)\n  ].map((entry) => text(entry)).filter(Boolean);\n\n  if (explicit.length) return [...new Set(explicit)].slice(0, 3);\n\n  return list<any>(item?.actions)\n    .map((action) => text(action?.reason))\n    .filter(Boolean)\n    .slice(0, 3);\n};\n\nconst informationGain = (item: any): string => {\n  const explicit = text(item?.serpGap?.informationGain);\n  if (explicit) return explicit;\n\n  const gap = compactGaps(item)[0];\n  if (gap) return `Diesen Punkt klarer und n\u00fctzlicher l\u00f6sen als bestehende Ergebnisse: ${gap}`;\n\n  return \"Die bestehende Seite um eine konkrete, entscheidungsrelevante Hilfe verbessern.\";\n};\n\nconst scoreItem = (item: any, gscSignals: Map<string, any>): { score: number; horizon: GrowthHorizon; row?: any } => {\n  const route = routeFromItem(item);\n  const row = route ? gscSignals.get(route) : undefined;\n  const effort = inferredEffort(item);\n\n  const priority = Number(item?.opportunity?.priority ?? item?.priority ?? 0);\n  const confidence = Number(item?.confidence ?? 0);\n  const seo = Number(item?.opportunity?.seo ?? priority);\n  const ux = Number(item?.opportunity?.ux ?? priority);\n\n  const existing = item?.repositoryMatch?.exists === true;\n  const strategicNew = !existing && (\n    item?.type === \"topic\" ||\n    effort === \"large\" ||\n    list(item?.actions).some((action: any) => action?.type === \"create-page\")\n  );\n\n  let score =\n    priority * 0.18 +\n    confidence * 0.08 +\n    seo * 0.16 +\n    ux * 0.18 +\n    Math.min(list(item?.evidence).length, 3) * 3 +\n    pageTypeWeight(route, item) +\n    gscScore(row) -\n    effortPenalty(effort);\n\n  if (existing) score += 12;\n  if (strategicNew && !row) score -= 24;\n  if (route.startsWith(\"/produkt/\") && !row) score -= 8;\n\n  return {\n    score,\n    horizon: row || existing ? \"short-term\" : \"strategic\",\n    row\n  };\n};\n\nconst impactFromScore = (score: number): GrowthImpact =>\n  clamp(Math.round(score / 20), 1, 5) as GrowthImpact;\n\nexport const buildWeeklyGrowthOpportunities = (\n  items: any[],\n  limit = 5,\n  gscSignals = loadGrowthGscSignals()\n): GrowthOpportunity[] => {\n  const ranked = list(items)\n    .filter((item) => item?.status === \"open\" || item?.status === \"planned\")\n    .map((item) => {\n      const ranking = scoreItem(item, gscSignals);\n      return {\n        id: text(item?.id, \"research-item\"),\n        title: text(item?.title, \"Research-Chance\"),\n        reason: text(item?.reason, \"Konkrete Begr\u00fcndung fehlt.\"),\n        impact: impactFromScore(ranking.score),\n        horizon: ranking.horizon,\n        effort: inferredEffort(item),\n        type: text(item?.type, \"research\"),\n        target: primaryTarget(item),\n        gaps: compactGaps(item),\n        informationGain: informationGain(item),\n        sourceCount: list(item?.evidence).length,\n        gsc: gscData(ranking.row),\n        _score: ranking.score\n      };\n    })\n    .sort((left: any, right: any) => right._score - left._score);\n\n  const shortTerm = ranked.filter((item: any) => item.horizon === \"short-term\");\n  const strategic = ranked.filter((item: any) => item.horizon === \"strategic\");\n\n  const selected = [\n    ...shortTerm.slice(0, Math.min(4, limit)),\n    ...strategic.slice(0, Math.max(0, limit - Math.min(4, shortTerm.length)))\n  ];\n\n  if (selected.length < limit) {\n    for (const candidate of ranked) {\n      if (selected.some((item: any) => item.id === candidate.id)) continue;\n      selected.push(candidate);\n      if (selected.length >= limit) break;\n    }\n  }\n\n  return selected.slice(0, limit).map(({ _score, ...item }: any) => item);\n};\n\nexport const impactStars = (impact: GrowthImpact): string =>\n  `${\"\u2605\".repeat(impact)}${\"\u2606\".repeat(5 - impact)}`;\n\nexport const informationGainLevel = (\n  opportunity: GrowthOpportunity\n): \"stark\" | \"mittel\" | \"schwach\" => {\n  if (\n    opportunity.gaps.length >= 2 &&\n    opportunity.sourceCount >= 2 &&\n    opportunity.informationGain.length >= 80\n  ) return \"stark\";\n  if (opportunity.gaps.length || opportunity.sourceCount) return \"mittel\";\n  return \"schwach\";\n};\n\nexport const buildClusterProgress = (clusters: any[]) =>\n  list(clusters)\n    .map((cluster) => ({\n      id: text(cluster?.id),\n      label: text(cluster?.label, text(cluster?.id, \"Cluster\")),\n      score: clamp(Number(cluster?.score ?? 0), 0, 100),\n      gaps: list<string>(cluster?.gaps).slice(0, 3),\n      counts: cluster?.counts ?? {}\n    }))\n    .sort((left, right) => left.score - right.score);\n"],
  [workbenchFile, workbench],
  [testFile, testSource]
]);

const changed = [...files].filter(([relative, content]) => {
  const target = path.join(ROOT, relative);
  return !fs.existsSync(target) || fs.readFileSync(target, "utf8") !== content;
});

if (checkOnly) {
  console.log(`[${NAME}] Vorprüfung bestanden.`);
  console.log(`[${NAME}] Zu ändernde Dateien: ${changed.length}`);
  process.exit(0);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(ROOT, ".patch-backups", `${NAME}-${timestamp}`);

for (const [relative, content] of changed) {
  const target = path.join(ROOT, relative);
  if (fs.existsSync(target)) {
    const backup = path.join(backupRoot, relative);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(target, backup);
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
  console.log(`[${NAME}] Geschrieben: ${relative}`);
}

execFileSync(
  process.execPath,
  [
    "--experimental-strip-types",
    "--test",
    "apps/pfotentechnik/test/seo-growth-engine-1.0.0.test.mjs",
    "apps/pfotentechnik/test/seo-growth-engine-1.1.0.test.mjs",
    "apps/pfotentechnik/test/seo-research-engine.test.mjs"
  ],
  { cwd: ROOT, stdio: "inherit" }
);

if (runBuild) {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  execFileSync(npm, ["--workspace", "apps/pfotentechnik", "run", "build"], {
    cwd: ROOT,
    stdio: "inherit"
  });
}

console.log(`[${NAME}] Fertig.`);
console.log(`[${NAME}] Top 5 bevorzugen nun bestehende Seiten mit GSC-Signalen und Positionen 8 bis 30.`);
