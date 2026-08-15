import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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

test("Vergleich grenzt M1-Lieferumfang und Devoko-Datenlage ab", () => {
  const comparison = fs.readFileSync(
    path.join(
      appRoot,
      "src/content/comparisons/beste-automatische-katzentoiletten.md",
    ),
    "utf8",
  );

  assert.match(comparison, /Lite ist vor allem eine Lieferumfangsvariante/);
  assert.match(comparison, /Devoko ist die preisorientierte geschlossene Alternative/);
  assert.match(comparison, /uneinheitlicher Modell- und Servicedaten/);
});
