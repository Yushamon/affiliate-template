#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-product-standard-3-release-gate-25.5.0";

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const BACKUP = path.join(ROOT, ".patch-backups", NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"));

const files = {
  "apps/pfotentechnik/scripts/product-standard-3/release-gate.mjs": "#!/usr/bin/env node\nimport fs from \"node:fs\";\nimport path from \"node:path\";\nimport { spawnSync } from \"node:child_process\";\n\nconst SKIP_BUILD = process.argv.includes(\"--skip-build\");\n\nfunction findRoot(start) {\n  let dir = path.resolve(start);\n  for (let index = 0; index < 12; index += 1) {\n    if (fs.existsSync(path.join(dir, \"apps\", \"pfotentechnik\", \"package.json\"))) return dir;\n    const parent = path.dirname(dir);\n    if (parent === dir) break;\n    dir = parent;\n  }\n  throw new Error(\"Repository-Wurzel nicht gefunden.\");\n}\n\nconst ROOT = findRoot(process.cwd());\nconst APP = path.join(ROOT, \"apps\", \"pfotentechnik\");\nconst REPORT_DIR = path.join(APP, \"reports\", \"product-standard-3\");\nconst REPORT_JSON = path.join(REPORT_DIR, \"product-standard-3-release-latest.json\");\nconst REPORT_MD = path.join(REPORT_DIR, \"product-standard-3-release-latest.md\");\n\nconst steps = [\n  {\n    id: \"tests\",\n    label: \"Product-Standard-3-Tests\",\n    command: \"npm\",\n    args: [\"--workspace\", \"apps/pfotentechnik\", \"run\", \"test:product-standard-3\"]\n  },\n  {\n    id: \"enricher-tests\",\n    label: \"Enricher-Tests\",\n    command: \"npm\",\n    args: [\"--workspace\", \"apps/pfotentechnik\", \"run\", \"test:product-standard-3:enricher\"]\n  },\n  {\n    id: \"audit\",\n    label: \"Product-Standard-3-Audit\",\n    command: \"npm\",\n    args: [\"--workspace\", \"apps/pfotentechnik\", \"run\", \"audit:product-standard-3:strict\"]\n  },\n  {\n    id: \"enrichment-preview\",\n    label: \"Enrichment-Vorschau\",\n    command: \"npm\",\n    args: [\"--workspace\", \"apps/pfotentechnik\", \"run\", \"product-standard-3:enrich\"]\n  }\n];\n\nif (!SKIP_BUILD) {\n  steps.push({\n    id: \"build\",\n    label: \"Astro-Build\",\n    command: \"npm\",\n    args: [\"--workspace\", \"apps/pfotentechnik\", \"run\", \"build\"]\n  });\n}\n\nconst results = [];\n\nfor (const step of steps) {\n  console.log(`\\n[product-standard-3-release] ${step.label}`);\n  const startedAt = Date.now();\n  const result = spawnSync(step.command, step.args, {\n    cwd: ROOT,\n    stdio: \"inherit\",\n    shell: process.platform === \"win32\"\n  });\n\n  const status = result.status === 0 ? \"passed\" : \"failed\";\n  results.push({\n    id: step.id,\n    label: step.label,\n    status,\n    durationMs: Date.now() - startedAt,\n    exitCode: result.status ?? 1\n  });\n\n  if (status === \"failed\") break;\n}\n\nconst auditPath = path.join(REPORT_DIR, \"product-standard-3-latest.json\");\nconst enrichmentPath = path.join(REPORT_DIR, \"product-standard-3-enrichment-latest.json\");\n\nconst readJson = (file) => {\n  if (!fs.existsSync(file)) return null;\n  try {\n    return JSON.parse(fs.readFileSync(file, \"utf8\"));\n  } catch {\n    return null;\n  }\n};\n\nconst audit = readJson(auditPath);\nconst enrichment = readJson(enrichmentPath);\nconst passed = results.every((result) => result.status === \"passed\");\n\nconst report = {\n  version: \"25.5.0\",\n  generatedAt: new Date().toISOString(),\n  passed,\n  skipBuild: SKIP_BUILD,\n  steps: results,\n  auditSummary: audit?.summary ?? null,\n  enrichmentSummary: enrichment?.summary ?? null\n};\n\nfs.mkdirSync(REPORT_DIR, { recursive: true });\nfs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2) + \"\\n\");\n\nconst markdown = [\n  \"# Product Standard 3 Release Gate\",\n  \"\",\n  `- Status: ${passed ? \"BESTANDEN\" : \"FEHLGESCHLAGEN\"}`,\n  `- Build übersprungen: ${SKIP_BUILD ? \"ja\" : \"nein\"}`,\n  \"\",\n  \"## Schritte\",\n  \"\",\n  \"| Prüfung | Status | Dauer |\",\n  \"|---|---|---:|\",\n  ...results.map((result) =>\n    `| ${result.label} | ${result.status} | ${(result.durationMs / 1000).toFixed(2)} s |`\n  ),\n  \"\",\n  \"## Audit\",\n  \"\",\n  audit?.summary\n    ? [\n        `- Produkte: ${audit.summary.products}`,\n        `- Blockiert: ${audit.summary.blocked}`,\n        `- Verbesserungsbedarf: ${audit.summary.needsWork}`,\n        `- Gut: ${audit.summary.good}`,\n        `- Stark: ${audit.summary.strong}`,\n        `- Fehler: ${audit.summary.errors}`,\n        `- Warnungen: ${audit.summary.warnings}`\n      ].join(\"\\n\")\n    : \"Kein Audit-Report verfügbar.\",\n  \"\",\n  \"## Enrichment\",\n  \"\",\n  enrichment?.summary\n    ? [\n        `- Produkte: ${enrichment.summary.products}`,\n        `- sicher anreicherbar: ${enrichment.summary.eligible}`,\n        `- geschrieben: ${enrichment.summary.changed}`,\n        `- bereits vorhanden: ${enrichment.summary.alreadyPresent}`,\n        `- keine sicheren Ableitungen: ${enrichment.summary.noSafeFacts}`\n      ].join(\"\\n\")\n    : \"Kein Enrichment-Report verfügbar.\",\n  \"\",\n  \"## Freigaberegel\",\n  \"\",\n  \"Der Standard gilt technisch als freigegeben, wenn alle Tests, der Strict-Audit und der Build erfolgreich durchlaufen.\",\n  \"Community-Insights und Fehlkauf-Szenarien bleiben redaktionelle Qualitätsmerkmale und blockieren die technische Freigabe nicht.\",\n  \"\"\n].join(\"\\n\");\n\nfs.writeFileSync(REPORT_MD, markdown);\n\nconsole.log(`\\n[product-standard-3-release] Status: ${passed ? \"BESTANDEN\" : \"FEHLGESCHLAGEN\"}`);\nconsole.log(`[product-standard-3-release] Report: ${path.relative(ROOT, REPORT_MD)}`);\n\nif (!passed) process.exitCode = 1;\n",
  "apps/pfotentechnik/test/product-standard-3-release-gate-25.5.0.test.mjs": "import test from \"node:test\";\nimport assert from \"node:assert/strict\";\nimport fs from \"node:fs\";\nimport path from \"node:path\";\nimport { fileURLToPath } from \"node:url\";\n\nconst ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), \"../../..\");\nconst APP = path.join(ROOT, \"apps\", \"pfotentechnik\");\nconst SCRIPT = path.join(APP, \"scripts\", \"product-standard-3\", \"release-gate.mjs\");\nconst PACKAGE = path.join(APP, \"package.json\");\n\ntest(\"Release-Gate ist installiert\", () => {\n  assert.ok(fs.existsSync(SCRIPT));\n});\n\ntest(\"Release-Gate bündelt Tests, Strict-Audit, Enricher und Build\", () => {\n  const source = fs.readFileSync(SCRIPT, \"utf8\");\n  assert.match(source, /test:product-standard-3/);\n  assert.match(source, /test:product-standard-3:enricher/);\n  assert.match(source, /audit:product-standard-3:strict/);\n  assert.match(source, /product-standard-3:enrich/);\n  assert.match(source, /\\[\"--workspace\", \"apps\\/pfotentechnik\", \"run\", \"build\"\\]/);\n});\n\ntest(\"Build kann bewusst übersprungen werden\", () => {\n  const source = fs.readFileSync(SCRIPT, \"utf8\");\n  assert.match(source, /--skip-build/);\n});\n\ntest(\"Release-Gate schreibt einen dauerhaften Report\", () => {\n  const source = fs.readFileSync(SCRIPT, \"utf8\");\n  assert.match(source, /product-standard-3-release-latest\\.json/);\n  assert.match(source, /product-standard-3-release-latest\\.md/);\n});\n\ntest(\"Package Scripts sind vorhanden\", () => {\n  const pkg = JSON.parse(fs.readFileSync(PACKAGE, \"utf8\"));\n  assert.equal(pkg.scripts[\"product-standard-3:release\"], \"node scripts/product-standard-3/release-gate.mjs\");\n  assert.equal(pkg.scripts[\"product-standard-3:release:no-build\"], \"node scripts/product-standard-3/release-gate.mjs --skip-build\");\n});\n"
};

function backup(target) {
  if (!fs.existsSync(target)) return;
  const destination = path.join(BACKUP, path.relative(ROOT, target));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(target, destination);
}

for (const [relative, content] of Object.entries(files)) {
  const target = path.join(ROOT, relative);
  backup(target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  console.log("[" + NAME + "] Geschrieben: " + relative);
}

const packagePath = path.join(APP, "package.json");
backup(packagePath);
const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.scripts ??= {};
pkg.scripts["product-standard-3:release"] = "node scripts/product-standard-3/release-gate.mjs";
pkg.scripts["product-standard-3:release:no-build"] = "node scripts/product-standard-3/release-gate.mjs --skip-build";
pkg.scripts["test:product-standard-3:release"] = "node --test test/product-standard-3-release-gate-25.5.0.test.mjs";
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");
console.log("[" + NAME + "] Geändert: apps/pfotentechnik/package.json");

const testPath = path.join(APP, "test", "product-standard-3-release-gate-25.5.0.test.mjs");
execFileSync(process.execPath, ["--test", testPath], { cwd: ROOT, stdio: "inherit" });

console.log("[" + NAME + "] Fertig.");
console.log("[" + NAME + "] Release ohne Build prüfen:");
console.log("npm --workspace apps/pfotentechnik run product-standard-3:release:no-build");
console.log("[" + NAME + "] Vollständige Freigabe:");
console.log("npm --workspace apps/pfotentechnik run product-standard-3:release");
