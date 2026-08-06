#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-mobile-breadcrumb-hide-32.1.1";
const runBuild = process.argv.includes("--build");

function findRepoRoot(start = process.cwd()) {
  let current = path.resolve(start);

  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik"))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error(`[${PATCH}] Repository-Wurzel nicht gefunden.`);
    }
    current = parent;
  }
}

const root = findRepoRoot();
const targets = {
  layoutCss: path.join(
    root,
    "packages",
    "affiliate-core",
    "src",
    "styles",
    "layout.css"
  ),
  articleCss: path.join(
    root,
    "packages",
    "affiliate-core",
    "src",
    "styles",
    "article.css"
  ),
  miscCss: path.join(
    root,
    "packages",
    "affiliate-core",
    "src",
    "styles",
    "misc.css"
  ),
  test: path.join(
    root,
    "apps",
    "pfotentechnik",
    "test",
    `${PATCH}.test.mjs`
  )
};

for (const [key, file] of Object.entries(targets)) {
  if (key !== "test" && !fs.existsSync(file)) {
    throw new Error(
      `[${PATCH}] Erwartete Datei fehlt: ${path.relative(root, file)}`
    );
  }
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${timestamp}`
);
const changed = [];

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function backup(file) {
  const relative = path.relative(root, file);
  const destination = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
}

function writeIfChanged(file, content) {
  const previous = fs.existsSync(file) ? read(file) : null;
  if (previous === content) return false;

  if (previous !== null) backup(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
  changed.push(path.relative(root, file));
  return true;
}

function replaceOneOf(source, candidates, replacement, label) {
  if (source.includes(replacement)) return source;

  for (const candidate of candidates) {
    if (source.includes(candidate)) {
      return source.replace(candidate, replacement);
    }
  }

  throw new Error(
    `[${PATCH}] ${label}: Kein erwarteter Ausgangsblock gefunden.`
  );
}

let layoutCss = read(targets.layoutCss);
layoutCss = replaceOneOf(
  layoutCss,
  [
    `.container:not(.container--page) {
    padding-top: 90px;
  }`,
    `.container:not(.container--page) {
    /*
     * Der Header liegt im normalen Dokumentfluss. Ein zusätzlicher
     * 90-px-Sicherheitsabstand erzeugt deshalb leere Fläche auf Mobilgeräten.
     */
    padding-top: 32px;
  }`
  ],
  `.container:not(.container--page) {
    padding-top: 32px;
  }`,
  "Mobiler Seitenabstand"
);
writeIfChanged(targets.layoutCss, layoutCss);

let articleCss = read(targets.articleCss);
articleCss = replaceOneOf(
  articleCss,
  [
    `.article-header {
    padding: 42px 0 28px;
  }`,
    `.article-header {
    padding: 24px 0 28px;
  }`
  ],
  `.article-header {
    padding: 12px 0 28px;
  }`,
  "Mobiler Artikelkopf"
);
writeIfChanged(targets.articleCss, articleCss);

let miscCss = read(targets.miscCss);

const previousMobileBlock = `
/*
 * Auf kleinen Displays zeigt die sichtbare Navigation nur das übergeordnete
 * Ziel. Der vollständige Breadcrumb-Pfad und dessen JSON-LD bleiben erhalten.
 */
.breadcrumbs--mobile {
  display: none;
}

@media (max-width: 768px) {
  .breadcrumbs--desktop {
    display: none;
  }

  .breadcrumbs--mobile {
    display: flex;
    margin-bottom: 0;
    font-size: 15px;
  }

  .breadcrumbs--mobile a {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    gap: 8px;
  }

  .breadcrumbs__back-icon {
    color: var(--muted);
    font-size: 18px;
    line-height: 1;
  }
}
`;

const hiddenMobileBlock = `
/*
 * Mobile wird auf sichtbare Breadcrumbs verzichtet. Die vollständige
 * BreadcrumbList bleibt über das Layout als JSON-LD erhalten.
 */
.breadcrumbs--mobile {
  display: none;
}

@media (max-width: 768px) {
  .breadcrumbs,
  .breadcrumbs--desktop,
  .breadcrumbs--mobile {
    display: none;
  }
}
`;

if (miscCss.includes(previousMobileBlock)) {
  miscCss = miscCss.replace(previousMobileBlock, hiddenMobileBlock);
} else if (!miscCss.includes("Mobile wird auf sichtbare Breadcrumbs verzichtet")) {
  const anchor = `.breadcrumbs span:last-child {
  color: var(--text);
}
`;

  if (!miscCss.includes(anchor)) {
    throw new Error(
      `[${PATCH}] Breadcrumb-CSS-Anker wurde nicht gefunden.`
    );
  }

  miscCss = miscCss.replace(anchor, `${anchor}${hiddenMobileBlock}`);
}

writeIfChanged(targets.miscCss, miscCss);

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");

const read = (...parts) =>
  fs.readFileSync(path.join(root, ...parts), "utf8");

const layoutCss = read(
  "packages",
  "affiliate-core",
  "src",
  "styles",
  "layout.css"
);
const articleCss = read(
  "packages",
  "affiliate-core",
  "src",
  "styles",
  "article.css"
);
const miscCss = read(
  "packages",
  "affiliate-core",
  "src",
  "styles",
  "misc.css"
);

test("mobile Standardseiten beginnen mit kompaktem oberen Abstand", () => {
  assert.match(
    layoutCss,
    /\\.container:not\\(\\.container--page\\)[\\s\\S]*?padding-top:\\s*32px;/
  );
  assert.doesNotMatch(
    layoutCss,
    /\\.container:not\\(\\.container--page\\)[\\s\\S]*?padding-top:\\s*90px;/
  );
});

test("sichtbare Breadcrumbs sind mobil vollständig ausgeblendet", () => {
  assert.match(
    miscCss,
    /@media \\(max-width: 768px\\)[\\s\\S]*?\\.breadcrumbs,[\\s\\S]*?\\.breadcrumbs--desktop,[\\s\\S]*?\\.breadcrumbs--mobile\\s*{\\s*display:\\s*none;/
  );
  assert.match(
    miscCss,
    /BreadcrumbList bleibt über das Layout als JSON-LD erhalten/
  );
});

test("Artikelkopf nutzt ohne mobilen Breadcrumb nur einen kleinen Innenabstand", () => {
  assert.match(
    articleCss,
    /@media \\(max-width: 820px\\)[\\s\\S]*?\\.article-header\\s*{\\s*padding:\\s*12px 0 28px;/
  );
});

test("Patch führt keine important-Regel ein", () => {
  const block =
    miscCss.match(
      /\\/\\*[\\s\\S]*?Mobile wird auf sichtbare Breadcrumbs verzichtet[\\s\\S]*?\\n}/
    )?.[0] ?? "";
  assert.doesNotMatch(block, /!important/);
});
`;

writeIfChanged(targets.test, testSource);

console.log(`[${PATCH}] Geänderte Dateien:`);
if (changed.length === 0) {
  console.log("  Keine. Patch ist bereits angewendet.");
} else {
  for (const file of changed) console.log(`  - ${file}`);
  console.log(
    `[${PATCH}] Backup: ${path.relative(root, backupRoot)}`
  );
}

const testRun = spawnSync(
  process.execPath,
  ["--test", path.relative(root, targets.test)],
  {
    cwd: root,
    stdio: "inherit"
  }
);

if (testRun.status !== 0) {
  throw new Error(`[${PATCH}] Zieltest fehlgeschlagen.`);
}

if (runBuild) {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const build = spawnSync(
    npm,
    ["--workspace", "apps/pfotentechnik", "run", "build"],
    {
      cwd: root,
      stdio: "inherit"
    }
  );

  if (build.status !== 0) {
    throw new Error(`[${PATCH}] Build fehlgeschlagen.`);
  }
}

console.log(`[${PATCH}] Fertig.`);
