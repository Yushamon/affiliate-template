#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-product-gallery-css-consolidation-28.2.0";
const HERE = path.dirname(new URL(import.meta.url).pathname);

function log(message) {
  console.log(`[${PATCH}] ${message}`);
}

function findRoot(start) {
  let current = path.resolve(start);
  for (let depth = 0; depth < 16; depth += 1) {
    if (fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

function replaceStyleBlock(source, label, css) {
  const starts = [...source.matchAll(/<style>/g)];
  const ends = [...source.matchAll(/<\/style>/g)];
  if (starts.length !== 1 || ends.length !== 1) {
    throw new Error(`${label}: erwartet genau einen Style-Block.`);
  }
  const start = starts[0].index;
  const end = ends[0].index + "</style>".length;
  return source.slice(0, start) + `<style>\n${css.trim()}\n</style>` + source.slice(end);
}

function writeIfChanged(file, content, root) {
  const normalized = content.replace(/\r\n/g, "\n").replace(/\s+$/u, "") + "\n";
  const current = fs.existsSync(file)
    ? fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n")
    : "";
  if (current === normalized) {
    log(`Bereits aktuell: ${path.relative(root, file)}`);
    return false;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, normalized, "utf8");
  log(`Geändert: ${path.relative(root, file)}`);
  return true;
}

function run(command, args, label, cwd) {
  log(`Prüfe: ${label}`);
  const executable =
    process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const result = spawnSync(executable, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} fehlgeschlagen (Exit ${result.status}).`);
  }
  log(`BESTANDEN: ${label}`);
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const FILES = {
  experience: path.join(APP, "src/components/product-experience-2/ProductExperience2.astro"),
  hero: path.join(APP, "src/components/product-experience-2/ProductHero2.astro"),
  gallery: path.join(APP, "src/components/product-experience-2/ProductGallery2.astro"),
  package: path.join(APP, "package.json"),
  test: path.join(APP, "test/product-gallery-css-consolidation-28.2.0.test.mjs"),
};

for (const [label, file] of Object.entries(FILES)) {
  if (label === "test") continue;
  if (!fs.existsSync(file)) throw new Error(`${label}: Datei fehlt.`);
  if (label !== "package" && /^(<<<<<<<|=======|>>>>>>>)/m.test(fs.readFileSync(file, "utf8"))) {
    throw new Error(`${label}: ungelöste Git-Konfliktmarker.`);
  }
}

let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync(FILES.package, "utf8"));
} catch {
  throw new Error("package.json ist ungültig.");
}
for (const script of ["lint:content", "build"]) {
  if (typeof packageJson.scripts?.[script] !== "string") {
    throw new Error(`Erforderliches npm-Skript fehlt: ${script}`);
  }
}

const cssFiles = {
  experience: path.join(HERE, "ProductExperience2.clean.css"),
  hero: path.join(HERE, "ProductHero2.clean.css"),
  gallery: path.join(HERE, "ProductGallery2.clean.css"),
};
for (const file of Object.values(cssFiles)) {
  if (!fs.existsSync(file)) throw new Error(`Begleitdatei fehlt: ${path.basename(file)}`);
}

let experience = fs.readFileSync(FILES.experience, "utf8");
let hero = fs.readFileSync(FILES.hero, "utf8");
let gallery = fs.readFileSync(FILES.gallery, "utf8");

for (const marker of ['data-product-experience="2.1"', "<ProductHero2 model={model} />"]) {
  if (!experience.includes(marker)) throw new Error(`Experience-Anker fehlt: ${marker}`);
}
for (const marker of ["data-mobile-gallery-full-bleed", "<ProductGallery2 name={model.name} items={model.gallery} />"]) {
  if (!hero.includes(marker)) throw new Error(`Hero-Anker fehlt: ${marker}`);
}
for (const marker of ["data-px2-editorial-gallery", "data-gallery-dialog", "px2-editorial-lightbox__thumb"]) {
  if (!gallery.includes(marker)) throw new Error(`Galerie-Anker fehlt: ${marker}`);
}

experience = replaceStyleBlock(experience, "ProductExperience2", fs.readFileSync(cssFiles.experience, "utf8"));
hero = replaceStyleBlock(hero, "ProductHero2", fs.readFileSync(cssFiles.hero, "utf8"));
gallery = replaceStyleBlock(gallery, "ProductGallery2", fs.readFileSync(cssFiles.gallery, "utf8"));

const TEST_CONTENT = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (name) => fs.readFileSync(
  path.join(process.cwd(), "src/components/product-experience-2", name),
  "utf8",
);
const experience = read("ProductExperience2.astro");
const hero = read("ProductHero2.astro");
const gallery = read("ProductGallery2.astro");
const count = (source, pattern) => [...source.matchAll(pattern)].length;

test("jeder Baustein besitzt genau einen Style-Block", () => {
  assert.equal(count(experience, /<style>/g), 1);
  assert.equal(count(hero, /<style>/g), 1);
  assert.equal(count(gallery, /<style>/g), 1);
});
test("Produkt-Root kompensiert den realen mobilen Abstand", () => {
  assert.match(experience, /margin-block-start: -90px/);
  assert.doesNotMatch(experience, /main\\.container:has/);
  assert.doesNotMatch(experience, /px2-page-gutter/);
});
test("Hero besitzt genau eine Full-Bleed-Regel", () => {
  assert.equal(count(hero, /px2-hero__media\\[data-mobile-gallery-full-bleed\\]/g), 1);
  assert.match(hero, /left: 50%/);
  assert.match(hero, /width: 100vw/);
  assert.match(hero, /margin: 0 0 0 -50vw/);
});
test("fehlgeschlagene Full-Bleed-Varianten sind entfernt", () => {
  assert.doesNotMatch(hero, /100dvw|translateX|px2-page-gutter/);
  assert.doesNotMatch(gallery, /margin-inline: calc\\(50% - 50vw\\)/);
});
test("Galerie besitzt nur einen normalen Mobile-Block", () => {
  assert.equal(count(gallery, /@media \\(max-width: 759px\\) \\{/g), 1);
});
test("Galerie bleibt kompakt und randlos", () => {
  assert.match(gallery, /height: clamp\\(280px, 44svh, 520px\\)/);
  assert.match(gallery, /max-height: 52svh/);
  assert.match(gallery, /object-fit: cover/);
  assert.match(gallery, /border-radius: 0/);
});
test("Lightbox-Thumbnails bleiben zentriert", () => {
  assert.match(gallery, /px2-editorial-lightbox__thumb \\{[^}]*display: grid/s);
  assert.match(gallery, /place-items: center/);
  assert.match(gallery, /line-height: 0/);
  assert.match(gallery, /object-position: center/);
});
`;

const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
const TARGETS = [FILES.experience, FILES.hero, FILES.gallery, FILES.test];
fs.mkdirSync(BACKUP, { recursive: true });
for (const file of TARGETS) {
  if (!fs.existsSync(file)) continue;
  const destination = path.join(BACKUP, path.relative(ROOT, file));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
}
log(`Backup: ${path.relative(ROOT, BACKUP)}`);

const rollback = () => {
  for (const file of TARGETS) {
    const backup = path.join(BACKUP, path.relative(ROOT, file));
    if (fs.existsSync(backup)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(backup, file);
    } else if (file === FILES.test && fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
    }
  }
};

try {
  writeIfChanged(FILES.experience, experience, ROOT);
  writeIfChanged(FILES.hero, hero, ROOT);
  writeIfChanged(FILES.gallery, gallery, ROOT);
  writeIfChanged(FILES.test, TEST_CONTENT, ROOT);

  run(process.execPath, ["--check", path.relative(APP, FILES.test)], "Syntaxprüfung", APP);
  run(process.execPath, ["--test", path.relative(APP, FILES.test)], "Galerie-CSS-Konsolidierungstest", APP);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "lint:content"], "Content-Lint", ROOT);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], "Astro-Build", ROOT);

  const combined =
    fs.readFileSync(FILES.experience, "utf8") +
    fs.readFileSync(FILES.hero, "utf8") +
    fs.readFileSync(FILES.gallery, "utf8");
  for (const legacy of [
    "main.container:has",
    "--px2-page-gutter",
    "100dvw",
    "translateX(-50%)",
    "margin-inline: calc(50% - 50vw)",
  ]) {
    if (combined.includes(legacy)) throw new Error(`Legacy-Regel bleibt: ${legacy}`);
  }

  log("BESTANDEN: oberer und seitlicher Galerieabstand konsolidiert.");
  log("BESTANDEN: fehlgeschlagene Mobile-Regeln entfernt.");
  log("BESTANDEN: Thumbnail-Zentrierung und Höhenmodell erhalten.");
  log("Abgeschlossen.");
} catch (error) {
  rollback();
  log(`FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  log("Änderungen wurden zurückgerollt.");
  process.exitCode = 1;
}
