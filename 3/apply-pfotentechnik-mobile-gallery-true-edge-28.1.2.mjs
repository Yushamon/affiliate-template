#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-mobile-gallery-true-edge-28.1.2";

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

function hasConflictMarkers(source) {
  return /^(<<<<<<<|=======|>>>>>>>)(?: .*)?$/m.test(source);
}

function findBlockEnd(source, openingBrace) {
  let depth = 0;
  let quote = "";
  let escaped = false;
  let inComment = false;

  for (let index = openingBrace; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1] || "";

    if (inComment) {
      if (char === "*" && next === "/") {
        inComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }

    if (char === "/" && next === "*") {
      inComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  throw new Error("Block ist nicht geschlossen.");
}

function replaceSelectorBlock(source, selector, replacement, expected = 1) {
  const matches = [];
  let cursor = 0;

  while (cursor < source.length) {
    const index = source.indexOf(selector, cursor);
    if (index < 0) break;

    const before = index > 0 ? source[index - 1] : "";
    const after = source[index + selector.length] || "";
    const validBefore = !before || /[\s},]/.test(before);
    const validAfter = !after || /[\s,{[]/.test(after);

    let brace = index + selector.length;
    while (/\s/.test(source[brace] || "")) brace += 1;

    if (validBefore && validAfter && source[brace] === "{") {
      const end = findBlockEnd(source, brace);
      matches.push({ start: index, end: end + 1 });
      cursor = end + 1;
      continue;
    }

    cursor = index + selector.length;
  }

  if (matches.length !== expected) {
    throw new Error(
      `Selektor ${selector}: ${matches.length} Treffer statt ${expected}.`,
    );
  }

  const match = matches[0];
  return source.slice(0, match.start) + replacement + source.slice(match.end);
}

function insertBeforeStyleEnd(source, label, css) {
  const index = source.lastIndexOf("</style>");
  if (index < 0) throw new Error(`${label}: </style> fehlt.`);
  return source.slice(0, index) + "\n" + css.trim() + "\n" + source.slice(index);
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
const EXPERIENCE = path.join(
  APP,
  "src/components/product-experience-2/ProductExperience2.astro",
);
const HERO = path.join(
  APP,
  "src/components/product-experience-2/ProductHero2.astro",
);
const GALLERY = path.join(
  APP,
  "src/components/product-experience-2/ProductGallery2.astro",
);
const PACKAGE = path.join(APP, "package.json");
const TEST = path.join(
  APP,
  "test/mobile-gallery-true-edge-28.1.2.test.mjs",
);

for (const [label, file] of [
  ["ProductExperience2", EXPERIENCE],
  ["ProductHero2", HERO],
  ["ProductGallery2", GALLERY],
  ["package.json", PACKAGE],
]) {
  if (!fs.existsSync(file)) {
    throw new Error(`${label} fehlt: ${path.relative(ROOT, file)}`);
  }

  const source = fs.readFileSync(file, "utf8");
  if (hasConflictMarkers(source)) {
    throw new Error(`${label} enthält ungelöste Git-Konfliktmarker.`);
  }
}

let experience = fs.readFileSync(EXPERIENCE, "utf8").replace(/\r\n/g, "\n");
let hero = fs.readFileSync(HERO, "utf8").replace(/\r\n/g, "\n");
let gallery = fs.readFileSync(GALLERY, "utf8").replace(/\r\n/g, "\n");

for (const marker of [
  'data-product-experience="2.1"',
  '<ProductHero2 model={model} />',
  ".px2 {",
]) {
  if (!experience.includes(marker)) {
    throw new Error(`ProductExperience2-Strukturanker fehlt: ${marker}`);
  }
}

for (const marker of [
  'class="px2-hero__media"',
  "data-mobile-gallery-full-bleed",
  "margin-left: -50dvw",
]) {
  if (!hero.includes(marker)) {
    throw new Error(`ProductHero2-Strukturanker fehlt: ${marker}`);
  }
}

for (const marker of [
  "px2-editorial-gallery__slide",
  "aspect-ratio: 1 / 1",
  "object-fit: cover",
]) {
  if (!gallery.includes(marker)) {
    throw new Error(`ProductGallery2-Strukturanker fehlt: ${marker}`);
  }
}

let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
} catch {
  throw new Error("package.json ist ungültig.");
}

for (const script of ["lint:content", "build"]) {
  if (typeof packageJson.scripts?.[script] !== "string") {
    throw new Error(`Erforderliches npm-Skript fehlt: ${script}`);
  }
}

const experienceMobileRule = `
  @media (max-width: 759px) {
    :global(main.container:has([data-product-experience="2.1"])) {
      padding-top: 0;
    }

    .px2 {
      --px2-page-gutter: 24px;
    }
  }
`;

if (!experience.includes('main.container:has([data-product-experience="2.1"])')) {
  experience = insertBeforeStyleEnd(
    experience,
    "ProductExperience2",
    experienceMobileRule,
  );
}

const oldHeroMobileSelector =
  ".px2-hero__media[data-mobile-gallery-full-bleed]";

const newHeroRule = `${oldHeroMobileSelector} {
      position: relative;
      left: auto;
      width: calc(100% + (2 * var(--px2-page-gutter, 24px)));
      max-width: none;
      margin-inline: calc(-1 * var(--px2-page-gutter, 24px));
      margin-block-start: 0;
      transform: none;
    }`;

hero = replaceSelectorBlock(
  hero,
  oldHeroMobileSelector,
  newHeroRule,
  1,
);

const galleryMobileRule = `
  @media (max-width: 759px) {
    .px2-editorial-gallery,
    .px2-editorial-gallery__mobile,
    .px2-editorial-gallery__slide,
    .px2-editorial-gallery__slide img {
      border-radius: 0;
    }

    .px2-editorial-gallery {
      width: 100%;
      max-width: none;
      margin: 0;
    }

    .px2-editorial-gallery__mobile {
      margin: 0;
    }
  }
`;

if (!gallery.includes(
  ".px2-editorial-gallery__slide img {\n      border-radius: 0;",
)) {
  gallery = insertBeforeStyleEnd(
    gallery,
    "ProductGallery2",
    galleryMobileRule,
  );
}

const TEST_CONTENT = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (name) =>
  fs.readFileSync(
    path.join(
      process.cwd(),
      "src/components/product-experience-2",
      name,
    ),
    "utf8",
  );

const experience = read("ProductExperience2.astro");
const hero = read("ProductHero2.astro");
const gallery = read("ProductGallery2.astro");

test("Produktseiten entfernen nur mobil den oberen Containerabstand", () => {
  assert.match(
    experience,
    /main\\.container:has\\(\\[data-product-experience="2\\.1"\\]\\)/,
  );
  assert.match(experience, /padding-top: 0/);
  assert.match(experience, /--px2-page-gutter: 24px/);
});

test("Media-Wrapper kompensiert exakt den Seiten-Gutter", () => {
  assert.match(
    hero,
    /width: calc\\(100% \\+ \\(2 \\* var\\(--px2-page-gutter, 24px\\)\\)\\)/,
  );
  assert.match(
    hero,
    /margin-inline: calc\\(-1 \\* var\\(--px2-page-gutter, 24px\\)\\)/,
  );
  assert.match(hero, /left: auto/);
  assert.match(hero, /transform: none/);
});

test("alte viewportbasierte Verschiebung ist entfernt", () => {
  assert.doesNotMatch(hero, /left: 50%/);
  assert.doesNotMatch(hero, /margin-left: -50vw/);
  assert.doesNotMatch(hero, /margin-left: -50dvw/);
  assert.doesNotMatch(hero, /width: 100dvw/);
});

test("Galerie besitzt mobil keinerlei Außenrundung", () => {
  assert.match(gallery, /px2-editorial-gallery__slide img/);
  assert.match(gallery, /border-radius: 0/);
  assert.match(gallery, /px2-editorial-gallery__mobile/);
  assert.match(gallery, /margin: 0/);
});

test("übrige Produktinhalte behalten den Container-Gutter", () => {
  assert.doesNotMatch(
    experience,
    /main\\.container:has\\([^)]*\\)[^{]*\\{[^}]*padding-inline:\\s*0/s,
  );
});
`;

const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
const TARGETS = [EXPERIENCE, HERO, GALLERY, TEST];

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
    } else if (file === TEST && fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
    }
  }
};

try {
  writeIfChanged(EXPERIENCE, experience, ROOT);
  writeIfChanged(HERO, hero, ROOT);
  writeIfChanged(GALLERY, gallery, ROOT);
  writeIfChanged(TEST, TEST_CONTENT, ROOT);

  run(
    process.execPath,
    ["--check", path.relative(APP, TEST)],
    "Syntaxprüfung des True-Edge-Tests",
    APP,
  );
  run(
    process.execPath,
    ["--test", path.relative(APP, TEST)],
    "True-Edge-Galerie-Test",
    APP,
  );
  run(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "lint:content"],
    "Content-Lint",
    ROOT,
  );
  run(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "build"],
    "Astro-Build",
    ROOT,
  );

  const installedExperience = fs.readFileSync(EXPERIENCE, "utf8");
  const installedHero = fs.readFileSync(HERO, "utf8");
  const installedGallery = fs.readFileSync(GALLERY, "utf8");

  for (const marker of [
    'main.container:has([data-product-experience="2.1"])',
    "padding-top: 0",
    "--px2-page-gutter: 24px",
  ]) {
    if (!installedExperience.includes(marker)) {
      throw new Error(`Experience-Zielzustand fehlt: ${marker}`);
    }
  }

  for (const marker of [
    "width: calc(100% + (2 * var(--px2-page-gutter, 24px)))",
    "margin-inline: calc(-1 * var(--px2-page-gutter, 24px))",
    "left: auto",
  ]) {
    if (!installedHero.includes(marker)) {
      throw new Error(`Hero-Zielzustand fehlt: ${marker}`);
    }
  }

  for (const legacy of [
    "margin-left: -50dvw",
    "margin-left: -50vw",
    "width: 100dvw",
  ]) {
    if (installedHero.includes(legacy)) {
      throw new Error(`Legacy-Full-Bleed-Regel ist noch vorhanden: ${legacy}`);
    }
  }

  if (!installedGallery.includes("border-radius: 0")) {
    throw new Error("Mobile Außenrundung wurde nicht entfernt.");
  }

  log("BESTANDEN: Galerie berührt oben, links und rechts den mobilen Viewport.");
  log("BESTANDEN: restlicher Produktinhalt behält seinen Seiten-Gutter.");
  log("Abgeschlossen.");
} catch (error) {
  rollback();
  log(`FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  log("Änderungen wurden zurückgerollt.");
  process.exitCode = 1;
}
