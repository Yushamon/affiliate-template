import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceFile = path.join(APP, "src", "styles", "pfotentechnik-design-system.css");
const indexFile = path.join(APP, "src", "styles", "foundation", "index.css");
const tokensFile = path.join(APP, "src", "styles", "foundation", "tokens.css");

function countTopLevelRootBlocks(css) {
  let count = 0;
  let depth = 0;
  let start = 0;
  let quote = null;
  let comment = false;
  let escaped = false;

  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i];
    const next = css[i + 1];
    if (comment) {
      if (ch === "*" && next === "/") { comment = false; i += 1; }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "/" && next === "*") { comment = true; i += 1; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === "{") {
      if (depth === 0) {
        const selector = css.slice(start, i).replace(/\/\*[\s\S]*?\*\//g, "").trim();
        if (selector === ":root") count += 1;
      }
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth < 0) throw new Error("Ungültige CSS-Klammerung.");
      if (depth === 0) start = i + 1;
    } else if (ch === ";" && depth === 0) {
      start = i + 1;
    }
  }
  assert.equal(depth, 0, "CSS-Klammerung ist nicht ausgeglichen.");
  return count;
}

test("Foundation-Entry und Tokens sind installiert", () => {
  assert.ok(fs.existsSync(indexFile));
  assert.ok(fs.existsSync(tokensFile));
  const source = fs.readFileSync(sourceFile, "utf8");
  const index = fs.readFileSync(indexFile, "utf8");
  assert.match(source, /^@import "\.\/foundation\/index\.css";/);
  assert.match(index, /@import "\.\/tokens\.css";/);
});

test("Design-System enthält keine top-level :root-Blöcke mehr", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  assert.equal(countTopLevelRootBlocks(source), 0);
});

test("Tokens enthalten mindestens einen top-level :root-Block", () => {
  const tokens = fs.readFileSync(tokensFile, "utf8");
  assert.ok(countTopLevelRootBlocks(tokens) >= 1);
});
