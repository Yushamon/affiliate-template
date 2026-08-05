#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-product-gallery-v29-29.2.1";
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
const sourceDir = path.dirname(new URL(import.meta.url).pathname);

const files = {
  gallery: path.join(app, "src/components/product-experience-2/ProductGallery29.astro"),
  css: path.join(app, "src/components/product-experience-2/product-gallery-29.css"),
  premium: path.join(app, "src/styles/pfotentechnik-product-mobile-premium.css"),
  test: path.join(app, "test/product-gallery-v29-29.2.1.test.mjs"),
  package: path.join(app, "package.json"),
  targets: {
    gallery: path.join(sourceDir, "ProductGallery29.target.astro"),
    css: path.join(sourceDir, "product-gallery-29.target.css"),
    premiumPatch: path.join(sourceDir, "premium-mobile-width-owner.css"),
    test: path.join(sourceDir, "product-gallery-v29-29.2.1.target.test.mjs"),
  },
};

for (const file of [
  files.gallery,
  files.css,
  files.premium,
  files.package,
  ...Object.values(files.targets),
]) {
  if (!fs.existsSync(file)) throw new Error(`Datei fehlt: ${file}`);
}

const currentGallery = read(files.gallery);
if (!currentGallery.includes("data-product-gallery-v29")) {
  throw new Error("Gallery V29 ist nicht installiert.");
}

const packageJson = JSON.parse(read(files.package));
for (const script of ["lint:content", "build"]) {
  if (typeof packageJson.scripts?.[script] !== "string") {
    throw new Error(`Erforderliches npm-Skript fehlt: ${script}`);
  }
}

const obsoleteTests = fs.readdirSync(path.join(app, "test"))
  .filter((name) => /^product-gallery-v29-29\.2\.0\.test\.mjs$/.test(name))
  .map((name) => path.join(app, "test", name));

const targets = [files.gallery, files.css, files.premium, files.test, ...obsoleteTests];
const backupRoot = path.join(
  repo,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

for (const file of targets) {
  if (!fs.existsSync(file)) continue;
  const relative = path.relative(repo, file);
  const destination = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
}
log(`Backup: ${path.relative(repo, backupRoot)}`);

try {
  for (const file of obsoleteTests) {
    fs.rmSync(file, { force: true });
    log(`Entfernt: ${path.relative(repo, file)}`);
  }

  write(files.gallery, read(files.targets.gallery), repo);
  write(files.css, read(files.targets.css), repo);

  let premium = read(files.premium);
  premium = premium.replace(
    /\/\* V29\.2\.1: mobile product width ownership \*\/[\s\S]*?@media \(max-width: 759px\) \{[\s\S]*?\n\}\n?/g,
    ""
  ).replace(/\s+$/u, "");
  premium += `\n\n${read(files.targets.premiumPatch).trim()}\n`;
  write(files.premium, premium, repo);

  write(files.test, read(files.targets.test), repo);

  run("node", ["--check", files.test], "Syntaxprüfung", repo);
  run("node", ["--test", files.test], "Gallery V29.2.1 Layout-Test", repo);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "lint:content"], "Content-Lint", repo);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], "Astro-Build", repo);

  log("BESTANDEN: Produktseitenwurzel besitzt mobil kein horizontales Padding.");
  log("BESTANDEN: Galerie reicht bis an beide Seiten der Produktbreite.");
  log("BESTANDEN: Folgeelemente verwenden 12px statt verschachtelter Abstände.");
  log("BESTANDEN: Aktives Thumbnail wird nach Öffnen der Lightbox zentriert.");
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
