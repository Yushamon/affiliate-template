#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-surefeed-comparison-coverage-final-25.10.5";

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

function splitDocument(source) {
  const lines = source.split(/\r?\n/);

  if (lines[0]?.trim() !== "---") {
    throw new Error("Frontmatter-Start fehlt.");
  }

  const end = lines.findIndex(
    (line, index) => index > 0 && line.trim() === "---"
  );

  if (end < 0) {
    throw new Error("Frontmatter-Ende fehlt.");
  }

  return {
    frontmatter: lines.slice(1, end),
    body: lines.slice(end + 1)
  };
}

function serializeDocument(frontmatter, body) {
  return ["---", ...frontmatter, "---", ...body].join("\n");
}

function findItemBounds(lines, slug) {
  const start = lines.findIndex((line) => line.trim() === `- slug: ${slug}`);
  if (start < 0) return null;

  const itemIndent = lines[start].match(/^\s*/)?.[0].length ?? 0;
  let end = lines.length;

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    const indent = line.match(/^\s*/)?.[0].length ?? 0;

    if (
      line.trim().startsWith("- slug:") &&
      indent === itemIndent
    ) {
      end = index;
      break;
    }

    if (line.trim() && indent < itemIndent) {
      end = index;
      break;
    }
  }

  return { start, end, itemIndent };
}

function findChildBlock(lines, bounds, key) {
  const childIndent = bounds.itemIndent + 2;
  const prefix = `${" ".repeat(childIndent)}${key}:`;

  const start = lines.findIndex(
    (line, index) =>
      index > bounds.start &&
      index < bounds.end &&
      line.startsWith(prefix)
  );

  if (start < 0) return null;

  let end = bounds.end;
  for (let index = start + 1; index < bounds.end; index += 1) {
    const line = lines[index];
    const indent = line.match(/^\s*/)?.[0].length ?? 0;

    if (line.trim() && indent <= childIndent) {
      end = index;
      break;
    }
  }

  return { start, end, childIndent };
}

function parseSimpleMapping(lines, block) {
  const result = new Map();
  const valueIndent = block.childIndent + 2;

  for (let index = block.start + 1; index < block.end; index += 1) {
    const line = lines[index];
    const indent = line.match(/^\s*/)?.[0].length ?? 0;

    if (indent !== valueIndent) continue;

    const trimmed = line.trim();
    const separator = trimmed.indexOf(":");
    if (separator <= 0) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    result.set(key, value);
  }

  return result;
}

function yamlScalar(value) {
  return JSON.stringify(String(value));
}

function upsertItemOverrides(lines, slug, additions) {
  const bounds = findItemBounds(lines, slug);

  if (!bounds) {
    throw new Error(`Vergleichseintrag fehlt: ${slug}`);
  }

  const existingBlock = findChildBlock(lines, bounds, "overrides");
  const values = existingBlock
    ? parseSimpleMapping(lines, existingBlock)
    : new Map();

  for (const [key, value] of Object.entries(additions)) {
    values.set(key, yamlScalar(value));
  }

  const childIndent = bounds.itemIndent + 2;
  const valueIndent = childIndent + 2;
  const block = [
    `${" ".repeat(childIndent)}overrides:`,
    ...[...values.entries()]
      .sort(([left], [right]) => left.localeCompare(right, "de"))
      .map(
        ([key, value]) =>
          `${" ".repeat(valueIndent)}${key}: ${value}`
      )
  ];

  if (existingBlock) {
    return [
      ...lines.slice(0, existingBlock.start),
      ...block,
      ...lines.slice(existingBlock.end)
    ];
  }

  const valuesBlock = findChildBlock(lines, bounds, "values");
  const insertionIndex = valuesBlock?.end ?? bounds.end;

  return [
    ...lines.slice(0, insertionIndex),
    ...block,
    ...lines.slice(insertionIndex)
  ];
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

function assertIncludes(source, markers, label) {
  for (const marker of markers) {
    if (!source.includes(marker)) {
      throw new Error(`${label}: erwarteter Inhalt fehlt: ${marker}`);
    }
  }
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");

const MULTIPET = path.join(
  APP,
  "src",
  "content",
  "comparisons",
  "beste-futterautomaten-fuer-mehrtierhaushalte.md"
);

const SENIOR = path.join(
  APP,
  "src",
  "content",
  "comparisons",
  "beste-futterautomaten-fuer-seniorenkatzen.md"
);

const PRODUCT_DUAL = path.join(
  APP,
  "src",
  "content",
  "products",
  "petlibro-granary-dual-feeder.md"
);

const PRODUCT_SUREFEED = path.join(
  APP,
  "src",
  "content",
  "products",
  "surefeed-microchip-pet-feeder-connect.md"
);

const REPORT = path.join(
  APP,
  "reports",
  "comparison-platform",
  "comparison-data-platform.json"
);

const PACKAGE = path.join(APP, "package.json");

const TEST = path.join(
  APP,
  "test",
  "surefeed-comparison-coverage-final-25.10.5.test.mjs"
);

const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

for (const target of [
  MULTIPET,
  SENIOR,
  PRODUCT_DUAL,
  PRODUCT_SUREFEED,
  PACKAGE
]) {
  if (!fs.existsSync(target)) {
    throw new Error(`Erwartete Datei fehlt: ${path.relative(ROOT, target)}`);
  }
}

const packageJson = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
const requiredScripts = [
  "comparison:data:audit:strict",
  "product-standard-3:release:no-build",
  "build"
];

for (const script of requiredScripts) {
  if (!packageJson.scripts?.[script]) {
    throw new Error(`package.json: erforderliches npm-Skript fehlt: ${script}`);
  }
}

const dualProduct = fs.readFileSync(PRODUCT_DUAL, "utf8");
assertIncludes(
  dualProduct,
  [
    "Keine individuelle Tiererkennung",
    "Keine Zugangskontrolle",
    "Doppelschale löst keinen Futterneid"
  ],
  "PETLIBRO Granary Dual"
);

const sureFeedProduct = fs.readFileSync(PRODUCT_SUREFEED, "utf8");
assertIncludes(
  sureFeedProduct,
  [
    "Für Nass- und Trockenfutter",
    "Kapazität",
    "400 ml",
    "Mikrochip oder kompatibler RFID-Halsbandanhänger"
  ],
  "SureFeed Connect"
);

function updateComparison(target, updater, validationMarkers) {
  const original = fs.readFileSync(target, "utf8");
  const document = splitDocument(original);
  const nextFrontmatter = updater(document.frontmatter);
  const next = serializeDocument(nextFrontmatter, document.body);

  assertIncludes(next, validationMarkers, path.basename(target));

  if (next === original) {
    log(`Bereits aktuell: ${path.relative(ROOT, target)}`);
    return;
  }

  backup(ROOT, BACKUP, target);
  fs.writeFileSync(target, next);
  log(`Geändert: ${path.relative(ROOT, target)}`);
}

updateComparison(
  MULTIPET,
  (frontmatter) =>
    upsertItemOverrides(
      frontmatter,
      "petlibro-granary-dual-feeder",
      {
        tiertrennung:
          "Keine individuelle Tiertrennung; beide Tiere können beide Näpfe erreichen",
        zugangskontrolle:
          "Keine Mikrochip- oder RFID-Zugangskontrolle"
      }
    ),
  [
    'tiertrennung: "Keine individuelle Tiertrennung; beide Tiere können beide Näpfe erreichen"',
    'zugangskontrolle: "Keine Mikrochip- oder RFID-Zugangskontrolle"'
  ]
);

updateComparison(
  SENIOR,
  (frontmatter) =>
    upsertItemOverrides(
      frontmatter,
      "surefeed-microchip-pet-feeder-connect",
      {
        napf:
          "Geschützter 400-ml-Einzelnapf für Nass- und Trockenfutter",
        reinigung:
          "Napf und zugängliche Futterflächen regelmäßig entnehmen beziehungsweise abwischen; elektrische Basis nicht eintauchen"
      }
    ),
  [
    'napf: "Geschützter 400-ml-Einzelnapf für Nass- und Trockenfutter"',
    'reinigung: "Napf und zugängliche Futterflächen regelmäßig entnehmen beziehungsweise abwischen; elektrische Basis nicht eintauchen"'
  ]
);

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");

const read = (name) =>
  fs.readFileSync(
    path.join(APP, "src/content/comparisons", name),
    "utf8"
  );

test("Mehrtiervergleich belegt Tiertrennung und Zugangskontrolle", () => {
  const source = read("beste-futterautomaten-fuer-mehrtierhaushalte.md");

  assert.match(
    source,
    /tiertrennung: "Keine individuelle Tiertrennung; beide Tiere können beide Näpfe erreichen"/
  );

  assert.match(
    source,
    /zugangskontrolle: "Keine Mikrochip- oder RFID-Zugangskontrolle"/
  );
});

test("Seniorenvergleich belegt Napf und Reinigung für SureFeed", () => {
  const source = read("beste-futterautomaten-fuer-seniorenkatzen.md");

  assert.match(
    source,
    /napf: "Geschützter 400-ml-Einzelnapf für Nass- und Trockenfutter"/
  );

  assert.match(
    source,
    /reinigung: "Napf und zugängliche Futterflächen regelmäßig entnehmen beziehungsweise abwischen; elektrische Basis nicht eintauchen"/
  );
});

test("Overrides bleiben auf die zwei betroffenen Produkte und Vergleiche begrenzt", () => {
  const multipet = read("beste-futterautomaten-fuer-mehrtierhaushalte.md");
  const senior = read("beste-futterautomaten-fuer-seniorenkatzen.md");

  assert.equal(
    (multipet.match(/tiertrennung:/g) ?? []).length,
    1
  );

  assert.equal(
    (senior.match(/Geschützter 400-ml-Einzelnapf/g) ?? []).length,
    1
  );
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
packageJson.scripts["test:surefeed-comparison-coverage"] =
  "node --test test/surefeed-comparison-coverage-final-25.10.5.test.mjs";

const nextPackage = JSON.stringify(packageJson, null, 2) + "\n";
const currentPackage = fs.readFileSync(PACKAGE, "utf8");

if (nextPackage !== currentPackage) {
  backup(ROOT, BACKUP, PACKAGE);
  fs.writeFileSync(PACKAGE, nextPackage);
  log(`Geändert: ${path.relative(ROOT, PACKAGE)}`);
} else {
  log(`Bereits aktuell: ${path.relative(ROOT, PACKAGE)}`);
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
  "test:surefeed-comparison-coverage"
]);

runNpm(ROOT, [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "comparison:data:audit:strict"
]);

if (!fs.existsSync(REPORT)) {
  throw new Error(
    `Vergleichsreport fehlt nach Audit: ${path.relative(ROOT, REPORT)}`
  );
}

const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
const remainingFailures = (report.failures ?? []).filter(
  (failure) =>
    String(failure).includes("beste-futterautomaten-fuer-mehrtierhaushalte") ||
    String(failure).includes("beste-futterautomaten-fuer-seniorenkatzen")
);

if (remainingFailures.length > 0) {
  throw new Error(
    "Die zwei Zielvergleiche blockieren weiterhin:\n" +
      remainingFailures.join("\n")
  );
}

log("Die zwei Zielvergleiche erfüllen die Mindestabdeckung.");

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

log("Vergleichs-Audit, Release-Gate und Build erfolgreich.");
log("Fertig.");
