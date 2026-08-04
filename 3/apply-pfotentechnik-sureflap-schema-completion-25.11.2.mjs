#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-sureflap-schema-completion-25.11.2";

function findRoot(start) {
  let current = path.resolve(start);
  for (let i = 0; i < 16; i += 1) {
    if (fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

function log(message) {
  console.log(`[${PATCH}] ${message}`);
}

function hasConflictMarkers(source) {
  return /^(<<<<<<<|=======|>>>>>>>)(?: .*)?$/m.test(source);
}

function splitDocument(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  if (lines[0]?.trim() !== "---") throw new Error("Frontmatter-Start fehlt.");
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (end < 0) throw new Error("Frontmatter-Ende fehlt.");
  return { frontmatter: lines.slice(1, end), body: lines.slice(end + 1) };
}

function keyOf(line) {
  if (!line || /^\s/.test(line)) return null;
  const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):(?:\s|$)/);
  return match?.[1] ?? null;
}

function rangeOf(lines, key) {
  const start = lines.findIndex((line) => keyOf(line) === key);
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (keyOf(lines[i])) {
      end = i;
      break;
    }
  }
  return { start, end };
}

function setScalar(lines, key, value, beforeKey) {
  const range = rangeOf(lines, key);
  if (range) {
    return [...lines.slice(0, range.start), `${key}: ${value}`, ...lines.slice(range.end)];
  }
  if (beforeKey) {
    const before = rangeOf(lines, beforeKey);
    if (before) {
      return [...lines.slice(0, before.start), `${key}: ${value}`, ...lines.slice(before.start)];
    }
  }
  return [...lines, `${key}: ${value}`];
}

function scalar(lines, key) {
  const range = rangeOf(lines, key);
  if (!range) return undefined;
  const line = lines[range.start];
  return line.slice(line.indexOf(":") + 1).trim();
}

function serialize(frontmatter, body) {
  const clean = [...body];
  while (clean.length && clean.at(-1) === "") clean.pop();
  return ["---", ...frontmatter, "---", ...clean, ""].join("\n");
}

function run(root, args, label) {
  log(`Prüfe: ${label}`);
  const executable = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(executable, args, { cwd: root, stdio: "inherit", shell: false, env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} fehlgeschlagen (Exit ${result.status}).`);
  log(`BESTANDEN: ${label}`);
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const PRODUCT = path.join(APP, "src", "content", "products", "sureflap-mikrochip-katzenklappe-connect.md");
const PACKAGE = path.join(APP, "package.json");
const TEST = path.join(APP, "test", "sureflap-schema-completion-25.11.2.test.mjs");
const BACKUP = path.join(ROOT, ".patch-backups", `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`);

for (const file of [PRODUCT, PACKAGE]) {
  if (!fs.existsSync(file)) throw new Error(`Datei fehlt: ${path.relative(ROOT, file)}`);
  const source = fs.readFileSync(file, "utf8");
  if (hasConflictMarkers(source)) throw new Error(`Git-Konfliktmarker in ${path.relative(ROOT, file)}`);
}

const packageJson = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
for (const script of ["lint:content", "audit:products:strict", "build"]) {
  if (typeof packageJson.scripts?.[script] !== "string") throw new Error(`npm-Skript fehlt: ${script}`);
}

fs.mkdirSync(BACKUP, { recursive: true });
for (const file of [PRODUCT, TEST]) {
  if (!fs.existsSync(file)) continue;
  const destination = path.join(BACKUP, path.relative(ROOT, file));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
}
log(`Backup: ${path.relative(ROOT, BACKUP)}`);

const rollback = () => {
  for (const file of [PRODUCT, TEST]) {
    const source = path.join(BACKUP, path.relative(ROOT, file));
    if (fs.existsSync(source)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(source, file);
    } else if (file === TEST && fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
    }
  }
};

try {
  const original = fs.readFileSync(PRODUCT, "utf8").replace(/\r\n/g, "\n");
  const doc = splitDocument(original);
  let fm = [...doc.frontmatter];
  fm = setScalar(fm, "availability", "\"temporarily-unavailable\"", "availabilityReason");
  fm = setScalar(fm, "maintenanceStatus", "\"required\"", "price");
  fm = setScalar(fm, "rating", "0", "score");

  const next = serialize(fm, doc.body);
  const parsed = splitDocument(next);

  const expected = {
    availability: "\"temporarily-unavailable\"",
    maintenanceStatus: "\"required\"",
    rating: "0"
  };

  for (const [key, value] of Object.entries(expected)) {
    if (scalar(parsed.frontmatter, key) !== value) throw new Error(`Zielzustand fehlt: ${key}`);
  }
  if (scalar(parsed.frontmatter, "score") !== undefined) throw new Error("Score darf nicht ergänzt werden.");

  if (next === original) log(`Bereits aktuell: ${path.relative(ROOT, PRODUCT)}`);
  else {
    fs.writeFileSync(PRODUCT, next, "utf8");
    log(`Geändert: ${path.relative(ROOT, PRODUCT)}`);
  }

  const second = (() => {
    const again = splitDocument(next);
    let nextFm = [...again.frontmatter];
    nextFm = setScalar(nextFm, "availability", "\"temporarily-unavailable\"", "availabilityReason");
    nextFm = setScalar(nextFm, "maintenanceStatus", "\"required\"", "price");
    nextFm = setScalar(nextFm, "rating", "0", "score");
    return serialize(nextFm, again.body);
  })();

  if (second !== next) throw new Error("Idempotenzprüfung fehlgeschlagen.");

  const testSource = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/content/products/sureflap-mikrochip-katzenklappe-connect.md"),
  "utf8",
);

test("Schemawerte sind gültig", () => {
  assert.match(source, /^availability: "temporarily-unavailable"$/m);
  assert.match(source, /^maintenanceStatus: "required"$/m);
  assert.match(source, /^rating: 0$/m);
});

test("keine unbelegte Bewertung", () => {
  assert.doesNotMatch(source, /^score:/m);
  assert.match(source, /Noch nicht abschließend redaktionell bewertet/);
  assert.match(source, /testedHandsOn: false/);
});

test("ungültige Altwerte sind entfernt", () => {
  assert.doesNotMatch(source, /^availability: "unavailable"$/m);
  assert.doesNotMatch(source, /^maintenanceStatus: "monitored"$/m);
});
`;

  if (!fs.existsSync(TEST) || fs.readFileSync(TEST, "utf8") !== testSource) {
    fs.writeFileSync(TEST, testSource, "utf8");
    log(`Geschrieben: ${path.relative(ROOT, TEST)}`);
  } else {
    log(`Bereits aktuell: ${path.relative(ROOT, TEST)}`);
  }

  const nodeTest = spawnSync(process.execPath, ["--test", path.relative(APP, TEST)], {
    cwd: APP,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  if (nodeTest.error) throw nodeTest.error;
  if (nodeTest.status !== 0) throw new Error("Patch-Test fehlgeschlagen.");
  log("BESTANDEN: Patch-Test");

  run(ROOT, ["--workspace", "apps/pfotentechnik", "run", "lint:content"], "Content-Lint");
  run(ROOT, ["--workspace", "apps/pfotentechnik", "run", "audit:products:strict"], "Produkt-Audit");
  run(ROOT, ["--workspace", "apps/pfotentechnik", "run", "build"], "Astro-Build");

  log("Abgeschlossen.");
} catch (error) {
  rollback();
  log(`FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  log("Änderungen wurden zurückgerollt.");
  process.exitCode = 1;
}
