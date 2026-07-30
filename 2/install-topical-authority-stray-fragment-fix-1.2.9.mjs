#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH_ID = "pfotentechnik-topical-authority-stray-fragment-fix-1.2.9";

function findRepoRoot(start) {
  let current = path.resolve(start);

  while (true) {
    if (
      fs.existsSync(path.join(current, "apps", "pfotentechnik")) &&
      fs.existsSync(path.join(current, "package.json"))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error("Repository-Root nicht gefunden.");
    }

    current = parent;
  }
}

const repoRoot = findRepoRoot(process.cwd());
const loaderFile = path.join(
  repoRoot,
  "apps",
  "pfotentechnik",
  "src",
  "lib",
  "seo",
  "topical-authority",
  "loadTopicalAuthority.ts",
);

if (!fs.existsSync(loaderFile)) {
  throw new Error(
    `Loader fehlt: ${path.relative(repoRoot, loaderFile)}`,
  );
}

const source = fs.readFileSync(loaderFile, "utf8").replace(/^\uFEFF/, "");

const parseFrontmatterStart = source.indexOf(
  "function parseFrontmatter(raw: string): Record<string, string> {",
);
const nestedParserStart = source.indexOf(
  "function parseNestedFrontmatterValue(",
);

if (parseFrontmatterStart === -1 || nestedParserStart === -1) {
  throw new Error(
    "Erwartete Parser-Funktionen wurden nicht gefunden. Keine Änderung durchgeführt.",
  );
}

if (nestedParserStart <= parseFrontmatterStart) {
  throw new Error("Parser-Reihenfolge ist unerwartet.");
}

const parseFrontmatterEndMarker = "  return output;\n}";
const parseFrontmatterEnd = source.indexOf(
  parseFrontmatterEndMarker,
  parseFrontmatterStart,
);

if (parseFrontmatterEnd === -1 || parseFrontmatterEnd >= nestedParserStart) {
  throw new Error("Ende von parseFrontmatter konnte nicht bestimmt werden.");
}

const cleanBoundary =
  parseFrontmatterEnd + parseFrontmatterEndMarker.length;
const between = source.slice(cleanBoundary, nestedParserStart);

const containsKnownDamage =
  between.includes("),") &&
  between.includes("valueMatch") &&
  between.includes("sectionIndent");

if (!containsKnownDamage) {
  if (/^\s*$/.test(between)) {
    console.log(`[${PATCH_ID}] Bereits bereinigt.`);
    process.exit(0);
  }

  throw new Error(
    "Der Zwischenblock entspricht nicht dem bekannten beschädigten Fragment. Keine Änderung durchgeführt.",
  );
}

const repaired =
  source.slice(0, cleanBoundary) +
  "\n\n" +
  source.slice(nestedParserStart);

const fsImportCount =
  repaired.match(/import fs from "node:fs";/g)?.length ?? 0;
const nestedParserCount =
  repaired.match(/function parseNestedFrontmatterValue\(/g)?.length ?? 0;

if (fsImportCount !== 1) {
  throw new Error(
    `Plausibilitätsprüfung fehlgeschlagen: ${fsImportCount} fs-Imports.`,
  );
}

if (nestedParserCount !== 1) {
  throw new Error(
    `Plausibilitätsprüfung fehlgeschlagen: ${nestedParserCount} Nested-Parser.`,
  );
}

if (
  repaired.includes("\n),\n") ||
  repaired.includes("\n    );\n    if (valueMatch)")
) {
  throw new Error(
    "Das verwaiste Parserfragment ist nach der Reparatur noch vorhanden.",
  );
}

for (const required of [
  "categoryKey: string;",
  'parseNestedFrontmatterValue(raw, "category", "key")',
  "const PRODUCT_CATEGORY_CLUSTER_MAP",
  "return categoryCluster === definition.id;",
]) {
  if (!repaired.includes(required)) {
    throw new Error(`Erforderliche Logik fehlt nach Reparatur: ${required}`);
  }
}

const backupRoot = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
const backupFile = path.join(
  backupRoot,
  path.relative(repoRoot, loaderFile),
);

fs.mkdirSync(path.dirname(backupFile), { recursive: true });
fs.copyFileSync(loaderFile, backupFile);
fs.writeFileSync(loaderFile, repaired, "utf8");

console.log(`[${PATCH_ID}] Repariert: ${path.relative(repoRoot, loaderFile)}`);
console.log(`[${PATCH_ID}] Entfernte Zeichen: ${between.length}`);
console.log(`[${PATCH_ID}] Backup: ${path.relative(repoRoot, backupRoot)}`);
console.log("");
console.log("Jetzt ausführen:");
console.log("npm --workspace apps/pfotentechnik run test:topical-authority");
console.log("npm --workspace apps/pfotentechnik run audit:topical-authority:strict");
console.log("npm --workspace apps/pfotentechnik run build");
