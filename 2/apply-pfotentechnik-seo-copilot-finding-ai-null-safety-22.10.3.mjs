#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-seo-copilot-finding-ai-null-safety-22.10.3";
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
const TYPES = path.join(APP, "src", "lib", "seo-copilot", "types.ts");
const TEST = path.join(APP, "test", "seo-copilot-finding-ai-null-safety.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const REPORT_DIR = path.join(APP, "reports", "seo-copilot");
const REPORT = path.join(REPORT_DIR, "finding-ai-null-safety-22.10.3.md");
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-")
);

const log = (message) => console.log("[" + NAME + "] " + message);

for (const file of [TARGET, TYPES, PACKAGE]) {
  if (!fs.existsSync(file)) {
    throw new Error("Erforderliche Datei fehlt: " + path.relative(ROOT, file));
  }
}

const before = fs.readFileSync(TARGET, "utf8");

const expected = `export const buildFindingAiActions = (finding: QualityFinding) =>
  finding.aiActionIds
    .map((actionId) => {`;

if (!before.includes(expected)) {
  throw new Error("finding-ai.ts entspricht keinem geprüften Ausgangsstand.");
}

const replacement = `export const buildFindingAiActions = (finding: QualityFinding) => {
  const actionIds = Array.isArray(finding?.aiActionIds)
    ? finding.aiActionIds.filter(
        (actionId): actionId is string =>
          typeof actionId === "string" && actionId.trim().length > 0,
      )
    : [];

  return actionIds
    .map((actionId) => {`;

let after = before.replace(expected, replacement);

const ending = `    })
    .filter(Boolean);
`;

if (!after.includes(ending)) {
  throw new Error("Funktionsende von buildFindingAiActions wurde nicht gefunden.");
}

after = after.replace(
  ending,
  `    })
    .filter(Boolean);
};
`,
);

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
const types = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "src",
  "lib",
  "seo-copilot",
  "types.ts"
);

test("Finding-AI behandelt fehlende Action-IDs defensiv", () => {
  const source = fs.readFileSync(target, "utf8");
  assert.ok(source.includes("Array.isArray(finding?.aiActionIds)"));
  assert.ok(source.includes("const actionIds ="));
  assert.ok(source.includes("return actionIds"));
  assert.ok(!source.includes("finding.aiActionIds\\n    .map"));
});

test("Ungültige Action-IDs werden vor Registry-Zugriff entfernt", () => {
  const source = fs.readFileSync(target, "utf8");
  assert.ok(source.includes('typeof actionId === "string"'));
  assert.ok(source.includes("actionId.trim().length > 0"));
});

test("QualityFinding behält aiActionIds als reguläres Feld", () => {
  const source = fs.readFileSync(types, "utf8");
  assert.ok(source.includes("aiActionIds: string[];"));
});

test("Leere Action-Liste führt konzeptionell zu leerem Ergebnis", () => {
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

const reportContent = `# Finding AI Null Safety 22.10.3

## Behobener Fehler

\`buildFindingAiActions()\` rief direkt \`.map()\` auf
\`finding.aiActionIds\` auf. Ältere, unvollständige oder extern erzeugte
Findings können dieses Feld jedoch nicht besitzen.

## Änderung

- fehlendes, null-artiges oder falsch typisiertes \`aiActionIds\` wird als leere Liste behandelt
- leere und nicht-stringförmige Action-IDs werden verworfen
- gültige Action-IDs durchlaufen unverändert die vorhandene Registry- und Prompt-Logik
- ein einzelnes unvollständiges Finding kann die Admin-Produktseite nicht mehr abstürzen

## Sicherheitsgrenze

Keine Änderung an Registry, Prompt-Templates, Priorisierung oder Finding-Daten.
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

  execFileSync(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "test:seo-copilot:finding-ai-null-safety"],
    { cwd: ROOT, stdio: "inherit", env: process.env }
  );

  for (const script of [
    "test:seo-copilot",
    "test:quality-operations",
    "test:seo-copilot:compact-report"
  ]) {
    if (packageJson.scripts?.[script]) {
      execFileSync(
        "npm",
        ["--workspace", "apps/pfotentechnik", "run", script],
        { cwd: ROOT, stdio: "inherit", env: process.env }
      );
    }
  }

  if (!SKIP_BUILD) {
    execFileSync(
      "npm",
      ["--workspace", "apps/pfotentechnik", "run", "build"],
      { cwd: ROOT, stdio: "inherit", env: process.env }
    );
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
