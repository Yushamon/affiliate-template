#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ID = "pfotentechnik-comparison-units-filter-ux-hotfix-1.0.1";
const CHECK = process.argv.includes("--check");
const SKIP_BUILD = process.argv.includes("--skip-build");

const PLATFORM =
  "apps/pfotentechnik/src/domain/comparison/comparisonDataPlatform.ts";

const FOUNTAIN =
  "apps/pfotentechnik/src/content/products/oneisall-3-5l-cordless-fountain.md";

const MARKER = "PT_COMPARISON_VALUE_SEMANTICS_1_0_1";

function fail(message) {
  throw new Error(message);
}

function findRoot() {
  let current = process.cwd();

  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik"))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  fail("Repository-Hauptverzeichnis nicht gefunden.");
}

function run(root, command, args) {
  let result;

  if (process.platform === "win32") {
    const shell =
      process.env.ComSpec ||
      path.join(
        process.env.SystemRoot || "C:\\Windows",
        "System32",
        "cmd.exe"
      );

    const commandLine = [command, ...args]
      .map((value) =>
        /[\s"&|<>^()%!]/.test(String(value))
          ? `"${String(value).replaceAll('"', '""')}"`
          : String(value)
      )
      .join(" ");

    result = spawnSync(
      shell,
      ["/d", "/s", "/c", commandLine],
      {
        cwd: root,
        stdio: "inherit",
        shell: false
      }
    );
  } else {
    result = spawnSync(command, args, {
      cwd: root,
      stdio: "inherit",
      shell: false
    });
  }

  if (result.error) {
    fail(result.error.message);
  }

  if (result.status !== 0) {
    fail(
      `${command} ${args.join(" ")} fehlgeschlagen ` +
      `(Exit ${result.status}).`
    );
  }
}

function findFunctionRange(source, functionName) {
  const patterns = [
    new RegExp(
      `const\\s+${functionName}\\s*=\\s*\\([\\s\\S]*?\\)\\s*:\\s*[^=]+=>\\s*\\{`
    ),
    new RegExp(
      `function\\s+${functionName}\\s*\\([\\s\\S]*?\\)\\s*(?::\\s*[^\\{]+)?\\{`
    )
  ];

  let match = null;

  for (const pattern of patterns) {
    match = pattern.exec(source);
    if (match) break;
  }

  if (!match) {
    fail(`Funktion ${functionName} wurde nicht gefunden.`);
  }

  const start = match.index;
  const openBrace = source.indexOf("{", start);

  if (openBrace < 0) {
    fail(`Öffnende Klammer von ${functionName} fehlt.`);
  }

  let depth = 0;
  let quote = null;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = openBrace; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === quote) {
        quote = null;
      }

      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") depth += 1;

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        let end = index + 1;

        while (/\s/.test(source[end] ?? "")) {
          end += 1;
        }

        if (source[end] === ";") {
          end += 1;
        }

        return { start, end };
      }
    }
  }

  fail(`Schließende Klammer von ${functionName} wurde nicht gefunden.`);
}

function patchPlatform(source) {
  if (source.includes(MARKER)) {
    return source;
  }

  const functionRange = findFunctionRange(source, "formatValue");

  const replacement = `// ${MARKER}
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

const formatValue = (
  value: unknown,
  criterion: CriterionLike
): string | undefined => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  if (criterion.format === "boolean") {
    return value ? "Ja" : "Nein";
  }

  if (Array.isArray(value)) {
    const list = value
      .filter(
        (item) =>
          item !== undefined &&
          item !== null &&
          item !== ""
      )
      .map(String);

    if (!list.length) return undefined;

    return formatSemanticComparisonValue(
      list.join(", "),
      criterion
    );
  }

  if (typeof value === "boolean") {
    return value ? "Ja" : "Nein";
  }

  if (typeof value === "number") {
    const formatted = new Intl.NumberFormat("de-DE", {
      maximumFractionDigits: 2
    }).format(value);

    const withUnit = criterion.unit
      ? \`\${formatted} \${criterion.unit}\`
      : formatted;

    return formatSemanticComparisonValue(
      withUnit,
      criterion
    );
  }

  const formatted = formatSemanticComparisonValue(
    String(value),
    criterion
  );

  return formatted || undefined;
};`;

  return (
    source.slice(0, functionRange.start) +
    replacement +
    source.slice(functionRange.end)
  );
}

function patchFountain(source) {
  return source
    .replace(
      /(\{\s*label:\s*["']?Filter["']?\s*,\s*value:\s*)["']fünfstufig["']/i,
      '$1"5-stufige Wasserfilterung"'
    )
    .replace(
      /(\{\s*label:\s*["']?Filter["']?\s*,\s*value:\s*)["']fuenfstufig["']/i,
      '$1"5-stufige Wasserfilterung"'
    );
}

const root = findRoot();
const platformPath = path.join(root, PLATFORM);
const fountainPath = path.join(root, FOUNTAIN);

for (const file of [platformPath, fountainPath]) {
  if (!fs.existsSync(file)) {
    fail(`Datei fehlt: ${path.relative(root, file)}`);
  }
}

const originalPlatform =
  fs.readFileSync(platformPath, "utf8");

const originalFountain =
  fs.readFileSync(fountainPath, "utf8");

const nextPlatform =
  patchPlatform(originalPlatform);

const nextFountain =
  patchFountain(originalFountain);

if (
  !nextPlatform.includes(MARKER) ||
  !nextPlatform.includes(
    'return `${formattedNumber} Tage`;'
  ) ||
  !nextPlatform.includes(
    'return `${formattedNumber} g`;'
  )
) {
  fail("Die zentrale Formatter-Erweiterung ist unvollständig.");
}

console.log(`[${ID}] Repository: ${root}`);

console.log(
  `[${ID}] ${
    nextPlatform === originalPlatform
      ? "OK"
      : "ÄNDERN"
  }: ${PLATFORM}`
);

console.log(
  `[${ID}] ${
    nextFountain === originalFountain
      ? "OK"
      : "ÄNDERN"
  }: ${FOUNTAIN}`
);

if (CHECK) {
  console.log(`[${ID}] Strukturelle Vorprüfung erfolgreich.`);
  process.exit(0);
}

if (
  nextPlatform === originalPlatform &&
  nextFountain === originalFountain
) {
  console.log(`[${ID}] Bereits vollständig installiert.`);
  process.exit(0);
}

const backupRoot = path.join(
  root,
  ".patch-backups",
  `${ID}-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`
);

for (const file of [platformPath, fountainPath]) {
  const destination = path.join(
    backupRoot,
    path.relative(root, file)
  );

  fs.mkdirSync(path.dirname(destination), {
    recursive: true
  });

  fs.copyFileSync(file, destination);
}

try {
  fs.writeFileSync(
    platformPath,
    nextPlatform,
    "utf8"
  );

  fs.writeFileSync(
    fountainPath,
    nextFountain,
    "utf8"
  );

  if (!SKIP_BUILD) {
    run(root, "npm", [
      "run",
      "build:pfotentechnik"
    ]);
  }

  console.log(`[${ID}] Fix erfolgreich installiert.`);
  console.log(`[${ID}] Akkulaufzeit: Zahl → Tage`);
  console.log(`[${ID}] Gewicht: Zahl → g`);
  console.log(`[${ID}] Übertragung: LTE/4G/5G/VHF/GSM`);
  console.log(`[${ID}] Filter: 5-stufige Wasserfilterung`);
} catch (error) {
  console.error(
    `[${ID}] Fehler – Rollback wird ausgeführt.`
  );

  for (const file of [platformPath, fountainPath]) {
    const backup = path.join(
      backupRoot,
      path.relative(root, file)
    );

    if (fs.existsSync(backup)) {
      fs.copyFileSync(backup, file);
    }
  }

  console.error(`[${ID}] Rollback abgeschlossen.`);
  throw error;
}
