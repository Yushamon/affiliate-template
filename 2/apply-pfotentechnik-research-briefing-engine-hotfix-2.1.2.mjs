#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-research-briefing-engine-hotfix-2.1.2";
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const runTests = !args.has("--no-tests");

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
const SCHEMA = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "src",
  "lib",
  "seo",
  "research",
  "schema.ts"
);
const TEST = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "test",
  "seo-research-briefing-engine-hotfix-2.1.2.test.mjs"
);

if (!fs.existsSync(SCHEMA)) {
  throw new Error("Research-Schema nicht gefunden.");
}

const original = fs.readFileSync(SCHEMA, "utf8");

if (!original.includes("implementationBrief:implementationBrief(")) {
  throw new Error("Der fehlerhafte 2.1.1-Stand wurde nicht erkannt: Import-Aufruf fehlt.");
}

if (!original.includes("export interface ResearchImplementationBrief")) {
  throw new Error("ResearchImplementationBrief-Interface fehlt. Bitte zuerst den Stand prüfen.");
}

const helper = `const implementationBrief=(v:unknown,f:string):ResearchImplementationBrief|undefined=>{
 if(!record(v))return;
 return{
  goal:text(v.goal,\`\${f}.goal\`),
  problem:text(v.problem,\`\${f}.problem\`),
  userValue:text(v.userValue,\`\${f}.userValue\`),
  implementation:strings(v.implementation),
  files:strings(v.files),
  doNotChange:strings(v.doNotChange),
  acceptanceCriteria:strings(v.acceptanceCriteria),
  verification:strings(v.verification)
 };
};

`;

let next = original;
const hasRuntimeHelper = /const\s+implementationBrief\s*=\s*\(/.test(next);

if (!hasRuntimeHelper) {
  const anchor = "export const normalizeResearchStore=";
  const index = next.indexOf(anchor);

  if (index < 0) {
    throw new Error("Einfügeposition vor normalizeResearchStore wurde nicht gefunden.");
  }

  next = next.slice(0, index) + helper + next.slice(index);
}

const helperMatches = next.match(/const\s+implementationBrief\s*=\s*\(/g) ?? [];
if (helperMatches.length !== 1) {
  throw new Error(`Unerwartete Anzahl implementationBrief-Helper: ${helperMatches.length}`);
}

const helperIndex = next.indexOf("const implementationBrief=");
const normalizeIndex = next.indexOf("export const normalizeResearchStore=");
if (helperIndex < 0 || normalizeIndex < 0 || helperIndex > normalizeIndex) {
  throw new Error("implementationBrief muss vor normalizeResearchStore definiert sein.");
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const schemaUrl = pathToFileURL(
  path.join(ROOT, "apps", "pfotentechnik", "src", "lib", "seo", "research", "schema.ts")
).href;

test("implementationBrief ist zur Laufzeit definiert und optional", async () => {
  const { normalizeResearchStore } = await import(schemaUrl + "?hotfix=2.1.2");

  const normalized = normalizeResearchStore({
    version: 2,
    updatedAt: "2026-08-02T00:00:00.000Z",
    provider: "test",
    scope: ["test"],
    items: [{
      id: "belegtes-produkt",
      type: "product",
      title: "Belegtes Produkt",
      status: "open",
      priority: 80,
      confidence: 90,
      reason: "Belegte Produktchance.",
      actions: [],
      evidence: [{
        source: "Hersteller",
        note: "Offizielle Produktangabe."
      }],
      discoveredAt: "2026-08-02T00:00:00.000Z",
      lastConfirmedAt: "2026-08-02T00:00:00.000Z"
    }]
  });

  assert.equal(normalized.items.length, 1);
  assert.equal(normalized.items[0].implementationBrief, undefined);
});

test("implementationBrief wird vollständig normalisiert", async () => {
  const { normalizeResearchStore } = await import(schemaUrl + "?hotfix=2.1.2-brief");

  const normalized = normalizeResearchStore({
    version: 2,
    updatedAt: "2026-08-02T00:00:00.000Z",
    provider: "test",
    scope: ["test"],
    items: [{
      id: "briefing",
      type: "content-refresh",
      title: "Briefing",
      status: "open",
      priority: 80,
      confidence: 90,
      reason: "Belegte Verbesserung.",
      implementationBrief: {
        goal: "Ziel",
        problem: "Problem",
        userValue: "Nutzen",
        implementation: ["Änderung"],
        files: ["datei.ts"],
        doNotChange: ["Score"],
        acceptanceCriteria: ["Kriterium"],
        verification: ["Build"]
      },
      actions: [],
      evidence: [{
        source: "Quelle",
        note: "Beleg."
      }],
      discoveredAt: "2026-08-02T00:00:00.000Z",
      lastConfirmedAt: "2026-08-02T00:00:00.000Z"
    }]
  });

  assert.equal(normalized.items[0].implementationBrief?.goal, "Ziel");
  assert.deepEqual(normalized.items[0].implementationBrief?.verification, ["Build"]);
});
`;

if (checkOnly) {
  console.log(`[${NAME}] Vorprüfung bestanden.`);
  console.log(
    hasRuntimeHelper
      ? `[${NAME}] Laufzeit-Helper ist bereits vorhanden.`
      : `[${NAME}] Fehlender Laufzeit-Helper kann sicher ergänzt werden.`
  );
  process.exit(0);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(ROOT, ".patch-backups", `${NAME}-${timestamp}`);

if (next !== original) {
  const backup = path.join(backupRoot, path.relative(ROOT, SCHEMA));
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(SCHEMA, backup);
  fs.writeFileSync(SCHEMA, next, "utf8");
  console.log(`[${NAME}] Geändert: ${path.relative(ROOT, SCHEMA)}`);
  console.log(`[${NAME}] Backup: ${path.relative(ROOT, backupRoot)}`);
} else {
  console.log(`[${NAME}] Schema ist bereits aktuell.`);
}

fs.mkdirSync(path.dirname(TEST), { recursive: true });
fs.writeFileSync(TEST, testSource, "utf8");
console.log(`[${NAME}] Geschrieben: ${path.relative(ROOT, TEST)}`);

if (runTests) {
  execFileSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--test",
      "apps/pfotentechnik/test/seo-research-briefing-engine-hotfix-2.1.2.test.mjs",
      "apps/pfotentechnik/test/seo-research-briefing-engine-2.1.1.test.mjs",
      "apps/pfotentechnik/test/seo-research-engine-2.0.0.test.mjs",
      "apps/pfotentechnik/test/seo-research-engine.test.mjs"
    ],
    { cwd: ROOT, stdio: "inherit" }
  );

  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  execFileSync(
    npm,
    ["--workspace", "apps/pfotentechnik", "run", "research:check"],
    { cwd: ROOT, stdio: "inherit" }
  );
}

console.log(`[${NAME}] Fertig.`);
