#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-product-gallery-layout-owner-28.2.1";
const log = (m) => console.log(`[${PATCH}] ${m}`);

function root(start) {
  let current = path.resolve(start);
  for (let i = 0; i < 16; i += 1) {
    if (fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

function replaceStyle(source, css, label) {
  const starts = [...source.matchAll(/<style>/g)];
  const ends = [...source.matchAll(/<\/style>/g)];
  if (starts.length !== 1 || ends.length !== 1) throw new Error(`${label}: genau ein Style-Block erwartet.`);
  return source.slice(0, starts[0].index) + `<style>\n${css.trim()}\n</style>` + source.slice(ends[0].index + 8);
}

function write(file, content, repo) {
  const next = content.replace(/\r\n/g, "\n").replace(/\s+$/u, "") + "\n";
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n") : "";
  if (current === next) return log(`Bereits aktuell: ${path.relative(repo, file)}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next, "utf8");
  log(`Geändert: ${path.relative(repo, file)}`);
}

function run(command, args, label, cwd) {
  log(`Prüfe: ${label}`);
  const executable = process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const result = spawnSync(executable, args, { cwd, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} fehlgeschlagen (Exit ${result.status}).`);
  log(`BESTANDEN: ${label}`);
}

const REPO = root(process.cwd());
const APP = path.join(REPO, "apps", "pfotentechnik");
const files = {
  renderer: path.join(APP, "src/components/product-standard-2/ProductRenderer.astro"),
  experience: path.join(APP, "src/components/product-experience-2/ProductExperience2.astro"),
  hero: path.join(APP, "src/components/product-experience-2/ProductHero2.astro"),
  gallery: path.join(APP, "src/components/product-experience-2/ProductGallery2.astro"),
  test: path.join(APP, "test/product-gallery-layout-owner-28.2.1.test.mjs"),
};

for (const file of Object.values(files).slice(0, 4)) {
  if (!fs.existsSync(file)) throw new Error(`Datei fehlt: ${path.relative(REPO, file)}`);
  if (/^(<<<<<<<|=======|>>>>>>>)/m.test(fs.readFileSync(file, "utf8"))) throw new Error(`Git-Konfliktmarker: ${path.relative(REPO, file)}`);
}

let renderer = fs.readFileSync(files.renderer, "utf8");
let experience = fs.readFileSync(files.experience, "utf8");
let hero = fs.readFileSync(files.hero, "utf8");
let gallery = fs.readFileSync(files.gallery, "utf8");

if (!renderer.includes("<ProductExperience2 model={model} />")) throw new Error("Renderer-Anker fehlt.");
if (!experience.includes('data-product-experience="2.1"')) throw new Error("Experience-Anker fehlt.");
if (!hero.includes("data-mobile-gallery-full-bleed")) throw new Error("Hero-Anker fehlt.");
if (!gallery.includes("data-gallery-mobile-track")) throw new Error("Galerie-Anker fehlt.");

renderer = renderer.replace(
  "<ProductExperience2 model={model} />",
  `<div class="px2-route-layout-owner">\n  <ProductExperience2 model={model} />\n</div>\n\n<style>\n  :global(main.container:has(.px2-route-layout-owner)) { max-width: none; padding: 0; }\n  .px2-route-layout-owner { width: 100%; }\n</style>`
);

const experienceCss = fs.readFileSync(new URL("./ProductExperience2.target.css", import.meta.url), "utf8");
const heroCss = fs.readFileSync(new URL("./ProductHero2.target.css", import.meta.url), "utf8");
experience = replaceStyle(experience, experienceCss, "ProductExperience2");
hero = replaceStyle(hero, heroCss, "ProductHero2");

gallery = gallery
  .replace(/\.px2-editorial-gallery__slide\s*\{[\s\S]*?\}/, `.px2-editorial-gallery__slide { position: relative; flex: 0 0 100%; width: 100%; height: 100%; max-height: none; margin: 0; padding: 0; overflow: hidden; border: 0; border-radius: 0; background: transparent; scroll-snap-align: start; scroll-snap-stop: always; cursor: zoom-in; }`)
  .replace(/\.px2-editorial-gallery__slide img\s*\{[\s\S]*?\}/, `.px2-editorial-gallery__slide img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; max-width: none; margin: 0; border-radius: 0; object-fit: cover; object-position: center; background: transparent; }`)
  .replace(/margin-inline:\s*calc\(50%\s*-\s*50vw\);?/g, "")
  .replace(/width:\s*100vw;?/g, "")
  .replace(/100dvw/g, "100%")
  .replace(/transform:\s*translateX\(-50%\);?/g, "");

const test = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const renderer = read("src/components/product-standard-2/ProductRenderer.astro");
const experience = read("src/components/product-experience-2/ProductExperience2.astro");
const hero = read("src/components/product-experience-2/ProductHero2.astro");
const gallery = read("src/components/product-experience-2/ProductGallery2.astro");
test("Route besitzt Layout-Owner", () => { assert.match(renderer, /px2-route-layout-owner/); assert.match(renderer, /padding: 0/); });
test("Experience besitzt den Inhaltsgutter", () => { assert.match(experience, /padding: 70px 24px/); assert.match(experience, /padding-top: 0/); assert.doesNotMatch(experience, /margin-block-start: -90px/); });
test("Galerie bricht exakt um 24px aus", () => { assert.match(hero, /width: calc\(100% \+ 48px\)/); assert.match(hero, /margin: 0 -24px/); assert.doesNotMatch(hero, /100vw|100dvw|translateX|left: 50%/); });
test("Bild füllt den Slide", () => { assert.match(gallery, /position: absolute/); assert.match(gallery, /inset: 0/); assert.match(gallery, /object-fit: cover/); });
test("alte Hacks fehlen", () => { const all = renderer + experience + hero + gallery; assert.doesNotMatch(all, /px2-page-gutter|calc\(50% - 50vw\)|100dvw|translateX\(-50%\)/); });
test("Thumbnails bleiben zentriert", () => { assert.match(gallery, /place-items: center/); assert.match(gallery, /object-position: center/); });
`;

const backup = path.join(REPO, ".patch-backups", `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
fs.mkdirSync(backup, { recursive: true });
for (const file of Object.values(files)) {
  if (!fs.existsSync(file)) continue;
  const dest = path.join(backup, path.relative(REPO, file));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
}
log(`Backup: ${path.relative(REPO, backup)}`);

const rollback = () => {
  for (const file of Object.values(files)) {
    const saved = path.join(backup, path.relative(REPO, file));
    if (fs.existsSync(saved)) fs.copyFileSync(saved, file);
    else if (file === files.test && fs.existsSync(file)) fs.rmSync(file, { force: true });
  }
};

try {
  write(files.renderer, renderer, REPO);
  write(files.experience, experience, REPO);
  write(files.hero, hero, REPO);
  write(files.gallery, gallery, REPO);
  write(files.test, test, REPO);
  run(process.execPath, ["--check", path.relative(APP, files.test)], "Syntaxprüfung", APP);
  run(process.execPath, ["--test", path.relative(APP, files.test)], "Layout-Owner-Test", APP);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "lint:content"], "Content-Lint", REPO);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], "Astro-Build", REPO);
  log("Abgeschlossen.");
} catch (error) {
  rollback();
  log(`FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  log("Änderungen wurden zurückgerollt.");
  process.exitCode = 1;
}
