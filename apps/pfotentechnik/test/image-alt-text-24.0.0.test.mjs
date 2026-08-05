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
  gallery: path.join(APP, "src", "components", "product-experience-2", "ProductGallery29.astro"),
  alternatives: path.join(APP, "src", "components", "product-standard-2", "AlternativesGrid.astro"),
  comparisonExperience: path.join(ROOT, "packages", "affiliate-core", "src", "components", "ComparisonExperience.astro"),
  comparisonExplorer: path.join(ROOT, "packages", "affiliate-core", "src", "components", "comparison", "ComparisonExplorer.astro"),
  lightbox: path.join(ROOT, "packages", "affiliate-core", "src", "components", "ImageLightbox.astro"),
  audit: path.join(APP, "scripts", "seo", "audit-image-alt-text.mjs")
};

const read = (file) => fs.readFileSync(file, "utf8");

const removeAllowedDecorativeImages = (source) =>
  source.replace(
    /<button\b[^>]*\baria-label\s*=\s*\{?`?Bild\s+\$\{index\s*\+\s*1\}\s+anzeigen`?\}?[^>]*>[\s\S]*?<img\b[^>]*\balt\s*=\s*["']\s*["'][^>]*\/>[\s\S]*?<\/button>/gi,
    "",
  );

test("Bing-relevante Bildkomponenten besitzen keine unbegründeten leeren Alt-Texte", () => {
  for (const [name, file] of Object.entries(files)) {
    assert.ok(fs.existsSync(file), name + " fehlt: " + file);
    if (!file.endsWith(".astro")) continue;

    const source = removeAllowedDecorativeImages(read(file));

    assert.doesNotMatch(
      source,
      /\balt\s*=\s*["']\s*["']/i,
      name + " enthält weiterhin einen unbegründeten leeren Alt-Text",
    );
  }
});

test("Galerie-Thumbnails sind dekorativ und ihr Button besitzt einen zugänglichen Namen", () => {
  const source = read(files.gallery);

  assert.match(
    source,
    /aria-label=\{`Bild \$\{index \+ 1\} anzeigen`\}[\s\S]*?<img[^>]*alt=""/,
  );
});

test("Komponenten verwenden kontextbezogene Alt-Texte", () => {
  assert.match(read(files.home), /alt=\{hero\.title\}/);
  assert.match(read(files.gallery), /alt=\{item\.alt \|\| name\}/);
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
