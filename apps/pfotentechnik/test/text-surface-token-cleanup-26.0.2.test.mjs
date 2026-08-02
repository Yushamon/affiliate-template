import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");

const roots = [
  path.join(app, "src"),
  path.join(root, "packages/affiliate-core/src")
];

const walk = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target);
    return /\.(css|astro)$/.test(entry.name) ? [target] : [];
  });

const files = roots.flatMap(walk);
const joined = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");

test("surface tokens are never used as text foregrounds", () => {
  assert.doesNotMatch(
    joined,
    /(?:color|-webkit-text-fill-color|text-decoration-color|caret-color|fill|stroke)\s*:\s*var\(\s*(?:--pt-color-page|--pt-color-surface(?:-soft|-raised)?|--pt-theme-canvas|--pt-theme-surface(?:-2|-3)?)\s*\)/
  );
});

test("homepage card titles retain the semantic text contract", () => {
  const home = fs.readFileSync(
    path.join(root, "packages/affiliate-core/src/components/home/home.css"),
    "utf8"
  );

  assert.match(
    home,
    /\.home3-card-content h3[\s\S]*?color:\s*var\(--home3-text\)/
  );
  assert.doesNotMatch(
    joined,
    /\.home3-card-content h3\s*\{[^}]*color:\s*var\(--pt-color-page\)/
  );
});

test("no new important declarations are introduced", () => {
  const audit = fs.readFileSync(
    path.join(app, "scripts/design-system/audit-text-surface-token-usage.mjs"),
    "utf8"
  );
  assert.doesNotMatch(audit, /!important/);
});
