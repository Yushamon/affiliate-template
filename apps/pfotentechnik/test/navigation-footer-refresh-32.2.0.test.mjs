import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");

const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const config = read("apps/pfotentechnik/src/project.config.ts");
const header = read("packages/affiliate-core/src/components/Header.astro");
const footer = read("packages/affiliate-core/src/components/Footer.astro");
const legacyTheme = read("apps/pfotentechnik/src/styles/pfotentechnik.css");
const densityTheme = read("apps/pfotentechnik/src/styles/pfotentechnik-visual-density.css");

const requiredCategories = [
  ["Futterautomaten", "/smarte-futterautomaten/"],
  ["Trinkbrunnen", "/trinkbrunnen/"],
  ["GPS-Tracker", "/gps-tracker/"],
  ["Katzenklappen", "/katzenklappen/"],
  ["Haustierkameras", "/haustierkameras/"],
  ["Automatische Katzentoiletten", "/automatische-katzentoiletten/"]
];

test("all current product worlds are in the shared navigation source", () => {
  for (const [label, href] of requiredCategories) {
    assert.match(config, new RegExp(`label:\\s*"${label}"[\\s\\S]{0,260}?href:\\s*"${href.replaceAll("/", "\\/")}"`));
  }
});

test("new cluster landing pages exist", () => {
  for (const file of [
    "apps/pfotentechnik/src/content/pages/katzenklappen.md",
    "apps/pfotentechnik/src/content/pages/haustierkameras.md",
    "apps/pfotentechnik/src/content/pages/automatische-katzentoiletten.md"
  ]) {
    assert.equal(fs.existsSync(path.join(root, file)), true, file);
  }
});

test("desktop navigation groups product worlds instead of overflowing the header", () => {
  assert.match(header, /const productLinks = links\.filter/);
  assert.match(header, /main-nav-v2__desktop-menu/);
  assert.match(header, /main-nav-v2__desktop-panel/);
  assert.match(header, /min-width:\s*64rem/);
});

test("mobile navigation is a compact overlay with stable inline rows", () => {
  assert.match(header, /position:\s*fixed;[\s\S]{0,180}?inset:\s*0;/);
  assert.match(header, /grid-template-columns:\s*2\.5rem minmax\(0,\s*1fr\) 1\.25rem;/);
  assert.match(header, /main-nav-v2__mobile-copy/);
  assert.match(header, /main-nav-v2__group--products/);
});

test("footer derives product worlds from the same source", () => {
  assert.match(footer, /projectConfig\.headerLinks\.filter/);
  assert.match(footer, /link\.mobileGroup === "Produktwelten"/);
  assert.match(footer, /footer-product-grid-v3/);
  assert.match(footer, /footer-main-v2/);
});

test("homepage product-world configuration contains the six canonical clusters", () => {
  for (const key of [
    "futterautomat",
    "trinkbrunnen",
    "gps-tracker",
    "katzenklappen",
    "haustierkameras",
    "automatische-katzentoiletten"
  ]) {
    assert.match(config, new RegExp(`productCategory:\\s*"${key}"`));
  }
});

test("navigation and footer contain no important overrides", () => {
  assert.doesNotMatch(header, /!important/);
  assert.doesNotMatch(footer, /!important/);
});

test("legacy theme layers no longer own header or footer selectors", () => {
  for (const selector of [
    ".site-header-v2",
    ".header-container-v2",
    ".main-nav-v2",
    ".nav-toggle-button",
    ".footer-v2",
    ".footer-column-v2"
  ]) {
    assert.doesNotMatch(legacyTheme, new RegExp(selector.replaceAll(".", "\\.")));
  }

  for (const selector of [
    ".site-header-v2",
    ".main-nav-v2",
    ".nav-toggle-button",
    ".header-advisor-link"
  ]) {
    assert.doesNotMatch(densityTheme, new RegExp(selector.replaceAll(".", "\\.")));
  }
});
