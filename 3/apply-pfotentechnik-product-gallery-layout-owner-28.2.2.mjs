#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-product-gallery-layout-owner-28.2.2";
const log = (message) => console.log(`[${PATCH}] ${message}`);

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

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function assertNoConflictMarkers(file, source, repo) {
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

function upsertRenderer(source) {
  const wrapperMarker = 'class="px2-route-layout-owner"';

  if (!source.includes(wrapperMarker)) {
    const anchor = "<ProductExperience2 model={model} />";
    if (!source.includes(anchor)) {
      throw new Error("ProductRenderer: ProductExperience2-Anker fehlt.");
    }

    source = source.replace(
      anchor,
      `<div class="px2-route-layout-owner">\n` +
      `  <ProductExperience2 model={model} />\n` +
      `</div>`,
    );
  }

  const style = `
<style>
  :global(main.container) {
    max-width: none;
    padding: 0;
  }

  .px2-route-layout-owner {
    width: 100%;
  }
</style>`;

  const styleStarts = [...source.matchAll(/<style>/g)];

  if (styleStarts.length === 0) {
    return source.replace(/\s*$/u, "") + "\n\n" + style + "\n";
  }

  if (styleStarts.length !== 1) {
    throw new Error(
      `ProductRenderer: ${styleStarts.length} Style-Blöcke gefunden.`,
    );
  }

  return replaceStyle(
    source,
    "ProductRenderer",
    `
  :global(main.container) {
    max-width: none;
    padding: 0;
  }

  .px2-route-layout-owner {
    width: 100%;
  }
    `,
  );
}

function writeIfChanged(file, content, repo) {
  const next = content.replace(/\r\n/g, "\n").replace(/\s+$/u, "") + "\n";
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
  renderer: path.join(
    APP,
    "src/components/product-standard-2/ProductRenderer.astro",
  ),
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
    "test/product-gallery-layout-owner-28.2.2.test.mjs",
  ),
};

for (const [label, file] of Object.entries(files)) {
  if (label === "test") continue;
  if (!fs.existsSync(file)) {
    throw new Error(`${label}: Datei fehlt: ${path.relative(REPO, file)}`);
  }
  if (label !== "package") {
    assertNoConflictMarkers(file, read(file), REPO);
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

let renderer = read(files.renderer);
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
if (!gallery.includes("px2-editorial-lightbox__thumb")) {
  throw new Error("Lightbox-Thumbnail-Struktur fehlt.");
}

renderer = upsertRenderer(renderer);

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
    max-width: 1200px;
    min-width: 0;
    margin-inline: auto;
    padding: 70px 24px;
    color: var(--px2-text);
  }

  .px2 :global(*) {
    box-sizing: border-box;
  }

  @media (max-width: 759px) {
    .px2 {
      padding-top: 0;
    }
  }
`;

experience = replaceStyle(
  experience,
  "ProductExperience2",
  experienceCss,
);

const heroCss = `
  .px2-hero {
    display: grid;
    gap: 14px;
    min-width: 0;
  }

  .px2-hero__media,
  .px2-hero__content {
    min-width: 0;
  }

  .px2-hero__content {
    display: grid;
    gap: 15px;
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
      width: calc(100% + 48px);
      max-width: none;
      margin: 0 -24px;
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

hero = replaceStyle(hero, "ProductHero2", heroCss);

const galleryStyle = findStyleRange(gallery, "ProductGallery2");
let galleryCss = gallery.slice(
  galleryStyle.start + "<style>".length,
  galleryStyle.end - "</style>".length,
);

galleryCss = galleryCss
  .replace(
    /\.px2-editorial-gallery__slide\s*\{[\s\S]*?\}/,
    `.px2-editorial-gallery__slide {
    position: relative;
    flex: 0 0 100%;
    width: 100%;
    height: 100%;
    max-height: none;
    margin: 0;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: 0;
    background: transparent;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    cursor: zoom-in;
  }`,
  )
  .replace(
    /\.px2-editorial-gallery__slide img\s*\{[\s\S]*?\}/,
    `.px2-editorial-gallery__slide img {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    max-width: none;
    margin: 0;
    border-radius: 0;
    object-fit: cover;
    object-position: center;
    background: transparent;
  }`,
  )
  .replace(/margin-inline:\s*calc\(50%\s*-\s*50vw\);?/g, "")
  .replace(/width:\s*100d?vw;?/g, "")
  .replace(/left:\s*50%;?/g, "")
  .replace(/transform:\s*(?:translateX\(-50%\)|none);?/g, "")
  .replace(/--px2-page-gutter:[^;]+;?/g, "");

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

const renderer = read(
  "src/components/product-standard-2/ProductRenderer.astro",
);
const experience = read(
  "src/components/product-experience-2/ProductExperience2.astro",
);
const hero = read(
  "src/components/product-experience-2/ProductHero2.astro",
);
const gallery = read(
  "src/components/product-experience-2/ProductGallery2.astro",
);

test("Produkt-Route besitzt den eindeutigen Layout-Owner", () => {
  assert.match(renderer, /class="px2-route-layout-owner"/);
  assert.match(renderer, /:global\\(main\\.container\\)/);
  assert.match(renderer, /max-width:\\s*none/);
  assert.match(renderer, /padding:\\s*0/);
  assert.doesNotMatch(renderer, /main\\.container:has/);
});

test("Experience besitzt den einzigen Inhaltsgutter", () => {
  assert.match(experience, /max-width:\\s*1200px/);
  assert.match(experience, /padding:\\s*70px 24px/);
  assert.match(experience, /padding-top:\\s*0/);
  assert.doesNotMatch(experience, /margin-block-start:\\s*-90px/);
});

test("Galerie bricht exakt um den eigenen 24px-Gutter aus", () => {
  assert.match(
    hero,
    /width:\\s*calc\\(100%\\s*\\+\\s*48px\\)/,
  );
  assert.match(hero, /margin:\\s*0\\s+-24px/);
  assert.doesNotMatch(hero, /100d?vw|translateX|left:\\s*50%/);
});

test("Bild füllt den Slide vollständig", () => {
  assert.match(
    gallery,
    /\\.px2-editorial-gallery__slide img\\s*\\{[^}]*position:\\s*absolute/s,
  );
  assert.match(gallery, /inset:\\s*0/);
  assert.match(gallery, /object-fit:\\s*cover/);
});

test("alte Full-Bleed-Korrekturen fehlen", () => {
  const combined = renderer + experience + hero + gallery;
  assert.doesNotMatch(
    combined,
    /px2-page-gutter|calc\\(50%\\s*-\\s*50vw\\)|100dvw|translateX\\(-50%\\)|main\\.container:has/,
  );
});

test("Thumbnail-Zentrierung bleibt erhalten", () => {
  assert.match(gallery, /px2-editorial-lightbox__thumb/);
  assert.match(gallery, /place-items:\\s*center/);
  assert.match(gallery, /object-position:\\s*center/);
});
`;

const backup = path.join(
  REPO,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

const targets = [
  files.renderer,
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
  writeIfChanged(files.renderer, renderer, REPO);
  writeIfChanged(files.experience, experience, REPO);
  writeIfChanged(files.hero, hero, REPO);
  writeIfChanged(files.gallery, gallery, REPO);
  writeIfChanged(files.test, testContent, REPO);

  run(
    process.execPath,
    ["--check", path.relative(APP, files.test)],
    "Syntaxprüfung des Layout-Owner-Tests",
    APP,
  );

  run(
    process.execPath,
    ["--test", path.relative(APP, files.test)],
    "Layout-Owner-Test",
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

  log("BESTANDEN: Layout-Abstand besitzt genau einen Owner.");
  log("BESTANDEN: Galerie bricht exakt um den eigenen 24px-Gutter aus.");
  log("BESTANDEN: Bild füllt die Galeriefläche ohne freien Hintergrund.");
  log("BESTANDEN: alte Full-Bleed-Hacks sind entfernt.");
  log("Abgeschlossen.");
} catch (error) {
  rollback();
  log(`FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  log("Änderungen wurden zurückgerollt.");
  process.exitCode = 1;
}
