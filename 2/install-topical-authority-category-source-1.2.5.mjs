#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH_ID = "pfotentechnik-topical-authority-category-source-1.2.5";

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

function backupFile(repoRoot, backupRoot, file) {
  const target = path.join(backupRoot, path.relative(repoRoot, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
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
const testFile = path.join(
  appRoot,
  "test",
  "topical-authority-center.test.mjs",
);

for (const file of [loaderFile, testFile]) {
  if (!fs.existsSync(file)) {
    throw new Error(`Pflichtdatei fehlt: ${path.relative(repoRoot, file)}`);
  }
}

const backupRoot = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

backupFile(repoRoot, backupRoot, loaderFile);
backupFile(repoRoot, backupRoot, testFile);

let loader = fs.readFileSync(loaderFile, "utf8").replace(/^\uFEFF/, "");

// 1. DocumentRecord um die strukturierte Produktkategorie erweitern.
if (!loader.includes("categoryKey: string;")) {
  loader = loader.replace(
    `  manufacturer: string;
  body: string;`,
    `  manufacturer: string;
  categoryKey: string;
  body: string;`,
  );
}

// 2. Verschachtelte Frontmatter-Werte sicher lesen.
// Der bestehende flache Parser erkennt "category:" zwar, aber nicht dessen "key:".
if (!loader.includes("function parseNestedFrontmatterValue(")) {
  const marker = `function normalizeRoute(value: string): string {`;
  const helper = `function parseNestedFrontmatterValue(
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

    const valueMatch = line.match(
      new RegExp(\`^\\\\s{\${sectionIndent + 2},}\${key}:\\\\s*(.+)$\`),
    );
    if (valueMatch) {
      return valueMatch[1].trim().replace(/^['"]|['"]$/g, "");
    }

    if (line.trim() && line.length - line.trimStart().length <= sectionIndent) {
      inSection = false;
    }
  }

  return "";
}

${marker}`;

  if (!loader.includes(marker)) {
    throw new Error("Einfügepunkt für den verschachtelten Frontmatter-Parser fehlt.");
  }
  loader = loader.replace(marker, helper);
}

// 3. category.key beim Einlesen der Produkt-MDs übernehmen.
if (!loader.includes("categoryKey: parseNestedFrontmatterValue(raw, \"category\", \"key\")")) {
  loader = loader.replace(
    `      manufacturer: String(data.manufacturer || data.brand || ""),
      body: stripFrontmatter(raw),`,
    `      manufacturer: String(data.manufacturer || data.brand || ""),
      categoryKey:
        type === "product"
          ? parseNestedFrontmatterValue(raw, "category", "key")
          : "",
      body: stripFrontmatter(raw),`,
  );
}

// 4. Kategorie-zu-Cluster-Mapping als Source of Truth.
if (!loader.includes("const PRODUCT_CATEGORY_CLUSTER_MAP")) {
  const marker = `export function belongsToCluster(
  document: DocumentRecord,`;

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

${marker}`;

  if (!loader.includes(marker)) {
    throw new Error("Einfügepunkt vor belongsToCluster fehlt.");
  }
  loader = loader.replace(marker, mapping);
}

// 5. Eventuelle heuristische 1.2.4-Helfer entfernen, falls der Patch bereits installiert wurde.
loader = loader.replace(
  /function productClusterScore\([\s\S]*?\n}\n\nfunction bestProductClusterId\([\s\S]*?\n}\n\n(?=export function belongsToCluster)/,
  "",
);

// 6. Produktbranch unabhängig vom vorherigen Patchstand ersetzen.
const productBranchPattern =
  /  if \(document\.type === "product"\) \{[\s\S]*?\n  \}\n\n  if \(primaryEvidence\) return true;/;

const productBranch = `  if (document.type === "product") {
    const categoryCluster = productClusterFromCategory(document);

    // category.key ist für Produkte die verbindliche Source of Truth.
    if (categoryCluster) {
      return categoryCluster === definition.id;
    }

    // Kontrollierter Legacy-Fallback für ältere Produkt-MDs ohne category.key:
    // Nur eindeutige Slug-, Titel- oder Description-Signale zählen.
    // Hersteller und Body dürfen keine Produktkategorie bestimmen.
    return primaryEvidence;
  }

  if (primaryEvidence) return true;`;

if (!productBranchPattern.test(loader)) {
  throw new Error("Produktzuordnungs-Branch konnte nicht eindeutig gefunden werden.");
}
loader = loader.replace(productBranchPattern, productBranch);

fs.writeFileSync(loaderFile, loader, "utf8");

// 7. Regressionstests auf die neue Source-of-Truth-Logik umstellen.
let tests = fs.readFileSync(testFile, "utf8").replace(/^\uFEFF/, "");

// Alte, zu konkrete Assertionen entfernen bzw. ersetzen.
tests = tests.replace(
  /test\("Produkte werden exklusiv genau einem Cluster zugeordnet"[\s\S]*?\n}\);\n?/g,
  "",
);
tests = tests.replace(
  /test\("Gemeinsame Marken dürfen die Kategorie nicht allein bestimmen"[\s\S]*?\n}\);\n?/g,
  "",
);
tests = tests.replace(
  /assert\.match\(\s*loader,\s*\/document\\\.type === "product"[\s\S]*?\);\s*/m,
  "",
);

if (!tests.includes('Produktkategorie nutzt category.key als Source of Truth')) {
  tests += `

test("Produktkategorie nutzt category.key als Source of Truth", () => {
  const loader = read(
    "src/lib/seo/topical-authority/loadTopicalAuthority.ts",
  );

  assert.match(loader, /categoryKey: string;/);
  assert.match(
    loader,
    /parseNestedFrontmatterValue\\(raw, "category", "key"\\)/,
  );
  assert.match(loader, /const PRODUCT_CATEGORY_CLUSTER_MAP/);
  assert.match(
    loader,
    /if \\(categoryCluster\\)[\\s\\S]*return categoryCluster === definition\\.id;/,
  );
});

test("Hersteller und Body bestimmen keine Produktkategorie", () => {
  const loader = read(
    "src/lib/seo/topical-authority/loadTopicalAuthority.ts",
  );

  const productBranch = loader.match(
    /if \\(document\\.type === "product"\\) \\{([\\s\\S]*?)\\n  \\}/,
  );

  assert.ok(productBranch, "Product-Branch fehlt");
  assert.doesNotMatch(productBranch[1], /manufacturerEvidence/);
  assert.doesNotMatch(productBranch[1], /bodyEvidence/);
  assert.match(productBranch[1], /return primaryEvidence;/);
});

test("Produktkategorien werden eindeutig auf Cluster gemappt", () => {
  const loader = read(
    "src/lib/seo/topical-authority/loadTopicalAuthority.ts",
  );

  assert.match(loader, /futterautomaten: "futterautomaten"/);
  assert.match(loader, /trinkbrunnen: "trinkbrunnen"/);
  assert.match(loader, /"gps-tracker": "gps-tracker"/);
  assert.match(loader, /katzenklappen: "katzenklappen"/);
});
`;
}

fs.writeFileSync(testFile, tests, "utf8");

console.log(`[${PATCH_ID}] Geändert: ${path.relative(repoRoot, loaderFile)}`);
console.log(`[${PATCH_ID}] Geändert: ${path.relative(repoRoot, testFile)}`);
console.log(`[${PATCH_ID}] Backup: ${path.relative(repoRoot, backupRoot)}`);
console.log("");
console.log("Behoben:");
console.log("- category.key aus Produkt-Frontmatter wird eingelesen");
console.log("- category.key ist die verbindliche Produkt-Cluster-Zuordnung");
console.log("- Hersteller und Body bestimmen keine Produktkategorie mehr");
console.log("- kontrollierter Fallback nur für Produkt-MDs ohne category.key");
console.log("- kompatibel mit nicht installiertem oder installiertem Patch 1.2.4");
console.log("");
console.log("Jetzt ausführen:");
console.log("npm --workspace apps/pfotentechnik run test:topical-authority");
console.log("npm --workspace apps/pfotentechnik run audit:topical-authority:strict");
console.log("npm --workspace apps/pfotentechnik run build");
