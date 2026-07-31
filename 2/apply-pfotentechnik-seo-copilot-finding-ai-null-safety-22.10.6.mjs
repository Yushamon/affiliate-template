#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-seo-copilot-finding-ai-null-safety-22.10.6";
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
const TARGET = path.join(APP, "src", "lib", "seo-copilot", "finding-ai.ts");
const TEST = path.join(APP, "test", "seo-copilot-finding-ai-null-safety.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const REPORT_DIR = path.join(APP, "reports", "seo-copilot");
const REPORT = path.join(REPORT_DIR, "finding-ai-null-safety-22.10.6.md");
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

for (const file of [TARGET, PACKAGE]) {
  if (!fs.existsSync(file)) {
    throw new Error("Erforderliche Datei fehlt: " + path.relative(ROOT, file));
  }
}

const before = fs.readFileSync(TARGET, "utf8");

if (!before.includes("buildFindingAiActions")) {
  throw new Error("buildFindingAiActions wurde in finding-ai.ts nicht gefunden.");
}

let after = before;

const alreadySafe =
  after.includes("Array.isArray(finding?.aiActionIds)") &&
  after.includes("const actionIds =");

if (!alreadySafe) {
  const directMapPattern =
    /export const buildFindingAiActions\s*=\s*\(finding:\s*QualityFinding\)\s*=>\s*finding\.aiActionIds\s*\.map\(/m;

  if (directMapPattern.test(after)) {
    after = after.replace(
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

    const functionStart = after.indexOf(
      "export const buildFindingAiActions = (finding: QualityFinding) => {"
    );
    const filterIndex = after.indexOf(".filter(Boolean);", functionStart);

    if (filterIndex < 0) {
      throw new Error("Funktionsende nach direkter map-Migration nicht gefunden.");
    }

    const end = filterIndex + ".filter(Boolean);".length;
    after = after.slice(0, end) + "\n};" + after.slice(end);
  } else {
    const functionPattern =
      /export const buildFindingAiActions\s*=\s*\(finding:\s*QualityFinding\)\s*=>\s*([\s\S]*?)(?=\nexport\s|\nconst\s|\nfunction\s|$)/m;
    const match = after.match(functionPattern);

    if (!match) {
      throw new Error("buildFindingAiActions konnte nicht sicher analysiert werden.");
    }

    const functionText = match[0];
    const aiIdsMapPattern = /finding\.aiActionIds\s*\.map\(/m;

    if (!aiIdsMapPattern.test(functionText)) {
      throw new Error(
        "finding-ai.ts enthält buildFindingAiActions, aber keinen sicher erkennbaren Zugriff auf finding.aiActionIds.map()."
      );
    }

    let replaced = functionText.replace(
      /export const buildFindingAiActions\s*=\s*\(finding:\s*QualityFinding\)\s*=>\s*/,
      `export const buildFindingAiActions = (finding: QualityFinding) => {
  const actionIds = Array.isArray(finding?.aiActionIds)
    ? finding.aiActionIds.filter(
        (actionId): actionId is string =>
          typeof actionId === "string" && actionId.trim().length > 0,
      )
    : [];

  return `
    );

    replaced = replaced.replace(aiIdsMapPattern, "actionIds.map(");

    const lastSemicolon = replaced.lastIndexOf(";");
    if (lastSemicolon < 0) {
      throw new Error("Funktionsende konnte nicht sicher abgeschlossen werden.");
    }

    replaced = replaced.slice(0, lastSemicolon + 1) + "\n};" + replaced.slice(lastSemicolon + 1);
    after = after.replace(functionText, replaced);
  }
}

if (
  !after.includes("Array.isArray(finding?.aiActionIds)") ||
  !after.includes("const actionIds =") ||
  !after.includes("actionIds.map(")
) {
  throw new Error("Null-Safety-Migration konnte nicht verifiziert werden.");
}

const testContent = `import test from "node:test";
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

const reportContent = `# Finding AI Null Safety 22.10.6

## Korrektur gegenüber 22.10.3

22.10.3 erwartete eine zu enge Formatierung von \`finding-ai.ts\`.
22.10.6 erkennt den Zugriff auf \`finding.aiActionIds.map()\` unabhängig von
Zeilenumbrüchen und Einrückung.

## Änderung

- fehlende oder ungültige \`aiActionIds\` werden als leere Liste behandelt
- leere und nicht-stringförmige IDs werden verworfen
- bestehende Registry- und Prompt-Logik bleibt unverändert
`;

const desired = new Map([
  [TARGET, after],
  [TEST, testContent],
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

  runNpm(["--workspace", "apps/pfotentechnik", "run", "test:seo-copilot:finding-ai-null-safety"]);

  for (const script of [
    "test:seo-copilot",
    "test:quality-operations",
    "test:seo-copilot:compact-report"
  ]) {
    if (packageJson.scripts?.[script]) {
      runNpm(["--workspace", "apps/pfotentechnik", "run", script]);
    }
  }

  if (!SKIP_BUILD) {
    runNpm(["--workspace", "apps/pfotentechnik", "run", "build"]);
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
