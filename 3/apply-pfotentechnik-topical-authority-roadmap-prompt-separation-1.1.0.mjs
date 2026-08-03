#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-topical-authority-roadmap-prompt-separation-1.1.0";
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const runBuild = !args.has("--no-build");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 14; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const MODULE = path.join(ROOT, "apps", "pfotentechnik", "src", "lib", "seo", "topical-authority", "roadmap-prompts.ts");
const TEST = path.join(ROOT, "apps", "pfotentechnik", "test", "topical-authority-roadmap-prompt-separation-1.1.0.test.mjs");

if (!fs.existsSync(MODULE)) throw new Error("roadmap-prompts.ts nicht gefunden.");
const original = fs.readFileSync(MODULE, "utf8");
if (!original.includes("TOPICAL_AUTHORITY_ROADMAP_PROMPTS_VERSION")) {
  throw new Error("Unbekannte Roadmap-Prompt-Architektur.");
}

const moduleContent = 'import type {\n  Cluster,\n  Opportunity,\n} from "./loadTopicalAuthority.ts";\n\nexport const TOPICAL_AUTHORITY_ROADMAP_PROMPTS_VERSION = "1.1.0";\n\ntype RoadmapMode = "consolidate" | "journey" | "expand" | "validate";\n\nexport type TopicalAuthorityRoadmapPromptPair = {\n  chatgpt: string;\n  codex: string;\n};\n\nconst unique = (values: string[], max = 50): string[] =>\n  [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, max);\n\nconst profileForOpportunity = (opportunity: Opportunity): RoadmapMode => {\n  const text = `${opportunity.id} ${opportunity.title}`.toLowerCase();\n  if (opportunity.id.startsWith("link-") || /journey|kaufnah|commercial/.test(text)) {\n    return "journey";\n  }\n  if (opportunity.id.startsWith("validate-")) return "validate";\n  if (/consolidate|konsolidier/.test(text)) return "consolidate";\n  return "expand";\n};\n\nconst listDocuments = (\n  cluster: Cluster | undefined,\n  type?: Cluster["documents"][number]["type"],\n): string[] =>\n  (cluster?.documents ?? [])\n    .filter((document) => !type || document.type === type)\n    .map((document) => `${document.title} – ${document.route}`)\n    .slice(0, 40);\n\nconst modeRule: Record<RoadmapMode, string> = {\n  consolidate:\n    "Bestehende Intent-Owner, Überschneidungen und Kannibalisierungsrisiken zuerst klären. Konsolidieren und Schärfen hat Vorrang vor neuen Seiten.",\n  journey:\n    "Die Nutzerreise innerhalb des Clusters prüfen und nur fachlich natürliche Übergänge zwischen Hub, Ratgeber, Vergleich, Produkt und Hersteller ergänzen.",\n  expand:\n    "Neue Seiten nur bei eigenständiger Suchintention, klarer Nutzeraufgabe und nachgewiesenem Information Gain vorsehen.",\n  validate:\n    "Zuerst Go/No-Go anhand strategischer Nähe, belastbarer Nachfrage- und Repository-Signale, Produktbreite, Sicherheit und kommerzieller Eignung entscheiden.",\n};\n\nconst baseContext = (\n  opportunity: Opportunity,\n  cluster: Cluster | undefined,\n) => {\n  const mode = profileForOpportunity(opportunity);\n  const clusterLabel = cluster?.label ?? opportunity.cluster;\n  const documents = listDocuments(cluster);\n  const gaps = cluster?.gaps ?? [];\n\n  return {\n    mode,\n    clusterLabel,\n    documents,\n    guides: listDocuments(cluster, "page"),\n    comparisons: listDocuments(cluster, "comparison"),\n    products: listDocuments(cluster, "product"),\n    manufacturers: listDocuments(cluster, "manufacturer"),\n    gaps,\n    facts: unique([\n      `Roadmap-Chance: ${opportunity.title}`,\n      `Themencluster: ${clusterLabel}`,\n      `Priorität: ${opportunity.priority}`,\n      `Impact: ${opportunity.impact}/100`,\n      `Geschätzter Aufwand: ${opportunity.effort}`,\n      `Begründung: ${opportunity.reason}`,\n      `Vorgeschlagene Aktion: ${opportunity.action}`,\n      cluster\n        ? `Cluster-Stand: Score ${cluster.score}/100, Status ${cluster.status}, Linkabdeckung ${cluster.linkCoverage} %.`\n        : "Cluster-Detaildaten vor der Arbeit aus dem Repository neu laden.",\n      cluster\n        ? `Bestand: ${cluster.counts.pages} Ratgeber/Hubs, ${cluster.counts.comparisons} Vergleiche, ${cluster.counts.products} Produkte, ${cluster.counts.manufacturers} Hersteller.`\n        : "",\n      `Strategische Regel: ${modeRule[mode]}`,\n      ...gaps.map((gap) => `Offene Cluster-Lücke: ${gap}`),\n    ]),\n  };\n};\n\nconst section = (title: string, values: string[], fallback = "Keine") =>\n  `${title}:\\n${values.length ? values.map((value) => `- ${value}`).join("\\n") : `- ${fallback}`}`;\n\nconst routeMatrixInstruction = [\n  "Erstelle für jede tatsächlich relevante Route eine kompakte Intent-Matrix mit:",\n  "- Route oder Repository-Datei",\n  "- aktuelle Nutzer- und Suchintention",\n  "- Soll-Intent",\n  "- aktueller Intent-Owner",\n  "- Überschneidung oder Kannibalisierungsrisiko",\n  "- Entscheidung: behalten, schärfen, zusammenführen, Journey neu ordnen, neu anlegen oder verwerfen",\n  "- konkrete Änderung",\n  "- Abhängigkeiten",\n  "- objektives Akzeptanzkriterium",\n];\n\nconst sharedRoadmapPrompt = (\n  opportunity: Opportunity,\n  cluster: Cluster | undefined,\n): string => {\n  const context = baseContext(opportunity, cluster);\n\n  return [\n    "Projekt: Yushamon/affiliate-template",\n    "Projektpfad: apps/pfotentechnik",\n    "",\n    "AUFGABE",\n    `Topical-Authority-Roadmap für „${opportunity.title}“`,\n    "",\n    "ZIEL",\n    "Prüfe den aktuellen Repository-Bestand, kläre Intent-Ownership und leite eine kleine, entscheidungsreife Roadmap ab. Keine generische Produktrecherche und keine automatische Seitenerweiterung.",\n    "",\n    section("Bestätigter Repository-Kontext", context.facts),\n    section("Vorhandene Ratgeber und Hubs", context.guides),\n    section("Vorhandene Vergleiche", context.comparisons),\n    section("Vorhandene Produkte", context.products),\n    section("Vorhandene Hersteller", context.manufacturers),\n    "",\n    "PRÜFREIHENFOLGE",\n    "1. Aktuellen Repository-Stand und vorhandene Search-Daten prüfen.",\n    "2. Tatsächliche Intent-Owner und Überschneidungen bestimmen.",\n    "3. Zwischen aktualisieren, konsolidieren, Journey schließen, neu anlegen und bewusst verwerfen unterscheiden.",\n    "4. Abhängigkeiten und Reihenfolge festlegen.",\n    "5. Maximal drei kleine naheliegende Verbesserungen im selben Cluster aufnehmen.",\n    "",\n    ...routeMatrixInstruction,\n    "",\n    "GRENZEN",\n    "- Kein Produkt-Schema prüfen, sofern keine konkrete Produktdatei betroffen ist.",\n    "- Keine Hersteller-, Händler-, Nachfolger- oder Modellrecherche ohne konkrete offene Produktfrage.",\n    "- Keine Bildanforderungen.",\n    "- Keine neue Seite nur wegen Sollzahlen, Keyword-Nähe oder formaler Cluster-Lücke.",\n    "- Keine künstlichen internen Links.",\n    "- Unsichere Punkte als offene Frage markieren.",\n    "",\n    "VALIDIERUNG",\n    "- npm --workspace apps/pfotentechnik run audit:topical-authority:strict",\n    "- npm --workspace apps/pfotentechnik run audit:decision-journeys:strict",\n    "- npm --workspace apps/pfotentechnik run audit:internal-link-health:strict",\n    "- npm --workspace apps/pfotentechnik run audit:content-quality:strict",\n    "- npm --workspace apps/pfotentechnik run build",\n  ].join("\\n");\n};\n\nexport const buildTopicalAuthorityRoadmapPrompts = (\n  opportunity: Opportunity,\n  cluster?: Cluster,\n): TopicalAuthorityRoadmapPromptPair => {\n  const shared = sharedRoadmapPrompt(opportunity, cluster);\n\n  const chatgpt = [\n    shared,\n    "",\n    "AUSGABE FÜR CHATGPT",\n    "Liefere ausschließlich die Analyse und eine entscheidungsreife Roadmap.",\n    "Ändere keine Dateien.",\n    "Ordne die Maßnahmen in Phase 1 bis Phase 4.",\n    "Begründe ausdrücklich, welche Seiten nicht verändert oder nicht neu angelegt werden sollten.",\n    "Nenne für jede Maßnahme Nutzerproblem, Zielroute oder Datei, Abhängigkeit und prüfbares Ergebnis.",\n  ].join("\\n");\n\n  const codex = [\n    shared,\n    "",\n    "AUSGABE FÜR CODEX",\n    "Arbeite die bestätigte Roadmap direkt im Repository ab.",\n    "Erstelle einen konfliktarmen, wiederholbaren Installer-Patch im Ordner 3.",\n    "Behebe Ursachen zentral und verwende bestehende Komponenten, Datenmodelle und Journey-Logik.",\n    "Ändere nur Dateien, die aus der Intent-Matrix und der bestätigten Roadmap folgen.",\n    "Führe alle genannten Prüfungen und den Build aus.",\n    "Dokumentiere geänderte Dateien, Intent-Entscheidungen, zusammengeführte oder bewusst unveränderte Seiten und verbleibende Grenzen.",\n  ].join("\\n");\n\n  return { chatgpt, codex };\n};\n';
const testContent = 'import fs from "node:fs";\nimport path from "node:path";\nimport test from "node:test";\nimport assert from "node:assert/strict";\nimport { fileURLToPath } from "node:url";\n\nconst appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");\nconst read = (relative) => fs.readFileSync(path.join(appRoot, relative), "utf8");\n\ntest("Roadmap-Prompts sind von generischen Produkt- und Research-Prompts entkoppelt", () => {\n  const source = read("src/lib/seo/topical-authority/roadmap-prompts.ts");\n\n  assert.doesNotMatch(source, /buildChatGptPrompt/);\n  assert.doesNotMatch(source, /buildCodexPrompt/);\n  assert.doesNotMatch(source, /PRODUCT_SCHEMA_PATH|product\\.ts/);\n  assert.doesNotMatch(source, /Händlerangaben|Nachfolger|Produktdatei/);\n  assert.match(source, /sharedRoadmapPrompt/);\n  assert.match(source, /Intent-Matrix/);\n});\n\ntest("Roadmap-Prompt verlangt klare Entscheidung pro Route", () => {\n  const source = read("src/lib/seo/topical-authority/roadmap-prompts.ts");\n\n  for (const marker of [\n    "aktuelle Nutzer- und Suchintention",\n    "Soll-Intent",\n    "aktueller Intent-Owner",\n    "Kannibalisierungsrisiko",\n    "behalten, schärfen, zusammenführen",\n    "Abhängigkeiten",\n    "objektives Akzeptanzkriterium",\n  ]) {\n    assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")));\n  }\n});\n\ntest("ChatGPT und Codex erhalten getrennte, passende Arbeitsaufträge", () => {\n  const source = read("src/lib/seo/topical-authority/roadmap-prompts.ts");\n\n  assert.match(source, /AUSGABE FÜR CHATGPT/);\n  assert.match(source, /Ändere keine Dateien/);\n  assert.match(source, /AUSGABE FÜR CODEX/);\n  assert.match(source, /Installer-Patch im Ordner 3/);\n});\n';

const changes = [];
if (original !== moduleContent) changes.push([MODULE, moduleContent]);
if (!fs.existsSync(TEST) || fs.readFileSync(TEST, "utf8") !== testContent) changes.push([TEST, testContent]);

if (checkOnly) {
  console.log(`[${NAME}] Vorprüfung bestanden.`);
  console.log(`[${NAME}] Zu ändernde Dateien: ${changes.length}`);
  for (const [file] of changes) console.log(`- ${path.relative(ROOT, file)}`);
  process.exit(0);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(ROOT, ".patch-backups", `${NAME}-${timestamp}`);

for (const [file, content] of changes) {
  if (fs.existsSync(file)) {
    const backup = path.join(backupRoot, path.relative(ROOT, file));
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(file, backup);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
  console.log(`[${NAME}] Geschrieben: ${path.relative(ROOT, file)}`);
}
if (changes.length) console.log(`[${NAME}] Backup: ${path.relative(ROOT, backupRoot)}`);

execFileSync(process.execPath, [
  "--experimental-strip-types",
  "--test",
  "apps/pfotentechnik/test/topical-authority-roadmap-prompt-separation-1.1.0.test.mjs",
  "apps/pfotentechnik/test/topical-authority-roadmap-prompts-1.0.1.test.mjs",
  "apps/pfotentechnik/test/topical-authority-center.test.mjs"
], { cwd: ROOT, stdio: "inherit" });

const runNpm = (script) => {
  if (process.platform === "win32") {
    execFileSync("cmd.exe", ["/d", "/s", "/c", `npm --workspace apps/pfotentechnik run ${script}`], { cwd: ROOT, stdio: "inherit" });
  } else {
    execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", script], { cwd: ROOT, stdio: "inherit" });
  }
};

runNpm("audit:topical-authority:strict");
if (runBuild) runNpm("build");

console.log(`[${NAME}] Fertig.`);
