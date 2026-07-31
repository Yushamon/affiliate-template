import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const styles = path.join(ROOT, "apps", "pfotentechnik", "src", "styles");
const sourceFile = path.join(styles, "seo-admin.css");
const foundationFile = path.join(styles, "seo-admin-foundation.css");
const panelsFile = path.join(styles, "seo-admin-panels.css");
const foundationImport = '@import "./seo-admin-foundation.css";';
const panelsImport = '@import "./seo-admin-panels.css";';

test("Admin-Foundation wird zuerst importiert", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  assert.ok(source.startsWith(foundationImport));
  assert.ok(fs.existsSync(foundationFile));
});

test("Foundation-Datei enthält weiterhin Tokens, Reset, Shell und Navigation", () => {
  const foundation = fs.readFileSync(foundationFile, "utf8");
  for (const required of [
    ":root {",
    "--seo-bg:",
    'html[data-theme="dark"]',
    "* { box-sizing: border-box; }",
    ".seo-shell",
    ".seo-brand",
    ".seo-nav",
    ".seo-context-nav",
    ".seo-page-header",
    ".seo-section-header"
  ]) {
    assert.ok(foundation.includes(required), "Fehlt: " + required);
  }
});

test("Feature-Systeme liegen außerhalb der Foundation", () => {
  const foundation = fs.readFileSync(foundationFile, "utf8");
  for (const forbidden of [
    ".seo-panel",
    ".seo-card",
    ".seo-table",
    ".seo-finding",
    ".seo-workspace-summary"
  ]) {
    assert.ok(!foundation.includes(forbidden), "Unerwartet in Foundation: " + forbidden);
  }
});

test("Panel-System ist nach 22.9.1/22.9.2 im Panel-Layer vorhanden", () => {
  assert.ok(fs.existsSync(panelsFile));
  const panels = fs.readFileSync(panelsFile, "utf8");
  assert.ok(panels.includes(".seo-panel"));
  assert.ok(panels.includes(".seo-card"));
});

test("Admin-Importkette beginnt mit Foundation und Panels", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const stripped = source.trimStart();
  assert.ok(stripped.startsWith(foundationImport));
  const afterFoundation = stripped.slice(foundationImport.length).trimStart();
  assert.ok(afterFoundation.startsWith(panelsImport));
});

test("Weitere Feature-Systeme bleiben im Hauptlayer", () => {
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

test("Dark-Mode-System-Fallback bleibt erhalten", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  assert.ok(source.includes("@media (prefers-color-scheme: dark)"));
});

test("Foundation und Panel-Layer enthalten kein important", () => {
  const foundation = fs.readFileSync(foundationFile, "utf8");
  const panels = fs.readFileSync(panelsFile, "utf8");
  assert.ok(!foundation.includes("!important"));
  assert.ok(!panels.includes("!important"));
});
