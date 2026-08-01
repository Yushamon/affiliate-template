import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");

const files = {
  home: path.join(ROOT, "packages", "affiliate-core", "src", "components", "home", "HomeHero.astro"),
  gallery: path.join(APP, "src", "components", "product-experience-2", "ProductGallery2.astro"),
  alternatives: path.join(APP, "src", "components", "product-standard-2", "AlternativesGrid.astro"),
  comparisonExperience: path.join(ROOT, "packages", "affiliate-core", "src", "components", "ComparisonExperience.astro"),
  comparisonExplorer: path.join(ROOT, "packages", "affiliate-core", "src", "components", "comparison", "ComparisonExplorer.astro"),
  lightbox: path.join(ROOT, "packages", "affiliate-core", "src", "components", "ImageLightbox.astro"),
  audit: path.join(APP, "scripts", "seo", "audit-image-alt-text.mjs")
};

const read = (file) => fs.readFileSync(file, "utf8");

test("Bing-relevante Bildkomponenten besitzen keine leeren statischen Alt-Texte", () => {
  for (const [name, file] of Object.entries(files)) {
    assert.ok(fs.existsSync(file), name + " fehlt: " + file);
    if (!file.endsWith(".astro")) continue;
    assert.doesNotMatch(read(file), /\balt\s*=\s*["']\s*["']/i, name + " enthält weiterhin einen leeren Alt-Text");
  }
});

test("Komponenten verwenden kontextbezogene Alt-Texte", () => {
  assert.match(read(files.home), /alt=\{hero\.title\}/);
  assert.match(read(files.gallery), /Ansicht \$\{index \+ 1\}/);
  assert.match(read(files.alternatives), /\$\{item\.title\} – Produktansicht/);
  assert.match(read(files.comparisonExperience), /\$\{product\.name\} im Direktvergleich/);
  assert.match(read(files.comparisonExplorer), /\$\{product\.title\} im Direktvergleich/);
  assert.match(read(files.lightbox), /alt="Vergrößerte Bildansicht"/);
  assert.match(read(files.lightbox), /sourceImage\.alt\?\.trim\(\) \|\| "Vergrößerte Bildansicht"/);
});

test("Source-Audit läuft im Strict-Modus ohne Finding", () => {
  execFileSync(process.execPath, [files.audit, "--source-only", "--strict"], {
    cwd: ROOT,
    stdio: "pipe"
  });
});

test("Package-Skripte stellen Audit und Test bereit", () => {
  const pkg = JSON.parse(read(path.join(APP, "package.json")));
  assert.equal(pkg.scripts["audit:image-alt"], "node scripts/seo/audit-image-alt-text.mjs");
  assert.equal(pkg.scripts["audit:image-alt:strict"], "node scripts/seo/audit-image-alt-text.mjs --strict");
  assert.equal(pkg.scripts["test:image-alt"], "node --test test/image-alt-text-24.0.0.test.mjs");
});
