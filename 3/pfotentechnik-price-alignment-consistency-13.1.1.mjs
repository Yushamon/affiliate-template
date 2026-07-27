#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-price-alignment-consistency-13.1.1";
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check") || args.has("--dry-run");
const NO_BUILD = args.has("--no-build");

const log = (message) => console.log(`[${NAME}] ${message}`);
const fail = (message) => {
  console.error(`[${NAME}] FEHLER: ${message}`);
  process.exit(1);
};

function findRoot(start) {
  let current = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json")) &&
      fs.existsSync(path.join(current, "packages", "affiliate-core"))
    ) return current;

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

const root =
  findRoot(process.cwd()) ||
  findRoot(path.dirname(fileURLToPath(import.meta.url)));

if (!root) fail("Repository-Root nicht gefunden.");

const files = {
  test: path.join(
    root,
    "apps/pfotentechnik/test/price-alignment-consistency-13.1.0.test.mjs"
  ),
  signal: path.join(
    root,
    "packages/affiliate-core/src/components/comparison/ComparisonPriceSignal.astro"
  ),
  productBox: path.join(
    root,
    "apps/pfotentechnik/src/components/product-experience-2/PriceBox2.astro"
  ),
  engine: path.join(
    root,
    "apps/pfotentechnik/src/domain/price/engine.ts"
  ),
  comparisonPrice: path.join(
    root,
    "packages/affiliate-core/src/comparison/price.ts"
  ),
  mobileCards: path.join(
    root,
    "packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro"
  ),
  recommendationGrid: path.join(
    root,
    "packages/affiliate-core/src/components/comparison/RecommendationGrid.astro"
  ),
  table: path.join(
    root,
    "packages/affiliate-core/src/components/comparison/ComparisonTable.astro"
  ),
  report: path.join(
    root,
    "apps/pfotentechnik/reports/design-system/price-alignment-consistency-13.1.1.md"
  )
};

for (const [key, file] of Object.entries(files)) {
  if (key === "report" || key === "test") continue;
  if (!fs.existsSync(file)) fail(`Pflichtdatei fehlt: ${path.relative(root, file)}`);
}

const read = (file) => fs.readFileSync(file, "utf8");
const relative = (file) => path.relative(root, file).split(path.sep).join("/");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, ".patch-backups", `${NAME}-${timestamp}`);

function write(file, content) {
  const before = fs.existsSync(file) ? read(file) : null;
  if (before === content) return false;

  if (!CHECK_ONLY) {
    if (before !== null) {
      const backup = path.join(backupRoot, relative(file));
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      fs.copyFileSync(file, backup);
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return true;
}

function assertSource(condition, message) {
  if (!condition) fail(message);
}

/*
 * 13.1.0 hat die fachlichen Änderungen korrekt geschrieben.
 * Fehlgeschlagen sind ausschließlich drei Regex im generierten Test:
 * In einem normalen Template-String wurde "\s" zu "s".
 */
const correctedTest = String.raw`import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const read = (relative) => fs.readFile(path.join(repoRoot, relative), "utf8");

test("price metadata is hidden and amounts are right aligned", async () => {
  const [signal, productBox, table] = await Promise.all([
    read("packages/affiliate-core/src/components/comparison/ComparisonPriceSignal.astro"),
    read("apps/pfotentechnik/src/components/product-experience-2/PriceBox2.astro"),
    read("packages/affiliate-core/src/components/comparison/ComparisonTable.astro")
  ]);

  for (const source of [signal, productBox, table]) {
    assert.doesNotMatch(source, /Zuletzt geprüft|Preisstand|letzter Prüfstand/i);
  }

  assert.match(signal, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto/);
  assert.match(signal, /text-align:\s*right/);
  assert.match(productBox, /justify-content:\s*flex-end/);
  assert.match(productBox, /text-align:\s*right/);
});

test("product and comparison price formatters preserve the same cents", async () => {
  const [engine, comparisonPrice] = await Promise.all([
    read("apps/pfotentechnik/src/domain/price/engine.ts"),
    read("packages/affiliate-core/src/comparison/price.ts")
  ]);

  const centsRule =
    /maximumFractionDigits:\s*Number\.isInteger\(amount\)\s*\?\s*0\s*:\s*2/;

  assert.match(engine, centsRule);
  assert.match(comparisonPrice, centsRule);
});

test("list prices sit directly above their CTAs", async () => {
  const [mobileCards, recommendationGrid] = await Promise.all([
    read("packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro"),
    read("packages/affiliate-core/src/components/comparison/RecommendationGrid.astro")
  ]);

  const valuesEnd = mobileCards.indexOf("</dl>");
  const price = mobileCards.indexOf("<ComparisonPriceSignal price={product.price} />");
  const actions = mobileCards.indexOf(
    '<div class="comparison-mobile-product__actions">'
  );

  assert.ok(valuesEnd !== -1 && price > valuesEnd && actions > price);
  assert.match(recommendationGrid, /flex-direction:\s*column\s*!important/);
  assert.match(recommendationGrid, /margin-top:\s*auto\s*!important/);
});
`;

const report = `# Price Alignment & Consistency 13.1.1

Hotfix für den Testgenerator aus 13.1.0.

- Die fachlichen Preisänderungen aus 13.1.0 bleiben unverändert.
- Drei fehlerhaft escaped Regex-Ausdrücke wurden korrigiert.
- Datumsmetadaten bleiben aus der öffentlichen Preis-UI entfernt.
- Produkt- und Vergleichspreise behalten dieselbe Cent-Logik.
- Listenpreise bleiben direkt oberhalb der CTA-Zeile.
`;

const signal = read(files.signal);
const productBox = read(files.productBox);
const engine = read(files.engine);
const comparisonPrice = read(files.comparisonPrice);
const mobileCards = read(files.mobileCards);
const recommendationGrid = read(files.recommendationGrid);
const table = read(files.table);

assertSource(
  /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto/.test(signal) &&
    /text-align:\s*right/.test(signal),
  "13.1.0-Preisausrichtung fehlt in ComparisonPriceSignal.astro."
);
assertSource(
  /justify-content:\s*flex-end/.test(productBox) &&
    /text-align:\s*right/.test(productBox),
  "13.1.0-Preisausrichtung fehlt in PriceBox2.astro."
);
assertSource(
  /maximumFractionDigits:\s*Number\.isInteger\(amount\)\s*\?\s*0\s*:\s*2/.test(engine),
  "Gemeinsame Cent-Logik fehlt im Produkt-Preisformatierer."
);
assertSource(
  /maximumFractionDigits:\s*Number\.isInteger\(amount\)\s*\?\s*0\s*:\s*2/.test(comparisonPrice),
  "Gemeinsame Cent-Logik fehlt im Vergleichs-Preisformatierer."
);
assertSource(
  mobileCards.indexOf("<ComparisonPriceSignal price={product.price} />") >
    mobileCards.indexOf("</dl>"),
  "Preis steht in mobilen Vergleichskarten noch vor der Merkmalsliste."
);
assertSource(
  /flex-direction:\s*column\s*!important/.test(recommendationGrid) &&
    /margin-top:\s*auto\s*!important/.test(recommendationGrid),
  "Preis und CTA sind in Empfehlungskarten nicht am Kartenende gekoppelt."
);
assertSource(
  !/Zuletzt geprüft|Preisstand|letzter Prüfstand/i.test(
    [signal, productBox, table].join("\n")
  ),
  "Öffentliche Preis-Datumsmetadaten sind noch vorhanden."
);

const changed = [];
if (write(files.test, correctedTest)) changed.push(relative(files.test));
if (write(files.report, report)) changed.push(relative(files.report));

if (CHECK_ONLY) {
  log(changed.length ? `Würde ${changed.length} Datei(en) ändern:` : "Keine Änderungen erforderlich.");
  for (const file of changed) console.log(`- ${file}`);
  process.exit(0);
}

if (changed.length) {
  log(`${changed.length} Datei(en) aktualisiert:`);
  for (const file of changed) console.log(`- ${file}`);
  if (fs.existsSync(backupRoot)) log(`Backups: ${relative(backupRoot)}`);
} else {
  log("Test-Hotfix ist bereits installiert.");
}

function run(command, commandArgs) {
  const executable =
    process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const result = spawnSync(executable, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false
  });
  if (result.error) fail(`${command} konnte nicht gestartet werden: ${result.error.message}`);
  return result.status === 0;
}

log("Führe Preis-UI-Tests aus …");
if (
  !run(process.execPath, [
    "--test",
    "apps/pfotentechnik/test/comparison-score-price-3.3.4.test.mjs",
    "apps/pfotentechnik/test/price-alignment-consistency-13.1.0.test.mjs"
  ])
) {
  fail("Preis-UI-Tests fehlgeschlagen.");
}

if (!NO_BUILD) {
  log("Führe PfotenTechnik-Build aus …");
  if (!run("npm", ["run", "build:pfotentechnik"])) {
    fail("PfotenTechnik-Build fehlgeschlagen.");
  }
}

log("Abgeschlossen.");
