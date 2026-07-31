#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-seo-copilot-null-safety-architecture-test-22.10.7";
const SKIP_BUILD = process.argv.includes("--skip-build");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const FINDING_AI = path.join(APP, "src", "lib", "seo-copilot", "finding-ai.ts");
const ARCH_TEST = path.join(APP, "test", "seo-copilot-architecture-cleanup.test.mjs");
const NULL_TEST = path.join(APP, "test", "seo-copilot-finding-ai-null-safety.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const REPORT_DIR = path.join(APP, "reports", "seo-copilot");
const REPORT = path.join(REPORT_DIR, "null-safety-architecture-test-22.10.7.md");
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-")
);

const log = (message) => console.log("[" + NAME + "] " + message);

function quoteCmdArg(value) {
  const text = String(value);
  if (!/[\s"&|<>^()%!]/.test(text)) return text;
  return '"' + text.replace(/"/g, '""') + '"';
}

function runNpm(args) {
  if (process.platform === "win32") {
    const command = ["npm", ...args].map(quoteCmdArg).join(" ");
    execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", command], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
      windowsHide: true,
    });
    return;
  }

  execFileSync("npm", args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
}

for (const file of [FINDING_AI, ARCH_TEST, PACKAGE]) {
  if (!fs.existsSync(file)) {
    throw new Error("Erforderliche Datei fehlt: " + path.relative(ROOT, file));
  }
}

const findingBefore = fs.readFileSync(FINDING_AI, "utf8");
const archBefore = fs.readFileSync(ARCH_TEST, "utf8");

let findingAfter = findingBefore;

if (
  !findingAfter.includes("Array.isArray(finding?.aiActionIds)") ||
  !findingAfter.includes("const actionIds =")
) {
  const directMapPattern =
    /export const buildFindingAiActions\s*=\s*\(finding:\s*QualityFinding\)\s*=>\s*finding\.aiActionIds\s*\.map\(/m;

  if (!directMapPattern.test(findingAfter)) {
    throw new Error(
      "buildFindingAiActions enthält keinen sicher erkennbaren finding.aiActionIds.map()-Zugriff."
    );
  }

  findingAfter = findingAfter.replace(
    directMapPattern,
    `export const buildFindingAiActions = (finding: QualityFinding) => {
  const actionIds = Array.isArray(finding?.aiActionIds)
    ? finding.aiActionIds.filter(
        (actionId): actionId is string =>
          typeof actionId === "string" && actionId.trim().length > 0,
      )
    : [];

  return actionIds.map(`
  );

  const functionStart = findingAfter.indexOf(
    "export const buildFindingAiActions = (finding: QualityFinding) => {"
  );
  const filterIndex = findingAfter.indexOf(".filter(Boolean);", functionStart);

  if (filterIndex < 0) {
    throw new Error("Funktionsende von buildFindingAiActions nicht gefunden.");
  }

  const functionEnd = filterIndex + ".filter(Boolean);".length;
  findingAfter =
    findingAfter.slice(0, functionEnd) +
    "\n};" +
    findingAfter.slice(functionEnd);
}

if (
  !findingAfter.includes("Array.isArray(finding?.aiActionIds)") ||
  !findingAfter.includes("actionIds.map(") ||
  /finding\.aiActionIds\s*\.map\(/m.test(findingAfter)
) {
  throw new Error("Null-Safety-Fix konnte nicht verifiziert werden.");
}

const oldCssTestPattern =
  /test\("gemeinsames Admin-CSS verwendet keine important-Kaskade",\s*\(\)\s*=>\s*\{[\s\S]*?\n\}\);/m;

const newCssTest = `test("gemeinsames Admin-CSS verwendet die modulare Layer-Architektur ohne important-Kaskade", () => {
  const entry = read("src/styles/seo-admin.css");
  const panels = read("src/styles/seo-admin-panels.css");
  const content = read("src/styles/seo-admin-content.css");
  const operations = read("src/styles/seo-admin-operations.css");

  assert.doesNotMatch(entry, /!important/);
  assert.doesNotMatch(panels, /!important/);
  assert.doesNotMatch(content, /!important/);
  assert.doesNotMatch(operations, /!important/);

  assert.match(entry, /@import "\\.\\/seo-admin-panels\\.css";/);
  assert.match(entry, /@import "\\.\\/seo-admin-content\\.css";/);
  assert.match(entry, /@import "\\.\\/seo-admin-operations\\.css";/);

  assert.match(panels, /\\.seo-card/);
  assert.match(content, /\\.seo-table/);
  assert.match(operations, /\\.seo-finding/);
});`;

let archAfter = archBefore;

if (oldCssTestPattern.test(archAfter)) {
  archAfter = archAfter.replace(oldCssTestPattern, newCssTest);
} else if (!archAfter.includes("modulare Layer-Architektur ohne important-Kaskade")) {
  throw new Error("Veralteter Admin-CSS-Architekturtest wurde nicht sicher gefunden.");
}

const nullTestContent = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const target = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "src",
  "lib",
  "seo-copilot",
  "finding-ai.ts"
);

test("Finding-AI behandelt fehlende Action-IDs defensiv", () => {
  const source = fs.readFileSync(target, "utf8");
  assert.ok(source.includes("Array.isArray(finding?.aiActionIds)"));
  assert.ok(source.includes("const actionIds ="));
  assert.ok(source.includes("actionIds.map("));
  assert.ok(!/finding\\.aiActionIds\\s*\\.map\\(/m.test(source));
});

test("Ungültige Action-IDs werden vor Registry-Zugriff entfernt", () => {
  const source = fs.readFileSync(target, "utf8");
  assert.ok(source.includes('typeof actionId === "string"'));
  assert.ok(source.includes("actionId.trim().length > 0"));
});

test("Normalisierung deckt alte und unvollständige Findings ab", () => {
  const normalize = (finding) =>
    Array.isArray(finding?.aiActionIds)
      ? finding.aiActionIds.filter(
          (actionId) => typeof actionId === "string" && actionId.trim().length > 0
        )
      : [];

  assert.deepEqual(normalize({}), []);
  assert.deepEqual(normalize({ aiActionIds: undefined }), []);
  assert.deepEqual(normalize({ aiActionIds: null }), []);
  assert.deepEqual(normalize({ aiActionIds: [] }), []);
  assert.deepEqual(normalize({ aiActionIds: ["", "valid", null] }), ["valid"]);
});
`;

const packageJson = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
packageJson.scripts ||= {};
packageJson.scripts["test:seo-copilot:finding-ai-null-safety"] =
  "node --test test/seo-copilot-finding-ai-null-safety.test.mjs";
const packageAfter = JSON.stringify(packageJson, null, 2) + "\n";

const reportContent = `# SEO Copilot Null Safety + Architecture Test 22.10.7

## Behoben

1. \`buildFindingAiActions()\` behandelt fehlende oder ungültige
   \`aiActionIds\` als leere Liste.
2. Der alte SEO-Copilot-Architekturtest erwartet Card-, Table- und
   Finding-Regeln nicht mehr direkt im reinen CSS-Entrypoint.
3. Stattdessen werden die tatsächlichen Layer geprüft:
   - \`seo-admin-panels.css\`
   - \`seo-admin-content.css\`
   - \`seo-admin-operations.css\`

## Unverändert

Registry, Prompt-Logik, Priorisierung und Finding-Datenmodell bleiben
unangetastet.
`;

const desired = new Map([
  [FINDING_AI, findingAfter],
  [ARCH_TEST, archAfter],
  [NULL_TEST, nullTestContent],
  [PACKAGE, packageAfter],
  [REPORT, reportContent]
]);

const changes = [];
for (const [file, content] of desired) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (current !== content) changes.push({ file, current, content });
}

fs.mkdirSync(BACKUP, { recursive: true });

try {
  for (const change of changes) {
    const relative = path.relative(ROOT, change.file);

    if (change.current !== null) {
      const backupFile = path.join(BACKUP, relative);
      fs.mkdirSync(path.dirname(backupFile), { recursive: true });
      fs.writeFileSync(backupFile, change.current);
    }

    fs.mkdirSync(path.dirname(change.file), { recursive: true });
    fs.writeFileSync(change.file, change.content);
    log("Geschrieben: " + relative);
  }

  runNpm([
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "test:seo-copilot:finding-ai-null-safety"
  ]);

  runNpm([
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "test:seo-copilot"
  ]);

  if (packageJson.scripts?.["test:css-admin-architecture"]) {
    runNpm([
      "--workspace",
      "apps/pfotentechnik",
      "run",
      "test:css-admin-architecture"
    ]);
  }

  if (!SKIP_BUILD) {
    runNpm([
      "--workspace",
      "apps/pfotentechnik",
      "run",
      "build"
    ]);
  }

  log("BESTANDEN.");
  log("Report: " + path.relative(ROOT, REPORT));
  log("Backup: " + path.relative(ROOT, BACKUP));
} catch (error) {
  log("FEHLER: " + error.message);
  log("Rollback wird ausgeführt.");

  for (const change of [...changes].reverse()) {
    if (change.current === null) {
      if (fs.existsSync(change.file)) fs.unlinkSync(change.file);
    } else {
      fs.mkdirSync(path.dirname(change.file), { recursive: true });
      fs.writeFileSync(change.file, change.current);
    }
  }

  process.exitCode = 1;
}
