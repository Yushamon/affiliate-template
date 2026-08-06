#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const BACKUPS = path.join(ROOT, ".patch-backups", "pfotentechnik-surefeed-connect-25.10.8");
const changed = [];
const current = [];

const files = {
  product: path.join(APP, "src", "content", "products", "surefeed-microchip-pet-feeder-connect.md"),
  schema: path.join(APP, "src", "content", "schema", "product.ts"),
  service: path.join(APP, "src", "lib", "price-intelligence", "service.mjs"),
  policy: path.join(APP, "src", "lib", "product-operations", "policy.mjs"),
  policyTypes: path.join(APP, "src", "lib", "product-operations", "policy.d.ts"),
  research: path.join(APP, "research", "research.json"),
  test: path.join(APP, "test", "surefeed-connect-current-data-25.10.8.test.mjs"),
  report: path.join(APP, "reports", "product-research", "surefeed-connect-current-data-25.10.8.json")
};

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Pflichtdatei fehlt: ${path.relative(ROOT, file)}`);
  return fs.readFileSync(file, "utf8");
}

function backup(file) {
  const relative = path.relative(ROOT, file);
  const target = path.join(BACKUPS, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (!fs.existsSync(target) && fs.existsSync(file)) fs.copyFileSync(file, target);
}

function writeIfChanged(file, next) {
  const previous = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  const relative = path.relative(ROOT, file);
  if (previous === next) {
    current.push(relative);
    return;
  }
  if (previous !== null) backup(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next, "utf8");
  changed.push(relative);
}

function splitFrontmatter(source, file) {
  const match = source.replace(/^\uFEFF/, "").match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${path.relative(ROOT, file)}: YAML-Frontmatter fehlt.`);
  return { yaml: match[1], body: source.slice(match[0].length) };
}

function topLevelRange(lines, key) {
  const start = lines.findIndex((line) => line.startsWith(`${key}:`));
  if (start < 0) return null;
  let end = start + 1;
  while (end < lines.length && (/^\s/.test(lines[end]) || lines[end] === "")) end += 1;
  return { start, end };
}

function replaceTopLevelBlock(frontmatter, key, block, anchors = []) {
  const lines = frontmatter.split(/\r?\n/);
  const range = topLevelRange(lines, key);
  if (range) lines.splice(range.start, range.end - range.start, ...block);
  else {
    let at = lines.findIndex((line) => anchors.includes(line.trim()));
    if (at < 0) at = lines.length;
    lines.splice(at, 0, ...block);
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

function setScalar(frontmatter, key, rendered, anchors = []) {
  const lines = frontmatter.split(/\r?\n/);
  const index = lines.findIndex((line) => line.startsWith(`${key}:`));
  if (index >= 0) lines[index] = `${key}: ${rendered}`;
  else {
    let at = lines.findIndex((line) => anchors.includes(line.trim()));
    if (at < 0) at = lines.length;
    lines.splice(at, 0, `${key}: ${rendered}`);
  }
  return lines.join("\n");
}

function updateProduct() {
  const source = read(files.product);
  const parts = splitFrontmatter(source, files.product);
  yaml.load(parts.yaml);
  let frontmatter = replaceTopLevelBlock(parts.yaml, "price", [
    "price:",
    "  currency: \"EUR\"",
    "  status: \"unknown\"",
    "  source:",
    "    id: \"sure-petcare-de\"",
    "    label: \"Sure Petcare Deutschland\"",
    "    type: \"editorial\""
  ], ["affiliate:", "rating:", "score:"]);
  frontmatter = setScalar(frontmatter, "priceAutomation", "\"editorial\"", ["affiliate:"]);
  const operations = {
    priceState: "\"unknown\"",
    priceUpdated: "\"2026-08-06T12:00:00.000Z\"",
    priceAvailable: "false",
    affiliateAvailable: "true",
    availability: "\"unknown\"",
    availabilityReason: "\"Einzelgerät, Hub und Bundle werden getrennt angeboten. Die deutsche Herstellerseite zeigt Preise, zugleich aber Nicht-vorrätig-Signale; Händlerbestand kann abweichen. Preis und Lieferstatus je Variante aktuell prüfen.\"",
    availabilityUpdated: "\"2026-08-06T12:00:00.000Z\"",
    editorialStatus: "\"complete\"",
    recommendationStatus: "\"limited\"",
    maintenanceStatus: "\"complete\""
  };
  for (const [key, value] of Object.entries(operations)) frontmatter = setScalar(frontmatter, key, value, ["ratings:"]);
  const parsed = yaml.load(frontmatter);
  if (parsed.price?.current != null || parsed.priceAutomation !== "editorial" || parsed.priceState !== "unknown" || parsed.availability !== "unknown") {
    throw new Error("SureFeed-Zielzustand konnte nicht strukturell hergestellt werden.");
  }
  writeIfChanged(files.product, `---\n${frontmatter.replace(/\s+$/, "")}\n---\n${parts.body}`);
}

function updateSchema() {
  let source = read(files.schema);
  if (!source.includes("priceAutomation: z.enum")) {
    const eol = source.includes("\r\n") ? "\r\n" : "\n";
    const lines = source.split(/\r?\n/);
    const priceKey = lines.findIndex((line) => line.trim() === "price:");
    const priceSchema = lines.findIndex((line, index) => index > priceKey && line.trim() === "productPriceSchema,");
    if (priceKey < 0 || priceSchema < 0) throw new Error("Schema-Anker für priceAutomation fehlt.");
    lines.splice(priceSchema + 1, 0, "", "    priceAutomation: z.enum([\"automatic\", \"editorial\"]).default(\"automatic\"),");
    source = lines.join(eol);
  }
  writeIfChanged(files.schema, source);
}

function updateService() {
  let source = read(files.service);
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  if (!source.includes("export const allowsAutomaticPriceCheck")) {
    const lines = source.split(/\r?\n/);
    const index = lines.findIndex((line) => line.trim() === "async function checkDocumentPrice(document) {");
    if (index < 0) throw new Error("Preisservice-Anker fehlt.");
    lines.splice(index, 1,
      "export const allowsAutomaticPriceCheck = (data = {}) => data?.priceAutomation !== \"editorial\";",
      "",
      "async function checkDocumentPrice(document) {",
      "  if (!allowsAutomaticPriceCheck(document.data)) {",
      "    throw new Error(\"Die automatische Preisprüfung ist für dieses Produkt redaktionell gesperrt.\");",
      "  }");
    source = lines.join(eol);
  }
  if (!source.includes("if (!allowsAutomaticPriceCheck(document.data)) return false;")) {
    const lines = source.split(/\r?\n/);
    const filter = lines.findIndex((line) => line.includes("const candidates = documents.filter((document) => {"));
    if (filter < 0) throw new Error("Kandidatenfilter-Anker fehlt.");
    lines.splice(filter + 1, 0, "    if (!allowsAutomaticPriceCheck(document.data)) return false;");
    source = lines.join(eol);
  }
  writeIfChanged(files.service, source);
}

function updateOperationsPolicy() {
  let source = read(files.policy);
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  let lines = source.split(/\r?\n/);
  if (!source.includes("const editorialPriceControl = data?.priceAutomation === \"editorial\";")) {
    const at = lines.findIndex((line) => line.includes("const missingRequiredFields = requiredFieldIssues(data);"));
    if (at < 0) throw new Error("Operations-Policy-Anker fehlt.");
    lines.splice(at + 1, 0, "  const editorialPriceControl = data?.priceAutomation === \"editorial\";");
  }
  lines = lines.map((line) => {
    if (line.includes('if (!priceAvailable && priceState !== "removed") warnings.push')) return line.replace("if (!priceAvailable", "if (!editorialPriceControl && !priceAvailable");
    if (line.includes('if (availability === "unknown") warnings.push')) return line.replace("if (availability", "if (!editorialPriceControl && availability");
    if (line.trim() === "!priceAvailable ||") return "    (!editorialPriceControl && !priceAvailable) ||";
    if (line.trim() === 'availability === "unknown" ||') return '    (!editorialPriceControl && availability === "unknown") ||';
    if (line.includes("missingPrice: count((row) =>")) return "    missingPrice: count((row) => !row.operations?.priceAvailable && !row.operations?.editorialPriceControl && !row.operations?.consciouslyUnavailable && !row.operations?.archived),";
    return line;
  });
  if (!lines.some((line) => line.trim() === "editorialPriceControl,")) {
    const priceState = lines.findIndex((line, index) => index > 250 && line.trim() === "priceState,");
    if (priceState < 0) throw new Error("Operations-Rückgabeanker fehlt.");
    lines.splice(priceState + 1, 0, "    editorialPriceControl,");
  }
  source = lines.join(eol);
  writeIfChanged(files.policy, source);

  let types = read(files.policyTypes);
  if (!types.includes("editorialPriceControl: boolean;")) {
    const typeEol = types.includes("\r\n") ? "\r\n" : "\n";
    const typeLines = types.split(/\r?\n/);
    const at = typeLines.findIndex((line) => line.trim() === "priceState: PriceState;");
    if (at < 0) throw new Error("Policy-Typanker fehlt.");
    typeLines.splice(at + 1, 0, "  editorialPriceControl: boolean;");
    types = typeLines.join(typeEol);
  }
  writeIfChanged(files.policyTypes, types);
}

function updateResearch() {
  const data = JSON.parse(read(files.research));
  const item = data.items?.find((entry) => entry.id === "surefeed-connect-verfuegbarkeit-und-hub-refresh");
  if (!item) throw new Error("SureFeed-Research-Eintrag fehlt.");
  item.status = "implemented";
  item.lastConfirmedAt = "2026-08-06T12:00:00.000Z";
  data.updatedAt = "2026-08-06T12:00:00.000Z";
  writeIfChanged(files.research, `${JSON.stringify(data, null, 2)}\n`);
}

const testSource = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import yaml from "js-yaml";
import { allowsAutomaticPriceCheck } from "../src/lib/price-intelligence/service.mjs";
import { deriveProductOperations } from "../src/lib/product-operations/policy.mjs";

const APP = process.cwd();
const read = (relative) => fs.readFileSync(path.join(APP, relative), "utf8");
const productSource = read("src/content/products/surefeed-microchip-pet-feeder-connect.md");
const product = yaml.load(productSource.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---/)?.[1] ?? "");

test("widersprüchliche Variantenpreise bleiben redaktionell und dynamisch", () => {
  assert.equal(product.priceAutomation, "editorial");
  assert.equal(product.price?.current, undefined);
  assert.equal(product.priceState, "unknown");
  assert.equal(product.priceAvailable, false);
  assert.equal(product.availability, "unknown");
  assert.equal(allowsAutomaticPriceCheck(product), false);
  assert.equal(allowsAutomaticPriceCheck({}), true);
  assert.equal(product.maintenanceStatus, "complete");
  const operations = deriveProductOperations(product);
  assert.equal(operations.editorialPriceControl, true);
  assert.equal(operations.isTask, false);
  assert.deepEqual(operations.warnings, []);
  assert.equal(operations.recommendationStatus, "limited");
});

test("Hub, Bundle und App-Messwerte sind entscheidungsreif erklärt", () => {
  assert.match(productSource, /Gerät, Hub und Bundle/);
  assert.match(productSource, /bis zu zehn kompatible Connect-Geräte/);
  assert.match(productSource, /Fressmenge, Häufigkeit, Dauer und Tageszeiten/);
  assert.match(productSource, /1 Gramm genau/);
  assert.match(productSource, /400 ml/);
  assert.equal(product.score, 79);
  assert.match(product.recommendation, /Sinnvoll für getrennte Rationen/);
});

test("alle betroffenen Vergleiche trennen Gerät, Hub und Bundle", () => {
  const directory = path.join(APP, "src/content/comparisons");
  const comparisons = fs.readdirSync(directory).filter((name) => name.endsWith(".md"))
    .map((name) => read(path.join("src/content/comparisons", name)))
    .filter((source) => source.includes("slug: surefeed-microchip-pet-feeder-connect"));
  assert.ok(comparisons.length >= 2);
  for (const source of comparisons) {
    assert.match(source, /SureFeed Connect richtig einordnen/);
    assert.match(source, /Einzelgerät, Hub und Bundle sind getrennte Kaufvarianten/);
  }
});

test("erledigter Research-Auftrag fällt aus der Top-5-Auswahl", () => {
  const store = JSON.parse(read("research/research.json"));
  const item = store.items.find((entry) => entry.id === "surefeed-connect-verfuegbarkeit-und-hub-refresh");
  assert.equal(item?.status, "implemented");
  const activeTopFive = store.items.filter((entry) => entry.status === "open" || entry.status === "planned")
    .sort((left, right) => right.priority - left.priority || right.confidence - left.confidence)
    .slice(0, 5);
  assert.equal(activeTopFive.some((entry) => entry.id === item.id), false);
});
`;

function writeArtifacts() {
  writeIfChanged(files.test, testSource);
  const report = {
    patch: "pfotentechnik-surefeed-connect-current-data-25.10.8",
    generatedAt: "2026-08-06T12:00:00.000Z",
    source: "https://www.surepetcare.com/de-de/futterautomat/microchip-pet-feeder-connect",
    decisions: {
      product: "Hub-, Bundle- und App-Daten bestätigt; kein statischer Preis oder Verfügbarkeitswert.",
      comparisons: "Bestehende SureFeed-Abschnitte fachlich bestätigt und unverändert belassen.",
      automation: "Automatische Händlerpreisübernahme für redaktionell kontrollierte Produkte zentral gesperrt.",
      research: "Auftrag implementiert und dadurch aus der aktiven Top-5-Auswahl entfernt."
    }
  };
  writeIfChanged(files.report, `${JSON.stringify(report, null, 2)}\n`);
}

function validateTarget() {
  const data = yaml.load(splitFrontmatter(read(files.product), files.product).yaml);
  if (data.price?.current != null || data.priceAutomation !== "editorial" || data.availability !== "unknown") throw new Error("Produktvalidierung fehlgeschlagen.");
  const research = JSON.parse(read(files.research));
  if (research.items.find((entry) => entry.id === "surefeed-connect-verfuegbarkeit-und-hub-refresh")?.status !== "implemented") throw new Error("Research-Status wurde nicht abgeschlossen.");
}

function run(command, args, cwd = ROOT) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} fehlgeschlagen.`);
}

updateProduct();
updateSchema();
updateService();
updateOperationsPolicy();
updateResearch();
writeArtifacts();
validateTarget();

console.log(`Geändert: ${changed.length ? changed.join(", ") : "keine"}`);
console.log(`Bereits aktuell: ${current.length ? current.join(", ") : "keine"}`);

if (!process.argv.includes("--skip-validation")) {
  run(process.execPath, ["--test", "test/surefeed-connect-current-data-25.10.8.test.mjs"], APP);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "price:audit:strict"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:topical-authority:strict"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:decision-journeys:strict"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:internal-link-health:strict"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:content-quality:strict"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);
}
