#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-product-gallery-v29-29.2.3";
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
const testFile = path.join(app, "test/product-gallery-v29-29.2.3.test.mjs");
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
    max(calc(50% - 44px), env(safe-area-inset-right))
    max(10px, env(safe-area-inset-bottom))
    max(calc(50% - 44px), env(safe-area-inset-left));
  overflow-x: auto;
  scroll-padding-inline: 50%;
  scrollbar-width: thin;
}`,
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
  scroll-padding-inline: 12px;
  scrollbar-width: thin;
}`,
    "Thumbnail-Leiste links ausrichten"
  );

  write(cssFile, css, repo);

  let gallery = read(galleryFile);
  const centerBlock = `thumbs[activeIndex]?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "center",
            });`;
  const nearestBlock = `thumbs[activeIndex]?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "nearest",
            });`;
  gallery = replaceExactly(gallery, centerBlock, nearestBlock, "Aktives Thumbnail sichtbar halten");

  const openCenterBlock = `thumbs[requestedIndex]?.scrollIntoView({
              behavior: "auto",
              block: "nearest",
              inline: "center",
            });`;
  const openNearestBlock = `thumbs[requestedIndex]?.scrollIntoView({
              behavior: "auto",
              block: "nearest",
              inline: "nearest",
            });`;
  gallery = replaceExactly(gallery, openCenterBlock, openNearestBlock, "Thumbnail beim Öffnen links belassen");

  write(galleryFile, gallery, repo);

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
const gallery = fs.readFileSync(
  path.join(app, "src/components/product-experience-2/ProductGallery29.astro"),
  "utf8"
);

test("Thumbnail-Leiste beginnt links statt in der Mitte", () => {
  assert.match(css, /\\.pg29-lightbox__thumbs\\s*\\{[\\s\\S]*?max\\(12px, env\\(safe-area-inset-left\\)\\)/);
  assert.match(css, /scroll-padding-inline:\\s*12px/);
  assert.doesNotMatch(css, /calc\\(50%\\s*-\\s*44px\\)/);
});

test("Thumbnail-Inhalte bleiben innerhalb ihrer Buttons zentriert", () => {
  assert.match(css, /\\.pg29-lightbox__thumb\\s*\\{[\\s\\S]*?place-items:\\s*center/);
  assert.match(css, /\\.pg29-lightbox__thumb img\\s*\\{[\\s\\S]*?object-fit:\\s*contain[\\s\\S]*?object-position:\\s*50% 50%/);
});

test("JavaScript zentriert die gesamte Thumbnail-Leiste nicht mehr", () => {
  assert.doesNotMatch(gallery, /inline:\\s*"center"/);
  assert.equal((gallery.match(/inline:\\s*"nearest"/g) || []).length, 2);
});

test("mobile Viewportbreite bleibt unverändert aktiv", () => {
  assert.match(css, /width:\\s*100dvw/);
  assert.match(css, /margin-inline:\\s*calc\\(50%\\s*-\\s*50dvw\\)/);
});

test("keine important-Regeln", () => {
  assert.doesNotMatch(css, /!important/);
});
`;
  write(testFile, test, repo);

  run("node", ["--check", testFile], "Syntaxprüfung", repo);
  run("node", ["--test", testFile], "Gallery V29.2.3 Test", repo);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "lint:content"], "Content-Lint", repo);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], "Astro-Build", repo);

  log("BESTANDEN: Thumbnail-Leiste beginnt wieder links.");
  log("BESTANDEN: Kleine Bilder bleiben innerhalb der Thumbnails zentriert.");
  log("BESTANDEN: Die mobile Galerie bleibt viewportbreit.");
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
