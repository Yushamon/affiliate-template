#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-external-evidence-schema-canonicalization-33.8.28";
const ALLOWED_METHODS = new Set(["hands-on", "lab-test", "editorial-review", "unknown"]);

function findRoot(start) {
  let dir = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
    dir = parent;
  }
}

const root = findRoot(process.cwd());
const productsDir = path.join(root, "apps", "pfotentechnik", "src", "content", "products");
const schemaFile = path.join(root, "apps", "pfotentechnik", "src", "content", "schema", "product.ts");
const testDir = path.join(root, "apps", "pfotentechnik", "test");
const testFile = path.join(testDir, "external-evidence-schema-canonicalization-33.8.28.test.mjs");

function exec(label, cmd, args, { fatal = true } = {}) {
  console.log(`[${PATCH}] Prüfe: ${label}`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (r.status !== 0) {
    if (fatal) throw new Error(`${label} fehlgeschlagen (Exit ${r.status ?? "?"})`);
    console.error(`[${PATCH}] ${label}: FEHLER (Exit ${r.status ?? "?"})`);
    return false;
  }
  console.log(`[${PATCH}] BESTANDEN: ${label}`);
  return true;
}

function frontmatterBounds(text) {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  return end < 0 ? null : { start: 4, end };
}

function unquote(value) {
  const v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) return v.slice(1, -1);
  return v;
}

function quote(value) {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function canonicalMethodology(value) {
  const raw = unquote(value).trim();
  if (!raw) return "unknown";
  if (ALLOWED_METHODS.has(raw)) return raw;

  const n = raw.toLowerCase().replaceAll("_", "-");
  if (n.includes("lab")) return "lab-test";
  if (
    n.includes("hands-on") ||
    n.includes("hands on") ||
    n.includes("practical") ||
    n.includes("field-test") ||
    n.includes("field test")
  ) return "hands-on";
  if (n === "unknown" || n.includes("unknown")) return "unknown";

  // Research-led reviews, magazine summaries, editorial analyses and other
  // non-hands-on professional review labels are editorial-review by schema.
  return "editorial-review";
}

function normalizeFile(text, filename) {
  const bounds = frontmatterBounds(text);
  if (!bounds) return { text, changes: [] };

  const fm = text.slice(bounds.start, bounds.end);
  const lines = fm.split("\n");
  const changes = [];

  let inExternalEvidence = false;
  let inProfessionalReviews = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^externalEvidence:\s*$/.test(line)) {
      inExternalEvidence = true;
      inProfessionalReviews = false;
      continue;
    }

    if (inExternalEvidence && /^[A-Za-z0-9_][A-Za-z0-9_-]*:\s*/.test(line)) {
      inExternalEvidence = false;
      inProfessionalReviews = false;
    }

    if (!inExternalEvidence) continue;

    if (/^  professionalReviews:\s*$/.test(line) || /^  professionalReviews:\s*\[\s*\]\s*$/.test(line)) {
      inProfessionalReviews = !/\[\s*\]/.test(line);
      continue;
    }

    // A sibling at two spaces ends professionalReviews.
    if (inProfessionalReviews && /^  [A-Za-z0-9_][A-Za-z0-9_-]*:\s*/.test(line)) {
      inProfessionalReviews = false;
    }

    if (inProfessionalReviews) {
      const m = line.match(/^(\s{6}methodology:\s*)(.+?)\s*$/);
      if (m) {
        const oldRaw = unquote(m[2]);
        const canonical = canonicalMethodology(m[2]);
        if (oldRaw !== canonical) {
          lines[i] = `${m[1]}${quote(canonical)}`;
          changes.push(`${filename}: methodology ${oldRaw} -> ${canonical}`);
        }
      }
    }

    // Normalize only empty placeholder forms. Non-empty invalid arrays are
    // deliberately not invented into a consensus object.
    if (/^  consensus:\s*\[\s*\]\s*(?:#.*)?$/.test(lines[i])) {
      lines.splice(i, 1, "  consensus:", "    strengths: []", "    weaknesses: []");
      changes.push(`${filename}: consensus [] -> canonical object`);
      i += 2;
      continue;
    }

    if (/^  consensus:\s*(?:null|~)\s*(?:#.*)?$/.test(lines[i])) {
      lines.splice(i, 1, "  consensus:", "    strengths: []", "    weaknesses: []");
      changes.push(`${filename}: consensus null -> canonical object`);
      i += 2;
      continue;
    }

    if (/^  consensus:\s*\{\s*\}\s*(?:#.*)?$/.test(lines[i])) {
      lines.splice(i, 1, "  consensus:", "    strengths: []", "    weaknesses: []");
      changes.push(`${filename}: consensus {} -> canonical object`);
      i += 2;
    }
  }

  return {
    text: text.slice(0, bounds.start) + lines.join("\n") + text.slice(bounds.end),
    changes
  };
}

if (!fs.existsSync(productsDir)) throw new Error(`[${PATCH}] Produktordner fehlt.`);
if (!fs.existsSync(schemaFile)) throw new Error(`[${PATCH}] Produktschema fehlt.`);

const schema = fs.readFileSync(schemaFile, "utf8");
if (!/methodology:\s*z\.enum\(\["hands-on","lab-test","editorial-review","unknown"\]\)/.test(schema)) {
  throw new Error(`[${PATCH}] Erwartetes methodology-Schema nicht gefunden. Patch abgebrochen.`);
}
if (!/consensus:\s*z\.object\(\{/.test(schema) ||
    !/strengths:\s*z\.array/.test(schema) ||
    !/weaknesses:\s*z\.array/.test(schema)) {
  throw new Error(`[${PATCH}] Erwartetes consensus-Schema nicht gefunden. Patch abgebrochen.`);
}

const files = fs.readdirSync(productsDir).filter(f => f.endsWith(".md")).sort();
const changed = [];
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(root, ".patch-backups", `${PATCH}-${stamp}`);

for (const filename of files) {
  const file = path.join(productsDir, filename);
  const before = fs.readFileSync(file, "utf8");
  const result = normalizeFile(before, filename);
  if (result.changes.length) {
    changed.push({ file, filename, before, after: result.text, changes: result.changes });
  }
}

fs.mkdirSync(backupDir, { recursive: true });

for (const item of changed) {
  const backup = path.join(
    backupDir, "apps", "pfotentechnik", "src", "content", "products", item.filename
  );
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.writeFileSync(backup, item.before);
  fs.writeFileSync(item.file, item.after);
  for (const c of item.changes) console.log(`[${PATCH}] ${c}`);
}

fs.mkdirSync(testDir, { recursive: true });
const testSource = String.raw`import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const productsDir = path.join(root, "apps", "pfotentechnik", "src", "content", "products");
const allowed = new Set(["hands-on", "lab-test", "editorial-review", "unknown"]);

function fm(text) {
  if (!text.startsWith("---\n")) return "";
  const end = text.indexOf("\n---", 4);
  return end < 0 ? "" : text.slice(4, end);
}

test("professionalReviews verwenden ausschließlich schema-konforme methodology-Werte", () => {
  const invalid = [];
  for (const filename of fs.readdirSync(productsDir).filter(f => f.endsWith(".md"))) {
    const lines = fm(fs.readFileSync(path.join(productsDir, filename), "utf8")).split("\n");
    let inExternal = false;
    let inProfessional = false;
    for (const line of lines) {
      if (/^externalEvidence:\s*$/.test(line)) { inExternal = true; inProfessional = false; continue; }
      if (inExternal && /^[A-Za-z0-9_][A-Za-z0-9_-]*:\s*/.test(line)) { inExternal = false; inProfessional = false; }
      if (!inExternal) continue;
      if (/^  professionalReviews:\s*$/.test(line)) { inProfessional = true; continue; }
      if (/^  professionalReviews:\s*\[\s*\]\s*$/.test(line)) { inProfessional = false; continue; }
      if (inProfessional && /^  [A-Za-z0-9_][A-Za-z0-9_-]*:\s*/.test(line)) inProfessional = false;
      if (!inProfessional) continue;
      const m = line.match(/^\s{6}methodology:\s*["']?([^"']+)["']?\s*$/);
      if (m && !allowed.has(m[1].trim())) invalid.push(filename + ": " + m[1].trim());
    }
  }
  assert.deepEqual(invalid, []);
});

test("externalEvidence.consensus verwendet keine leeren Array/null/Object-Platzhalter", () => {
  const invalid = [];
  for (const filename of fs.readdirSync(productsDir).filter(f => f.endsWith(".md"))) {
    const text = fm(fs.readFileSync(path.join(productsDir, filename), "utf8"));
    if (/^  consensus:\s*\[\s*\]\s*$/m.test(text)) invalid.push(filename + ": []");
    if (/^  consensus:\s*(?:null|~)\s*$/m.test(text)) invalid.push(filename + ": null");
    if (/^  consensus:\s*\{\s*\}\s*$/m.test(text)) invalid.push(filename + ": {}");
  }
  assert.deepEqual(invalid, []);
});

test("Aqara C1 ist schema-konform normalisiert", () => {
  const text = fs.readFileSync(path.join(productsDir, "aqara-smart-pet-feeder-c1.md"), "utf8");
  assert.doesNotMatch(text, /professional-magazine-review-summary/);
  assert.match(text, /methodology:\s*"editorial-review"/);
});

test("Cat Mate 335 besitzt kanonisches leeres consensus-Objekt", () => {
  const text = fs.readFileSync(path.join(productsDir, "cat-mate-335-pet-fountain.md"), "utf8");
  assert.match(text, /externalEvidence:[\s\S]*?\n  consensus:\n    strengths: \[\]\n    weaknesses: \[\]/);
});

test("redaktionelle Ratings und Scores bleiben erhalten", () => {
  for (const filename of ["aqara-smart-pet-feeder-c1.md", "cat-mate-335-pet-fountain.md"]) {
    const text = fs.readFileSync(path.join(productsDir, filename), "utf8");
    assert.match(text, /^rating:\s*[0-9.]+\s*$/m);
    assert.match(text, /^score:\s*[0-9.]+\s*$/m);
    assert.match(text, /^ratings:\s*$/m);
  }
});
`;
fs.writeFileSync(testFile, testSource);
console.log(`[${PATCH}] Regressionstest geschrieben: ${path.relative(root, testFile)}`);

try {
  exec("Test-Syntax", process.execPath, ["--check", testFile]);
  exec("Regressionstest", process.execPath, ["--test", testFile]);
  exec("Evidence-Audit", "npm", ["--workspace", "apps/pfotentechnik", "run", "audit:product-evidence"]);
} catch (err) {
  for (const item of changed) fs.writeFileSync(item.file, item.before);
  console.error(`[${PATCH}] FEHLER vor Build: ${err.message}`);
  console.error(`[${PATCH}] Eigene Produkt-MD-Änderungen wurden zurückgerollt.`);
  process.exit(1);
}

// Important: schema-compatible normalizations are intentionally kept if
// Astro now exposes a DIFFERENT downstream content-schema blocker.
const buildOk = exec(
  "Astro-Build",
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "build"],
  { fatal: false }
);

if (!buildOk) {
  console.error(`[${PATCH}] Der Build zeigt noch einen nachgelagerten Blocker.`);
  console.error(`[${PATCH}] Die hier validierten Methodology-/Consensus-Normalisierungen bleiben bewusst erhalten.`);
  console.error(`[${PATCH}] Backup: ${path.relative(root, backupDir)}`);
  process.exit(2);
}

console.log(`[${PATCH}] Abgeschlossen. Geänderte Produkt-MDs: ${changed.length}`);
console.log(`[${PATCH}] Backup: ${path.relative(root, backupDir)}`);
