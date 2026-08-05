#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-mobile-gallery-viewport-height-28.1.3";

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

  throw new Error("CSS-Block ist nicht geschlossen.");
}

function cssDepthAt(css, targetIndex) {
  let depth = 0;
  let quote = "";
  let escaped = false;
  let inComment = false;

  for (let index = 0; index < targetIndex; index += 1) {
    const char = css[index];
    const next = css[index + 1] || "";

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
    if (char === "}") depth = Math.max(0, depth - 1);
  }

  return depth;
}

function findSelectorBlocks(css, selector) {
  const matches = [];
  let cursor = 0;

  while (cursor < css.length) {
    const index = css.indexOf(selector, cursor);
    if (index < 0) break;

    const before = index > 0 ? css[index - 1] : "";
    const after = css[index + selector.length] || "";
    const validBefore = !before || /[\s},]/.test(before);
    const validAfter = !after || /[\s,{]/.test(after);

    let brace = index + selector.length;
    while (/\s/.test(css[brace] || "")) brace += 1;

    if (validBefore && validAfter && css[brace] === "{") {
      const end = findBlockEnd(css, brace);
      matches.push({
        start: index,
        brace,
        end: end + 1,
        depth: cssDepthAt(css, index),
        body: css.slice(brace + 1, end),
      });
      cursor = end + 1;
      continue;
    }

    cursor = index + selector.length;
  }

  return matches;
}

function replaceRootRule(css, selector, body) {
  const matches = findSelectorBlocks(css, selector);
  const roots = matches.filter((match) => match.depth === 0);

  if (roots.length !== 1) {
    throw new Error(
      `${selector}: ${roots.length} Root-Regeln und ` +
      `${matches.length - roots.length} verschachtelte Regeln gefunden.`,
    );
  }

  const match = roots[0];
  return (
    css.slice(0, match.start) +
    `${selector} {\n${body.trim()}\n  }` +
    css.slice(match.end)
  );
}

function replaceStyle(source, label, transform) {
  const startTag = source.indexOf("<style>");
  const endTag = source.lastIndexOf("</style>");

  if (startTag < 0 || endTag < startTag) {
    throw new Error(`${label}: Style-Block fehlt.`);
  }

  const cssStart = startTag + "<style>".length;
  const css = source.slice(cssStart, endTag);
  const nextCss = transform(css);

  return source.slice(0, cssStart) + nextCss + source.slice(endTag);
}

function insertBeforeStyleEnd(source, label, css) {
  const endTag = source.lastIndexOf("</style>");
  if (endTag < 0) throw new Error(`${label}: </style> fehlt.`);
  return source.slice(0, endTag) + "\n" + css.trim() + "\n" + source.slice(endTag);
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
const GALLERY = path.join(
  APP,
  "src/components/product-experience-2/ProductGallery2.astro",
);
const PACKAGE = path.join(APP, "package.json");
const TEST = path.join(
  APP,
  "test/mobile-gallery-viewport-height-28.1.3.test.mjs",
);

if (!fs.existsSync(GALLERY)) {
  throw new Error(`Galerie fehlt: ${path.relative(ROOT, GALLERY)}`);
}

const original = fs.readFileSync(GALLERY, "utf8").replace(/\r\n/g, "\n");
if (hasConflictMarkers(original)) {
  throw new Error("ProductGallery2 enthält ungelöste Git-Konfliktmarker.");
}

for (const marker of [
  "px2-editorial-gallery__mobile",
  "px2-editorial-gallery__slide",
  "data-gallery-mobile-track",
  "object-fit: cover",
]) {
  if (!original.includes(marker)) {
    throw new Error(`Galerie-Strukturanker fehlt: ${marker}`);
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

let gallery = replaceStyle(original, "ProductGallery2", (css) =>
  replaceRootRule(
    css,
    ".px2-editorial-gallery__slide",
    `
    flex: 0 0 100%;
    width: 100%;
    height: clamp(280px, 44svh, 520px);
    max-height: 52svh;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: 0;
    background: var(--px2-surface-raised);
    scroll-snap-align: start;
    scroll-snap-stop: always;
    cursor: zoom-in;
    `,
  ),
);

const mobileOverride = `
  @media (max-width: 759px) {
    .px2-editorial-gallery__mobile {
      height: clamp(280px, 44svh, 520px);
      max-height: 52svh;
    }

    .px2-editorial-gallery__slide {
      height: 100%;
      max-height: none;
      aspect-ratio: auto;
    }

    .px2-editorial-gallery__slide img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }
  }

  @media (max-width: 759px) and (max-height: 700px) {
    .px2-editorial-gallery__mobile {
      height: clamp(260px, 42svh, 340px);
    }
  }

  @media (max-width: 759px) and (min-height: 900px) {
    .px2-editorial-gallery__mobile {
      height: min(46svh, 480px);
    }
  }
`;

if (!gallery.includes("max-height: 52svh")) {
  gallery = insertBeforeStyleEnd(
    gallery,
    "ProductGallery2",
    mobileOverride,
  );
} else if (!gallery.includes(
  '@media (max-width: 759px) and (max-height: 700px)',
)) {
  gallery = insertBeforeStyleEnd(
    gallery,
    "ProductGallery2",
    mobileOverride,
  );
}

const TEST_CONTENT = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const source = fs.readFileSync(
  path.join(
    process.cwd(),
    "src/components/product-experience-2/ProductGallery2.astro",
  ),
  "utf8",
);

test("mobile Galerie orientiert sich an der Bildschirmhöhe", () => {
  assert.match(source, /height: clamp\\(280px, 44svh, 520px\\)/);
  assert.match(source, /max-height: 52svh/);
});

test("quadratische Mobile-Fläche ist aufgehoben", () => {
  assert.match(source, /aspect-ratio: auto/);
  assert.doesNotMatch(
    source,
    /\\.px2-editorial-gallery__slide[^}]*aspect-ratio:\\s*1\\s*\\/\\s*1/s,
  );
});

test("kurze Displays erhalten eine niedrigere Galerie", () => {
  assert.match(source, /max-height: 700px/);
  assert.match(source, /height: clamp\\(260px, 42svh, 340px\\)/);
});

test("sehr hohe Displays werden nach oben begrenzt", () => {
  assert.match(source, /min-height: 900px/);
  assert.match(source, /height: min\\(46svh, 480px\\)/);
});

test("Bilder füllen die begrenzte Fläche weiterhin", () => {
  assert.match(source, /object-fit: cover/);
  assert.match(source, /object-position: center/);
  assert.match(source, /height: 100%/);
});

test("Swipe- und Einzelbildstruktur bleiben erhalten", () => {
  assert.match(source, /data-gallery-mobile-track/);
  assert.match(source, /"is-single": optimized\\.length === 1/);
  assert.match(source, /scroll-snap-type: x mandatory/);
});
`;

const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
const TARGETS = [GALLERY, TEST];

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
  writeIfChanged(GALLERY, gallery, ROOT);
  writeIfChanged(TEST, TEST_CONTENT, ROOT);

  run(
    process.execPath,
    ["--check", path.relative(APP, TEST)],
    "Syntaxprüfung des Viewport-Höhen-Tests",
    APP,
  );
  run(
    process.execPath,
    ["--test", path.relative(APP, TEST)],
    "Viewport-Höhen-Test",
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

  const installed = fs.readFileSync(GALLERY, "utf8");

  for (const marker of [
    "height: clamp(280px, 44svh, 520px)",
    "max-height: 52svh",
    "aspect-ratio: auto",
    "height: clamp(260px, 42svh, 340px)",
    "height: min(46svh, 480px)",
  ]) {
    if (!installed.includes(marker)) {
      throw new Error(`Galerie-Zielzustand fehlt: ${marker}`);
    }
  }

  log("BESTANDEN: Galerie bleibt auf üblichen Mobilgeräten bei etwa 44 % der stabilen Viewport-Höhe.");
  log("BESTANDEN: kurze und besonders hohe Displays besitzen eigene Grenzen.");
  log("Abgeschlossen.");
} catch (error) {
  rollback();
  log(`FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  log("Änderungen wurden zurückgerollt.");
  process.exitCode = 1;
}
