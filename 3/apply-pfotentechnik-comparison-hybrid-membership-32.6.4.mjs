#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-hybrid-membership-32.6.4";

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

const raw = fs.readFileSync(target, "utf8");

const oldBlock = `  const explicitSlugs = new Set(
    data.items.map((item) => item.slug)
  );

  // Kuratierte Vergleichslisten sind autoritativ. Automatische
  // Produktzuordnung dient nur als Fallback, wenn keine items gepflegt sind.
  const automaticItems = explicitItems.length === 0
    ? products
      .filter((product) =>
        product.data.comparisons.includes(data.slug)
      )
      .map((product) => ({
        slug: product.data.slug,
        label: product.data.title,
        type: "product" as const,
        recommendation: product.data.recommendation,
        values: {}
      }))
    : [];

  const items = [...explicitItems, ...automaticItems];`;

const newBlock = `  const explicitSlugs = new Set(
    explicitItems.map((item) => item.slug)
  );

  /*
   * Comparison Membership 32.6.4
   *
   * Safety-first Hybrid:
   * - kuratierte items[] bleiben vollständig erhalten
   * - explizite product.comparisons[]-Backlinks dürfen zusätzliche Produkte ergänzen
   * - kein bestehendes Produkt wird automatisch entfernt
   * - keine Volltext-Heuristik entscheidet über Mitgliedschaft
   * - technische Selection Rules werden in dieser Stufe noch nicht produktiv genutzt
   *
   * Damit gilt:
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
    `[${PATCH}] Erwarteter Membership-Block nicht gefunden. ` +
    `Der aktuelle buildComparisonViewModel.ts weicht vom geprüften Stand ab.`
  );
}

const backup = `${target}.${PATCH}.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
}

const patched = raw.replace(oldBlock, newBlock);
fs.writeFileSync(target, patched, "utf8");
console.log(`[${PATCH}] Gepatcht: ${path.relative(root, target)}`);

const reportDir = path.join(
  root,
  "apps",
  "pfotentechnik",
  "reports",
  "comparison-selection"
);
fs.mkdirSync(reportDir, { recursive: true });

const report = `# Comparison Hybrid Membership 32.6.4

## Produktive Regel

\`\`\`text
visible products = curated items[] ∪ explicit product.comparisons[]
\`\`\`

## Sicherheitsgarantien

- Bestehende \`items[]\` bleiben vollständig sichtbar.
- Produkt-Backlinks dürfen nur ergänzen.
- Keine automatische Entfernung.
- Keine Volltext-Heuristik.
- Keine technische Selection Rule ist produktiv aktiv.
- Bestehende Reihenfolge bleibt erhalten; neue Backlink-Produkte werden danach angehängt.
- Recommendation Engine arbeitet anschließend auf der vereinigten Kandidatenmenge.

## Erwarteter Haustierkamera-Effekt

Vorher kuratiert:

- petlibro-scout-smart-camera
- furbo-mini-360
- enabot-rola-mini
- pettec-cam-360
- reolink-e1-zoom

Zusätzlich durch explizite Backlinks:

- enabot-ebo-air-2
- furbo-360-hundekamera

Erwartete sichtbare Produktzahl: 7.

## Rollback

Backup:

\`apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts.${PATCH}.bak\`
`;

const reportPath = path.join(reportDir, "comparison-hybrid-membership-32.6.4.md");
fs.writeFileSync(reportPath, report, "utf8");
console.log(`[${PATCH}] Report: ${path.relative(root, reportPath)}`);

console.log(`[${PATCH}] Fertig.`);
