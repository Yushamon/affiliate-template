import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const styles = path.join(APP, "src", "styles");
const sourceFile = path.join(styles, "pfotentechnik-design-system.css");
const foundationIndex = path.join(styles, "foundation", "index.css");
const layoutIndex = path.join(styles, "layout", "index.css");
const containersFile = path.join(styles, "layout", "containers.css");

test("Layout Layer wird nach Base eingebunden", () => {
  const foundation = fs.readFileSync(foundationIndex, "utf8");
  assert.match(
    foundation,
    /@import "\.\/base\.css";[\s\S]*@import "\.\.\/layout\/index\.css";/
  );
  assert.ok(fs.existsSync(layoutIndex));
  assert.ok(fs.existsSync(containersFile));
});

test("Container-Basis liegt ausschließlich im Layout Layer", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const containers = fs.readFileSync(containersFile, "utf8");

  assert.doesNotMatch(
    source,
    /\.container\s*,\s*\.header-container-v2\s*,\s*\.footer-inner-v2\s*\{/
  );
  assert.match(
    containers,
    /:where\(\.container, \.header-container-v2, \.footer-inner-v2\)\s*\{/
  );
});

test("Mobile Containerbreite bleibt bei maximal 430px erhalten", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const containers = fs.readFileSync(containersFile, "utf8");

  assert.doesNotMatch(
    source,
    /\.container\s*\{\s*width:\s*min\(100%\s*-\s*24px,\s*var\(--pt-content\)\)/
  );
  assert.match(
    containers,
    /@media\s*\(max-width:\s*430px\)[\s\S]*\.container\s*\{[\s\S]*width:\s*min\(100%\s*-\s*24px,\s*var\(--pt-content\)\)/
  );
});

test("Layout Layer enthält keine Komponenten- oder Theme-Eigenschaften", () => {
  const containers = fs.readFileSync(containersFile, "utf8");
  assert.doesNotMatch(containers, /\b(?:color|background|border|box-shadow|font-family)\s*:/);
  assert.doesNotMatch(containers, /!important/);
});

test("keine leeren Media Queries bleiben im Legacy-CSS", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  assert.doesNotMatch(source, /@media\s*[^{]+\{\s*\}/);
});
