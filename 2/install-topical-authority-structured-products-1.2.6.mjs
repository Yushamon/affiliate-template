#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH_ID = "pfotentechnik-topical-authority-structured-products-1.2.6";

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

function removeNamedTest(source, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const startPattern = new RegExp(
    `(?:^|\\n)test\\(["']${escaped}["'],\\s*\\(\\)\\s*=>\\s*\\{`,
    "m",
  );
  const startMatch = startPattern.exec(source);
  if (!startMatch) return source;

  const start = startMatch.index + (source[startMatch.index] === "\n" ? 1 : 0);
  let index = start + startMatch[0].replace(/^\n/, "").length;
  let depth = 1;
  let quote = null;
  let escapedChar = false;

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (quote) {
      if (escapedChar) {
        escapedChar = false;
      } else if (char === "\\") {
        escapedChar = true;
      } else if (char === quote) {
        quote = null;
      }
      index += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      index += 1;
      continue;
    }

    if (char === "/" && next === "/") {
      const lineEnd = source.indexOf("\n", index + 2);
      index = lineEnd === -1 ? source.length : lineEnd;
      continue;
    }

    if (char === "/" && next === "*") {
      const blockEnd = source.indexOf("*/", index + 2);
      index = blockEnd === -1 ? source.length : blockEnd + 2;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        const close = source.indexOf(");", index);
        if (close === -1) {
          throw new Error(`Testblock konnte nicht beendet werden: ${name}`);
        }
        let end = close + 2;
        while (source[end] === "\r" || source[end] === "\n") end += 1;
        return source.slice(0, start) + source.slice(end);
      }
    }

    index += 1;
  }

  throw new Error(`Testblock konnte nicht vollständig gelesen werden: ${name}`);
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

backup(repoRoot, backupRoot, loaderFile);
backup(repoRoot, backupRoot, testFile);

let loader = fs.readFileSync(loaderFile, "utf8").replace(/^\uFEFF/, "");

// Produktzuordnung vollständig strukturiert machen:
// category.key vorhanden und bekannt -> exakter Cluster
// category.key fehlt oder unbekannt -> kein Cluster
const productBranchPattern =
  /  if \(document\.type === "product"\) \{[\s\S]*?\n  \}\n\n  if \(primaryEvidence\) return true;/;

const strictProductBranch = `  if (document.type === "product") {
    const categoryCluster = productClusterFromCategory(document);

    // Produkt-MDs werden ausschließlich über die strukturierte category.key
    // zugeordnet. Fehlende oder unbekannte Kategorien werden nicht geraten.
    return categoryCluster === definition.id;
  }

  if (primaryEvidence) return true;`;

if (!productBranchPattern.test(loader)) {
  throw new Error(
    "Der Product-Branch im Topical-Authority-Loader konnte nicht gefunden werden.",
  );
}

loader = loader.replace(productBranchPattern, strictProductBranch);

// Sicherstellen, dass die strukturierte Kategorie vorhanden ist.
for (const required of [
  "categoryKey: string;",
  'parseNestedFrontmatterValue(raw, "category", "key")',
  "const PRODUCT_CATEGORY_CLUSTER_MAP",
  "function productClusterFromCategory(",
]) {
  if (!loader.includes(required)) {
    throw new Error(
      `Strukturierte Produktkategorie fehlt. Zuerst Patch 1.2.5 installieren oder aktuellen Loader prüfen: ${required}`,
    );
  }
}

fs.writeFileSync(loaderFile, loader, "utf8");

let tests = fs.readFileSync(testFile, "utf8").replace(/^\uFEFF/, "");

// Veralteten Markentest vollständig entfernen.
tests = removeNamedTest(
  tests,
  "Modellprodukte werden über eindeutige Marken erkannt",
);

// Älteren, eventuell aus 1.2.2 stammenden Test ebenfalls entfernen.
tests = removeNamedTest(
  tests,
  "Body-Treffer allein ordnen Produkte und Hersteller nicht zu",
);

// Neue präzise Variante einfügen.
const insertionMarker =
  'test("Automatische Katzentoiletten bleiben ohne echte Inhalte leer", () => {';

const replacementTest = `test("Produkte nutzen ausschließlich category.key, Hersteller nicht den Body", () => {
  const loader = read(
    "src/lib/seo/topical-authority/loadTopicalAuthority.ts",
  );

  assert.match(
    loader,
    /document\\.type === "manufacturer"[\\s\\S]*return manufacturerEvidence;/,
  );

  const productBranch = loader.match(
    /if \\(document\\.type === "product"\\) \\{([\\s\\S]*?)\\n  \\}/,
  );

  assert.ok(productBranch, "Product-Branch fehlt");
  assert.match(
    productBranch[1],
    /return categoryCluster === definition\\.id;/,
  );
  assert.doesNotMatch(productBranch[1], /primaryEvidence/);
  assert.doesNotMatch(productBranch[1], /manufacturerEvidence/);
  assert.doesNotMatch(productBranch[1], /bodyEvidence/);
  assert.match(loader, /bodySignalCount >= 2/);
});

`;

if (!tests.includes("Produkte nutzen ausschließlich category.key")) {
  if (!tests.includes(insertionMarker)) {
    throw new Error("Einfügepunkt für den neuen Product-Test fehlt.");
  }
  tests = tests.replace(insertionMarker, replacementTest + insertionMarker);
}

// Vorhandene 1.2.5-Tests beibehalten, aber einen expliziten Missing-Category-Test ergänzen.
if (!tests.includes("Fehlende Produktkategorien werden nicht heuristisch geraten")) {
  tests += `

test("Fehlende Produktkategorien werden nicht heuristisch geraten", () => {
  const loader = read(
    "src/lib/seo/topical-authority/loadTopicalAuthority.ts",
  );

  const productBranch = loader.match(
    /if \\(document\\.type === "product"\\) \\{([\\s\\S]*?)\\n  \\}/,
  );

  assert.ok(productBranch, "Product-Branch fehlt");
  assert.match(
    productBranch[1],
    /const categoryCluster = productClusterFromCategory\\(document\\);/,
  );
  assert.match(
    productBranch[1],
    /return categoryCluster === definition\\.id;/,
  );
  assert.doesNotMatch(productBranch[1], /return primaryEvidence/);
  assert.doesNotMatch(productBranch[1], /manufacturerEvidence/);
});

test("Gemeinsame Marken können Produktcluster nicht überschreiben", () => {
  const loader = read(
    "src/lib/seo/topical-authority/loadTopicalAuthority.ts",
  );

  assert.match(loader, /petlibro/i);
  assert.match(loader, /petkit/i);

  const productBranch = loader.match(
    /if \\(document\\.type === "product"\\) \\{([\\s\\S]*?)\\n  \\}/,
  );

  assert.ok(productBranch, "Product-Branch fehlt");
  assert.doesNotMatch(productBranch[1], /manufacturerEvidence/);
  assert.match(
    productBranch[1],
    /return categoryCluster === definition\\.id;/,
  );
});
`;
}

fs.writeFileSync(testFile, tests, "utf8");

console.log(`[${PATCH_ID}] Geändert: ${path.relative(repoRoot, loaderFile)}`);
console.log(`[${PATCH_ID}] Geändert: ${path.relative(repoRoot, testFile)}`);
console.log(`[${PATCH_ID}] Backup: ${path.relative(repoRoot, backupRoot)}`);
console.log("");
console.log("Umgesetzt:");
console.log("- Produktcluster ausschließlich über category.key");
console.log("- kein Slug-, Titel-, Description-, Body- oder Marken-Fallback");
console.log("- unbekannte oder fehlende Produktkategorie ergibt keine Zuordnung");
console.log("- veralteter Markentest entfernt");
console.log("- Body-Guard-Test auf strukturierte Produktlogik umgestellt");
console.log("- Regressionstests für fehlende Kategorien und gemeinsame Marken ergänzt");
console.log("");
console.log("Jetzt ausführen:");
console.log("npm --workspace apps/pfotentechnik run test:topical-authority");
console.log("npm --workspace apps/pfotentechnik run audit:topical-authority:strict");
console.log("npm --workspace apps/pfotentechnik run build");
