#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-feeder-intent-consolidation-25.11.0";
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const runBuild = !args.has("--no-build");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 14; i += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const FILES = {
  hub: path.join(APP, "src", "content", "pages", "smarte-futterautomaten.md"),
  chooser: path.join(APP, "src", "content", "pages", "welcher-futterautomat-ist-der-richtige.md"),
  test: path.join(APP, "test", "feeder-intent-consolidation-25.11.0.test.mjs"),
};

for (const [key, file] of Object.entries(FILES)) {
  if (key !== "test" && !fs.existsSync(file)) {
    throw new Error(`Pflichtdatei fehlt: ${path.relative(ROOT, file)}`);
  }
}

const read = (file) => fs.readFileSync(file, "utf8");

function replaceRequired(source, pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`${label} konnte nicht sicher angewendet werden.`);
  return next;
}

function replaceOptional(source, pattern, replacement) {
  return source.replace(pattern, replacement);
}

function upsertFrontmatterScalar(source, key, value) {
  const escaped = value.replaceAll('"', '\\"');
  const pattern = new RegExp(`^${key}:\\s*.*$`, "m");
  if (pattern.test(source)) return source.replace(pattern, `${key}: "${escaped}"`);

  const end = source.indexOf("\n---", 3);
  if (end < 0) throw new Error(`Frontmatter-Ende für ${key} nicht gefunden.`);
  return source.slice(0, end) + `\n${key}: "${escaped}"` + source.slice(end);
}

function updateHub(source) {
  let next = source;

  next = upsertFrontmatterScalar(
    next,
    "description",
    "Zentrale Kaufberatung für smarte Futterautomaten: Bauarten, Auswahlkriterien, Ausfallsicherheit, Portionierung und passende nächste Vergleiche."
  );
  next = upsertFrontmatterScalar(
    next,
    "seoDescription",
    "Zentraler Ratgeber für smarte Futterautomaten: Bauarten einordnen, Auswahlkriterien prüfen und anschließend gezielt passende Modelle vergleichen."
  );

  next = replaceOptional(
    next,
    /description:\s*"Zentrale Kaufberatung mit Auswahlhilfe, Produktvergleich und Ratgebern für Hunde und Katzen\."/,
    'description: "Zentraler Cluster-Hub mit vollständiger Kaufberatung, Auswahlkriterien und fachlich passenden nächsten Schritten."'
  );

  next = replaceOptional(
    next,
    /label:\s*"Passenden nächsten Schritt öffnen"/g,
    'label: "Passende Futterautomaten nach Bedarf vergleichen"'
  );

  if (!next.includes("<!-- feeder-intent-owner: cluster-hub -->")) {
    const marker = "\n---\n";
    const pos = next.indexOf(marker, 3);
    if (pos < 0) throw new Error("Frontmatter-Ende im Haupt-Hub nicht gefunden.");
    next = next.slice(0, pos + marker.length) +
      "\n<!-- feeder-intent-owner: cluster-hub -->\n" +
      next.slice(pos + marker.length);
  }

  return next;
}

function updateChooser(source) {
  let next = source;

  next = upsertFrontmatterScalar(
    next,
    "title",
    "Welcher Futterautomat passt zu mir? Auswahlhilfe in 5 Schritten"
  );
  next = upsertFrontmatterScalar(
    next,
    "seoTitle",
    "Welcher Futterautomat passt zu mir? Auswahlhilfe"
  );
  next = upsertFrontmatterScalar(
    next,
    "description",
    "Kompakte Auswahlhilfe: Tier, Futterart, Portionsbedarf, Mehrtierhaushalt und Ausfallsicherheit prüfen und direkt zum passenden Vergleich gelangen."
  );
  next = upsertFrontmatterScalar(
    next,
    "seoDescription",
    "Futterautomat auswählen in fünf Schritten: Tier, Futterart, Portion, Mehrtierhaushalt und Technik prüfen und den passenden Vergleich öffnen."
  );

  next = replaceOptional(
    next,
    /title:\s*"Welcher Futterautomat ist der richtige\?"/g,
    'title: "Welcher Futterautomat passt zu mir?"'
  );
  next = replaceOptional(
    next,
    /description:\s*"Futterautomaten systematisch nach Tier, Futterart, Portionierung und Technik auswählen\."/,
    'description: "Kompakte Auswahlstrecke nach Tier, Futterart, Portionierung, Mehrtierhaushalt und Ausfallsicherheit."'
  );

  next = replaceOptional(
    next,
    /title:\s*"Erst Futterart und Tier, danach App und Kamera"/,
    'title: "In fünf Schritten zum passenden Automatentyp"'
  );
  next = replaceOptional(
    next,
    /text:\s*"Der richtige Futterautomat passt zuerst zur Futterart, zur benötigten Portionsgröße und zum Verhalten des Tieres\. Für Trockenfutter eignen sich Vorratsautomaten, für vorbereitete Nassfutterportionen Fachautomaten\. App, Kamera und Sprachaufnahme sind erst danach relevant\."/,
    'text: "Prüfe nacheinander Tier, Futterart, Portionsbedarf, Mehrtierhaushalt und Ausfallsicherheit. Die ausführlichen Kaufkriterien erklärt der zentrale Futterautomaten-Ratgeber; diese Seite führt dich möglichst direkt zum passenden Vergleich."'
  );

  if (!next.includes("<!-- feeder-intent-owner: compact-chooser -->")) {
    const marker = "\n---\n";
    const pos = next.indexOf(marker, 3);
    if (pos < 0) throw new Error("Frontmatter-Ende der Auswahlhilfe nicht gefunden.");
    next = next.slice(0, pos + marker.length) +
      "\n<!-- feeder-intent-owner: compact-chooser -->\n" +
      next.slice(pos + marker.length);
  }

  if (!next.includes("/smarte-futterautomaten/")) {
    next += `

## Ausführliche Kaufkriterien

Diese Seite ist bewusst als kurze Auswahlstrecke aufgebaut. Bauarten, Portionierung, App-Funktionen, Kamera, Offline-Betrieb, Reinigung und typische Fehlkäufe ordnet der [zentrale Ratgeber zu smarten Futterautomaten](/smarte-futterautomaten/) ausführlich ein.
`;
  }

  return next;
}

const originalHub = read(FILES.hub);
const originalChooser = read(FILES.chooser);
const nextHub = updateHub(originalHub);
const nextChooser = updateChooser(originalChooser);

const testSource = `import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), "utf8");

test("Smarte Futterautomaten bleibt alleiniger Cluster-Hub", () => {
  const source = read("src/content/pages/smarte-futterautomaten.md");
  assert.match(source, /feeder-intent-owner: cluster-hub/);
  assert.match(source, /Zentraler Cluster-Hub|Zentrale Kaufberatung/);
});

test("Auswahlhilfe besitzt einen klar begrenzten Intent", () => {
  const source = read("src/content/pages/welcher-futterautomat-ist-der-richtige.md");
  assert.match(source, /feeder-intent-owner: compact-chooser/);
  assert.match(source, /Auswahlhilfe in 5 Schritten/);
  assert.match(source, /Kompakte Auswahlhilfe/);
  assert.match(source, /smarte-futterautomaten/);
});

test("Die beiden Seiten beanspruchen nicht mehr dieselbe Beschreibung", () => {
  const hub = read("src/content/pages/smarte-futterautomaten.md");
  const chooser = read("src/content/pages/welcher-futterautomat-ist-der-richtige.md");
  assert.notEqual(
    hub.match(/^description:\\s*(.+)$/m)?.[1],
    chooser.match(/^description:\\s*(.+)$/m)?.[1]
  );
});
`;

const changes = [
  [FILES.hub, originalHub, nextHub],
  [FILES.chooser, originalChooser, nextChooser],
  [FILES.test, fs.existsSync(FILES.test) ? read(FILES.test) : "", testSource],
].filter(([, before, after]) => before !== after);

if (checkOnly) {
  console.log(`[${NAME}] Vorprüfung bestanden.`);
  console.log(`[${NAME}] Zu ändernde Dateien: ${changes.length}`);
  for (const [file] of changes) console.log(`- ${path.relative(ROOT, file)}`);
  process.exit(0);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(ROOT, ".patch-backups", `${NAME}-${timestamp}`);

for (const [file, before, after] of changes) {
  if (fs.existsSync(file)) {
    const backup = path.join(backupRoot, path.relative(ROOT, file));
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(file, backup);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, after, "utf8");
  console.log(`[${NAME}] Geschrieben: ${path.relative(ROOT, file)}`);
}

if (changes.length) console.log(`[${NAME}] Backup: ${path.relative(ROOT, backupRoot)}`);

execFileSync(
  process.execPath,
  [
    "--experimental-strip-types",
    "--test",
    "apps/pfotentechnik/test/feeder-intent-consolidation-25.11.0.test.mjs",
  ],
  { cwd: ROOT, stdio: "inherit" },
);

const runNpm = (script) => {
  if (process.platform === "win32") {
    execFileSync(
      "cmd.exe",
      ["/d", "/s", "/c", `npm --workspace apps/pfotentechnik run ${script}`],
      { cwd: ROOT, stdio: "inherit" },
    );
  } else {
    execFileSync(
      "npm",
      ["--workspace", "apps/pfotentechnik", "run", script],
      { cwd: ROOT, stdio: "inherit" },
    );
  }
};

for (const script of [
  "audit:topical-authority:strict",
  "audit:decision-journeys:strict",
  "audit:internal-link-health:strict",
  "audit:content-quality:strict",
]) {
  runNpm(script);
}

if (runBuild) runNpm("build");

console.log(`[${NAME}] Fertig.`);
console.log(`[${NAME}] Keine Redirects, Löschungen oder neuen Seiten angelegt.`);
