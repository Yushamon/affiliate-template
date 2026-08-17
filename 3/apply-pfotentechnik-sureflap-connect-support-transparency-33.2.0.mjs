#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const PATCH = "pfotentechnik-sureflap-connect-support-transparency-33.2.0";
const scriptFile = fileURLToPath(import.meta.url);
const root = [process.cwd(), path.resolve(path.dirname(scriptFile), "..")].find((candidate) =>
  fs.existsSync(path.join(candidate, "apps", "pfotentechnik", "package.json")),
);
if (!root) throw new Error(`[${PATCH}] Repository-Wurzel nicht gefunden.`);

const require = createRequire(path.join(root, "package.json"));
const yaml = require("js-yaml");
const app = path.join(root, "apps", "pfotentechnik");
const files = {
  product: path.join(app, "src/content/products/sureflap-mikrochip-katzenklappe-connect.md"),
  comparison: path.join(app, "src/content/comparisons/katzenklappen-mit-app-und-beuteerkennung.md"),
  hub: path.join(app, "src/content/pages/katzenklappen.md"),
  prompt: path.join(app, "research/visual-prompts/sureflap-connect-visual-master-prompt.txt"),
  test: path.join(app, "test/sureflap-connect-support-transparency-33.2.0.test.mjs"),
};

for (const key of ["product", "comparison", "hub", "prompt"]) {
  if (!fs.existsSync(files[key])) {
    throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${path.relative(root, files[key])}`);
  }
}

const normalize = (value) => value.replaceAll("\r\n", "\n");
const read = (file) => normalize(fs.readFileSync(file, "utf8"));
const self = read(scriptFile);

function payload(name) {
  const start = `/*__${name}__\n`;
  const end = `\n__END_${name}__*/`;
  const from = self.indexOf(start);
  const to = self.indexOf(end, from + start.length);
  if (from < 0 || to < 0) throw new Error(`[${PATCH}] Payload ${name} fehlt.`);
  return `${self.slice(from + start.length, to)}\n`;
}

function parseDocument(source, label) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) throw new Error(`[${PATCH}] Frontmatter in ${label} ist ungueltig.`);
  const data = yaml.load(match[1], { schema: yaml.JSON_SCHEMA });
  if (!data || typeof data !== "object") throw new Error(`[${PATCH}] Frontmatter in ${label} ist leer.`);
  return { data, body: match[2].trim() };
}

function serializeDocument(document) {
  const frontmatter = yaml.dump(document.data, {
    schema: yaml.JSON_SCHEMA,
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: true,
  }).trimEnd();
  return `---\n${frontmatter}\n---\n\n${document.body.trim()}\n`;
}

function upsertByKey(items, key, value) {
  const list = Array.isArray(items) ? [...items] : [];
  const index = list.findIndex((item) => item?.[key] === value[key]);
  if (index >= 0) list[index] = { ...list[index], ...value };
  else list.push(value);
  return list;
}

function uniqueAppend(items, value) {
  const list = Array.isArray(items) ? [...items] : [];
  if (!list.includes(value)) list.push(value);
  return list;
}

function insertManagedBlock(body, anchor, block, label) {
  if (body.includes(block.split("\n")[0])) return body;
  const index = body.indexOf(anchor);
  if (index < 0) throw new Error(`[${PATCH}] Einfuegepunkt in ${label} fehlt.`);
  return `${body.slice(0, index).trimEnd()}\n\n${block}\n\n${body.slice(index).trimStart()}`;
}

function patchProduct(source) {
  const document = parseDocument(source, "SureFlap-Connect-Produktseite");
  const data = document.data;
  if (data.slug !== "sureflap-mikrochip-katzenklappe-connect") {
    throw new Error(`[${PATCH}] Unerwarteter Produkt-Slug.`);
  }
  if (data.productStatus === "discontinued") {
    throw new Error(`[${PATCH}] Produkt ist bereits als discontinued markiert; manuelle Klaerung erforderlich.`);
  }

  data.updatedAt = "2026-08-15";
  data.decision.attention = uniqueAppend(
    data.decision.attention,
    "Sure Petcare dokumentiert Sicherheitsupdates für den benötigten Hub für zwei Jahre ab Kaufdatum des Hubs; daraus folgt keine Aussage zur Produktlebensdauer oder späteren Dienstverfügbarkeit",
  );
  data.weaknesses = uniqueAppend(
    data.weaknesses,
    "Der dokumentierte Security-Support-Horizont des Hubs ist auf zwei Jahre ab dessen Kaufdatum begrenzt; der Betrieb danach ist damit weder bestätigt noch ausgeschlossen",
  );
  data.specs = upsertByKey(data.specs, "label", {
    label: "Hub-Sicherheitsupdates",
    value: "Vom Hersteller für zwei Jahre ab Kaufdatum des Hubs dokumentiert",
  });
  data.decisionFacts = upsertByKey(data.decisionFacts, "label", {
    label: "Security-Support des Hubs",
    value: "Zwei Jahre ab Kaufdatum des Hubs dokumentiert",
    consequence: "Der Zeitraum beschreibt Sicherheitsupdates für den Hub, nicht die Lebensdauer der Klappe, ein Funktionsende oder eine garantierte Cloud-Laufzeit.",
  });
  data.comparisonData ??= { version: 1 };
  data.comparisonData.custom ??= {};
  data.comparisonData.custom.hub_erforderlich = "Ja, für die Verbindung mit der Sure Petcare App";
  data.comparisonData.custom.security_support = "Hub: zwei Jahre ab Kaufdatum des Hubs dokumentiert";

  data.faq = (data.faq ?? []).filter((item) => item.question !== "Braucht die SureFlap Connect Katzenklappe einen Hub?");
  data.faq = upsertByKey(data.faq, "question", {
    question: "Braucht die SureFlap Connect den Hub?",
    answer: "Für die Verbindung zur Sure Petcare App und damit für Benachrichtigungen, Aktivitätsdaten und Fernfunktionen wird der Sure Petcare Hub benötigt. Die grundlegende Mikrochip-Zutrittsprüfung an der Klappe ist davon zu trennen; der Hersteller belegt nicht, dass die gesamte Klappe ohne Internet unbrauchbar wäre.",
  });
  data.faq = upsertByKey(data.faq, "question", {
    question: "Wie lange liefert Sure Petcare Sicherheitsupdates für den Hub?",
    answer: "Sure Petcare dokumentiert Sicherheitsupdates für den Hub für einen Zeitraum von zwei Jahren ab Kaufdatum des Hubs.",
  });
  data.faq = upsertByKey(data.faq, "question", {
    question: "Was passiert nach Ablauf des dokumentierten Security-Zeitraums?",
    answer: "Dazu erlaubt die Herstellerangabe keine belastbare Prognose. Sie sagt weder, ob danach weitere Updates erscheinen, noch ob Hub, Klappe, App- oder Cloud-Funktionen weiterlaufen oder eingestellt werden. Der Zeitraum ist keine Angabe zur Produktlebensdauer.",
  });
  data.evidenceSources = upsertByKey(data.evidenceSources, "url", {
    source: "Sure Petcare UK – Microchip Cat Flap Connect",
    url: "https://www.surepetcare.com/en-gb/pet-doors/microchip-cat-flap-connect",
    accessedAt: "2026-08-15",
    assertion: "Der Hub ist für die App-Verbindung erforderlich. Sicherheitsupdates für den Hub werden für zwei Jahre ab Kaufdatum des Hubs dokumentiert; die Aussage beschreibt weder Produktlebensdauer noch Cloud-Laufzeit.",
    fields: ["decision", "weaknesses", "specs", "decisionFacts", "comparisonData", "faq"],
  });

  const block = payload("PRODUCT_BLOCK").trim();
  if (!document.body.includes("<!-- pt:sureflap-support-33.2.0:start -->")) {
    document.body = `${document.body.trim()}\n\n${block}`;
  }
  return serializeDocument(document);
}

function patchComparison(source) {
  const document = parseDocument(source, "App- und Beuteerkennungs-Vergleich");
  const data = document.data;
  if (data.slug !== "katzenklappen-mit-app-und-beuteerkennung") {
    throw new Error(`[${PATCH}] Unerwarteter Vergleichs-Slug.`);
  }
  const expected = new Set([
    "sureflap-mikrochip-katzenklappe-connect",
    "onlycat-mikrochip-katzenklappe",
    "petwalk-medium-tiertuer",
    "zeromouse-2-0",
  ]);
  if (data.items?.length !== expected.size || data.items.some((item) => !expected.has(item.slug))) {
    throw new Error(`[${PATCH}] Unerwartete Produktmenge im Vergleich.`);
  }

  data.updatedAt = "2026-08-15";
  data.items = data.items.map((item) => {
    const values = { ...(item.values ?? {}) };
    if (item.slug === "sureflap-mikrochip-katzenklappe-connect") {
      values.hub_erforderlich = "Ja, für die Verbindung mit der Sure Petcare App";
      values.security_support = "Hub: zwei Jahre ab Kaufdatum des Hubs dokumentiert";
    } else {
      values.hub_erforderlich = "Nicht dokumentiert";
      values.security_support = "Nicht dokumentiert";
    }
    return { ...item, values };
  });
  data.criteria = upsertByKey(data.criteria, "key", {
    key: "hub_erforderlich",
    label: "Hub erforderlich",
    description: "Ob für die vernetzten Funktionen ein separates Gateway benötigt wird; nicht dokumentiert bedeutet nicht automatisch nein.",
    weight: 1.4,
    format: "text",
    fallback: "Nicht dokumentiert",
  });
  data.criteria = upsertByKey(data.criteria, "key", {
    key: "security_support",
    label: "Dokumentierter Security-Update-Zeitraum",
    description: "Herstellerangabe zum Security-Support; keine Aussage zu Produktlebensdauer, Funktionsende oder Cloud-Laufzeit.",
    weight: 1.2,
    format: "text",
    fallback: "Nicht dokumentiert",
  });
  data.faq = upsertByKey(data.faq, "question", {
    question: "Was bedeutet im Vergleich 'nicht dokumentiert' beim Security-Support?",
    answer: "Es bedeutet nur, dass fuer diese Vergleichsdimension keine belastbare Herstellerangabe hinterlegt ist. Daraus folgt weder, dass es keine Updates gibt, noch dass ein Produkt unsicher ist oder Dienste eingestellt werden.",
  });
  data.evidenceSources = upsertByKey(data.evidenceSources, "url", {
    source: "Sure Petcare UK – Microchip Cat Flap Connect",
    url: "https://www.surepetcare.com/en-gb/pet-doors/microchip-cat-flap-connect",
    accessedAt: "2026-08-15",
    assertion: "Für SureFlap Connect sind Hub-Pflicht für die App und zwei Jahre Sicherheitsupdates ab Hub-Kaufdatum dokumentiert. Für andere Produkte werden keine Werte aus dieser Quelle abgeleitet.",
    fields: ["items", "criteria", "faq"],
  });

  document.body = insertManagedBlock(
    document.body,
    "## Einbauaufwand als Ausschlusskriterium",
    payload("COMPARISON_BLOCK").trim(),
    "App- und Beuteerkennungs-Vergleich",
  );
  return serializeDocument(document);
}

function patchHub(source) {
  const document = parseDocument(source, "Katzenklappen-Hub");
  if (document.data.slug !== "katzenklappen") throw new Error(`[${PATCH}] Unerwarteter Hub-Slug.`);
  document.data.updatedAt = "2026-08-15";
  document.data.evidenceSources = upsertByKey(document.data.evidenceSources, "url", {
    source: "Sure Petcare UK – Microchip Cat Flap Connect",
    url: "https://www.surepetcare.com/en-gb/pet-doors/microchip-cat-flap-connect",
    accessedAt: "2026-08-15",
    assertion: "Bei vernetzten Katzenklappen sind separater Hub, Herstellerdienst und dokumentierter Security-Support als eigene Kaufkriterien zu pruefen.",
    fields: ["contentPlatform", "body"],
  });
  document.body = insertManagedBlock(
    document.body,
    "### 5. Einbau und laufenden Betrieb planen",
    payload("HUB_BLOCK").trim(),
    "Katzenklappen-Hub",
  );
  return serializeDocument(document);
}

function validateProduct(source) {
  const { data, body } = parseDocument(source, "validierte Produktseite");
  const fact = data.decisionFacts?.find((item) => item.label === "Security-Support des Hubs");
  if (!fact || !/Zwei Jahre ab Kaufdatum des Hubs/.test(fact.value)) throw new Error(`[${PATCH}] Supportzeitraum fehlt.`);
  if (data.productStatus === "discontinued") throw new Error(`[${PATCH}] Unbelegter Discontinued-Status.`);
  if (!data.faq?.some((item) => /Was passiert nach Ablauf/.test(item.question))) throw new Error(`[${PATCH}] Lifecycle-FAQ fehlt.`);
  if (!body.includes("/vergleiche/katzenklappen-mit-app-und-beuteerkennung/") || !body.includes("/katzenklappen/")) {
    throw new Error(`[${PATCH}] Produkt-Journey ist unvollstaendig.`);
  }
}

function validateComparison(source) {
  const { data } = parseDocument(source, "validierten Vergleich");
  for (const key of ["hub_erforderlich", "security_support"]) {
    if (!data.criteria.some((item) => item.key === key)) throw new Error(`[${PATCH}] Vergleichskriterium ${key} fehlt.`);
    if (data.items.some((item) => !(key in item.values))) throw new Error(`[${PATCH}] Vergleichswert ${key} fehlt.`);
  }
  const others = data.items.filter((item) => item.slug !== "sureflap-mikrochip-katzenklappe-connect");
  if (others.some((item) => item.values.security_support !== "Nicht dokumentiert")) {
    throw new Error(`[${PATCH}] Unbelegte Supportwerte fuer andere Produkte.`);
  }
}

const desired = new Map([
  [files.product, patchProduct(read(files.product))],
  [files.comparison, patchComparison(read(files.comparison))],
  [files.hub, patchHub(read(files.hub))],
  [files.prompt, payload("PROMPT")],
  [files.test, payload("TEST")],
]);
validateProduct(desired.get(files.product));
validateComparison(desired.get(files.comparison));

const changes = [...desired].filter(([file, content]) => !fs.existsSync(file) || read(file) !== normalize(content));
function isManagedPriorState(file) {
  if (!fs.existsSync(file)) return false;
  const source = read(file);
  if (file === files.product) return source.includes("<!-- pt:sureflap-support-33.2.0:start -->");
  if (file === files.comparison) return source.includes("<!-- pt:sureflap-comparison-support-33.2.0:start -->");
  if (file === files.hub) return source.includes("<!-- pt:katzenklappen-support-check-33.2.0:start -->");
  if (file === files.test) return source.includes('test("SureFlap Connect trennt Hub-Support');
  return false;
}
if (changes.length === 0) {
  console.log(`[${PATCH}] Keine Aenderungen erforderlich.`);
} else {
  for (const [file] of changes) {
    const relative = path.relative(root, file).replaceAll(path.sep, "/");
    if (fs.existsSync(file)) {
      const status = spawnSync("git", ["status", "--porcelain", "--", relative], { cwd: root, encoding: "utf8" });
      if (status.status !== 0) throw new Error(`[${PATCH}] Git-Status fuer ${relative} konnte nicht geprueft werden.`);
      if (status.stdout.trim() && !isManagedPriorState(file)) {
        throw new Error(`[${PATCH}] Lokale Nutzeraenderung erkannt: ${relative}. Abbruch ohne Schreibzugriff.`);
      }
    }
  }

  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const backupRoot = path.join(root, ".patch-backups", PATCH, stamp);
  const staged = [];
  try {
    for (const [file, content] of changes) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const temp = `${file}.${process.pid}.tmp`;
      fs.writeFileSync(temp, normalize(content), "utf8");
      staged.push({ file, temp });
    }
    for (const { file } of staged) {
      if (!fs.existsSync(file)) continue;
      const backup = path.join(backupRoot, path.relative(root, file));
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      fs.copyFileSync(file, backup);
    }
    for (const { file, temp } of staged) fs.renameSync(temp, file);
    console.log(`[${PATCH}] ${changes.length} Datei(en) installiert. Backup: ${path.relative(root, backupRoot)}`);
  } catch (error) {
    for (const { temp } of staged) if (fs.existsSync(temp)) fs.rmSync(temp, { force: true });
    throw error;
  }
}

const testResult = spawnSync(process.execPath, ["--test", path.relative(root, files.test)], {
  cwd: root,
  stdio: "inherit",
  shell: false,
});
if (testResult.status !== 0) throw new Error(`[${PATCH}] Regressionstest fehlgeschlagen.`);
console.log(`[${PATCH}] Abgeschlossen.`);

/*__PRODUCT_BLOCK__
<!-- pt:sureflap-support-33.2.0:start -->
## Hub, App und dokumentierter Security-Support

Die grundlegende Mikrochip-Zutrittsprüfung findet an der Katzenklappe statt. Für die Verbindung zur Sure Petcare App – darunter Benachrichtigungen, Aktivitätsdaten und Fernfunktionen – ist zusätzlich der Sure Petcare Hub erforderlich. Damit hängen die Connect-Funktionen je nach Aufgabe von Hub, Netzwerk, Internet, App und Herstellerdiensten ab.

Sure Petcare dokumentiert **Sicherheitsupdates für den Hub für zwei Jahre ab Kaufdatum des Hubs**. Das ist ein Support-Horizont für den Hub, keine Angabe zur Lebensdauer der Katzenklappe. Daraus folgt weder ein Funktionsende nach zwei Jahren noch eine garantierte Abschaltung oder Fortführung von App- und Cloud-Diensten. Ob später weitere Updates erscheinen, lässt die Quelle offen.

Wer diese zusätzliche Systemabhängigkeit bewusst akzeptiert, erhält die Connect-Funktionen. Wer nur lokalen Mikrochip-Zugang benötigt, kann ein nicht vernetztes Modell einfacher betreiben. Der [Vergleich von App-Katzenklappen und Beuteerkennung](/vergleiche/katzenklappen-mit-app-und-beuteerkennung/) stellt Hub- und Supportangaben getrennt dar; der [Katzenklappen-Hub](/katzenklappen/) beginnt bei Zugang, Passform und Einbau.
<!-- pt:sureflap-support-33.2.0:end -->
__END_PRODUCT_BLOCK__*/

/*__COMPARISON_BLOCK__
<!-- pt:sureflap-comparison-support-33.2.0:start -->
## Hub- und Security-Support als Kaufkriterium

Bei SureFlap Connect ist der separate Hub für die Verbindung zur App erforderlich. Sure Petcare dokumentiert für diesen Hub Sicherheitsupdates für zwei Jahre ab Kaufdatum des Hubs. Der Zeitraum ist weder eine Lebensdauerangabe für die Klappe noch ein belegtes Funktionsende von Hub, App oder Cloud.

Für die anderen Systeme zeigt die Tabelle bewusst „Nicht dokumentiert“, solange keine passende Herstellerangabe hinterlegt ist. Das bedeutet nicht „keine Updates“ und führt zu keiner automatischen Abwertung. Die beiden Felder dienen der Transparenz über Systemabhängigkeiten, nicht einer pauschalen Rangfolge.

Die Details und Quellen stehen auf der [SureFlap-Connect-Produktseite](/produkt/sureflap-mikrochip-katzenklappe-connect/).
<!-- pt:sureflap-comparison-support-33.2.0:end -->
__END_COMPARISON_BLOCK__*/

/*__HUB_BLOCK__
<!-- pt:katzenklappen-support-check-33.2.0:start -->
#### Supporthorizont vernetzter Modelle prüfen

Bei App- oder Cloud-Modellen gehört zur Kaufentscheidung auch, ob ein separater Hub benötigt wird, welche Funktionen vom Herstellerdienst abhängen und ob ein Software- oder Security-Support-Zeitraum dokumentiert ist. Ein genannter Zeitraum darf nicht automatisch mit Produktlebensdauer oder Funktionsende gleichgesetzt werden. Der [App- und Beuteerkennungs-Vergleich](/vergleiche/katzenklappen-mit-app-und-beuteerkennung/) weist bekannte und nicht dokumentierte Angaben getrennt aus.
<!-- pt:katzenklappen-support-check-33.2.0:end -->
__END_HUB_BLOCK__*/

/*__PROMPT__
ChatGPT-Master-Prompt: SureFlap Connect – Hub- und Security-Support-Visuals

Nutze ausschließlich offizielle Herstellerreferenzen:
- https://www.surepetcare.com/de-de/haustierklappen/mikrochip-katzenklappe-connect
- https://www.surepetcare.com/en-gb/pet-doors/microchip-cat-flap-connect
- https://www.surepetcare.com/internet-hub/hub

Stelle die kleine SureFlap Mikrochip Katzenklappe Connect und den katzenförmigen Sure Petcare Hub modellgetreu dar. Keine erfundenen Interfaces, Sensoren, Anschlüsse, Gerätebestandteile, Garantien oder Abschaltzeitpunkte. Kein Funktionsende nach zwei Jahren suggerieren. Ruhige redaktionelle Infografik, klare deutsche Beschriftung, gute mobile Lesbarkeit.

Erzeuge genau zwei separate Motive in dieser Reihenfolge:
MOTIV 1: Abhängigkeitsgrafik – SureFlap Connect → Sure Petcare Hub → App / vernetzte Funktionen. Die lokale Mikrochip-Zutrittsprüfung an der Klappe optisch von den vernetzten Connect-Funktionen trennen. Keine konkrete App-Oberfläche erfinden.
MOTIV 2: Support-Zeitleiste – Kaufdatum des Hubs → vom Hersteller dokumentierter Security-Update-Zeitraum: zwei Jahre. Danach ein offenes, neutral markiertes Feld „Weitere Updates und Dienstlaufzeit nicht aus dieser Angabe ableitbar“. Kein Produkt-, Funktions- oder Cloud-Ende darstellen.

STEUERUNG: Beginne ausschließlich mit MOTIV 1. Erzeuge genau ein Motiv pro Antwort und stoppe danach. Wenn der Nutzer exakt „Weiter“ schreibt, erzeuge ausschließlich MOTIV 2. Kein Motiv wiederholen, keines überspringen und beide nie kombinieren. Nach MOTIV 2 nur „Serie vollständig“ melden; ein weiteres „Weiter“ erzeugt kein Bild.
__END_PROMPT__*/

/*__TEST__
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(app, "package.json"));
const yaml = require("js-yaml");
const content = path.join(app, "src", "content");

function parse(relative) {
  const file = path.join(content, relative);
  const raw = fs.readFileSync(file, "utf8");
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `Frontmatter fehlt: ${relative}`);
  return { file, raw, data: yaml.load(match[1], { schema: yaml.JSON_SCHEMA }) };
}

test("SureFlap Connect trennt Hub-Support von Lebensdauer und Cloud", () => {
  const product = parse("products/sureflap-mikrochip-katzenklappe-connect.md");
  const fact = product.data.decisionFacts.find((item) => item.label === "Security-Support des Hubs");
  assert.equal(fact.value, "Zwei Jahre ab Kaufdatum des Hubs dokumentiert");
  assert.match(fact.consequence, /nicht die Lebensdauer/);
  assert.equal(product.data.productStatus, "active");
  assert.doesNotMatch(product.raw, /funktioniert nur zwei Jahre|nach zwei Jahren keine Updates mehr|nach zwei Jahren unsicher/i);
  assert.match(product.raw, /weder ein Funktionsende/);
});

test("FAQ beantwortet die drei Supportfragen aus derselben sichtbaren Datenquelle", () => {
  const product = parse("products/sureflap-mikrochip-katzenklappe-connect.md").data;
  const questions = new Map(product.faq.map((item) => [item.question, item.answer]));
  assert.match(questions.get("Braucht die SureFlap Connect den Hub?"), /App/);
  assert.match(questions.get("Wie lange liefert Sure Petcare Sicherheitsupdates für den Hub?"), /zwei Jahren ab Kaufdatum des Hubs/);
  assert.match(questions.get("Was passiert nach Ablauf des dokumentierten Security-Zeitraums?"), /keine belastbare Prognose/);
  const details = fs.readFileSync(path.join(app, "src/components/product-experience-2/ProductDetails2.astro"), "utf8");
  assert.match(details, /model\.faq\.map/);
});

test("Vergleich stellt Hub und unbekannten Support ohne erfundene Werte dar", () => {
  const comparison = parse("comparisons/katzenklappen-mit-app-und-beuteerkennung.md").data;
  assert.ok(comparison.criteria.some((item) => item.key === "hub_erforderlich"));
  assert.ok(comparison.criteria.some((item) => item.key === "security_support"));
  const sureflap = comparison.items.find((item) => item.slug === "sureflap-mikrochip-katzenklappe-connect");
  assert.match(sureflap.values.security_support, /zwei Jahre ab Kaufdatum des Hubs/);
  for (const item of comparison.items.filter((entry) => entry !== sureflap)) {
    assert.equal(item.values.hub_erforderlich, "Nicht dokumentiert");
    assert.equal(item.values.security_support, "Nicht dokumentiert");
  }
});

test("Journey-Ziele und bestehende Bildreferenzen sind gueltig", () => {
  const product = parse("products/sureflap-mikrochip-katzenklappe-connect.md");
  for (const href of ["/katzenklappen/", "/vergleiche/katzenklappen-mit-app-und-beuteerkennung/"]) {
    assert.ok(product.raw.includes(href));
  }
  for (const image of [product.data.images.hero, product.data.images.thumbnail, product.data.images.comparison, ...product.data.images.gallery].filter(Boolean)) {
    assert.ok(fs.existsSync(path.resolve(path.dirname(product.file), image.src)), `Asset fehlt: ${image.src}`);
  }
  assert.ok(fs.existsSync(path.join(content, "pages/katzenklappen.md")));
  assert.ok(fs.existsSync(path.join(content, "comparisons/katzenklappen-mit-app-und-beuteerkennung.md")));
});

test("Visual-Prompt erzeugt genau zwei belegte Motive in stabiler Reihenfolge", () => {
  const prompt = fs.readFileSync(path.join(app, "research/visual-prompts/sureflap-connect-visual-master-prompt.txt"), "utf8");
  assert.deepEqual([...prompt.matchAll(/^MOTIV (\d+):/gm)].map((match) => Number(match[1])), [1, 2]);
  assert.match(prompt, /genau ein Motiv pro Antwort/);
  assert.match(prompt, /exakt „Weiter“/);
  assert.match(prompt, /Kein Funktionsende nach zwei Jahren suggerieren/);
});
__END_TEST__*/
