#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-topical-authority-roadmap-prompts-hotfix-1.0.2";
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const runTests = !args.has("--no-tests");
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
const PAGE = path.join(ROOT, "apps", "pfotentechnik", "src", "pages", "admin", "seo", "topical-authority.astro");
const TEST = path.join(ROOT, "apps", "pfotentechnik", "test", "topical-authority-roadmap-prompts-hotfix-1.0.2.test.mjs");

if (!fs.existsSync(PAGE)) throw new Error("topical-authority.astro nicht gefunden.");
const original = fs.readFileSync(PAGE, "utf8");
if (!original.includes("roadmapOpportunities")) throw new Error("Roadmap-Prompt-Erweiterung wurde nicht erkannt.");

let next = original;
const rawOpportunityProperty = "opportunities: Array.isArray(loaded?.opportunities) ? loaded.opportunities : [],";
let fixedCircularReference = false;
for (const pattern of [/opportunities:\s*roadmapOpportunities\s*,/, /opportunities:\s*roadmapOpportunities\s*(?=\n|\r|\})/]) {
  if (pattern.test(next)) {
    next = next.replace(pattern, rawOpportunityProperty);
    fixedCircularReference = true;
    break;
  }
}

const dataStart = next.indexOf("const data =");
const dataEnd = next.indexOf("\n};", dataStart);
const declarationIndex = next.indexOf("const roadmapOpportunities");
if (dataStart < 0 || dataEnd < 0) throw new Error("Datenobjekt konnte nicht sicher erkannt werden.");
if (declarationIndex < 0) throw new Error("Deklaration von roadmapOpportunities fehlt.");
const dataBlock = next.slice(dataStart, dataEnd + 3);
if (/opportunities:\s*roadmapOpportunities/.test(dataBlock)) throw new Error("Zirkuläre Initialisierung ist nach dem Hotfix noch vorhanden.");
if (!dataBlock.includes(rawOpportunityProperty)) throw new Error("Das Datenobjekt nutzt nicht die unverarbeiteten Loader-Chancen.");
if (declarationIndex < dataEnd) throw new Error("roadmapOpportunities wird weiterhin vor Abschluss des data-Objekts deklariert.");

const testSource = `import test from "node:test";\nimport assert from "node:assert/strict";\nimport fs from "node:fs";\nimport path from "node:path";\nimport { fileURLToPath } from "node:url";\n\nconst ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");\nconst FILE = path.join(ROOT, "apps", "pfotentechnik", "src", "pages", "admin", "seo", "topical-authority.astro");\n\ntest("Roadmap-Prompts greifen erst nach Initialisierung der Rohdaten zu", () => {\n  const source = fs.readFileSync(FILE, "utf8");\n  const dataStart = source.indexOf("const data =");\n  const dataEnd = source.indexOf("\\n};", dataStart);\n  const roadmapDeclaration = source.indexOf("const roadmapOpportunities");\n  assert.ok(dataStart >= 0 && dataEnd > dataStart);\n  assert.ok(roadmapDeclaration > dataEnd);\n  const dataBlock = source.slice(dataStart, dataEnd + 3);\n  assert.doesNotMatch(dataBlock, /opportunities:\\s*roadmapOpportunities/);\n  assert.match(dataBlock, /opportunities:\\s*Array\\.isArray\\(loaded\\?\\.opportunities\\)\\s*\\?\\s*loaded\\.opportunities\\s*:\\s*\\[\\]/);\n});\n\ntest("Roadmap-Karten verwenden weiterhin die promptfähigen Opportunities", () => {\n  const source = fs.readFileSync(FILE, "utf8");\n  assert.match(source, /const roadmapOpportunities/);\n  assert.match(source, /roadmapOpportunities\\.map|roadmapOpportunities\\.length/);\n  assert.match(source, /ChatGPT-Roadmap kopieren/);\n  assert.match(source, /Codex-Umsetzung kopieren/);\n});\n`;

const testChanged = !fs.existsSync(TEST) || fs.readFileSync(TEST, "utf8") !== testSource;
const changed = next !== original || testChanged;
if (checkOnly) {
  console.log(`[${NAME}] Vorprüfung bestanden.`);
  console.log(`[${NAME}] Zirkuläre Initialisierung erkannt: ${fixedCircularReference ? "ja" : "nein"}`);
  console.log(`[${NAME}] Änderungen erforderlich: ${changed ? "ja" : "nein"}`);
  process.exit(0);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(ROOT, ".patch-backups", `${NAME}-${timestamp}`);
if (next !== original) {
  const backup = path.join(backupRoot, path.relative(ROOT, PAGE));
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(PAGE, backup);
  fs.writeFileSync(PAGE, next, "utf8");
  console.log(`[${NAME}] Geändert: ${path.relative(ROOT, PAGE)}`);
  console.log(`[${NAME}] Backup: ${path.relative(ROOT, backupRoot)}`);
} else {
  console.log(`[${NAME}] Seite ist bereits aktuell.`);
}
fs.mkdirSync(path.dirname(TEST), { recursive: true });
fs.writeFileSync(TEST, testSource, "utf8");
console.log(`[${NAME}] Geschrieben: ${path.relative(ROOT, TEST)}`);

if (runTests) {
  execFileSync(process.execPath, ["--test", "apps/pfotentechnik/test/topical-authority-roadmap-prompts-hotfix-1.0.2.test.mjs", "apps/pfotentechnik/test/topical-authority-center.test.mjs"], { cwd: ROOT, stdio: "inherit" });
  const audit = process.platform === "win32"
    ? ["cmd.exe", ["/d", "/s", "/c", "npm --workspace apps/pfotentechnik run audit:topical-authority:strict"]]
    : ["npm", ["--workspace", "apps/pfotentechnik", "run", "audit:topical-authority:strict"]];
  execFileSync(audit[0], audit[1], { cwd: ROOT, stdio: "inherit" });
}

if (runBuild) {
  const build = process.platform === "win32"
    ? ["cmd.exe", ["/d", "/s", "/c", "npm --workspace apps/pfotentechnik run build"]]
    : ["npm", ["--workspace", "apps/pfotentechnik", "run", "build"]];
  execFileSync(build[0], build[1], { cwd: ROOT, stdio: "inherit" });
}

console.log(`[${NAME}] Fertig.`);
