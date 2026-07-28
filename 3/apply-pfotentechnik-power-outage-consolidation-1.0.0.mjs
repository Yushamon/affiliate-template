#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-power-outage-consolidation-1.0.0";
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check") || args.has("--dry-run");
const SKIP_BUILD = args.has("--skip-build") || args.has("--no-build");

const log = (message) => console.log(`[${NAME}] ${message}`);
const fail = (message) => {
  const text = message instanceof Error ? message.stack || message.message : String(message);
  console.error(`[${NAME}] FEHLER: ${text}`);
  process.exitCode = 1;
};

function findRoot(start) {
  let current = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

const installerDir = path.dirname(fileURLToPath(import.meta.url));
const root = findRoot(process.cwd()) || findRoot(installerDir);
if (!root) {
  fail("Repository-Root nicht gefunden. Starte den Installer im affiliate-template-Repository.");
  process.exit(1);
}

const appRoot = path.join(root, "apps", "pfotentechnik");
const payloadPage = path.join(
  installerDir,
  "payload",
  "apps",
  "pfotentechnik",
  "src",
  "content",
  "pages",
  "futterautomat-bei-stromausfall.md"
);
const targetPage = path.join(
  appRoot,
  "src",
  "content",
  "pages",
  "futterautomat-bei-stromausfall.md"
);
const oldPage = path.join(
  appRoot,
  "src",
  "content",
  "pages",
  "futterautomat-batterie-oder-netzteil.md"
);
const redirectsFile = path.join(appRoot, "public", "_redirects");
const oldHero = path.join(
  appRoot,
  "src",
  "assets",
  "images",
  "editorial",
  "feeder-battery-or-mains.webp"
);

const OLD_ROUTE = "/futterautomat-batterie-oder-netzteil";
const NEW_ROUTE = "/futterautomat-bei-stromausfall/";
const redirectLines = [
  `${OLD_ROUTE} ${NEW_ROUTE} 301`,
  `${OLD_ROUTE}/ ${NEW_ROUTE} 301`
];
const marker = "# pfotentechnik: Stromausfall-Content-Konsolidierung 1.0.0";

if (!fs.existsSync(payloadPage)) {
  fail(`Payload fehlt: ${path.relative(installerDir, payloadPage)}`);
  process.exit(1);
}

const normalize = (value) =>
  String(value)
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n");

const pageContent = normalize(fs.readFileSync(payloadPage, "utf8"));
if (
  !pageContent.includes('slug: "futterautomat-bei-stromausfall"') ||
  !pageContent.includes('canonical: "/futterautomat-bei-stromausfall/"') ||
  !pageContent.includes("## Die kurze Antwort")
) {
  fail("Die Payload-Seite besitzt nicht die erwartete Struktur.");
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, ".patch-backups", `${NAME}-${timestamp}`);
const changed = new Set();
const snapshots = new Map();

const relative = (file) =>
  path.relative(root, file).split(path.sep).join("/");

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

function snapshot(file) {
  if (CHECK_ONLY || snapshots.has(file)) return;
  snapshots.set(file, {
    existed: fs.existsSync(file),
    content: fs.existsSync(file) ? fs.readFileSync(file) : null
  });
  if (fs.existsSync(file)) {
    const target = path.join(backupRoot, relative(file));
    ensureDir(path.dirname(target));
    fs.copyFileSync(file, target);
  }
}

function writeFile(file, content) {
  const next = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
  const before = fs.existsSync(file) ? fs.readFileSync(file) : null;
  if (before && before.equals(next)) return false;
  changed.add(relative(file));
  if (!CHECK_ONLY) {
    snapshot(file);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, next);
  }
  return true;
}

function removeFile(file) {
  if (!fs.existsSync(file)) return false;
  changed.add(relative(file));
  if (!CHECK_ONLY) {
    snapshot(file);
    fs.rmSync(file, { force: true });
  }
  return true;
}

function rollback() {
  if (CHECK_ONLY || !snapshots.size) return;
  log("Verifikation fehlgeschlagen. Änderungen werden zurückgerollt.");
  for (const [file, state] of [...snapshots.entries()].reverse()) {
    if (state.existed) {
      ensureDir(path.dirname(file));
      fs.writeFileSync(file, state.content);
    } else {
      fs.rmSync(file, { force: true, recursive: true });
    }
  }
}

function walk(dir, extensions, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      [
        "node_modules",
        "dist",
        ".astro",
        ".git",
        ".patch-backups",
        "reports",
        "generated"
      ].includes(entry.name)
    ) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, extensions, result);
    } else if (extensions.has(path.extname(entry.name).toLowerCase())) {
      result.push(full);
    }
  }
  return result;
}

function updateRedirects() {
  const before = fs.existsSync(redirectsFile)
    ? normalize(fs.readFileSync(redirectsFile, "utf8")).replace(/\s+$/, "")
    : "";
  const lines = new Set(before.split("\n"));
  const missing = redirectLines.filter((line) => !lines.has(line));
  if (!missing.length) return false;
  const section = [marker, ...missing].join("\n");
  const next = `${before}${before ? "\n\n" : ""}${section}\n`;
  return writeFile(redirectsFile, next);
}

function replaceOldInternalLinks() {
  const extensions = new Set([
    ".md",
    ".mdx",
    ".astro",
    ".ts",
    ".tsx",
    ".js",
    ".mjs",
    ".json",
    ".yml",
    ".yaml"
  ]);
  const roots = [
    path.join(appRoot, "src"),
    path.join(root, "packages", "affiliate-core", "src")
  ];
  const pattern = /\/futterautomat-batterie-oder-netzteil\/?/g;

  for (const scanRoot of roots) {
    for (const file of walk(scanRoot, extensions)) {
      if (path.resolve(file) === path.resolve(oldPage)) continue;
      const before = normalize(fs.readFileSync(file, "utf8"));
      const next = before.replace(pattern, NEW_ROUTE);
      if (next !== before) writeFile(file, next);
    }
  }
}

function cleanupUnusedOldHero() {
  if (!fs.existsSync(oldHero)) return false;
  const extensions = new Set([
    ".md",
    ".mdx",
    ".astro",
    ".ts",
    ".tsx",
    ".js",
    ".mjs",
    ".json",
    ".yml",
    ".yaml",
    ".css"
  ]);
  const reference = "feeder-battery-or-mains.webp";
  for (const file of walk(path.join(appRoot, "src"), extensions)) {
    if (path.resolve(file) === path.resolve(oldPage)) continue;
    const source = normalize(fs.readFileSync(file, "utf8"));
    if (source.includes(reference)) return false;
  }
  return removeFile(oldHero);
}

function verifySource() {
  const errors = [];
  if (!fs.existsSync(targetPage)) {
    errors.push("Neue Wissensseite fehlt.");
  } else {
    const source = normalize(fs.readFileSync(targetPage, "utf8"));
    if (!source.includes('slug: "futterautomat-bei-stromausfall"')) {
      errors.push("Slug der neuen Wissensseite ist falsch.");
    }
    if (!source.includes('canonical: "/futterautomat-bei-stromausfall/"')) {
      errors.push("Canonical der neuen Wissensseite fehlt.");
    }
    if ((source.match(/^\s*-\s+question:/gm) || []).length < 12) {
      errors.push("FAQ-Ausbau der neuen Wissensseite ist unvollständig.");
    }
  }

  if (fs.existsSync(oldPage)) {
    errors.push("Alte Wissensseite existiert noch.");
  }

  const redirects = fs.existsSync(redirectsFile)
    ? normalize(fs.readFileSync(redirectsFile, "utf8")).split("\n")
    : [];
  for (const line of redirectLines) {
    if (!redirects.includes(line)) errors.push(`Redirect fehlt: ${line}`);
  }

  const extensions = new Set([
    ".md",
    ".mdx",
    ".astro",
    ".ts",
    ".tsx",
    ".js",
    ".mjs",
    ".json",
    ".yml",
    ".yaml"
  ]);
  const roots = [
    path.join(appRoot, "src"),
    path.join(root, "packages", "affiliate-core", "src")
  ];
  const unresolved = [];
  for (const scanRoot of roots) {
    for (const file of walk(scanRoot, extensions)) {
      const source = normalize(fs.readFileSync(file, "utf8"));
      if (source.includes(OLD_ROUTE)) unresolved.push(relative(file));
    }
  }
  if (unresolved.length) {
    errors.push(`Veraltete interne Links: ${unresolved.join(", ")}`);
  }

  if (errors.length) {
    throw new Error(errors.join("\n- "));
  }
}

function run(command, commandArgs, label) {
  log(label);
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} fehlgeschlagen (Exit ${result.status}).`);
  }
}

function verifyBuild() {
  const distRoot = path.join(appRoot, "dist");
  const targetHtml = path.join(
    distRoot,
    "futterautomat-bei-stromausfall",
    "index.html"
  );
  const oldHtml = path.join(
    distRoot,
    "futterautomat-batterie-oder-netzteil",
    "index.html"
  );

  if (!fs.existsSync(targetHtml)) {
    throw new Error("Neue Route fehlt im Build.");
  }
  if (fs.existsSync(oldHtml)) {
    throw new Error("Alte Route wurde weiterhin als HTML-Seite gebaut.");
  }

  for (const sitemapName of [
    "sitemap.xml",
    "sitemap-0.xml",
    "sitemap-index.xml"
  ]) {
    const sitemap = path.join(distRoot, sitemapName);
    if (
      fs.existsSync(sitemap) &&
      normalize(fs.readFileSync(sitemap, "utf8")).includes(OLD_ROUTE)
    ) {
      throw new Error(`Alte Route steht weiterhin in ${sitemapName}.`);
    }
  }

  const builtRedirects = path.join(distRoot, "_redirects");
  if (!fs.existsSync(builtRedirects)) {
    throw new Error("_redirects wurde nicht in den Build übernommen.");
  }
  const lines = normalize(fs.readFileSync(builtRedirects, "utf8")).split("\n");
  for (const line of redirectLines) {
    if (!lines.includes(line)) {
      throw new Error(`Redirect fehlt im Build: ${line}`);
    }
  }
}

try {
  writeFile(targetPage, pageContent.endsWith("\n") ? pageContent : `${pageContent}\n`);
  replaceOldInternalLinks();
  updateRedirects();
  removeFile(oldPage);
  cleanupUnusedOldHero();

  if (CHECK_ONLY) {
    if (!changed.size) {
      log("Bereits vollständig installiert.");
    } else {
      log(`${changed.size} Datei(en) würden geändert:`);
      for (const file of [...changed].sort()) console.log(`- ${file}`);
    }
    process.exit(0);
  }

  verifySource();

  if (changed.size && !SKIP_BUILD) {
    run(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["run", "build:pfotentechnik"],
      "PfotenTechnik-Build"
    );
    verifyBuild();
    run(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["--workspace", "apps/pfotentechnik", "run", "audit:repository"],
      "Repository-Audit"
    );
  }

  if (!changed.size) {
    log("Bereits vollständig installiert.");
  } else {
    log(`${changed.size} Datei(en) aktualisiert:`);
    for (const file of [...changed].sort()) console.log(`- ${file}`);
    log(`Backup: ${relative(backupRoot)}`);
    if (SKIP_BUILD) {
      log("Build wurde übersprungen. Empfohlen: npm run build:pfotentechnik");
    } else {
      log("Build, Redirect-Verifikation und Repository-Audit erfolgreich.");
    }
  }
} catch (error) {
  rollback();
  fail(error);
}
