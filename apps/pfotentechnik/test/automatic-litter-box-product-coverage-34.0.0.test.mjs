import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(appRoot, "package.json"));
const yaml = require("js-yaml");
const loaderUrl = pathToFileURL(
  path.join(appRoot, "src/lib/seo/topical-authority/loadTopicalAuthority.ts"),
);

test("Katzentoiletten erfassen Inline-Kategorien und Herstellerbeziehungen", async () => {
  const { loadTopicalAuthority } = await import(loaderUrl.href);
  const data = loadTopicalAuthority();
  const cluster = data.clusters.find((item) => item.id === "katzentoiletten");

  assert.ok(cluster, "Katzentoiletten-Cluster fehlt");
  assert.ok(cluster.counts.products >= 5, "Nicht alle kategorisierten Produkte erfasst");
  assert.ok(cluster.counts.manufacturers >= 4, "Herstellerbeziehungen unvollstaendig");
  assert.equal(cluster.coverage.products, true);
  assert.equal(cluster.coverage.manufacturers, true);
  assert.equal(
    data.opportunities.some(
      (item) =>
        item.id === "coverage-katzentoiletten-products" ||
        item.id === "coverage-katzentoiletten-manufacturers",
    ),
    false,
  );
});

test("Vergleich trennt M1-Variante und Devoko-Datenlage strukturell", () => {
  const comparison = fs.readFileSync(
    path.join(
      appRoot,
      "src/content/comparisons/beste-automatische-katzentoiletten.md",
    ),
    "utf8",
  );
  const match = comparison.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, "Vergleichs-Frontmatter fehlt");
  const parsed = yaml.load(match[1], { schema: yaml.JSON_SCHEMA });
  const slugs = parsed.items.map((item) => item.slug);
  assert.ok(slugs.includes("neakasa-m1-lite"));
  assert.equal(slugs.includes("neakasa-m1-plus"), false);
  const devoko = parsed.items.find((item) => item.slug === "devoko-90l-automatisches-katzenklo");
  assert.ok(devoko);
  assert.match(devoko.values.sicherheit, /widerspruechlich/);
  assert.match(devoko.values.platz, /uneinheitlich/);
});
