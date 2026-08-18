#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-product-data-research-batch-3-32.7.2";
const root = process.cwd();
const productDir = path.join(root, "apps/pfotentechnik/src/content/products");
const jsonCandidates = [
  path.join(root, "3", "pfotentechnik-product-data-research-batch-3.json"),
  path.join(root, "pfotentechnik-product-data-research-batch-3.json")
];

const fail = (m) => { console.error(`[${PATCH}] FEHLER: ${m}`); process.exit(1); };
const log = (m) => console.log(`[${PATCH}] ${m}`);
const q = (v) => JSON.stringify(String(v));
const norm = (v) => String(v ?? "")
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/ß/g, "ss")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const labels = {
  "uv": "UV",
  "trinkhöhe": "Trinkhöhe",
  "wasserfluss": "Wasserfluss",
  "ersatzfilter": "Ersatzfilter",
  "app": "App",
  "wlan": "WLAN",
  "bluetooth": "Bluetooth",
  "material": "Material",
  "lautstärke": "Lautstärke",
  "maße": "Maße",
  "gewicht": "Gewicht",
  "napf": "Napf"
};

const aliases = {
  "uv": ["uv","uvc"],
  "trinkhöhe": ["trinkhöhe","trinkhoehe"],
  "wasserfluss": ["wasserfluss","durchfluss"],
  "ersatzfilter": ["ersatzfilter"],
  "app": ["app","app-steuerung"],
  "wlan": ["wlan","wifi"],
  "bluetooth": ["bluetooth"],
  "material": ["material","gehäuse","gehaeuse"],
  "lautstärke": ["lautstärke","lautstaerke","geräusch","geraeusch"],
  "maße": ["maße","masse","abmessungen"],
  "gewicht": ["gewicht"],
  "napf": ["napf","napfmaterial"]
};

const manifestPath = jsonCandidates.find((p) => fs.existsSync(p));
if (!manifestPath) fail("Research-JSON fehlt im Repo-Root oder in ./3/.");

let manifest;
try { manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")); }
catch (e) { fail(`Research-JSON ungültig: ${e.message}`); }

if (manifest.schemaVersion !== 1 || manifest.batch !== "pfotentechnik-product-data-research-batch-3") {
  fail("Falscher Research-Batch.");
}

function frontmatter(source, slug) {
  if (!source.startsWith("---\n")) fail(`${slug}: Frontmatter-Start fehlt.`);
  const end = source.indexOf("\n---", 4);
  if (end < 0) fail(`${slug}: Frontmatter-Ende fehlt.`);
  return { text: source.slice(4, end), end };
}

function topBlock(lines, key) {
  const start = lines.findIndex((line) => line === `${key}:`);
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^[A-Za-z0-9_-]+:\s*(?:.*)?$/.test(lines[i]) && !/^\s/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return { start, end };
}

function specLabels(lines, range) {
  const out = [];
  for (let i = range.start + 1; i < range.end; i++) {
    let m = lines[i].match(/^\s*-\s*\{\s*label:\s*["']?([^,"'}]+)["']?\s*,/);
    if (m) { out.push(m[1].trim()); continue; }
    m = lines[i].match(/^\s*-\s*label:\s*(?:"([^"]+)"|'([^']+)'|(.+))$/);
    if (m) out.push((m[1] || m[2] || m[3]).trim());
  }
  return out;
}

function alreadyPresent(existing, field, slug) {
  // PF14 gets an explicit singular "Napf" spec even when "Näpfe" exists.
  // This avoids ambiguity in downstream field matching without altering the existing detailed spec.
  if (slug === "oneisall-2-in-1-feeder-water" && field === "napf") {
    return existing.some((x) => norm(x) === "napf");
  }
  const aa = (aliases[field] || [field]).map(norm);
  return existing.some((x) => {
    const n = norm(x);
    return aa.some((a) => n === a || n.includes(a));
  });
}

const changes = [];

for (const [slug, product] of Object.entries(manifest.products || {})) {
  const confirmed = Object.entries(product.fields || {})
    .filter(([, v]) => ["confirmed", "confirmed_absent"].includes(v.status))
    .filter(([, v]) => typeof v.value === "string" && v.value.trim());

  if (!confirmed.length) {
    log(`${slug}: keine belastbaren Ergänzungen; nicht veröffentlichte Werte bleiben unangetastet.`);
    continue;
  }

  const file = path.join(productDir, `${slug}.md`);
  if (!fs.existsSync(file)) fail(`${slug}: Produktdatei fehlt.`);

  const source = fs.readFileSync(file, "utf8");
  const { text, end } = frontmatter(source, slug);
  if (!new RegExp(`^slug:\\s*["']?${slug}["']?\\s*$`, "m").test(text)) {
    fail(`${slug}: Slug in Datei stimmt nicht.`);
  }

  const lines = text.split("\n");
  let specs = topBlock(lines, "specs");
  if (!specs) {
    lines.push("specs:");
    specs = { start: lines.length - 1, end: lines.length };
  }

  const existing = specLabels(lines, specs);
  const todo = confirmed.filter(([field]) => !alreadyPresent(existing, field, slug));

  if (!todo.length) {
    log(`${slug}: bestätigte Felder bereits vorhanden.`);
    continue;
  }

  const additions = [];
  for (const [field, value] of todo) {
    additions.push(`  - label: ${q(labels[field] || field)}`);
    additions.push(`    value: ${q(value.value)}`);
  }

  lines.splice(specs.end, 0, ...additions);
  const after = source.slice(0, 4) + lines.join("\n") + source.slice(end);
  changes.push({ slug, file, after, fields: todo.map(([f]) => f) });
}

for (const change of changes) {
  const tmp = `${change.file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, change.after, "utf8");
  fs.renameSync(tmp, change.file);
  log(`Aktualisiert: ${path.relative(root, change.file)} (${change.fields.join(", ")})`);
}

console.log("");
log(`${changes.length} Produktdatei(en) geändert. Keine .bak-Dateien angelegt.`);
console.log("Jetzt prüfen:");
console.log("  npm --workspace apps/pfotentechnik run audit:products");
console.log("  git diff -- apps/pfotentechnik/src/content/products");
