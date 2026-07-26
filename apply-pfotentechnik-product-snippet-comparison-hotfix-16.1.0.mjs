#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PATCH = "pfotentechnik-product-snippet-comparison-hotfix-16.1.0";
const CHECK = process.argv.includes("--check");

function repoRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i += 1) {
    if (
      fs.existsSync(path.join(dir, "apps", "pfotentechnik")) &&
      fs.existsSync(path.join(dir, "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Root nicht gefunden.");
}

const root = repoRoot(process.cwd());
const app = path.join(root, "apps", "pfotentechnik");
const page = path.join(app, "src", "pages", "vergleiche", "[comparison].astro");
const pkgJson = path.join(app, "package.json");
const audit = path.join(app, "scripts", "seo", "audit-comparison-product-schema.mjs");
const changes = new Map();

const normalize = (s) => String(s).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
const rel = (f) => path.relative(root, f).replaceAll("\\", "/");

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Datei fehlt: ${rel(file)}`);
  return normalize(fs.readFileSync(file, "utf8"));
}

function stage(file, next) {
  const old = fs.existsSync(file) ? read(file) : null;
  next = normalize(next);
  if (old !== next) changes.set(file, { old, next });
}

function patchComparison(source) {
  const good = `  itemListElement: model.products.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: new URL(product.href, Astro.site ?? Astro.url).href
  }))
};`;

  if (source.includes(good)) return source;

  const bad = `  itemListElement: model.products.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Product",
      name: product.title,
      url: new URL(product.href, Astro.site ?? Astro.url).href
    }
  }))
};`;

  if (!source.includes(bad)) {
    throw new Error("Unvollständiger Product-Block nicht gefunden.");
  }

  return source.replace(
    bad,
    `  // Übersichtsseite: vollständige Product-Daten stehen auf den Produktseiten.
${good}`
  );
}

const patched = patchComparison(read(page));
const schema = patched.match(/const comparisonItemListSchema = \{[\s\S]*?\n\};/)?.[0] ?? "";
if (!schema) throw new Error("comparisonItemListSchema fehlt.");
if (schema.includes('"@type": "Product"') || schema.includes("item: {")) {
  throw new Error("Unvollständiges Product-Objekt ist noch vorhanden.");
}
if (!schema.includes("url: new URL(product.href, Astro.site ?? Astro.url).href")) {
  throw new Error("Direkte ListItem-URL fehlt.");
}
stage(page, patched);

const auditSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "../..");
const sourceFile = path.join(app, "src", "pages", "vergleiche", "[comparison].astro");
const source = fs.readFileSync(sourceFile, "utf8").replace(/^\\uFEFF/, "").replace(/\\r\\n?/g, "\\n");
const schema = source.match(/const comparisonItemListSchema = \\{[\\s\\S]*?\\n\\};/)?.[0] ?? "";
const errors = [];

if (!schema) errors.push("comparisonItemListSchema fehlt.");
if (schema.includes('"@type": "Product"') || schema.includes("item: {")) {
  errors.push("Vergleichs-ItemList enthält unvollständige Product-Objekte.");
}
if (!schema.includes('"@type": "ListItem"') ||
    !schema.includes("url: new URL(product.href, Astro.site ?? Astro.url).href")) {
  errors.push("ListItem benötigt position und direkte Produkt-URL.");
}

function htmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(target);
    return entry.isFile() && entry.name.endsWith(".html") ? [target] : [];
  });
}

function walk(value, visit) {
  if (Array.isArray(value)) return value.forEach((item) => walk(item, visit));
  if (!value || typeof value !== "object") return;
  visit(value);
  Object.values(value).forEach((child) => walk(child, visit));
}

let checked = 0;
for (const file of htmlFiles(path.join(app, "dist", "vergleiche"))) {
  const html = fs.readFileSync(file, "utf8");
  for (const match of html.matchAll(/<script[^>]*type=["']application\\/ld\\+json["'][^>]*>([\\s\\S]*?)<\\/script>/gi)) {
    let data;
    try { data = JSON.parse(match[1]); } catch { continue; }
    walk(data, (node) => {
      if (node["@type"] !== "ItemList") return;
      checked += 1;
      for (const item of Array.isArray(node.itemListElement) ? node.itemListElement : []) {
        if (item?.item?.["@type"] === "Product") {
          errors.push(\`\${path.relative(app, file)} enthält Product in ItemList.\`);
        }
        if (item?.["@type"] === "ListItem" &&
            (!Number.isInteger(item.position) || typeof item.url !== "string")) {
          errors.push(\`\${path.relative(app, file)} enthält ungültiges ListItem.\`);
        }
      }
    });
  }
}

if (errors.length) {
  errors.forEach((error) => console.error(\`FEHLER  \${error}\`));
  process.exit(1);
}

console.log("OK  Vergleichs-ItemList ohne unvollständige Product-Objekte.");
console.log(checked
  ? \`INFO  \${checked} gebaute ItemList-Schemata geprüft.\`
  : "INFO  Kein dist-Verzeichnis gefunden; Quellcodeprüfung erfolgreich.");
`;
stage(audit, auditSource);

const packageData = JSON.parse(read(pkgJson));
packageData.scripts ??= {};
packageData.scripts["audit:comparison-schema"] =
  "node scripts/seo/audit-comparison-product-schema.mjs";
stage(pkgJson, JSON.stringify(packageData, null, 2) + "\n");

console.log(`[${PATCH}] Repository: ${root}`);
console.log(`[${PATCH}] Ändern/erstellen: ${changes.size}`);

if (CHECK) {
  for (const file of changes.keys()) console.log(`ÄNDERN: ${rel(file)}`);
  console.log(`[${PATCH}] Vorprüfung erfolgreich. Es wurde nichts verändert.`);
  process.exit(0);
}

const backup = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replaceAll(":", "-")}`
);

try {
  for (const [file, state] of changes) {
    if (state.old !== null) {
      const target = path.join(backup, rel(file));
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, state.old, "utf8");
    }
  }

  for (const [file, state] of changes) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, state.next, "utf8");
    console.log(`GEÄNDERT: ${rel(file)}`);
  }

  await import(`${pathToFileURL(audit).href}?t=${Date.now()}`);
  console.log(`[${PATCH}] Erfolgreich angewendet.`);
  console.log(`[${PATCH}] Backup: ${backup}`);
} catch (error) {
  for (const [file, state] of changes) {
    if (state.old === null) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, state.old, "utf8");
    }
  }
  console.error(`[${PATCH}] Fehler: ${error.message}`);
  console.error(`[${PATCH}] Änderungen wurden zurückgesetzt.`);
  process.exit(1);
}
