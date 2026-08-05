#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-mobile-gallery-zero-edge-28.1.5";

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
        end: end + 1,
        depth: cssDepthAt(css, index),
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
      `${selector}: ${roots.length} Root-Regeln, ` +
      `${matches.length - roots.length} verschachtelte Regeln.`,
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
  "test/mobile-gallery-zero-edge-28.1.5.test.mjs",
);

if (!fs.existsSync(GALLERY)) {
  throw new Error(`Galerie fehlt: ${path.relative(ROOT, GALLERY)}`);
}

const original = fs.readFileSync(GALLERY, "utf8").replace(/\r\n/g, "\n");

if (hasConflictMarkers(original)) {
  throw new Error("ProductGallery2 enthält ungelöste Git-Konfliktmarker.");
}

for (const marker of [
  "px2-editorial-lightbox__thumbs",
  "px2-editorial-lightbox__thumb",
  "px2-editorial-lightbox__thumb img",
  "height: clamp(280px, 44svh, 520px)",
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

let gallery = replaceStyle(original, "ProductGallery2", (css) => {
  let next = css;

  next = replaceRootRule(
    next,
    ".px2-editorial-lightbox__thumbs",
    `
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 100%;
    padding: 10px 12px max(16px, env(safe-area-inset-bottom));
    overflow-x: auto;
    scrollbar-width: thin;
    scroll-padding-inline: 12px;
    `,
  );

  next = replaceRootRule(
    next,
    ".px2-editorial-lightbox__thumb",
    `
    display: grid;
    place-items: center;
    flex: 0 0 88px;
    width: 88px;
    height: 66px;
    padding: 3px;
    overflow: hidden;
    border: 2px solid transparent;
    border-radius: 10px;
    background: rgba(255, 255, 255, .08);
    line-height: 0;
    vertical-align: middle;
    `,
  );

  next = replaceRootRule(
    next,
    ".px2-editorial-lightbox__thumb img",
    `
    display: block;
    width: 100%;
    height: 100%;
    margin: 0;
    border-radius: 6px;
    object-fit: cover;
    object-position: center center;
    `,
  );

  return next;
});

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

test("Thumbnail-Leiste zentriert ihre Kacheln vertikal", () => {
  assert.match(
    source,
    /\\.px2-editorial-lightbox__thumbs\\s*\\{[^}]*align-items:\\s*center/s,
  );
});

test("Thumbnail-Button besitzt einen expliziten Zentrierungs-Owner", () => {
  assert.match(
    source,
    /\\.px2-editorial-lightbox__thumb\\s*\\{[^}]*display:\\s*grid/s,
  );
  assert.match(source, /place-items:\\s*center/);
  assert.match(source, /line-height:\\s*0/);
  assert.match(source, /vertical-align:\\s*middle/);
});

test("Thumbnail-Bild füllt die Kachel mittig", () => {
  assert.match(
    source,
    /\\.px2-editorial-lightbox__thumb img\\s*\\{[^}]*object-fit:\\s*cover/s,
  );
  assert.match(source, /object-position:\\s*center center/);
  assert.match(source, /height:\\s*100%/);
  assert.match(source, /margin:\\s*0/);
});

test("aktive Thumbnail-Markierung bleibt erhalten", () => {
  assert.match(
    source,
    /\\.px2-editorial-lightbox__thumb\\.is-active/,
  );
  assert.match(source, /aria-current/);
});

test("Zero-Edge- und Höhenregeln bleiben erhalten", () => {
  assert.match(source, /height: clamp\\(280px, 44svh, 520px\\)/);
  assert.match(source, /max-height: 52svh/);
  assert.match(source, /px2-editorial-gallery__slide img/);
  assert.match(source, /object-fit: cover/);
});

test("Lightbox-Navigation bleibt vollständig", () => {
  assert.match(source, /data-gallery-previous/);
  assert.match(source, /data-gallery-next/);
  assert.match(source, /data-gallery-zoom/);
  assert.match(source, /data-gallery-close/);
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
    "Syntaxprüfung des Thumbnail-Tests",
    APP,
  );
  run(
    process.execPath,
    ["--test", path.relative(APP, TEST)],
    "Lightbox-Thumbnail-Test",
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
    "place-items: center",
    "line-height: 0",
    "object-fit: cover",
    "object-position: center center",
    "height: clamp(280px, 44svh, 520px)",
  ]) {
    if (!installed.includes(marker)) {
      throw new Error(`Galerie-Zielzustand fehlt: ${marker}`);
    }
  }

  log("BESTANDEN: Lightbox-Vorschaubilder sind horizontal und vertikal zentriert.");
  log("BESTANDEN: Vorschauen füllen ihre Kachel ohne unteren Baseline-Abstand.");
  log("BESTANDEN: Zero-Edge- und Viewport-Höhenverhalten bleiben erhalten.");
  log("Abgeschlossen.");
} catch (error) {
  rollback();
  log(`FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  log("Änderungen wurden zurückgerollt.");
  process.exitCode = 1;
}
