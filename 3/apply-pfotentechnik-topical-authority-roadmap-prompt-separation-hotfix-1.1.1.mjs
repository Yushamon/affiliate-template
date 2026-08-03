#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-topical-authority-roadmap-prompt-separation-hotfix-1.1.1";
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
const TEST = path.join(ROOT, "apps", "pfotentechnik", "test", "topical-authority-roadmap-prompt-separation-1.1.1.test.mjs");

if (!fs.existsSync(MODULE)) throw new Error("roadmap-prompts.ts nicht gefunden.");

const moduleContent = "import type {\n  Cluster,\n  Opportunity,\n} from \"./loadTopicalAuthority.ts\";\n\nexport const TOPICAL_AUTHORITY_ROADMAP_PROMPTS_VERSION = \"1.1.1\";\n\ntype RoadmapMode = \"consolidate\" | \"journey\" | \"expand\" | \"validate\";\n\ntype RoadmapProfile = {\n  mode: RoadmapMode;\n  rule: string;\n};\n\nexport type TopicalAuthorityRoadmapPromptPair = {\n  chatgpt: string;\n  codex: string;\n};\n\nconst ROADMAP_PROFILES: RoadmapProfile[] = [\n  {\n    mode: \"consolidate\",\n    rule:\n      \"Bestehende Intent-Owner, \u00dcberschneidungen und Kannibalisierungsrisiken zuerst kl\u00e4ren. Konsolidieren und Sch\u00e4rfen hat Vorrang vor neuen Seiten.\",\n  },\n  {\n    mode: \"journey\",\n    rule:\n      \"Die Nutzerreise innerhalb des Clusters pr\u00fcfen und nur fachlich nat\u00fcrliche \u00dcberg\u00e4nge zwischen Hub, Ratgeber, Vergleich, Produkt und Hersteller erg\u00e4nzen.\",\n  },\n  {\n    mode: \"expand\",\n    rule:\n      \"Neue Seiten nur bei eigenst\u00e4ndiger Suchintention, klarer Nutzeraufgabe und nachgewiesenem Information Gain vorsehen.\",\n  },\n  {\n    mode: \"validate\",\n    rule:\n      \"Zuerst Go/No-Go anhand strategischer N\u00e4he, belastbarer Nachfrage- und Repository-Signale, Produktbreite, Sicherheit und kommerzieller Eignung entscheiden.\",\n  },\n];\n\nconst unique = (values: string[], max = 50): string[] =>\n  [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, max);\n\nconst profileForOpportunity = (opportunity: Opportunity): RoadmapProfile => {\n  const text = `${opportunity.id} ${opportunity.title}`.toLowerCase();\n\n  if (\n    opportunity.id.startsWith(\"link-\") ||\n    /journey|kaufnah|commercial/.test(text)\n  ) {\n    return ROADMAP_PROFILES.find((profile) => profile.mode === \"journey\")!;\n  }\n\n  if (opportunity.id.startsWith(\"validate-\")) {\n    return ROADMAP_PROFILES.find((profile) => profile.mode === \"validate\")!;\n  }\n\n  if (/consolidate|konsolidier/.test(text)) {\n    return ROADMAP_PROFILES.find((profile) => profile.mode === \"consolidate\")!;\n  }\n\n  return ROADMAP_PROFILES.find((profile) => profile.mode === \"expand\")!;\n};\n\nconst listDocuments = (\n  cluster: Cluster | undefined,\n  type?: Cluster[\"documents\"][number][\"type\"],\n): string[] =>\n  (cluster?.documents ?? [])\n    .filter((document) => !type || document.type === type)\n    .map((document) => `${document.title} \u2013 ${document.route}`)\n    .slice(0, 40);\n\nconst section = (\n  title: string,\n  values: string[],\n  fallback = \"Keine\",\n): string =>\n  `${title}:\\n${\n    values.length\n      ? values.map((value) => `- ${value}`).join(\"\\n\")\n      : `- ${fallback}`\n  }`;\n\nconst buildSharedRoadmapPrompt = (\n  opportunity: Opportunity,\n  cluster: Cluster | undefined,\n): string => {\n  const profile = profileForOpportunity(opportunity);\n  const clusterLabel = cluster?.label ?? opportunity.cluster;\n  const gaps = cluster?.gaps ?? [];\n\n  const facts = unique([\n    `Roadmap-Chance: ${opportunity.title}`,\n    `Themencluster: ${clusterLabel}`,\n    `Priorit\u00e4t: ${opportunity.priority}`,\n    `Impact: ${opportunity.impact}/100`,\n    `Gesch\u00e4tzter Aufwand: ${opportunity.effort}`,\n    `Begr\u00fcndung: ${opportunity.reason}`,\n    `Vorgeschlagene Aktion: ${opportunity.action}`,\n    cluster\n      ? `Cluster-Stand: Score ${cluster.score}/100, Status ${cluster.status}, Linkabdeckung ${cluster.linkCoverage} %.`\n      : \"Cluster-Detaildaten vor der Arbeit aus dem Repository neu laden.\",\n    cluster\n      ? `Bestand: ${cluster.counts.pages} Ratgeber/Hubs, ${cluster.counts.comparisons} Vergleiche, ${cluster.counts.products} Produkte, ${cluster.counts.manufacturers} Hersteller.`\n      : \"\",\n    `Strategische Regel: ${profile.rule}`,\n    ...gaps.map((gap) => `Offene Cluster-L\u00fccke: ${gap}`),\n  ]);\n\n  const routeMatrixInstruction = [\n    \"Erstelle f\u00fcr jede tats\u00e4chlich relevante Route eine kompakte Intent-Matrix mit:\",\n    \"- Route oder Repository-Datei\",\n    \"- aktuelle Nutzer- und Suchintention\",\n    \"- Soll-Intent\",\n    \"- aktueller Intent-Owner\",\n    \"- \u00dcberschneidung oder Kannibalisierungsrisiko\",\n    \"- Entscheidung: behalten, sch\u00e4rfen, zusammenf\u00fchren, Journey neu ordnen, neu anlegen oder verwerfen\",\n    \"- konkrete \u00c4nderung\",\n    \"- Abh\u00e4ngigkeiten\",\n    \"- objektives Akzeptanzkriterium\",\n  ];\n\n  return [\n    \"Projekt: Yushamon/affiliate-template\",\n    \"Projektpfad: apps/pfotentechnik\",\n    \"\",\n    \"AUFGABE\",\n    `Topical-Authority-Roadmap f\u00fcr \u201e${opportunity.title}\u201c`,\n    \"\",\n    \"ZIEL\",\n    \"Pr\u00fcfe den aktuellen Repository-Bestand, kl\u00e4re Intent-Ownership und leite eine kleine, entscheidungsreife Roadmap ab. Keine generische Produktrecherche und keine automatische Seitenerweiterung.\",\n    \"\",\n    section(\"Best\u00e4tigter Repository-Kontext\", facts),\n    section(\"Vorhandene Ratgeber und Hubs\", listDocuments(cluster, \"page\")),\n    section(\"Vorhandene Vergleiche\", listDocuments(cluster, \"comparison\")),\n    section(\"Vorhandene Produkte\", listDocuments(cluster, \"product\")),\n    section(\"Vorhandene Hersteller\", listDocuments(cluster, \"manufacturer\")),\n    \"\",\n    \"PR\u00dcFREIHENFOLGE\",\n    \"1. Aktuellen Repository-Stand und vorhandene Search-Daten pr\u00fcfen.\",\n    \"2. Tats\u00e4chliche Intent-Owner und \u00dcberschneidungen bestimmen.\",\n    \"3. Zwischen aktualisieren, konsolidieren, Journey schlie\u00dfen, neu anlegen und bewusst verwerfen unterscheiden.\",\n    \"4. Abh\u00e4ngigkeiten und Reihenfolge festlegen.\",\n    \"5. Maximal drei kleine naheliegende Verbesserungen im selben Cluster aufnehmen.\",\n    \"\",\n    ...routeMatrixInstruction,\n    \"\",\n    \"GRENZEN\",\n    \"- Keine schematische Produktpr\u00fcfung ohne konkrete betroffene Produktseite.\",\n    \"- Keine externe Produkt- oder Marktpr\u00fcfung ohne konkrete offene Produktfrage.\",\n    \"- Keine Bildanforderungen.\",\n    \"- Keine neue Seite nur wegen Sollzahlen, Keyword-N\u00e4he oder formaler Cluster-L\u00fccke.\",\n    \"- Keine k\u00fcnstlichen internen Links.\",\n    \"- Unsichere Punkte als offene Frage markieren.\",\n    \"\",\n    \"VALIDIERUNG\",\n    \"- npm --workspace apps/pfotentechnik run audit:topical-authority:strict\",\n    \"- npm --workspace apps/pfotentechnik run audit:decision-journeys:strict\",\n    \"- npm --workspace apps/pfotentechnik run audit:internal-link-health:strict\",\n    \"- npm --workspace apps/pfotentechnik run audit:content-quality:strict\",\n    \"- npm --workspace apps/pfotentechnik run build\",\n  ].join(\"\\n\");\n};\n\nconst buildChatGptPrompt = (\n  opportunity: Opportunity,\n  cluster: Cluster | undefined,\n): string => [\n  buildSharedRoadmapPrompt(opportunity, cluster),\n  \"\",\n  \"AUSGABE F\u00dcR CHATGPT\",\n  \"Liefere ausschlie\u00dflich die Analyse und eine entscheidungsreife Roadmap.\",\n  \"\u00c4ndere keine Dateien.\",\n  \"Ordne die Ma\u00dfnahmen in Phase 1 bis Phase 4.\",\n  \"Begr\u00fcnde ausdr\u00fccklich, welche Seiten nicht ver\u00e4ndert oder nicht neu angelegt werden sollten.\",\n  \"Nenne f\u00fcr jede Ma\u00dfnahme Nutzerproblem, Zielroute oder Datei, Abh\u00e4ngigkeit und pr\u00fcfbares Ergebnis.\",\n].join(\"\\n\");\n\nconst buildCodexPrompt = (\n  opportunity: Opportunity,\n  cluster: Cluster | undefined,\n): string => [\n  buildSharedRoadmapPrompt(opportunity, cluster),\n  \"\",\n  \"AUSGABE F\u00dcR CODEX\",\n  \"Arbeite die best\u00e4tigte Roadmap direkt im Repository ab.\",\n  \"Erstelle einen konfliktarmen, wiederholbaren Installer-Patch im Ordner 3.\",\n  \"Behebe Ursachen zentral und verwende bestehende Komponenten, Datenmodelle und Journey-Logik.\",\n  \"\u00c4ndere nur Dateien, die aus der Intent-Matrix und der best\u00e4tigten Roadmap folgen.\",\n  \"F\u00fchre alle genannten Pr\u00fcfungen und den Build aus.\",\n  \"Dokumentiere ge\u00e4nderte Dateien, Intent-Entscheidungen, zusammengef\u00fchrte oder bewusst unver\u00e4nderte Seiten und verbleibende Grenzen.\",\n].join(\"\\n\");\n\nexport const buildTopicalAuthorityRoadmapPrompts = (\n  opportunity: Opportunity,\n  cluster?: Cluster,\n): TopicalAuthorityRoadmapPromptPair => ({\n  chatgpt: buildChatGptPrompt(opportunity, cluster),\n  codex: buildCodexPrompt(opportunity, cluster),\n});\n";
const testContent = "import fs from \"node:fs\";\nimport path from \"node:path\";\nimport test from \"node:test\";\nimport assert from \"node:assert/strict\";\nimport { fileURLToPath } from \"node:url\";\n\nconst appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), \"..\");\nconst read = (relative) =>\n  fs.readFileSync(path.join(appRoot, relative), \"utf8\");\n\ntest(\"Roadmap-Prompts sind eigenst\u00e4ndig und frei von Produkt-Research-Ballast\", () => {\n  const source = read(\"src/lib/seo/topical-authority/roadmap-prompts.ts\");\n\n  assert.doesNotMatch(source, /PRODUCT_SCHEMA_PATH|src\\/content\\/schema\\/product\\.ts/);\n  assert.doesNotMatch(source, /H\u00e4ndlerangaben|Nachfolger|Produktdatei/);\n  assert.match(source, /buildSharedRoadmapPrompt/);\n  assert.match(source, /buildChatGptPrompt/);\n  assert.match(source, /buildCodexPrompt/);\n});\n\ntest(\"Roadmap-Prompt verlangt klare Entscheidung pro Route\", () => {\n  const source = read(\"src/lib/seo/topical-authority/roadmap-prompts.ts\");\n\n  for (const marker of [\n    \"aktuelle Nutzer- und Suchintention\",\n    \"Soll-Intent\",\n    \"aktueller Intent-Owner\",\n    \"Kannibalisierungsrisiko\",\n    \"behalten, sch\u00e4rfen, zusammenf\u00fchren\",\n    \"Abh\u00e4ngigkeiten\",\n    \"objektives Akzeptanzkriterium\",\n  ]) {\n    assert.ok(source.includes(marker), `Marker fehlt: ${marker}`);\n  }\n});\n\ntest(\"Roadmap-Profile decken alle vier Strategien ab\", () => {\n  const source = read(\"src/lib/seo/topical-authority/roadmap-prompts.ts\");\n\n  for (const mode of [\"consolidate\", \"journey\", \"expand\", \"validate\"]) {\n    assert.match(source, new RegExp(`mode: \"${mode}\"`));\n  }\n});\n\ntest(\"ChatGPT und Codex erhalten getrennte Aufgaben\", () => {\n  const source = read(\"src/lib/seo/topical-authority/roadmap-prompts.ts\");\n\n  assert.match(source, /AUSGABE F\u00dcR CHATGPT/);\n  assert.match(source, /\u00c4ndere keine Dateien/);\n  assert.match(source, /AUSGABE F\u00dcR CODEX/);\n  assert.match(source, /Installer-Patch im Ordner 3/);\n});\n";
const changes = [];

if (fs.readFileSync(MODULE, "utf8") !== moduleContent) changes.push([MODULE, moduleContent]);
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
  "apps/pfotentechnik/test/topical-authority-roadmap-prompt-separation-1.1.1.test.mjs",
  "apps/pfotentechnik/test/topical-authority-roadmap-prompts-1.0.1.test.mjs",
  "apps/pfotentechnik/test/topical-authority-center.test.mjs"
], { cwd: ROOT, stdio: "inherit" });

const runNpm = (script) => {
  if (process.platform === "win32") {
    execFileSync("cmd.exe", ["/d", "/s", "/c", `npm --workspace apps/pfotentechnik run ${script}`], {
      cwd: ROOT,
      stdio: "inherit"
    });
  } else {
    execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", script], {
      cwd: ROOT,
      stdio: "inherit"
    });
  }
};

runNpm("audit:topical-authority:strict");
if (runBuild) runNpm("build");

console.log(`[${NAME}] Fertig.`);
