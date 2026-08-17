#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-product-media-consistency-32.6.12";
const APPLY = process.argv.includes("--apply");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
}

function getFrontmatter(raw) {
  if (!raw.startsWith("---")) return null;
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return null;
  return {
    bodyStart: end + 4,
    fm: raw.slice(4, end),
    before: raw.slice(0, 4),
    after: raw.slice(end)
  };
}

function getTitle(raw, slug) {
  const m = raw.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  return m?.[1]?.replace(/^["']|["']$/g, "") || slug;
}

function replaceImagesBlock(raw, block) {
  const fmData = getFrontmatter(raw);
  if (!fmData) throw new Error("Kein gültiges Frontmatter");
  const lines = fmData.fm.split(/\r?\n/);
  const start = lines.findIndex((line) => /^images:\s*$/.test(line));
  if (start < 0) return raw;

  let end = start + 1;
  while (end < lines.length) {
    if (/^[A-Za-z_][\w-]*:/.test(lines[end])) break;
    end++;
  }
  lines.splice(start, end - start, ...block.split("\n"));
  return fmData.before + lines.join("\n") + fmData.after;
}

const root = findRoot(process.cwd());
const app = path.join(root, "apps", "pfotentechnik");
const productDir = path.join(app, "src", "content", "products");
const assetsBase = path.join(app, "src", "assets", "images", "products");

const productFiles = fs.readdirSync(productDir)
  .filter((f) => f.endsWith(".md"))
  .sort();

const findings = [];
const changed = [];

for (const file of productFiles) {
  const mdPath = path.join(productDir, file);
  const slug = file.replace(/\.md$/, "");
  const assetDir = path.join(assetsBase, slug);
  if (!fs.existsSync(assetDir)) continue;

  const assets = fs.readdirSync(assetDir)
    .filter((f) => f.toLowerCase().endsWith(".webp"))
    .sort((a, b) => a.localeCompare(b, "de", { numeric: true }));

  if (!assets.length) continue;

  const raw = fs.readFileSync(mdPath, "utf8");
  const has = (name) => assets.includes(name);

  const mdHasHero = new RegExp(`assets/images/products/${slug}/hero\\.webp`).test(raw);
  const mdHasThumb = new RegExp(`assets/images/products/${slug}/thumbnail\\.webp`).test(raw);
  const mdHasComparison = new RegExp(`assets/images/products/${slug}/comparison\\.webp`).test(raw);
  const placeholder = /default-editorial-hero\.webp/.test(raw);

  const galleries = assets
    .filter((f) => /^gallery-\d+\.webp$/.test(f))
    .sort((a,b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

  const missingGalleryRefs = galleries.filter(
    (g) => !raw.includes(`assets/images/products/${slug}/${g}`)
  );

  const problems = [];
  if (has("hero.webp") && !mdHasHero) problems.push("hero.webp vorhanden, MD nutzt es nicht");
  if (has("thumbnail.webp") && !mdHasThumb) problems.push("thumbnail.webp vorhanden, MD nutzt es nicht");
  if (has("comparison.webp") && !mdHasComparison) problems.push("comparison.webp vorhanden, MD nutzt es nicht");
  if (missingGalleryRefs.length) problems.push(`Gallery-Referenzen fehlen: ${missingGalleryRefs.join(", ")}`);
  if (placeholder && (has("hero.webp") || has("comparison.webp") || has("thumbnail.webp"))) {
    problems.push("generischer Editorial-Hero trotz realer Produktbilder");
  }

  if (!problems.length) continue;

  findings.push({ slug, assets, problems });

  if (APPLY) {
    if (!has("hero.webp")) continue;

    const title = getTitle(raw, slug);
    const lines = [
      "images:",
      "  hero:",
      `    src: "../../assets/images/products/${slug}/hero.webp"`,
      `    alt: "${title} in redaktioneller Produktdarstellung"`
    ];

    if (has("thumbnail.webp")) {
      lines.push(
        "  thumbnail:",
        `    src: "../../assets/images/products/${slug}/thumbnail.webp"`,
        `    alt: "${title} als kompaktes Produktbild"`
      );
    }

    if (has("comparison.webp")) {
      lines.push(
        "  comparison:",
        `    src: "../../assets/images/products/${slug}/comparison.webp"`,
        `    alt: "${title} für den Produktvergleich"`
      );
    }

    if (galleries.length) {
      lines.push("  gallery:");
      galleries.forEach((g, i) => {
        lines.push(
          `    - src: "../../assets/images/products/${slug}/${g}"`,
          `      alt: "${title} – Produktansicht ${i + 1}"`
        );
      });
    } else {
      lines.push("  gallery: []");
    }

    const patched = replaceImagesBlock(raw, lines.join("\n"));
    if (patched !== raw) {
      const backup = `${mdPath}.${PATCH}.bak`;
      if (!fs.existsSync(backup)) fs.copyFileSync(mdPath, backup);
      fs.writeFileSync(mdPath, patched, "utf8");
      changed.push(path.relative(root, mdPath));
    }
  }
}

const reportDir = path.join(app, "reports", "media");
fs.mkdirSync(reportDir, { recursive: true });
const reportPath = path.join(reportDir, "product-media-consistency-32.6.12.md");

const report = [
  "# Product Media Consistency 32.6.12",
  "",
  `Modus: ${APPLY ? "APPLY" : "AUDIT"}`,
  `Produkte mit Befund: ${findings.length}`,
  `Geänderte Produkt-MDs: ${changed.length}`,
  "",
  ...findings.flatMap((f) => [
    `## ${f.slug}`,
    "",
    `Assets: ${f.assets.join(", ")}`,
    "",
    ...f.problems.map((p) => `- ${p}`),
    ""
  ])
].join("\n");

fs.writeFileSync(reportPath, report, "utf8");

console.log(`[${PATCH}] Produkte geprüft: ${productFiles.length}`);
console.log(`[${PATCH}] Produkte mit Media-Befund: ${findings.length}`);
for (const f of findings) {
  console.log(`- ${f.slug}`);
  f.problems.forEach((p) => console.log(`  · ${p}`));
}
if (APPLY) {
  console.log(`[${PATCH}] Geänderte MDs: ${changed.length}`);
}
console.log(`[${PATCH}] Report: ${path.relative(root, reportPath)}`);
console.log(`[${PATCH}] Modus: ${APPLY ? "APPLY" : "AUDIT"}`);
