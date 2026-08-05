#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-product-gallery-v29-29.2.0";
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
const targetDir = path.dirname(new URL(import.meta.url).pathname);

const files = {
  gallery: path.join(app, "src/components/product-experience-2/ProductGallery29.astro"),
  css: path.join(app, "src/components/product-experience-2/product-gallery-29.css"),
  experience: path.join(app, "src/components/product-experience-2/ProductExperience2.astro"),
  layout: path.join(repo, "packages/affiliate-core/src/styles/layout.css"),
  test: path.join(app, "test/product-gallery-v29-29.2.0.test.mjs"),
  package: path.join(app, "package.json"),
  targets: {
    gallery: path.join(targetDir, "ProductGallery29.target.astro"),
    css: path.join(targetDir, "product-gallery-29.target.css"),
    experience: path.join(targetDir, "ProductExperience2.target.astro"),
    test: path.join(targetDir, "product-gallery-v29-29.2.0.target.test.mjs"),
  },
};

for (const file of [
  files.gallery,
  files.css,
  files.experience,
  files.layout,
  files.package,
  ...Object.values(files.targets),
]) {
  if (!fs.existsSync(file)) throw new Error(`Datei fehlt: ${file}`);
}

const currentGallery = read(files.gallery);
if (!currentGallery.includes("data-product-gallery-v29")) {
  throw new Error("ProductGallery29 ist nicht installiert.");
}

const currentLayout = read(files.layout);
if (!/\.container\.container--product\s*\{[\s\S]*?padding:\s*0 0 calc\(64px \+ env\(safe-area-inset-bottom\)\)/.test(currentLayout)) {
  throw new Error("Mobiler Produktcontainer ist nicht randlos. Layout-Baseline fehlt.");
}

const packageJson = JSON.parse(read(files.package));
for (const script of ["lint:content", "build"]) {
  if (typeof packageJson.scripts?.[script] !== "string") {
    throw new Error(`Erforderliches npm-Skript fehlt: ${script}`);
  }
}

const oldTests = fs.readdirSync(path.join(app, "test"))
  .filter((name) => /^product-gallery-v29-29\.(?:0|1)\.\d+\.test\.mjs$/.test(name))
  .map((name) => path.join(app, "test", name));

const targets = [files.gallery, files.css, files.experience, files.test, ...oldTests];
const backupRoot = path.join(repo, ".patch-backups", `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`);

for (const file of targets) {
  if (!fs.existsSync(file)) continue;
  const relative = path.relative(repo, file);
  const destination = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
}
log(`Backup: ${path.relative(repo, backupRoot)}`);

try {
  for (const file of oldTests) {
    fs.rmSync(file, { force: true });
    log(`Entfernt: ${path.relative(repo, file)}`);
  }

  write(files.gallery, read(files.targets.gallery), repo);
  write(files.css, read(files.targets.css), repo);
  write(files.experience, read(files.targets.experience), repo);
  write(files.test, read(files.targets.test), repo);

  run("node", ["--check", files.test], "Syntaxprüfung des V29.2.0-Tests", repo);
  run("node", ["--test", files.test], "Gallery V29.2.0 Layout-Test", repo);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "lint:content"], "Content-Lint", repo);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], "Astro-Build", repo);

  const finalCss = read(files.css);
  const finalExperience = read(files.experience);
  if (/!important/.test(finalCss)) throw new Error("Unerlaubte important-Regel gefunden.");
  if (/left:\s*50%|100d?vw|margin-left:\s*-50vw|translateX/.test(finalExperience)) {
    throw new Error("Alter Viewport-Ausbruch bleibt in ProductExperience2.");
  }

  log("BESTANDEN: Galerie beginnt ohne oberen Innenbereich direkt am Medienrand.");
  log("BESTANDEN: Galerie reicht mobil ohne eigenen Außenabstand über die Produktbreite.");
  log("BESTANDEN: Lightbox-Bild verwendet natürliche Höhe statt eines vollhohen Leerraum-Containers.");
  log("BESTANDEN: Thumbnailleiste zentriert kleine Bildsätze und bleibt bei vielen Bildern scrollbar.");
  log("Abgeschlossen.");
} catch (error) {
  for (const file of targets) {
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
