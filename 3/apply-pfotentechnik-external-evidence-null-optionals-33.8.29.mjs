#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-external-evidence-null-optionals-33.8.29";

function findRoot(start) {
  let dir = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(dir, "package.json")) &&
        fs.existsSync(path.join(dir, "apps", "pfotentechnik"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
    dir = parent;
  }
}

const root = findRoot(process.cwd());
const productsDir = path.join(root, "apps", "pfotentechnik", "src", "content", "products");
const schemaFile = path.join(root, "apps", "pfotentechnik", "src", "content", "schema", "product.ts");
const testFile = path.join(root, "apps", "pfotentechnik", "test", "external-evidence-null-optionals-33.8.29.test.mjs");

function run(label, cmd, args, fatal = true) {
  console.log(`[${PATCH}] Prüfe: ${label}`);
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) {
    if (fatal) throw new Error(`${label} fehlgeschlagen (Exit ${r.status ?? "?"})`);
    console.error(`[${PATCH}] ${label}: FEHLER (Exit ${r.status ?? "?"})`);
    return false;
  }
  console.log(`[${PATCH}] BESTANDEN: ${label}`);
  return true;
}

function fmBounds(text) {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  return end < 0 ? null : { start: 4, end };
}

function normalize(text, filename) {
  const b = fmBounds(text);
  if (!b) return { text, changes: [] };
  const lines = text.slice(b.start, b.end).split("\n");
  const out = [];
  const changes = [];
  let inExternal = false, inUsers = false;

  for (const line of lines) {
    if (/^externalEvidence:\s*$/.test(line)) {
      inExternal = true; inUsers = false; out.push(line); continue;
    }
    if (inExternal && /^[A-Za-z0-9_][A-Za-z0-9_-]*:\s*/.test(line)) {
      inExternal = false; inUsers = false;
    }
    if (inExternal && /^  userReviews:\s*$/.test(line)) {
      inUsers = true; out.push(line); continue;
    }
    if (inExternal && /^  userReviews:\s*\[\s*\]\s*$/.test(line)) {
      inUsers = false; out.push(line); continue;
    }
    if (inExternal && inUsers && /^  [A-Za-z0-9_][A-Za-z0-9_-]*:\s*/.test(line)) {
      inUsers = false;
    }
    if (inExternal && inUsers) {
      const m = line.match(/^\s{6}(rating|reviewCount):\s*(?:null|~)\s*(?:#.*)?$/);
      if (m) {
        changes.push(`${filename}: userReviews.${m[1]} null entfernt`);
        continue;
      }
    }
    out.push(line);
  }
  return { text: text.slice(0, b.start) + out.join("\n") + text.slice(b.end), changes };
}

const schema = fs.readFileSync(schemaFile, "utf8");
if (!/rating:\s*z\.number\(\)\.nonnegative\(\)\.optional\(\)/.test(schema)) throw new Error("rating-Schema unerwartet.");
if (!/reviewCount:\s*z\.number\(\)\.int\(\)\.nonnegative\(\)\.optional\(\)/.test(schema)) throw new Error("reviewCount-Schema unerwartet.");

const files = fs.readdirSync(productsDir).filter(f => f.endsWith(".md")).sort();
const changed = [];
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(root, ".patch-backups", `${PATCH}-${stamp}`);

for (const filename of files) {
  const file = path.join(productsDir, filename);
  const before = fs.readFileSync(file, "utf8");
  const r = normalize(before, filename);
  if (r.changes.length) changed.push({ file, filename, before, after: r.text, changes: r.changes });
}

fs.mkdirSync(backupDir, { recursive: true });
for (const item of changed) {
  const backup = path.join(backupDir, "apps", "pfotentechnik", "src", "content", "products", item.filename);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.writeFileSync(backup, item.before);
  fs.writeFileSync(item.file, item.after);
  item.changes.forEach(c => console.log(`[${PATCH}] ${c}`));
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const productsDir = path.join(root, "apps", "pfotentechnik", "src", "content", "products");

test("externalEvidence userReviews haben keine null optionals", () => {
  const invalid = [];
  for (const filename of fs.readdirSync(productsDir).filter(f => f.endsWith(".md"))) {
    const text = fs.readFileSync(path.join(productsDir, filename), "utf8");
    const fm = text.startsWith("---\\n") ? text.slice(4, text.indexOf("\\n---", 4)) : "";
    const lines = fm.split("\\n");
    let inExternal = false, inUsers = false;
    for (const line of lines) {
      if (/^externalEvidence:\\s*$/.test(line)) { inExternal = true; inUsers = false; continue; }
      if (inExternal && /^[A-Za-z0-9_][A-Za-z0-9_-]*:\\s*/.test(line)) { inExternal = false; inUsers = false; }
      if (!inExternal) continue;
      if (/^  userReviews:\\s*$/.test(line)) { inUsers = true; continue; }
      if (/^  userReviews:\\s*\\[\\s*\\]\\s*$/.test(line)) { inUsers = false; continue; }
      if (inUsers && /^  [A-Za-z0-9_][A-Za-z0-9_-]*:\\s*/.test(line)) inUsers = false;
      if (inUsers && /^\\s{6}(?:rating|reviewCount):\\s*(?:null|~)\\s*$/.test(line)) invalid.push(filename + ": " + line.trim());
    }
  }
  assert.deepEqual(invalid, []);
});

test("Furbo behält redaktionelle Ratings, lässt unbekannte externe Zahlen weg", () => {
  const text = fs.readFileSync(path.join(productsDir, "furbo-360-hundekamera.md"), "utf8");
  assert.match(text, /^rating:\\s*3\\.6\\s*$/m);
  assert.match(text, /^ratings:\\s*\\{/m);
  const block = text.match(/externalEvidence:[\\s\\S]*?\\n  consensus:/)?.[0] ?? "";
  assert.match(block, /Trustpilot · Furbo markenweit/);
  assert.doesNotMatch(block, /^\\s{6}rating:\\s*(?:null|~)\\s*$/m);
  assert.doesNotMatch(block, /^\\s{6}reviewCount:\\s*(?:null|~)\\s*$/m);
});
`;
fs.mkdirSync(path.dirname(testFile), { recursive: true });
fs.writeFileSync(testFile, testSource);
console.log(`[${PATCH}] Regressionstest geschrieben: ${path.relative(root, testFile)}`);

try {
  run("Test-Syntax", process.execPath, ["--check", testFile]);
  run("Regressionstest", process.execPath, ["--test", testFile]);
  run("Evidence-Audit", "npm", ["--workspace", "apps/pfotentechnik", "run", "audit:product-evidence"]);
} catch (err) {
  for (const item of changed) fs.writeFileSync(item.file, item.before);
  console.error(`[${PATCH}] FEHLER vor Build: ${err.message}`);
  console.error(`[${PATCH}] Eigene Produkt-MD-Änderungen wurden zurückgerollt.`);
  process.exit(1);
}

const buildOk = run("Astro-Build", "npm", ["--workspace", "apps/pfotentechnik", "run", "build"], false);
if (!buildOk) {
  console.error(`[${PATCH}] Weiterer nachgelagerter Schema-Blocker vorhanden.`);
  console.error(`[${PATCH}] Die validierten Null-Normalisierungen bleiben erhalten.`);
  console.error(`[${PATCH}] Backup: ${path.relative(root, backupDir)}`);
  process.exit(2);
}

console.log(`[${PATCH}] Abgeschlossen. Geänderte Produkt-MDs: ${changed.length}`);
console.log(`[${PATCH}] Backup: ${path.relative(root, backupDir)}`);
