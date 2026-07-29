#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const VERSION = "16.7.3";
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
  throw new Error(
    "Das Vergleichsschema entspricht nicht dem bereits angewendeten Stand 16.7.x."
  );
}
console.log(`Unverändert: ${paths.page} (Schema bereits korrigiert)`);

const audit = normalize(await readFile(join(root, paths.audit), "utf8"));
if (!audit.includes("Vergleichsseiten enthalten keine unvollständigen Product-Snippets.")) {
  throw new Error("Das erwartete Comparison-Schema-Audit 16.7.x fehlt.");
}
console.log(`Unverändert: ${paths.audit} (Audit 16.7.x bereits vorhanden)`);

let preflight = normalize(await readFile(join(root, paths.preflight), "utf8"));
const targetCall =
  '  npmScript("Comparison-Snippet- und Schema-Audit", "audit:comparison-schema");';

if (preflight.includes('"audit:comparison-schema"')) {
  console.log(`Unverändert: ${paths.preflight} (Schema-Audit bereits eingebunden)`);
} else {
  const anchor =
    '  npmScript("Technischer SEO-Source-Audit", "audit:technical-seo:source");';

  if (!preflight.includes(anchor)) {
    throw new Error(
      'Erwartete Release-Preflight-Architektur fehlt: "Technischer SEO-Source-Audit".'
    );
  }

  preflight = preflight.replace(anchor, `${anchor}\n${targetCall}`);
  await writeFile(join(root, paths.preflight), preflight, "utf8");
  console.log(`Geändert: ${paths.preflight}`);
}

if (!skipChecks) {
  const checks = [
    ["node", ["--check", join(root, paths.preflight)]],
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "audit:comparison-schema"]],
    [
      "npm",
      [
        "--workspace",
        "apps/pfotentechnik",
        "run",
        "seo:release:check",
        "--",
        "--diagnostic",
        "--skip-build"
      ]
    ]
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
console.log("- aktuelle Release-Preflight-Architektur erkannt");
console.log("- Comparison-Schema-Audit direkt nach dem technischen Source-Audit eingebunden");
console.log("- kein zusätzlicher Vollbuild ausgeführt");
console.log(`Backup: ${backupRoot}`);
