import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const FILE = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "src",
  "components",
  "admin",
  "ResearchWorkbench.astro"
);

test("Research Workbench nutzt dark-mode-fähige Oberflächen-Tokens", () => {
  const source = fs.readFileSync(FILE, "utf8");
  assert.match(source, /--growth-surface:/);
  assert.match(source, /--growth-surface-raised:/);
  assert.match(source, /--growth-border:/);
  assert.match(source, /--growth-text:/);
  assert.match(source, /--growth-code-bg:/);
  assert.doesNotMatch(source, /background:var\(--seo-surface-subtle,#f4f6f8\)/);
});

test("Helle Inhaltsboxen bekommen passende Text- und Randfarben", () => {
  const source = fs.readFileSync(FILE, "utf8");
  assert.match(source, /\.growth-gaps\{[^}]*color:var\(--growth-text\)/);
  assert.match(source, /\.growth-gaps\{[^}]*background:var\(--growth-surface-raised\)/);
  assert.match(source, /\.growth-brief__content\{[^}]*background:var\(--growth-surface-raised\)/);
  assert.match(source, /\.growth-actions code\{[^}]*color:var\(--growth-code-text\)/);
});
