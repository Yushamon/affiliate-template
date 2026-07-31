import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const styles = path.join(ROOT, "apps", "pfotentechnik", "src", "styles");
const sourceFile = path.join(styles, "seo-admin.css");
const panelsFile = path.join(styles, "seo-admin-panels.css");
const expectedHash = "c6f4071342476ae7fdac7ddde7af8358fd7746ef46f5d151201776eb29380330";
const foundationImport = '@import "./seo-admin-foundation.css";';
const panelsImport = '@import "./seo-admin-panels.css";';
const header = "/* SEO Admin panels: surfaces, stacks, grids and metrics.\n * Aus seo-admin.css extrahiert, ohne Selektoren oder Deklarationen zu verändern.\n */\n\n";

test("Admin-Imports sind in stabiler Reihenfolge", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const foundationIndex = source.indexOf(foundationImport);
  const panelsIndex = source.indexOf(panelsImport);
  assert.equal(foundationIndex, 0);
  assert.ok(panelsIndex > foundationIndex);
  assert.ok(fs.existsSync(panelsFile));
});

test("Exakt migrierter Panel-Block ist unverändert", () => {
  const panels = fs.readFileSync(panelsFile, "utf8");
  assert.ok(panels.startsWith(header));
  const payload = panels.slice(header.length).trim();
  const actualHash = crypto.createHash("sha256").update(payload).digest("hex");
  assert.equal(actualHash, expectedHash);
});

test("Panel-Layer enthält Oberflächen, Grids und Metriken", () => {
  const panels = fs.readFileSync(panelsFile, "utf8");
  for (const required of [
    ".seo-panel",
    ".seo-card",
    ".seo-stack",
    ".seo-stack-lg",
    ".seo-grid",
    ".seo-metrics",
    ".seo-metric"
  ]) {
    assert.ok(panels.includes(required), "Fehlt: " + required);
  }
});

test("Nachfolgende Feature-Systeme bleiben in seo-admin.css", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  for (const required of [
    ".seo-badge",
    ".seo-filter-grid",
    ".seo-table",
    ".seo-finding",
    ".seo-workspace-summary"
  ]) {
    assert.ok(source.includes(required), "Fehlt im Hauptlayer: " + required);
  }
});

test("Nachfolgende Features wurden nicht in Panels verschoben", () => {
  const panels = fs.readFileSync(panelsFile, "utf8");
  for (const forbidden of [
    ".seo-badge",
    ".seo-filter-grid",
    ".seo-table",
    ".seo-finding",
    ".seo-workspace-summary"
  ]) {
    assert.ok(!panels.includes(forbidden), "Unerwartet im Panel-Layer: " + forbidden);
  }
});

test("seo-admin.css beginnt nach Imports mit Badge-System", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const remainder = source
    .replace(/^@import "\.\/seo-admin-foundation\.css";\s*/, "")
    .replace(/^@import "\.\/seo-admin-panels\.css";\s*/, "")
    .trimStart();
  assert.ok(remainder.startsWith(".seo-badges,"));
});

test("Dark-Mode-System-Fallback bleibt im Hauptlayer", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  assert.ok(source.includes("@media (prefers-color-scheme: dark)"));
});

test("Migration fügt kein important hinzu", () => {
  const panels = fs.readFileSync(panelsFile, "utf8");
  assert.ok(!panels.includes("!important"));
});
