#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const packageRoot = path.dirname(fileURLToPath(import.meta.url));

const renderer = path.join(
  root,
  "packages/affiliate-core/src/renderer/PremiumRenderer.astro"
);
const designCss = path.join(
  root,
  "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css"
);
const page = path.join(
  root,
  "apps/pfotentechnik/src/content/pages/futterautomat-bei-uebergewicht.md"
);
const manifest = path.join(
  root,
  ".recommendation-dedup-product-card-fix-6.1.2.json"
);

for (const file of [renderer, designCss, page]) {
  if (!fs.existsSync(file)) {
    console.error("Datei fehlt:", file);
    process.exit(1);
  }
}

let rendererContent = fs.readFileSync(renderer, "utf8");
let designContent = fs.readFileSync(designCss, "utf8");
let pageContent = fs.readFileSync(page, "utf8");

const backupRoot = path.join(
  root,
  `.recommendation-dedup-product-card-fix-6.1.2-backup-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`
);

for (const file of [renderer, designCss, page]) {
  const backup = path.join(backupRoot, path.relative(root, file));
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(file, backup);
}

/* Produktkarten-CTA kürzen */
if (!rendererContent.includes("Produktdetails ansehen")) {
  console.error("Erwarteter CTA-Text im Renderer fehlt.");
  process.exit(1);
}
rendererContent = rendererContent.replace(
  "Produktdetails ansehen",
  "Produkt ansehen"
);

/* Doppelte Produktempfehlungen auf der Übergewicht-Seite bereinigen */
const oldScenarioBlock = `  - type: "scenarios"
    eyebrow: "Technische Beispiele"
    title: "Drei Ansätze für Gewichtsmanagement"
    text: "Produktname, interne URL, Bewertung und Stärken werden automatisch aus dem Produktkatalog geladen."
    cards:
      - label: "Wiegefunktion am Napf"
        title: "Xiaomi Smart Pet Food Feeder 2"
        productKey: "xiaomi-smart-pet-food-feeder-2"
        text: "Zusätzliche Gewichtsdaten können helfen, Futterreste und Ausgaben besser zu prüfen."
      - label: "Kleine Portionen"
        title: "PETKIT Fresh Element Solo"
        productKey: "petkit-fresh-element-solo"
        text: "Für mehrere planbare Trockenfuttermahlzeiten mit App-Steuerung."
      - label: "Allrounder mit App"
        title: "Petlibro Granary WiFi Feeder"
        productKey: "petlibro-granary-wifi-feeder"
        text: "Für feste Zeitpläne, Batterie-Backup und kontrollierte Trockenfutterrationen."
`;

const newScenarioBlock = `  - type: "scenarios"
    eyebrow: "Technische Anforderungen"
    title: "Drei sinnvolle Ansätze für Gewichtsmanagement"
    text: "Diese drei Anforderungen helfen bei der Auswahl. Konkrete Modelle folgen gesammelt im Produktmodul."
    cards:
      - label: "Feine Dosierung"
        title: "Kleine Ausgabeschritte zuverlässig prüfen"
        text: "Der Automat sollte kleine Portionen reproduzierbar ausgeben. Entscheidend ist die Kontrolle mit einer Küchenwaage."
      - label: "Kontrollierter Zugang"
        title: "Futterdiebstahl im Mehrtierhaushalt verhindern"
        text: "Getrennte Futterplätze oder individueller Zugang sind oft wichtiger als zusätzliche App-Funktionen."
      - label: "Verlaufskontrolle"
        title: "Ausgaben dokumentieren und Gewicht separat prüfen"
        text: "Protokolle und Wiegedaten können Hinweise liefern, ersetzen aber keine regelmäßige Gewichtskontrolle."
`;

if (!pageContent.includes(oldScenarioBlock)) {
  console.error("Erwarteter Szenario-Block wurde nicht gefunden.");
  process.exit(1);
}
pageContent = pageContent.replace(oldScenarioBlock, newScenarioBlock);

/* Closing CTA nicht erneut auf einzelnes Produkt zuspitzen */
const oldClosing = `closingCta:
  title: "Für nachvollziehbare Trockenfutterportionen"
  text: "Ein Modell mit kleinen Dosierschritten und zusätzlicher Gewichtskontrolle kann einen bestehenden Gewichtsplan sinnvoll unterstützen."
  productKey: "xiaomi-smart-pet-food-feeder-2"
  primaryLabel: "Aktuellen Preis prüfen"
  secondaryHref: "/futterautomat-und-ernaehrung/"
  secondaryLabel: "Tagesration richtig planen"
`;

const newClosing = `closingCta:
  title: "Passende Modelle nach Portionskontrolle vergleichen"
  text: "Achte auf kleine Ausgabeschritte, kontrollierten Futterzugang und eine nachvollziehbare Dokumentation."
  primaryHref: "/vergleiche/beste-futterautomaten/"
  primaryLabel: "Passende Modelle vergleichen"
  secondaryHref: "/futterautomat-und-ernaehrung/"
  secondaryLabel: "Tagesration richtig planen"
`;

if (!pageContent.includes(oldClosing)) {
  console.error("Erwarteter Closing-CTA wurde nicht gefunden.");
  process.exit(1);
}
pageContent = pageContent.replace(oldClosing, newClosing);

/* Vorhandenen 6.1.2-CSS-Block entfernen */
const start =
  "/* === PfotenTechnik Editorial Design System 6.1.2 Recommendation & Product Card Fix === */";
const end =
  "/* === End PfotenTechnik Editorial Design System 6.1.2 Recommendation & Product Card Fix === */";

const a = designContent.indexOf(start);
const b = designContent.indexOf(end);

if (a >= 0 && b > a) {
  designContent =
    designContent.slice(0, a).trimEnd() +
    "\n\n" +
    designContent.slice(b + end.length).trimStart();
}

const patch = fs
  .readFileSync(path.join(packageRoot, "EditorialDesignSystem.6.1.2.css"), "utf8")
  .trim();

designContent = designContent.trimEnd() + "\n\n" + patch + "\n";

fs.writeFileSync(renderer, rendererContent, "utf8");
fs.writeFileSync(designCss, designContent, "utf8");
fs.writeFileSync(page, pageContent, "utf8");

const checks = [
  [renderer, "Produkt ansehen"],
  [designCss, "Recommendation & Product Card Fix"],
  [designCss, "aspect-ratio: 4 / 3"],
  [designCss, "premium-v3-product-cta::after"],
  [page, "Drei sinnvolle Ansätze für Gewichtsmanagement"],
  [page, "Konkrete Modelle folgen gesammelt im Produktmodul."],
  [page, 'primaryHref: "/vergleiche/beste-futterautomaten/"']
];

for (const [file, needle] of checks) {
  if (!fs.readFileSync(file, "utf8").includes(needle)) {
    console.error("Verifikation fehlgeschlagen:", needle);
    process.exit(1);
  }
}

const audit = path.join(
  root,
  "apps/pfotentechnik/RECOMMENDATION_DEDUP_PRODUCT_CARD_FIX_6_1_2_AUDIT.json"
);

fs.writeFileSync(
  audit,
  JSON.stringify(
    {
      installedAt: new Date().toISOString(),
      version: "6.1.2",
      fixes: [
        "product media aspect ratio and containment",
        "product CTA changed to compact button",
        "large shared backgrounds reduced",
        "scenario cards changed from duplicate products to neutral requirements",
        "closing CTA points to comparison instead of repeating one product"
      ],
      affectedPage: "/futterautomat-bei-uebergewicht/"
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
        path.relative(root, designCss),
        path.relative(root, page),
        path.relative(root, audit)
      ]
    },
    null,
    2
  ) + "\n",
  "utf8"
);

console.log("");
console.log("Recommendation & Product Card Fix 6.1.2 installiert.");
console.log("Jetzt:");
console.log("  npm run build:pfotentechnik");
