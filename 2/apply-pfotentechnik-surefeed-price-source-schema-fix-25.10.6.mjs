#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-surefeed-price-source-schema-fix-25.10.6";
const PRODUCT_RELATIVE =
  "apps/pfotentechnik/src/content/products/surefeed-microchip-pet-feeder-connect.md";

function findRoot(start) {
  let directory = path.resolve(start);

  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(directory, "apps", "pfotentechnik", "package.json"))) {
      return directory;
    }

    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }

  throw new Error("Repository-Wurzel nicht gefunden.");
}

function log(message) {
  console.log(`[${NAME}] ${message}`);
}

function backup(root, backupRoot, target) {
  if (!fs.existsSync(target)) return;

  const destination = path.join(backupRoot, path.relative(root, target));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(target, destination);
}

function quoteWindowsArgument(value) {
  const text = String(value);

  if (!/[\s"&|<>^()]/.test(text)) return text;

  return `"${text
    .replaceAll("^", "^^")
    .replaceAll("%", "%%")
    .replaceAll('"', '\\"')}"`;
}

function runNpm(root, args) {
  if (process.platform === "win32") {
    const commandInterpreter =
      process.env.ComSpec || "C:\\Windows\\System32\\cmd.exe";
    const command = ["npm", ...args]
      .map(quoteWindowsArgument)
      .join(" ");

    execFileSync(
      commandInterpreter,
      ["/d", "/s", "/c", command],
      {
        cwd: root,
        stdio: "inherit",
        windowsHide: true
      }
    );

    return;
  }

  execFileSync("npm", args, {
    cwd: root,
    stdio: "inherit"
  });
}

function replacePriceSourceType(source) {
  const lines = source.split(/\r?\n/);
  let inPrice = false;
  let inSource = false;
  let changed = false;
  let foundSourceType = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (/^[A-Za-z0-9_-]+:/.test(line)) {
      inPrice = line.startsWith("price:");
      inSource = false;
      continue;
    }

    if (!inPrice) continue;

    if (/^\s{2}source:\s*$/.test(line)) {
      inSource = true;
      continue;
    }

    if (inSource && /^\s{2}[A-Za-z0-9_-]+:/.test(line)) {
      inSource = false;
    }

    if (inSource && /^\s{4}type:\s*/.test(line)) {
      foundSourceType = true;

      if (line.trim() === 'type: "manufacturer"' || line.trim() === "type: manufacturer") {
        lines[index] = '    type: "manual"';
        changed = true;
      }
    }
  }

  if (!foundSourceType) {
    throw new Error("price.source.type wurde im Produktdatensatz nicht gefunden.");
  }

  return {
    changed,
    source: lines.join("\n")
  };
}

function patchLegacyInstaller(source) {
  let next = source;

  next = next.replaceAll(
    '    \'    type: "manufacturer"\'',
    '    \'    type: "manual"\''
  );

  next = next.replaceAll(
    '    type: "manufacturer"',
    '    type: "manual"'
  );

  return next;
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const PRODUCT = path.join(ROOT, PRODUCT_RELATIVE);
const PACKAGE = path.join(APP, "package.json");
const TEST = path.join(
  APP,
  "test",
  "surefeed-price-source-schema-fix-25.10.6.test.mjs"
);
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

for (const target of [PRODUCT, PACKAGE]) {
  if (!fs.existsSync(target)) {
    throw new Error(`Erwartete Datei fehlt: ${path.relative(ROOT, target)}`);
  }
}

const packageJson = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));

for (const script of [
  "audit:products:strict",
  "comparison:data:audit:strict",
  "product-standard-3:release:no-build",
  "build"
]) {
  if (!packageJson.scripts?.[script]) {
    throw new Error(`package.json: erforderliches npm-Skript fehlt: ${script}`);
  }
}

const originalProduct = fs.readFileSync(PRODUCT, "utf8");
const productResult = replacePriceSourceType(originalProduct);

if (productResult.changed) {
  backup(ROOT, BACKUP, PRODUCT);
  fs.writeFileSync(PRODUCT, productResult.source);
  log(`Geändert: ${path.relative(ROOT, PRODUCT)}`);
} else {
  if (!productResult.source.includes('    type: "manual"')) {
    throw new Error(
      "price.source.type ist weder manufacturer noch manual. Bitte Datenstand prüfen."
    );
  }

  log(`Bereits aktuell: ${path.relative(ROOT, PRODUCT)}`);
}

const legacyInstallerCandidates = [
  path.join(
    ROOT,
    "2",
    "apply-pfotentechnik-surefeed-connect-research-final-25.10.4.mjs"
  ),
  path.join(
    ROOT,
    "3",
    "apply-pfotentechnik-surefeed-connect-research-final-25.10.4.mjs"
  )
];

for (const legacyInstaller of legacyInstallerCandidates) {
  if (!fs.existsSync(legacyInstaller)) continue;

  const before = fs.readFileSync(legacyInstaller, "utf8");
  const after = patchLegacyInstaller(before);

  if (after !== before) {
    backup(ROOT, BACKUP, legacyInstaller);
    fs.writeFileSync(legacyInstaller, after);
    log(`Alter SureFeed-Installer korrigiert: ${path.relative(ROOT, legacyInstaller)}`);
  } else {
    log(`Alter SureFeed-Installer bereits korrigiert: ${path.relative(ROOT, legacyInstaller)}`);
  }
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PRODUCT = path.join(
  ROOT,
  "apps/pfotentechnik/src/content/products/surefeed-microchip-pet-feeder-connect.md"
);

const source = fs.readFileSync(PRODUCT, "utf8");

test("SureFeed-Preisquelle verwendet einen erlaubten Schematyp", () => {
  const priceBlock =
    source.match(/^price:\\n([\\s\\S]*?)(?=^[A-Za-z0-9_-]+:)/m)?.[1] ?? "";

  assert.match(priceBlock, /^\\s{4}type: "manual"$/m);
  assert.doesNotMatch(priceBlock, /^\\s{4}type: "manufacturer"$/m);
});

test("Herstellerbezug bleibt über ID und Label erhalten", () => {
  const priceBlock =
    source.match(/^price:\\n([\\s\\S]*?)(?=^[A-Za-z0-9_-]+:)/m)?.[1] ?? "";

  assert.match(priceBlock, /id: "sure-petcare-de"/);
  assert.match(priceBlock, /label: "Sure Petcare Deutschland"/);
});
`;

if (!fs.existsSync(TEST) || fs.readFileSync(TEST, "utf8") !== testSource) {
  backup(ROOT, BACKUP, TEST);
  fs.writeFileSync(TEST, testSource);
  log(`Geschrieben: ${path.relative(ROOT, TEST)}`);
} else {
  log(`Bereits aktuell: ${path.relative(ROOT, TEST)}`);
}

packageJson.scripts ??= {};
packageJson.scripts["test:surefeed-price-source-schema"] =
  "node --test test/surefeed-price-source-schema-fix-25.10.6.test.mjs";

const nextPackage = JSON.stringify(packageJson, null, 2) + "\n";
const currentPackage = fs.readFileSync(PACKAGE, "utf8");

if (nextPackage !== currentPackage) {
  backup(ROOT, BACKUP, PACKAGE);
  fs.writeFileSync(PACKAGE, nextPackage);
  log(`Geändert: ${path.relative(ROOT, PACKAGE)}`);
} else {
  log(`Bereits aktuell: ${path.relative(ROOT, PACKAGE)}`);
}

const finalProduct = fs.readFileSync(PRODUCT, "utf8");

if (!finalProduct.includes('    type: "manual"')) {
  throw new Error("Ergebnisvalidierung fehlgeschlagen: price.source.type ist nicht manual.");
}

if (finalProduct.includes('    type: "manufacturer"')) {
  throw new Error("Ergebnisvalidierung fehlgeschlagen: ungültiger Schematyp bleibt vorhanden.");
}

execFileSync(
  process.execPath,
  ["--check", fileURLToPath(import.meta.url)],
  {
    cwd: ROOT,
    stdio: "inherit",
    windowsHide: true
  }
);

runNpm(ROOT, [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "test:surefeed-price-source-schema"
]);

runNpm(ROOT, [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "audit:products:strict"
]);

runNpm(ROOT, [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "comparison:data:audit:strict"
]);

runNpm(ROOT, [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "product-standard-3:release:no-build"
]);

runNpm(ROOT, [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "build"
]);

log("Schemafix, Tests, Audits, Release-Gate und Build erfolgreich.");
log("Fertig.");
