import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const app = path.join(ROOT, "apps", "pfotentechnik");
const page = fs.readFileSync(
  path.join(app, "src", "pages", "admin", "seo", "topical-authority.astro"),
  "utf8",
);
const loader = fs.readFileSync(
  path.join(
    app,
    "src",
    "lib",
    "seo",
    "topical-authority",
    "loadInternalLinkAdvisories.ts",
  ),
  "utf8",
);

test("Topical Authority nutzt den Internal-Link-Health-Report als Quelle", () => {
  assert.ok(page.includes("loadInternalLinkAdvisories"));
  assert.ok(loader.includes("internal-link-health-audit.json"));
  assert.ok(loader.includes('finding?.code !== "NO_INCOMING_INTERNAL_LINK"'));
});

test("alte eigene 50er-Orphan-Darstellung wird nicht mehr gerendert", () => {
  assert.ok(!page.includes("Mögliche verwaiste Inhalte"));
  assert.ok(!page.includes("data.orphanCandidates.length"));
  assert.ok(!page.includes("50 Kandidaten"));
});

test("Auditstatus und Alter werden transparent angezeigt", () => {
  assert.ok(page.includes("Audit veraltet"));
  assert.ok(page.includes("Internal-Link-Health-Audit erneut ausführen"));
  assert.ok(loader.includes("ageHours > 24"));
});

test("jeder Hinweis besitzt eine konkrete Codex-Remediation", () => {
  assert.ok(page.includes("data-copy-prompt"));
  assert.ok(page.includes("Codex-Prompt kopieren"));
  assert.ok(loader.includes("buildCodexPrompt"));
  assert.ok(loader.includes("Keine Footer-, Boilerplate- oder Keyword-Links"));
});

test("Loader begrenzt Ergebnisse nicht künstlich auf 50", () => {
  assert.ok(!loader.includes(".slice(0, 50)"));
  assert.ok(loader.includes("const advisories = [...byRoute.values()]"));
});
