#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const VERSION = "16.7.4";
const LABEL = `pfotentechnik-comparison-snippet-schema-cleanup-${VERSION}`;
const rootArg = process.argv.find((value) => value.startsWith("--root="));
const root = resolve(rootArg ? rootArg.slice("--root=".length) : process.cwd());
const skipChecks = process.argv.includes("--skip-checks");

const paths = {
  page: "apps/pfotentechnik/src/pages/vergleiche/[comparison].astro",
  audit: "apps/pfotentechnik/scripts/seo/audit-comparison-product-schema.mjs",
  preflight: "apps/pfotentechnik/scripts/seo/release-preflight.mjs"
};

const backupRoot = join(
  root,
  ".patch-backups",
  `${LABEL}-${new Date().toISOString().replaceAll(":", "-")}`
);

function normalize(value) {
  return value.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

async function backup(relativePath) {
  const source = join(root, relativePath);
  if (!existsSync(source)) throw new Error(`Pflichtdatei fehlt: ${relativePath}`);
  const target = join(backupRoot, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target);
}

for (const relativePath of Object.values(paths)) {
  await backup(relativePath);
}

const page = normalize(await readFile(join(root, paths.page), "utf8"));
const schema = page.match(/const comparisonItemListSchema = \{[\s\S]*?\n\};/)?.[0] ?? "";

if (
  !schema ||
  !schema.includes('"@type": "ListItem"') ||
  !schema.includes("name: product.title") ||
  !schema.includes("url: new URL(product.href, Astro.site ?? Astro.url).href") ||
  schema.includes('"@type": "Product"') ||
  schema.includes("item: {") ||
  schema.includes("#product")
) {
  throw new Error("Das Vergleichsschema entspricht nicht dem erwarteten Stand 16.7.x.");
}
console.log(`Unverändert: ${paths.page} (Schema bereits korrigiert)`);

const auditSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "../..");
const sourceFile = path.join(app, "src", "pages", "vergleiche", "[comparison].astro");
const source = fs.readFileSync(sourceFile, "utf8")
  .replace(/^\\uFEFF/, "")
  .replace(/\\r\\n?/g, "\\n");

const schema = source.match(/const comparisonItemListSchema = \\{[\\s\\S]*?\\n\\};/)?.[0] ?? "";
const errors = [];
const warnings = [];

if (!schema) errors.push("comparisonItemListSchema fehlt.");

if (
  schema.includes('"@type": "Product"') ||
  schema.includes("item: {") ||
  schema.includes("#product")
) {
  errors.push("Vergleichs-ItemList enthält unvollständiges Product-Markup.");
}

for (const required of [
  '"@type": "ItemList"',
  '"@type": "ListItem"',
  "position: index + 1",
  "name: product.title",
  "url: new URL(product.href, Astro.site ?? Astro.url).href"
]) {
  if (!schema.includes(required)) {
    errors.push(\`ItemList-Anforderung fehlt: \${required}\`);
  }
}

function htmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);

    if (entry.isDirectory()) return htmlFiles(target);

    if (!entry.isFile() || entry.name !== "index.html") return [];

    const relativePath = path.relative(path.join(app, "dist", "vergleiche"), target);

    // Die Hub-Seite /vergleiche/ ist keine einzelne Vergleichsdetailseite.
    if (relativePath === "index.html") return [];

    return [target];
  });
}

function typesOf(node) {
  const type = node?.["@type"];
  return Array.isArray(type) ? type : type ? [type] : [];
}

function walk(value, visit) {
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, visit));
    return;
  }

  if (!value || typeof value !== "object") return;

  visit(value);
  Object.values(value).forEach((child) => walk(child, visit));
}

let checkedPages = 0;
let checkedItemLists = 0;

for (const file of htmlFiles(path.join(app, "dist", "vergleiche"))) {
  const html = fs.readFileSync(file, "utf8");
  const parsedSchemas = [];

  for (const match of html.matchAll(
    /<script[^>]*type=["']application\\/ld\\+json["'][^>]*>([\\s\\S]*?)<\\/script>/gi
  )) {
    try {
      parsedSchemas.push(JSON.parse(match[1]));
    } catch {
      errors.push(\`\${path.relative(app, file)} enthält ungültiges JSON-LD.\`);
    }
  }

  checkedPages += 1;
  let itemListCount = 0;
  let faqCount = 0;

  for (const data of parsedSchemas) {
    walk(data, (node) => {
      const types = typesOf(node);

      if (types.includes("Product")) {
        errors.push(
          \`\${path.relative(app, file)} enthält Product-Markup auf einer Vergleichsseite.\`
        );
      }

      if (types.includes("FAQPage")) faqCount += 1;
      if (!types.includes("ItemList")) return;

      itemListCount += 1;
      checkedItemLists += 1;

      const items = Array.isArray(node.itemListElement)
        ? node.itemListElement
        : [];

      if (node.numberOfItems !== items.length) {
        errors.push(
          \`\${path.relative(app, file)}: numberOfItems stimmt nicht mit den ListItems überein.\`
        );
      }

      const positions = new Set();

      for (const item of items) {
        if (!typesOf(item).includes("ListItem")) {
          errors.push(\`\${path.relative(app, file)} enthält ein Element ohne ListItem-Typ.\`);
          continue;
        }

        if (!Number.isInteger(item.position) || item.position < 1) {
          errors.push(\`\${path.relative(app, file)} enthält eine ungültige Position.\`);
        } else if (positions.has(item.position)) {
          errors.push(\`\${path.relative(app, file)} enthält eine doppelte Position.\`);
        } else {
          positions.add(item.position);
        }

        if (typeof item.url !== "string" || !/^https?:\\/\\//.test(item.url)) {
          errors.push(\`\${path.relative(app, file)} enthält eine ungültige Produkt-URL.\`);
        }

        if (typeof item.name !== "string" || !item.name.trim()) {
          errors.push(\`\${path.relative(app, file)} enthält ein ListItem ohne Namen.\`);
        }

        if ("item" in item) {
          errors.push(\`\${path.relative(app, file)} enthält ein verschachteltes item-Objekt.\`);
        }
      }
    });
  }

  if (itemListCount !== 1) {
    errors.push(
      \`\${path.relative(app, file)} enthält \${itemListCount} ItemList-Schemata statt genau einem.\`
    );
  }

  if (faqCount > 1) {
    errors.push(\`\${path.relative(app, file)} enthält mehrfaches FAQPage-Markup.\`);
  }
}

if (!checkedPages) {
  warnings.push("Keine gebauten Vergleichsdetailseiten gefunden; nur Quellcodeprüfung ausgeführt.");
}

warnings.forEach((warning) => console.warn(\`INFO  \${warning}\`));

if (errors.length) {
  [...new Set(errors)].forEach((error) => console.error(\`FEHLER  \${error}\`));
  process.exit(1);
}

console.log("OK  Vergleichsseiten enthalten keine unvollständigen Product-Snippets.");
console.log("OK  ItemList nutzt direkte ListItem-URLs mit stabilen Positionen.");
console.log("OK  Vergleichs-Hub /vergleiche/ wird nicht als Detailseite geprüft.");
console.log(
  checkedPages
    ? \`INFO  \${checkedPages} gebaute Vergleichsseiten und \${checkedItemLists} ItemLists geprüft.\`
    : "INFO  Quellcodeprüfung erfolgreich."
);
`;

await writeFile(join(root, paths.audit), auditSource, "utf8");
console.log(`Geändert: ${paths.audit}`);

const preflight = normalize(await readFile(join(root, paths.preflight), "utf8"));
if (!preflight.includes('"audit:comparison-schema"')) {
  throw new Error(
    "Der Comparison-Schema-Audit ist noch nicht im Release-Preflight eingebunden."
  );
}
console.log(`Unverändert: ${paths.preflight} (Schema-Audit bereits eingebunden)`);

if (!skipChecks) {
  const checks = [
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "build"]],
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "audit:comparison-schema"]]
  ];

  for (const [command, args] of checks) {
    const executable =
      process.platform === "win32" && command === "npm" ? "npm.cmd" : command;

    const result = spawnSync(executable, args, {
      cwd: root,
      stdio: "inherit"
    });

    if (result.status !== 0) {
      throw new Error(`Validierung fehlgeschlagen: ${command} ${args.join(" ")}`);
    }
  }
}

console.log(`\n[${LABEL}] ABGESCHLOSSEN.`);
console.log("- dist mit dem korrigierten Vergleichsschema neu gebaut");
console.log("- veraltete Product-Schemas aus dem Build entfernt");
console.log("- /vergleiche/ Hub korrekt vom Detailseiten-Audit ausgeschlossen");
console.log(`Backup: ${backupRoot}`);
