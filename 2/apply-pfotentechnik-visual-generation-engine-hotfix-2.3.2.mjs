#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-visual-generation-engine-hotfix-2.3.2";

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
    const command = ["npm", ...args].map(quoteWindowsArgument).join(" ");

    execFileSync(commandInterpreter, ["/d", "/s", "/c", command], {
      cwd: root,
      stdio: "inherit",
      windowsHide: true
    });
    return;
  }

  execFileSync("npm", args, {
    cwd: root,
    stdio: "inherit"
  });
}

function replaceInstallationMatcher(source, label) {
  const oldLine =
    '  add(/\\\\b(wand|wall|glas|glass|einbau|installation)\\\\b/.test(source), "installation", "Einbau", "realistische Einbausituation passend zu den belegten Montagearten");';

  const newBlock = `  const hasInstallationContext =
    /(?:^|\\\\s)(?:wand|wall|glas|glass|tuer|door)[a-z0-9]*(?:\\\\s|$)/.test(source) ||
    /(?:^|\\\\s)[a-z0-9]*(?:einbau|montage|installation)[a-z0-9]*(?:\\\\s|$)/.test(source);

  add(hasInstallationContext, "installation", "Einbau", "realistische Einbausituation passend zu den belegten Montagearten");`;

  if (source.includes(newBlock)) {
    return { source, changed: false };
  }

  if (!source.includes(oldLine)) {
    throw new Error(`${label}: alter Installations-Matcher nicht gefunden.`);
  }

  return {
    source: source.replace(oldLine, newBlock),
    changed: true
  };
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const ENGINE = path.join(APP, "src", "lib", "seo", "research", "visual-generation.ts");
const PACKAGE = path.join(APP, "package.json");
const TEST = path.join(APP, "test", "visual-generation-engine-compound-words-2.3.2.test.mjs");
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

for (const target of [ENGINE, PACKAGE]) {
  if (!fs.existsSync(target)) {
    throw new Error(`Erwartete Datei fehlt: ${path.relative(ROOT, target)}`);
  }
}

const engineBefore = fs.readFileSync(ENGINE, "utf8");
const engineResult = replaceInstallationMatcher(engineBefore, "Visual Engine");

if (engineResult.changed) {
  backup(ROOT, BACKUP, ENGINE);
  fs.writeFileSync(ENGINE, engineResult.source);
  log(`Geändert: ${path.relative(ROOT, ENGINE)}`);
} else {
  log(`Bereits aktuell: ${path.relative(ROOT, ENGINE)}`);
}

for (const directory of ["2", "3"]) {
  for (const filename of [
    "apply-pfotentechnik-visual-generation-engine-2.3.0.mjs",
    "apply-pfotentechnik-visual-generation-engine-2.3.1.mjs"
  ]) {
    const target = path.join(ROOT, directory, filename);
    if (!fs.existsSync(target)) continue;

    const before = fs.readFileSync(target, "utf8");

    try {
      const result = replaceInstallationMatcher(before, path.relative(ROOT, target));
      if (result.changed) {
        backup(ROOT, BACKUP, target);
        fs.writeFileSync(target, result.source);
        log(`Alter Installer korrigiert: ${path.relative(ROOT, target)}`);
      } else {
        log(`Alter Installer bereits aktuell: ${path.relative(ROOT, target)}`);
      }
    } catch {
      log(`Hinweis: ${path.relative(ROOT, target)} enthält den Matcher nicht in direkt korrigierbarer Form.`);
    }
  }
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const ENGINE = path.join(
  ROOT,
  "apps/pfotentechnik/src/lib/seo/research/visual-generation.ts"
);

test("zusammengesetzte deutsche Einbaubegriffe erzeugen ein Installationsmotiv", async () => {
  const module = await import(pathToFileURL(ENGINE).href);

  for (const reason of [
    "Wandeinbau erklären",
    "Glaseinbau berücksichtigen",
    "Wandmontage zeigen",
    "Türinstallation darstellen",
    "Einbau in eine dicke Wand"
  ]) {
    const plan = module.buildVisualGenerationPlan({
      type: "product",
      title: "Testprodukt",
      reason
    });

    assert.ok(
      plan.assets.some((asset) => asset.id === "installation"),
      reason
    );
  }
});

test("unabhängige Wörter mit ähnlichen Teilstrings erzeugen kein Installationsmotiv", async () => {
  const module = await import(pathToFileURL(ENGINE).href);
  const plan = module.buildVisualGenerationPlan({
    type: "product",
    title: "Textwand vermeiden"
  });

  assert.equal(
    plan.assets.some((asset) => asset.id === "installation"),
    false
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

const packageJson = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
packageJson.scripts ??= {};
packageJson.scripts["test:visual-generation:compound-words"] =
  "node --experimental-strip-types --test test/visual-generation-engine-compound-words-2.3.2.test.mjs";

for (const script of ["test:visual-generation", "test:research", "build"]) {
  if (!packageJson.scripts[script]) {
    throw new Error(`package.json: erforderliches npm-Skript fehlt: ${script}`);
  }
}

const packageAfter = JSON.stringify(packageJson, null, 2) + "\n";
const packageBefore = fs.readFileSync(PACKAGE, "utf8");

if (packageAfter !== packageBefore) {
  backup(ROOT, BACKUP, PACKAGE);
  fs.writeFileSync(PACKAGE, packageAfter);
  log(`Geändert: ${path.relative(ROOT, PACKAGE)}`);
} else {
  log(`Bereits aktuell: ${path.relative(ROOT, PACKAGE)}`);
}

const finalEngine = fs.readFileSync(ENGINE, "utf8");

for (const marker of [
  "const hasInstallationContext",
  "(?:einbau|montage|installation)",
  'add(hasInstallationContext, "installation"'
]) {
  if (!finalEngine.includes(marker)) {
    throw new Error(`Ergebnisvalidierung fehlgeschlagen: ${marker}`);
  }
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

log("Fachliche Ergebnisvalidierung bestanden.");

runNpm(ROOT, [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "test:visual-generation:compound-words"
]);

runNpm(ROOT, [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "test:visual-generation"
]);

runNpm(ROOT, [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "test:research"
]);

runNpm(ROOT, [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "build"
]);

log("Visual-Tests, Research-Tests und vollständiger Build erfolgreich.");
log("Fertig.");
