import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");

const headerPath = path.join(root, "packages/affiliate-core/src/components/Header.astro");
const footerPath = path.join(root, "packages/affiliate-core/src/components/Footer.astro");
const configPath = path.join(app, "src/project.config.ts");

const header = fs.readFileSync(headerPath, "utf8");
const footer = fs.readFileSync(footerPath, "utf8");
const config = fs.readFileSync(configPath, "utf8");

test("mobile navigation is a compact dropdown instead of a full-screen layer", () => {
  assert.match(header, /data-header-version="32\.2\.1"/);
  assert.match(
    header,
    /@media\s*\(max-width:\s*63\.99rem\)[\s\S]*?\.site-header-v2 \.main-nav-v2\s*\{[\s\S]*?position:\s*absolute/
  );
  assert.doesNotMatch(
    header,
    /@media\s*\(max-width:\s*63\.99rem\)[\s\S]*?\.site-header-v2 \.main-nav-v2\s*\{[\s\S]*?position:\s*fixed/
  );
  assert.doesNotMatch(header, /inset:\s*0/);
  assert.doesNotMatch(header, /main-nav-v2__mobile-head/);
  assert.doesNotMatch(header, /main-nav-v2__mobile-shell/);
});

test("mobile links stay compact and do not repeat descriptions or code badges", () => {
  assert.match(header, /min-height:\s*2\.8rem/);
  assert.doesNotMatch(header, /main-nav-v2__mobile-copy/);
  assert.doesNotMatch(header, /main-nav-v2__code/);
  assert.doesNotMatch(header, /\{link\.description && <small>/);
});

test("burger lifecycle is reinitialized after Astro navigation", () => {
  assert.match(header, /header\.navigationAbortController\?\.abort\(\)/);
  assert.match(header, /document\.addEventListener\("astro:page-load", setupHeaderNavigation\)/);
  assert.match(header, /document\.addEventListener\("astro:before-swap", resetHeaderNavigation\)/);
  assert.doesNotMatch(header, /requestAnimationFrame\([\s\S]*?\.focus\(\)/);
  assert.doesNotMatch(header, /pt-navigation-open/);
});

test("footer is a compact link footer without landing-page blocks", () => {
  assert.match(footer, /data-footer-version="32\.2\.1"/);
  assert.match(footer, /footerColumns = \[/);
  assert.match(footer, /footer-column-v2--products/);
  assert.doesNotMatch(footer, /footer-top-v3/);
  assert.doesNotMatch(footer, /footer-actions-v3/);
  assert.doesNotMatch(footer, /footer-product-grid-v3/);
  assert.doesNotMatch(footer, /footer-values/);
});

test("all new product worlds remain available from the shared navigation data", () => {
  for (const label of [
    "Futterautomaten",
    "Trinkbrunnen",
    "GPS-Tracker",
    "Katzenklappen",
    "Haustierkameras",
    "Automatische Katzentoiletten"
  ]) {
    assert.match(config, new RegExp(`label:\\s*"${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }
});

test("repair does not introduce important overrides", () => {
  assert.doesNotMatch(header, /!important/);
  assert.doesNotMatch(footer, /!important/);
});
