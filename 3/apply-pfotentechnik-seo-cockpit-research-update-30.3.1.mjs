#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PATCH = "pfotentechnik-seo-cockpit-research-update-30.3.1";

function findRepoRoot(start) {
  let directory = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(directory, "apps", "pfotentechnik", "package.json"))) {
      return directory;
    }
    const parent = path.dirname(directory);
    if (parent === directory) {
      throw new Error("Repository-Root konnte nicht gefunden werden.");
    }
    directory = parent;
  }
}

const scriptFile = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptFile);
const ROOT = findRepoRoot(scriptDirectory);
const APP = path.join(ROOT, "apps", "pfotentechnik");
const STORE = path.join(APP, "research", "research.json");
const SCHEMA = path.join(APP, "src", "lib", "seo", "research", "schema.ts");
const PACKAGE = path.join(APP, "package.json");
const TEST = path.join(APP, "test", "seo-cockpit-research-update-30.3.1.test.mjs");
const IMPORT_DIR = path.join(APP, "research", "imports");
const IMPORT_TARGET = path.join(IMPORT_DIR, "weekly-2026-08-06.json");
const PAYLOAD_CANDIDATES = [
  path.join(scriptDirectory, "pfotentechnik-research-weekly-2026-08-06.json"),
  path.join(ROOT, "3", "pfotentechnik-research-weekly-2026-08-06.json")
];
const PAYLOAD = PAYLOAD_CANDIDATES.find((file) => fs.existsSync(file));
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const log = (message) => console.log(`[${PATCH}] ${message}`);

function assertFile(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Erwartete Datei fehlt: ${path.relative(ROOT, file)}`);
  }
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const target = path.join(BACKUP, path.relative(ROOT, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function writeFile(file, content) {
  const previous = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (previous === content) {
    log(`Bereits aktuell: ${path.relative(ROOT, file)}`);
    return false;
  }
  backup(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  log(`Geschrieben: ${path.relative(ROOT, file)}`);
  return true;
}

function insertBeforeOnce(source, marker, addition, label) {
  if (source.includes(addition.trim())) return source;
  const first = source.indexOf(marker);
  const last = source.lastIndexOf(marker);
  if (first < 0 || first !== last) {
    throw new Error(`${label}: Marker fehlt oder ist nicht eindeutig.`);
  }
  return source.slice(0, first) + addition + source.slice(first);
}

function replaceOnce(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  const first = source.indexOf(search);
  const last = source.lastIndexOf(search);
  if (first < 0 || first !== last) {
    throw new Error(`${label}: erwartete Struktur fehlt oder ist nicht eindeutig.`);
  }
  return source.slice(0, first) + replacement + source.slice(first + search.length);
}

function patchResearchSchema() {
  let source = fs.readFileSync(SCHEMA, "utf8");

  const visualInterface = `export interface ResearchVisualBrief {
  pageType:"product"|"comparison"|"guide"|"manufacturer"|"category"|"homepage"|"landingpage";
  subject:string;
  motifs:string[];
  styleNotes:string[];
  referenceUrls:string[];
}

`;

  source = insertBeforeOnce(
    source,
    "export interface ResearchImplementationBrief {",
    visualInterface,
    "ResearchVisualBrief"
  );

  source = replaceOnce(
    source,
    "actionBundle?:ResearchActionBundle; implementationBrief?:ResearchImplementationBrief;",
    "actionBundle?:ResearchActionBundle; visualBrief?:ResearchVisualBrief; implementationBrief?:ResearchImplementationBrief;",
    "ResearchItem.visualBrief"
  );

  const visualNormalizer = `const visualBrief=(v:unknown,f:string):ResearchVisualBrief|undefined=>{
 if(!record(v))return;
 const pageType=optionalText(v.pageType) as ResearchVisualBrief["pageType"]|undefined;
 const allowed=["product","comparison","guide","manufacturer","category","homepage","landingpage"];
 if(!pageType||!allowed.includes(pageType))throw new Error(\`\${f}.pageType ist ungültig.\`);
 return{
  pageType,
  subject:text(v.subject,\`\${f}.subject\`),
  motifs:strings(v.motifs),
  styleNotes:strings(v.styleNotes),
  referenceUrls:strings(v.referenceUrls)
 };
};

`;

  source = insertBeforeOnce(
    source,
    "const normalizeImplementationBrief=(v:unknown",
    visualNormalizer,
    "visualBrief-Normalisierung"
  );

  source = replaceOnce(
    source,
    "actionBundle:bundle(raw.actionBundle,`items[${index}].actionBundle`),implementationBrief:normalizeImplementationBrief(",
    "actionBundle:bundle(raw.actionBundle,`items[${index}].actionBundle`),visualBrief:visualBrief(raw.visualBrief,`items[${index}].visualBrief`),implementationBrief:normalizeImplementationBrief(",
    "visualBrief im Research-Item"
  );

  writeFile(SCHEMA, source);
}

function mergeResearchStore(incoming) {
  const previous = JSON.parse(fs.readFileSync(STORE, "utf8"));
  const previousItems = Array.isArray(previous.items) ? previous.items : [];
  const incomingItems = Array.isArray(incoming.items) ? incoming.items : [];

  const incomingById = new Map(incomingItems.map((item) => [item.id, item]));
  const mergedItems = previousItems.map((oldItem) => {
    const newItem = incomingById.get(oldItem.id);
    if (!newItem) return oldItem;
    incomingById.delete(oldItem.id);
    return {
      ...newItem,
      discoveredAt: oldItem.discoveredAt || newItem.discoveredAt,
      status: ["implemented", "rejected"].includes(oldItem.status)
        ? oldItem.status
        : newItem.status
    };
  });

  for (const item of incomingById.values()) {
    mergedItems.push(item);
  }

  const merged = {
    version: 2,
    updatedAt: new Date().toISOString(),
    provider: "manual-chatgpt",
    scope: [
      ...new Set([
        ...(Array.isArray(previous.scope) ? previous.scope : []),
        ...(Array.isArray(incoming.scope) ? incoming.scope : [])
      ])
    ],
    items: mergedItems
  };

  writeFile(STORE, JSON.stringify(merged, null, 2) + "\n");
  writeFile(IMPORT_TARGET, JSON.stringify(incoming, null, 2) + "\n");
}

function writeRegressionTest() {
  const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeResearchStore } from "../src/lib/seo/research/schema.ts";

function findRepoRoot(start) {
  let directory = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(directory, "apps", "pfotentechnik", "package.json"))) {
      return directory;
    }
    const parent = path.dirname(directory);
    if (parent === directory) throw new Error("Repository-Root fehlt.");
    directory = parent;
  }
}

const ROOT = findRepoRoot(path.dirname(fileURLToPath(import.meta.url)));
const STORE = path.join(ROOT, "apps", "pfotentechnik", "research", "research.json");
const IDS = [
  "tractive-gesundheitsfunktionen-2026-refresh",
  "automatische-katzentoiletten-kerncluster",
  "petkit-purobot-max-3-neues-produkt"
];

test("Die Wochenrunde ist vollständig und validierbar im Research-Store", () => {
  const raw = JSON.parse(fs.readFileSync(STORE, "utf8"));
  const normalized = normalizeResearchStore(raw);
  const byId = new Map(normalized.items.map((item) => [item.id, item]));

  for (const id of IDS) {
    const item = byId.get(id);
    assert.ok(item, id);
    assert.ok(item.implementationBrief?.goal, id + ": implementationBrief fehlt");
    assert.ok(item.visualBrief?.motifs?.length, id + ": visualBrief fehlt");
    assert.ok(item.evidence.length > 0, id + ": evidence fehlt");
  }
});

test("Der Research-Store enthält keine doppelten IDs", () => {
  const raw = JSON.parse(fs.readFileSync(STORE, "utf8"));
  const ids = raw.items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});
`;

  writeFile(TEST, testSource);
}

function patchPackageJson() {
  const data = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
  data.scripts ||= {};
  data.scripts["test:seo-cockpit-research-update"] =
    "node --test test/seo-cockpit-research-update-30.3.1.test.mjs";
  writeFile(PACKAGE, JSON.stringify(data, null, 2) + "\n");
}

function run(command, args) {
  log(`Prüfe: ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    windowsHide: true
  });
}

assertFile(STORE);
assertFile(SCHEMA);
assertFile(PACKAGE);
if (!PAYLOAD) {
  throw new Error(
    "Research-JSON fehlt. Lege pfotentechnik-research-weekly-2026-08-06.json neben den Installer oder gemeinsam unter 3/ ab."
  );
}

const incoming = JSON.parse(fs.readFileSync(PAYLOAD, "utf8"));

patchResearchSchema();
mergeResearchStore(incoming);
writeRegressionTest();
patchPackageJson();

run(process.execPath, ["--check", scriptFile]);
run("npm", [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "research:import",
  "--",
  "--check"
]);
run("npm", [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "test:seo-cockpit-research-update"
]);
run("npm", [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "build"
]);

log("SEO-Cockpit-Research erfolgreich aktualisiert.");
