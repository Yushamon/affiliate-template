#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-consolidation-audit-1.0.0";
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps/pfotentechnik");
const REPORT_DIR = path.join(APP, "reports/design-system");
const JSON_REPORT = path.join(REPORT_DIR, "css-consolidation-audit-latest.json");
const MD_REPORT = path.join(REPORT_DIR, "css-consolidation-audit-latest.md");

const log = (message) => console.log(`[${NAME}] ${message}`);
const fail = (message) => { throw new Error(message); };

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
};

const normalizeDeclarations = (body) =>
  body
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(";")
    .map((part) => part.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .sort()
    .join(";");

const parseRules = (css, file) => {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = [];
  const regex = /([^{}]+)\{([^{}]*)\}/g;
  let match;

  while ((match = regex.exec(withoutComments))) {
    const selectorText = match[1].trim();
    const body = match[2].trim();

    if (!selectorText || selectorText.startsWith("@")) continue;

    const selectors = selectorText
      .split(",")
      .map((selector) => selector.trim().replace(/\s+/g, " "))
      .filter(Boolean);

    const declarationFingerprint = normalizeDeclarations(body);
    const importantCount = (body.match(/!important\b/g) ?? []).length;

    for (const selector of selectors) {
      rules.push({
        file,
        selector,
        body,
        declarationFingerprint,
        importantCount
      });
    }
  }

  return rules;
};

try {
  const roots = [
    path.join(APP, "src/styles"),
    path.join(APP, "src/components"),
    path.join(APP, "src/pages"),
    path.join(ROOT, "packages/affiliate-core/src")
  ];

  const cssFiles = roots
    .flatMap(walk)
    .filter((file) => file.endsWith(".css"));

  const astroFiles = roots
    .flatMap(walk)
    .filter((file) => file.endsWith(".astro"));

  const records = [];

  for (const file of cssFiles) {
    const content = fs.readFileSync(file, "utf8");
    records.push({
      file: path.relative(ROOT, file),
      kind: "css",
      bytes: Buffer.byteLength(content),
      important: (content.match(/!important\b/g) ?? []).length,
      rules: parseRules(content, path.relative(ROOT, file))
    });
  }

  for (const file of astroFiles) {
    const content = fs.readFileSync(file, "utf8");
    const styleBlocks = [...content.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)];
    if (!styleBlocks.length) continue;

    const css = styleBlocks.map((match) => match[1]).join("\n");
    records.push({
      file: path.relative(ROOT, file),
      kind: "astro-style",
      bytes: Buffer.byteLength(css),
      important: (css.match(/!important\b/g) ?? []).length,
      rules: parseRules(css, path.relative(ROOT, file))
    });
  }

  const allRules = records.flatMap((record) => record.rules);

  const selectorMap = new Map();
  for (const rule of allRules) {
    const group = selectorMap.get(rule.selector) ?? [];
    group.push(rule);
    selectorMap.set(rule.selector, group);
  }

  const duplicateSelectors = [...selectorMap.entries()]
    .filter(([, rules]) => rules.length > 1)
    .map(([selector, rules]) => ({
      selector,
      occurrences: rules.length,
      files: [...new Set(rules.map((rule) => rule.file))],
      important: rules.reduce((sum, rule) => sum + rule.importantCount, 0)
    }))
    .sort((a, b) => b.occurrences - a.occurrences || b.important - a.important);

  const declarationMap = new Map();
  for (const rule of allRules) {
    if (!rule.declarationFingerprint) continue;
    const group = declarationMap.get(rule.declarationFingerprint) ?? [];
    group.push(rule);
    declarationMap.set(rule.declarationFingerprint, group);
  }

  const duplicateBlocks = [...declarationMap.entries()]
    .filter(([, rules]) => rules.length > 1)
    .map(([fingerprint, rules]) => ({
      fingerprint,
      occurrences: rules.length,
      selectors: [...new Set(rules.map((rule) => rule.selector))],
      files: [...new Set(rules.map((rule) => rule.file))]
    }))
    .sort((a, b) => b.occurrences - a.occurrences);

  const files = records
    .map((record) => ({
      file: record.file,
      kind: record.kind,
      bytes: record.bytes,
      rules: record.rules.length,
      important: record.important,
      duplicateSelectorOccurrences: record.rules.filter(
        (rule) => (selectorMap.get(rule.selector)?.length ?? 0) > 1
      ).length
    }))
    .sort((a, b) => b.important - a.important || b.bytes - a.bytes);

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: "ok",
    totals: {
      files: records.length,
      bytes: files.reduce((sum, file) => sum + file.bytes, 0),
      rules: allRules.length,
      important: files.reduce((sum, file) => sum + file.important, 0),
      duplicateSelectors: duplicateSelectors.length,
      duplicateDeclarationBlocks: duplicateBlocks.length
    },
    topImportantFiles: files.filter((file) => file.important > 0).slice(0, 30),
    largestFiles: [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 30),
    duplicateSelectors: duplicateSelectors.slice(0, 100),
    duplicateDeclarationBlocks: duplicateBlocks.slice(0, 100)
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(JSON_REPORT, JSON.stringify(report, null, 2) + "\n");

  const lines = [
    "# CSS Consolidation Audit",
    "",
    `Erzeugt: ${report.generatedAt}`,
    "",
    "## Zusammenfassung",
    "",
    `- Dateien mit CSS: ${report.totals.files}`,
    `- Quell-CSS: ${report.totals.bytes} Bytes`,
    `- Selektor-Regeln: ${report.totals.rules}`,
    `- !important: ${report.totals.important}`,
    `- mehrfach definierte Selektoren: ${report.totals.duplicateSelectors}`,
    `- identische Deklarationsblöcke: ${report.totals.duplicateDeclarationBlocks}`,
    "",
    "## Größte !important-Quellen",
    "",
    "| Datei | !important | Bytes | Regeln |",
    "|---|---:|---:|---:|",
    ...report.topImportantFiles.slice(0, 20).map(
      (file) => `| \`${file.file}\` | ${file.important} | ${file.bytes} | ${file.rules} |`
    ),
    "",
    "## Häufigste doppelte Selektoren",
    "",
    "| Selektor | Vorkommen | Dateien | !important |",
    "|---|---:|---:|---:|",
    ...report.duplicateSelectors.slice(0, 30).map(
      (item) =>
        `| \`${item.selector.replace(/\|/g, "\\|")}\` | ${item.occurrences} | ${item.files.length} | ${item.important} |`
    ),
    "",
    "## Empfehlung",
    "",
    "Beginne mit der Datei, die viele `!important`-Deklarationen und zugleich viele doppelte Selektorvorkommen enthält. Entferne nicht global, sondern konsolidiere jeweils eine klar abgegrenzte Komponentenfamilie und validiere danach Build, Design-System- und Performance-Audits.",
    ""
  ];

  fs.writeFileSync(MD_REPORT, lines.join("\n"));

  log(`Report: ${path.relative(ROOT, MD_REPORT)}`);
  log(`JSON: ${path.relative(ROOT, JSON_REPORT)}`);

  execFileSync(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "design-system:components:audit"],
    { cwd: ROOT, stdio: "inherit", env: process.env }
  );

  execFileSync(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "audit:performance:strict"],
    { cwd: ROOT, stdio: "inherit", env: process.env }
  );

  log("BESTANDEN: bestehende Design-System- und Performance-Audits");
  log("Abgeschlossen.");
} catch (error) {
  console.error(`[${NAME}] FEHLER: ${error.message}`);
  process.exitCode = 1;
}
