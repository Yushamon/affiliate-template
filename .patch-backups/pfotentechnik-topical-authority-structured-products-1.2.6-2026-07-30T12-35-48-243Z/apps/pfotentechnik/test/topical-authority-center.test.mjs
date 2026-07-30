import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) =>
  fs.readFileSync(path.join(appRoot, relative), "utf8");

test("Navigation und Seite sind integriert", () => {
  const layout = read("src/layouts/SeoAdminLayout.astro");
  const page = read("src/pages/admin/seo/topical-authority.astro");

  assert.match(layout, /\/admin\/seo\/topical-authority\//);
  assert.match(page, /SeoAdminLayout/);
  assert.match(page, /active\s*=\s*["']topical-authority["']/);
  assert.match(page, /@media\s*\(\s*(?:max-width|min-width)\s*:/);
  assert.match(page, /var\(\s*--seo-/);
});

test("Loader nutzt gewichtete primäre Signale", () => {
  const loader = read(
    "src/lib/seo/topical-authority/loadTopicalAuthority.ts",
  );

  for (const token of [
    "CLUSTER_DEFINITIONS",
    "loadCollection",
    "belongsToCluster",
    "slugPatterns",
    "titlePatterns",
    "descriptionPatterns",
    "bodyPatterns",
    "excludePatterns",
    "primaryEvidence",
    "bodyEvidence",
    "calculateLinkCoverage",
    "buildOpportunities",
    "detectOrphans",
    "loadTopicalAuthority",
  ]) {
    assert.ok(loader.includes(token), `Loader enthält ${token}`);
  }
});

test("Body-Treffer allein ordnen Produkte und Hersteller nicht zu", () => {
  const loader = read(
    "src/lib/seo/topical-authority/loadTopicalAuthority.ts",
  );

  assert.match(
    loader,
    /document\.type === "manufacturer"[\s\S]*return manufacturerEvidence;/,
  );
  assert.match(loader, /bodySignalCount >= 2/);
});

test("Automatische Katzentoiletten bleiben ohne echte Inhalte leer", () => {
  const loader = read(
    "src/lib/seo/topical-authority/loadTopicalAuthority.ts",
  );

  assert.match(
    loader,
    /id: "katzentoiletten"[\s\S]*slugPatterns:[\s\S]*katzentoilette/,
  );
  assert.match(loader, /members\.length === 0\s*\?\s*0/);
  assert.match(
    loader,
    /Für diesen Cluster gibt es derzeit keine ausreichend eindeutigen Projektinhalte/,
  );
});

test("Audit akzeptiert gültige CSS-Formatierungen", () => {
  const audit = read("scripts/seo/audit-topical-authority.mjs");

  assert.match(
    audit,
    /@media\\s\*\\\(\\s\*\(\?:max-width\|min-width\)\\s\*:/,
  );
  assert.doesNotMatch(audit, /includes\(["']@media\(max-width:/);
});


test("Modellprodukte werden über eindeutige Marken erkannt", () => {
  const loader = read(
    "src/lib/seo/topical-authority/loadTopicalAuthority.ts",
  );

  assert.match(loader, /return primaryEvidence \|\| manufacturerEvidence;/);
  assert.match(loader, /petlibro/i);
  assert.match(loader, /tractive/i);
  assert.match(loader, /sureflap/i);
});

test("Topical-Authority-Seite enthält keine bekannten UTF-8-Fehlkodierungen", () => {
  const page = read("src/pages/admin/seo/topical-authority.astro");

  for (const broken of ["Ã¼", "Ã¤", "Ã¶", "âœ", "â€“", "â†"]) {
    assert.equal(page.includes(broken), false, `Fehlkodierung gefunden: ${broken}`);
  }
  assert.match(page, /\.ta-metrics strong[\s\S]*color:/);
  assert.match(page, /\.ta-chip--ok[\s\S]*background:/);
});


test("Produktkategorie nutzt category.key als Source of Truth", () => {
  const loader = read(
    "src/lib/seo/topical-authority/loadTopicalAuthority.ts",
  );

  assert.match(loader, /categoryKey: string;/);
  assert.match(
    loader,
    /parseNestedFrontmatterValue\(raw, "category", "key"\)/,
  );
  assert.match(loader, /const PRODUCT_CATEGORY_CLUSTER_MAP/);
  assert.match(
    loader,
    /if \(categoryCluster\)[\s\S]*return categoryCluster === definition\.id;/,
  );
});

test("Hersteller und Body bestimmen keine Produktkategorie", () => {
  const loader = read(
    "src/lib/seo/topical-authority/loadTopicalAuthority.ts",
  );

  const productBranch = loader.match(
    /if \(document\.type === "product"\) \{([\s\S]*?)\n  \}/,
  );

  assert.ok(productBranch, "Product-Branch fehlt");
  assert.doesNotMatch(productBranch[1], /manufacturerEvidence/);
  assert.doesNotMatch(productBranch[1], /bodyEvidence/);
  assert.match(productBranch[1], /return primaryEvidence;/);
});

test("Produktkategorien werden eindeutig auf Cluster gemappt", () => {
  const loader = read(
    "src/lib/seo/topical-authority/loadTopicalAuthority.ts",
  );

  assert.match(loader, /futterautomaten: "futterautomaten"/);
  assert.match(loader, /trinkbrunnen: "trinkbrunnen"/);
  assert.match(loader, /"gps-tracker": "gps-tracker"/);
  assert.match(loader, /katzenklappen: "katzenklappen"/);
});
