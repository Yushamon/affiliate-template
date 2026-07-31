import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceFile = path.join(APP, "src", "styles", "pfotentechnik-design-system.css");
const indexFile = path.join(APP, "src", "styles", "foundation", "index.css");
const baseFile = path.join(APP, "src", "styles", "foundation", "base.css");

function firstRuleAfterImports(css) {
  let rest = css.replace(/^\s*/, "");
  while (rest.startsWith("@import")) {
    const end = rest.indexOf(";");
    assert.notEqual(end, -1, "Ungültiger @import.");
    rest = rest.slice(end + 1).replace(/^\s*/, "");
  }
  const open = rest.indexOf("{");
  assert.notEqual(open, -1, "Keine CSS-Regel nach Imports gefunden.");
  return rest.slice(0, open).replace(/\/\*[\s\S]*?\*\//g, "").trim();
}

test("Base Layer ist über den Foundation-Entry eingebunden", () => {
  assert.ok(fs.existsSync(baseFile));
  const index = fs.readFileSync(indexFile, "utf8");
  assert.match(index, /@import "\.\/tokens\.css";[\s\S]*@import "\.\/base\.css";/);
});

test("der sichere globale Präfix wurde aus dem Legacy-Design-System entfernt", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const firstSelector = firstRuleAfterImports(source);
  assert.ok(
    !["html", "body", "::selection"].includes(firstSelector),
    "Direkt nach den Imports steht weiterhin ein migrierbarer Base-Selektor: " + firstSelector
  );
});

test("spätere Theme- und Dark-Mode-Regeln dürfen im Legacy-System verbleiben", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  assert.match(source, /html, body\s*\{/);
  assert.match(source, /@media\s*\(prefers-color-scheme:\s*dark\)/);
});

test("Base Layer enthält Dokument-Basisregeln", () => {
  const base = fs.readFileSync(baseFile, "utf8");
  assert.match(base, /(?:^|\n)html\s*\{/);
  assert.match(base, /(?:^|\n)body\s*\{/);
});
