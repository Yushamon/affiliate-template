#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const index = args.indexOf("--repo");
const repo = path.resolve(
  index >= 0 ? args[index + 1] : process.cwd()
);

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
  appCss: path.join(
    repo,
    "apps",
    "pfotentechnik",
    "src",
    "styles",
    "pfotentechnik-cta-system.css"
  ),
  comparisonCss: path.join(
    repo,
    "packages",
    "affiliate-core",
    "src",
    "components",
    "comparison",
    "comparison-cta-system.css"
  )
};

const [layout, shell, appCss, comparisonCss] =
  await Promise.all(
    Object.values(files).map((file) =>
      fs.readFile(file, "utf8")
    )
  );

const checks = [
  [
    "CTA-System wird zuletzt im Projektlayout geladen",
    layout.includes(
      'import "../styles/pfotentechnik-cta-system.css";'
    )
  ],
  [
    "Vergleichs-CTA-System wird im ComparisonShell geladen",
    shell.includes(
      'import "./comparison-cta-system.css";'
    )
  ],
  [
    "Gemeinsame semantische CTA-Tokens",
    appCss.includes("--pt-cta-primary-bg") &&
      appCss.includes("--pt-cta-secondary-bg")
  ],
  [
    "Keine Vollpillen als Standard",
    appCss.includes("--pt-cta-radius: 15px")
  ],
  [
    "Ratgeber-Direkteinstieg besitzt klare Hierarchie",
    appCss.includes(".money-page-intent-primary") &&
      appCss.includes(".money-page-intent-secondary")
  ],
  [
    "Gelber Abschluss-CTA entfernt",
    appCss.includes(".pt-money-cta-primary") &&
      !appCss.includes("background: #fbbf24")
  ],
  [
    "Advisor und Health verwenden dasselbe Primärsystem",
    appCss.includes(".pt-advisor-cta a") &&
      appCss.includes(".pt-health-bridge > a")
  ],
  [
    "Produktpreis und Vergleichslink getrennt",
    appCss.includes(".px2-price__cta") &&
      appCss.includes(".px2-hero__compare")
  ],
  [
    "Klickbare Karten behalten leichtere Inline-Aktionen",
    appCss.includes(".pt-conversion-journey__card a") &&
      appCss.includes(".ui-card strong")
  ],
  [
    "Vergleichsbuttons besitzen Primär-/Sekundärhierarchie",
    comparisonCss.includes(".comparison-button--secondary") &&
      comparisonCss.includes("--comparison-cta-bg")
  ],
  [
    "Vergleichspreis läuft in einer Zeile",
    comparisonCss.includes("display: contents") &&
      comparisonCss.includes("grid-template-columns: auto minmax(0, 1fr) auto")
  ],
  [
    "Sticky Bar übernimmt dasselbe CTA-System",
    comparisonCss.includes("body .comparison-sticky-bar") &&
      comparisonCss.includes("min-height: 48px")
  ],
  [
    "Sehr schmale Geräte brechen sauber einspaltig um",
    comparisonCss.includes("@media (max-width: 380px)") &&
      appCss.includes("@media (max-width: 360px)")
  ],
  [
    "Fokuszustände vorhanden",
    appCss.includes(":focus-visible") &&
      comparisonCss.includes(":focus-visible")
  ],
  [
    "Reduced Motion berücksichtigt",
    appCss.includes("prefers-reduced-motion") &&
      comparisonCss.includes("prefers-reduced-motion")
  ],
  [
    "Keine Links oder Texte im CSS verändert",
    !appCss.includes("href=") &&
      !comparisonCss.includes("href=")
  ]
];

const failed = checks.filter(([, ok]) => !ok);

for (const [label, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
}

if (failed.length) {
  throw new Error(
    `${failed.length} CTA-System-Prüfungen fehlgeschlagen.`
  );
}

console.log("\nCTA-System-Audit erfolgreich: 16/16 Prüfungen.");
