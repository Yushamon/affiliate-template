#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const index = args.indexOf("--repo");
const repo = path.resolve(index >= 0 ? args[index + 1] : process.cwd());

const files = {
  layout: path.join(
    repo,
    "apps",
    "pfotentechnik",
    "src",
    "layouts",
    "ProjectLayout.astro"
  ),
  shell: path.join(
    repo,
    "packages",
    "affiliate-core",
    "src",
    "components",
    "comparison",
    "ComparisonShell.astro"
  ),
  productCss: path.join(
    repo,
    "apps",
    "pfotentechnik",
    "src",
    "styles",
    "pfotentechnik-product-mobile-premium.css"
  ),
  comparisonCss: path.join(
    repo,
    "packages",
    "affiliate-core",
    "src",
    "components",
    "comparison",
    "comparison-mobile-price-fix-4.0.1.css"
  )
};

const [layout, shell, productCss, comparisonCss] = await Promise.all(
  Object.values(files).map((file) => fs.readFile(file, "utf8"))
);

const checks = [
  [
    "Produktlayout importiert",
    layout.includes(
      'import "../styles/pfotentechnik-product-mobile-premium.css";'
    )
  ],
  [
    "Vergleichsfix zuletzt importiert",
    shell.includes(
      'import "./comparison-mobile-price-fix-4.0.1.css";'
    )
  ],
  [
    "375/414 Canvas",
    productCss.includes("main.container:has([data-product-page])") &&
      productCss.includes("max(12px")
  ],
  [
    "Produktgalerie mobil",
    productCss.includes(".px2-gallery__stage img") &&
      productCss.includes("calc(100vw - 32px)")
  ],
  [
    "Preisblock volle Gridbreite",
    comparisonCss.includes("grid-column: 1 / -1 !important")
  ],
  [
    "Eurobetrag ohne Zeichenumbruch",
    comparisonCss.includes("white-space: nowrap") &&
      comparisonCss.includes("overflow-wrap: normal")
  ],
  [
    "Horizontale Schreibrichtung erzwungen",
    comparisonCss.includes("writing-mode: horizontal-tb")
  ],
  [
    "CTA volle Breite",
    comparisonCss.includes(".recommendation-card__actions") &&
      comparisonCss.includes("grid-column: 1 / -1")
  ],
  [
    "Nur Mobile",
    comparisonCss.includes("@media (max-width: 760px)")
  ],
  [
    "Keine Preislogik verändert",
    !comparisonCss.includes("amountLabel =") &&
      !comparisonCss.includes("getPriceDisplay")
  ],
  [
    "Keine Inhalte ausgeblendet",
    !/\bdisplay\s*:\s*none\b/.test(comparisonCss)
  ],
  [
    "Keine fixierte Preis-UI",
    !/\bposition\s*:\s*fixed\b/.test(comparisonCss)
  ]
];

const failed = checks.filter(([, ok]) => !ok);

for (const [label, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
}

if (failed.length) {
  throw new Error(
    `${failed.length} Mobile-UI-/Preis-Auditprüfungen fehlgeschlagen.`
  );
}

console.log("\nMobile-UI- und Preis-Audit erfolgreich: 12/12 Prüfungen.");
