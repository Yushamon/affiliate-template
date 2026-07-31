#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-seo-copilot-action-guarantee-22.10.8";
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
const LIST = path.join(APP, "src", "components", "admin", "SeoFindingList.astro");
const ARCH_TEST = path.join(APP, "test", "seo-copilot-architecture-cleanup.test.mjs");
const TEST = path.join(APP, "test", "seo-copilot-action-guarantee.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const REPORT = path.join(APP, "reports", "seo-copilot", "action-guarantee-22.10.8.md");
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"),
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

for (const file of [FINDING_AI, LIST, PACKAGE]) {
  if (!fs.existsSync(file)) {
    throw new Error("Erforderliche Datei fehlt: " + path.relative(ROOT, file));
  }
}

let findingAi = fs.readFileSync(FINDING_AI, "utf8");
let findingList = fs.readFileSync(LIST, "utf8");
let archTest = fs.existsSync(ARCH_TEST) ? fs.readFileSync(ARCH_TEST, "utf8") : "";

/* ------------------------------------------------------------------ */
/* finding-ai.ts: Null-Safety, Resolver-Fallback und garantierte Aktion */
/* ------------------------------------------------------------------ */

findingAi = findingAi.replace(
  /import\s*\{\s*getAiActionDefinition\s*\}\s*from\s*"\\.\/ai-action-registry\.mjs";/,
  'import { getAiActionDefinition, resolveFindingAiActionIds } from "./ai-action-registry.mjs";',
);

if (!findingAi.includes("resolveFindingAiActionIds")) {
  throw new Error("Import aus ai-action-registry.mjs konnte nicht aktualisiert werden.");
}

const functionStart = findingAi.indexOf("export const buildFindingAiActions");
if (functionStart < 0) throw new Error("buildFindingAiActions wurde nicht gefunden.");

const nextExport = findingAi.indexOf("\nexport ", functionStart + 10);
const functionEnd = nextExport >= 0 ? nextExport : findingAi.length;
const oldFunction = findingAi.slice(functionStart, functionEnd).trimEnd();

const newFunction = `export const buildFindingAiActions = (finding: QualityFinding) => {
  const configuredIds = Array.isArray(finding?.aiActionIds)
    ? finding.aiActionIds.filter(
        (actionId): actionId is string =>
          typeof actionId === "string" && actionId.trim().length > 0,
      )
    : [];

  const resolvedIds = configuredIds.length
    ? configuredIds
    : resolveFindingAiActionIds(finding);

  const actionIds = [...new Set(
    (resolvedIds.length ? resolvedIds : ["codex-send"])
      .filter((actionId) => typeof actionId === "string" && actionId.trim().length > 0),
  )];

  if (!actionIds.length) actionIds.push("codex-send");

  return actionIds
    .map((actionId) => {
      const action = getAiActionDefinition(actionId);
      if (!action) return null;
      const result = buildCodexPrompt(
        {
          kind: action.contextKind,
          title: finding.description,
          affectedFile: finding.file || undefined,
          route: finding.route || undefined,
          component: finding.component || undefined,
          slug: slugFromRoute(finding.route),
          category: finding.category,
          problems: [finding.description, finding.impact].filter(Boolean),
          existingData: [
            \`Auditquelle: \${finding.source}\`,
            \`Finding-Typ: \${finding.type}\`,
            \`Bereich: \${finding.area}\`,
            \`Priorität: \${finding.priority.score}/100\`,
          ],
          missingData: [finding.recommendedSolution].filter(Boolean),
          acceptanceCriteria: [
            \`Finding \${finding.id} ist im erneuten Audit nicht mehr aktiv.\`,
            finding.releaseBlocker ? "Der Release-Blocker ist nachweislich aufgehoben." : "",
          ].filter(Boolean),
        },
        { templateId: action.templateId as PromptTemplateId },
      );
      return {
        id: action.id,
        label: action.label,
        description: action.description,
        prompt: result.prompt,
        templateId: result.templateId,
      };
    })
    .filter(Boolean);
};`;

findingAi = findingAi.slice(0, functionStart) + newFunction + findingAi.slice(functionEnd);

/* ----------------------------------------------------------- */
/* SeoFindingList: Daten normalisieren, niemals undefined zeigen */
/* ----------------------------------------------------------- */

const preparedPattern =
  /const prepared = findings\.map\(\(finding\) => \(\{\s*\.\.\.finding,\s*aiActions:\s*buildFindingAiActions\(finding\),\s*\}\)\);/m;

const preparedReplacement = `const fallbackSolution = (finding: QualityFinding) => {
  const explicit = String(
    finding.recommendedSolution || finding.recommendedAction || "",
  ).trim();
  if (explicit) return explicit;

  const text = \`\${finding.type} \${finding.area} \${finding.category}\`.toLowerCase();
  if (/no_incoming_internal_link|internal.?link|orphan|eingehenden link/.test(text)) {
    return "Eine passende indexierbare Quellseite auswählen, dort einen natürlichen redaktionellen Link zum Ziel ergänzen und den internen Link-Audit erneut ausführen.";
  }
  if (/broken.?link|link.?target/.test(text)) {
    return "Das fehlerhafte Linkziel auf eine gültige kanonische Route korrigieren und den Link-Audit erneut ausführen.";
  }
  if (/self.?link/.test(text)) {
    return "Den Selbstlink entfernen oder auf eine fachlich passende nächste Seite der Nutzerreise umleiten.";
  }
  return "Befund anhand der genannten Quelle prüfen, gezielt beheben und anschließend mit dem zuständigen Audit verifizieren.";
};

const prepared = findings.map((finding) => {
  const normalizedFinding = {
    ...finding,
    recommendedSolution: fallbackSolution(finding),
    recommendedAction: String(
      finding.recommendedAction || finding.recommendedSolution || fallbackSolution(finding),
    ).trim(),
  };

  return {
    ...normalizedFinding,
    aiActions: buildFindingAiActions(normalizedFinding),
  };
});`;

if (preparedPattern.test(findingList)) {
  findingList = findingList.replace(preparedPattern, preparedReplacement);
} else if (!findingList.includes("const fallbackSolution =")) {
  throw new Error("Finding-Vorbereitung in SeoFindingList.astro wurde nicht sicher gefunden.");
}

findingList = findingList.replace(
  'card.append(node("p", `Lösung: ${finding.recommendedSolution}`));',
  'card.append(node("p", `Lösung: ${finding.recommendedSolution || finding.recommendedAction || "Konkrete Aktion im Finding öffnen."}`));',
);

/* ---------------------------------------------------------------- */
/* Veralteten CSS-Test aus 22.10.6 korrigieren, falls noch vorhanden */
/* ---------------------------------------------------------------- */

if (archTest) {
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

  if (oldCssTestPattern.test(archTest)) {
    archTest = archTest.replace(oldCssTestPattern, newCssTest);
  }
}

/* ---------------- */
/* Regressionstests */
/* ---------------- */

const testContent = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const app = path.join(ROOT, "apps", "pfotentechnik");
const findingAi = fs.readFileSync(
  path.join(app, "src", "lib", "seo-copilot", "finding-ai.ts"),
  "utf8",
);
const findingList = fs.readFileSync(
  path.join(app, "src", "components", "admin", "SeoFindingList.astro"),
  "utf8",
);

test("jedes Finding erhält eine AI-Aktion", () => {
  assert.ok(findingAi.includes("resolveFindingAiActionIds(finding)"));
  assert.ok(findingAi.includes('resolvedIds : ["codex-send"]'));
  assert.ok(findingAi.includes('actionIds.push("codex-send")'));
});

test("fehlende aiActionIds können keine map-Exception mehr auslösen", () => {
  assert.ok(findingAi.includes("Array.isArray(finding?.aiActionIds)"));
  assert.ok(!/finding\\.aiActionIds\\s*\\.map\\(/m.test(findingAi));
});

test("Finding-Liste rendert niemals Lösung undefined", () => {
  assert.ok(findingList.includes("const fallbackSolution ="));
  assert.ok(findingList.includes("recommendedSolution: fallbackSolution(finding)"));
  assert.ok(!findingList.includes("Lösung: \${finding.recommendedSolution}"));
});

test("Internal-Link-Findings erhalten eine konkrete Handlungsanweisung", () => {
  assert.ok(findingList.includes("no_incoming_internal_link"));
  assert.ok(findingList.includes("passende indexierbare Quellseite"));
  assert.ok(findingList.includes("internen Link-Audit erneut ausführen"));
});

test("Auto-Fix bleibt die bevorzugte direkte Aktion", () => {
  const autoFixPosition = findingList.indexOf("if (finding.autoFixPossible)");
  const aiActionPosition = findingList.indexOf("for (const aiAction of finding.aiActions");
  assert.ok(autoFixPosition >= 0);
  assert.ok(aiActionPosition > autoFixPosition);
});
`;

const packageJson = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
packageJson.scripts ||= {};
packageJson.scripts["test:seo-copilot:action-guarantee"] =
  "node --test test/seo-copilot-action-guarantee.test.mjs";
const packageAfter = JSON.stringify(packageJson, null, 2) + "\n";

const reportContent = `# SEO Copilot Action Guarantee 22.10.8

## Ziel

Jedes Finding besitzt nach der Normalisierung mindestens eine ausführbare
nächste Aktion.

## Reihenfolge

1. Registrierter sicherer Auto-Fix, wenn das Finding einen solchen anbietet.
2. Fachspezifische AI Action aus der Action Registry.
3. Generischer Codex-Remediation-Prompt als letzter Fallback.

## Zusätzlich behoben

- fehlende \`aiActionIds\` verursachen keinen Runtime-Absturz mehr
- \`Lösung: undefined\` wird nicht mehr gerendert
- Internal-Link-Findings erhalten eine konkrete Standardlösung
- der veraltete Admin-CSS-Test wird an die modulare Layer-Architektur angepasst

## Sicherheitsgrenze

Ein Finding wird nur automatisch verändert, wenn bereits ein registrierter
Auto-Fix vorhanden und vom Finding freigegeben ist. Alle übrigen Findings
erhalten eine konkrete, kopierbare Remediation-Aktion statt eines blinden
Schreibzugriffs.
`;

const desired = new Map([
  [FINDING_AI, findingAi],
  [LIST, findingList],
  [TEST, testContent],
  [PACKAGE, packageAfter],
  [REPORT, reportContent],
]);

if (archTest) desired.set(ARCH_TEST, archTest);

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
    "test:seo-copilot:action-guarantee",
  ]);

  if (packageJson.scripts?.["test:seo-copilot"]) {
    runNpm([
      "--workspace",
      "apps/pfotentechnik",
      "run",
      "test:seo-copilot",
    ]);
  }

  if (packageJson.scripts?.["test:css-admin-architecture"]) {
    runNpm([
      "--workspace",
      "apps/pfotentechnik",
      "run",
      "test:css-admin-architecture",
    ]);
  }

  if (!SKIP_BUILD) {
    runNpm([
      "--workspace",
      "apps/pfotentechnik",
      "run",
      "build",
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
