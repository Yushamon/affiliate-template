#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PATCH_ID = "pfotentechnik-topical-authority-quality-1.2.0";

function findRepoRoot(startDirectory) {
  let current = path.resolve(startDirectory);

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
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.join(repoRoot, "apps", "pfotentechnik");

const replacements = [
  {
    source: path.join(scriptDirectory, "audit-topical-authority.1.2.0.mjs"),
    target: path.join(appRoot, "scripts", "seo", "audit-topical-authority.mjs"),
  },
  {
    source: path.join(scriptDirectory, "loadTopicalAuthority.1.2.0.ts"),
    target: path.join(
      appRoot,
      "src",
      "lib",
      "seo",
      "topical-authority",
      "loadTopicalAuthority.ts",
    ),
  },
  {
    source: path.join(
      scriptDirectory,
      "topical-authority-center.1.2.0.test.mjs",
    ),
    target: path.join(
      appRoot,
      "test",
      "topical-authority-center.test.mjs",
    ),
  },
];

for (const replacement of replacements) {
  if (!fs.existsSync(replacement.source)) {
    throw new Error(`Patch-Datei fehlt: ${replacement.source}`);
  }
  if (!fs.existsSync(replacement.target)) {
    throw new Error(
      `Zieldatei fehlt: ${path.relative(repoRoot, replacement.target)}`,
    );
  }
}

const backupRoot = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

for (const replacement of replacements) {
  const backupFile = path.join(
    backupRoot,
    path.relative(repoRoot, replacement.target),
  );
  fs.mkdirSync(path.dirname(backupFile), { recursive: true });
  fs.copyFileSync(replacement.target, backupFile);
  fs.writeFileSync(
    replacement.target,
    fs.readFileSync(replacement.source, "utf8"),
    "utf8",
  );

  console.log(
    `[${PATCH_ID}] Ersetzt: ${path.relative(repoRoot, replacement.target)}`,
  );
}

console.log(`[${PATCH_ID}] Backup: ${path.relative(repoRoot, backupRoot)}`);
console.log("");
console.log("Enthalten:");
console.log("- semantische Responsive-Prüfung statt exakter CSS-Zeichenfolge");
console.log("- typabhängige und gewichtete Clusterzuordnung");
console.log("- Body-Treffer allein reichen nicht mehr für Produkte/Hersteller");
console.log("- Ausschlüsse zwischen Futterautomaten, Trinkbrunnen, GPS, Katzenklappen und Katzentoiletten");
console.log("- leere Expansionscluster erhalten Score 0");
console.log("- Regressionstests für falsche Katzentoiletten-Zuordnungen");
console.log("");
console.log("Jetzt ausführen:");
console.log("npm --workspace apps/pfotentechnik run test:topical-authority");
console.log("npm --workspace apps/pfotentechnik run audit:topical-authority:strict");
console.log("npm --workspace apps/pfotentechnik run build");
