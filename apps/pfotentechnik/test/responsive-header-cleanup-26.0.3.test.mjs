import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");
const header = fs.readFileSync(path.join(root, "packages/affiliate-core/src/components/Header.astro"), "utf8");
test("desktop hides the burger and keeps desktop navigation", () => {
  assert.match(header, /@media\s*\(min-width:\s*48rem\)[\s\S]*?\.site-header-v2 \.nav-toggle-button\s*\{[\s\S]*?display:\s*none/);
  assert.match(header, /\.site-header-v2 \.main-nav-v2__desktop\s*\{[\s\S]*?display:\s*flex/);
  assert.match(header, /\.site-header-v2 \.main-nav-v2__mobile\s*\{[\s\S]*?display:\s*none/);
});
test("mobile header has symmetric 16 px padding", () => {
  assert.match(header, /@media\s*\(max-width:\s*47\.99rem\)[\s\S]*?padding-inline:\s*1rem/);
});
test("CSS and JS use the same breakpoint", () => {
  assert.match(header, /window\.matchMedia\("\(min-width: 48rem\)"\)/);
  assert.match(header, /@media\s*\(min-width:\s*48rem\)/);
});
test("no important rules", () => assert.doesNotMatch(header, /!important/));
