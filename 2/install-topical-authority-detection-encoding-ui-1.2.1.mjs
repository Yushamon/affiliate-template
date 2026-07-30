#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PATCH_ID = "pfotentechnik-topical-authority-detection-encoding-ui-1.2.1";

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

function replaceRequired(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) {
    throw new Error(`Erwartete Struktur fehlt: ${label}`);
  }
  return source.replace(before, after);
}

const repoRoot = findRepoRoot(process.cwd());
const appRoot = path.join(repoRoot, "apps", "pfotentechnik");
const loaderFile = path.join(
  appRoot,
  "src",
  "lib",
  "seo",
  "topical-authority",
  "loadTopicalAuthority.ts",
);
const pageFile = path.join(
  appRoot,
  "src",
  "pages",
  "admin",
  "seo",
  "topical-authority.astro",
);
const testFile = path.join(appRoot, "test", "topical-authority-center.test.mjs");

for (const file of [loaderFile, pageFile, testFile]) {
  if (!fs.existsSync(file)) {
    throw new Error(`Pflichtdatei fehlt: ${path.relative(repoRoot, file)}`);
  }
}

const backupRoot = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

function backup(file) {
  const target = path.join(backupRoot, path.relative(repoRoot, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

backup(loaderFile);
backup(pageFile);
backup(testFile);

let loader = fs.readFileSync(loaderFile, "utf8").replace(/^\uFEFF/, "");

loader = replaceRequired(
  loader,
  `  const primaryEvidence = slugEvidence || titleEvidence || descriptionEvidence;

  const exclusionText =`,
  `  const primaryEvidence = slugEvidence || titleEvidence || descriptionEvidence;
  const manufacturerEvidence =
    matches(definition.manufacturerPatterns ?? [], slug) ||
    matches(definition.manufacturerPatterns ?? [], title) ||
    matches(definition.manufacturerPatterns ?? [], manufacturer);

  const exclusionText =`,
  "gemeinsames Hersteller-/Taxonomiesignal",
);

loader = replaceRequired(
  loader,
  `  if (document.type === "manufacturer") {
    const manufacturerEvidence =
      matches(definition.manufacturerPatterns ?? [], slug) ||
      matches(definition.manufacturerPatterns ?? [], title);

    // Herstellerseiten sind meist kategorienübergreifend. Eine beiläufige
    // Produktnennung im Body reicht daher ausdrücklich nicht aus.
    return manufacturerEvidence;
  }`,
  `  if (document.type === "manufacturer") {
    // Herstellerseiten sind meist kategorienübergreifend. Eine beiläufige
    // Produktnennung im Body reicht daher ausdrücklich nicht aus.
    return manufacturerEvidence;
  }`,
  "Herstellerzuordnung",
);

loader = replaceRequired(
  loader,
  `  if (document.type === "product") {
    // Produktseiten brauchen ein primäres Signal. Body-Treffer allein führen
    // besonders bei Cross-Selling und Alternativen zu Fehlzuordnungen.
    return primaryEvidence;
  }`,
  `  if (document.type === "product") {
    // Modellnamen enthalten die Kategorie oft nicht. Eindeutige Marken- oder
    // Taxonomiesignale zählen deshalb zusätzlich, Body-Treffer jedoch nicht.
    return primaryEvidence || manufacturerEvidence;
  }`,
  "Produktzuordnung",
);

loader = replaceRequired(
  loader,
  `  return bodyEvidence && bodySignalCount >= 2;`,
  `  if (document.type === "page") {
    return bodyEvidence && bodySignalCount >= 1;
  }

  return bodyEvidence && bodySignalCount >= 2;`,
  "Ratgeber-Body-Signale",
);

// Eindeutige Marken je Produktkategorie ergänzen.
const manufacturerReplacements = [
  [
    `    manufacturerPatterns: [],\n    targets: { pages: 6, comparisons: 4, products: 8, manufacturers: 3 },`,
    `    manufacturerPatterns: [
      /petlibro/i,
      /wopet/i,
      /oneisall/i,
      /voluas/i,
      /imipaw/i,
      /petkit/i,
      /xiaomi/i,
      /aqara/i,
      /cat mate/i,
      /surefeed/i,
      /balimo/i,
      /arf pets/i,
      /dogness/i,
      /casfuy/i,
    ],
    targets: { pages: 6, comparisons: 4, products: 8, manufacturers: 3 },`,
  ],
  [
    `    manufacturerPatterns: [],\n    targets: { pages: 6, comparisons: 2, products: 6, manufacturers: 2 },`,
    `    manufacturerPatterns: [
      /petlibro/i,
      /petkit/i,
      /catit/i,
      /pioneer pet/i,
      /drinkwell/i,
      /uahpet/i,
      /miaustore/i,
    ],
    targets: { pages: 6, comparisons: 2, products: 6, manufacturers: 2 },`,
  ],
];

for (const [before, after] of manufacturerReplacements) {
  if (loader.includes(after)) continue;
  if (!loader.includes(before)) {
    throw new Error("Markenlisten konnten nicht sicher ergänzt werden.");
  }
  loader = loader.replace(before, after);
}

fs.writeFileSync(loaderFile, loader, { encoding: "utf8" });

let page = fs.readFileSync(pageFile, "utf8").replace(/^\uFEFF/, "");

const mojibake = new Map([
  ["LÃ¼cken", "Lücken"],
  ["LÃ¼cke", "Lücke"],
  ["ClusterÃ¼bersicht", "Clusterübersicht"],
  ["NÃ¤chster", "Nächster"],
  ["nÃ¤chste", "nächste"],
  ["prÃ¼fen", "prüfen"],
  ["MaÃŸnahme", "Maßnahme"],
  ["fÃ¼r", "für"],
  ["LinkprÃ¼fung", "Linkprüfung"],
  ["MÃ¶gliche", "Mögliche"],
  ["âœ“", "✓"],
  ["â€“", "–"],
  ["â†’", "→"],
]);

for (const [broken, fixed] of mojibake) {
  page = page.replaceAll(broken, fixed);
}

// Lesbare Kennzahlen und Chips in Light/Dark Mode.
const contrastCss = `
  /* 1.2.1: expliziter Kontrast für Kennzahlen und Coverage-Chips */
  .ta-metrics div {
    color: var(--seo-text, #172033);
    background: var(--seo-surface-subtle, #f3f5f8);
  }
  .ta-metrics strong {
    color: var(--seo-text, #172033);
    font-size: 1.35rem;
    line-height: 1.1;
  }
  .ta-metrics span {
    color: var(--seo-text-muted, #4f5b6d);
  }
  .ta-chip {
    color: var(--seo-text, #172033);
    border: 1px solid var(--seo-border, #d9dee7);
  }
  .ta-chip--ok {
    color: var(--seo-success-text, #0f6b32);
    background: var(--seo-success-surface, #e7f6ec);
    border-color: var(--seo-success-border, #9dd6ad);
  }
  :global([data-theme="dark"]) .ta-metrics div,
  :global(.dark) .ta-metrics div {
    color: #f4f7fb;
    background: #202832;
  }
  :global([data-theme="dark"]) .ta-metrics strong,
  :global(.dark) .ta-metrics strong {
    color: #ffffff;
  }
  :global([data-theme="dark"]) .ta-metrics span,
  :global(.dark) .ta-metrics span {
    color: #c7d0dc;
  }
  :global([data-theme="dark"]) .ta-chip,
  :global(.dark) .ta-chip {
    color: #eef3f8;
    background: #202832;
    border-color: #465364;
  }
  :global([data-theme="dark"]) .ta-chip--ok,
  :global(.dark) .ta-chip--ok {
    color: #a9efbd;
    background: #123d23;
    border-color: #267544;
  }
`;

if (!page.includes("1.2.1: expliziter Kontrast")) {
  const closeStyle = page.lastIndexOf("</style>");
  if (closeStyle < 0) throw new Error("Style-Block der Seite nicht gefunden.");
  page = `${page.slice(0, closeStyle)}${contrastCss}\n${page.slice(closeStyle)}`;
}

fs.writeFileSync(pageFile, page, { encoding: "utf8" });

let tests = fs.readFileSync(testFile, "utf8").replace(/^\uFEFF/, "");
if (!tests.includes("Modellprodukte werden über eindeutige Marken erkannt")) {
  tests += `

test("Modellprodukte werden über eindeutige Marken erkannt", () => {
  const loader = read(
    "src/lib/seo/topical-authority/loadTopicalAuthority.ts",
  );

  assert.match(loader, /return primaryEvidence \\|\\| manufacturerEvidence;/);
  assert.match(loader, /petlibro/i);
  assert.match(loader, /tractive/i);
  assert.match(loader, /sureflap/i);
});

test("Topical-Authority-Seite enthält keine bekannten UTF-8-Fehlkodierungen", () => {
  const page = read("src/pages/admin/seo/topical-authority.astro");

  for (const broken of ["Ã¼", "Ã¤", "Ã¶", "âœ", "â€“", "â†"]) {
    assert.equal(page.includes(broken), false, \`Fehlkodierung gefunden: \${broken}\`);
  }
  assert.match(page, /\\.ta-metrics strong[\\s\\S]*color:/);
  assert.match(page, /\\.ta-chip--ok[\\s\\S]*background:/);
});
`;
}
fs.writeFileSync(testFile, tests, { encoding: "utf8" });

console.log(`[${PATCH_ID}] Geändert: ${path.relative(repoRoot, loaderFile)}`);
console.log(`[${PATCH_ID}] Geändert: ${path.relative(repoRoot, pageFile)}`);
console.log(`[${PATCH_ID}] Geändert: ${path.relative(repoRoot, testFile)}`);
console.log(`[${PATCH_ID}] Backup: ${path.relative(repoRoot, backupRoot)}`);
console.log("");
console.log("Behoben:");
console.log("- Modellprodukte werden über eindeutige Marken-/Taxonomiesignale erkannt");
console.log("- Ratgeber können über ein eindeutiges fachliches Body-Signal erkannt werden");
console.log("- bekannte UTF-8-Mojibake-Zeichen werden repariert");
console.log("- Zahlen und Coverage-Chips erhalten expliziten Light-/Dark-Mode-Kontrast");
console.log("");
console.log("Jetzt ausführen:");
console.log("npm --workspace apps/pfotentechnik run test:topical-authority");
console.log("npm --workspace apps/pfotentechnik run audit:topical-authority:strict");
console.log("npm --workspace apps/pfotentechnik run build");
