#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PATCH_ID = "pfotentechnik-feeder-decision-journey-1.1.0";
const here = path.dirname(fileURLToPath(import.meta.url));
const payloadRoot = path.join(here, "payload");

function findRepoRoot(start) {
  let current = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(current, "apps", "pfotentechnik")) &&
      fs.existsSync(path.join(current, "package.json"))
    ) return current;

    const parent = path.dirname(current);
    if (parent === current) throw new Error("Repository-Root nicht gefunden.");
    current = parent;
  }
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function backupFile(repoRoot, backupRoot, file) {
  if (!fs.existsSync(file)) return;
  const relative = path.relative(repoRoot, file);
  const backup = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(file, backup);
}

function count(source, pattern) {
  return source.match(pattern)?.length ?? 0;
}

const repoRoot = findRepoRoot(process.cwd());
const appRoot = path.join(repoRoot, "apps", "pfotentechnik");
const backupRoot = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

const filesToBackup = [
  path.join(appRoot, "src", "pages", "[slug].astro"),
  path.join(appRoot, "package.json"),
  ...walk(payloadRoot).map((file) =>
    path.join(repoRoot, path.relative(payloadRoot, file)),
  ),
];

for (const file of filesToBackup) {
  backupFile(repoRoot, backupRoot, file);
}

for (const source of walk(payloadRoot)) {
  const relative = path.relative(payloadRoot, source);
  const target = path.join(repoRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`[${PATCH_ID}] Geschrieben: ${relative}`);
}

const pageFile = path.join(appRoot, "src", "pages", "[slug].astro");
let page = fs.readFileSync(pageFile, "utf8");

const importStatement =
  'import FeederIntentJourney from "../components/FeederIntentJourney.astro";';

page = page.replace(
  /^import FeederIntentJourney from "\.\.\/components\/FeederIntentJourney\.astro";\r?\n/gm,
  "",
);

const importAnchors = [
  'import DecisionNextSteps from "../components/DecisionNextSteps.astro";',
  'import ConversionJourney from "../components/ConversionJourney.astro";',
  'import RelatedArticles from "@affiliate-core/components/RelatedArticles.astro";',
];

const importAnchor = importAnchors.find((candidate) => page.includes(candidate));
if (!importAnchor) {
  throw new Error("Kein stabiler Import-Einfügepunkt im Ratgeber-Template gefunden.");
}
page = page.replace(importAnchor, `${importAnchor}\n${importStatement}`);

page = page.replace(
  /\s*<FeederIntentJourney\b[\s\S]*?\/>\s*/g,
  "\n",
);

const journeyBlock = `
    <FeederIntentJourney
      slug={page.data.slug}
      pages={pages}
      products={products}
      comparisons={comparisons}
    />

`;

const insertionStrategies = [
  {
    name: "vor DecisionNextSteps",
    pattern: /(\r?\n\s*\{\s*\r?\n\s*isRecommendationPage\s*&&\s*moneyPageNextSteps\.length\s*>\s*0\s*&&\s*\()/,
  },
  {
    name: "nach Content-AutoLink",
    pattern: /(<Content\s*\/>\s*\r?\n\s*<\/AutoLinkContent>\s*\r?\n)/,
    after: true,
  },
  {
    name: "vor Fachquellen",
    pattern: /(\r?\n\s*\{\s*\r?\n\s*decisionRule\?\.sources)/,
  },
];

let inserted = false;
for (const strategy of insertionStrategies) {
  const match = page.match(strategy.pattern);
  if (!match) continue;

  if (strategy.after) {
    page = page.replace(strategy.pattern, `$1${journeyBlock}`);
  } else {
    page = page.replace(strategy.pattern, `${journeyBlock}$1`);
  }

  console.log(`[${PATCH_ID}] Journey eingesetzt: ${strategy.name}`);
  inserted = true;
  break;
}

if (!inserted) {
  throw new Error(
    "Kein sicherer Journey-Einfügepunkt gefunden. Das Template wurde nicht geschrieben.",
  );
}

if (count(page, /import FeederIntentJourney/g) !== 1) {
  throw new Error("Journey-Import ist nach der Änderung nicht exakt einmal vorhanden.");
}

if (count(page, /<FeederIntentJourney/g) !== 1) {
  throw new Error("Journey-Komponente ist nach der Änderung nicht exakt einmal vorhanden.");
}

if (/manufacturers=\{manufacturers\}/.test(page)) {
  throw new Error("Veraltete Hersteller-Prop ist noch in der Journey vorhanden.");
}

fs.writeFileSync(pageFile, page, "utf8");
console.log(`[${PATCH_ID}] Geändert: apps/pfotentechnik/src/pages/[slug].astro`);

const packageFile = path.join(appRoot, "package.json");
const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
pkg.scripts["audit:feeder-intent"] =
  "node --experimental-strip-types scripts/seo/audit-feeder-intent.mjs";
pkg.scripts["audit:feeder-intent:strict"] =
  "node --experimental-strip-types scripts/seo/audit-feeder-intent.mjs --strict";
pkg.scripts["test:feeder-intent"] =
  "node --test test/feeder-intent.test.mjs";
fs.writeFileSync(packageFile, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
console.log(`[${PATCH_ID}] Geändert: apps/pfotentechnik/package.json`);

console.log("");
console.log("Abgeschlossen:");
console.log("- Teilinstallation 1.0.0 übernommen und repariert");
console.log("- robuster, formatunabhängiger Template-Einbau");
console.log("- Hersteller aus der Standard-Journey entfernt");
console.log("- Journey auf Vergleich → Produkt → weiterführendes Wissen fokussiert");
console.log("- Entscheidungsstufen statt Dokumenttypen");
console.log("- Sackgassen- und Duplicate-Intent-Audit");
console.log("- SEO-Copilot-Aufgabenreport");
console.log("");
console.log(`Backup: ${path.relative(repoRoot, backupRoot)}`);
console.log("");
console.log("Validierung:");
console.log("npm --workspace apps/pfotentechnik run test:feeder-intent");
console.log("npm --workspace apps/pfotentechnik run audit:feeder-intent");
console.log("npm --workspace apps/pfotentechnik run audit:feeder-intent:strict");
console.log("npm --workspace apps/pfotentechnik run build");
