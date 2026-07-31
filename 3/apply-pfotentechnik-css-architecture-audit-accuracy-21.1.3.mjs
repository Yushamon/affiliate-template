#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-css-architecture-audit-accuracy-21.1.3";
const CHECK = process.argv.includes("--check");

function findRoot(start) {
  let current = path.resolve(start);
  for (let i = 0; i < 12; i += 1) {
    if (fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const AUDIT = path.join(APP, "scripts", "design-system", "css-architecture-audit.mjs");
const TEST = path.join(APP, "test", "css-architecture-accuracy.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const BACKUP = path.join(ROOT, ".patch-backups", NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"));
const log = (m) => console.log("[" + NAME + "] " + m);

if (!fs.existsSync(AUDIT)) {
  throw new Error("21.1.2 fehlt: " + path.relative(ROOT, AUDIT));
}

function patchAudit(source) {
  let next = source;

  const cssOld = 'important: rules.reduce((s, r) => s + r.important, 0),';
  const cssNew = 'important: (content.match(/!important\\\\b/g) || []).length,';
  if (!next.includes(cssOld) && !next.includes(cssNew)) {
    throw new Error("CSS-important-Zählstelle nicht erkannt.");
  }
  next = next.replace(cssOld, cssNew);

  const astroOld = 'important: rules.reduce((s, r) => s + r.important, 0),';
  const astroNew = 'important: (css.match(/!important\\\\b/g) || []).length,';
  if (!next.includes(astroNew)) {
    const secondIndex = next.indexOf(astroOld);
    if (secondIndex < 0) throw new Error("Astro-important-Zählstelle nicht erkannt.");
    next = next.slice(0, secondIndex) + astroNew + next.slice(secondIndex + astroOld.length);
  }

  next = next.replace(
    'rules: rules.length, important: (content.match(/!important\\\\b/g) || []).length,',
    'rules: rules.length, important: (content.match(/!important\\\\b/g) || []).length,'
  );

  if (!next.includes('actualImportantDeclarations')) {
    next = next.replace(
      'important: records.reduce((s, r) => s + r.important, 0),',
      'important: records.reduce((s, r) => s + r.important, 0),\n    actualImportantDeclarations: records.reduce((s, r) => s + r.important, 0),'
    );
  }

  next = next.replace(
    '"- !important: " + report.totals.important,',
    '"- !important-Deklarationen: " + report.totals.important,'
  );

  return next;
}

const testContent = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const TEST_FILE = fileURLToPath(import.meta.url);
const APP = path.resolve(path.dirname(TEST_FILE), "..");
const ROOT = path.resolve(APP, "..", "..");
const AUDIT = path.join(APP, "scripts", "design-system", "css-architecture-audit.mjs");

test("gruppierte Selektoren vervielfachen !important nicht", () => {
  const fixture = path.join(APP, "src", "styles", "__css-architecture-accuracy-fixture.css");
  fs.writeFileSync(fixture, ".a, .b, .c { color: red !important; background: white; }\\n");
  try {
    execFileSync("node", [AUDIT], { cwd: ROOT, stdio: "pipe" });
    const report = JSON.parse(fs.readFileSync(
      path.join(APP, "reports", "design-system", "css-architecture-latest.json"),
      "utf8"
    ));
    const record = report.records.find((item) => item.file.endsWith("__css-architecture-accuracy-fixture.css"));
    assert.ok(record);
    assert.equal(record.important, 1);
  } finally {
    fs.unlinkSync(fixture);
    execFileSync("node", [AUDIT], { cwd: ROOT, stdio: "pipe" });
  }
});
`;

function updatePackage(content) {
  const pkg = JSON.parse(content);
  pkg.scripts ||= {};
  pkg.scripts["test:css-architecture:accuracy"] = "node --test test/css-architecture-accuracy.test.mjs";
  return JSON.stringify(pkg, null, 2) + "\n";
}

const desired = new Map([
  [AUDIT, patchAudit(fs.readFileSync(AUDIT, "utf8"))],
  [TEST, testContent],
  [PACKAGE, updatePackage(fs.readFileSync(PACKAGE, "utf8"))]
]);

const changes = [];
for (const [file, content] of desired) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (current === content) log("Unverändert: " + path.relative(ROOT, file));
  else changes.push({ file, current, content });
}

if (CHECK) {
  log(changes.length ? changes.length + " Änderung(en) erforderlich." : "Bereits installiert.");
  process.exit(changes.length ? 1 : 0);
}

if (!changes.length) {
  log("Keine Änderungen erforderlich.");
  process.exit(0);
}

fs.mkdirSync(BACKUP, { recursive: true });

try {
  for (const change of changes) {
    const relative = path.relative(ROOT, change.file);
    if (change.current !== null) {
      const target = path.join(BACKUP, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, change.current);
    }
    fs.mkdirSync(path.dirname(change.file), { recursive: true });
    fs.writeFileSync(change.file, change.content);
    log("Geschrieben: " + relative);
  }

  execFileSync("node", ["--check", AUDIT], { cwd: ROOT, stdio: "inherit" });
  execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "test:css-architecture"], {
    cwd: ROOT, stdio: "inherit", env: process.env
  });
  execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "test:css-architecture:accuracy"], {
    cwd: ROOT, stdio: "inherit", env: process.env
  });
  execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "css:architecture:audit"], {
    cwd: ROOT, stdio: "inherit", env: process.env
  });

  log("BESTANDEN.");
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
