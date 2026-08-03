#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-sureflap-schema-completion-25.11.1";
const SLUG = "sureflap-mikrochip-katzenklappe-connect";

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

function topLevelKey(line) {
  if (!line || /^\s/.test(line)) return null;

  const separator = line.indexOf(":");
  if (separator <= 0) return null;

  const key = line.slice(0, separator).trim();
  return /^[A-Za-z0-9_-]+$/.test(key) ? key : null;
}

function findTopLevelRange(lines, key) {
  const start = lines.findIndex((line) => topLevelKey(line) === key);
  if (start < 0) return null;

  let end = lines.length;

  for (let index = start + 1; index < lines.length; index += 1) {
    if (topLevelKey(lines[index])) {
      end = index;
      break;
    }
  }

  return { start, end };
}

function replaceTopLevelBlock(lines, key, block) {
  const range = findTopLevelRange(lines, key);

  if (!range) {
    return [...lines, ...block];
  }

  return [
    ...lines.slice(0, range.start),
    ...block,
    ...lines.slice(range.end)
  ];
}

function setTopLevelScalar(lines, key, value) {
  return replaceTopLevelBlock(lines, key, [`${key}: ${value}`]);
}

function readTopLevelScalar(lines, key) {
  const range = findTopLevelRange(lines, key);
  if (!range) return undefined;

  const line = lines[range.start];
  return line.slice(line.indexOf(":") + 1).trim();
}

function serializeDocument(frontmatter, body) {
  return ["---", ...frontmatter, "---", ...body].join("\n");
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

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const PRODUCT = path.join(
  APP,
  "src",
  "content",
  "products",
  `${SLUG}.md`
);
const ASSET_DIR = path.join(
  APP,
  "src",
  "assets",
  "images",
  "products",
  SLUG
);
const ASSET = path.join(ASSET_DIR, "editorial-dimensions.svg");
const PACKAGE = path.join(APP, "package.json");
const TEST = path.join(
  APP,
  "test",
  "sureflap-schema-completion-25.11.1.test.mjs"
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

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-labelledby="title desc">
  <title id="title">Redaktionelle Maßgrafik der SureFlap Mikrochip Katzenklappe Connect</title>
  <desc id="desc">Schematische Frontansicht mit Öffnung 142 mal 120 Millimeter, Außenrahmen 210 mal 210 Millimeter und Hinweis auf den Sure Petcare Hub.</desc>
  <rect width="1200" height="900" fill="#f6f7f4"/>
  <rect x="275" y="145" width="650" height="650" rx="60" fill="#ffffff" stroke="#c8cec7" stroke-width="10"/>
  <rect x="410" y="305" width="380" height="322" rx="34" fill="#eef2ee" stroke="#607064" stroke-width="10"/>
  <path d="M410 305h380v322H410z" fill="none" stroke="#2e7d32" stroke-width="6" stroke-dasharray="18 14"/>
  <line x1="410" y1="680" x2="790" y2="680" stroke="#2e7d32" stroke-width="6"/>
  <path d="M410 680l22-13v26zM790 680l-22-13v26z" fill="#2e7d32"/>
  <text x="600" y="730" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" fill="#25332a">Öffnung 142 mm</text>
  <line x1="840" y1="305" x2="840" y2="627" stroke="#2e7d32" stroke-width="6"/>
  <path d="M840 305l-13 22h26zM840 627l-13-22h26z" fill="#2e7d32"/>
  <text x="900" y="480" transform="rotate(90 900 480)" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" fill="#25332a">120 mm</text>
  <text x="600" y="95" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="#1e2a22">SureFlap Mikrochip Katzenklappe Connect</text>
  <text x="600" y="835" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#536157">Außenrahmen 210 × 210 mm · App-Funktionen über Sure Petcare Hub</text>
</svg>
`;

if (!fs.existsSync(ASSET) || fs.readFileSync(ASSET, "utf8") !== svg) {
  backup(ROOT, BACKUP, ASSET);
  fs.mkdirSync(ASSET_DIR, { recursive: true });
  fs.writeFileSync(ASSET, svg);
  log(`Geschrieben: ${path.relative(ROOT, ASSET)}`);
} else {
  log(`Bereits aktuell: ${path.relative(ROOT, ASSET)}`);
}

const original = fs.readFileSync(PRODUCT, "utf8");
const document = splitDocument(original);
let frontmatter = [...document.frontmatter];

frontmatter = setTopLevelScalar(frontmatter, "layout", "product");
frontmatter = setTopLevelScalar(frontmatter, "testStatus", "manufacturer-data");
frontmatter = setTopLevelScalar(frontmatter, "productStatus", "active");
frontmatter = setTopLevelScalar(
  frontmatter,
  "recommendation",
  '"Noch nicht abschließend redaktionell bewertet. Technisch passend für Mikrochip-Zugang, individuelle DualScan-Regeln und App-Fernfunktionen, sofern ein Sure Petcare Hub vorhanden oder eingeplant ist."'
);
frontmatter = setTopLevelScalar(frontmatter, "rating", "0");

frontmatter = replaceTopLevelBlock(
  frontmatter,
  "manufacturer",
  [
    "manufacturer:",
    "  key: surefeed",
    "  name: SureFlap",
    "  slug: surefeed"
  ]
);

frontmatter = replaceTopLevelBlock(
  frontmatter,
  "images",
  [
    "images:",
    "  hero:",
    `    src: ../../assets/images/products/${SLUG}/editorial-dimensions.svg`,
    "    alt: Redaktionelle Maßgrafik der SureFlap Mikrochip Katzenklappe Connect",
    "  thumbnail:",
    `    src: ../../assets/images/products/${SLUG}/editorial-dimensions.svg`,
    "    alt: SureFlap Mikrochip Katzenklappe Connect als schematische Maßansicht",
    "  comparison:",
    `    src: ../../assets/images/products/${SLUG}/editorial-dimensions.svg`,
    "    alt: SureFlap Mikrochip Katzenklappe Connect mit belegten Öffnungsmaßen",
    "  gallery:",
    `    - src: ../../assets/images/products/${SLUG}/editorial-dimensions.svg`,
    "      alt: Öffnung 142 mal 120 Millimeter und Außenrahmen 210 mal 210 Millimeter"
  ]
);

frontmatter = setTopLevelScalar(frontmatter, "editorialStatus", '"required"');
frontmatter = setTopLevelScalar(frontmatter, "recommendationStatus", '"limited"');
frontmatter = setTopLevelScalar(frontmatter, "maintenanceStatus", '"required"');

frontmatter = replaceTopLevelBlock(
  frontmatter,
  "editorial",
  [
    "editorial:",
    '  assessmentType: "data-review"',
    "  evidence:",
    '    - "manufacturer-documentation"',
    '    - "technical-specifications"',
    "  testedHandsOn: false",
    '  lastVerifiedAt: "2026-08-02"',
    '  note: "Neuaufnahme auf Basis aktueller Herstellerunterlagen; noch keine vollständige redaktionelle Vergleichsbewertung und kein eigener Praxistest."'
  ]
);

const next = serializeDocument(frontmatter, document.body);

for (const [key, expected] of [
  ["testStatus", "manufacturer-data"],
  ["editorialStatus", '"required"'],
  ["recommendationStatus", '"limited"'],
  ["maintenanceStatus", '"required"'],
  ["rating", "0"]
]) {
  const parsed = splitDocument(next);
  if (readTopLevelScalar(parsed.frontmatter, key) !== expected) {
    throw new Error(`Ergebnisvalidierung fehlgeschlagen: ${key}`);
  }
}

for (const marker of [
  "manufacturer:",
  "  key: surefeed",
  "images:",
  "editorial-dimensions.svg",
  "recommendation:",
  "rating: 0"
]) {
  if (!next.includes(marker)) {
    throw new Error(`Ergebnisvalidierung fehlgeschlagen: ${marker}`);
  }
}

if (next !== original) {
  backup(ROOT, BACKUP, PRODUCT);
  fs.writeFileSync(PRODUCT, next);
  log(`Geändert: ${path.relative(ROOT, PRODUCT)}`);
} else {
  log(`Bereits aktuell: ${path.relative(ROOT, PRODUCT)}`);
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PRODUCT = path.join(
  ROOT,
  "apps/pfotentechnik/src/content/products/${SLUG}.md"
);
const ASSET = path.join(
  ROOT,
  "apps/pfotentechnik/src/assets/images/products/${SLUG}/editorial-dimensions.svg"
);

const source = fs.readFileSync(PRODUCT, "utf8");

test("Pflichtfelder entsprechen dem aktuellen Produktschema", () => {
  assert.match(source, /^layout: product$/m);
  assert.match(source, /^testStatus: manufacturer-data$/m);
  assert.match(source, /^recommendation:/m);
  assert.match(source, /^rating: 0$/m);
  assert.match(source, /^editorialStatus: "required"$/m);
  assert.match(source, /^recommendationStatus: "limited"$/m);
  assert.match(source, /^maintenanceStatus: "required"$/m);
});

test("Herstellerobjekt enthält key, name und slug", () => {
  const block = source.match(/^manufacturer:\\n(?: {2}.+\\n?)+/m)?.[0] ?? "";
  assert.match(block, /key: surefeed/);
  assert.match(block, /name: SureFlap/);
  assert.match(block, /slug: surefeed/);
});

test("Bilderfeld verweist auf ein vorhandenes belegtes Editorial-Visual", () => {
  assert.ok(fs.existsSync(ASSET));
  assert.match(source, /^images:$/m);
  assert.match(source, /editorial-dimensions\\.svg/);

  const svg = fs.readFileSync(ASSET, "utf8");
  assert.match(svg, /142 mm/);
  assert.match(svg, /120 mm/);
  assert.match(svg, /210 × 210 mm/);
});

test("Keine redaktionelle Bewertung wird vorgetäuscht", () => {
  assert.doesNotMatch(source, /^score:/m);
  assert.match(source, /Noch nicht abschließend redaktionell bewertet/);
  assert.match(source, /testedHandsOn: false/);
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
packageJson.scripts["test:sureflap-schema-completion"] =
  "node --test test/sureflap-schema-completion-25.11.1.test.mjs";

for (const script of [
  "audit:products:strict",
  "audit:product-standard-3",
  "audit:internal-link-targets:strict",
  "build"
]) {
  if (!packageJson.scripts[script]) {
    throw new Error(`package.json: erforderliches npm-Skript fehlt: ${script}`);
  }
}

const packageNext = JSON.stringify(packageJson, null, 2) + "\n";
const packageBefore = fs.readFileSync(PACKAGE, "utf8");

if (packageNext !== packageBefore) {
  backup(ROOT, BACKUP, PACKAGE);
  fs.writeFileSync(PACKAGE, packageNext);
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

log("Fachliche Ergebnisvalidierung bestanden.");

runNpm(ROOT, [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "test:sureflap-schema-completion"
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
  "audit:product-standard-3"
]);

runNpm(ROOT, [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "audit:internal-link-targets:strict"
]);

runNpm(ROOT, [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "build"
]);

log("Schema, Tests, Audits und vollständiger Build erfolgreich.");
log("Fertig.");
