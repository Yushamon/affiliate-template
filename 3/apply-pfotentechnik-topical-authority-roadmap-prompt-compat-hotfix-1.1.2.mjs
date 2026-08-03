#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-topical-authority-roadmap-prompt-compat-hotfix-1.1.2";
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
const MODULE = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "src",
  "lib",
  "seo",
  "topical-authority",
  "roadmap-prompts.ts"
);
const TEST = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "test",
  "topical-authority-roadmap-prompt-compat-1.1.2.test.mjs"
);

if (!fs.existsSync(MODULE)) throw new Error("roadmap-prompts.ts nicht gefunden.");

const original = fs.readFileSync(MODULE, "utf8");

for (const marker of [
  "buildTopicalAuthorityRoadmapPrompts",
  "buildChatGptPrompt",
  "buildCodexPrompt",
  'mode: "consolidate"',
  'mode: "journey"',
  'mode: "expand"',
  'mode: "validate"',
]) {
  if (!original.includes(marker)) {
    throw new Error(`Erwartete Roadmap-Prompt-Struktur fehlt: ${marker}`);
  }
}

let next = original;

if (!next.includes("TOPICAL-AUTHORITY-ROADMAP")) {
  const needle = '    "AUFGABE",\n';
  if (!next.includes(needle)) {
    throw new Error("Einfügeposition für TOPICAL-AUTHORITY-ROADMAP fehlt.");
  }
  next = next.replace(
    needle,
    '    "TOPICAL-AUTHORITY-ROADMAP",\n    "",\n    "AUFGABE",\n',
  );
}

next = next.replace(
  "Konsolidieren und Schärfen hat Vorrang vor neuen Seiten.",
  "Konsolidieren und schärfen hat Vorrang vor neuen Seiten.",
);

next = next.replace(
  "Maximal drei kleine naheliegende Verbesserungen im selben Cluster aufnehmen.",
  "Maximal drei einfache naheliegende Verbesserungen im selben Cluster aufnehmen.",
);

for (const marker of [
  "TOPICAL-AUTHORITY-ROADMAP",
  "Konsolidieren und schärfen hat Vorrang vor neuen Seiten",
  "Maximal drei einfache naheliegende Verbesserungen",
  "Installer-Patch im Ordner 3",
]) {
  if (!next.includes(marker)) {
    throw new Error(`Kompatibilitätsmarker fehlt nach Patch: ${marker}`);
  }
}

const testSource = `import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(
  appRoot,
  "src",
  "lib",
  "seo",
  "topical-authority",
  "roadmap-prompts.ts"
);

test("Roadmap-Prompt erfüllt alte und neue Verträge gleichzeitig", () => {
  const source = fs.readFileSync(file, "utf8");

  for (const marker of [
    "buildTopicalAuthorityRoadmapPrompts",
    "buildChatGptPrompt",
    "buildCodexPrompt",
    "TOPICAL-AUTHORITY-ROADMAP",
    "Installer-Patch im Ordner 3",
    "Maximal drei einfache naheliegende Verbesserungen",
    "Konsolidieren und schärfen hat Vorrang vor neuen Seiten",
    'mode: "consolidate"',
    'mode: "journey"',
    'mode: "expand"',
    'mode: "validate"',
  ]) {
    assert.ok(source.includes(marker), \`Marker fehlt: \${marker}\`);
  }
});

test("Produkt-Research-Ballast bleibt ausgeschlossen", () => {
  const source = fs.readFileSync(file, "utf8");

  assert.doesNotMatch(source, /PRODUCT_SCHEMA_PATH|src\\/content\\/schema\\/product\\.ts/);
  assert.doesNotMatch(source, /Händlerangaben|Nachfolger|Produktdatei/);
});
`;

const changes = [];
if (next !== original) changes.push([MODULE, next]);
if (!fs.existsSync(TEST) || fs.readFileSync(TEST, "utf8") !== testSource) {
  changes.push([TEST, testSource]);
}

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

if (changes.length) {
  console.log(`[${NAME}] Backup: ${path.relative(ROOT, backupRoot)}`);
}

execFileSync(
  process.execPath,
  [
    "--experimental-strip-types",
    "--test",
    "apps/pfotentechnik/test/topical-authority-roadmap-prompt-compat-1.1.2.test.mjs",
    "apps/pfotentechnik/test/topical-authority-roadmap-prompt-separation-1.1.1.test.mjs",
    "apps/pfotentechnik/test/topical-authority-roadmap-prompts-1.0.1.test.mjs",
    "apps/pfotentechnik/test/topical-authority-center.test.mjs",
  ],
  { cwd: ROOT, stdio: "inherit" },
);

const runNpm = (script) => {
  if (process.platform === "win32") {
    execFileSync(
      "cmd.exe",
      ["/d", "/s", "/c", `npm --workspace apps/pfotentechnik run ${script}`],
      { cwd: ROOT, stdio: "inherit" },
    );
  } else {
    execFileSync(
      "npm",
      ["--workspace", "apps/pfotentechnik", "run", script],
      { cwd: ROOT, stdio: "inherit" },
    );
  }
};

runNpm("audit:topical-authority:strict");
if (runBuild) runNpm("build");

console.log(`[${NAME}] Fertig.`);
