import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const extensions = new Set([".md", ".mdx", ".astro", ".ts", ".tsx", ".js", ".mjs", ".json"]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const output = [];

  for (const entry of entries) {
    if (["node_modules", "dist", ".patch-backups", "reports", "generated"].includes(entry.name)) {
      continue;
    }

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await walk(full));
    else if (extensions.has(path.extname(entry.name).toLowerCase())) output.push(full);
  }

  return output;
}

test("no malformed comparison links remain in public source", async () => {
  const roots = [
    path.join(appRoot, "src"),
    path.join(repoRoot, "packages", "affiliate-core", "src")
  ];

  for (const root of roots) {
    for (const file of await walk(root)) {
      const source = await fs.readFile(file, "utf8");
      assert.doesNotMatch(
        source,
        /\/vergleiche\/-[a-z0-9-]+\/?/i,
        path.relative(repoRoot, file)
      );
    }
  }
});

test("recovered feeder comparison links point to existing comparison files", async () => {
  const comparisonDir = path.join(appRoot, "src", "content", "comparisons");
  const names = new Set(
    (await fs.readdir(comparisonDir))
      .filter((name) => /\.mdx?$/.test(name))
      .map((name) => name.replace(/\.mdx?$/, ""))
  );

  for (const slug of [
    "beste-futterautomaten-fuer-katzen",
    "beste-futterautomaten-fuer-hunde",
    "beste-futterautomaten-fuer-nassfutter"
  ]) {
    assert.ok(names.has(slug), slug);
  }
});
