#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-product-mobile-true-full-bleed-28.3.3";
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

function findSelectorBlocks(source, selector) {
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

  return matches;
}

function removeSelectorBlocks(source, selector, maximum = 3) {
  const matches = findSelectorBlocks(source, selector);

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
  layoutCss: path.join(
    REPO,
    "packages/affiliate-core/src/styles/layout.css",
  ),
  route: path.join(APP, "src/pages/produkt/[product].astro"),
  experience: path.join(
    APP,
    "src/components/product-experience-2/ProductExperience2.astro",
  ),
  hero: path.join(
    APP,
    "src/components/product-experience-2/ProductHero2.astro",
  ),
  package: path.join(APP, "package.json"),
  test: path.join(
    APP,
    "test/product-mobile-true-full-bleed-28.3.3.test.mjs",
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

let layoutCss = read(files.layoutCss);
let route = read(files.route);
let experience = read(files.experience);
let hero = read(files.hero);

if (!route.includes('mainClass="container--product"')) {
  throw new Error(
    "Produkt-Route verwendet container--product noch nicht. " +
    "Zuerst 28.3.1 erfolgreich anwenden.",
  );
}

if (!experience.includes('data-product-experience="2.1"')) {
  throw new Error("ProductExperience2-Strukturanker fehlt.");
}

if (!hero.includes("data-mobile-gallery-full-bleed")) {
  throw new Error("ProductHero2-Strukturanker fehlt.");
}

/*
 * Remove earlier product-container variants. The final override is appended
 * after all ordinary container media rules and uses higher specificity.
 */
layoutCss = removeSelectorBlocks(
  layoutCss,
  ".container--product",
  3,
);

layoutCss = removeSelectorBlocks(
  layoutCss,
  ".container.container--product",
  2,
);

layoutCss = layoutCss.replace(/\s+$/u, "");

layoutCss += `

.container.container--product {
  max-width: 1200px;
  padding: 70px 24px;
}

@media (max-width: 768px) {
  .container.container--product {
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 0 0 calc(64px + env(safe-area-inset-bottom));
  }
}
`;

/*
 * The experience root spans the viewport on mobile. Only ordinary sections
 * receive the compact content gutter.
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
 * Gallery no longer needs a negative breakout because its route container
 * is genuinely edge-to-edge. Only the content card receives 12px margins.
 */
const heroRange = findStyleRange(hero, "ProductHero2");
let heroCss = hero.slice(
  heroRange.start + "<style>".length,
  heroRange.end - "</style>".length,
);

heroCss = removeSelectorBlocks(
  heroCss,
  ".px2-hero__media[data-mobile-gallery-full-bleed]",
  3,
);

heroCss = heroCss.replace(
  /@media \(max-width: 759px\)\s*\{\s*\}/g,
  "",
);

heroCss += `

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
`;

hero = replaceStyle(hero, "ProductHero2", heroCss);

const testContent = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

const layoutCss = read(
  "../../packages/affiliate-core/src/styles/layout.css",
);
const route = read("src/pages/produkt/[product].astro");
const experience = read(
  "src/components/product-experience-2/ProductExperience2.astro",
);
const hero = read(
  "src/components/product-experience-2/ProductHero2.astro",
);

test("Produkt-Route verwendet den expliziten Produktcontainer", () => {
  assert.match(route, /mainClass="container--product"/);
});

test("mobile Produktseite neutralisiert den allgemeinen Container vollständig", () => {
  const rules = [
    ...layoutCss.matchAll(
      /\\.container\\.container--product\\s*\\{([^}]*)\\}/gs,
    ),
  ];

  assert.equal(rules.length, 2);
  const mobileRule = rules[1][1];

  assert.match(mobileRule, /width:\\s*100%/);
  assert.match(mobileRule, /max-width:\\s*none/);
  assert.match(mobileRule, /margin:\\s*0/);
  assert.match(
    mobileRule,
    /padding:\\s*0 0 calc\\(64px \\+ env\\(safe-area-inset-bottom\\)\\)/,
  );
});

test("keine schwächere container--product-Regel konkurriert mehr", () => {
  const selectors = [
    ...layoutCss.matchAll(/(^|})\\s*([^@{}][^{}]*)\\{/gm),
  ]
    .map((match) => match[2].trim())
    .flatMap((selectorList) =>
      selectorList.split(",").map((selector) => selector.trim()),
    );

  assert.equal(
    selectors.filter((selector) => selector === ".container--product").length,
    0,
  );

  assert.equal(
    selectors.filter(
      (selector) => selector === ".container.container--product",
    ).length,
    2,
  );
});

test("Galerie ist ohne Ausgleichshack tatsächlich randlos", () => {
  const rule = hero.match(
    /\\.px2-hero__media\\[data-mobile-gallery-full-bleed\\]\\s*\\{([^}]*)\\}/s,
  );

  assert.ok(rule, "Galerieregel fehlt.");
  assert.match(rule[1], /width:\\s*100%/);
  assert.match(rule[1], /margin:\\s*0/);
  assert.doesNotMatch(
    rule[1],
    /calc\\(|-[0-9]+px|100d?vw|left:|translate/,
  );
});

test("Hero-Inhalt verwendet nur 12px Außenabstand", () => {
  const mobileContent = hero.match(
    /@media \\(max-width: 759px\\)[\\s\\S]*?\\.px2-hero__content\\s*\\{([^}]*)\\}/,
  );

  assert.ok(mobileContent, "Mobile Hero-Inhaltsregel fehlt.");
  assert.match(mobileContent[1], /margin-inline:\\s*12px/);
});

test("weitere Produktabschnitte verwenden denselben 12px-Gutter", () => {
  assert.match(
    experience,
    /\\.px2 > :not\\(\\.px2-hero\\)\\s*\\{[^}]*margin-inline:\\s*12px/s,
  );
  assert.match(experience, /padding:\\s*0/);
});

test("alte Full-Bleed- und Doppelgutter-Regeln fehlen", () => {
  const combined = layoutCss + experience + hero;

  assert.doesNotMatch(
    combined,
    /width:\\s*calc\\(100%\\s*\\+\\s*(?:24|48)px\\)|margin:\\s*0\\s+-(?:12|24)px|margin-block-start:\\s*-90px|--px2-page-gutter/,
  );
});
`;

const backup = path.join(
  REPO,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

const targets = [
  files.layoutCss,
  files.experience,
  files.hero,
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
  writeIfChanged(files.layoutCss, layoutCss, REPO);
  writeIfChanged(files.experience, experience, REPO);
  writeIfChanged(files.hero, hero, REPO);
  writeIfChanged(files.test, testContent, REPO);

  run(
    process.execPath,
    ["--check", path.relative(APP, files.test)],
    "Syntaxprüfung des True-Full-Bleed-Tests",
    APP,
  );

  run(
    process.execPath,
    ["--test", path.relative(APP, files.test)],
    "Produkt-True-Full-Bleed-Test",
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
    read(files.layoutCss) +
    read(files.experience) +
    read(files.hero);

  for (const legacy of [
    "width: calc(100% + 24px)",
    "width: calc(100% + 48px)",
    "margin: 0 -12px",
    "margin: 0 -24px",
    "margin-block-start: -90px",
    "--px2-page-gutter",
  ]) {
    if (installed.includes(legacy)) {
      throw new Error(`Legacy-Regel bleibt vorhanden: ${legacy}`);
    }
  }

  log("BESTANDEN: Galerie beginnt direkt unter dem Header.");
  log("BESTANDEN: Galerie reicht links und rechts bis an den Viewportrand.");
  log("BESTANDEN: Inhaltskarten und Folgeabschnitte verwenden nur 12px Gutter.");
  log("BESTANDEN: konkurrierende Produktcontainer-Regeln sind entfernt.");
  log("Abgeschlossen.");
} catch (error) {
  rollback();
  log(`FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  log("Änderungen wurden zurückgerollt.");
  process.exitCode = 1;
}
