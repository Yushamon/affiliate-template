#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const index = args.indexOf("--repo");
const repo = path.resolve(index >= 0 ? args[index + 1] : process.cwd());
const layoutFile = path.join(repo, "apps/pfotentechnik/src/layouts/ProjectLayout.astro");
const homeFile = path.join(repo, "packages/affiliate-core/src/components/home/HomeSection.astro");
const cssFile = path.join(repo, "apps/pfotentechnik/src/styles/pfotentechnik-content-ui-polish.css");
const comparisonDir = path.join(repo, "apps/pfotentechnik/src/content/comparisons");

const [layout, home, css] = await Promise.all([
  fs.readFile(layoutFile, "utf8"),
  fs.readFile(homeFile, "utf8"),
  fs.readFile(cssFile, "utf8")
]);
const entries = await fs.readdir(comparisonDir, { withFileTypes: true });
const comparisonFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md")).map((entry) => path.join(comparisonDir, entry.name));
const comparisonSources = await Promise.all(comparisonFiles.map((file) => fs.readFile(file, "utf8")));

const checks = [
  ["Content-Polish importiert", layout.includes('import "../styles/pfotentechnik-content-ui-polish.css";')],
  ["Startseite verwendet Ringnote", home.includes('variant="ring-compact"')],
  ["Alte Homepage-Balkennote entfernt", !(home.includes('value={item.rating}') && home.includes('variant="compact"'))],
  ["Homepage-Ring angepasst", css.includes(".home3-product-card .pt-score--ring-compact") && css.includes("width: 72px")],
  ["FAQ ohne große geschlossene Innenfläche", css.includes(".faq-section .ui-accordion-item") && css.includes("padding: 0 !important")],
  ["FAQ bleibt gut bedienbar", css.includes("--pt-faq-summary-height: 58px") && css.includes("grid-template-columns: minmax(0, 1fr) 22px")],
  ["FAQ-Antwort erscheint erst geöffnet", css.includes(".ui-accordion-item[open] summary")],
  ["Produkt-FAQ kompakter", css.includes("[data-product-page] .details__faq")],
  ["Dark Mode berücksichtigt", css.includes('html[data-theme="dark"] .faq-section')],
  ["Sticky Bar überdeckt Abschluss nicht", css.includes("padding-bottom: calc(9.5rem + env(safe-area-inset-bottom))")],
  ["Doppelte Empfehlungskapitel entfernt", comparisonSources.every((source) => !/^##\s+(?:Unsere\s+)?Empfehlungen\s+nach\s+Aufgabe\s*$/gmi.test(source))],
  ["Schnellentscheidung bleibt erhalten", comparisonSources.some((source) => /^##\s+Schnellentscheidung\b/gmi.test(source))],
  ["FAQ-Inhalte nicht ausgeblendet", !/\.ui-accordion-item\s+p\s*\{[^}]*display\s*:\s*none/s.test(css)],
  ["Reduced Motion berücksichtigt", css.includes("prefers-reduced-motion")]
];

const failed = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) console.log(`${ok ? "✓" : "✗"} ${label}`);
if (failed.length) throw new Error(`${failed.length} Content-/UI-Prüfungen fehlgeschlagen.`);
console.log("\nContent- und UI-Audit erfolgreich: 14/14 Prüfungen.");
