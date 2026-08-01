#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const STRICT = process.argv.includes("--strict");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const PRODUCT_ROOT = path.join(APP, "src", "content", "products");
const REPORT_DIR = path.join(APP, "reports", "product-standard-3");
const REPORT_JSON = path.join(REPORT_DIR, "product-standard-3-latest.json");
const REPORT_MD = path.join(REPORT_DIR, "product-standard-3-latest.md");

function walk(directory, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, output);
    else if (entry.isFile() && /\.mdx?$/i.test(entry.name)) output.push(full);
  }
  return output;
}

function frontmatter(source) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---/);
  return match ? match[1] : "";
}

function stringValue(block, key) {
  const match = block.match(new RegExp(`^${key}:\\s*["']?([^\\n"']+)`, "m"));
  return match ? match[1].trim() : "";
}

function section(block, key) {
  const lines = block.split("\n");
  const start = lines.findIndex((line) => new RegExp(`^${key}:\\s*$`).test(line));
  if (start < 0) return "";

  const result = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^[^\s]/.test(line)) break;
    result.push(line);
  }
  return result.join("\n");
}

function countTopLevelScalarList(block, key) {
  const value = section(block, key);
  return (value.match(/^\s{2}-\s+.+$/gm) ?? []).length;
}

function countTopLevelObjectList(block, key) {
  const value = section(block, key);
  return (value.match(/^\s{2}-\s+[A-Za-z0-9_-]+:\s*.+$/gm) ?? []).length;
}

function countNestedScalarList(block, parentKey, childKey) {
  const parent = section(block, parentKey);
  if (!parent) return 0;

  const lines = parent.split("\n");
  const childStart = lines.findIndex((line) =>
    new RegExp(`^\\s{2}${childKey}:\\s*$`).test(line)
  );
  if (childStart < 0) return 0;

  let count = 0;
  for (let index = childStart + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    if (/^\s{2}[A-Za-z0-9_-]+:\s*/.test(line)) break;
    if (/^\s{4}-\s+.+$/.test(line)) count += 1;
  }
  return count;
}

function countNestedObjectList(block, parentKey, childKey) {
  const parent = section(block, parentKey);
  if (!parent) return 0;

  const lines = parent.split("\n");
  const childStart = lines.findIndex((line) =>
    new RegExp(`^\\s{2}${childKey}:\\s*$`).test(line)
  );
  if (childStart < 0) return 0;

  let count = 0;
  for (let index = childStart + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    if (/^\s{2}[A-Za-z0-9_-]+:\s*/.test(line)) break;
    if (/^\s{4}-\s+[A-Za-z0-9_-]+:\s*.+$/.test(line)) count += 1;
  }
  return count;
}


function countEvidenceSignals(fm) {
  const explicit = countNestedScalarList(fm, "editorial", "evidence");
  if (explicit > 0) return explicit;

  let count = 0;
  const testStatus = stringValue(fm, "testStatus").toLowerCase();
  const editorial = section(fm, "editorial");
  const assessmentType = stringValue(
    editorial.replace(/^\s{2}/gm, ""),
    "assessmentType"
  ).toLowerCase();
  const experience = section(fm, "experience");
  const methodology = stringValue(
    experience.replace(/^\s{2}/gm, ""),
    "methodology"
  );
  const review = section(fm, "review");
  const summary = stringValue(
    review.replace(/^\s{2}/gm, ""),
    "summary"
  );

  if (testStatus && testStatus !== "unknown") count += 1;
  if (assessmentType) count += 1;
  if (methodology) count += 1;
  if (summary) count += 1;

  return Math.min(count, 4);
}

function categoryOf(fm) {
  const direct = stringValue(fm, "category");
  const categoryBlock = section(fm, "category");
  return (
    direct ||
    stringValue(categoryBlock.replace(/^\s{2}/gm, ""), "key") ||
    stringValue(categoryBlock.replace(/^\s{2}/gm, ""), "label")
  ).toLowerCase();
}

function severityWeight(severity) {
  return severity === "error" ? 25 : severity === "warning" ? 10 : 0;
}

function inspectProduct(file) {
  const source = fs.readFileSync(file, "utf8");
  const fm = frontmatter(source);
  const relative = path.relative(ROOT, file).replaceAll(path.sep, "/");
  const slug = path.basename(file).replace(/\.mdx?$/i, "");
  const category = categoryOf(fm);
  const findings = [];

  const add = (severity, code, message, recommendation) => {
    findings.push({ severity, code, message, recommendation });
  };

  const title = stringValue(fm, "title");
  const recommendation = stringValue(fm, "recommendation");
  const updatedAt = stringValue(fm, "updatedAt");
  const specs = countTopLevelObjectList(fm, "specs");
  const strengths = countTopLevelScalarList(fm, "strengths");
  const weaknesses = countTopLevelScalarList(fm, "weaknesses");
  const faq = countTopLevelObjectList(fm, "faq");
  const evidenceCount = countEvidenceSignals(fm);
  const communityPositive = countNestedObjectList(fm, "communityInsights", "positives");
  const communityNegative = countNestedObjectList(fm, "communityInsights", "negatives");
  const decisionFacts = countTopLevelObjectList(fm, "decisionFacts");
  const purchaseMistakes = countTopLevelObjectList(fm, "purchaseMistakes");

  if (!title) add("error", "TITLE_MISSING", "Produkttitel fehlt.", "Einen eindeutigen Produkttitel ergänzen.");
  if (!recommendation) add("warning", "RECOMMENDATION_MISSING", "Kurzes redaktionelles Urteil fehlt.", "Eine knappe, kaufentscheidende Empfehlung ergänzen.");
  if (!updatedAt) add("warning", "UPDATED_AT_MISSING", "Kein inhaltliches Prüfdatum hinterlegt.", "updatedAt ergänzen.");
  if (specs < 4) add("warning", "SPECS_THIN", `Nur ${specs} technische Daten hinterlegt.`, "Mindestens vier kaufrelevante Spezifikationen pflegen.");
  if (strengths < 2) add("warning", "STRENGTHS_THIN", `Nur ${strengths} Stärken hinterlegt.`, "Mindestens zwei belastbare Stärken ergänzen.");
  if (weaknesses < 1) add("warning", "WEAKNESSES_MISSING", "Keine klare Schwäche hinterlegt.", "Mindestens eine reale Einschränkung ergänzen.");
  if (evidenceCount < 2) add("warning", "EVIDENCE_THIN", `Nur ${evidenceCount} Evidenzarten hinterlegt.`, "Herstellerunterlagen, technische Dokumentation oder Vergleichsanalyse ergänzen.");

  const isMoneyCategory = /(futter|trink|gps|tracker|katzenklappe|cat-flap)/.test(category);

  if (isMoneyCategory && decisionFacts === 0) {
    add("info", "DECISION_FACTS_DERIVED", "Keine expliziten Decision Facts hinterlegt. Die Seite nutzt automatische Ableitungen.", "Bei wichtigen Produkten eigene Konsequenzen ergänzen.");
  }

  if (isMoneyCategory && purchaseMistakes === 0) {
    add("info", "PURCHASE_MISTAKES_MISSING", "Keine expliziten Fehlkauf-Szenarien hinterlegt.", "Für priorisierte Produkte ein bis drei typische Fehlkäufe ergänzen.");
  }

  if (communityPositive + communityNegative === 0) {
    add("info", "COMMUNITY_EMPTY", "Noch keine strukturierten Community-Muster hinterlegt.", "Nur bei belastbarer Mehrquellen-Auswertung ergänzen.");
  }

  if (faq > 12) {
    add("warning", "FAQ_EXCESSIVE", `${faq} FAQ-Einträge können die Produktseite unnötig verlängern.`, "Nur echte Kauffragen behalten.");
  }

  const score = Math.max(
    0,
    100 - findings.reduce((sum, finding) => sum + severityWeight(finding.severity), 0)
  );

  const status = findings.some((item) => item.severity === "error")
    ? "blocked"
    : score >= 90
      ? "strong"
      : score >= 75
        ? "good"
        : "needs-work";

  return {
    slug,
    file: relative,
    category,
    score,
    status,
    metrics: {
      specs,
      strengths,
      weaknesses,
      faq,
      evidenceCount,
      communityInsights: communityPositive + communityNegative,
      decisionFacts,
      purchaseMistakes
    },
    findings
  };
}

const products = walk(PRODUCT_ROOT)
  .map(inspectProduct)
  .sort((a, b) => a.score - b.score || a.slug.localeCompare(b.slug));

const summary = {
  products: products.length,
  blocked: products.filter((item) => item.status === "blocked").length,
  needsWork: products.filter((item) => item.status === "needs-work").length,
  good: products.filter((item) => item.status === "good").length,
  strong: products.filter((item) => item.status === "strong").length,
  errors: products.flatMap((item) => item.findings).filter((item) => item.severity === "error").length,
  warnings: products.flatMap((item) => item.findings).filter((item) => item.severity === "warning").length,
  info: products.flatMap((item) => item.findings).filter((item) => item.severity === "info").length
};

const report = {
  version: "25.3.6",
  generatedAt: new Date().toISOString(),
  summary,
  products
};

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2) + "\n");

const rows = products.map((product) =>
  `| ${product.slug} | ${product.score} | ${product.status} | ${product.findings.filter((item) => item.severity !== "info").length} |`
);

const priority = products
  .filter((product) => product.status === "blocked" || product.status === "needs-work")
  .slice(0, 25)
  .flatMap((product) => [
    `### ${product.slug} · ${product.score}/100`,
    "",
    ...product.findings
      .filter((item) => item.severity !== "info")
      .map((item) => `- **${item.severity.toUpperCase()} · ${item.code}:** ${item.message} ${item.recommendation}`),
    ""
  ]);

const markdown = [
  "# Product Standard 3 Audit",
  "",
  `- Produkte: ${summary.products}`,
  `- Blockiert: ${summary.blocked}`,
  `- Verbesserungsbedarf: ${summary.needsWork}`,
  `- Gut: ${summary.good}`,
  `- Stark: ${summary.strong}`,
  `- Fehler: ${summary.errors}`,
  `- Warnungen: ${summary.warnings}`,
  "",
  "## Übersicht",
  "",
  "| Produkt | Score | Status | relevante Findings |",
  "|---|---:|---|---:|",
  ...rows,
  "",
  "## Höchste Priorität",
  "",
  ...(priority.length ? priority : ["Keine blockierten oder schwachen Produktseiten."]),
  ""
].join("\n");

fs.writeFileSync(REPORT_MD, markdown);

console.log(`[product-standard-3] Produkte: ${summary.products}`);
console.log(`[product-standard-3] Blockiert: ${summary.blocked}`);
console.log(`[product-standard-3] Verbesserungsbedarf: ${summary.needsWork}`);
console.log(`[product-standard-3] Gut: ${summary.good}`);
console.log(`[product-standard-3] Stark: ${summary.strong}`);
console.log(`[product-standard-3] Fehler: ${summary.errors}`);
console.log(`[product-standard-3] Warnungen: ${summary.warnings}`);
console.log(`[product-standard-3] Report: ${path.relative(ROOT, REPORT_MD)}`);

if (STRICT && summary.errors > 0) process.exitCode = 1;
