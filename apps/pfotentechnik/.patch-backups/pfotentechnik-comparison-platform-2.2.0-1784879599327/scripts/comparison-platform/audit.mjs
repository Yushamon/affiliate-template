import fs from "node:fs";
import path from "node:path";
import {
  COMPARISON_DIR, PRODUCT_DIR, MANUFACTURER_DIR, REPORT_DIR,
  loadEntries, slugOf, issue, ensureReportDir, collectMarkdownLinks
} from "./core.mjs";

export function runAudit(options = {}) {
  const comparisons = loadEntries(COMPARISON_DIR);
  const products = loadEntries(PRODUCT_DIR);
  const manufacturers = loadEntries(MANUFACTURER_DIR);
  const productBySlug = new Map(products.map((e) => [slugOf(e), e]));
  const manufacturerBySlug = new Map(manufacturers.map((e) => [slugOf(e), e]));
  const issues = [];
  const usedProducts = new Set();

  for (const c of comparisons) {
    const d = c.data;
    const items = Array.isArray(d.items) ? d.items : [];
    const criteria = Array.isArray(d.criteria) ? d.criteria : [];
    const criterionKeys = new Set(criteria.map((x) => x?.key).filter(Boolean));

    if (!d.title) issues.push(issue("error", "COMPARISON_TITLE_MISSING", c, "title fehlt."));
    if (!d.comparisonType) issues.push(issue("error", "COMPARISON_TYPE_MISSING", c, "comparisonType fehlt."));
    if (!d.group) issues.push(issue("error", "COMPARISON_GROUP_MISSING", c, "group fehlt."));
    if (items.length < 2) issues.push(issue("error", "COMPARISON_ITEMS_TOO_FEW", c, "Mindestens zwei items sind erforderlich.", { count: items.length }));
    if (!d.recommendation || typeof d.recommendation !== "object") issues.push(issue("error", "RECOMMENDATION_MISSING", c, "recommendation fehlt."));
    if (!d.tableTitle) issues.push(issue("warning", "TABLE_TITLE_MISSING", c, "tableTitle fehlt."));
    if (!d.cardsTitle) issues.push(issue("warning", "CARDS_TITLE_MISSING", c, "cardsTitle fehlt."));
    if (!d.heroImage) issues.push(issue("warning", "HERO_IMAGE_MISSING", c, "heroImage fehlt."));
    if (!Array.isArray(d.faq) || d.faq.length < 3) issues.push(issue("warning", "FAQ_THIN", c, "Weniger als drei FAQ-Einträge."));
    if (criteria.length < 3) issues.push(issue("warning", "CRITERIA_THIN", c, "Weniger als drei Vergleichskriterien.", { count: criteria.length }));

    const seen = new Set();
    for (const item of items) {
      const slug = item?.slug;
      if (!slug) {
        issues.push(issue("error", "ITEM_SLUG_MISSING", c, "Ein item besitzt keinen slug."));
        continue;
      }
      if (seen.has(slug)) issues.push(issue("error", "ITEM_DUPLICATE", c, "Produkt " + slug + " ist doppelt enthalten.", { itemSlug: slug }));
      seen.add(slug);

      if (item.type === "product") {
        usedProducts.add(slug);
        const product = productBySlug.get(slug);
        if (!product) {
          issues.push(issue("error", "PRODUCT_REFERENCE_BROKEN", c, "Produkt " + slug + " existiert nicht.", { itemSlug: slug }));
        } else {
          const status = product.data.productStatus;
          if (status === "legacy" || status === "discontinued") issues.push(issue("warning", "PRODUCT_INACTIVE", c, slug + " hat Status " + status + ".", { itemSlug: slug }));
          const manufacturerSlug = product.data.manufacturer?.slug;
          if (!manufacturerSlug) issues.push(issue("error", "PRODUCT_MANUFACTURER_MISSING", product, "manufacturer.slug fehlt."));
          else if (!manufacturerBySlug.has(manufacturerSlug)) issues.push(issue("error", "MANUFACTURER_REFERENCE_BROKEN", product, "Hersteller " + manufacturerSlug + " existiert nicht.", { manufacturerSlug }));
          if (!product.data.images?.hero) issues.push(issue("error", "PRODUCT_HERO_MISSING", product, "images.hero fehlt."));
          if (!product.data.comparisonData) issues.push(issue("warning", "COMPARISON_DATA_MISSING", product, "comparisonData fehlt."));
        }
      }

      const values = item?.values && typeof item.values === "object" ? item.values : {};
      for (const key of Object.keys(values)) {
        if (criterionKeys.size && !criterionKeys.has(key)) issues.push(issue("warning", "UNKNOWN_VALUE_KEY", c, "values." + key + " besitzt kein passendes criterion.", { itemSlug: slug, criterionKey: key }));
      }
      for (const key of criterionKeys) {
        if (!(key in values)) issues.push(issue("warning", "VALUE_MISSING", c, slug + ": Wert für " + key + " fehlt.", { itemSlug: slug, criterionKey: key }));
      }
    }

    const winner = d.recommendation?.winnerSlug;
    const alternative = d.recommendation?.alternativeSlug;
    if (winner && !seen.has(winner)) issues.push(issue("error", "WINNER_NOT_IN_ITEMS", c, "winnerSlug " + winner + " ist nicht in items."));
    if (alternative && !seen.has(alternative)) issues.push(issue("error", "ALTERNATIVE_NOT_IN_ITEMS", c, "alternativeSlug " + alternative + " ist nicht in items."));
    if (winner && alternative && winner === alternative) issues.push(issue("error", "RECOMMENDATION_DUPLICATE", c, "winnerSlug und alternativeSlug sind identisch."));

    for (const link of collectMarkdownLinks(c.body)) {
      const pathOnly = link.split(/[?#]/)[0];
      if (pathOnly.startsWith("/produkt/")) {
        const slug = pathOnly.replace(/^\/produkt\//, "").replace(/\/$/, "");
        if (slug && !productBySlug.has(slug)) issues.push(issue("warning", "BODY_PRODUCT_LINK_BROKEN", c, "Markdown-Link auf unbekanntes Produkt: " + link));
      }
    }
  }

  for (const p of products) {
    const slug = slugOf(p);
    if (p.data.productStatus === "active" && !usedProducts.has(slug)) issues.push(issue("warning", "PRODUCT_NOT_COVERED", p, "Aktives Produkt kommt in keiner Vergleichsseite vor."));
    const manufacturerSlug = p.data.manufacturer?.slug;
    if (manufacturerSlug && !manufacturerBySlug.has(manufacturerSlug)) issues.push(issue("error", "MANUFACTURER_REFERENCE_BROKEN", p, "Hersteller " + manufacturerSlug + " existiert nicht."));
  }

  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");
  const coverage = products.length ? Math.round((usedProducts.size / products.length) * 1000) / 10 : 100;
  const errorPenalty = Math.min(55, errors.length * 2.5);\n  const warningPenalty = Math.min(35, warnings.length * 0.08);\n  const coveragePenalty = Math.max(0, (100 - coverage) * 0.1);\n  const score = Math.max(0, Math.round(100 - errorPenalty - warningPenalty - coveragePenalty));
  const report = {
    generatedAt: new Date().toISOString(),
    version: "2.1.0",
    summary: {
      comparisons: comparisons.length,
      products: products.length,
      manufacturers: manufacturers.length,
      usedProducts: usedProducts.size,
      productCoveragePercent: coverage,
      errors: errors.length,
      warnings: warnings.length,
      qualityScore: score
    },
    comparisons: comparisons.map((e) => ({ slug: slugOf(e), file: e.rel })),
    issues
  };

  if (options.write !== false) {
    ensureReportDir();
    fs.writeFileSync(path.join(REPORT_DIR, "comparison-audit.json"), JSON.stringify(report, null, 2) + "\n");
    const lines = [
      "# Comparison Platform Report", "",
      "Erstellt: " + report.generatedAt, "",
      "- Vergleiche: " + report.summary.comparisons,
      "- Produkte: " + report.summary.products,
      "- Hersteller: " + report.summary.manufacturers,
      "- Produktabdeckung: " + report.summary.productCoveragePercent + " %",
      "- Qualitätsscore: " + report.summary.qualityScore + "/100",
      "- Fehler: " + errors.length,
      "- Warnungen: " + warnings.length, "",
      "## Fehler", "",
      ...(errors.length ? errors.map((x) => "- **" + x.code + "** – `" + x.file + "`: " + x.message) : ["Keine Fehler."]),
      "", "## Warnungen", "",
      ...(warnings.length ? warnings.map((x) => "- **" + x.code + "** – `" + x.file + "`: " + x.message) : ["Keine Warnungen."]),
      ""
    ];
    fs.writeFileSync(path.join(REPORT_DIR, "comparison-report.md"), lines.join("\n"));
  }
  return report;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))) {
  const strict = process.argv.includes("--strict");
  const report = runAudit();
  const s = report.summary;
  console.log("Comparison Platform 2.1.0");
  console.log("Vergleiche: " + s.comparisons + " | Produkte: " + s.products + " | Abdeckung: " + s.productCoveragePercent + "%");
  console.log("Score: " + s.qualityScore + "/100 | Fehler: " + s.errors + " | Warnungen: " + s.warnings);
  if (process.env.GITHUB_ACTIONS) {
    for (const item of report.issues) {
      const prefix = item.level === "error" ? "::error" : "::warning";
      console.log(prefix + " file=" + item.file + "::" + item.code + ": " + item.message);
    }
  }
  if (strict && (s.errors || s.warnings)) process.exitCode = 1;
}
