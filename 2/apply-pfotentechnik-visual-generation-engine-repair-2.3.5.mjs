#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-visual-generation-engine-repair-2.3.5";

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

function findBalancedFunction(source, signature) {
  const start = source.indexOf(signature);
  if (start < 0) return null;

  const open = source.indexOf("{", start);
  if (open < 0) return null;

  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
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

      if (char === quote) quote = null;
      continue;
    }

    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") depth += 1;

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        let end = index + 1;

        while (end < source.length && /\s/.test(source[end])) end += 1;
        if (source[end] === ";") end += 1;

        return { start, end };
      }
    }
  }

  return null;
}

const canonicalFeatureMotifs = `const featureMotifs = (item: any): Array<{ id: string; purpose: string; scene: string }> => {
  const source = collectText(item);
  const additions: Array<{ id: string; purpose: string; scene: string }> = [];

  const add = (
    condition: boolean,
    id: string,
    purpose: string,
    scene: string
  ) => {
    if (condition) additions.push({ id, purpose, scene });
  };

  add(
    /\\b(hub|gateway|bridge)\\b/.test(source),
    "hub-system",
    "Hub und System",
    "realistische Systemansicht aus Hauptgerät, Hub und Smartphone, ohne erfundene App-Oberfläche"
  );

  add(
    /\\b(app|smartphone|wlan|wifi)\\b/.test(source),
    "app",
    "App-Funktion",
    "realistische Nutzung mit Smartphone; App-Inhalte nur abstrakt und ohne erfundene Messwerte"
  );

  add(
    /\\b(kamera|camera|video)\\b/.test(source),
    "camera-detail",
    "Kameradetail",
    "nahes realistisches Detail der belegten Kamera- oder Sensorposition"
  );

  add(
    /\\b(batterie|akku|battery)\\b/.test(source),
    "power",
    "Stromversorgung",
    "realistische Detailansicht der belegten Stromversorgung oder des Batteriefachs"
  );

  const installationTokens = source.split(/\\s+/).filter(Boolean);
  const hasInstallationContext = installationTokens.some((token) => {
    const mountingWord =
      /^(?:einbau|montage|installation|montieren|einbauen)$/.test(token);

    const surfaceCompound =
      /^(?:wand|wall|glas|glass|tuer|door)(?:einbau|montage|installation|durchbruch|ausschnitt|adapter|tunnel)$/.test(token);

    return mountingWord || surfaceCompound;
  });

  add(
    hasInstallationContext,
    "installation",
    "Einbau",
    "realistische Einbausituation passend zu den belegten Montagearten"
  );

  add(
    /\\b(filter|reinigung|cleaning)\\b/.test(source),
    "cleaning",
    "Reinigung",
    "realistische zerlegte oder geöffnete Ansicht der tatsächlich entnehmbaren Reinigungsteile"
  );

  add(
    /\\b(mehrtier|mehrere tiere|multi pet|dual scan|mikrochip|rfid)\\b/.test(source),
    "multi-pet",
    "Mehrtier-Nutzung",
    "realistische Mehrtier-Situation, die Zugang, Trennung oder individuelle Nutzung verständlich zeigt"
  );

  add(
    /\\b(nassfutter|wet food|trockenfutter|dry food|portion)\\b/.test(source),
    "food-detail",
    "Futter und Portion",
    "realistische Detailansicht der belegten Futterart, Schale oder Portionierung"
  );

  return additions;
};`;

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const ENGINE = path.join(APP, "src", "lib", "seo", "research", "visual-generation.ts");
const PACKAGE = path.join(APP, "package.json");
const TEST = path.join(APP, "test", "visual-generation-engine-repair-2.3.5.test.mjs");
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

const before = fs.readFileSync(ENGINE, "utf8");
const range = findBalancedFunction(before, "const featureMotifs");

if (!range) {
  throw new Error("featureMotifs konnte nicht über Funktionsname und Klammerbalance gelesen werden.");
}

const newline = before.includes("\r\n") ? "\r\n" : "\n";
const canonical = canonicalFeatureMotifs.replaceAll("\n", newline);
const current = before.slice(range.start, range.end).trim();

if (current === canonical.trim()) {
  log(`Bereits aktuell: ${path.relative(ROOT, ENGINE)}`);
} else {
  const after =
    before.slice(0, range.start) +
    canonical +
    before.slice(range.end);

  backup(ROOT, BACKUP, ENGINE);
  fs.writeFileSync(ENGINE, after);
  log(`featureMotifs vollständig repariert: ${path.relative(ROOT, ENGINE)}`);
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const ENGINE = path.join(
  ROOT,
  "apps/pfotentechnik/src/lib/seo/research/visual-generation.ts"
);

test("featureMotifs besitzt genau einen kanonischen Installationspfad", () => {
  const source = fs.readFileSync(ENGINE, "utf8");

  assert.equal(
    (source.match(/const installationTokens/g) ?? []).length,
    1
  );

  assert.equal(
    (source.match(/"installation",/g) ?? []).length,
    1
  );

  assert.match(source, /const mountingWord/);
  assert.match(source, /const surfaceCompound/);
});

test("echte Einbau- und Montagebegriffe werden erkannt", async () => {
  const module = await import(pathToFileURL(ENGINE).href);

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

test("fachfremde ähnliche Wörter werden nicht als Einbau erkannt", async () => {
  const module = await import(pathToFileURL(ENGINE).href);

  for (const title of [
    "Textwand vermeiden",
    "Glasfaser-Ratgeber",
    "Wandern mit Hund",
    "Türkei-Reiseführer"
  ]) {
    const plan = module.buildVisualGenerationPlan({
      type: "product",
      title
    });

    assert.equal(
      plan.assets.some((asset) => asset.id === "installation"),
      false,
      title
    );
  }
});

test("übrige Merkmalsmotive bleiben erhalten", async () => {
  const module = await import(pathToFileURL(ENGINE).href);
  const plan = module.buildVisualGenerationPlan({
    type: "product",
    title: "Mikrochip Futterautomat mit Hub App Batterie Reinigung Nassfutter",
    reason: "Mehrere Tiere"
  });

  for (const id of [
    "hub-system",
    "app",
    "power",
    "cleaning",
    "multi-pet",
    "food-detail"
  ]) {
    assert.ok(plan.assets.some((asset) => asset.id === id), id);
  }
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
packageJson.scripts["test:visual-generation:repair"] =
  "node --experimental-strip-types --test test/visual-generation-engine-repair-2.3.5.test.mjs";

for (const script of ["test:visual-generation", "test:research", "build"]) {
  if (!packageJson.scripts[script]) {
    throw new Error(`package.json: erforderliches npm-Skript fehlt: ${script}`);
  }
}

const nextPackage = JSON.stringify(packageJson, null, 2) + "\n";
const currentPackage = fs.readFileSync(PACKAGE, "utf8");

if (nextPackage !== currentPackage) {
  backup(ROOT, BACKUP, PACKAGE);
  fs.writeFileSync(PACKAGE, nextPackage);
  log(`Geändert: ${path.relative(ROOT, PACKAGE)}`);
} else {
  log(`Bereits aktuell: ${path.relative(ROOT, PACKAGE)}`);
}

const finalEngine = fs.readFileSync(ENGINE, "utf8");

for (const marker of [
  "const featureMotifs",
  "const installationTokens",
  "const mountingWord",
  "const surfaceCompound",
  '"hub-system"',
  '"cleaning"',
  '"multi-pet"',
  '"food-detail"'
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
  "test:visual-generation:repair"
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

log("Reparaturtests, Visual-Tests, Research-Tests und Build erfolgreich.");
log("Fertig.");
