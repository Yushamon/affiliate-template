import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");

const footerPath = path.join(
  root,
  "packages/affiliate-core/src/components/Footer.astro"
);
const sharedPath = path.join(
  root,
  "packages/affiliate-core/src/styles/header-footer.css"
);
const globalPath = path.join(
  root,
  "packages/affiliate-core/src/styles/global.css"
);

const footer = fs.readFileSync(footerPath, "utf8");
const globalCss = fs.readFileSync(globalPath, "utf8");

test("Footer.astro owns all footer presentation", () => {
  assert.match(footer, /<style is:global>/);
  assert.match(footer, /\.footer-v2\s*\{/);
  assert.match(footer, /\.footer-main-v2\s*\{/);
  assert.match(footer, /\.footer-bottom-v2\s*\{/);
});

test("the obsolete shared shell stylesheet is gone", () => {
  assert.equal(fs.existsSync(sharedPath), false);
  assert.doesNotMatch(globalCss, /header-footer\.css/);
});

test("footer remains responsive and semantic", () => {
  assert.match(
    footer,
    /@media\s*\(max-width:\s*520px\)[\s\S]*?\.footer-main-v2/
  );
  assert.match(footer, /var\(--pt-color-on-brand-surface/);
  assert.match(footer, /var\(--pt-color-on-brand-surface-muted/);
});

test("footer does not regain header ownership", () => {
  assert.doesNotMatch(
    footer,
    /\.site-header-v2|\.header-container-v2|\.main-nav-v2|\.nav-toggle-button/
  );
});
