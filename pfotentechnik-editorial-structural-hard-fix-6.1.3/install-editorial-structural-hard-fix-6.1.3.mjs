#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const renderer = path.join(root, "packages/affiliate-core/src/renderer/PremiumRenderer.astro");
const pageShell = path.join(root, "apps/pfotentechnik/src/pages/[slug].astro");
const dogPage = path.join(root, "apps/pfotentechnik/src/content/pages/futterautomat-hund.md");
const manifest = path.join(root, ".editorial-structural-hard-fix-6.1.3.json");

for (const file of [renderer, pageShell, dogPage]) {
  if (!fs.existsSync(file)) {
    console.error("Datei fehlt:", file);
    process.exit(1);
  }
}

let rendererContent = fs.readFileSync(renderer, "utf8");
let shellContent = fs.readFileSync(pageShell, "utf8");
let dogContent = fs.readFileSync(dogPage, "utf8");

const backupRoot = path.join(
  root,
  `.editorial-structural-hard-fix-6.1.3-backup-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`
);

for (const file of [renderer, pageShell, dogPage]) {
  const backup = path.join(backupRoot, path.relative(root, file));
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(file, backup);
}

/* Immer kurze CTA-Beschriftung */
rendererContent = rendererContent.replaceAll(
  "Produktdetails ansehen",
  "Produkt ansehen"
);

/* Hero statt problematischer Thumbnail-Bilder für redaktionelle Produktkarten */
const oldImageSelection = `    src:
      product.data.images.thumbnail?.src ??
      product.data.images.hero.src,
    alt:
      product.data.images.thumbnail?.alt ??
      product.data.images.hero.alt,`;

const newImageSelection = `    src:
      product.data.images.hero.src ??
      product.data.images.thumbnail?.src,
    alt:
      product.data.images.hero.alt ??
      product.data.images.thumbnail?.alt,`;

if (shellContent.includes(oldImageSelection)) {
  shellContent = shellContent.replace(oldImageSelection, newImageSelection);
} else if (!shellContent.includes("product.data.images.hero.src ??")) {
  console.error("Bildauswahl konnte nicht sicher angepasst werden.");
  process.exit(1);
}

/* Doppelte konkrete Empfehlungen auf der Hunde-Seite neutralisieren */
const oldScenarios = `  - type: "scenarios"
    eyebrow: "Konkrete Modelle"
    title: "Drei Ansätze für unterschiedliche Anforderungen"
    text: "Produktname, interne URL, Bewertung und Stärken werden automatisch aus dem Produktkatalog geladen."
    cards:
      - label: "Allrounder mit App"
        title: "Petlibro Granary WiFi Feeder"
        productKey: "petlibro-granary-wifi-feeder"
        text: "Für kleine und mittelgroße Hunde mit planbaren Trockenfutterportionen."
      - label: "Zusätzliche Sichtkontrolle"
        title: "Petlibro Granary Camera Feeder"
        productKey: "petlibro-granary-camera-feeder"
        text: "Für Halter, die den Futterplatz gelegentlich aus der Ferne prüfen möchten."
      - label: "Portionskontrolle"
        title: "Xiaomi Smart Pet Food Feeder 2"
        productKey: "xiaomi-smart-pet-food-feeder-2"
        text: "Mit zusätzlicher Gewichtsübersicht am Napf, aber weiterhin ohne sicheren Fressnachweis."
`;

const newScenarios = `  - type: "scenarios"
    eyebrow: "Anforderungen"
    title: "Drei Ansätze für unterschiedliche Hunde"
    text: "Die Auswahl beginnt beim Hund und der Futtermenge. Konkrete Modelle werden anschließend einmalig im Produktmodul gezeigt."
    cards:
      - label: "Portionsgröße"
        title: "Ausgabemenge und Krokettengröße prüfen"
        text: "Kleine und große Mahlzeiten müssen mit dem verwendeten Futter zuverlässig ausgegeben werden."
      - label: "Gehäuse und Napf"
        title: "Größe, Standfestigkeit und Zugang abstimmen"
        text: "Napfhöhe, Verriegelung und Stabilität müssen zur Körpergröße und Kraft des Hundes passen."
      - label: "Zusatzfunktionen"
        title: "App oder Kamera nur bei echtem Bedarf wählen"
        text: "Zusatztechnik ist sinnvoll, wenn sie ein konkretes Problem löst und die Mechanik nicht in den Hintergrund drängt."
`;

if (dogContent.includes(oldScenarios)) {
  dogContent = dogContent.replace(oldScenarios, newScenarios);
} else if (!dogContent.includes("Konkrete Modelle werden anschließend einmalig")) {
  console.error("Szenario-Block konnte nicht sicher ersetzt werden.");
  process.exit(1);
}

/* 6.1.3 direkt am Ende des Komponenten-Styleblocks einsetzen */
const start = "/* === PfotenTechnik Editorial Structural Hard Fix 6.1.3 === */";
const end = "/* === End PfotenTechnik Editorial Structural Hard Fix 6.1.3 === */";

const existingStart = rendererContent.indexOf(start);
const existingEnd = rendererContent.indexOf(end);

if (existingStart >= 0 && existingEnd > existingStart) {
  rendererContent =
    rendererContent.slice(0, existingStart).trimEnd() +
    "\n\n" +
    rendererContent.slice(existingEnd + end.length).trimStart();
}

const css = fs.readFileSync(
  path.join(packageRoot, "PremiumRenderer.6.1.3.css"),
  "utf8"
).trim();

const closingStyle = rendererContent.lastIndexOf("</style>");

if (closingStyle < 0) {
  console.error("Kein Styleblock im Renderer gefunden.");
  process.exit(1);
}

rendererContent =
  rendererContent.slice(0, closingStyle).trimEnd() +
  "\n\n" +
  css +
  "\n" +
  rendererContent.slice(closingStyle);

fs.writeFileSync(renderer, rendererContent, "utf8");
fs.writeFileSync(pageShell, shellContent, "utf8");
fs.writeFileSync(dogPage, dogContent, "utf8");

const checks = [
  [renderer, "Editorial Structural Hard Fix 6.1.3"],
  [renderer, "Produkt ansehen"],
  [renderer, "aspect-ratio: 1 / 1"],
  [pageShell, "product.data.images.hero.src ??"],
  [dogPage, "Konkrete Modelle werden anschließend einmalig im Produktmodul gezeigt."],
];

for (const [file, needle] of checks) {
  if (!fs.readFileSync(file, "utf8").includes(needle)) {
    console.error("Verifikation fehlgeschlagen:", needle);
    process.exit(1);
  }
}

const audit = path.join(
  root,
  "apps/pfotentechnik/EDITORIAL_STRUCTURAL_HARD_FIX_6_1_3_AUDIT.json"
);

fs.writeFileSync(
  audit,
  JSON.stringify(
    {
      installedAt: new Date().toISOString(),
      version: "6.1.3",
      changes: [
        "CSS inserted directly into PremiumRenderer component",
        "hero images preferred over thumbnails in editorial product cards",
        "CTA normalized to Produkt ansehen",
        "dog recommendation scenarios converted to neutral requirements",
        "shared block backgrounds removed",
        "mobile headers and product cards structurally stabilized"
      ]
    },
    null,
    2
  ) + "\n",
  "utf8"
);

fs.writeFileSync(
  manifest,
  JSON.stringify(
    {
      backupRoot,
      files: [
        path.relative(root, renderer),
        path.relative(root, pageShell),
        path.relative(root, dogPage),
        path.relative(root, audit)
      ]
    },
    null,
    2
  ) + "\n",
  "utf8"
);

console.log("");
console.log("Editorial Structural Hard Fix 6.1.3 installiert.");
console.log("");
console.log("Wichtig: Danach Production neu bauen und deployen.");
console.log("  npm run build:pfotentechnik");
