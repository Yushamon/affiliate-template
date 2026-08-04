#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-cat-flap-schema-blockers-25.11.4";

function log(message) {
  console.log(`[${PATCH}] ${message}`);
}

function findRoot(start) {
  let current = path.resolve(start);
  for (let depth = 0; depth < 16; depth += 1) {
    if (fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

function hasConflictMarkers(source) {
  return /^(<<<<<<<|=======|>>>>>>>)(?: .*)?$/m.test(source);
}

function splitDocument(source, label) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  if (lines[0]?.trim() !== "---") throw new Error(`${label}: Frontmatter-Start fehlt.`);
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (end < 0) throw new Error(`${label}: Frontmatter-Ende fehlt.`);
  return {
    frontmatter: lines.slice(1, end),
    body: lines.slice(end + 1),
  };
}

function keyOf(line) {
  if (!line || /^\s/.test(line)) return null;
  const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):(?:\s|$)/);
  return match?.[1] ?? null;
}

function rangeOf(lines, key) {
  const start = lines.findIndex((line) => keyOf(line) === key);
  if (start < 0) return null;

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (keyOf(lines[index])) {
      end = index;
      break;
    }
  }
  return { start, end };
}

function setScalar(lines, key, value, beforeKey = null) {
  const range = rangeOf(lines, key);
  if (range) {
    return [...lines.slice(0, range.start), `${key}: ${value}`, ...lines.slice(range.end)];
  }

  if (beforeKey) {
    const before = rangeOf(lines, beforeKey);
    if (before) {
      return [...lines.slice(0, before.start), `${key}: ${value}`, ...lines.slice(before.start)];
    }
  }

  return [...lines, `${key}: ${value}`];
}

function setNestedScalar(lines, parentKey, childPath, value) {
  const parent = rangeOf(lines, parentKey);
  if (!parent) {
    throw new Error(`${parentKey}: übergeordneter Block fehlt.`);
  }

  const pathParts = childPath.split(".");
  const directChild = pathParts[0];
  const parentIndent = 2;

  if (pathParts.length === 1) {
    let start = -1;
    for (let index = parent.start + 1; index < parent.end; index += 1) {
      if (lines[index].startsWith(" ".repeat(parentIndent) + directChild + ":")) {
        start = index;
        break;
      }
    }

    if (start >= 0) {
      let end = start + 1;
      while (end < parent.end && /^\s{4,}/.test(lines[end])) end += 1;
      return [...lines.slice(0, start), `  ${directChild}: ${value}`, ...lines.slice(end)];
    }

    return [
      ...lines.slice(0, parent.end),
      `  ${directChild}: ${value}`,
      ...lines.slice(parent.end),
    ];
  }

  const childBlock = directChild;
  let blockStart = -1;
  let blockEnd = parent.end;

  for (let index = parent.start + 1; index < parent.end; index += 1) {
    if (lines[index].startsWith(`  ${childBlock}:`)) {
      blockStart = index;
      for (let cursor = index + 1; cursor < parent.end; cursor += 1) {
        if (/^  [A-Za-z][A-Za-z0-9_-]*:/.test(lines[cursor])) {
          blockEnd = cursor;
          break;
        }
      }
      break;
    }
  }

  if (blockStart < 0) {
    return [
      ...lines.slice(0, parent.end),
      `  ${childBlock}:`,
      `    ${pathParts[1]}: ${value}`,
      ...lines.slice(parent.end),
    ];
  }

  const nestedKey = pathParts[1];
  for (let index = blockStart + 1; index < blockEnd; index += 1) {
    if (lines[index].startsWith(`    ${nestedKey}:`)) {
      return [
        ...lines.slice(0, index),
        `    ${nestedKey}: ${value}`,
        ...lines.slice(index + 1),
      ];
    }
  }

  return [
    ...lines.slice(0, blockEnd),
    `    ${nestedKey}: ${value}`,
    ...lines.slice(blockEnd),
  ];
}

function serialize(frontmatter, body) {
  const clean = [...body];
  while (clean.length && clean.at(-1) === "") clean.pop();
  return ["---", ...frontmatter, "---", ...clean, ""].join("\n");
}

function scalar(lines, key) {
  const range = rangeOf(lines, key);
  if (!range) return undefined;
  const line = lines[range.start];
  return line.slice(line.indexOf(":") + 1).trim();
}

function writeIfChanged(file, next) {
  const previous = fs.existsSync(file)
    ? fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n")
    : null;

  if (previous === next) {
    log(`Bereits aktuell: ${path.relative(ROOT, file)}`);
    return false;
  }

  fs.writeFileSync(file, next, "utf8");
  log(`Geändert: ${path.relative(ROOT, file)}`);
  return true;
}

function run(command, args, label, cwd = ROOT) {
  log(`Prüfe: ${label}`);
  const executable =
    process.platform === "win32" && command === "npm"
      ? "npm.cmd"
      : command;

  const result = spawnSync(executable, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} fehlgeschlagen (Exit ${result.status}).`);
  }

  log(`BESTANDEN: ${label}`);
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const FILES = {
  sureflap: path.join(
    APP,
    "src",
    "content",
    "products",
    "sureflap-mikrochip-katzenklappe-connect.md",
  ),
  petporte: path.join(
    APP,
    "src",
    "content",
    "products",
    "petsafe-petporte-smart-flap.md",
  ),
  package: path.join(APP, "package.json"),
  test: path.join(APP, "test", "cat-flap-schema-blockers-25.11.4.test.mjs"),
};

for (const [label, file] of Object.entries({
  SureFlap: FILES.sureflap,
  Petporte: FILES.petporte,
  packageJson: FILES.package,
})) {
  if (!fs.existsSync(file)) {
    throw new Error(`${label}: Datei fehlt: ${path.relative(ROOT, file)}`);
  }
  const source = fs.readFileSync(file, "utf8");
  if (hasConflictMarkers(source)) {
    throw new Error(`${label}: ungelöste Git-Konfliktmarker.`);
  }
}

let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync(FILES.package, "utf8"));
} catch (error) {
  throw new Error(
    `package.json ist ungültig: ${error instanceof Error ? error.message : String(error)}`,
  );
}

for (const script of ["lint:content", "audit:products:strict", "build"]) {
  if (typeof packageJson.scripts?.[script] !== "string") {
    throw new Error(`Erforderliches npm-Skript fehlt: ${script}`);
  }
}

const TARGETS = [FILES.sureflap, FILES.petporte, FILES.test];
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

fs.mkdirSync(BACKUP, { recursive: true });
for (const file of TARGETS) {
  if (!fs.existsSync(file)) continue;
  const destination = path.join(BACKUP, path.relative(ROOT, file));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
}
log(`Backup: ${path.relative(ROOT, BACKUP)}`);

const rollback = () => {
  for (const file of TARGETS) {
    const backup = path.join(BACKUP, path.relative(ROOT, file));
    if (fs.existsSync(backup)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(backup, file);
    } else if (file === FILES.test && fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
    }
  }
};

try {
  const sureflapDoc = splitDocument(
    fs.readFileSync(FILES.sureflap, "utf8"),
    "SureFlap",
  );
  let sureflapFm = [...sureflapDoc.frontmatter];
  sureflapFm = setScalar(
    sureflapFm,
    "availability",
    '"temporarily-unavailable"',
    "availabilityReason",
  );
  sureflapFm = setScalar(
    sureflapFm,
    "maintenanceStatus",
    '"required"',
    "price",
  );
  sureflapFm = setScalar(sureflapFm, "rating", "0", "score");
  const nextSureflap = serialize(sureflapFm, sureflapDoc.body);

  const petporteDoc = splitDocument(
    fs.readFileSync(FILES.petporte, "utf8"),
    "Petporte",
  );
  let petporteFm = [...petporteDoc.frontmatter];
  petporteFm = setNestedScalar(petporteFm, "price", "status", '"unknown"');
  petporteFm = setNestedScalar(
    petporteFm,
    "price",
    "source.type",
    '"manual"',
  );
  petporteFm = setScalar(petporteFm, "priceState", '"unknown"', "priceUpdated");
  petporteFm = setScalar(
    petporteFm,
    "maintenanceStatus",
    '"required"',
    "price",
  );
  petporteFm = setScalar(petporteFm, "rating", "0", "score");
  const nextPetporte = serialize(petporteFm, petporteDoc.body);

  const parsedSureflap = splitDocument(nextSureflap, "SureFlap Zielzustand");
  const parsedPetporte = splitDocument(nextPetporte, "Petporte Zielzustand");

  if (scalar(parsedSureflap.frontmatter, "score") !== undefined) {
    throw new Error("SureFlap: Score darf nicht ergänzt werden.");
  }
  if (scalar(parsedPetporte.frontmatter, "score") !== undefined) {
    throw new Error("Petporte: Score darf nicht ergänzt werden.");
  }

  for (const [label, value] of [
    ["SureFlap availability", nextSureflap.includes('availability: "temporarily-unavailable"')],
    ["SureFlap maintenanceStatus", nextSureflap.includes('maintenanceStatus: "required"')],
    ["SureFlap rating", nextSureflap.includes("rating: 0")],
    ["Petporte price.status", nextPetporte.includes('  status: "unknown"')],
    ["Petporte price.source.type", nextPetporte.includes('    type: "manual"')],
    ["Petporte priceState", nextPetporte.includes('priceState: "unknown"')],
    ["Petporte maintenanceStatus", nextPetporte.includes('maintenanceStatus: "required"')],
    ["Petporte rating", nextPetporte.includes("rating: 0")],
  ]) {
    if (!value) throw new Error(`${label}: Zielzustand fehlt.`);
  }

  writeIfChanged(FILES.sureflap, nextSureflap);
  writeIfChanged(FILES.petporte, nextPetporte);

  const testSource = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const sureflap = fs.readFileSync(
  path.join(process.cwd(), "src/content/products/sureflap-mikrochip-katzenklappe-connect.md"),
  "utf8",
);
const petporte = fs.readFileSync(
  path.join(process.cwd(), "src/content/products/petsafe-petporte-smart-flap.md"),
  "utf8",
);

test("SureFlap besitzt gültige Statuswerte", () => {
  assert.match(sureflap, /^availability: "temporarily-unavailable"$/m);
  assert.match(sureflap, /^maintenanceStatus: "required"$/m);
  assert.match(sureflap, /^rating: 0$/m);
  assert.doesNotMatch(sureflap, /^score:/m);
});

test("Petporte besitzt gültige Preis- und Wartungswerte", () => {
  assert.match(petporte, /^priceState: "unknown"$/m);
  assert.match(petporte, /^maintenanceStatus: "required"$/m);
  assert.match(petporte, /^rating: 0$/m);
  assert.match(petporte, /^  status: "unknown"$/m);
  assert.match(petporte, /^    type: "manual"$/m);
  assert.doesNotMatch(petporte, /^score:/m);
});

test("ungültige Altwerte sind entfernt", () => {
  assert.doesNotMatch(sureflap, /^availability: "unavailable"$/m);
  assert.doesNotMatch(sureflap, /^maintenanceStatus: "monitored"$/m);
  assert.doesNotMatch(petporte, /^maintenanceStatus: "monitored"$/m);
});
`;

  writeIfChanged(FILES.test, testSource);

  run(
    process.execPath,
    ["--test", path.relative(APP, FILES.test)],
    "Schema-Blocker-Test",
    APP,
  );
  run(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "lint:content"],
    "Content-Lint",
  );
  run(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "audit:products:strict"],
    "Produkt-Audit",
  );
  run(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "build"],
    "Astro-Build",
  );

  const report = path.join(
    APP,
    "reports",
    "products",
    "cat-flap-schema-blockers-25.11.4.json",
  );
  fs.mkdirSync(path.dirname(report), { recursive: true });
  fs.writeFileSync(
    report,
    `${JSON.stringify(
      {
        patch: PATCH,
        status: "passed",
        fixedProducts: [
          "sureflap-mikrochip-katzenklappe-connect",
          "petsafe-petporte-smart-flap",
        ],
        editorialScoresAdded: false,
        recommendationsChanged: false,
        validation: [
          "Schema-Blocker-Test",
          "lint:content",
          "audit:products:strict",
          "build",
        ],
        backup: path.relative(ROOT, BACKUP),
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  log(`Report: ${path.relative(ROOT, report)}`);
  log("Abgeschlossen.");
} catch (error) {
  rollback();
  log(`FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  log("Änderungen wurden zurückgerollt.");
  process.exitCode = 1;
}
