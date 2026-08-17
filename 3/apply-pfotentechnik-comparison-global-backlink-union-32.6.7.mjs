#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-global-backlink-union-32.6.7";

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

const root = findRoot(process.cwd());
const target = path.join(
  root,
  "apps",
  "pfotentechnik",
  "src",
  "domain",
  "comparison",
  "buildComparisonViewModel.ts"
);

if (!fs.existsSync(target)) {
  throw new Error(`[${PATCH}] Datei fehlt: ${path.relative(root, target)}`);
}

let raw = fs.readFileSync(target, "utf8");

const registryImport =
  'import { getComparisonSelectionRule } from "./comparisonSelectionRegistry";\n';

if (raw.includes(registryImport)) {
  raw = raw.replace(registryImport, "");
}

const oldBlock = `  const selectionRule = getComparisonSelectionRule(data.slug);
  const hybridMembershipEnabled = selectionRule?.mode === "ready";

  const backlinkItems = hybridMembershipEnabled
    ? products
        .filter((product) =>
          product.data.comparisons.includes(data.slug) &&
          !explicitSlugs.has(product.data.slug)
        )
        .map((product) => ({
          slug: product.data.slug,
          label: product.data.title,
          type: "product" as const,
          recommendation: product.data.recommendation,
          values: {}
        }))
    : [];

  /*
   * Safety Gate 32.6.5
   *
   * Nur Vergleiche mit Registry-Status "ready" dürfen zusätzliche
   * product.comparisons[]-Backlinks automatisch übernehmen.
   *
   * Alle needs-data/backlink-transition Vergleiche bleiben vollständig
   * kuratiert über items[].
   */
  const items = [...explicitItems, ...backlinkItems];`;

const newBlock = `  /*
   * Global Backlink Union 32.6.7
   *
   * Mitgliedschaft und technische Selection-Reife sind getrennt:
   *
   * - items[] bleibt die kuratierte Basis
   * - product.comparisons[] ist eine explizite redaktionelle Zuordnung
   * - explizite Backlinks dürfen für jeden Vergleich ergänzen
   * - Registry-Modi steuern nur spätere technische Selection Rules
   * - keine Volltext-Heuristik entscheidet über Mitgliedschaft
   *
   * visible = curated items[] ∪ explicit product.comparisons[]
   */
  const backlinkItems = products
    .filter((product) =>
      product.data.comparisons.includes(data.slug) &&
      !explicitSlugs.has(product.data.slug)
    )
    .map((product) => ({
      slug: product.data.slug,
      label: product.data.title,
      type: "product" as const,
      recommendation: product.data.recommendation,
      values: {}
    }));

  const items = [...explicitItems, ...backlinkItems];`;

if (!raw.includes(oldBlock)) {
  throw new Error(
    `[${PATCH}] Erwarteter 32.6.5-Block nicht gefunden. ` +
    `Der lokale Stand weicht vom aktuell geprüften GitHub-Stand ab.`
  );
}

const backup = `${target}.${PATCH}.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
}

raw = raw.replace(oldBlock, newBlock);
fs.writeFileSync(target, raw, "utf8");

const reportDir = path.join(
  root,
  "apps",
  "pfotentechnik",
  "reports",
  "comparison-selection"
);
fs.mkdirSync(reportDir, { recursive: true });

const reportPath = path.join(
  reportDir,
  "comparison-global-backlink-union-32.6.7.md"
);

fs.writeFileSync(reportPath, `# Comparison Global Backlink Union 32.6.7

## Regel

visible = curated items[] ∪ explicit product.comparisons[]

## Sicherheitsgrenzen

- items[] wird niemals automatisch gekürzt.
- product.comparisons[] darf ausschließlich ergänzen.
- Duplikate werden über den Produkt-Slug verhindert.
- Die bestehende kuratierte Reihenfolge bleibt vorne erhalten.
- Keine technische Selection Rule wird aktiviert.
- Keine Volltext-Heuristik wird benutzt.
- comparisonSelectionRegistry.ts bleibt unverändert.
- needs-data und backlink-transition bleiben als Reifestatus erhalten.

## Architektur

Die Registry beschreibt künftig ausschließlich die Reife einer späteren
merkmalbasierten Selection Rule.

Die explizite Produkt-zu-Vergleich-Beziehung in product.comparisons[] ist
davon unabhängig und darf sofort als sichere zusätzliche Mitgliedschaft
verwendet werden.
`, "utf8");

console.log(`[${PATCH}] Gepatcht: ${path.relative(root, target)}`);
console.log(`[${PATCH}] Global aktiv: items[] ∪ product.comparisons[]`);
console.log(`[${PATCH}] Registry unverändert.`);
console.log(`[${PATCH}] Report: ${path.relative(root, reportPath)}`);
console.log(`[${PATCH}] Fertig.`);
