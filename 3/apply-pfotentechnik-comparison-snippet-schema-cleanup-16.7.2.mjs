#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const VERSION = "16.7.2";
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

let page = normalize(await readFile(join(root, paths.page), "utf8"));
const schemaMatch = page.match(/const comparisonItemListSchema = \{[\s\S]*?\n\};/);

if (!schemaMatch) {
  throw new Error("comparisonItemListSchema wurde nicht gefunden.");
}

const schema = schemaMatch[0];
const schemaIsFixed =
  schema.includes('"@type": "ListItem"') &&
  schema.includes("name: product.title") &&
  schema.includes("url: new URL(product.href, Astro.site ?? Astro.url).href") &&
  !schema.includes('"@type": "Product"') &&
  !schema.includes("item: {") &&
  !schema.includes("#product");

if (!schemaIsFixed) {
  const replacement = `const comparisonItemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "@id": \`\${comparisonCanonicalUrl}#item-list\`,
  name: comparison.title,
  description: comparison.seo?.description ?? comparison.description,
  url: comparisonCanonicalUrl,
  itemListOrder: "https://schema.org/ItemListOrderAscending",
  numberOfItems: model.products.length,
  itemListElement: model.products.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: product.title,
    url: new URL(product.href, Astro.site ?? Astro.url).href
  }))
};`;

  page = page.replace(schemaMatch[0], replacement);
  await writeFile(join(root, paths.page), page, "utf8");
  console.log(`Geändert: ${paths.page}`);
} else {
  console.log(`Unverändert: ${paths.page} (Schema bereits korrigiert)`);
}

let audit = normalize(await readFile(join(root, paths.audit), "utf8"));
if (audit.includes("Vergleichsseiten enthalten keine unvollständigen Product-Snippets.")) {
  console.log(`Unverändert: ${paths.audit} (Audit 16.7.x bereits vorhanden)`);
} else {
  throw new Error(
    "Das erwartete 16.7.x-Schema-Audit fehlt. Bitte Version 16.7.0 oder 16.7.1 nicht zurückrollen."
  );
}

let preflight = normalize(await readFile(join(root, paths.preflight), "utf8"));
const auditPath = "scripts/seo/audit-comparison-product-schema.mjs";

if (preflight.includes(auditPath)) {
  console.log(`Unverändert: ${paths.preflight} (Schema-Audit bereits eingebunden)`);
} else {
  const insertion = `  runNodeFile(
    "Comparison Snippet- und Schema-Audit",
    "${auditPath}"
  );

`;

  const completionMarker = "  report.ok = true;";
  const completionIndex = preflight.lastIndexOf(completionMarker);

  if (completionIndex === -1) {
    throw new Error(
      'Release-Preflight enthält keinen Abschlussmarker "report.ok = true;".'
    );
  }

  const tryIndex = preflight.lastIndexOf("try {", completionIndex);
  const catchIndex = preflight.indexOf("} catch", completionIndex);

  if (tryIndex === -1 || catchIndex === -1 || completionIndex > catchIndex) {
    throw new Error(
      "Release-Preflight-Struktur ist unerwartet; Audit wurde nicht eingefügt."
    );
  }

  preflight =
    preflight.slice(0, completionIndex) +
    insertion +
    preflight.slice(completionIndex);

  await writeFile(join(root, paths.preflight), preflight, "utf8");
  console.log(`Geändert: ${paths.preflight}`);
}

if (!skipChecks) {
  const checks = [
    ["node", ["--check", join(root, paths.preflight)]],
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "audit:comparison-schema"]],
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "seo:release:check:no-build"]]
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
console.log("- teilweise angewendete Versionen 16.7.0/16.7.1 sicher fortgesetzt");
console.log("- Schema-Audit unmittelbar vor erfolgreichem Preflight-Abschluss registriert");
console.log("- keine Abhängigkeit mehr von vorherigen Audit-Blöcken oder deren Reihenfolge");
console.log(`Backup: ${backupRoot}`);
