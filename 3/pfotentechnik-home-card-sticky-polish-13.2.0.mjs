#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-home-card-sticky-polish-13.2.0";
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check") || args.has("--dry-run");
const NO_BUILD = args.has("--no-build");

const HOME_START = "/* PT_HOME_CARD_UNIFICATION_13_2_0_START */";
const HOME_END = "/* PT_HOME_CARD_UNIFICATION_13_2_0_END */";
const STICKY_START = "<!-- PT_STICKY_SPACING_13_2_0_START -->";
const STICKY_END = "<!-- PT_STICKY_SPACING_13_2_0_END -->";

const log = (message) => console.log(`[${NAME}] ${message}`);
const fail = (message) => {
  console.error(`[${NAME}] FEHLER: ${message}`);
  process.exit(1);
};

function findRoot(start) {
  let current = path.resolve(start);

  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json")) &&
      fs.existsSync(path.join(current, "packages", "affiliate-core"))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

const root =
  findRoot(process.cwd()) ||
  findRoot(path.dirname(fileURLToPath(import.meta.url)));

if (!root) {
  fail("Repository-Root nicht gefunden. Starte den Installer im affiliate-template-Repository.");
}

const files = {
  homeSection: path.join(
    root,
    "packages/affiliate-core/src/components/home/HomeSection.astro"
  ),
  homeCss: path.join(
    root,
    "packages/affiliate-core/src/components/home/home.css"
  ),
  sticky: path.join(
    root,
    "packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro"
  ),
  test: path.join(
    root,
    "apps/pfotentechnik/test/home-card-sticky-polish-13.2.0.test.mjs"
  ),
  report: path.join(
    root,
    "apps/pfotentechnik/reports/design-system/home-card-sticky-polish-13.2.0.md"
  )
};

for (const [key, file] of Object.entries(files)) {
  if (key === "test" || key === "report") continue;
  if (!fs.existsSync(file)) {
    fail(`Pflichtdatei fehlt: ${path.relative(root, file)}`);
  }
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, ".patch-backups", `${NAME}-${timestamp}`);
const relative = (file) => path.relative(root, file).split(path.sep).join("/");
const read = (file) => fs.readFileSync(file, "utf8");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function backup(file) {
  if (CHECK_ONLY || !fs.existsSync(file)) return;
  const target = path.join(backupRoot, relative(file));
  ensureDir(path.dirname(target));
  fs.copyFileSync(file, target);
}

function write(file, content) {
  const before = fs.existsSync(file) ? read(file) : null;
  if (before === content) return false;

  if (!CHECK_ONLY) {
    if (before !== null) backup(file);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, content);
  }

  return true;
}

function stripMarkedBlock(content, start, end) {
  const startIndex = content.indexOf(start);
  if (startIndex === -1) return content;

  const endIndex = content.indexOf(end, startIndex + start.length);
  if (endIndex === -1) {
    fail(`Unvollständiger Markerblock gefunden: ${start}`);
  }

  return (
    content.slice(0, startIndex).trimEnd() +
    "\n" +
    content.slice(endIndex + end.length).trimStart()
  );
}

function appendBlock(content, block) {
  return `${content.trimEnd()}\n\n${block.trim()}\n`;
}

function patchHomeSection(source) {
  let next = source;

  /*
   * Nur die äußeren Links bleiben Design-System-Surfaces. Die inneren Medien-
   * und Inhaltsbereiche dürfen keine eigenen Karten mehr erzeugen.
   */
  next = next.replace(
    /class="pt-surface\s+(home3-(?:category-card__(?:media|content)|editorial-card__media|product-card__media|card-content))"/g,
    'class="$1"'
  );

  const forbidden = [
    'class="pt-surface home3-category-card__media"',
    'class="pt-surface home3-category-card__content"',
    'class="pt-surface home3-editorial-card__media"',
    'class="pt-surface home3-product-card__media"',
    'class="pt-surface home3-card-content"'
  ];

  for (const value of forbidden) {
    if (next.includes(value)) {
      fail(`Innere Surface konnte nicht entfernt werden: ${value}`);
    }
  }

  if (!/class="pt-surface home3-product-card"/.test(next)) {
    fail("Äußere Produktkarten-Surface wurde nicht gefunden.");
  }

  if (!/home3-editorial-card__media/.test(next) || !/home3-card-content/.test(next)) {
    fail("Homepage-Kartenstruktur wurde nicht erkannt.");
  }

  return next;
}

const homeCssBlock = String.raw`
${HOME_START}

/*
 * Bild und Inhalt bilden auf der Homepage genau eine Karte.
 * Die Regeln neutralisieren auch ältere pt-surface-Innenstile, falls ein lokaler
 * Stand noch zusätzliche globale Surface-Regeln mitbringt.
 */
.home5 .home3-editorial-card,
.home5 .home3-product-card {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  padding: 0 !important;
  border-radius: 1.15rem;
  background: var(--pt-color-surface, #fff);
  isolation: isolate;
}

.home5 .home3-editorial-card__media,
.home5 .home3-product-card__media,
.home5 .home3-card-content {
  width: 100%;
  margin: 0 !important;
  border-right: 0 !important;
  border-left: 0 !important;
  border-radius: 0 !important;
  background-clip: padding-box;
  box-shadow: none !important;
}

.home5 .home3-editorial-card__media,
.home5 .home3-product-card__media {
  flex: 0 0 auto;
  border-top: 0 !important;
}

.home5 .home3-editorial-card__media {
  border-bottom: 1px solid var(--home3-line) !important;
  background: var(--home3-soft);
}

.home5 .home3-product-card__media {
  border-bottom: 1px solid var(--home3-line) !important;
}

.home5 .home3-card-content {
  flex: 1 1 auto;
  padding: clamp(1.15rem, 2.4vw, 1.4rem) !important;
  border-top: 0 !important;
  border-bottom: 0 !important;
  background: transparent !important;
}

.home5 .home3-card-content > :first-child {
  margin-top: 0;
}

.home5 .home3-card-content > b,
.home5 .home3-card-content > strong {
  margin-top: auto;
  padding-top: 1rem;
}

@media (max-width: 720px) {
  .home5 .home3-editorial-card,
  .home5 .home3-product-card {
    border-radius: 1.05rem;
  }

  .home5 .home3-card-content {
    padding: 1.05rem !important;
  }

  .home5 .home3-product-card__media {
    aspect-ratio: 16 / 10;
  }
}

${HOME_END}
`;

function patchHomeCss(source) {
  const clean = stripMarkedBlock(source, HOME_START, HOME_END);
  return appendBlock(clean, homeCssBlock);
}

const stickyBlock = String.raw`
${STICKY_START}
<style is:global>
  /*
   * Mobile Sticky CTA: Produktname bleibt über den Aktionen, aber ohne die
   * bisher unnötig hohe Box und die großen Innenabstände.
   */
  @media (max-width: 47.99rem) {
    .comparison-sticky-bar--v121 {
      right: max(.625rem, env(safe-area-inset-right)) !important;
      bottom: max(.625rem, env(safe-area-inset-bottom)) !important;
      left: max(.625rem, env(safe-area-inset-left)) !important;
      gap: .5rem !important;
      padding: .625rem !important;
      border-radius: 1.15rem !important;
    }

    .comparison-sticky-bar--v121 .comparison-sticky-bar__identity {
      gap: .125rem !important;
      padding-inline: .25rem !important;
    }

    .comparison-sticky-bar--v121 .comparison-sticky-bar__identity span {
      font-size: .72rem !important;
      line-height: 1.1 !important;
    }

    .comparison-sticky-bar--v121 .comparison-sticky-bar__identity strong {
      display: -webkit-box !important;
      overflow: hidden !important;
      font-size: .92rem !important;
      line-height: 1.18 !important;
      text-overflow: clip !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      -webkit-box-orient: vertical !important;
      -webkit-line-clamp: 2 !important;
    }

    .comparison-sticky-bar--v121 .comparison-sticky-bar__actions {
      grid-template-columns: minmax(0, .88fr) minmax(0, 1.12fr) !important;
      gap: .5rem !important;
    }

    .comparison-sticky-bar--v121 .comparison-button {
      min-height: 3rem !important;
      padding: .7rem .65rem !important;
      font-size: .88rem !important;
      line-height: 1.15 !important;
    }
  }

  @media (max-width: 23rem) {
    .comparison-sticky-bar--v121 {
      right: max(.45rem, env(safe-area-inset-right)) !important;
      left: max(.45rem, env(safe-area-inset-left)) !important;
    }

    .comparison-sticky-bar--v121 .comparison-sticky-bar__actions {
      gap: .4rem !important;
    }

    .comparison-sticky-bar--v121 .comparison-button {
      padding-inline: .45rem !important;
      font-size: .82rem !important;
    }
  }
</style>
${STICKY_END}
`;

function patchSticky(source) {
  const clean = stripMarkedBlock(source, STICKY_START, STICKY_END);
  if (!clean.includes("comparison-sticky-bar--v121")) {
    fail("Sticky-Bar-Komponente wurde nicht erkannt.");
  }
  return appendBlock(clean, stickyBlock);
}

const testSource = String.raw`import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const read = (relative) => fs.readFile(path.join(repoRoot, relative), "utf8");

test("Homepage verwendet nur eine Surface pro Karte", async () => {
  const source = await read(
    "packages/affiliate-core/src/components/home/HomeSection.astro"
  );

  assert.match(source, /class="pt-surface home3-product-card"/);
  assert.doesNotMatch(
    source,
    /class="pt-surface home3-(?:product-card__media|editorial-card__media|card-content)"/
  );
});

test("Homepage verbindet Bild und Text ohne innere Kartenradien", async () => {
  const source = await read(
    "packages/affiliate-core/src/components/home/home.css"
  );

  assert.match(source, /PT_HOME_CARD_UNIFICATION_13_2_0_START/);
  assert.match(source, /\.home5 \.home3-card-content/);
  assert.match(source, /border-radius:\s*0\s*!important/);
  assert.match(source, /background:\s*transparent\s*!important/);
});

test("Mobile Top-Empfehlung hat kompakte, belastbare Abstände", async () => {
  const source = await read(
    "packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro"
  );

  assert.match(source, /PT_STICKY_SPACING_13_2_0_START/);
  assert.match(source, /padding:\s*\.625rem\s*!important/);
  assert.match(source, /gap:\s*\.5rem\s*!important/);
  assert.match(source, /min-height:\s*3rem\s*!important/);
  assert.match(source, /-webkit-line-clamp:\s*2\s*!important/);
});
`;

const report = `# Homepage Card & Sticky Polish 13.2.0

## Befund

Die Homepage-Karten hatten eine äußere \`pt-surface\` und zusätzlich
\`pt-surface\` auf Bild- und Inhaltsbereichen. Dadurch entstanden optisch drei
verschachtelte Karten: Außenrahmen, Bildkarte und Textkarte.

Die mobile Top-Empfehlung verwendete außerdem großzügige Standardabstände,
obwohl Produktname und zwei CTAs bereits genug Höhe beanspruchen.

## Änderung

- Nur die äußere Homepage-Karte bleibt eine Design-System-Surface.
- Bild und Text sind wieder zwei Bereiche derselben Karte.
- Innere Radien, Schatten, Hintergründe und Seitenränder werden neutralisiert.
- Produkt- und Ratgeberkarten folgen derselben Struktur.
- Die mobile Sticky-Bar behält den Produktnamen über den CTAs.
- Außenabstand, Innenabstand, Zeilenabstand und Buttonhöhe wurden reduziert.
- Lange Produktnamen dürfen weiterhin bis zu zwei Zeilen nutzen.
`;

const outputs = {
  homeSection: patchHomeSection(read(files.homeSection)),
  homeCss: patchHomeCss(read(files.homeCss)),
  sticky: patchSticky(read(files.sticky)),
  test: testSource,
  report
};

const changed = [];
for (const [key, content] of Object.entries(outputs)) {
  if (write(files[key], content)) changed.push(relative(files[key]));
}

const validationSource = {
  homeSection: CHECK_ONLY ? outputs.homeSection : read(files.homeSection),
  homeCss: CHECK_ONLY ? outputs.homeCss : read(files.homeCss),
  sticky: CHECK_ONLY ? outputs.sticky : read(files.sticky)
};

if (
  /class="pt-surface home3-(?:product-card__media|editorial-card__media|card-content)"/.test(
    validationSource.homeSection
  )
) {
  fail("Validierung fehlgeschlagen: innere Homepage-Surface ist noch vorhanden.");
}

if (!validationSource.homeCss.includes(HOME_START)) {
  fail("Validierung fehlgeschlagen: Homepage-CSS-Marker fehlt.");
}

if (!validationSource.sticky.includes(STICKY_START)) {
  fail("Validierung fehlgeschlagen: Sticky-CSS-Marker fehlt.");
}

if (CHECK_ONLY) {
  log(changed.length ? `Würde ${changed.length} Datei(en) ändern:` : "Keine Änderungen erforderlich.");
  for (const file of changed) console.log(`- ${file}`);
  process.exit(0);
}

if (changed.length) {
  log(`${changed.length} Datei(en) aktualisiert:`);
  for (const file of changed) console.log(`- ${file}`);
  if (fs.existsSync(backupRoot)) log(`Backups: ${relative(backupRoot)}`);
} else {
  log("Patch ist bereits installiert.");
}

function run(command, commandArgs) {
  const executable =
    process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const result = spawnSync(executable, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    fail(`${command} konnte nicht gestartet werden: ${result.error.message}`);
  }

  return result.status === 0;
}

log("Führe gezielte UI-Strukturtests aus …");
if (
  !run(process.execPath, [
    "--test",
    "apps/pfotentechnik/test/home-card-sticky-polish-13.2.0.test.mjs"
  ])
) {
  fail("UI-Strukturtests fehlgeschlagen.");
}

if (!NO_BUILD) {
  log("Führe PfotenTechnik-Build aus …");
  if (!run("npm", ["run", "build:pfotentechnik"])) {
    fail("PfotenTechnik-Build fehlgeschlagen.");
  }
}

log("Abgeschlossen.");
