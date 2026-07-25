#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ID = "pfotentechnik-comparison-units-filter-ux-1.0.0";
const CHECK = process.argv.includes("--check");
const SKIP_BUILD = process.argv.includes("--skip-build");

const PLATFORM = "apps/pfotentechnik/src/domain/comparison/comparisonDataPlatform.ts";
const FOUNTAIN = "apps/pfotentechnik/src/content/products/oneisall-3-5l-cordless-fountain.md";
const MARKER = "PT_COMPARISON_VALUE_SEMANTICS_1_0_0";

const fail = (message) => { throw new Error(message); };

function findRoot() {
  let current = process.cwd();
  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik"))
    ) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  fail("Repository-Hauptverzeichnis nicht gefunden.");
}

function run(root, command, args) {
  let result;
  if (process.platform === "win32") {
    const shell = process.env.ComSpec || "C:\\Windows\\System32\\cmd.exe";
    const line = [command, ...args]
      .map((value) => /[\s"&|<>^()%!]/.test(String(value))
        ? `"${String(value).replaceAll('"', '""')}"`
        : String(value))
      .join(" ");
    result = spawnSync(shell, ["/d", "/s", "/c", line], {
      cwd: root,
      stdio: "inherit",
      shell: false
    });
  } else {
    result = spawnSync(command, args, {
      cwd: root,
      stdio: "inherit",
      shell: false
    });
  }
  if (result.error) fail(result.error.message);
  if (result.status !== 0) {
    fail(`${command} ${args.join(" ")} fehlgeschlagen (Exit ${result.status}).`);
  }
}

function patchPlatform(source) {
  if (source.includes(MARKER)) return source;

  const anchor = `const formatValue = (
  value: unknown,
  criterion: CriterionLike
): string | undefined => {`;

  if (!source.includes(anchor)) {
    fail("Formatter-Anker in comparisonDataPlatform.ts nicht gefunden.");
  }

  const helper = `
// ${MARKER}
const formatSemanticComparisonValue = (
  value: string,
  criterion: CriterionLike
): string => {
  const normalizedCriterion = normalizeKey(criterion.key);
  const trimmed = value.trim();

  if (!trimmed) return trimmed;

  const plainNumber = trimmed.match(/^\\d+(?:[.,]\\d+)?$/);

  if (plainNumber) {
    const formattedNumber = new Intl.NumberFormat("de-DE", {
      maximumFractionDigits: 2
    }).format(Number(trimmed.replace(",", ".")));

    if (normalizedCriterion === "akkulaufzeit") {
      return \`\${formattedNumber} Tage\`;
    }

    if (normalizedCriterion === "gewicht") {
      return \`\${formattedNumber} g\`;
    }
  }

  if (
    normalizedCriterion === "uebertragung" &&
    /^(lte|4g|5g|vhf|gsm)$/i.test(trimmed)
  ) {
    return trimmed.toLocaleUpperCase("de-DE");
  }

  if (
    normalizedCriterion === "filter" &&
    /^f(?:ü|ue)nfstufig$/i.test(trimmed)
  ) {
    return "5-stufige Wasserfilterung";
  }

  return trimmed;
};

`;

  let next = source.replace(anchor, helper + anchor);

  const numberAnchor =
    `    return criterion.unit ? \`\${formatted} \${criterion.unit}\` : formatted;`;

  if (!next.includes(numberAnchor)) {
    fail("Zahlenformat-Anker nicht gefunden.");
  }

  next = next.replace(
    numberAnchor,
    `    const withUnit = criterion.unit
      ? \`\${formatted} \${criterion.unit}\`
      : formatted;
    return formatSemanticComparisonValue(withUnit, criterion);`
  );

  const stringAnchor = `  return String(value).trim() || undefined;`;

  if (!next.includes(stringAnchor)) {
    fail("Textformat-Anker nicht gefunden.");
  }

  next = next.replace(
    stringAnchor,
    `  const formatted = formatSemanticComparisonValue(
    String(value),
    criterion
  );
  return formatted || undefined;`
  );

  return next;
}

function patchFountain(source) {
  return source.replace(
    '- { label: Filter, value: "fünfstufig" }',
    '- { label: Filter, value: "5-stufige Wasserfilterung" }'
  );
}

const root = findRoot();
const platformPath = path.join(root, PLATFORM);
const fountainPath = path.join(root, FOUNTAIN);

for (const file of [platformPath, fountainPath]) {
  if (!fs.existsSync(file)) fail(`Datei fehlt: ${path.relative(root, file)}`);
}

const originalPlatform = fs.readFileSync(platformPath, "utf8");
const originalFountain = fs.readFileSync(fountainPath, "utf8");
const nextPlatform = patchPlatform(originalPlatform);
const nextFountain = patchFountain(originalFountain);

console.log(`[${ID}] Repository: ${root}`);
console.log(`[${ID}] ${nextPlatform === originalPlatform ? "OK" : "ÄNDERN"}: ${PLATFORM}`);
console.log(`[${ID}] ${nextFountain === originalFountain ? "OK" : "ÄNDERN"}: ${FOUNTAIN}`);

if (CHECK) {
  console.log(`[${ID}] Vorprüfung erfolgreich.`);
  process.exit(0);
}

if (nextPlatform === originalPlatform && nextFountain === originalFountain) {
  console.log(`[${ID}] Bereits vollständig installiert.`);
  process.exit(0);
}

const backupRoot = path.join(
  root,
  ".patch-backups",
  `${ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

for (const file of [platformPath, fountainPath]) {
  const destination = path.join(backupRoot, path.relative(root, file));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
}

try {
  fs.writeFileSync(platformPath, nextPlatform, "utf8");
  fs.writeFileSync(fountainPath, nextFountain, "utf8");

  if (!SKIP_BUILD) run(root, "npm", ["run", "build:pfotentechnik"]);

  console.log(`[${ID}] Fix erfolgreich installiert.`);
} catch (error) {
  console.error(`[${ID}] Fehler – Rollback wird ausgeführt.`);
  for (const file of [platformPath, fountainPath]) {
    const backup = path.join(backupRoot, path.relative(root, file));
    if (fs.existsSync(backup)) fs.copyFileSync(backup, file);
  }
  console.error(`[${ID}] Rollback abgeschlossen.`);
  throw error;
}
