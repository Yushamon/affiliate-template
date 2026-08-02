import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");

const layout = fs.readFileSync(
  path.join(root, "packages/affiliate-core/src/styles/layout.css"),
  "utf8"
);
const home = fs.readFileSync(
  path.join(root, "packages/affiliate-core/src/components/home/home.css"),
  "utf8"
);
const page = fs.readFileSync(
  path.join(root, "packages/affiliate-core/src/components/home/HomePage.astro"),
  "utf8"
);

test("generic layout does not own homepage selectors", () => {
  assert.doesNotMatch(layout, /\.home3(?:-|\b)/);
  assert.doesNotMatch(layout, /\.container--home/);
  assert.doesNotMatch(layout, /@media\s*\([^)]*\)\s*\{\s*\}/);
});

test("homepage stylesheet owns its page spacing", () => {
  assert.match(home, /\.container--home\s*\{/);
  assert.match(home, /\.container--home \.home3-hero\s*\{/);
  assert.match(home, /\.container--home \.home3-hero__content\s*\{/);
});

test("homepage component imports the canonical stylesheet", () => {
  assert.match(page, /import "\.\/home\.css";/);
});

test("cleanup introduces no important declarations", () => {
  const migratedBlock = home.match(
    /\/\* home-layout-ownership-26\.0\.6:start \*\/[\s\S]*?\/\* home-layout-ownership-26\.0\.6:end \*\//
  )?.[0] ?? "";

  assert.ok(migratedBlock);
  assert.doesNotMatch(migratedBlock, /!important/);
});
