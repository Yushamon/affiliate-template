#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-product-gallery-v29-29.2.4";
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
  const beforeCount = source.split(before).length - 1;
  if (beforeCount === 0 && source.includes(after)) return source;
  if (beforeCount !== 1) {
    throw new Error(`${label}: erwartete genau einen Ausgangsblock, gefunden ${beforeCount}.`);
  }
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
const galleryFile = path.join(app, "src/components/product-experience-2/ProductGallery29.astro");
const cssFile = path.join(app, "src/components/product-experience-2/product-gallery-29.css");
const previousTestFile = path.join(app, "test/product-gallery-v29-29.2.3.test.mjs");
const testFile = path.join(app, "test/product-gallery-v29-29.2.4.test.mjs");
const packageFile = path.join(app, "package.json");

for (const file of [galleryFile, cssFile, previousTestFile, packageFile]) {
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

for (const file of [galleryFile, cssFile, previousTestFile, testFile]) {
  if (!fs.existsSync(file)) continue;
  const relative = path.relative(repo, file);
  const destination = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
}
log(`Backup: ${path.relative(repo, backupRoot)}`);

try {
  let gallery = read(galleryFile);

  gallery = replaceExactly(
    gallery,
    `        getCachedImage({ src: item.src, width: 240, height: 180, fit: "contain", quality: "mid" }),`,
    `        getCachedImage({ src: item.src, width: 240, quality: "mid" }),`,
    "Thumbnail-Transformation ohne feste 4:3-Leinwand"
  );

  gallery = replaceExactly(
    gallery,
    `                    <img src={item.thumbSrc} width="120" height="90" alt="" loading="lazy" decoding="async" />`,
    `                    <span class="pg29-lightbox__thumb-frame" aria-hidden="true">
                      <img
                        class="pg29-lightbox__thumb-image"
                        src={item.thumbSrc}
                        width={item.width}
                        height={item.height}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    </span>`,
    "Thumbnail bekommt einen eigenen Contain-Rahmen"
  );

  write(galleryFile, gallery, repo);

  let css = read(cssFile);

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
  border-radius: 5px;
  object-fit: contain;
  object-position: 50% 50%;
}`,
`.pg29-lightbox__thumb-frame {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  margin: 0;
  overflow: hidden;
  border-radius: 5px;
}

.pg29 .pg29-lightbox__thumb > .pg29-lightbox__thumb-frame > .pg29-lightbox__thumb-image {
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: 100%;
  margin: auto;
  padding: 0;
  border: 0;
  border-radius: 0;
  object-fit: contain;
  object-position: 50% 50%;
}`,
    "Thumbnail-Bild vollständig statt flächenfüllend darstellen"
  );

  write(cssFile, css, repo);

  let previousTest = read(previousTestFile);
  previousTest = replaceExactly(
    previousTest,
String.raw`test("Thumbnail-Inhalte bleiben innerhalb ihrer Buttons zentriert", () => {
  assert.match(css, /\.pg29-lightbox__thumb\s*\{[\s\S]*?place-items:\s*center/);
  assert.match(css, /\.pg29-lightbox__thumb img\s*\{[\s\S]*?object-fit:\s*contain[\s\S]*?object-position:\s*50% 50%/);
});`,
String.raw`test("Thumbnail-Inhalte bleiben innerhalb ihrer Buttons zentriert", () => {
  assert.match(css, /\.pg29-lightbox__thumb\s*\{[\s\S]*?place-items:\s*center/);
  assert.match(css, /\.pg29-lightbox__thumb-frame\s*\{[\s\S]*?place-items:\s*center[\s\S]*?overflow:\s*hidden/);
  assert.match(css, /\.pg29 \.pg29-lightbox__thumb > \.pg29-lightbox__thumb-frame > \.pg29-lightbox__thumb-image\s*\{[\s\S]*?max-width:\s*100%[\s\S]*?max-height:\s*100%[\s\S]*?object-fit:\s*contain/);
});`,
    "Bestehenden Regressionstest auf den isolierten Thumbnail-Rahmen umstellen"
  );
  write(previousTestFile, previousTest, repo);

  const test = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gallery = fs.readFileSync(
  path.join(app, "src/components/product-experience-2/ProductGallery29.astro"),
  "utf8"
);
const css = fs.readFileSync(
  path.join(app, "src/components/product-experience-2/product-gallery-29.css"),
  "utf8"
);

test("Thumbnail-Optimierung bewahrt das Seitenverhältnis der Quelldatei", () => {
  assert.match(gallery, /getCachedImage\\(\\{ src: item\\.src, width: 240, quality: "mid" \\}\\)/);
  assert.doesNotMatch(gallery, /width: 240, height: 180/);
  assert.doesNotMatch(gallery, /width: 240[^\\n]*fit: "contain"/);
});

test("jedes Thumbnail besitzt einen isolierten Contain-Rahmen", () => {
  assert.match(gallery, /class="pg29-lightbox__thumb-frame"/);
  assert.match(gallery, /class="pg29-lightbox__thumb-image"/);
  assert.match(gallery, /width=\\{item\\.width\\}/);
  assert.match(gallery, /height=\\{item\\.height\\}/);
});

test("Thumbnail-Bilder werden weder gestreckt noch abgeschnitten", () => {
  assert.match(css, /\\.pg29-lightbox__thumb-frame\\s*\\{[\\s\\S]*?place-items:\\s*center[\\s\\S]*?overflow:\\s*hidden/);
  assert.match(
    css,
    /\\.pg29 \\.pg29-lightbox__thumb > \\.pg29-lightbox__thumb-frame > \\.pg29-lightbox__thumb-image\\s*\\{[\\s\\S]*?width:\\s*auto[\\s\\S]*?max-width:\\s*100%[\\s\\S]*?height:\\s*auto[\\s\\S]*?max-height:\\s*100%[\\s\\S]*?object-fit:\\s*contain/
  );
  assert.doesNotMatch(css, /\\.pg29-lightbox__thumb img\\s*\\{[\\s\\S]*?width:\\s*100%[\\s\\S]*?height:\\s*100%/);
});

test("linksbündige Thumbnail-Leiste und nearest-Scrolling bleiben erhalten", () => {
  assert.match(css, /\\.pg29-lightbox__thumb-list\\s*\\{[\\s\\S]*?justify-content:\\s*flex-start/);
  assert.equal((gallery.match(/inline:\\s*"nearest"/g) || []).length, 2);
  assert.doesNotMatch(gallery, /inline:\\s*"center"/);
});

test("keine important-Regeln", () => {
  assert.doesNotMatch(css, /!important/);
});
`;
  write(testFile, test, repo);

  run("node", ["--check", testFile], "Syntaxprüfung des neuen Regressionstests", repo);
  run("node", ["--test", previousTestFile, testFile], "Gallery V29.2.3 und V29.2.4 Tests", repo);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "lint:content"], "Content-Lint", repo);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], "Astro-Build", repo);

  log("BESTANDEN: Thumbnail-Transformation behält das Original-Seitenverhältnis.");
  log("BESTANDEN: Thumbnail-Bilder werden vollständig und mittig dargestellt.");
  log("BESTANDEN: Die Thumbnail-Leiste bleibt linksbündig.");
  log("Abgeschlossen.");
} catch (error) {
  for (const file of [galleryFile, cssFile, previousTestFile, testFile]) {
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
