import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");

const header = fs.readFileSync(
  path.join(root, "packages/affiliate-core/src/components/Header.astro"),
  "utf8"
);
const shared = fs.readFileSync(
  path.join(root, "packages/affiliate-core/src/styles/header-footer.css"),
  "utf8"
);

test("Header.astro is the only responsive header owner", () => {
  assert.match(header, /\.site-header-v2 \.header-container-v2/);
  assert.match(header, /@media\s*\(min-width:\s*48rem\)/);
  assert.match(header, /@media\s*\(max-width:\s*47\.99rem\)/);

  assert.doesNotMatch(
    shared,
    /(^|[\s}])(?:\.site-header-v2|\.header-container-v2|\.main-nav-v2|\.nav-toggle-button|\.logo-v2)(?=[\s.{:#[])/m
  );
});

test("shared stylesheet still owns the footer", () => {
  assert.match(shared, /\.footer-v2\s*\{/);
  assert.match(shared, /\.footer-main-v2\s*\{/);
  assert.match(shared, /\.footer-bottom-v2\s*\{/);
});

test("desktop and mobile contracts remain explicit", () => {
  assert.match(
    header,
    /@media\s*\(min-width:\s*48rem\)[\s\S]*?\.site-header-v2 \.nav-toggle-button\s*\{[\s\S]*?display:\s*none/
  );
  assert.match(
    header,
    /@media\s*\(max-width:\s*47\.99rem\)[\s\S]*?\.site-header-v2 \.nav-toggle-button\s*\{[\s\S]*?display:\s*grid/
  );
  assert.match(header, /padding-inline:\s*1rem/);
});

test("cleanup adds no important rules", () => {
  assert.doesNotMatch(header, /!important/);
  assert.doesNotMatch(shared, /!important/);
});
