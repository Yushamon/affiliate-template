#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-product-gallery-v29-29.2.2";
const log = (message) => console.log(`[${PATCH}] ${message}`);

function findRoot(start) {
  let current = path.resolve(start);
  for (let depth = 0; depth < 16; depth += 1) {
    if (fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function write(file, content, repo) {
  const next = content.replace(/\r\n/g, "\n").replace(/\s+$/u, "") + "\n";
  const current = fs.existsSync(file) ? read(file) : "";
  if (current === next) {
    log(`Bereits aktuell: ${path.relative(repo, file)}`);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next, "utf8");
  log(`Geändert: ${path.relative(repo, file)}`);
}

function replaceExactly(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count === 0 && source.includes(after)) return source;
  if (count !== 1) throw new Error(`${label}: erwartete genau einen Ausgangsblock, gefunden ${count}.`);
  return source.replace(before, after);
}

function run(command, args, label, cwd) {
  log(`Prüfe: ${label}`);
  const executable = process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const result = spawnSync(executable, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} fehlgeschlagen (Exit ${result.status}).`);
  log(`BESTANDEN: ${label}`);
}

const repo = findRoot(process.cwd());
const app = path.join(repo, "apps", "pfotentechnik");
const cssFile = path.join(app, "src/components/product-experience-2/product-gallery-29.css");
const galleryFile = path.join(app, "src/components/product-experience-2/ProductGallery29.astro");
const testFile = path.join(app, "test/product-gallery-v29-29.2.2.test.mjs");
const packageFile = path.join(app, "package.json");

for (const file of [cssFile, galleryFile, packageFile]) {
  if (!fs.existsSync(file)) throw new Error(`Datei fehlt: ${path.relative(repo, file)}`);
}

const packageJson = JSON.parse(read(packageFile));
for (const script of ["lint:content", "build"]) {
  if (typeof packageJson.scripts?.[script] !== "string") {
    throw new Error(`Erforderliches npm-Skript fehlt: ${script}`);
  }
}

const backupRoot = path.join(
  repo,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);
for (const file of [cssFile, galleryFile, testFile]) {
  if (!fs.existsSync(file)) continue;
  const relative = path.relative(repo, file);
  const destination = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
}
log(`Backup: ${path.relative(repo, backupRoot)}`);

try {
  let css = read(cssFile);

  css = replaceExactly(
    css,
`.pg29-lightbox__thumbs {
  width: 100%;
  min-width: 0;
  margin: 0;
  padding:
    10px
    max(12px, env(safe-area-inset-right))
    max(10px, env(safe-area-inset-bottom))
    max(12px, env(safe-area-inset-left));
  overflow-x: auto;
  scrollbar-width: thin;
}`,
`.pg29-lightbox__thumbs {
  width: 100%;
  min-width: 0;
  margin: 0;
  padding:
    10px
    max(calc(50% - 44px), env(safe-area-inset-right))
    max(10px, env(safe-area-inset-bottom))
    max(calc(50% - 44px), env(safe-area-inset-left));
  overflow-x: auto;
  scroll-padding-inline: 50%;
  scrollbar-width: thin;
}`,
    "Thumbnail-Viewport"
  );

  css = replaceExactly(
    css,
`.pg29-lightbox__thumb-list {
  display: flex;
  justify-content: safe center;
  gap: 8px;
  width: max-content;
  min-width: 100%;
  margin: 0 auto;
}`,
`.pg29-lightbox__thumb-list {
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  width: max-content;
  min-width: 0;
  margin: 0;
}`,
    "Thumbnail-Liste"
  );

  css = replaceExactly(
    css,
`.pg29-lightbox__thumb {
  display: grid;
  flex: 0 0 88px;
  place-items: center;
  width: 88px;
  height: 66px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: 8px;
  background: rgba(255, 255, 255, .08);
  cursor: pointer;
}`,
`.pg29-lightbox__thumb {
  display: grid;
  flex: 0 0 88px;
  place-items: center;
  width: 88px;
  height: 66px;
  margin: 0;
  padding: 4px;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: 8px;
  background: rgba(255, 255, 255, .08);
  scroll-snap-align: center;
  cursor: pointer;
}`,
    "Thumbnail-Button"
  );

  css = replaceExactly(
    css,
`.pg29-lightbox__thumb img {
  display: block;
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  object-fit: cover;
  object-position: center;
}`,
`.pg29-lightbox__thumb img {
  display: block;
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 5px;
  object-fit: contain;
  object-position: 50% 50%;
}`,
    "Thumbnail-Bild"
  );

  const mobileOwner = `
@media (max-width: 759px) {
  .pg29 {
    width: 100vw;
    width: 100dvw;
    max-width: none;
    margin-inline: calc(50% - 50vw);
    margin-inline: calc(50% - 50dvw);
  }

  .pg29__mobile,
  .pg29__slide,
  .pg29 .pg29__image {
    width: 100%;
    max-width: none;
    margin-inline: 0;
  }
}
`.trim();

  css = css.replace(
    /\n?\/\* V29\.2\.2: definitive mobile viewport ownership \*\/[\s\S]*?@media \(max-width: 759px\) \{[\s\S]*?\n\}\n?/g,
    "\n"
  ).replace(/\s+$/u, "");
  css += `\n\n/* V29.2.2: definitive mobile viewport ownership */\n${mobileOwner}\n`;

  write(cssFile, css, repo);

  const test = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = fs.readFileSync(
  path.join(app, "src/components/product-experience-2/product-gallery-29.css"),
  "utf8"
);

test("mobile Galerie besitzt die Viewportbreite unabhängig vom Eltern-Gutter", () => {
  assert.match(css, /\\.pg29\\s*\\{[\\s\\S]*?width:\\s*100dvw[\\s\\S]*?margin-inline:\\s*calc\\(50%\\s*-\\s*50dvw\\)/);
});

test("Slides und Bilder füllen die Galerie ohne eigenen Rand", () => {
  assert.match(css, /\\.pg29__mobile,[\\s\\S]*?\\.pg29__slide,[\\s\\S]*?\\.pg29 \\.pg29__image[\\s\\S]*?width:\\s*100%[\\s\\S]*?margin-inline:\\s*0/);
});

test("Thumbnailbilder werden vollständig und mittig dargestellt", () => {
  assert.match(css, /\\.pg29-lightbox__thumb img\\s*\\{[\\s\\S]*?object-fit:\\s*contain[\\s\\S]*?object-position:\\s*50% 50%/);
});

test("aktive Thumbnails können exakt in die Mitte gescrollt werden", () => {
  assert.match(css, /\\.pg29-lightbox__thumbs\\s*\\{[\\s\\S]*?padding:[\\s\\S]*?calc\\(50% - 44px\\)[\\s\\S]*?scroll-padding-inline:\\s*50%/);
  assert.match(css, /\\.pg29-lightbox__thumb\\s*\\{[\\s\\S]*?scroll-snap-align:\\s*center/);
});

test("keine important-Regeln", () => {
  assert.doesNotMatch(css, /!important/);
});
`;
  write(testFile, test, repo);

  run("node", ["--check", testFile], "Syntaxprüfung", repo);
  run("node", ["--test", testFile], "Gallery V29.2.2 Test", repo);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "lint:content"], "Content-Lint", repo);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], "Astro-Build", repo);

  log("BESTANDEN: Galerie ist mobil wirklich viewportbreit.");
  log("BESTANDEN: Thumbnailbilder verwenden contain und sind mittig ausgerichtet.");
  log("BESTANDEN: aktive Thumbnails besitzen symmetrischen Scrollraum.");
  log("Abgeschlossen.");
} catch (error) {
  for (const file of [cssFile, galleryFile, testFile]) {
    const relative = path.relative(repo, file);
    const backup = path.join(backupRoot, relative);
    if (fs.existsSync(backup)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(backup, file);
    } else if (fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
    }
  }
  console.error(`[${PATCH}] FEHLER: ${error.message}`);
  console.error(`[${PATCH}] Änderungen wurden zurückgerollt.`);
  process.exit(1);
}
