#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-premium-ux-seo-3.1.0";
const dryRun = process.argv.includes("--check") || process.argv.includes("--dry-run");

function findRepo(start = process.cwd()) {
  let current = path.resolve(start);

  for (let i = 0; i < 8; i += 1) {
    if (
      fs.existsSync(path.join(current, "apps", "pfotentechnik")) &&
      fs.existsSync(path.join(current, "packages", "affiliate-core"))
    ) return current;

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new Error("Repository-Root wurde nicht gefunden.");
}

const root = findRepo();
const backupRoot = path.join(root, ".patch-backups", `${PATCH}-${Date.now()}`);

const newFiles = {"packages/affiliate-core/src/components/comparison/ComparisonInsightSummary.astro": "---\nimport type {\n  ComparisonProduct,\n  ComparisonRow\n} from \"../../comparison/model\";\n\ntype Props = {\n  products: ComparisonProduct[];\n  rows: ComparisonRow[];\n};\n\nconst { products, rows } = Astro.props as Props;\n\nconst normalize = (value: string | undefined) =>\n  (value ?? \"\").trim().toLocaleLowerCase(\"de-DE\");\n\nconst meaningfulRows = rows.filter((row) => {\n  const values = row.cells\n    .map((cell) => normalize(cell.value))\n    .filter((value) => value && value !== \"–\" && value !== \"keine angabe\");\n\n  return new Set(values).size > 1;\n});\n\nconst completeRows = rows.filter((row) =>\n  row.cells.every((cell) => {\n    const value = normalize(cell.value);\n    return value && value !== \"–\" && value !== \"keine angabe\";\n  })\n);\n\nconst strongestDifferences = meaningfulRows.slice(0, 4);\nconst ratedProducts = products.filter(\n  (product) => typeof product.rating === \"number\"\n);\nconst topRated = [...ratedProducts].sort(\n  (a, b) => (b.rating ?? 0) - (a.rating ?? 0)\n)[0];\n\nconst completeness = rows.length > 0\n  ? Math.round((completeRows.length / rows.length) * 100)\n  : 0;\n---\n\n<section\n  class=\"comparison-insight-summary\"\n  aria-labelledby=\"comparison-insight-title\"\n>\n  <div class=\"comparison-insight-summary__intro\">\n    <span class=\"comparison-eyebrow\">Redaktionelle Einordnung</span>\n    <h2 id=\"comparison-insight-title\">\n      Was die Modelle wirklich unterscheidet\n    </h2>\n\n    <p>\n      {meaningfulRows.length > 0\n        ? `Bei ${meaningfulRows.length} von ${rows.length} Vergleichskriterien gibt es erkennbare Unterschiede. Entscheidend sind daher nicht möglichst viele Funktionen, sondern die Merkmale, die zu deinem Haushalt und Fütterungsalltag passen.`\n        : `Die erfassten Modelle liegen bei den wichtigsten Kriterien nah beieinander. Die Entscheidung sollte deshalb vor allem nach Bedienung, Tierzahl und Alltagssituation fallen.`}\n    </p>\n  </div>\n\n  <div class=\"comparison-insight-summary__grid\">\n    <article>\n      <span class=\"comparison-insight-summary__icon\" aria-hidden=\"true\">≠</span>\n      <strong>{meaningfulRows.length}</strong>\n      <span>relevante Unterschiede</span>\n    </article>\n\n    <article>\n      <span class=\"comparison-insight-summary__icon\" aria-hidden=\"true\">✓</span>\n      <strong>{completeness}%</strong>\n      <span>vollständig belegte Kriterien</span>\n    </article>\n\n    <article>\n      <span class=\"comparison-insight-summary__icon\" aria-hidden=\"true\">#</span>\n      <strong>{products.length}</strong>\n      <span>Modelle im Vergleich</span>\n    </article>\n  </div>\n\n  {(strongestDifferences.length > 0 || topRated) && (\n    <div class=\"comparison-insight-summary__details\">\n      {strongestDifferences.length > 0 && (\n        <div>\n          <h3>Darauf kommt es besonders an</h3>\n          <ul>\n            {strongestDifferences.map((row) => (\n              <li>\n                <a href=\"#direktvergleich\">{row.criterion.label}</a>\n                {row.criterion.description && (\n                  <span>{row.criterion.description}</span>\n                )}\n              </li>\n            ))}\n          </ul>\n        </div>\n      )}\n\n      {topRated && (\n        <aside>\n          <span>Höchster redaktioneller Score</span>\n          <strong>{topRated.title}</strong>\n          <p>\n            {Math.round(topRated.rating ?? 0)} von 100 Punkten. Der Score ist eine\n            Orientierung und ersetzt nicht die Prüfung, ob das Modell zu deinem\n            konkreten Einsatz passt.\n          </p>\n          <a href={topRated.href}>Produktdetails ansehen</a>\n        </aside>\n      )}\n    </div>\n  )}\n</section>\n", "packages/affiliate-core/src/components/comparison/ComparisonMethodology.astro": "---\ntype Props = {\n  productCount: number;\n  criterionCount: number;\n};\n\nconst { productCount, criterionCount } = Astro.props as Props;\n---\n\n<section\n  class=\"comparison-methodology\"\n  aria-labelledby=\"comparison-methodology-title\"\n>\n  <div>\n    <span class=\"comparison-eyebrow\">So vergleichen wir</span>\n    <h2 id=\"comparison-methodology-title\">\n      Transparente Kriterien statt pauschaler Bestenliste\n    </h2>\n  </div>\n\n  <div class=\"comparison-methodology__content\">\n    <p>\n      Dieser Vergleich ordnet {productCount} Modelle anhand von\n      {criterionCount} nachvollziehbaren Merkmalen ein. Produktdaten,\n      redaktionelle Bewertung und bekannte Einschränkungen werden getrennt\n      betrachtet. Fehlende Herstellerangaben werden nicht als Vorteil gewertet.\n    </p>\n\n    <ul>\n      <li>\n        <strong>Eignung vor Funktionsmenge:</strong>\n        Ein Modell gewinnt nicht automatisch, weil es die längste Ausstattungsliste besitzt.\n      </li>\n      <li>\n        <strong>Nachteile bleiben sichtbar:</strong>\n        Einschränkungen und fehlende Angaben werden nicht hinter einem Gesamtscore versteckt.\n      </li>\n      <li>\n        <strong>Entscheidung bleibt nachvollziehbar:</strong>\n        Tabelle, Szenarien und Fazit zeigen, warum ein Produkt empfohlen wird.\n      </li>\n    </ul>\n  </div>\n</section>\n", "packages/affiliate-core/src/components/comparison/comparison-premium-seo.css": "/*\n * PfotenTechnik Comparison Premium UX + SEO 3.1\n */\n\n.comparison-insight-summary,\n.comparison-methodology {\n  display: grid;\n  gap: clamp(1.25rem, 3vw, 2rem);\n  padding: clamp(1.25rem, 3vw, 2rem);\n  border: 1px solid var(--comparison-line);\n  border-radius: 1.35rem;\n  color: var(--comparison-text);\n  background: var(--comparison-surface);\n  box-shadow: var(--comparison-premium-shadow);\n}\n\n.comparison-insight-summary__intro h2,\n.comparison-methodology h2 {\n  max-width: 20ch;\n  margin: .45rem 0 .75rem;\n  color: var(--comparison-text);\n  font-size: clamp(1.55rem, 3vw, 2.45rem);\n  line-height: 1.06;\n  letter-spacing: -.04em;\n}\n\n.comparison-insight-summary__intro p,\n.comparison-methodology__content > p {\n  max-width: 70ch;\n  margin: 0;\n  color: var(--comparison-muted);\n  line-height: 1.7;\n}\n\n.comparison-insight-summary__grid {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: .75rem;\n}\n\n.comparison-insight-summary__grid article {\n  display: grid;\n  min-width: 0;\n  gap: .2rem;\n  padding: 1rem;\n  border: 1px solid var(--comparison-line);\n  border-radius: 1rem;\n  background: var(--comparison-surface-soft);\n}\n\n.comparison-insight-summary__icon {\n  display: grid;\n  width: 2rem;\n  height: 2rem;\n  margin-bottom: .4rem;\n  place-items: center;\n  border-radius: .65rem;\n  color: var(--comparison-accent);\n  background: color-mix(in srgb, var(--comparison-accent) 13%, transparent);\n  font-weight: 900;\n}\n\n.comparison-insight-summary__grid strong {\n  color: var(--comparison-text);\n  font-size: clamp(1.35rem, 3vw, 2rem);\n  line-height: 1;\n}\n\n.comparison-insight-summary__grid article > span:last-child {\n  color: var(--comparison-muted);\n  font-size: .78rem;\n  line-height: 1.35;\n}\n\n.comparison-insight-summary__details {\n  display: grid;\n  grid-template-columns: minmax(0, 1.35fr) minmax(240px, .65fr);\n  gap: 1rem;\n}\n\n.comparison-insight-summary__details > div,\n.comparison-insight-summary__details > aside {\n  padding: 1.15rem;\n  border: 1px solid var(--comparison-line);\n  border-radius: 1rem;\n}\n\n.comparison-insight-summary__details h3 {\n  margin: 0 0 .9rem;\n  color: var(--comparison-text);\n  font-size: 1rem;\n}\n\n.comparison-insight-summary__details ul {\n  display: grid;\n  gap: .75rem;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.comparison-insight-summary__details li {\n  display: grid;\n  gap: .18rem;\n}\n\n.comparison-insight-summary__details li a {\n  color: var(--comparison-text);\n  font-weight: 850;\n  text-decoration-color: color-mix(in srgb, var(--comparison-accent) 45%, transparent);\n  text-underline-offset: 3px;\n}\n\n.comparison-insight-summary__details li span {\n  color: var(--comparison-muted);\n  font-size: .82rem;\n  line-height: 1.45;\n}\n\n.comparison-insight-summary__details aside {\n  align-self: stretch;\n  background:\n    linear-gradient(\n      145deg,\n      color-mix(in srgb, var(--comparison-accent) 12%, var(--comparison-surface)),\n      var(--comparison-surface)\n    );\n}\n\n.comparison-insight-summary__details aside > span {\n  color: var(--comparison-accent);\n  font-size: .72rem;\n  font-weight: 900;\n  letter-spacing: .05em;\n  text-transform: uppercase;\n}\n\n.comparison-insight-summary__details aside > strong {\n  display: block;\n  margin: .45rem 0;\n  color: var(--comparison-text);\n  font-size: 1.15rem;\n}\n\n.comparison-insight-summary__details aside p {\n  margin: 0 0 .75rem;\n  color: var(--comparison-muted);\n  font-size: .84rem;\n  line-height: 1.55;\n}\n\n.comparison-insight-summary__details aside a {\n  color: var(--comparison-accent);\n  font-weight: 850;\n  text-underline-offset: 3px;\n}\n\n.comparison-methodology {\n  grid-template-columns: minmax(230px, .75fr) minmax(0, 1.25fr);\n  align-items: start;\n  background:\n    linear-gradient(\n      135deg,\n      color-mix(in srgb, var(--comparison-accent) 8%, var(--comparison-surface)),\n      var(--comparison-surface) 48%\n    );\n}\n\n.comparison-methodology__content ul {\n  display: grid;\n  gap: .8rem;\n  margin: 1rem 0 0;\n  padding: 0;\n  list-style: none;\n}\n\n.comparison-methodology__content li {\n  position: relative;\n  padding-left: 1.25rem;\n  color: var(--comparison-muted);\n  line-height: 1.55;\n}\n\n.comparison-methodology__content li::before {\n  position: absolute;\n  left: 0;\n  color: var(--comparison-accent);\n  font-weight: 900;\n  content: \"•\";\n}\n\n.comparison-methodology__content strong {\n  color: var(--comparison-text);\n}\n\n.comparison-data-note {\n  margin: .75rem 0 0;\n  padding: .8rem 1rem;\n  border-left: 3px solid var(--comparison-warning);\n  border-radius: .2rem .75rem .75rem .2rem;\n  color: var(--comparison-muted);\n  background: color-mix(in srgb, var(--comparison-warning) 8%, var(--comparison-surface));\n  font-size: .82rem;\n  line-height: 1.5;\n}\n\n.comparison-content {\n  max-width: 78ch;\n  margin-inline: auto;\n}\n\n.comparison-content > :first-child {\n  margin-top: 0;\n}\n\n.comparison-content h2,\n.comparison-content h3 {\n  scroll-margin-top: 7rem;\n  color: var(--comparison-text);\n}\n\n.comparison-content p,\n.comparison-content li {\n  color: var(--comparison-muted);\n  line-height: 1.75;\n}\n\n@media (max-width: 760px) {\n  .comparison-insight-summary,\n  .comparison-methodology {\n    padding: 1rem;\n    border-radius: 1rem;\n  }\n\n  .comparison-insight-summary__grid {\n    grid-template-columns: 1fr;\n  }\n\n  .comparison-insight-summary__grid article {\n    grid-template-columns: auto auto 1fr;\n    align-items: center;\n    gap: .65rem;\n  }\n\n  .comparison-insight-summary__icon {\n    margin: 0;\n  }\n\n  .comparison-insight-summary__grid strong {\n    font-size: 1.35rem;\n  }\n\n  .comparison-insight-summary__details,\n  .comparison-methodology {\n    grid-template-columns: 1fr;\n  }\n}\n"};

function backup(file, relative) {
  const target = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function write(relative, content) {
  const file = path.join(root, relative);
  const normalized = content.replace(/\r\n/g, "\n").replace(/\n?$/, "\n");
  const current = fs.existsSync(file)
    ? fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n")
    : null;

  if (current === normalized) {
    console.log(`[unchanged] ${relative}`);
    return;
  }

  if (dryRun) {
    console.log(`[check] ${current === null ? "anlegen" : "ersetzen"}: ${relative}`);
    return;
  }

  if (current !== null) backup(file, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, normalized, "utf8");
  console.log(`[write] ${relative}`);
}

function patchFile(relative, transforms) {
  const file = path.join(root, relative);

  if (!fs.existsSync(file)) {
    throw new Error(`Datei nicht gefunden: ${relative}`);
  }

  let content = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const original = content;

  for (const transform of transforms) {
    if (content.includes(transform.marker)) continue;

    if (!content.includes(transform.anchor)) {
      throw new Error(`Anker nicht gefunden in ${relative}: ${transform.label}`);
    }

    content = content.replace(transform.anchor, transform.replacement);
  }

  if (content === original) {
    console.log(`[unchanged] ${relative}`);
    return;
  }

  if (dryRun) {
    console.log(`[check] patchen: ${relative}`);
    return;
  }

  backup(file, relative);
  fs.writeFileSync(file, content, "utf8");
  console.log(`[patch] ${relative}`);
}

for (const [relative, content] of Object.entries(newFiles)) {
  write(relative, content);
}

patchFile(
  "packages/affiliate-core/src/components/comparison/ComparisonShell.astro",
  [
    {
      label: "Insight Import",
      marker: 'import ComparisonInsightSummary from "./ComparisonInsightSummary.astro";',
      anchor: 'import ComparisonStickyBar from "./ComparisonStickyBar.astro";',
      replacement:
        'import ComparisonStickyBar from "./ComparisonStickyBar.astro";\n' +
        'import ComparisonInsightSummary from "./ComparisonInsightSummary.astro";\n' +
        'import ComparisonMethodology from "./ComparisonMethodology.astro";'
    },
    {
      label: "SEO CSS Import",
      marker: 'import "./comparison-premium-seo.css";',
      anchor: 'import "./comparison-premium-ux.css";',
      replacement:
        'import "./comparison-premium-ux.css";\n' +
        'import "./comparison-premium-seo.css";'
    },
    {
      label: "Insight Block",
      marker: "<ComparisonInsightSummary",
      anchor: '  <div class="comparison-premium-layout">',
      replacement:
        '  <ComparisonInsightSummary products={model.products} rows={model.rows} />\n\n' +
        '  <div class="comparison-premium-layout">'
    },
    {
      label: "Methodology Block",
      marker: "<ComparisonMethodology",
      anchor: '      <div id="vergleich-fazit">',
      replacement:
        '      <ComparisonMethodology\n' +
        '        productCount={model.products.length}\n' +
        '        criterionCount={model.rows.length}\n' +
        '      />\n\n' +
        '      <div id="vergleich-fazit">'
    }
  ]
);

patchFile(
  "apps/pfotentechnik/src/pages/vergleiche/[comparison].astro",
  [
    {
      label: "ItemList JSON-LD Daten",
      marker: "const comparisonItemListSchema =",
      anchor: "const comparisonNextSteps = buildComparisonNextSteps({",
      replacement:
        'const comparisonItemListSchema = {\n' +
        '  "@context": "https://schema.org",\n' +
        '  "@type": "ItemList",\n' +
        '  name: comparison.title,\n' +
        '  numberOfItems: model.products.length,\n' +
        '  itemListElement: model.products.map((product, index) => ({\n' +
        '    "@type": "ListItem",\n' +
        '    position: index + 1,\n' +
        '    url: new URL(product.href, Astro.site ?? Astro.url).href,\n' +
        '    name: product.title\n' +
        '  }))\n' +
        '};\n\n' +
        'const comparisonNextSteps = buildComparisonNextSteps({'
    },
    {
      label: "ItemList JSON-LD Ausgabe",
      marker: 'set:html={JSON.stringify(comparisonItemListSchema)}',
      anchor: '  <Breadcrumbs items={breadcrumbs} />',
      replacement:
        '  <script\n' +
        '    type="application/ld+json"\n' +
        '    set:html={JSON.stringify(comparisonItemListSchema)}\n' +
        '  />\n\n' +
        '  <Breadcrumbs items={breadcrumbs} />'
    }
  ]
);

console.log("\n--- Ergebnis ---");
if (dryRun) {
  console.log("Vorprüfung erfolgreich. Es wurde nichts verändert.");
} else {
  console.log("Comparison Premium UX + SEO 3.1.0 wurde installiert.");
  console.log(`Backup: ${backupRoot}`);
  console.log("Jetzt ausführen:");
  console.log("  npm run build:pfotentechnik");
  console.log("  npm run comparison:audit");
}
