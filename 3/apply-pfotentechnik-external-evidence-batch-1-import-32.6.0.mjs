#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-external-evidence-batch-1-import-32.6.0";
const root = process.cwd();
const productDir = path.join(root, "apps/pfotentechnik/src/content/products");
const batch = "pfotentechnik-external-evidence-batch-1";
const slugs = [
  "feelneedy-fn-w18-8l-katzenbrunnen",
  "petlibro-luma-smart-litter-box",
  "enabot-rola-mini",
  "furbo-mini-360",
  "petlibro-space-smart-feeder",
  "cat-mate-335-pet-fountain",
  "petwalk-medium-tiertuer",
  "petlibro-granary-2-vision"
];

const fail = (m) => { console.error(`[${PATCH}] FEHLER: ${m}`); process.exit(1); };
const log = (m) => console.log(`[${PATCH}] ${m}`);
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

function findManifest() {
  for (const p of [
    path.join(root, "pfotentechnik-external-evidence-batch-1.json"),
    path.join(root, "3", "pfotentechnik-external-evidence-batch-1.json")
  ]) if (fs.existsSync(p)) return p;
  fail("Research-Datei pfotentechnik-external-evidence-batch-1.json fehlt im Repo-Root oder in ./3/");
}

function validateUrl(url, label) {
  if (typeof url !== "string" || !/^https:\/\/\S+$/i.test(url)) fail(`${label}: ungültige URL`);
}

function validate(slug, e) {
  if (!isObj(e)) fail(`${slug}: externalEvidence fehlt`);
  if (!Array.isArray(e.professionalReviews) || !Array.isArray(e.userReviews)) fail(`${slug}: Review-Arrays fehlen`);
  for (const [i, r] of e.professionalReviews.entries()) {
    if (!isObj(r) || !r.publisher || !r.title || !r.checkedAt || !r.methodology) fail(`${slug}: professionalReviews[${i}] unvollständig`);
    validateUrl(r.url, `${slug}: professionalReviews[${i}].url`);
  }
  for (const [i, r] of e.userReviews.entries()) {
    if (!isObj(r) || !r.platform || !r.checkedAt || !["product-specific","brand-wide"].includes(r.scope)) fail(`${slug}: userReviews[${i}] unvollständig`);
    validateUrl(r.url, `${slug}: userReviews[${i}].url`);
  }
  if (!isObj(e.consensus) || !Array.isArray(e.consensus.strengths) || !Array.isArray(e.consensus.weaknesses)) fail(`${slug}: consensus ungültig`);
  if (typeof e.consensus.editorialAssessment !== "string" || e.consensus.editorialAssessment.trim().length < 20) fail(`${slug}: editorialAssessment fehlt`);
  if (typeof e.note !== "string" || e.note.trim().length < 15) fail(`${slug}: note fehlt`);
}

const scalar = (v) => v === null ? "null" : typeof v === "number" || typeof v === "boolean" ? String(v) : JSON.stringify(String(v));

function yaml(value, indent = 0) {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (!value.length) return [`${pad}[]`];
    const out = [];
    for (const item of value) {
      if (!isObj(item)) { out.push(`${pad}- ${scalar(item)}`); continue; }
      const entries = Object.entries(item).filter(([,v]) => v !== undefined);
      const [fk, fv] = entries[0];
      if (Array.isArray(fv) || isObj(fv)) {
        out.push(`${pad}- ${fk}:`);
        out.push(...yaml(fv, indent + 4));
      } else out.push(`${pad}- ${fk}: ${scalar(fv)}`);
      for (const [k,v] of entries.slice(1)) {
        const p2 = " ".repeat(indent + 2);
        if (Array.isArray(v)) {
          if (!v.length) out.push(`${p2}${k}: []`);
          else { out.push(`${p2}${k}:`); out.push(...yaml(v, indent + 4)); }
        } else if (isObj(v)) {
          out.push(`${p2}${k}:`);
          out.push(...yaml(v, indent + 4));
        } else out.push(`${p2}${k}: ${scalar(v)}`);
      }
    }
    return out;
  }
  if (isObj(value)) {
    const out = [];
    for (const [k,v] of Object.entries(value)) {
      if (Array.isArray(v)) {
        if (!v.length) out.push(`${pad}${k}: []`);
        else { out.push(`${pad}${k}:`); out.push(...yaml(v, indent + 2)); }
      } else if (isObj(v)) {
        out.push(`${pad}${k}:`);
        out.push(...yaml(v, indent + 2));
      } else out.push(`${pad}${k}: ${scalar(v)}`);
    }
    return out;
  }
  return [`${pad}${scalar(value)}`];
}

function patchFrontmatter(source, slug, evidence) {
  if (!source.startsWith("---\n")) fail(`${slug}: Frontmatter-Start fehlt`);
  const end = source.indexOf("\n---", 4);
  if (end < 0) fail(`${slug}: Frontmatter-Ende fehlt`);
  const fm = source.slice(4, end);
  const lines = fm.split("\n");
  const replacement = ["externalEvidence:", ...yaml(evidence, 2)];

  let start = lines.findIndex(l => l === "externalEvidence:");
  if (start >= 0) {
    let stop = lines.length;
    for (let i = start + 1; i < lines.length; i++) {
      if (/^[A-Za-z0-9_-]+:\s*(?:.*)?$/.test(lines[i]) && !/^\s/.test(lines[i])) { stop = i; break; }
    }
    lines.splice(start, stop - start, ...replacement);
  } else {
    if (lines.at(-1) !== "") lines.push("");
    lines.push(...replacement);
  }
  return source.slice(0,4) + lines.join("\n") + source.slice(end);
}

const manifestPath = findManifest();
let manifest;
try { manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")); }
catch (e) { fail(`Research-Datei ist kein valides JSON: ${e.message}`); }

if (manifest.schemaVersion !== 1 || manifest.batch !== batch || !isObj(manifest.products)) fail("Schema/Batch der Research-Datei passt nicht");

const got = Object.keys(manifest.products).sort();
const want = [...slugs].sort();
if (JSON.stringify(got) !== JSON.stringify(want)) fail("Research-Datei muss exakt die acht erwarteten Slugs enthalten");

const changes = [];
for (const slug of slugs) {
  const evidence = manifest.products[slug]?.externalEvidence;
  validate(slug, evidence);
  const file = path.join(productDir, `${slug}.md`);
  if (!fs.existsSync(file)) fail(`${slug}: Produktdatei fehlt`);
  const before = fs.readFileSync(file, "utf8");
  if (!new RegExp(`^slug:\\s*["']?${slug}["']?\\s*$`, "m").test(before)) fail(`${slug}: Slug in Datei stimmt nicht`);
  const after = patchFrontmatter(before, slug, evidence);
  if (after !== before) changes.push({file, after, slug});
}

for (const c of changes) {
  const tmp = `${c.file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, c.after, "utf8");
  fs.renameSync(tmp, c.file);
  log(`Aktualisiert: ${path.relative(root, c.file)}`);
}

log(`${changes.length} Produktdatei(en) aktualisiert. Keine .bak-Dateien angelegt.`);
console.log("");
console.log("Jetzt prüfen:");
console.log("  npm --workspace apps/pfotentechnik run audit:product-evidence");
console.log("  npm --workspace apps/pfotentechnik run audit:products");
console.log("  git diff -- apps/pfotentechnik/src/content/products");
