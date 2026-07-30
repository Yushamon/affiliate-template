#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH_ID = "pfotentechnik-topical-authority-test-fix-1.2.3";

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
const testFile = path.join(
  repoRoot,
  "apps",
  "pfotentechnik",
  "test",
  "topical-authority-center.test.mjs",
);

if (!fs.existsSync(testFile)) {
  throw new Error(
    `Testdatei fehlt: ${path.relative(repoRoot, testFile)}`,
  );
}

const original = fs.readFileSync(testFile, "utf8").replace(/^\uFEFF/, "");
let updated = original;

const oldAssertion = `  assert.match(
    loader,
    /document\\.type === "product"[\\s\\S]*return primaryEvidence;/,
  );`;

const newAssertion = `  assert.match(
    loader,
    /document\\.type === "product"[\\s\\S]*return primaryEvidence\\s*\\|\\|\\s*manufacturerEvidence;/,
  );`;

if (updated.includes(newAssertion)) {
  console.log(`[${PATCH_ID}] Bereits installiert.`);
  process.exit(0);
}

if (!updated.includes(oldAssertion)) {
  throw new Error(
    "Die erwartete veraltete Product-Assertion wurde nicht gefunden.",
  );
}

updated = updated.replace(oldAssertion, newAssertion);

const backupRoot = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
const backupFile = path.join(
  backupRoot,
  path.relative(repoRoot, testFile),
);

fs.mkdirSync(path.dirname(backupFile), { recursive: true });
fs.copyFileSync(testFile, backupFile);
fs.writeFileSync(testFile, updated, "utf8");

console.log(`[${PATCH_ID}] Geändert: ${path.relative(repoRoot, testFile)}`);
console.log(`[${PATCH_ID}] Backup: ${path.relative(repoRoot, backupRoot)}`);
console.log("");
console.log("Geändert:");
console.log("- Test erwartet jetzt primaryEvidence || manufacturerEvidence");
console.log("- Loader, Audit und UI bleiben unverändert");
console.log("");
console.log("Jetzt ausführen:");
console.log("npm --workspace apps/pfotentechnik run test:topical-authority");
console.log("npm --workspace apps/pfotentechnik run audit:topical-authority:strict");
console.log("npm --workspace apps/pfotentechnik run build");
