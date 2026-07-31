import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const styles = path.join(ROOT, "apps", "pfotentechnik", "src", "styles");
const sourceFile = path.join(styles, "seo-admin.css");
const controlsFile = path.join(styles, "seo-admin-controls.css");
const expectedHash = "3eac9a6312d08a6d01f16c08180a042da63fddb13d8ecf5a70fc5470e57efafc";
const imports = [
  '@import "./seo-admin-foundation.css";',
  '@import "./seo-admin-panels.css";',
  '@import "./seo-admin-controls.css";'
];
const header = "/* SEO Admin controls: badges, actions, tabs, filters and form controls.\n * Aus seo-admin.css extrahiert, ohne Selektoren oder Deklarationen zu verändern.\n */\n\n";

test("Admin-Imports sind in stabiler Reihenfolge", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  let previous = -1;
  for (const item of imports) {
    const index = source.indexOf(item);
    assert.ok(index > previous, "Import fehlt oder Reihenfolge falsch: " + item);
    previous = index;
  }
});

test("Exakt migrierter Control-Block ist unverändert", () => {
  const controls = fs.readFileSync(controlsFile, "utf8");
  assert.ok(controls.startsWith(header));
  const payload = controls.slice(header.length).trim();
  const actual = crypto.createHash("sha256").update(payload).digest("hex");
  assert.equal(actual, expectedHash);
});

test("Control-Layer enthält Badges, Actions, Tabs und Formulare", () => {
  const controls = fs.readFileSync(controlsFile, "utf8");
  for (const required of [
    ".seo-badges",
    ".seo-actions",
    ".seo-source-state",
    ".seo-tabs",
    ".seo-badge",
    ".seo-filter-grid",
    ".seo-toolbar",
    ".seo-toolbar input",
    ".seo-toolbar textarea"
  ]) {
    assert.ok(controls.includes(required), "Fehlt: " + required);
  }
});

test("Content-Systeme bleiben in seo-admin.css", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  for (const required of [
    ".seo-table",
    ".seo-list-item",
    ".seo-empty",
    ".seo-status",
    ".seo-finding",
    ".seo-workspace-summary"
  ]) {
    assert.ok(source.includes(required), "Fehlt im Hauptlayer: " + required);
  }
});

test("Content-Systeme wurden nicht in Controls verschoben", () => {
  const controls = fs.readFileSync(controlsFile, "utf8");
  for (const forbidden of [
    ".seo-table",
    ".seo-list-item",
    ".seo-empty",
    ".seo-status",
    ".seo-finding",
    ".seo-workspace-summary",
    "@media"
  ]) {
    assert.ok(!controls.includes(forbidden), "Unerwartet in Controls: " + forbidden);
  }
});

test("seo-admin.css beginnt nach Imports mit Tabellen-System", () => {
  let source = fs.readFileSync(sourceFile, "utf8");
  for (const item of imports) {
    source = source.replace(item, "");
  }
  assert.ok(source.trimStart().startsWith(".seo-table-wrap"));
});

test("Responsive Regeln bleiben im Hauptlayer", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  assert.ok(source.includes("@media (max-width: 900px)"));
  assert.ok(source.includes("@media (max-width: 680px)"));
  assert.ok(source.includes("@media (prefers-color-scheme: dark)"));
});

test("Migration fügt kein important hinzu", () => {
  const controls = fs.readFileSync(controlsFile, "utf8");
  assert.ok(!controls.includes("!important"));
});
