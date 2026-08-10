#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-search-evidence-opportunity-33.6.1";

function findRoot(start = process.cwd()) {
  let cur = path.resolve(start);
  for (let i = 0; i < 16; i++) {
    if (fs.existsSync(path.join(cur, "apps", "pfotentechnik", "package.json"))) return cur;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const root = findRoot();
const app = path.join(root, "apps", "pfotentechnik");
const target = path.join(app, "scripts", "product-evidence", "research-queue.mjs");
const testFile = path.join(app, "test", "product-evidence-search-opportunity-33.6.1.test.mjs");

if (!fs.existsSync(target)) {
  throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${path.relative(root, target)}`);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(root, ".patch-backups", `${PATCH}-${stamp}`);
const backupTarget = path.join(backup, path.relative(root, target));
fs.mkdirSync(path.dirname(backupTarget), { recursive: true });
fs.copyFileSync(target, backupTarget);

console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);

const queueScript = [
  '#!/usr/bin/env node',
  'import fs from "node:fs";',
  'import path from "node:path";',
  'import { fileURLToPath } from "node:url";',
  '',
  'const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");',
  'const productDir = path.join(app, "src/content/products");',
  'const outDir = path.join(app, "reports/product-evidence");',
  'const seoDir = path.join(app, "src/data/seo");',
  'fs.mkdirSync(outDir, { recursive: true });',
  '',
  'const arg = (key) => process.argv.find((x) => x.startsWith(key + "="))?.split("=")[1];',
  'const limit = Math.max(1, Number(arg("--limit")) || 10);',
  'const primaryKey = arg("--range") || "28d";',
  'const contextKey = arg("--context") || "3m";',
  '',
  'const readJson = (file) => {',
  '  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; }',
  '};',
  '',
  'let dashboard = null;',
  'let sourceFile = "";',
  'for (const name of ["search-dashboard-ranges.json", "gsc-dashboard-ranges.json", "search-dashboard.json", "gsc-dashboard.json"]) {',
  '  const value = readJson(path.join(seoDir, name));',
  '  if (value) { dashboard = value; sourceFile = name; break; }',
  '}',
  '',
  'const pickRange = (key) => {',
  '  if (!dashboard) return null;',
  '  if (dashboard.ranges && dashboard.ranges[key]) return dashboard.ranges[key];',
  '  const ownKey = dashboard.key || dashboard.range;',
  '  return ownKey === key ? dashboard : null;',
  '};',
  '',
  'const primary = pickRange(primaryKey);',
  'const context = pickRange(contextKey);',
  '',
  'const normalizePath = (value) => {',
  '  const raw = String(value || "").trim();',
  '  if (!raw) return "/";',
  '  try {',
  '    const url = raw.startsWith("http")',
  '      ? new URL(raw)',
  '      : new URL("https://pfotentechnik.de/" + raw.replace(/^\\\\/+/, ""));',
  '    return (url.pathname.replace(/\\\\/+/g, "/").replace(/\\\\/+$/, "") || "") + "/";',
  '  } catch {',
  '    return "/";',
  '  }',
  '};',
  '',
  'const num = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;',
  '',
  'const field = (raw, key) => {',
  '  const match = raw.match(new RegExp("^" + key + ":\\\\s*[\\\\\\"\\\\\\\']?([^\\\\\\"\\\\\\\'\\\\n]+)", "m"));',
  '  return match?.[1]?.trim() || "";',
  '};',
  '',
  'const evidenceStats = (raw) => ({',
  '  hasExternal: /^externalEvidence:\\s*$/m.test(raw),',
  '  professional: (raw.match(/^\\s*-\\s+publisher:/gm) || []).length,',
  '  userSources: (raw.match(/^\\s*-\\s+platform:/gm) || []).length,',
  '  consensus: (raw.match(/^\\s+finding:/gm) || []).length,',
  '});',
  '',
  'const searchRows = (range, slug) => {',
  '  if (!range) return { page: null, pageQueries: [] };',
  '  const wanted = "/produkt/" + slug + "/";',
  '  const pages = (range.pages || []).filter((row) => normalizePath(row.page) === wanted);',
  '  const pageQueries = (range.pageQueries || []).filter((row) => normalizePath(row.page) === wanted);',
  '  pages.sort((a, b) => num(b.impressions) - num(a.impressions));',
  '  pageQueries.sort((a, b) => num(b.impressions) - num(a.impressions));',
  '  return { page: pages[0] || null, pageQueries };',
  '};',
  '',
  'const rankingScore = (position, impressions) => {',
  '  if (!impressions || !position) return 0;',
  '  if (position >= 6 && position <= 15) return 30;',
  '  if (position > 15 && position <= 25) return Math.round(30 - (position - 15) * 1.2);',
  '  if (position < 6) return 18;',
  '  if (position <= 40) return Math.max(5, Math.round(18 - (position - 25) * 0.8));',
  '  return 3;',
  '};',
  '',
  'const ctrBenchmark = (position) => position <= 3 ? 8 : position <= 5 ? 5 : position <= 10 ? 3 : position <= 20 ? 1.5 : 1;',
  '',
  'let products = fs.readdirSync(productDir)',
  '  .filter((name) => /\\.mdx?$/i.test(name))',
  '  .map((name) => {',
  '    const raw = fs.readFileSync(path.join(productDir, name), "utf8");',
  '    const slug = field(raw, "slug") || name.replace(/\\.mdx?$/i, "");',
  '    const title = field(raw, "title") || slug;',
  '    const evidence = evidenceStats(raw);',
  '    const current = searchRows(primary, slug);',
  '    const longTerm = searchRows(context, slug);',
  '    const page = current.page || {};',
  '',
  '    const impressions = num(page.impressions) || current.pageQueries.reduce((sum, row) => sum + num(row.impressions), 0);',
  '    const clicks = num(page.clicks) || current.pageQueries.reduce((sum, row) => sum + num(row.clicks), 0);',
  '    const weightedDen = current.pageQueries.reduce((sum, row) => sum + Math.max(1, num(row.impressions)), 0);',
  '    const weightedPos = current.pageQueries.reduce((sum, row) => sum + num(row.position) * Math.max(1, num(row.impressions)), 0);',
  '    const position = num(page.position) || (weightedDen ? weightedPos / weightedDen : 0);',
  '    const ctr = impressions ? clicks / impressions * 100 : num(page.ctr);',
  '',
  '    return {',
  '      file: "src/content/products/" + name,',
  '      slug,',
  '      title,',
  '      rating: num(field(raw, "rating")),',
  '      recommendationStatus: field(raw, "recommendationStatus"),',
  '      evidence,',
  '      search: {',
  '        impressions, clicks, position, ctr,',
  '        queries: current.pageQueries.slice(0, 8),',
  '        contextImpressions: num(longTerm.page?.impressions) || longTerm.pageQueries.reduce((sum, row) => sum + num(row.impressions), 0),',
  '        contextClicks: num(longTerm.page?.clicks) || longTerm.pageQueries.reduce((sum, row) => sum + num(row.clicks), 0),',
  '      },',
  '    };',
  '  });',
  '',
  'const maxImpressions = Math.max(1, ...products.map((p) => p.search.impressions));',
  '',
  'for (const product of products) {',
  '  const s = product.search;',
  '  const missing = [product.evidence.professional === 0, product.evidence.userSources === 0, product.evidence.consensus === 0].filter(Boolean).length;',
  '  const score = {',
  '    ranking: rankingScore(s.position, s.impressions),',
  '    impressions: s.impressions ? Math.round(20 * Math.log1p(s.impressions) / Math.log1p(maxImpressions)) : 0,',
  '    ctrPotential: s.impressions ? Math.round(15 * Math.max(0, 1 - s.ctr / ctrBenchmark(s.position || 30))) : 0,',
  '    queryMatch: s.queries.length ? Math.min(15, 8 + Math.min(7, s.queries.length)) : 0,',
  '    evidenceGap: Math.round(15 * missing / 3),',
  '    commercial: (product.recommendationStatus === "recommended" ? 3 : 1) + (product.rating >= 80 || product.rating >= 4 ? 2 : 0),',
  '  };',
  '  score.total = score.ranking + score.impressions + score.ctrPotential + score.queryMatch + score.evidenceGap + score.commercial;',
  '  product.score = score;',
  '  product.searchSignal = s.impressions > 0 || s.contextImpressions > 0;',
  '}',
  '',
  'products.sort((a, b) => b.score.total - a.score.total || b.search.impressions - a.search.impressions || b.rating - a.rating);',
  '',
  'const generatedAt = new Date().toISOString();',
  'const source = { dashboardFile: sourceFile || null, primaryRange: primaryKey, primaryAvailable: Boolean(primary), contextRange: contextKey, contextAvailable: Boolean(context) };',
  'const weights = { ranking: 30, impressions: 20, ctrPotential: 15, pageQueryMatch: 15, evidenceGap: 15, commercialRelevance: 5 };',
  '',
  'fs.writeFileSync(path.join(outDir, "search-opportunity.json"), JSON.stringify({ generatedAt, source, weights, products }, null, 2) + "\\n");',
  '',
  'const opportunityMd = [',
  '  "# Search × Evidence Opportunity", "",',
  '  "- Search-Quelle: " + (sourceFile || "keine"),',
  '  "- Primär: " + primaryKey + (primary ? "" : " (nicht verfügbar)"),',
  '  "- Kontext: " + contextKey + (context ? "" : " (nicht verfügbar)"),',
  '  "",',
  '  "| # | Produkt | Score | Impr. | Klicks | Pos. | Evidence-Gap |",',
  '  "| ---: | --- | ---: | ---: | ---: | ---: | ---: |",',
  '  ...products.map((p, i) => "| " + (i + 1) + " | " + p.title.replace(/\\|/g, "\\\\|") + " | " + p.score.total + " | " + p.search.impressions + " | " + p.search.clicks + " | " + (p.search.position ? p.search.position.toFixed(1) : "–") + " | " + p.score.evidenceGap + "/15 |"),',
  '];',
  'fs.writeFileSync(path.join(outDir, "search-opportunity.md"), opportunityMd.join("\\n") + "\\n");',
  '',
  'const selected = products.slice(0, limit);',
  'const rules = [',
  '  "Keine eigenen Tests behaupten.",',
  '  "Externe Tests mit Publisher, URL, Datum und Methodik getrennt erfassen.",',
  '  "Nutzerbewertungen pro Plattform getrennt erfassen.",',
  '  "Sterne verschiedener Plattformen nicht mitteln.",',
  '  "Konsens nur bei wiederkehrenden Mustern aus mehreren Quellen.",',
  '  "Search-Signale priorisieren Recherche, ersetzen aber keine Evidenzprüfung.",',
  '];',
  'fs.writeFileSync(path.join(outDir, "research-queue.json"), JSON.stringify({ generatedAt, source, rules, products: selected }, null, 2) + "\\n");',
  '',
  'const queueMd = ["# Research Queue: externe Produktevidenz", "", "Priorisiert mit " + primaryKey + "-Search-Signalen und " + contextKey + " als Kontext. Quelle: " + (sourceFile || "keine Search-Daten gefunden") + ".", ""];',
  'for (const [index, p] of selected.entries()) {',
  '  queueMd.push("## " + (index + 1) + ". " + p.title);',
  '  queueMd.push("- Slug: " + p.slug);',
  '  queueMd.push("- Datei: " + p.file);',
  '  queueMd.push("- Opportunity-Score: " + p.score.total + "/100");',
  '  queueMd.push("- Search: " + p.search.impressions + " Impressionen · " + p.search.clicks + " Klicks · Position " + (p.search.position ? p.search.position.toFixed(1) : "–"));',
  '  queueMd.push("- Evidence-Gap: " + p.score.evidenceGap + "/15 · Professional " + p.evidence.professional + " · Nutzerquellen " + p.evidence.userSources + " · Konsens " + p.evidence.consensus);',
  '  if (p.search.queries.length) {',
  '    const qs = p.search.queries.slice(0, 5).map((q) => String(q.query || "") + " (" + num(q.impressions) + " Impr., Pos. " + num(q.position).toFixed(1) + ")").join("; ");',
  '    queueMd.push("- Relevante Queries: " + qs);',
  '  } else {',
  '    queueMd.push("- Relevante Queries: noch kein PageQuery-Signal");',
  '  }',
  '  queueMd.push("- Auftrag: fehlende unabhängige professionelle Reviews und belastbare Nutzerquellen recherchieren; wiederkehrende Muster belegen.");',
  '  queueMd.push("");',
  '}',
  'fs.writeFileSync(path.join(outDir, "research-queue.md"), queueMd.join("\\n") + "\\n");',
  '',
  'console.log("Research Queue: " + selected.length + " Produkte · Search-Quelle: " + (sourceFile || "keine") + " · Range: " + primaryKey);',
  'console.log("Opportunity Report: reports/product-evidence/search-opportunity.md");',
  '',
].join("\\n");

const testContent = [
  'import test from "node:test";',
  'import assert from "node:assert/strict";',
  'import fs from "node:fs";',
  'const s = fs.readFileSync(new URL("../scripts/product-evidence/research-queue.mjs", import.meta.url), "utf8");',
  'test("Cockpit-Daten werden wiederverwendet", () => {',
  '  assert.match(s, /search-dashboard-ranges\\\\.json/);',
  '  assert.match(s, /gsc-dashboard-ranges\\\\.json/);',
  '  assert.doesNotMatch(s, /csv-parse|readCSV|gsc-import/i);',
  '});',
  'test("28d plus 3m", () => { assert.match(s, /primaryKey.*28d/); assert.match(s, /contextKey.*3m/); });',
  'test("PageQueries und Produktpfad", () => { assert.match(s, /pageQueries/); assert.match(s, /\\\\/produkt\\\\//); });',
  'test("Scoring", () => { for (const k of ["ranking","impressions","ctrPotential","queryMatch","evidenceGap","commercial"]) assert.match(s, new RegExp(k)); });',
  'test("Reports", () => { for (const f of ["search-opportunity.json","search-opportunity.md","research-queue.json","research-queue.md"]) assert.ok(s.includes(f)); });',
  '',
].join("\\n");

function run(label, args) {
  console.log(`[${PATCH}] Prüfe: ${label}`);
  const r = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" });
  if (r.status !== 0) throw new Error(`${label} fehlgeschlagen (Exit ${r.status})`);
  console.log(`[${PATCH}] BESTANDEN: ${label}`);
}

try {
  fs.writeFileSync(target, queueScript);
  fs.writeFileSync(testFile, testContent);
  console.log(`[${PATCH}] Geschrieben: ${path.relative(root, target)}`);
  console.log(`[${PATCH}] Geschrieben: ${path.relative(root, testFile)}`);

  run("Syntax Research Queue", ["--check", target]);
  run("Regressionstest", ["--test", testFile]);
  run("Opportunity Queue", [target, "--limit=30"]);

  console.log(`[${PATCH}] Abgeschlossen.`);
} catch (error) {
  try {
    fs.copyFileSync(backupTarget, target);
    if (fs.existsSync(testFile)) fs.rmSync(testFile);
  } catch {}
  console.error(`[${PATCH}] FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  console.error(`[${PATCH}] Änderungen wurden zurückgerollt.`);
  process.exit(1);
}
