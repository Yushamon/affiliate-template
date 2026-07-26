#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-product-media-recovery-5.1.0";
const root = process.cwd();
const appRoot = path.join(root, "apps", "pfotentechnik");
const productsDir = path.join(appRoot, "src", "content", "products");
const publicDir = path.join(appRoot, "public");
const reportFile = path.join(appRoot, "reports", "product-data-audit.json");
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32"
  });
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} ist fehlgeschlagen.`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function normalizeSlash(value) {
  return value.replaceAll("\\", "/");
}

function extractFrontmatter(source) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  return match?.[1] ?? null;
}

function getScalar(block, key) {
  const match = block.match(
    new RegExp(`^\\s*${key}\\s*:\\s*(?:"([^"]*)"|'([^']*)'|([^\\r\\n#]+))`, "m")
  );
  return (match?.[1] ?? match?.[2] ?? match?.[3] ?? "").trim();
}

function imagePathsFromImagesBlock(frontmatter) {
  const start = frontmatter.search(/^images\s*:\s*$/m);
  if (start < 0) return [];
  const tail = frontmatter.slice(start);
  const nextTop = tail.slice(tail.indexOf("\n") + 1).search(/^[A-Za-z][\w-]*\s*:/m);
  const block = nextTop >= 0
    ? tail.slice(0, tail.indexOf("\n") + 1 + nextTop)
    : tail;
  const paths = [];
  for (const match of block.matchAll(/(?:src\s*:|hero\s*:|thumbnail\s*:|comparison\s*:)\s*["']?([^"'\r\n,#}]+)["']?/g)) {
    const value = match[1].trim();
    if (value.startsWith("/")) paths.push(value);
  }
  return [...new Set(paths)];
}

function findAssetCandidates(slug) {
  const normalizedSlug = slug.toLowerCase();
  return walk(publicDir)
    .filter((file) => /\.(?:webp|png|jpe?g|avif)$/i.test(file))
    .filter((file) => {
      const rel = normalizeSlash(path.relative(publicDir, file)).toLowerCase();
      return rel.includes(normalizedSlug);
    })
    .map((file) => `/${normalizeSlash(path.relative(publicDir, file))}`)
    .sort((a, b) => {
      const rank = (value) => {
        const lower = value.toLowerCase();
        if (lower.includes("gallery")) return 0;
        if (lower.includes("hero")) return 1;
        if (lower.includes("comparison")) return 2;
        if (lower.includes("thumbnail")) return 3;
        return 4;
      };
      return rank(a) - rank(b) || a.localeCompare(b);
    });
}

function replaceImagesBlock(source, replacement) {
  const match = source.match(/^images\s*:\s*$[\s\S]*?(?=^[A-Za-z][\w-]*\s*:|\r?\n---)/m);
  if (!match) return null;
  return source.slice(0, match.index) + replacement + source.slice(match.index + match[0].length);
}

function parseExistingImageFields(frontmatter) {
  const result = {};
  const start = frontmatter.search(/^images\s*:\s*$/m);
  if (start < 0) return result;
  const tail = frontmatter.slice(start);
  const next = tail.slice(tail.indexOf("\n") + 1).search(/^[A-Za-z][\w-]*\s*:/m);
  const block = next >= 0 ? tail.slice(0, tail.indexOf("\n") + 1 + next) : tail;

  for (const key of ["hero", "thumbnail", "comparison"]) {
    const match = block.match(new RegExp(`^\\s{2}${key}\\s*:\\s*["']?([^"'\\r\\n#]+)`, "m"));
    if (match) result[key] = match[1].trim();
  }

  result.gallery = [];
  for (const match of block.matchAll(/^\s*-\s*(?:src\s*:\s*)?["']?([^"'\r\n,#}]+)["']?/gm)) {
    const value = match[1].trim();
    if (value.startsWith("/")) result.gallery.push(value);
  }
  return result;
}

function renderImages(fields) {
  const lines = ["images:"];
  if (fields.hero) lines.push(`  hero: "${fields.hero}"`);
  if (fields.thumbnail) lines.push(`  thumbnail: "${fields.thumbnail}"`);
  if (fields.comparison) lines.push(`  comparison: "${fields.comparison}"`);
  lines.push("  gallery:");
  for (const src of fields.gallery) {
    lines.push(`    - src: "${src}"`);
    lines.push(`      alt: "Produktansicht"`);
  }
  return `${lines.join("\n")}\n`;
}

if (!fs.existsSync(reportFile)) {
  console.error(`[${PATCH}] Auditbericht fehlt: ${path.relative(root, reportFile)}`);
  console.error("Bitte zuerst npm --workspace apps/pfotentechnik run audit:products:strict ausführen.");
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportFile, "utf8"));
const targets = report.products.filter((product) =>
  product.warnings.some((warning) =>
    warning.includes("Galerie-Bilder hinterlegt") ||
    warning === "Comparison-Bild fehlt"
  )
);

const originals = new Map();
const changes = [];
const skipped = [];

try {
  for (const product of targets) {
    const file = path.join(appRoot, product.file);
    if (!fs.existsSync(file)) {
      skipped.push({ slug: product.slug, reason: "Produktdatei fehlt" });
      continue;
    }

    const source = fs.readFileSync(file, "utf8");
    const frontmatter = extractFrontmatter(source);
    if (!frontmatter) {
      skipped.push({ slug: product.slug, reason: "Frontmatter nicht lesbar" });
      continue;
    }

    const fields = parseExistingImageFields(frontmatter);
    const candidates = [
      ...imagePathsFromImagesBlock(frontmatter),
      ...findAssetCandidates(product.slug)
    ].filter(Boolean);
    const unique = [...new Set(candidates)];

    if (!fields.hero && unique[0]) fields.hero = unique[0];
    if (!fields.thumbnail) {
      fields.thumbnail = unique.find((item) => item !== fields.hero) || fields.hero;
    }
    if (!fields.comparison) {
      fields.comparison =
        unique.find((item) => ![fields.hero, fields.thumbnail].includes(item)) ||
        fields.thumbnail ||
        fields.hero;
    }

    const existingGallery = [...new Set(fields.gallery || [])];
    const pool = unique.filter((item) => !existingGallery.includes(item));
    while (existingGallery.length < 2 && pool.length) {
      existingGallery.push(pool.shift());
    }
    fields.gallery = existingGallery;

    const hadComparisonWarning = product.warnings.includes("Comparison-Bild fehlt");
    const hadGalleryWarning = product.warnings.some((warning) =>
      warning.includes("Galerie-Bilder hinterlegt")
    );

    if ((hadComparisonWarning && !fields.comparison) ||
        (hadGalleryWarning && fields.gallery.length < 2)) {
      skipped.push({
        slug: product.slug,
        reason: `Nicht genügend vorhandene Bildassets gefunden (${fields.gallery.length} Galerie)`
      });
      continue;
    }

    const replacedFrontmatter = replaceImagesBlock(frontmatter, renderImages(fields));
    if (!replacedFrontmatter) {
      skipped.push({ slug: product.slug, reason: "images-Block nicht eindeutig gefunden" });
      continue;
    }

    const next = source.replace(frontmatter, replacedFrontmatter.trimEnd());
    if (next === source) continue;

    originals.set(file, source);
    const backup = path.join(backupRoot, path.relative(root, file));
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.writeFileSync(backup, source, "utf8");
    fs.writeFileSync(file, next.replace(/\r\n/g, "\n"), "utf8");

    changes.push({
      slug: product.slug,
      file: path.relative(root, file),
      comparison: fields.comparison,
      gallery: fields.gallery
    });
  }

  const preview = {
    patch: PATCH,
    generatedAt: new Date().toISOString(),
    changed: changes,
    skipped
  };
  const previewFile = path.join(appRoot, "reports", `${PATCH}-report.json`);
  fs.writeFileSync(previewFile, JSON.stringify(preview, null, 2), "utf8");

  console.log(`[${PATCH}] Medien-Recovery abgeschlossen.`);
  console.log(`Geändert: ${changes.length}`);
  console.log(`Übersprungen: ${skipped.length}`);
  for (const item of changes) {
    console.log(`- ${item.slug}: ${item.gallery.length} Galerie-Bilder`);
  }
  for (const item of skipped) {
    console.log(`- Übersprungen ${item.slug}: ${item.reason}`);
  }
  console.log("");

  run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:products:strict"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:audit"]);
  run("npm", ["run", "build:pfotentechnik"]);

  const after = JSON.parse(fs.readFileSync(reportFile, "utf8"));
  if (after.summary.errors !== 0) {
    throw new Error(`Produktdaten-Audit enthält ${after.summary.errors} Fehler.`);
  }

  console.log("");
  console.log(`[${PATCH}] Erfolgreich abgeschlossen.`);
  console.log(`Warnungen vorher: ${report.summary.warnings}`);
  console.log(`Warnungen nachher: ${after.summary.warnings}`);
  console.log(`Bericht: ${path.relative(root, previewFile)}`);
} catch (error) {
  for (const [file, source] of originals) {
    fs.writeFileSync(file, source, "utf8");
  }
  console.error("");
  console.error(`[${PATCH}] Fehlgeschlagen; Produktdateien wurden zurückgesetzt.`);
  console.error(error?.stack || error);
  process.exit(1);
}
