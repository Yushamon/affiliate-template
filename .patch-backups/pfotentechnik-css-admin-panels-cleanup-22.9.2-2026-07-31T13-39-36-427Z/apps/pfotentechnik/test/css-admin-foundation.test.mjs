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
const expectedHash = "99adaa1d93c70d031e625b63a49d807b15681d4e7291e7304d478b0183a4667a";
const importLine = '@import "./seo-admin-foundation.css";';
const header = "/* SEO Admin foundation: tokens, reset, shell, navigation and page headers.\n * Aus seo-admin.css extrahiert, ohne Selektoren oder Deklarationen zu verändern.\n */\n\n";

test("Admin-Foundation wird zuerst importiert", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  assert.ok(source.startsWith(importLine));
  assert.ok(fs.existsSync(foundationFile));
});

test("Exakt migrierter Foundation-Block ist unverändert", () => {
  const foundation = fs.readFileSync(foundationFile, "utf8");
  assert.ok(foundation.startsWith(header));
  const payload = foundation.slice(header.length).trim();
  const actualHash = crypto.createHash("sha256").update(payload).digest("hex");
  assert.equal(actualHash, expectedHash);
});

test("Foundation enthält Tokens, Reset, Shell und Navigation", () => {
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

test("Feature-Systeme bleiben in seo-admin.css", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  for (const required of [
    ".seo-panel",
    ".seo-card",
    ".seo-table",
    ".seo-finding",
    ".seo-workspace-summary"
  ]) {
    assert.ok(source.includes(required), "Fehlt im Hauptlayer: " + required);
  }
});

test("Feature-Systeme wurden nicht in die Foundation verschoben", () => {
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

test("seo-admin.css beginnt nach dem Import mit dem Panel-System", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const remainder = source
    .replace(/^@import "\.\/seo-admin-foundation\.css";\s*/, "")
    .trimStart();
  assert.ok(remainder.startsWith(".seo-panel,"));
});

test("Dark-Mode-System-Fallback bleibt erhalten", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  assert.ok(source.includes("@media (prefers-color-scheme: dark)"));
});

test("Migration fügt kein important hinzu", () => {
  const foundation = fs.readFileSync(foundationFile, "utf8");
  assert.ok(!foundation.includes("!important"));
});
