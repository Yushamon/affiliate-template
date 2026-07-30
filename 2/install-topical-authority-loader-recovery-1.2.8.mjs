#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH_ID = "pfotentechnik-topical-authority-loader-recovery-1.2.8";

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

function backup(repoRoot, backupRoot, file) {
  const target = path.join(backupRoot, path.relative(repoRoot, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function recoverCleanCopy(source) {
  const importLine = 'import fs from "node:fs";';
  const first = source.indexOf(importLine);
  const second = source.indexOf(importLine, first + importLine.length);

  if (first === -1) {
    throw new Error("Loader enthält keinen erwarteten fs-Import.");
  }

  if (second !== -1) {
    console.log(
      `[${PATCH_ID}] Eingebettete zweite Dateikopie erkannt; Recovery ab zweitem Import.`,
    );
    return source.slice(second);
  }

  return source;
}

const repoRoot = findRepoRoot(process.cwd());
const appRoot = path.join(repoRoot, "apps", "pfotentechnik");
const loaderFile = path.join(
  appRoot,
  "src",
  "lib",
  "seo",
  "topical-authority",
  "loadTopicalAuthority.ts",
);

if (!fs.existsSync(loaderFile)) {
  throw new Error(`Pflichtdatei fehlt: ${path.relative(repoRoot, loaderFile)}`);
}

const backupRoot = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

backup(repoRoot, backupRoot, loaderFile);

let loader = fs.readFileSync(loaderFile, "utf8").replace(/^\uFEFF/, "");
loader = recoverCleanCopy(loader).replace(/^\uFEFF/, "");

// Bereits teilweise eingefügte Recovery-Fragmente entfernen.
loader = loader.replace(
  /function parseNestedFrontmatterValue\([\s\S]*?\n}\n\n(?=function normalizeRoute)/,
  "",
);
loader = loader.replace(
  /const PRODUCT_CATEGORY_CLUSTER_MAP:[\s\S]*?\n}\n\n(?=export function belongsToCluster)/,
  "",
);

// DocumentRecord um categoryKey ergänzen.
if (!loader.includes("categoryKey: string;")) {
  const recordMarker = `  manufacturer: string;
  body: string;`;

  if (!loader.includes(recordMarker)) {
    throw new Error("DocumentRecord-Einfügepunkt nicht gefunden.");
  }

  loader = loader.replace(
    recordMarker,
    `  manufacturer: string;
  categoryKey: string;
  body: string;`,
  );
}

// Verschachtelten Frontmatter-Wert ohne verschachtelte Template-Literals lesen.
const normalizeMarker = `function normalizeRoute(value: string): string {`;

if (!loader.includes(normalizeMarker)) {
  throw new Error("normalizeRoute-Einfügepunkt nicht gefunden.");
}

const nestedHelper = `function parseNestedFrontmatterValue(
  raw: string,
  section: string,
  key: string,
): string {
  const match = raw.match(/^---\\s*\\r?\\n([\\s\\S]*?)\\r?\\n---/);
  if (!match) return "";

  const lines = match[1].split(/\\r?\\n/);
  let inSection = false;
  let sectionIndent = -1;

  for (const line of lines) {
    const sectionMatch = line.match(/^(\\s*)([A-Za-z][\\w-]*):\\s*$/);

    if (sectionMatch) {
      const indent = sectionMatch[1].length;
      const name = sectionMatch[2];

      if (inSection && indent <= sectionIndent) {
        inSection = false;
      }

      if (name === section) {
        inSection = true;
        sectionIndent = indent;
        continue;
      }
    }

    if (!inSection) continue;

    const valuePattern =
      "^\\\\s{" +
      String(sectionIndent + 2) +
      ",}" +
      key +
      ":\\\\s*(.+)$";
    const valueMatch = line.match(new RegExp(valuePattern));

    if (valueMatch) {
      return valueMatch[1].trim().replace(/^['"]|['"]$/g, "");
    }

    const indent = line.length - line.trimStart().length;
    if (line.trim() && indent <= sectionIndent) {
      inSection = false;
    }
  }

  return "";
}

`;

loader = loader.replace(normalizeMarker, nestedHelper + normalizeMarker);

// category.key beim Laden übernehmen.
if (!loader.includes('parseNestedFrontmatterValue(raw, "category", "key")')) {
  const collectionMarker = `      manufacturer: String(data.manufacturer || data.brand || ""),
      body: stripFrontmatter(raw),`;

  if (!loader.includes(collectionMarker)) {
    throw new Error("loadCollection-Einfügepunkt nicht gefunden.");
  }

  loader = loader.replace(
    collectionMarker,
    `      manufacturer: String(data.manufacturer || data.brand || ""),
      categoryKey:
        type === "product"
          ? parseNestedFrontmatterValue(raw, "category", "key")
          : "",
      body: stripFrontmatter(raw),`,
  );
}

// Verbindliches Kategorie-Mapping einsetzen.
const belongsMarker = `export function belongsToCluster(
  document: DocumentRecord,`;

if (!loader.includes(belongsMarker)) {
  throw new Error("belongsToCluster-Einfügepunkt nicht gefunden.");
}

const mapping = `const PRODUCT_CATEGORY_CLUSTER_MAP: Record<string, string> = {
  futterautomaten: "futterautomaten",
  futterautomat: "futterautomaten",
  trinkbrunnen: "trinkbrunnen",
  "gps-tracker": "gps-tracker",
  gps: "gps-tracker",
  katzenklappen: "katzenklappen",
  katzenklappe: "katzenklappen",
  haustierkameras: "haustierkameras",
  haustierkamera: "haustierkameras",
  katzentoiletten: "katzentoiletten",
  "automatische-katzentoiletten": "katzentoiletten",
};

function productClusterFromCategory(document: DocumentRecord): string | null {
  const categoryKey = normalizeText(document.categoryKey).trim();
  if (!categoryKey) return null;
  return PRODUCT_CATEGORY_CLUSTER_MAP[categoryKey] ?? null;
}

`;

loader = loader.replace(belongsMarker, mapping + belongsMarker);

// Produktzuordnung vollständig strukturiert setzen.
const productBranchPattern =
  /  if \(document\.type === "product"\) \{[\s\S]*?\n  \}\n\n  if \(primaryEvidence\) return true;/;

const structuredProductBranch = `  if (document.type === "product") {
    const categoryCluster = productClusterFromCategory(document);

    // Produkt-MDs werden ausschließlich über die strukturierte category.key
    // zugeordnet. Fehlende oder unbekannte Kategorien werden nicht geraten.
    return categoryCluster === definition.id;
  }

  if (primaryEvidence) return true;`;

if (!productBranchPattern.test(loader)) {
  throw new Error("Product-Branch konnte nicht eindeutig ersetzt werden.");
}

loader = loader.replace(productBranchPattern, structuredProductBranch);

// Plausibilitätsprüfungen vor dem Schreiben.
const importCount = (
  loader.match(/import fs from "node:fs";/g) ?? []
).length;

if (importCount !== 1) {
  throw new Error(`Recovery fehlgeschlagen: ${importCount} fs-Imports gefunden.`);
}

for (const required of [
  "categoryKey: string;",
  'parseNestedFrontmatterValue(raw, "category", "key")',
  "const PRODUCT_CATEGORY_CLUSTER_MAP",
  "return categoryCluster === definition.id;",
]) {
  if (!loader.includes(required)) {
    throw new Error(`Recovery-Ergebnis unvollständig: ${required}`);
  }
}

if (loader.includes('(.+)import fs from "node:fs";')) {
  throw new Error("Beschädigte eingebettete Importsequenz ist noch vorhanden.");
}

fs.writeFileSync(loaderFile, loader, "utf8");

console.log(`[${PATCH_ID}] Repariert: ${path.relative(repoRoot, loaderFile)}`);
console.log(`[${PATCH_ID}] Backup: ${path.relative(repoRoot, backupRoot)}`);
console.log("");
console.log("Behoben:");
console.log("- eingebettete zweite Loader-Kopie entfernt");
console.log("- beschädigter RegExp-String vollständig verworfen");
console.log("- category.key-Parser sicher neu eingesetzt");
console.log("- keine verschachtelten Template-Literals im Parser");
console.log("- Produktzuordnung ausschließlich über category.key");
console.log("");
console.log("Jetzt ausführen:");
console.log("npm --workspace apps/pfotentechnik run test:topical-authority");
console.log("npm --workspace apps/pfotentechnik run audit:topical-authority:strict");
console.log("npm --workspace apps/pfotentechnik run build");
