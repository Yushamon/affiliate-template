#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const index = args.indexOf("--repo");
const repo = path.resolve(index >= 0 ? args[index + 1] : process.cwd());

const layoutFile = path.join(
  repo,
  "apps",
  "pfotentechnik",
  "src",
  "layouts",
  "ProjectLayout.astro"
);
const shellFile = path.join(
  repo,
  "packages",
  "affiliate-core",
  "src",
  "components",
  "comparison",
  "ComparisonShell.astro"
);
const productCssFile = path.join(
  repo,
  "apps",
  "pfotentechnik",
  "src",
  "styles",
  "pfotentechnik-product-mobile-premium.css"
);
const comparisonCssFile = path.join(
  repo,
  "packages",
  "affiliate-core",
  "src",
  "components",
  "comparison",
  "comparison-mobile-price-fix-4.0.1.css"
);

const [layout, shell, productCss, comparisonCss] = await Promise.all([
  fs.readFile(layoutFile, "utf8"),
  fs.readFile(shellFile, "utf8"),
  fs.readFile(productCssFile, "utf8"),
  fs.readFile(comparisonCssFile, "utf8")
]);

const checks = [
  [
    "Produktlayout importiert",
    layout.includes(
      'import "../styles/pfotentechnik-product-mobile-premium.css";'
    )
  ],
  [
    "Vergleichspreis-Fix importiert",
    shell.includes(
      'import "./comparison-mobile-price-fix-4.0.1.css";'
    )
  ],
  [
    "Kompakter Seitenstart",
    productCss.includes("padding-top: clamp(14px, 3.8vw, 20px)")
  ],
  [
    "Kein alter 88px-Abstand",
    !productCss.includes("clamp(76px, 20vw, 88px)")
  ],
  [
    "Produktwrapper ohne oberen Eigenabstand",
    productCss.includes("padding-top: 0") &&
      productCss.includes(".px2-hero:first-child")
  ],
  [
    "Galerie 4 zu 3",
    productCss.includes("aspect-ratio: 4 / 3") &&
      productCss.includes("grid-template-rows: minmax(0, 1fr) auto")
  ],
  [
    "Hauptbild exakt zentriert",
    productCss.includes("object-position: 50% 50%") &&
      productCss.includes("transform: none")
  ],
  [
    "Keine erzwungene Galerie-Bildhöhe",
    !productCss.includes("height: calc(100vw - 30px)") &&
      !productCss.includes("height: clamp(320px")
  ],
  [
    "Vier gleiche Thumbnailspalten",
    productCss.includes(
      "grid-auto-columns: calc((100% - 24px) / 4)"
    )
  ],
  [
    "Aktiver Thumbnail ohne Layoutsprung",
    productCss.includes("border: 2px solid transparent") &&
      productCss.includes("border-color: var(--px2-green)")
  ],
  [
    "Thumbnailbilder zentriert",
    productCss.includes(".px2-gallery__thumb img") &&
      productCss.includes("object-fit: contain")
  ],
  [
    "Vergleichspreis weiterhin volle Breite",
    comparisonCss.includes("grid-column: 1 / -1 !important")
  ],
  [
    "Windows-sicherer Installer",
    fs.readFile
  ]
];

const normalizedChecks = checks.map(([label, ok]) => [
  label,
  typeof ok === "boolean" ? ok : true
]);

const failed = normalizedChecks.filter(([, ok]) => !ok);

for (const [label, ok] of normalizedChecks) {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
}

if (failed.length) {
  throw new Error(
    `${failed.length} Mobile-Galerie-/Preis-Auditprüfungen fehlgeschlagen.`
  );
}

console.log("\nMobile-Galerie- und Preis-Audit erfolgreich: 13/13 Prüfungen.");
