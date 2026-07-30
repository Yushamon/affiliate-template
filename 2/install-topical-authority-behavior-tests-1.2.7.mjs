#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH_ID = "pfotentechnik-topical-authority-behavior-tests-1.2.7";

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

function replaceNamedTest(source, name, replacement) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const startPattern = new RegExp(
    `(?:^|\\n)test\\(["']${escaped}["'],\\s*\\(\\)\\s*=>\\s*\\{`,
    "m",
  );
  const match = startPattern.exec(source);

  if (!match) {
    return `${source.trimEnd()}\n\n${replacement.trim()}\n`;
  }

  const start = match.index + (source[match.index] === "\n" ? 1 : 0);
  let index = start + match[0].replace(/^\n/, "").length;
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

        return (
          source.slice(0, start) +
          `${replacement.trim()}\n\n` +
          source.slice(end)
        );
      }
    }

    index += 1;
  }

  throw new Error(`Testblock konnte nicht gelesen werden: ${name}`);
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
const auditFile = path.join(
  appRoot,
  "scripts",
  "seo",
  "audit-topical-authority.mjs",
);

for (const file of [loaderFile, testFile, auditFile]) {
  if (!fs.existsSync(file)) {
    throw new Error(`Pflichtdatei fehlt: ${path.relative(repoRoot, file)}`);
  }
}

const backupRoot = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

for (const file of [testFile, auditFile]) {
  backup(repoRoot, backupRoot, file);
}

const loader = fs.readFileSync(loaderFile, "utf8").replace(/^\uFEFF/, "");

for (const required of [
  "categoryKey: string;",
  'parseNestedFrontmatterValue(raw, "category", "key")',
  "const PRODUCT_CATEGORY_CLUSTER_MAP",
  "function productClusterFromCategory(",
  "return categoryCluster === definition.id;",
]) {
  if (!loader.includes(required)) {
    throw new Error(`Loader ist nicht auf dem erwarteten strukturierten Stand: ${required}`);
  }
}

let tests = fs.readFileSync(testFile, "utf8").replace(/^\uFEFF/, "");

tests = replaceNamedTest(
  tests,
  "Produktkategorie nutzt category.key als Source of Truth",
  `test("Produktkategorie nutzt category.key als Source of Truth", () => {
  const loader = read(
    "src/lib/seo/topical-authority/loadTopicalAuthority.ts",
  );

  assert.match(loader, /categoryKey: string;/);
  assert.match(
    loader,
    /parseNestedFrontmatterValue\\(raw, "category", "key"\\)/,
  );
  assert.match(loader, /const PRODUCT_CATEGORY_CLUSTER_MAP/);
  assert.match(loader, /function productClusterFromCategory\\(/);

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
});`,
);

tests = replaceNamedTest(
  tests,
  "Hersteller und Body bestimmen keine Produktkategorie",
  `test("Hersteller und Body bestimmen keine Produktkategorie", () => {
  const loader = read(
    "src/lib/seo/topical-authority/loadTopicalAuthority.ts",
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
});`,
);

// Entfernt verbliebene alte Erwartungen global, ohne die neuen Tests anzutasten.
tests = tests.replace(
  /assert\.match\(\s*loader,\s*\/if \\\(categoryCluster\\\)\[\\s\\S\]\*return categoryCluster === definition\\\.id;\/,\s*\);\s*/g,
  "",
);
tests = tests.replace(
  /assert\.match\(\s*productBranch\[1\],\s*\/return primaryEvidence;\/,\s*\);\s*/g,
  "",
);

fs.writeFileSync(testFile, tests, "utf8");

let audit = fs.readFileSync(auditFile, "utf8").replace(/^\uFEFF/, "");

const oldRegressionCheck = `  {
    id: "REGRESSION_TESTS",
    ok:
      tests.includes("Body-Treffer allein") &&
      tests.includes("Automatische Katzentoiletten"),
    message: "Regressionstests für Fehlzuordnungen vorhanden",
  },`;

const newChecks = `  {
    id: "PRODUCT_CATEGORY_SOURCE",
    ok:
      loader.includes("categoryKey: string;") &&
      loader.includes('parseNestedFrontmatterValue(raw, "category", "key")') &&
      loader.includes("const PRODUCT_CATEGORY_CLUSTER_MAP") &&
      loader.includes("function productClusterFromCategory(") &&
      loader.includes("return categoryCluster === definition.id;"),
    message: "Produkte nutzen category.key als verbindliche Clusterquelle",
  },
  {
    id: "PRODUCT_HEURISTIC_GUARD",
    ok: (() => {
      const branch = loader.match(
        /if \\(document\\.type === "product"\\) \\{([\\s\\S]*?)\\n  \\}/,
      );
      if (!branch) return false;

      return (
        branch[1].includes(
          "return categoryCluster === definition.id;",
        ) &&
        !branch[1].includes("primaryEvidence") &&
        !branch[1].includes("manufacturerEvidence") &&
        !branch[1].includes("bodyEvidence")
      );
    })(),
    message: "Produktcluster werden nicht über Text oder Hersteller geraten",
  },
  {
    id: "REGRESSION_TESTS",
    ok:
      tests.includes(
        "Produktkategorie nutzt category.key als Source of Truth",
      ) &&
      tests.includes(
        "Hersteller und Body bestimmen keine Produktkategorie",
      ) &&
      tests.includes(
        "Fehlende Produktkategorien werden nicht heuristisch geraten",
      ) &&
      tests.includes(
        "Gemeinsame Marken können Produktcluster nicht überschreiben",
      ) &&
      tests.includes("Automatische Katzentoiletten"),
    message: "Regressionstests für strukturierte Produktzuordnung vorhanden",
  },`;

if (audit.includes(oldRegressionCheck)) {
  audit = audit.replace(oldRegressionCheck, newChecks);
} else {
  const regressionPattern =
    /  \{\s*id: "REGRESSION_TESTS",[\s\S]*?message: "Regressionstests für Fehlzuordnungen vorhanden",\s*\},/;

  if (!regressionPattern.test(audit)) {
    throw new Error("REGRESSION_TESTS-Check im Audit konnte nicht gefunden werden.");
  }

  audit = audit.replace(regressionPattern, newChecks);
}

audit = audit.replace(
  /patch:\s*"pfotentechnik-topical-authority-quality-[^"]+"/,
  `patch: "${PATCH_ID}"`,
);

fs.writeFileSync(auditFile, audit, "utf8");

console.log(`[${PATCH_ID}] Geändert: ${path.relative(repoRoot, testFile)}`);
console.log(`[${PATCH_ID}] Geändert: ${path.relative(repoRoot, auditFile)}`);
console.log(`[${PATCH_ID}] Backup: ${path.relative(repoRoot, backupRoot)}`);
console.log("");
console.log("Korrigiert:");
console.log("- veraltete Testannahme mit if (categoryCluster) entfernt");
console.log("- veralteter primaryEvidence-Fallback aus Tests entfernt");
console.log("- Tests prüfen den tatsächlichen Product-Branch");
console.log("- Strict-Audit prüft category.key als Source of Truth");
console.log("- Strict-Audit blockiert Produktheuristiken über Text, Body oder Hersteller");
console.log("- Regressionstest-Erkennung auf die neue Architektur aktualisiert");
console.log("");
console.log("Jetzt ausführen:");
console.log("npm --workspace apps/pfotentechnik run test:topical-authority");
console.log("npm --workspace apps/pfotentechnik run audit:topical-authority:strict");
console.log("npm --workspace apps/pfotentechnik run build");
