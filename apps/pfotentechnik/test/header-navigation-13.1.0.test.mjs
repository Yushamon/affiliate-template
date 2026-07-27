import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const read = (relative) => fs.readFile(path.join(repoRoot, relative), "utf8");

test("PfotenTechnik uses the curated project navigation", async () => {
  const projectLayout = await read("apps/pfotentechnik/src/layouts/ProjectLayout.astro");
  const projectConfig = await read("apps/pfotentechnik/src/project.config.ts");

  assert.doesNotMatch(projectLayout, /getNavigationItems|headerLinks=\{headerLinks\}/);
  assert.match(projectConfig, /label: "Vergleiche"[\s\S]*href: "\/vergleiche\/"/);
  assert.match(projectConfig, /label: "Kaufberatung"[\s\S]*href: "\/kaufberatung\/"/);
  assert.match(projectConfig, /mobileGroup: "Orientierung"/);
  assert.match(projectConfig, /mobileGroup: "Produktwelten"/);
  assert.match(projectConfig, /mobileGroup: "Mehr entdecken"/);
});

test("burger button renders exactly one icon system", async () => {
  const header = await read("packages/affiliate-core/src/components/Header.astro");

  assert.doesNotMatch(header, /class="pt-button nav-toggle-button"/);
  assert.match(header, /nav-toggle__icon--menu/);
  assert.match(header, /nav-toggle__icon--close/);
  assert.match(header, /\.nav-toggle-button::before,[\s\S]*content: none !important/);
});

test("mobile menu is grouped and accessible", async () => {
  const header = await read("packages/affiliate-core/src/components/Header.astro");

  assert.match(header, /main-nav-v2__group-title/);
  assert.match(header, /aria-current=/);
  assert.match(header, /Navigation schließen/);
  assert.match(header, /event\.key === "Escape"/);
  assert.match(header, /max-height: calc\(100dvh/);
});
