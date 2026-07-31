import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const styles = path.join(ROOT, "apps", "pfotentechnik", "src", "styles");
const sourceFile = path.join(styles, "seo-admin.css");
const contentFile = path.join(styles, "seo-admin-content.css");
const expectedHash = "03f99447cbaaf11b64cb3ad8a449fd8357d2576da9b79d2ca4e2c0983cd354fa";
const imports = [
  '@import "./seo-admin-foundation.css";',
  '@import "./seo-admin-panels.css";',
  '@import "./seo-admin-controls.css";',
  '@import "./seo-admin-content.css";'
];
const header = "/* SEO Admin content: tables, lists, empty states, status and anchor cards.\n * Aus seo-admin.css extrahiert, ohne Selektoren oder Deklarationen zu verändern.\n */\n\n";

test("Admin-Imports sind in stabiler Reihenfolge", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  let previous = -1;
  for (const item of imports) {
    const index = source.indexOf(item);
    assert.ok(index > previous, "Import fehlt oder Reihenfolge falsch: " + item);
    previous = index;
  }
});

test("Exakt migrierter Content-Block ist unverändert", () => {
  const content = fs.readFileSync(contentFile, "utf8");
  assert.ok(content.startsWith(header));
  const payload = content.slice(header.length).trim();
  const actual = crypto.createHash("sha256").update(payload).digest("hex");
  assert.equal(actual, expectedHash);
});

test("Content-Layer enthält Tabellen, Listen und Status", () => {
  const content = fs.readFileSync(contentFile, "utf8");
  for (const required of [
    ".seo-table-wrap",
    ".seo-table",
    ".seo-list",
    ".seo-list-item",
    ".seo-empty",
    ".seo-status",
    ".seo-anchor-card"
  ]) {
    assert.ok(content.includes(required), "Fehlt: " + required);
  }
});

test("Finding- und Workspace-Systeme bleiben in seo-admin.css", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  for (const required of [
    ".seo-finding-list",
    ".seo-finding",
    ".seo-workspace-summary",
    ".seo-workspace-facts"
  ]) {
    assert.ok(source.includes(required), "Fehlt im Hauptlayer: " + required);
  }
});

test("Finding- und Workspace-Systeme wurden nicht in Content verschoben", () => {
  const content = fs.readFileSync(contentFile, "utf8");
  for (const forbidden of [
    ".seo-finding",
    ".seo-workspace-summary",
    ".seo-workspace-facts",
    "@media"
  ]) {
    assert.ok(!content.includes(forbidden), "Unerwartet in Content: " + forbidden);
  }
});

test("seo-admin.css beginnt nach Imports mit Finding-System", () => {
  let source = fs.readFileSync(sourceFile, "utf8");
  for (const item of imports) source = source.replace(item, "");
  assert.ok(source.trimStart().startsWith(".seo-finding-list"));
});

test("Responsive Regeln bleiben im Hauptlayer", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  assert.ok(source.includes("@media (max-width: 900px)"));
  assert.ok(source.includes("@media (max-width: 680px)"));
  assert.ok(source.includes("@media (prefers-color-scheme: dark)"));
});

test("Migration fügt kein important hinzu", () => {
  const content = fs.readFileSync(contentFile, "utf8");
  assert.ok(!content.includes("!important"));
});
