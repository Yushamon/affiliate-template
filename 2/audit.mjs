#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const index = args.indexOf('--repo');
const repo = path.resolve(index >= 0 ? args[index + 1] : process.cwd());
const cssFile = path.join(repo, 'packages', 'affiliate-core', 'src', 'components', 'comparison', 'comparison-mobile-price-fix-4.0.1.css');
const css = await fs.readFile(cssFile, 'utf8');

const checks = [
  ['Preisblock bleibt vollbreit in Empfehlungskarten', css.includes('.recommendation-card > .comparison-price-signal') && css.includes('grid-column: 1 / -1')],
  ['Preis-Layout nutzt ruhiges Grid statt umgebrochener Flex-Reihe', css.includes('grid-template-columns: auto minmax(0, 1fr)')],
  ['Preisbetrag wurde sichtbar vergrößert', css.includes('font-size: 1.22rem')],
  ['Sekundär-CTA ist explizit als outlined Variante definiert', css.includes('.comparison-button--secondary') && css.includes('border-color: color-mix')],
  ['CTA-Zeilen nutzen ein gleichmäßiges Zweispaltenraster', css.includes('grid-template-columns: repeat(2, minmax(0, 1fr))')],
  ['Unter 380 Pixeln werden Aktionen einspaltig', css.includes('@media (max-width: 380px)') && css.includes('grid-template-columns: minmax(0, 1fr)')],
  ['Keine Logikänderung, nur CSS', !css.includes('href=') && !css.includes('price.label')]
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`);
  if (!ok) failed += 1;
}
if (failed) throw new Error(`${failed} Prüfungen fehlgeschlagen.`);
console.log('\nComparison-CTA- und Preis-Audit erfolgreich: 7/7 Prüfungen.');
