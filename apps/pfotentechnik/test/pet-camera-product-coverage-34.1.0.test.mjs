import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), "utf8");

test("Haustierkameras gelten mit drei eigenstaendigen Produktklassen als abgedeckt", async () => {
  const loaderUrl = pathToFileURL(
    path.join(appRoot, "src/lib/seo/topical-authority/loadTopicalAuthority.ts"),
  );
  const { loadTopicalAuthority } = await import(loaderUrl.href);
  const data = loadTopicalAuthority();
  const cluster = data.clusters.find((item) => item.id === "haustierkameras");

  assert.ok(cluster, "Haustierkamera-Cluster fehlt");
  assert.ok(cluster.counts.products >= 3, "Mindestens drei Produktklassen erwartet");
  assert.ok(cluster.counts.manufacturers >= 3);
  assert.equal(cluster.coverage.products, true);
  assert.equal(cluster.coverage.journey, true);
  assert.ok(cluster.linkCoverage >= 90);
  assert.equal(
    data.opportunities.some(
      (item) => item.id === "coverage-haustierkameras-products",
    ),
    false,
  );
});

test("Vergleich besitzt genau die drei belegten Entscheidungsrollen", () => {
  const comparison = read("src/content/comparisons/beste-haustierkameras.md");

  for (const role of [
    "Stationaere Pan/Tilt-Pet-Cam",
    "Stationaere Interaktionskamera",
    "Mobile Roboterkamera",
  ]) {
    assert.ok(comparison.includes(role), `Produktrolle fehlt: ${role}`);
  }
  assert.match(comparison, /Keine pauschal beste Haustierkamera/);
});

test("PETLIBRO Scout ist dem vorhandenen Herstellerprofil zugeordnet", () => {
  const manufacturer = read("src/content/manufacturers/petlibro.md");
  assert.match(
    manufacturer,
    /^\s+-\s+"petlibro-scout-smart-camera"\s*$/m,
  );
});

test("Journey-Audit liest Inline-Frontmatter und explizite Ziele strukturiert", () => {
  const audit = read("scripts/seo/audit-decision-journeys.mjs");
  assert.match(audit, /import yaml from "js-yaml"/);
  assert.match(audit, /yaml\.load\(match\[1\]\)/);
  assert.match(audit, /next: Array\.isArray\(data\.decisionJourney\.next\)/);
  assert.match(audit, /fallback: Array\.isArray\(data\.decisionJourney\.fallback\)/);
});
