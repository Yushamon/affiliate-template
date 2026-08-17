#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-data-integrity-repair-32.6.3";
const SOURCE_PATCH = "pfotentechnik-product-data-coverage-migration-32.6.2";

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
}

function frontmatter(raw) {
  if (!raw.startsWith("---")) return "";
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return "";
  return raw.slice(3, end);
}

function extractBlock(fm, key) {
  const lines = fm.split(/\r?\n/);
  const inline = lines.findIndex((line) => new RegExp(`^${key}:\\s*\\{`).test(line));
  if (inline >= 0) {
    return {
      start: inline,
      end: inline + 1,
      lines: [lines[inline]]
    };
  }

  const start = lines.findIndex((line) => new RegExp(`^${key}:\\s*$`).test(line));
  if (start < 0) return null;

  let end = start + 1;
  while (end < lines.length && !/^[A-Za-z_][\w-]*:/.test(lines[end])) end++;

  return {
    start,
    end,
    lines: lines.slice(start, end)
  };
}

function replaceFrontmatterBlock(currentRaw, backupRaw, key) {
  const currentFm = frontmatter(currentRaw);
  const backupFm = frontmatter(backupRaw);
  const currentBlock = extractBlock(currentFm, key);
  const backupBlock = extractBlock(backupFm, key);

  const fmStart = currentRaw.indexOf("---");
  const fmEnd = currentRaw.indexOf("\n---", fmStart + 3);
  if (fmEnd < 0) throw new Error("Ungültiges Frontmatter.");

  const currentLines = currentFm.split(/\r?\n/);

  if (currentBlock && backupBlock) {
    currentLines.splice(
      currentBlock.start,
      currentBlock.end - currentBlock.start,
      ...backupBlock.lines
    );
  } else if (currentBlock && !backupBlock) {
    currentLines.splice(
      currentBlock.start,
      currentBlock.end - currentBlock.start
    );
  } else if (!currentBlock && backupBlock) {
    const comparisonsIndex = currentLines.findIndex((line) => /^comparisons:/.test(line));
    const insertAt = comparisonsIndex >= 0 ? comparisonsIndex : currentLines.length;
    currentLines.splice(insertAt, 0, ...backupBlock.lines);
  } else {
    return currentRaw;
  }

  const newFm = currentLines.join("\n");
  return currentRaw.slice(0, fmStart + 3) + newFm + currentRaw.slice(fmEnd);
}

function scalar(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+?)["']?\\s*$`, "m"));
  return m ? m[1].trim() : "";
}

function extractItems(fm) {
  const lines = fm.split(/\r?\n/);
  const start = lines.findIndex((l) => /^items:\s*$/.test(l));
  if (start < 0) return [];

  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^[A-Za-z_][\w-]*:/.test(line)) break;
    const slug = line.match(/^\s*-\s*slug:\s*["']?([^"'#\n]+)["']?\s*$/);
    if (slug) out.push(slug[1].trim());
  }
  return out;
}

const root = findRoot(process.cwd());
const app = path.join(root, "apps", "pfotentechnik");
const productDir = path.join(app, "src", "content", "products");
const comparisonDir = path.join(app, "src", "content", "comparisons");
const reportDir = path.join(app, "reports", "comparison-selection");
fs.mkdirSync(reportDir, { recursive: true });

const comparisonCountsBefore = new Map();
for (const file of fs.readdirSync(comparisonDir).filter((f) => f.endsWith(".md") && !f.includes(".bak"))) {
  const full = path.join(comparisonDir, file);
  const fm = frontmatter(fs.readFileSync(full, "utf8"));
  const slug = scalar(fm, "slug") || path.basename(file, ".md");
  comparisonCountsBefore.set(slug, extractItems(fm).length);
}

const repaired = [];
const skipped = [];
const missingBackup = [];

for (const file of fs.readdirSync(productDir).filter((f) => f.endsWith(".md") && !f.includes(".bak"))) {
  const full = path.join(productDir, file);
  const backup = `${full}.${SOURCE_PATCH}.bak`;

  if (!fs.existsSync(backup)) {
    continue;
  }

  const currentRaw = fs.readFileSync(full, "utf8");
  const backupRaw = fs.readFileSync(backup, "utf8");

  const restored = replaceFrontmatterBlock(
    currentRaw,
    backupRaw,
    "comparisonFilters"
  );

  if (restored === currentRaw) {
    skipped.push(path.relative(root, full));
    continue;
  }

  const repairBackup = `${full}.${PATCH}.bak`;
  if (!fs.existsSync(repairBackup)) {
    fs.copyFileSync(full, repairBackup);
  }

  fs.writeFileSync(full, restored, "utf8");
  repaired.push(path.relative(root, full));
}

const comparisonRegressions = [];

for (const [slug, before] of comparisonCountsBefore.entries()) {
  const file = path.join(comparisonDir, `${slug}.md`);
  if (!fs.existsSync(file)) continue;

  const fm = frontmatter(fs.readFileSync(file, "utf8"));
  const after = extractItems(fm).length;

  if (after < before) {
    comparisonRegressions.push({ slug, before, after });
  }
}

if (comparisonRegressions.length) {
  console.error(`[${PATCH}] NO COMPARISON REGRESSION verletzt.`);
  for (const item of comparisonRegressions) {
    console.error(`- ${item.slug}: vorher ${item.before}, nachher ${item.after}`);
  }
  process.exit(1);
}

const report = [
  "# Comparison Data Integrity Repair 32.6.3",
  "",
  `Erstellt: ${new Date().toISOString()}`,
  "",
  "## Zweck",
  "",
  "32.6.2 hat technische Merkmale aus Volltext-Heuristiken ergänzt.",
  "Der anschließende Selection-Audit zeigte Fehlklassifikationen, unter anderem",
  "bei Kamera, Futterart und Mikrochip-Zugang.",
  "",
  "32.6.3 stellt deshalb ausschließlich den comparisonFilters-Block aus den",
  "vor 32.6.2 angelegten Backups wieder her.",
  "",
  "Andere Änderungen an den Produktdateien bleiben erhalten.",
  "",
  "## Sicherheitsregeln",
  "",
  "- Keine Comparison-MD wird verändert.",
  "- Kein items[]-Eintrag wird entfernt.",
  "- Keine comparisons[]-Verknüpfung wird verändert.",
  "- Nur comparisonFilters wird aus dem unmittelbaren 32.6.2-Backup restauriert.",
  "- Vor jeder Reparatur wird ein 32.6.3-Backup der aktuellen Datei erzeugt.",
  "- NO COMPARISON REGRESSION bleibt harte Invariante.",
  "",
  "## Ergebnis",
  "",
  `- Reparierte Produktdateien: ${repaired.length}`,
  `- Unveränderte Backup-Kandidaten: ${skipped.length}`,
  `- Comparison-Regressions: ${comparisonRegressions.length}`,
  "",
  "## Reparierte Dateien",
  "",
  ...repaired.map((file) => `- ${file}`),
  "",
  "## Nächste Architekturregel",
  "",
  "Automatische Comparison-Zuordnung darf künftig nicht aus unstrukturiertem",
  "Volltext auf boolesche technische Merkmale schließen.",
  "",
  "Für die erste produktive Hybridstufe werden nur zwei Quellen akzeptiert:",
  "",
  "1. bestehende kuratierte items[]",
  "2. explizite product.comparisons[]-Backlinks",
  "",
  "Damit gilt zunächst: visible = curated ∪ explicitBacklinks.",
  "Eine spätere technische Selection darf diese Menge ergänzen, aber nicht verkleinern."
].join("\n");

const reportPath = path.join(reportDir, "comparison-data-integrity-repair-32.6.3.md");
fs.writeFileSync(reportPath, report, "utf8");

console.log(`[${PATCH}] Reparierte Produktdateien: ${repaired.length}`);
console.log(`[${PATCH}] Unveränderte Backup-Kandidaten: ${skipped.length}`);
console.log(`[${PATCH}] Comparison-Regressions: ${comparisonRegressions.length}`);
console.log(`[${PATCH}] Report: ${path.relative(root, reportPath)}`);
console.log(`[${PATCH}] NO COMPARISON REGRESSION: bestanden`);
console.log(`[${PATCH}] Keine Comparison-MD wurde verändert.`);
console.log(`[${PATCH}] Fertig.`);
