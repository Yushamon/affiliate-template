#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";

const NAME = "pfotentechnik-codex-product-normalization-34.0.3";
const TARGETS = [
  "cat-mate-elite-355w",
  "catit-pixi-smart-trinkbrunnen",
  "invoxia-biotracker-2026",
  "litter-robot-4",
  "pawfit-3",
  "petkit-puramax-2",
  "petsafe-streamside-trinkbrunnen",
  "prothelis-area-pets",
  "reolink-e1-zoom"
];

const STALE_TESTS = [
  "pfotentechnik-codex-product-normalization-34.0.0.test.mjs",
  "pfotentechnik-codex-product-normalization-34.0.1.test.mjs"
];

function log(message) {
  console.log(`[${NAME}] ${message}`);
}

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 14; i += 1) {
    if (
      fs.existsSync(path.join(dir, ".git")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel mit .git und apps/pfotentechnik nicht gefunden.");
}

function capture(command, args, cwd) {
  const r = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    shell: false
  });
  if (r.status !== 0) {
    throw new Error(
      `Befehl fehlgeschlagen: ${command} ${args.join(" ")}\n${r.stderr || r.stdout || ""}`
    );
  }
  return r.stdout;
}

function run(command, args, cwd) {
  log(`${command} ${args.join(" ")}`);

  if (process.platform === "win32" && command === "npm") {
    // npm ist unter Windows eine .cmd-Datei. Direkter execFileSync-Aufruf kann unter
    // neueren Node-Versionen mit spawnSync npm.cmd EINVAL scheitern. Deshalb explizit
    // über cmd.exe starten. Alle Argumente stammen fest aus diesem Installer.
    const comspec = process.env.ComSpec || process.env.COMSPEC || "C:\\Windows\\System32\\cmd.exe";
    const quote = (value) => {
      const s = String(value);
      if (!/[\s"&|<>^()]/.test(s)) return s;
      return `"${s.replaceAll('\"', '""')}"`;
    };
    const commandLine = ["npm", ...args].map(quote).join(" ");
    execFileSync(comspec, ["/d", "/s", "/c", commandLine], {
      cwd,
      stdio: "inherit",
      windowsHide: true
    });
    return;
  }

  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
    windowsHide: true,
    shell: false
  });
}

function backup(root, backupRoot, file) {
  if (!fs.existsSync(file)) return;
  const dest = path.join(backupRoot, path.relative(root, file));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
}

function gitBlob(root, rel) {
  return capture("git", ["show", `HEAD:${rel.replaceAll("\\", "/")}`], root);
}

function assertMain(root) {
  const branch = capture("git", ["branch", "--show-current"], root).trim();
  if (branch !== "main") {
    throw new Error(`Abbruch: aktueller Branch ist "${branch || "(detached)"}", erwartet wird "main".`);
  }
}

function replaceScalar(source, key, value) {
  const rx = new RegExp(`^${key}:\\s*.*$`, "m");
  if (!rx.test(source)) {
    throw new Error(`Pflichtfeld "${key}" fehlt in committed Basis.`);
  }
  return source.replace(rx, `${key}: ${JSON.stringify(value)}`);
}

function frontmatterEndIndex(source) {
  if (!source.startsWith("---")) throw new Error("Frontmatter-Start fehlt.");
  const match = source.match(/\r?\n---\r?\n/);
  if (!match || match.index == null) throw new Error("Frontmatter-Ende fehlt.");
  return match.index;
}

function insertBeforeFrontmatterEnd(source, block) {
  const end = frontmatterEndIndex(source);
  return `${source.slice(0, end)}\n${block.trimEnd()}\n${source.slice(end)}`;
}

function hasUsableRating(source) {
  const rating = Number(source.match(/^rating:\s*([0-5](?:\.\d+)?)\s*$/m)?.[1] || 0);
  const ratings = source.match(/^ratings:\s*\r?\n((?:^[ \t]+.*(?:\r?\n|$))*)/m)?.[1] || "";
  return rating > 0 && /^[ \t]{2,}[A-Za-z0-9_-]+:\s*[0-5](?:\.\d+)?\s*$/m.test(ratings);
}

function hasEvidence(source) {
  return /^externalEvidence:\s*$/m.test(source) &&
    /^\s{2}professionalReviews:\s*$/m.test(source) &&
    /^\s{2}userReviews:\s*$/m.test(source) &&
    /^\s{2}consensus:\s*$/m.test(source) &&
    /^evidenceSources:\s*$/m.test(source);
}

function addExperience(source) {
  if (/^experience:\s*$/m.test(source)) return source;

  const block = `experience:
  summary: >-
    Redaktionelle Einordnung aus Herstellerdokumentation, unabhängigen Tests und dokumentierten Nutzersignalen.
    PfotenTechnik behauptet für dieses Produkt keinen eigenen Praxistest.
  methodology: >-
    Herstellerangaben werden getrennt von professionellen Tests und Nutzerbewertungen ausgewertet.
    Externe Sterne werden nicht direkt in den PfotenTechnik-Score übernommen.
  reliability: >-
    Langzeit- und Zuverlässigkeitsaussagen werden nur so stark gewichtet, wie sie durch die unter
    externalEvidence und evidenceSources dokumentierten Quellen gedeckt sind.`;

  return insertBeforeFrontmatterEnd(source, block);
}

function updateImagesFromExistingFiles(app, slug, source) {
  const dir = path.join(app, "src", "assets", "images", "products", slug);
  if (!fs.existsSync(dir)) return { source, note: "kein Produktordner" };

  const files = fs.readdirSync(dir);
  const set = new Set(files);
  if (!set.has("hero.webp")) return { source, note: "Produktordner vorhanden, hero.webp fehlt" };

  const title = (
    source.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] || slug
  ).replace(/^["']|["']$/g, "");

  const gallery = files
    .filter((name) => /^gallery-\d+\.webp$/i.test(name))
    .sort((a, b) => Number(a.match(/\d+/)?.[0] || 0) - Number(b.match(/\d+/)?.[0] || 0));

  const block = [
    "images:",
    `  hero: { src: "../../assets/images/products/${slug}/hero.webp", alt: ${JSON.stringify(title)} }`
  ];
  if (set.has("thumbnail.webp")) {
    block.push(`  thumbnail: { src: "../../assets/images/products/${slug}/thumbnail.webp", alt: ${JSON.stringify(`${title} als Produktansicht`)} }`);
  }
  if (set.has("comparison.webp")) {
    block.push(`  comparison: { src: "../../assets/images/products/${slug}/comparison.webp", alt: ${JSON.stringify(`${title} im Vergleich`)} }`);
  }
  if (gallery.length) {
    block.push("  gallery:");
    for (const file of gallery) {
      block.push(`    - { src: "../../assets/images/products/${slug}/${file}", alt: ${JSON.stringify(`${title} Produktansicht`)} }`);
    }
  } else {
    block.push("  gallery: []");
  }

  const start = source.search(/^images:\s*$/m);
  if (start < 0) return { source, note: "images-Block fehlt" };

  const afterStart = source.indexOf("\n", start) + 1;
  const rest = source.slice(afterStart);
  const nextTop = rest.search(/^[A-Za-z][A-Za-z0-9_-]*:\s*/m);
  if (nextTop < 0) return { source, note: "images-Block strukturell nicht abgrenzbar" };

  const end = afterStart + nextTop;
  return {
    source: `${source.slice(0, start)}${block.join("\n")}\n${source.slice(end)}`,
    note: `lokale WebP erkannt (${files.length})`
  };
}

function writeTest(app) {
  const file = path.join(app, "test", "pfotentechnik-codex-product-normalization-34.0.3.test.mjs");
  const text = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");
const targets = ${JSON.stringify(TARGETS, null, 2)};

for (const slug of targets) {
  test(\`\${slug}: Lifecycle und Evidence normalisiert\`, () => {
    const src = fs.readFileSync(
      path.join(app, "src", "content", "products", \`\${slug}.md\`),
      "utf8"
    );

    assert.match(src, /^productStatus:\\s*["']?active["']?\\s*$/m);
    assert.match(src, /^editorialStatus:\\s*["']?complete["']?\\s*$/m);
    assert.match(src, /^recommendationStatus:\\s*["']?recommended["']?\\s*$/m);
    assert.match(src, /^maintenanceStatus:\\s*["']?complete["']?\\s*$/m);

    const rating = Number(src.match(/^rating:\\s*([0-5](?:\\.\\d+)?)\\s*$/m)?.[1] || 0);
    assert.ok(rating > 0, "rating muss > 0 sein");
    assert.match(src, /^ratings:\\s*$/m);
    assert.match(src, /^externalEvidence:\\s*$/m);
    assert.match(src, /^\\s{2}professionalReviews:\\s*$/m);
    assert.match(src, /^\\s{2}userReviews:\\s*$/m);
    assert.match(src, /^\\s{2}consensus:\\s*$/m);
    assert.match(src, /^evidenceSources:\\s*$/m);
    assert.match(src, /^experience:\\s*$/m);
    assert.match(src, /PfotenTechnik behauptet[^\\n]*keinen eigenen Praxistest|keinen eigenen Praxistest/i);
  });
}

test("alte fehlerhafte Normalization-Tests sind entfernt", () => {
  for (const name of ${JSON.stringify(STALE_TESTS)}) {
    assert.equal(fs.existsSync(path.join(app, "test", name)), false, name);
  }
});
`;
  fs.writeFileSync(file, text, "utf8");
  return file;
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const TEST_DIR = path.join(APP, "test");
const TEST_FILE = path.join(TEST_DIR, "pfotentechnik-codex-product-normalization-34.0.3.test.mjs");
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const touched = [];
const removedTests = [];
const mediaNotes = [];

try {
  assertMain(ROOT);
  fs.mkdirSync(BACKUP, { recursive: true });

  // Alte Tests werden ebenfalls gesichert und danach entfernt.
  for (const stale of STALE_TESTS) {
    const file = path.join(TEST_DIR, stale);
    if (fs.existsSync(file)) {
      backup(ROOT, BACKUP, file);
      fs.unlinkSync(file);
      removedTests.push(path.relative(ROOT, file));
    }
  }

  for (const slug of TARGETS) {
    const rel = path.join(
      "apps",
      "pfotentechnik",
      "src",
      "content",
      "products",
      `${slug}.md`
    );
    const file = path.join(ROOT, rel);

    if (!fs.existsSync(file)) {
      throw new Error(`Lokale Produktdatei fehlt: ${rel}`);
    }

    backup(ROOT, BACKUP, file);

    // Entscheidend: Nicht den möglicherweise beschädigten Working-Tree reparieren.
    // Ausgangsbasis ist der committed HEAD auf aktuellem main.
    let source = gitBlob(ROOT, rel);

    if (!hasUsableRating(source)) {
      throw new Error(`${slug}: committed main besitzt keine belastbare Bewertung.`);
    }
    if (!hasEvidence(source)) {
      throw new Error(`${slug}: committed main besitzt keine vollständige Evidence-Struktur.`);
    }

    source = replaceScalar(source, "editorialStatus", "complete");
    source = replaceScalar(source, "recommendationStatus", "recommended");
    source = replaceScalar(source, "maintenanceStatus", "complete");
    source = addExperience(source);

    const media = updateImagesFromExistingFiles(APP, slug, source);
    source = media.source;
    mediaNotes.push(`${slug}: ${media.note}`);

    fs.writeFileSync(file, source, "utf8");
    touched.push(rel);
  }

  backup(ROOT, BACKUP, TEST_FILE);
  fs.mkdirSync(TEST_DIR, { recursive: true });
  writeTest(APP);

  // Syntax zuerst.
  run(process.execPath, ["--check", fileURLToPath(import.meta.url)], ROOT);
  run(process.execPath, ["--check", TEST_FILE], ROOT);
  run(process.execPath, ["--test", TEST_FILE], ROOT);

  // Content-Schema ist hier das entscheidende Gate gegen YAML-Schäden.
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "lint:content"], ROOT);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:products:strict"], ROOT);

  const pkg = JSON.parse(fs.readFileSync(path.join(APP, "package.json"), "utf8"));
  if (pkg.scripts?.["audit:product-evidence"]) {
    run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:product-evidence"], ROOT);
  }

  // Voller Build als finales Integrations-Gate.
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], ROOT);

  log(`Backup: ${path.relative(ROOT, BACKUP)}`);
  log(`Produktdateien neu aus committed main aufgebaut: ${touched.length}`);
  for (const rel of touched) log(`- ${rel}`);
  if (removedTests.length) {
    log("Entfernte veraltete Tests:");
    for (const rel of removedTests) log(`- ${rel}`);
  }
  log("Media-Erkennung:");
  for (const note of mediaNotes) log(`- ${note}`);
  log("Fertig. 34.0.2 ist vollständig durch Tests, Content-Lint, Product-Audit und Build gelaufen.");
} catch (error) {
  log(`FEHLER: ${error.message}`);
  log("Rollback aus Backup.");

  // Produktdateien zurückrollen.
  for (const slug of TARGETS) {
    const rel = path.join(
      "apps",
      "pfotentechnik",
      "src",
      "content",
      "products",
      `${slug}.md`
    );
    const src = path.join(BACKUP, rel);
    const dst = path.join(ROOT, rel);
    if (fs.existsSync(src)) fs.copyFileSync(src, dst);
  }

  // Neuer Test zurückrollen/entfernen.
  const testRel = path.relative(ROOT, TEST_FILE);
  const testBackup = path.join(BACKUP, testRel);
  if (fs.existsSync(testBackup)) {
    fs.copyFileSync(testBackup, TEST_FILE);
  } else if (fs.existsSync(TEST_FILE)) {
    fs.unlinkSync(TEST_FILE);
  }

  // Alte Tests wiederherstellen.
  for (const stale of STALE_TESTS) {
    const rel = path.join("apps", "pfotentechnik", "test", stale);
    const src = path.join(BACKUP, rel);
    const dst = path.join(ROOT, rel);
    if (fs.existsSync(src)) {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
    }
  }

  console.error(error);
  process.exitCode = 1;
}
