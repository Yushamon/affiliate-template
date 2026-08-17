#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-haustierkamera-media-sync-32.6.11";

const TARGETS = [
  "enabot-ebo-air-2",
  "enabot-rola-mini",
  "pettec-cam-360",
  "reolink-e1-zoom"
];

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

function extractFrontmatter(raw) {
  if (!raw.startsWith("---")) throw new Error("Markdown ohne Frontmatter.");
  const end = raw.indexOf("\n---", 3);
  if (end < 0) throw new Error("Frontmatter-Ende fehlt.");
  return {
    fm: raw.slice(4, end),
    before: raw.slice(0, 4),
    after: raw.slice(end)
  };
}

function replaceImagesBlock(raw, block) {
  const { fm, before, after } = extractFrontmatter(raw);
  const lines = fm.split(/\r?\n/);

  const start = lines.findIndex((line) => /^images:\s*$/.test(line));
  if (start < 0) throw new Error("images:-Block fehlt.");

  let end = start + 1;
  while (end < lines.length) {
    if (/^[A-Za-z_][\w-]*:/.test(lines[end])) break;
    end++;
  }

  lines.splice(start, end - start, ...block.split("\n"));
  return before + lines.join("\n") + after;
}

function altTitle(raw, fallback) {
  const m = raw.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  return m?.[1]?.replace(/^["']|["']$/g, "") || fallback;
}

const root = findRoot(process.cwd());
const app = path.join(root, "apps", "pfotentechnik");
const productDir = path.join(app, "src", "content", "products");
const assetsBase = path.join(app, "src", "assets", "images", "products");

const changed = [];
const results = [];

for (const slug of TARGETS) {
  const mdPath = path.join(productDir, `${slug}.md`);
  const assetDir = path.join(assetsBase, slug);

  if (!fs.existsSync(mdPath)) {
    results.push({ slug, status: "skip", reason: "Produkt-MD fehlt" });
    continue;
  }
  if (!fs.existsSync(assetDir)) {
    results.push({ slug, status: "skip", reason: "Asset-Ordner fehlt" });
    continue;
  }

  const files = fs.readdirSync(assetDir)
    .filter((name) => name.toLowerCase().endsWith(".webp"))
    .sort((a, b) => a.localeCompare(b, "de", { numeric: true }));

  const has = (name) => files.includes(name);
  const galleries = files
    .filter((name) => /^gallery-\d+\.webp$/.test(name))
    .sort((a, b) => {
      const na = Number(a.match(/\d+/)?.[0] ?? 0);
      const nb = Number(b.match(/\d+/)?.[0] ?? 0);
      return na - nb;
    });

  if (!has("hero.webp")) {
    results.push({ slug, status: "skip", reason: "hero.webp fehlt", files });
    continue;
  }

  const raw = fs.readFileSync(mdPath, "utf8");
  const title = altTitle(raw, slug);

  const lines = [
    "images:",
    `  hero:`,
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
  } else if (has("thumbnail.webp")) {
    // Do not invent a nonexistent file. Comparison VM will fall back to thumbnail.
  } else {
    // With hero only, Comparison VM safely falls back to hero.
  }

  if (galleries.length) {
    lines.push("  gallery:");
    for (let i = 0; i < galleries.length; i++) {
      const file = galleries[i];
      lines.push(
        `    - src: "../../assets/images/products/${slug}/${file}"`,
        `      alt: "${title} – Produktansicht ${i + 1}"`
      );
    }
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

  results.push({
    slug,
    status: "ok",
    files,
    comparisonSource: has("comparison.webp")
      ? "comparison.webp"
      : has("thumbnail.webp")
        ? "thumbnail.webp fallback"
        : "hero.webp fallback",
    galleries
  });
}

const reportDir = path.join(app, "reports", "media");
fs.mkdirSync(reportDir, { recursive: true });
const reportPath = path.join(reportDir, "haustierkamera-media-sync-32.6.11.md");

const report = [
  "# Haustierkamera Media Sync 32.6.11",
  "",
  "## Regel",
  "",
  "Die Produkt-MD wird ausschließlich aus tatsächlich vorhandenen WebP-Dateien",
  "im jeweiligen Produktordner synchronisiert.",
  "",
  "- hero.webp → images.hero",
  "- thumbnail.webp → images.thumbnail, falls vorhanden",
  "- comparison.webp → images.comparison, falls vorhanden",
  "- gallery-N.webp → images.gallery, numerisch sortiert",
  "- keine nicht existierenden Bildpfade werden erfunden",
  "- wenn comparison.webp fehlt, nutzt die bestehende Comparison Engine weiterhin",
  "  thumbnail bzw. hero als Fallback",
  "",
  "## Ergebnis",
  "",
  ...results.flatMap((r) => [
    `### ${r.slug}`,
    "",
    `- Status: ${r.status}`,
    ...(r.reason ? [`- Grund: ${r.reason}`] : []),
    ...(r.comparisonSource ? [`- Vergleichsbild: ${r.comparisonSource}`] : []),
    ...(r.files ? [`- Dateien: ${r.files.join(", ") || "keine"}`] : []),
    ""
  ])
].join("\n");

fs.writeFileSync(reportPath, report, "utf8");

console.log(`[${PATCH}] Geänderte Produkt-MDs: ${changed.length}`);
changed.forEach((file) => console.log(`- ${file}`));
console.log(`[${PATCH}]`);
for (const r of results) {
  console.log(`[${PATCH}] ${r.slug}: ${r.status}${r.comparisonSource ? ` · ${r.comparisonSource}` : ""}`);
  if (r.files) console.log(`  Assets: ${r.files.join(", ") || "(keine)"}`);
}
console.log(`[${PATCH}] Report: ${path.relative(root, reportPath)}`);
console.log(`[${PATCH}] Fertig.`);
