import fs from "node:fs";
import path from "node:path";
import {
  COMPARISON_DIR,
  PRODUCT_DIR,
  MANUFACTURER_DIR,
  REPORT_DIR,
  loadEntries,
  slugOf,
  issue,
  ensureReportDir,
  collectMarkdownLinks
} from "./core.mjs";

const CATEGORY_WEIGHTS = {
  integrity: 4,
  structure: 2,
  content: 0.4,
  coverage: 0.2,
  metadata: 0.15
};

const ERROR_CODES = new Set([
  "COMPARISON_TITLE_MISSING",
  "COMPARISON_TYPE_MISSING",
  "COMPARISON_GROUP_MISSING",
  "COMPARISON_ITEMS_TOO_FEW",
  "RECOMMENDATION_MISSING",
  "ITEM_SLUG_MISSING",
  "ITEM_DUPLICATE",
  "PRODUCT_REFERENCE_BROKEN",
  "PRODUCT_MANUFACTURER_MISSING",
  "MANUFACTURER_REFERENCE_BROKEN",
  "PRODUCT_HERO_MISSING",
  "WINNER_NOT_IN_ITEMS",
  "ALTERNATIVE_NOT_IN_ITEMS",
  "RECOMMENDATION_DUPLICATE"
]);

function categoryFor(code) {
  if ([
    "PRODUCT_REFERENCE_BROKEN",
    "MANUFACTURER_REFERENCE_BROKEN",
    "WINNER_NOT_IN_ITEMS",
    "ALTERNATIVE_NOT_IN_ITEMS",
    "ITEM_DUPLICATE",
    "RECOMMENDATION_DUPLICATE",
    "PRODUCT_HERO_MISSING",
    "PRODUCT_MANUFACTURER_MISSING"
  ].includes(code)) return "integrity";

  if ([
    "COMPARISON_TITLE_MISSING",
    "COMPARISON_TYPE_MISSING",
    "COMPARISON_GROUP_MISSING",
    "COMPARISON_ITEMS_TOO_FEW",
    "RECOMMENDATION_MISSING",
    "ITEM_SLUG_MISSING"
  ].includes(code)) return "structure";

  if ([
    "TABLE_TITLE_MISSING",
    "CARDS_TITLE_MISSING",
    "HERO_IMAGE_MISSING",
    "FAQ_THIN",
    "CRITERIA_THIN",
    "UNKNOWN_VALUE_KEY",
    "VALUE_MISSING",
    "BODY_PRODUCT_LINK_BROKEN"
  ].includes(code)) return "content";

  if (code === "PRODUCT_NOT_COVERED") return "coverage";
  if (code === "COMPARISON_DATA_MISSING" || code === "PRODUCT_INACTIVE") return "metadata";
  return "content";
}

function severityFor(code) {
  return ERROR_CODES.has(code) ? "error" : "warning";
}

function addIssue(issues, code, entry, message, details = {}) {
  const level = severityFor(code);
  issues.push({
    ...issue(level, code, entry, message, details),
    category: categoryFor(code)
  });
}

function uniqueIssues(issues) {
  const seen = new Set();
  return issues.filter((item) => {
    const key = [
      item.level,
      item.code,
      item.file,
      item.itemSlug || "",
      item.criterionKey || "",
      item.message
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scoreReport(issues, coverage) {
  let penalty = 0;

  for (const item of issues) {
    const weight = CATEGORY_WEIGHTS[item.category] ?? 0.4;
    penalty += item.level === "error" ? weight : weight * 0.35;
  }

  if (coverage < 80) penalty += (80 - coverage) * 0.12;

  return Math.max(0, Math.round(100 - Math.min(100, penalty)));
}

function summarizeByCode(issues) {
  const counts = new Map();
  for (const item of issues) counts.set(item.code, (counts.get(item.code) || 0) + 1);
  return [...counts.entries()]
    .map(([code, count]) => ({ code, count, category: categoryFor(code), level: severityFor(code) }))
    .sort((a, b) => {
      if (a.level !== b.level) return a.level === "error" ? -1 : 1;
      return b.count - a.count || a.code.localeCompare(b.code);
    });
}

function summarizeByFile(issues) {
  const counts = new Map();
  for (const item of issues) {
    if (!item.file) continue;
    const current = counts.get(item.file) || { file: item.file, errors: 0, warnings: 0, total: 0 };
    current[item.level === "error" ? "errors" : "warnings"]++;
    current.total++;
    counts.set(item.file, current);
  }
  return [...counts.values()].sort((a, b) => b.errors - a.errors || b.total - a.total || a.file.localeCompare(b.file));
}

function auditComparison(c, context, issues) {
  const { productBySlug, manufacturerBySlug, usedProducts } = context;
  const d = c.data;
  const items = Array.isArray(d.items) ? d.items : [];
  const criteria = Array.isArray(d.criteria) ? d.criteria : [];
  const criterionKeys = new Set(criteria.map((x) => x?.key).filter(Boolean));

  if (!d.title) addIssue(issues, "COMPARISON_TITLE_MISSING", c, "title fehlt.");
  if (!d.comparisonType) addIssue(issues, "COMPARISON_TYPE_MISSING", c, "comparisonType fehlt.");
  if (!d.group) addIssue(issues, "COMPARISON_GROUP_MISSING", c, "group fehlt.");
  if (items.length < 2) addIssue(issues, "COMPARISON_ITEMS_TOO_FEW", c, "Mindestens zwei items sind erforderlich.", { count: items.length });
  if (!d.recommendation || typeof d.recommendation !== "object") addIssue(issues, "RECOMMENDATION_MISSING", c, "recommendation fehlt.");
  if (!d.tableTitle) addIssue(issues, "TABLE_TITLE_MISSING", c, "tableTitle fehlt.");
  if (!d.cardsTitle) addIssue(issues, "CARDS_TITLE_MISSING", c, "cardsTitle fehlt.");
  if (!d.heroImage) addIssue(issues, "HERO_IMAGE_MISSING", c, "heroImage fehlt.");
  if (!Array.isArray(d.faq) || d.faq.length < 3) addIssue(issues, "FAQ_THIN", c, "Weniger als drei FAQ-Einträge.");
  if (criteria.length < 3) addIssue(issues, "CRITERIA_THIN", c, "Weniger als drei Vergleichskriterien.", { count: criteria.length });

  const seen = new Set();

  for (const item of items) {
    const slug = item?.slug;

    if (!slug) {
      addIssue(issues, "ITEM_SLUG_MISSING", c, "Ein item besitzt keinen slug.");
      continue;
    }

    if (seen.has(slug)) addIssue(issues, "ITEM_DUPLICATE", c, "Produkt " + slug + " ist doppelt enthalten.", { itemSlug: slug });
    seen.add(slug);

    if (item.type === "product") {
      usedProducts.add(slug);
      const product = productBySlug.get(slug);

      if (!product) {
        addIssue(issues, "PRODUCT_REFERENCE_BROKEN", c, "Produkt " + slug + " existiert nicht.", { itemSlug: slug });
      } else {
        const status = product.data.productStatus;
        if (status === "legacy" || status === "discontinued") {
          addIssue(issues, "PRODUCT_INACTIVE", c, slug + " hat Status " + status + ".", { itemSlug: slug });
        }

        const manufacturerSlug = product.data.manufacturer?.slug;
        if (!manufacturerSlug) {
          addIssue(issues, "PRODUCT_MANUFACTURER_MISSING", product, "manufacturer.slug fehlt.");
        } else if (!manufacturerBySlug.has(manufacturerSlug)) {
          addIssue(issues, "MANUFACTURER_REFERENCE_BROKEN", product, "Hersteller " + manufacturerSlug + " existiert nicht.", { manufacturerSlug });
        }

        if (!product.data.images?.hero) addIssue(issues, "PRODUCT_HERO_MISSING", product, "images.hero fehlt.");
        if (!product.data.comparisonData) addIssue(issues, "COMPARISON_DATA_MISSING", product, "comparisonData fehlt.");
      }
    }

    const values = item?.values && typeof item.values === "object" ? item.values : {};

    for (const key of Object.keys(values)) {
      if (criterionKeys.size && !criterionKeys.has(key)) {
        addIssue(issues, "UNKNOWN_VALUE_KEY", c, "values." + key + " besitzt kein passendes criterion.", {
          itemSlug: slug,
          criterionKey: key
        });
      }
    }

    for (const key of criterionKeys) {
      if (!(key in values)) {
        addIssue(issues, "VALUE_MISSING", c, slug + ": Wert für " + key + " fehlt.", {
          itemSlug: slug,
          criterionKey: key
        });
      }
    }
  }

  const winner = d.recommendation?.winnerSlug;
  const alternative = d.recommendation?.alternativeSlug;

  if (winner && !seen.has(winner)) addIssue(issues, "WINNER_NOT_IN_ITEMS", c, "winnerSlug " + winner + " ist nicht in items.");
  if (alternative && !seen.has(alternative)) addIssue(issues, "ALTERNATIVE_NOT_IN_ITEMS", c, "alternativeSlug " + alternative + " ist nicht in items.");
  if (winner && alternative && winner === alternative) addIssue(issues, "RECOMMENDATION_DUPLICATE", c, "winnerSlug und alternativeSlug sind identisch.");

  for (const link of collectMarkdownLinks(c.body)) {
    const pathOnly = link.split(/[?#]/)[0];
    if (!pathOnly.startsWith("/produkt/")) continue;
    const slug = pathOnly.replace(/^\/produkt\//, "").replace(/\/$/, "");
    if (slug && !productBySlug.has(slug)) {
      addIssue(issues, "BODY_PRODUCT_LINK_BROKEN", c, "Markdown-Link auf unbekanntes Produkt: " + link);
    }
  }
}

function auditProductCoverage(products, context, issues) {
  const { manufacturerBySlug, usedProducts } = context;

  for (const p of products) {
    const slug = slugOf(p);

    if (p.data.productStatus === "active" && !usedProducts.has(slug)) {
      addIssue(issues, "PRODUCT_NOT_COVERED", p, "Aktives Produkt kommt in keiner Vergleichsseite vor.");
    }

    const manufacturerSlug = p.data.manufacturer?.slug;
    if (manufacturerSlug && !manufacturerBySlug.has(manufacturerSlug)) {
      addIssue(issues, "MANUFACTURER_REFERENCE_BROKEN", p, "Hersteller " + manufacturerSlug + " existiert nicht.");
    }
  }
}

function createMarkdownReport(report) {
  const lines = [
    "# Comparison Platform Report",
    "",
    "Erstellt: " + report.generatedAt,
    "",
    "## Übersicht",
    "",
    "- Vergleiche: " + report.summary.comparisons,
    "- Produkte: " + report.summary.products,
    "- Hersteller: " + report.summary.manufacturers,
    "- verwendete Produkte: " + report.summary.usedProducts,
    "- Produktabdeckung: " + report.summary.productCoveragePercent + " %",
    "- Qualitätsscore: " + report.summary.qualityScore + "/100",
    "- Fehler: " + report.summary.errors,
    "- Warnungen: " + report.summary.warnings,
    "",
    "## Häufigste Befunde",
    ""
  ];

  if (report.byCode.length) {
    for (const item of report.byCode.slice(0, 30)) {
      lines.push("- **" + item.code + "**: " + item.count + " (" + item.level + ", " + item.category + ")");
    }
  } else {
    lines.push("Keine Befunde.");
  }

  lines.push("", "## Dateien mit den meisten Problemen", "");

  if (report.byFile.length) {
    for (const item of report.byFile.slice(0, 30)) {
      lines.push("- `" + item.file + "`: " + item.errors + " Fehler, " + item.warnings + " Warnungen");
    }
  } else {
    lines.push("Keine betroffenen Dateien.");
  }

  lines.push("", "## Fehler", "");
  const errors = report.issues.filter((x) => x.level === "error");
  lines.push(...(errors.length
    ? errors.map((x) => "- **" + x.code + "** – `" + x.file + "`: " + x.message)
    : ["Keine Fehler."]));

  lines.push("", "## Warnungen", "");
  const warnings = report.issues.filter((x) => x.level === "warning");
  lines.push(...(warnings.length
    ? warnings.map((x) => "- **" + x.code + "** – `" + x.file + "`: " + x.message)
    : ["Keine Warnungen."]));

  lines.push("");
  return lines.join("\n");
}

export function runAudit(options = {}) {
  const comparisons = loadEntries(COMPARISON_DIR);
  const products = loadEntries(PRODUCT_DIR);
  const manufacturers = loadEntries(MANUFACTURER_DIR);

  const context = {
    productBySlug: new Map(products.map((entry) => [slugOf(entry), entry])),
    manufacturerBySlug: new Map(manufacturers.map((entry) => [slugOf(entry), entry])),
    usedProducts: new Set()
  };

  const issues = [];

  for (const comparison of comparisons) auditComparison(comparison, context, issues);
  auditProductCoverage(products, context, issues);

  const deduplicatedIssues = uniqueIssues(issues);
  const errors = deduplicatedIssues.filter((item) => item.level === "error");
  const warnings = deduplicatedIssues.filter((item) => item.level === "warning");
  const coverage = products.length
    ? Math.round((context.usedProducts.size / products.length) * 1000) / 10
    : 100;

  const report = {
    generatedAt: new Date().toISOString(),
    version: "2.2.0",
    summary: {
      comparisons: comparisons.length,
      products: products.length,
      manufacturers: manufacturers.length,
      usedProducts: context.usedProducts.size,
      productCoveragePercent: coverage,
      errors: errors.length,
      warnings: warnings.length,
      qualityScore: scoreReport(deduplicatedIssues, coverage)
    },
    byCode: summarizeByCode(deduplicatedIssues),
    byFile: summarizeByFile(deduplicatedIssues),
    comparisons: comparisons.map((entry) => ({ slug: slugOf(entry), file: entry.rel })),
    issues: deduplicatedIssues
  };

  if (options.write !== false) {
    ensureReportDir();
    fs.writeFileSync(
      path.join(REPORT_DIR, "comparison-audit.json"),
      JSON.stringify(report, null, 2) + "\n",
      "utf8"
    );
    fs.writeFileSync(
      path.join(REPORT_DIR, "comparison-report.md"),
      createMarkdownReport(report),
      "utf8"
    );
  }

  return report;
}

function printReport(report) {
  const s = report.summary;
  console.log("Comparison Platform 2.2.0");
  console.log("Vergleiche: " + s.comparisons + " | Produkte: " + s.products + " | Abdeckung: " + s.productCoveragePercent + "%");
  console.log("Score: " + s.qualityScore + "/100 | Fehler: " + s.errors + " | Warnungen: " + s.warnings);

  if (report.byCode.length) {
    console.log("\nHäufigste Befunde:");
    for (const item of report.byCode.slice(0, 10)) {
      console.log("- " + item.code + ": " + item.count);
    }
  }

  if (process.env.GITHUB_ACTIONS) {
    for (const item of report.issues) {
      const prefix = item.level === "error" ? "::error" : "::warning";
      console.log(prefix + " file=" + item.file + "::" + item.code + ": " + item.message);
    }
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))) {
  const strict = process.argv.includes("--strict");
  const report = runAudit();
  printReport(report);

  if (strict && (report.summary.errors || report.summary.warnings)) {
    process.exitCode = 1;
  }
}
