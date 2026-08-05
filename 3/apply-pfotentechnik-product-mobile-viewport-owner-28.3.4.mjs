#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-product-mobile-viewport-owner-28.3.4";
const log = (message) => console.log(`[${PATCH}] ${message}`);

function findRoot(start) {
  let current = path.resolve(start);

  for (let depth = 0; depth < 16; depth += 1) {
    if (
      fs.existsSync(
        path.join(current, "apps", "pfotentechnik", "package.json"),
      )
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new Error("Repository-Wurzel nicht gefunden.");
}

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function assertClean(file, source, repo) {
  if (/^(<<<<<<<|=======|>>>>>>>)(?: .*)?$/m.test(source)) {
    throw new Error(`Git-Konfliktmarker: ${path.relative(repo, file)}`);
  }
}

function findStyleRange(source, label) {
  const starts = [...source.matchAll(/<style>/g)];
  const ends = [...source.matchAll(/<\/style>/g)];

  if (starts.length !== 1 || ends.length !== 1) {
    throw new Error(
      `${label}: genau ein Style-Block erwartet, gefunden ` +
      `${starts.length} Start- und ${ends.length} End-Tags.`,
    );
  }

  return {
    start: starts[0].index,
    end: ends[0].index + "</style>".length,
  };
}

function replaceStyle(source, label, css) {
  const range = findStyleRange(source, label);

  return (
    source.slice(0, range.start) +
    `<style>\n${css.trim()}\n</style>` +
    source.slice(range.end)
  );
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

  throw new Error("CSS-Block ist nicht geschlossen.");
}

function removeSelectorBlocks(source, selector, maximum = 4) {
  const matches = [];
  let cursor = 0;

  while (cursor < source.length) {
    const index = source.indexOf(selector, cursor);
    if (index < 0) break;

    let brace = index + selector.length;
    while (/\s/.test(source[brace] || "")) brace += 1;

    if (source[brace] === "{") {
      const end = findBlockEnd(source, brace);
      matches.push({ start: index, end: end + 1 });
      cursor = end + 1;
    } else {
      cursor = index + selector.length;
    }
  }

  if (matches.length > maximum) {
    throw new Error(
      `${selector}: ${matches.length} Regeln gefunden, maximal ${maximum} erwartet.`,
    );
  }

  let next = source;

  for (const match of [...matches].reverse()) {
    next = next.slice(0, match.start) + next.slice(match.end);
  }

  return next;
}

function writeIfChanged(file, content, repo) {
  const next =
    content.replace(/\r\n/g, "\n").replace(/\s+$/u, "") + "\n";
  const current = fs.existsSync(file) ? read(file) : "";

  if (current === next) {
    log(`Bereits aktuell: ${path.relative(repo, file)}`);
    return false;
  }

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next, "utf8");
  log(`Geändert: ${path.relative(repo, file)}`);
  return true;
}

function run(command, args, label, cwd) {
  log(`Prüfe: ${label}`);

  const executable =
    process.platform === "win32" && command === "npm"
      ? "npm.cmd"
      : command;

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

const REPO = findRoot(process.cwd());
const APP = path.join(REPO, "apps", "pfotentechnik");

const files = {
  experience: path.join(
    APP,
    "src/components/product-experience-2/ProductExperience2.astro",
  ),
  hero: path.join(
    APP,
    "src/components/product-experience-2/ProductHero2.astro",
  ),
  gallery: path.join(
    APP,
    "src/components/product-experience-2/ProductGallery2.astro",
  ),
  package: path.join(APP, "package.json"),
  test: path.join(
    APP,
    "test/product-mobile-viewport-owner-28.3.4.test.mjs",
  ),
};

for (const [label, file] of Object.entries(files)) {
  if (label === "test") continue;

  if (!fs.existsSync(file)) {
    throw new Error(`${label}: Datei fehlt: ${path.relative(REPO, file)}`);
  }

  if (label !== "package") {
    assertClean(file, read(file), REPO);
  }
}

let packageJson;

try {
  packageJson = JSON.parse(read(files.package));
} catch {
  throw new Error("package.json ist ungültig.");
}

for (const script of ["lint:content", "build"]) {
  if (typeof packageJson.scripts?.[script] !== "string") {
    throw new Error(`Erforderliches npm-Skript fehlt: ${script}`);
  }
}

let experience = read(files.experience);
let hero = read(files.hero);
let gallery = read(files.gallery);

if (!experience.includes('data-product-experience="2.1"')) {
  throw new Error("ProductExperience2-Strukturanker fehlt.");
}

if (!hero.includes("data-mobile-gallery-full-bleed")) {
  throw new Error("ProductHero2-Strukturanker fehlt.");
}

if (!gallery.includes("data-gallery-mobile-track")) {
  throw new Error("ProductGallery2-Strukturanker fehlt.");
}

/*
 * ProductExperience2 is the single mobile viewport owner.
 * It escapes any remaining parent padding once. Children then use ordinary,
 * local margins instead of each component calculating the viewport.
 */
const experienceCss = `
  .px2 {
    --px2-surface: var(--pt-color-surface);
    --px2-surface-soft: var(--pt-color-surface-soft);
    --px2-surface-raised: var(--pt-color-surface-raised);
    --px2-text: var(--pt-color-text);
    --px2-muted: var(--pt-color-text-muted);
    --px2-border: var(--pt-color-border);
    --px2-action-bg: var(--pt-color-action-bg);
    --px2-action-bg-hover: var(--pt-color-action-bg-hover);
    --px2-action-text: var(--pt-color-action-text);
    --px2-accent-text: var(--pt-color-accent-text);
    --px2-green: var(--px2-action-bg);
    --px2-green-strong: var(--px2-action-bg);
    --px2-green-soft: var(--pt-color-success-soft);
    --px2-amber: var(--pt-color-warning-500);
    --px2-amber-soft: var(--pt-color-warning-soft);
    --px2-red: var(--pt-color-danger-600);
    --px2-red-soft: var(--pt-color-danger-soft);
    --px2-indigo: var(--pt-color-accent-600);
    --px2-shadow: var(--pt-shadow-sm);
    --px2-on-accent: var(--px2-action-text);
    display: grid;
    gap: clamp(24px, 4vw, 46px);
    width: 100%;
    min-width: 0;
    margin: 0;
    padding: 0;
    color: var(--px2-text);
  }

  .px2 :global(*) {
    box-sizing: border-box;
  }

  @media (max-width: 759px) {
    .px2 {
      position: relative;
      left: 50%;
      width: 100vw;
      max-width: none;
      margin-left: -50vw;
    }

    .px2 > :not(.px2-hero) {
      margin-inline: 12px;
    }
  }
`;

experience = replaceStyle(
  experience,
  "ProductExperience2",
  experienceCss,
);

/*
 * Hero owns only its internal layout. The gallery is naturally full width
 * because the complete experience now spans the viewport.
 */
const heroRange = findStyleRange(hero, "ProductHero2");
let heroCss = hero.slice(
  heroRange.start + "<style>".length,
  heroRange.end - "</style>".length,
);

heroCss = removeSelectorBlocks(
  heroCss,
  ".px2-hero__media[data-mobile-gallery-full-bleed]",
  4,
);

heroCss = removeSelectorBlocks(
  heroCss,
  ".px2-hero__content",
  8,
);

/*
 * Rebuild the hero style from a stable target instead of retaining stacked
 * rules from earlier iterations.
 */
const heroTargetCss = `
  .px2-hero {
    display: grid;
    gap: 14px;
    width: 100%;
    min-width: 0;
    margin: 0;
  }

  .px2-hero__media {
    width: 100%;
    min-width: 0;
    margin: 0;
  }

  .px2-hero__content {
    display: grid;
    gap: 15px;
    min-width: 0;
    padding: 16px;
    border: 1px solid var(--px2-border);
    border-radius: 20px;
    background: var(--px2-surface);
    box-shadow: var(--px2-shadow);
  }

  .px2-hero__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  .px2-hero__meta a,
  .px2-hero__meta span {
    display: inline-flex;
    padding: 5px 9px;
    border-radius: 999px;
    background: var(--px2-surface-soft);
    color: var(--px2-muted);
    font-size: .76rem;
    font-weight: 800;
    text-decoration: none;
  }

  .px2-hero h1 {
    margin: 0;
    color: var(--px2-text);
    font-size: clamp(2rem, 10vw, 3.2rem);
    line-height: 1;
    letter-spacing: -.04em;
    overflow-wrap: anywhere;
  }

  .px2-hero__lead {
    margin: 0;
    color: var(--px2-muted);
    font-size: 1rem;
    line-height: 1.55;
  }

  .px2-hero__scoreline {
    min-width: 0;
  }

  .px2-hero__score-pending {
    display: grid;
    gap: 3px;
    padding: 12px 13px;
    border: 1px solid var(--px2-border);
    border-radius: 14px;
    background: var(--px2-surface-raised);
  }

  .px2-hero__score-pending strong {
    color: var(--px2-text);
    font-size: .92rem;
  }

  .px2-hero__score-pending span {
    color: var(--px2-muted);
    font-size: .76rem;
    line-height: 1.42;
  }

  .px2-hero__scoreline :global(.pt-score) {
    --score-surface: var(--px2-surface);
    --score-text: var(--px2-text);
    --score-muted: var(--px2-muted);
    --score-accent: var(--px2-green);
  }

  .px2-hero__decision {
    display: grid;
    gap: 8px;
    margin: 0;
  }

  .px2-hero__decision > div {
    min-width: 0;
    padding: 12px 13px;
    border: 1px solid var(--px2-border);
    border-radius: 14px;
    background: var(--px2-surface-raised);
  }

  .px2-hero__decision > div:first-child {
    background: var(--px2-green-soft);
  }

  .px2-hero__decision .is-limitation {
    background: var(--px2-red-soft);
  }

  .px2-hero__decision dt {
    margin-bottom: 4px;
    color: var(--px2-muted);
    font-size: .7rem;
    font-weight: 900;
    letter-spacing: .055em;
    text-transform: uppercase;
  }

  .px2-hero__decision dd {
    margin: 0;
    color: var(--px2-text);
    font-size: .92rem;
    font-weight: 750;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .px2-hero__compare {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
    padding: 11px 15px;
    border: 1px solid var(--px2-border);
    border-radius: 14px;
    color: var(--px2-text);
    font-weight: 850;
    text-decoration: none;
  }

  .px2-hero__compare:hover,
  .px2-hero__compare:focus-visible {
    border-color: var(--px2-accent-text);
    color: var(--px2-accent-text);
  }

  @media (max-width: 759px) {
    .px2-hero__media[data-mobile-gallery-full-bleed] {
      width: 100%;
      max-width: none;
      margin: 0;
    }

    .px2-hero__content {
      margin-inline: 12px;
    }
  }

  @media (min-width: 760px) {
    .px2-hero__content {
      padding: 22px;
    }

    .px2-hero__decision {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (min-width: 980px) {
    .px2-hero {
      grid-template-columns: minmax(0, 1.12fr) minmax(360px, .88fr);
      gap: clamp(24px, 4vw, 48px);
      align-items: start;
    }

    .px2-hero__content {
      margin-inline: 0;
      padding: clamp(22px, 2.5vw, 30px);
    }

    .px2-hero h1 {
      font-size: clamp(2.3rem, 4vw, 4rem);
      overflow-wrap: normal;
    }

    .px2-hero__decision {
      grid-template-columns: 1fr;
    }
  }
`;

hero = replaceStyle(hero, "ProductHero2", heroTargetCss);

/*
 * Gallery root and mobile track must not reintroduce margins, max-widths or
 * padding after the parent is full width.
 */
const galleryRange = findStyleRange(gallery, "ProductGallery2");
let galleryCss = gallery.slice(
  galleryRange.start + "<style>".length,
  galleryRange.end - "</style>".length,
);

galleryCss = removeSelectorBlocks(
  galleryCss,
  ".px2-editorial-gallery",
  4,
);

galleryCss = removeSelectorBlocks(
  galleryCss,
  ".px2-editorial-gallery__mobile",
  4,
);

galleryCss = `
  .px2-editorial-gallery {
    position: relative;
    width: 100%;
    max-width: none;
    min-width: 0;
    margin: 0;
    padding: 0;
  }

  .px2-editorial-gallery__mobile {
    position: relative;
    display: flex;
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 0;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    border-radius: 0;
    background: var(--px2-surface-soft);
  }

${galleryCss.trim()}
`;

gallery = replaceStyle(
  gallery,
  "ProductGallery2",
  galleryCss,
);

const testContent = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

const experience = read(
  "src/components/product-experience-2/ProductExperience2.astro",
);
const hero = read(
  "src/components/product-experience-2/ProductHero2.astro",
);
const gallery = read(
  "src/components/product-experience-2/ProductGallery2.astro",
);

test("ProductExperience2 ist der einzige mobile Viewport-Owner", () => {
  assert.match(
    experience,
    /\\.px2\\s*\\{[^}]*position:\\s*relative[^}]*left:\\s*50%[^}]*width:\\s*100vw[^}]*margin-left:\\s*-50vw/s,
  );
  assert.equal((experience.match(/width:\\s*100vw/g) ?? []).length, 1);
  assert.equal((experience.match(/margin-left:\\s*-50vw/g) ?? []).length, 1);
});

test("Hero fügt keinen weiteren Viewport-Ausbruch hinzu", () => {
  const mediaRule = hero.match(
    /\\.px2-hero__media\\[data-mobile-gallery-full-bleed\\]\\s*\\{([^}]*)\\}/s,
  );

  assert.ok(mediaRule, "Mobile Galerieregel fehlt.");
  assert.match(mediaRule[1], /width:\\s*100%/);
  assert.match(mediaRule[1], /margin:\\s*0/);
  assert.doesNotMatch(
    mediaRule[1],
    /100d?vw|calc\\(|left:|translate|-[0-9]+px/,
  );
});

test("Hero-Karte besitzt exakt 12px mobilen Außenabstand", () => {
  const mobileContent = hero.match(
    /@media \\(max-width: 759px\\)[\\s\\S]*?\\.px2-hero__content\\s*\\{([^}]*)\\}/,
  );

  assert.ok(mobileContent, "Mobile Inhaltsregel fehlt.");
  assert.match(mobileContent[1], /margin-inline:\\s*12px/);
});

test("Galeriewurzel und Track sind vollständig randlos", () => {
  const rootRule = gallery.match(
    /\\.px2-editorial-gallery\\s*\\{([^}]*)\\}/s,
  );
  const trackRule = gallery.match(
    /\\.px2-editorial-gallery__mobile\\s*\\{([^}]*)\\}/s,
  );

  assert.ok(rootRule, "Galeriewurzel fehlt.");
  assert.ok(trackRule, "Mobile Track-Regel fehlt.");

  for (const rule of [rootRule[1], trackRule[1]]) {
    assert.match(rule, /width:\\s*100%/);
    assert.match(rule, /margin:\\s*0/);
    assert.match(rule, /padding:\\s*0/);
    assert.doesNotMatch(rule, /max-width:\\s*[0-9]|calc\\(|100d?vw/);
  }
});

test("weitere Produktabschnitte verwenden 12px statt verschachtelter Gutter", () => {
  assert.match(
    experience,
    /\\.px2 > :not\\(\\.px2-hero\\)\\s*\\{[^}]*margin-inline:\\s*12px/s,
  );
});

test("alte Galerie-Ausbrüche fehlen", () => {
  const combined = experience + hero + gallery;

  assert.doesNotMatch(
    combined,
    /width:\\s*calc\\(100%\\s*\\+\\s*(?:24|48)px\\)|margin:\\s*0\\s+-(?:12|24)px|--px2-page-gutter|margin-block-start:\\s*-90px/,
  );
});
`;

const backup = path.join(
  REPO,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

const targets = [
  files.experience,
  files.hero,
  files.gallery,
  files.test,
];

fs.mkdirSync(backup, { recursive: true });

for (const file of targets) {
  if (!fs.existsSync(file)) continue;

  const destination = path.join(backup, path.relative(REPO, file));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
}

log(`Backup: ${path.relative(REPO, backup)}`);

const rollback = () => {
  for (const file of targets) {
    const saved = path.join(backup, path.relative(REPO, file));

    if (fs.existsSync(saved)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(saved, file);
    } else if (file === files.test && fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
    }
  }
};

try {
  writeIfChanged(files.experience, experience, REPO);
  writeIfChanged(files.hero, hero, REPO);
  writeIfChanged(files.gallery, gallery, REPO);
  writeIfChanged(files.test, testContent, REPO);

  run(
    process.execPath,
    ["--check", path.relative(APP, files.test)],
    "Syntaxprüfung des Viewport-Owner-Tests",
    APP,
  );

  run(
    process.execPath,
    ["--test", path.relative(APP, files.test)],
    "Produkt-Mobile-Viewport-Owner-Test",
    APP,
  );

  run(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "lint:content"],
    "Content-Lint",
    REPO,
  );

  run(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "build"],
    "Astro-Build",
    REPO,
  );

  const installed =
    read(files.experience) +
    read(files.hero) +
    read(files.gallery);

  const ownerCount =
    (installed.match(/width:\s*100vw/g) ?? []).length;

  if (ownerCount !== 1) {
    throw new Error(
      `Viewport-Owner nicht eindeutig: ${ownerCount} 100vw-Regeln.`,
    );
  }

  log("BESTANDEN: ProductExperience2 ist der einzige mobile Viewport-Owner.");
  log("BESTANDEN: Galerie reicht links und rechts bis an den Viewportrand.");
  log("BESTANDEN: Hero-Karte und Folgeabschnitte verwenden exakt 12px.");
  log("BESTANDEN: gestapelte Galerie-Ausbrüche und Doppelgutter sind entfernt.");
  log("Abgeschlossen.");
} catch (error) {
  rollback();
  log(`FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  log("Änderungen wurden zurückgerollt.");
  process.exitCode = 1;
}
