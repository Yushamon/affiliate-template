#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PATCH = "pfotentechnik-comparison-release-count-fix-32.0.2";
const here = path.dirname(fileURLToPath(import.meta.url));

function findRepoRoot(start) {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json")) &&
      fs.existsSync(path.join(dir, "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`[${PATCH}] Repository-Root nicht gefunden. Lege den Installer in das Repository oder einen Unterordner davon.`);
}

const root = findRepoRoot(process.cwd());
const app = path.join(root, "apps", "pfotentechnik");
const dataAudit = path.join(app, "scripts", "comparison-platform", "data-audit.mjs");
const releaseClosure = path.join(app, "scripts", "comparison-platform", "release-closure.mjs");
const testFile = path.join(app, "test", "comparison-release-count-fix-32.0.2.test.mjs");

for (const file of [dataAudit, releaseClosure]) {
  if (!fs.existsSync(file)) {
    throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${path.relative(root, file)}`);
  }
}

function backup(file) {
  const backup = `${file}.${PATCH}.bak`;
  if (!fs.existsSync(backup)) fs.copyFileSync(file, backup);
}

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) {
    throw new Error(`[${PATCH}] Marker nicht gefunden (${label}). Repo-Stand weicht unerwartet ab.`);
  }
  return source.replace(before, after);
}

function patchDataAudit(source) {
  source = replaceOnce(
    source,
    'const EXPECTED_COMPARISONS = 26;',
    'const MIN_EXPECTED_COMPARISONS = 26;',
    "data-audit Konstante"
  );
  source = replaceOnce(
    source,
    'if (comparisons.length !== EXPECTED_COMPARISONS) {\n    failures.push(`Erwartet: ${EXPECTED_COMPARISONS} Vergleiche, gefunden: ${comparisons.length}.`);\n  }',
    'if (comparisons.length < MIN_EXPECTED_COMPARISONS) {\n    failures.push(`Mindestbestand unterschritten: erwartet mindestens ${MIN_EXPECTED_COMPARISONS} Vergleiche, gefunden: ${comparisons.length}.`);\n  }',
    "data-audit Count-Guard"
  );
  source = replaceOnce(
    source,
    'expectedComparisons: EXPECTED_COMPARISONS,',
    'minimumComparisons: MIN_EXPECTED_COMPARISONS,',
    "data-audit Reportfeld"
  );
  source = replaceOnce(
    source,
    '`- Vergleiche: ${report.summary.comparisons} / ${EXPECTED_COMPARISONS}`,',
    '`- Vergleiche: ${report.summary.comparisons} (Mindestbestand ${MIN_EXPECTED_COMPARISONS})`,',
    "data-audit Markdown"
  );
  source = replaceOnce(
    source,
    'console.log(`Vergleiche: ${comparisons.length}/${EXPECTED_COMPARISONS}`);',
    'console.log(`Vergleiche: ${comparisons.length} (Mindestbestand ${MIN_EXPECTED_COMPARISONS})`);',
    "data-audit Console"
  );
  return source;
}

function patchReleaseClosure(source) {
  source = replaceOnce(
    source,
    'const EXPECTED_COMPARISONS = 26;',
    'const MIN_EXPECTED_COMPARISONS = 26;',
    "release-closure Konstante"
  );
  source = replaceOnce(
    source,
    'if (comparisonData.length !== EXPECTED_COMPARISONS) {\n  globalErrors.push(\n    `Erwartet: ${EXPECTED_COMPARISONS} Vergleichsseiten, gefunden: ${comparisonData.length}.`\n  );\n}',
    'if (comparisonData.length < MIN_EXPECTED_COMPARISONS) {\n  globalErrors.push(\n    `Mindestbestand unterschritten: erwartet mindestens ${MIN_EXPECTED_COMPARISONS} Vergleichsseiten, gefunden: ${comparisonData.length}.`\n  );\n}',
    "release-closure Count-Guard"
  );
  source = replaceOnce(
    source,
    'expectedComparisons: EXPECTED_COMPARISONS,',
    'minimumComparisons: MIN_EXPECTED_COMPARISONS,',
    "release-closure Reportfeld"
  );
  source = replaceOnce(
    source,
    '`- Vergleichsrouten: ${results.length} / ${EXPECTED_COMPARISONS}`,',
    '`- Vergleichsrouten: ${results.length} (Mindestbestand ${MIN_EXPECTED_COMPARISONS})`,',
    "release-closure Markdown"
  );
  return source;
}

backup(dataAudit);
backup(releaseClosure);

const dataSource = fs.readFileSync(dataAudit, "utf8");
const releaseSource = fs.readFileSync(releaseClosure, "utf8");
const nextData = patchDataAudit(dataSource);
const nextRelease = patchReleaseClosure(releaseSource);

fs.writeFileSync(dataAudit, nextData, "utf8");
fs.writeFileSync(releaseClosure, nextRelease, "utf8");

const regressionTest = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");
const dataAudit = fs.readFileSync(path.join(app, "scripts", "comparison-platform", "data-audit.mjs"), "utf8");
const releaseClosure = fs.readFileSync(path.join(app, "scripts", "comparison-platform", "release-closure.mjs"), "utf8");

test("Comparison-Audits blockieren keine legitimen Bestandserweiterungen", () => {
  for (const source of [dataAudit, releaseClosure]) {
    assert.match(source, /const MIN_EXPECTED_COMPARISONS = 26;/);
    assert.doesNotMatch(source, /const EXPECTED_COMPARISONS = 26;/);
    assert.doesNotMatch(source, /length\\s*!==\\s*EXPECTED_COMPARISONS/);
    assert.match(source, /length\\s*<\\s*MIN_EXPECTED_COMPARISONS/);
  }
});

test("Regression-Guard gegen versehentliche Vergleichsverluste bleibt erhalten", () => {
  assert.match(dataAudit, /Mindestbestand unterschritten/);
  assert.match(releaseClosure, /Mindestbestand unterschritten/);
});

test("Reports benennen die Semantik korrekt", () => {
  assert.match(dataAudit, /minimumComparisons: MIN_EXPECTED_COMPARISONS/);
  assert.match(releaseClosure, /minimumComparisons: MIN_EXPECTED_COMPARISONS/);
  assert.doesNotMatch(dataAudit, /expectedComparisons: EXPECTED_COMPARISONS/);
  assert.doesNotMatch(releaseClosure, /expectedComparisons: EXPECTED_COMPARISONS/);
});
`;

fs.writeFileSync(testFile, regressionTest, "utf8");

function run(command, args, cwd = root) {
  console.log(`[${PATCH}] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.status !== 0) {
    throw new Error(`[${PATCH}] Prüfung fehlgeschlagen: ${command} ${args.join(" ")}`);
  }
}

run(process.execPath, ["--check", dataAudit]);
run(process.execPath, ["--check", releaseClosure]);
run(process.execPath, ["--test", testFile]);
run("npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:data:audit:strict"]);

console.log(`[${PATCH}] Fix erfolgreich angewendet.`);
console.log(`[${PATCH}] Geändert:`);
console.log(`- ${path.relative(root, dataAudit)}`);
console.log(`- ${path.relative(root, releaseClosure)}`);
console.log(`- ${path.relative(root, testFile)}`);
console.log(`[${PATCH}] Nächster vollständiger Check: npm run seo:release:check`);
