#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const TOOL = "pfotentechnik-comparison-selection-audit-32.6.0";

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "package.json")) &&
        fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`[${TOOL}] Repository-Root nicht gefunden.`);
}

function frontmatter(raw) {
  if (!raw.startsWith("---")) return "";
  const end = raw.indexOf("\n---", 3);
  return end < 0 ? "" : raw.slice(3, end);
}

function scalar(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+?)["']?\\s*$`, "m"));
  return m ? m[1].trim() : "";
}

function inlineValue(fm, key, nestedKey) {
  const line = fm.split(/\r?\n/).find(l => new RegExp(`^${key}:\\s*\\{`).test(l));
  if (!line) return "";
  const m = line.match(new RegExp(`${nestedKey}:\\s*["']([^"']+)["']`));
  return m?.[1] ?? "";
}

function extractArrayBlock(fm, key) {
  const lines = fm.split(/\r?\n/);
  const start = lines.findIndex(l => new RegExp(`^${key}:\\s*$`).test(l));
  if (start < 0) return [];
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^[A-Za-z_][\w-]*:/.test(line)) break;
    const m = line.match(/^\s*-\s*["']?([^"'#\n]+?)["']?\s*$/);
    if (m) out.push(m[1].trim());
  }
  return out;
}

function extractComparisonItems(fm) {
  const lines = fm.split(/\r?\n/);
  const start = lines.findIndex(l => /^items:\s*$/.test(l));
  if (start < 0) return [];
  const items = [];
  let current = null;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^[A-Za-z_][\w-]*:/.test(line)) break;
    const slug = line.match(/^\s*-\s*slug:\s*["']?([^"'#\n]+)["']?\s*$/);
    if (slug) {
      current = { slug: slug[1].trim(), type: "product" };
      items.push(current);
      continue;
    }
    if (current) {
      const type = line.match(/^\s+type:\s*["']?([^"'#\n]+)["']?\s*$/);
      if (type) current.type = type[1].trim();
    }
  }
  return items;
}

function extractInlineComparisons(fm) {
  const m = fm.match(/^comparisons:\s*\[([^\]]*)\]/m);
  if (m) return [...m[1].matchAll(/["']([^"']+)["']/g)].map(x => x[1]);
  return extractArrayBlock(fm, "comparisons");
}

function productMeta(file) {
  const fm = frontmatter(fs.readFileSync(file, "utf8"));
  const slug = scalar(fm, "slug");
  const title = scalar(fm, "title");
  let category = inlineValue(fm, "category", "key");
  if (!category) {
    const lines = fm.split(/\r?\n/);
    const i = lines.findIndex(l => /^category:\s*$/.test(l));
    if (i >= 0) {
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const m = lines[j].match(/^\s+key:\s*["']?([^"'#\n]+)["']?/);
        if (m) { category = m[1].trim(); break; }
        if (/^[A-Za-z_][\w-]*:/.test(lines[j])) break;
      }
    }
  }

  const lines = fm.split(/\r?\n/);
  const inlineFilter = lines.find(l => /^comparisonFilters:\s*\{/.test(l));
  let filterBlock = inlineFilter ?? "";
  if (!filterBlock) {
    const i = lines.findIndex(l => /^comparisonFilters:\s*$/.test(l));
    if (i >= 0) {
      const acc = [];
      for (let j = i + 1; j < lines.length; j++) {
        if (/^[A-Za-z_][\w-]*:/.test(lines[j])) break;
        acc.push(lines[j]);
      }
      filterBlock = acc.join("\n");
    }
  }

  const bool = (name) => {
    const m = filterBlock.match(new RegExp(`${name}:\\s*(true|false)`));
    return m ? m[1] === "true" : undefined;
  };
  const arr = (name) => {
    const m = filterBlock.match(new RegExp(`${name}:\\s*\\[([^\\]]*)\\]`));
    return m ? [...m[1].matchAll(/["']([^"']+)["']/g)].map(x => x[1]) : [];
  };

  return {
    slug, title, category,
    comparisons: extractInlineComparisons(fm),
    filters: {
      animal: arr("animal"),
      petSize: arr("petSize"),
      foodType: arr("foodType"),
      app: bool("app"),
      camera: bool("camera"),
      backupPower: bool("backupPower")
    }
  };
}

function inferSelection(slug, title) {
  const s = `${slug} ${title}`.toLowerCase();

  if (s.includes("haustierkamera"))
    return { confidence: "high", category: "haustierkameras", require: {}, semantic: false };
  if (s.includes("trinkbrunnen"))
    return { confidence: "medium", category: "trinkbrunnen", require: {}, semantic: true };
  if (s.includes("katzenklapp"))
    return { confidence: "medium", category: "katzenklappen", require: {}, semantic: true };
  if (s.includes("gps") || s.includes("tracker"))
    return { confidence: "medium", category: "gps-tracker", require: {}, semantic: true };
  if (s.includes("katzenklo") || s.includes("katzentoilet"))
    return { confidence: "medium", category: "katzentoiletten", require: {}, semantic: true };

  if (s.includes("futterautomat")) {
    const require = {};
    let semantic = false;
    if (s.includes("mit-kamera") || /\bkamera\b/.test(s)) require.camera = true;
    if (s.includes("nassfutter")) require.foodType = ["wet"];
    if (s.includes("fuer-katzen") || s.includes("für-katzen")) require.animal = ["cat"];
    if (s.includes("fuer-hunde") || s.includes("für-hunde")) require.animal = ["dog"];
    if (s.includes("mit-akku")) require.backupPower = true;
    if (/ohne-wlan|zwei-katzen|mehrtier|berufstaet|senior|welpen|kleine-hunde|edelstahl|unter-100|schling|portion|app\b/.test(s)) semantic = true;
    return { confidence: semantic ? "medium" : "high", category: "futterautomaten", require, semantic };
  }

  return { confidence: "unknown", category: "", require: {}, semantic: true };
}

function matches(product, selection) {
  if (selection.category && product.category !== selection.category) return false;
  const r = selection.require || {};
  if (typeof r.camera === "boolean" && product.filters.camera !== r.camera) return false;
  if (typeof r.backupPower === "boolean" && product.filters.backupPower !== r.backupPower) return false;
  if (Array.isArray(r.foodType) && !r.foodType.every(v => product.filters.foodType.includes(v))) return false;
  if (Array.isArray(r.animal) && !r.animal.every(v => product.filters.animal.includes(v))) return false;
  return true;
}

const root = findRoot(process.cwd());
const app = path.join(root, "apps", "pfotentechnik");
const comparisonDir = path.join(app, "src", "content", "comparisons");
const productDir = path.join(app, "src", "content", "products");
const reportDir = path.join(app, "reports", "comparison-selection");
fs.mkdirSync(reportDir, { recursive: true });

const products = fs.readdirSync(productDir)
  .filter(f => f.endsWith(".md") && !f.includes(".bak"))
  .map(f => productMeta(path.join(productDir, f)))
  .filter(p => p.slug);

const productBySlug = new Map(products.map(p => [p.slug, p]));

const comparisons = fs.readdirSync(comparisonDir)
  .filter(f => f.endsWith(".md") && !f.includes(".bak"))
  .map(file => {
    const fm = frontmatter(fs.readFileSync(path.join(comparisonDir, file), "utf8"));
    const slug = scalar(fm, "slug") || path.basename(file, ".md");
    const title = scalar(fm, "title") || slug;
    const explicit = extractComparisonItems(fm).filter(i => i.type === "product").map(i => i.slug);
    const selection = inferSelection(slug, title);
    const autoCandidates = products.filter(p => matches(p, selection)).map(p => p.slug).sort();
    const backlinkCandidates = products.filter(p => p.comparisons.includes(slug)).map(p => p.slug).sort();

    return {
      slug, title, selection, explicit, autoCandidates, backlinkCandidates,
      missingFromExplicit: autoCandidates.filter(s => !explicit.includes(s)),
      explicitOutsideRule: explicit.filter(s => !autoCandidates.includes(s)),
      backlinkMissing: backlinkCandidates.filter(s => !explicit.includes(s)),
      explicitWithoutBacklink: explicit.filter(s => {
        const p = productBySlug.get(s);
        return p && !p.comparisons.includes(slug);
      })
    };
  });

const generatedAt = new Date().toISOString();
fs.writeFileSync(
  path.join(reportDir, "comparison-selection-audit.json"),
  JSON.stringify({ generatedAt, products: products.length, comparisons }, null, 2)
);

const lines = [
  "# Comparison Selection Audit",
  "",
  `Erstellt: ${generatedAt}`,
  "",
  `- Produkte: ${products.length}`,
  `- Vergleiche: ${comparisons.length}`,
  "",
  "## Übersicht",
  "",
  "| Vergleich | Regel | Explizit | Auto | Backlinks | Drift | Semantik nötig |",
  "|---|---|---:|---:|---:|---:|---:|"
];

for (const c of comparisons) {
  const req = Object.keys(c.selection.require).length
    ? Object.entries(c.selection.require).map(([k,v]) => `${k}=${Array.isArray(v) ? v.join("+") : v}`).join(", ")
    : "Kategorie";
  const rule = c.selection.category ? `${c.selection.category}: ${req}` : "unklar";
  const driftCount = new Set([...c.missingFromExplicit, ...c.backlinkMissing, ...c.explicitWithoutBacklink]).size;
  lines.push(`| ${c.slug} | ${rule} | ${c.explicit.length} | ${c.autoCandidates.length} | ${c.backlinkCandidates.length} | ${driftCount} | ${c.selection.semantic ? "ja" : "nein"} |`);
}

lines.push("", "## Details", "");

for (const c of comparisons) {
  lines.push(`### ${c.slug}`, "");
  lines.push(`- Titel: ${c.title}`);
  lines.push(`- Heuristik: ${c.selection.category || "unklar"} · Confidence ${c.selection.confidence} · zusätzliche Semantik: ${c.selection.semantic ? "ja" : "nein"}`);
  lines.push(`- Explizite items: ${c.explicit.length ? c.explicit.join(", ") : "keine"}`);
  lines.push(`- Produkt-Backlinks via comparisons[]: ${c.backlinkCandidates.length ? c.backlinkCandidates.join(", ") : "keine"}`);
  lines.push(`- Automatisch passende Kandidaten: ${c.autoCandidates.length ? c.autoCandidates.join(", ") : "keine"}`);
  if (c.backlinkMissing.length) lines.push(`- **Backlink vorhanden, aber nicht in items:** ${c.backlinkMissing.join(", ")}`);
  if (c.explicitWithoutBacklink.length) lines.push(`- **In items, aber Produkt verweist nicht zurück:** ${c.explicitWithoutBacklink.join(", ")}`);
  if (c.missingFromExplicit.length) lines.push(`- **Nach einfacher Selection-Regel zusätzlich passend:** ${c.missingFromExplicit.join(", ")}`);
  if (c.explicitOutsideRule.length) lines.push(`- **Explizit enthalten, aber außerhalb der einfachen Selection-Regel:** ${c.explicitOutsideRule.join(", ")}`);
  lines.push("");
}

lines.push(
  "## Interpretation",
  "",
  "- `Backlink vorhanden, aber nicht in items` ist der Furbo-Typ: Produkt beansprucht die Comparison, die kuratierte Liste enthält es aber nicht.",
  "- `Nach einfacher Selection-Regel zusätzlich passend` ist nur bei Vergleichen mit hoher/überschaubarer Regel-Confidence direkt automatisierbar.",
  "- `Semantik nötig: ja` bedeutet: vorhandene comparisonFilters reichen für diesen Intent wahrscheinlich nicht aus.",
  "- Der Audit verändert keine Content-Dateien."
);

fs.writeFileSync(path.join(reportDir, "comparison-selection-audit.md"), lines.join("\n"));

console.log(`[${TOOL}] Produkte: ${products.length}`);
console.log(`[${TOOL}] Vergleiche: ${comparisons.length}`);
console.log(`[${TOOL}] Report: ${path.relative(root, path.join(reportDir, "comparison-selection-audit.md"))}`);
console.log(`[${TOOL}] JSON: ${path.relative(root, path.join(reportDir, "comparison-selection-audit.json"))}`);

const cameras = comparisons.find(c => c.slug === "beste-haustierkameras");
if (cameras) {
  console.log(`[${TOOL}] beste-haustierkameras`);
  console.log(`  explicit: ${cameras.explicit.join(", ") || "keine"}`);
  console.log(`  backlinks: ${cameras.backlinkCandidates.join(", ") || "keine"}`);
  console.log(`  fehlend in items: ${cameras.backlinkMissing.join(", ") || "keine"}`);
}
