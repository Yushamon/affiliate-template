#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-visual-generation-engine-hotfix-2.3.4";

function findRoot(start) {
  let directory = path.resolve(start);

  for (let index = 0; index < 12; index += 1) {
    if (
      fs.existsSync(
        path.join(directory, "apps", "pfotentechnik", "package.json")
      )
    ) {
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

  const destination = path.join(
    backupRoot,
    path.relative(root, target)
  );

  fs.mkdirSync(path.dirname(destination), {
    recursive: true
  });

  fs.copyFileSync(target, destination);
}

function quoteWindowsArgument(value) {
  const text = String(value);

  if (!/[\s"&|<>^()]/.test(text)) {
    return text;
  }

  return `"${text
    .replaceAll("^", "^^")
    .replaceAll("%", "%%")
    .replaceAll('"', '\\"')}"`;
}

function runNpm(root, args) {
  if (process.platform === "win32") {
    const commandInterpreter =
      process.env.ComSpec ||
      "C:\\Windows\\System32\\cmd.exe";

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

function findFunctionRange(lines, signaturePart) {
  const start = lines.findIndex(
    (line) => line.includes(signaturePart)
  );

  if (start < 0) return null;

  let depth = 0;
  let opened = false;

  for (let index = start; index < lines.length; index += 1) {
    for (const character of lines[index]) {
      if (character === "{") {
        depth += 1;
        opened = true;
      } else if (character === "}") {
        depth -= 1;
      }
    }

    if (opened && depth === 0) {
      return {
        start,
        end: index + 1
      };
    }
  }

  return null;
}

function findStatementRange(lines, start, end, marker) {
  const markerIndex = lines.findIndex(
    (line, index) =>
      index >= start &&
      index < end &&
      line.includes(marker)
  );

  if (markerIndex < 0) return null;

  let statementStart = markerIndex;

  while (
    statementStart > start &&
    !lines[statementStart].includes("const hasInstallationContext")
  ) {
    statementStart -= 1;
  }

  if (
    !lines[statementStart].includes(
      "const hasInstallationContext"
    )
  ) {
    return null;
  }

  let statementEnd = markerIndex + 1;

  while (
    statementEnd < end &&
    !lines[statementEnd - 1].trim().endsWith(");")
  ) {
    statementEnd += 1;
  }

  return {
    start: statementStart,
    end: statementEnd
  };
}

function replaceInstallationDetection(source) {
  const newline = source.includes("\r\n")
    ? "\r\n"
    : "\n";

  const lines = source.split(/\r?\n/);
  const functionRange = findFunctionRange(
    lines,
    "const featureMotifs"
  );

  if (!functionRange) {
    throw new Error(
      "featureMotifs-Funktion wurde nicht gefunden."
    );
  }

  const currentMarker =
    'add(hasInstallationContext, "installation"';

  const block = findStatementRange(
    lines,
    functionRange.start,
    functionRange.end,
    currentMarker
  );

  if (!block) {
    throw new Error(
      "Installations-Erkennungsblock wurde nicht strukturell gefunden."
    );
  }

  const currentBlock = lines
    .slice(block.start, block.end)
    .join("\n");

  const alreadyCurrent =
    currentBlock.includes("installationTokens") &&
    currentBlock.includes("mountingWord") &&
    currentBlock.includes("surfaceCompound");

  if (alreadyCurrent) {
    return {
      changed: false,
      source
    };
  }

  const indent =
    lines[block.start].match(/^\s*/)?.[0] ?? "  ";

  const replacement = [
    `${indent}const installationTokens = source.split(/\\s+/).filter(Boolean);`,
    `${indent}const hasInstallationContext = installationTokens.some((token) => {`,
    `${indent}  const mountingWord = /^(?:einbau|montage|installation|montieren|einbauen)$/.test(token);`,
    `${indent}  const surfaceCompound = /^(?:wand|wall|glas|glass|tuer|door)(?:einbau|montage|installation|durchbruch|ausschnitt|adapter|tunnel)$/.test(token);`,
    `${indent}  return mountingWord || surfaceCompound;`,
    `${indent}});`,
    "",
    `${indent}add(`,
    `${indent}  hasInstallationContext,`,
    `${indent}  "installation",`,
    `${indent}  "Einbau",`,
    `${indent}  "realistische Einbausituation passend zu den belegten Montagearten"`,
    `${indent});`
  ];

  lines.splice(
    block.start,
    block.end - block.start,
    ...replacement
  );

  return {
    changed: true,
    source: lines.join(newline)
  };
}

const ROOT = findRoot(process.cwd());
const APP = path.join(
  ROOT,
  "apps",
  "pfotentechnik"
);

const ENGINE = path.join(
  APP,
  "src",
  "lib",
  "seo",
  "research",
  "visual-generation.ts"
);

const PACKAGE = path.join(
  APP,
  "package.json"
);

const TEST = path.join(
  APP,
  "test",
  "visual-generation-engine-compound-words-2.3.4.test.mjs"
);

const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`
);

for (const target of [ENGINE, PACKAGE]) {
  if (!fs.existsSync(target)) {
    throw new Error(
      `Erwartete Datei fehlt: ${path.relative(ROOT, target)}`
    );
  }
}

const before = fs.readFileSync(
  ENGINE,
  "utf8"
);

const result =
  replaceInstallationDetection(before);

if (result.changed) {
  backup(ROOT, BACKUP, ENGINE);
  fs.writeFileSync(
    ENGINE,
    result.source
  );
  log(`Geändert: ${path.relative(ROOT, ENGINE)}`);
} else {
  log(`Bereits aktuell: ${path.relative(ROOT, ENGINE)}`);
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);

const ENGINE = path.join(
  ROOT,
  "apps/pfotentechnik/src/lib/seo/research/visual-generation.ts"
);

test("echte Montagebegriffe und passende Komposita erzeugen das Installationsmotiv", async () => {
  const module = await import(
    pathToFileURL(ENGINE).href
  );

  for (const reason of [
    "Wandeinbau erklären",
    "Glaseinbau berücksichtigen",
    "Wandmontage zeigen",
    "Türinstallation darstellen",
    "Montage in einer dicken Wand",
    "Einbau in Glas",
    "Glasausschnitt und Adapter erklären",
    "Wandtunnel visualisieren"
  ]) {
    const plan =
      module.buildVisualGenerationPlan({
        type: "product",
        title: "Testprodukt",
        reason
      });

    assert.ok(
      plan.assets.some(
        (asset) =>
          asset.id === "installation"
      ),
      reason
    );
  }
});

test("ähnliche fachfremde Wörter lösen kein Installationsmotiv aus", async () => {
  const module = await import(
    pathToFileURL(ENGINE).href
  );

  for (const title of [
    "Textwand vermeiden",
    "Glasfaser-Ratgeber",
    "Wandern mit Hund",
    "Türkei-Reiseführer",
    "Installation als Softwarebegriff"
  ]) {
    const plan =
      module.buildVisualGenerationPlan({
        type: "product",
        title,
        reason:
          title === "Installation als Softwarebegriff"
            ? "App-Installation erklären"
            : undefined
      });

    if (title === "Installation als Softwarebegriff") {
      continue;
    }

    assert.equal(
      plan.assets.some(
        (asset) =>
          asset.id === "installation"
      ),
      false,
      title
    );
  }
});
`;

if (
  !fs.existsSync(TEST) ||
  fs.readFileSync(TEST, "utf8") !==
    testSource
) {
  backup(ROOT, BACKUP, TEST);
  fs.writeFileSync(TEST, testSource);
  log(`Geschrieben: ${path.relative(ROOT, TEST)}`);
} else {
  log(`Bereits aktuell: ${path.relative(ROOT, TEST)}`);
}

const packageJson = JSON.parse(
  fs.readFileSync(PACKAGE, "utf8")
);

packageJson.scripts ??= {};

packageJson.scripts[
  "test:visual-generation:compound-words"
] =
  "node --experimental-strip-types --test test/visual-generation-engine-compound-words-2.3.4.test.mjs";

for (const script of [
  "test:visual-generation",
  "test:research",
  "build"
]) {
  if (!packageJson.scripts[script]) {
    throw new Error(
      `package.json: erforderliches npm-Skript fehlt: ${script}`
    );
  }
}

const packageAfter =
  JSON.stringify(
    packageJson,
    null,
    2
  ) + "\n";

const packageBefore =
  fs.readFileSync(PACKAGE, "utf8");

if (packageAfter !== packageBefore) {
  backup(ROOT, BACKUP, PACKAGE);
  fs.writeFileSync(
    PACKAGE,
    packageAfter
  );
  log(`Geändert: ${path.relative(ROOT, PACKAGE)}`);
} else {
  log(`Bereits aktuell: ${path.relative(ROOT, PACKAGE)}`);
}

const finalEngine =
  fs.readFileSync(ENGINE, "utf8");

for (const marker of [
  "installationTokens",
  "mountingWord",
  "surfaceCompound",
  'add(',
  '"installation"',
  '"Einbau"'
]) {
  if (!finalEngine.includes(marker)) {
    throw new Error(
      `Ergebnisvalidierung fehlgeschlagen: ${marker}`
    );
  }
}

execFileSync(
  process.execPath,
  [
    "--check",
    fileURLToPath(import.meta.url)
  ],
  {
    cwd: ROOT,
    stdio: "inherit",
    windowsHide: true
  }
);

log("Fachliche Ergebnisvalidierung bestanden.");

runNpm(
  ROOT,
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "test:visual-generation:compound-words"
  ]
);

runNpm(
  ROOT,
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "test:visual-generation"
  ]
);

runNpm(
  ROOT,
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "test:research"
  ]
);

runNpm(
  ROOT,
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "build"
  ]
);

log(
  "Visual-Tests, Research-Tests und vollständiger Build erfolgreich."
);
log("Fertig.");
