#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cssTarget = path.join(
  root,
  "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css"
);
const rendererTarget = path.join(
  root,
  "packages/affiliate-core/src/renderer/PremiumRenderer.astro"
);
const contentTarget = path.join(
  root,
  "apps/pfotentechnik/src/content/pages/futterautomat-katze.md"
);
const packageRoot = path.dirname(new URL(import.meta.url).pathname);
const cssSource = path.join(packageRoot, "ui-polish-4.0.1.css");

const targets = [cssTarget, rendererTarget, contentTarget];
for (const file of targets) {
  if (!fs.existsSync(file)) {
    console.error("Datei nicht gefunden:", file);
    console.error("Installer im Root von affiliate-template ausführen.");
    process.exit(1);
  }
}

const backupRoot = path.join(
  root,
  `.ui-polish-4.0.1-backup-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

function backup(file) {
  const rel = path.relative(root, file);
  const dest = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
}

for (const file of targets) backup(file);

/* 1. CSS */
let css = fs.readFileSync(cssTarget, "utf8");
const patch = fs.readFileSync(cssSource, "utf8").trim();
const startMarker = "/* === PfotenTechnik UI Polish 4.0.1 Corrective === */";
const endMarker = "/* === End PfotenTechnik UI Polish 4.0.1 Corrective === */";
const start = css.indexOf(startMarker);
const end = css.indexOf(endMarker);

if (start >= 0 && end >= start) {
  css = css.slice(0, start).trimEnd() + "\n\n" + patch + "\n";
} else {
  css = css.trimEnd() + "\n\n" + patch + "\n";
}
fs.writeFileSync(cssTarget, css, "utf8");

/* 2. PremiumRenderer: sichtbaren CTA in verlinkten Karten ergänzen */
let renderer = fs.readFileSync(rendererTarget, "utf8");
const rendererNeedle = `                    {product && (
                      <ul>
                        {product.highlights.slice(0, 3).map((item) => (
                          <li>{stripLeadingIcon(item)}</li>
                        ))}
                      </ul>
                    )}
                  </CardTag>`;

const rendererReplacement = `                    {product && (
                      <ul>
                        {product.highlights.slice(0, 3).map((item) => (
                          <li>{stripLeadingIcon(item)}</li>
                        ))}
                      </ul>
                    )}

                    {href && (
                      <span class="premium-v3-card-cta">
                        {card.cta ?? "Mehr ansehen"}
                      </span>
                    )}
                  </CardTag>`;

if (!renderer.includes("premium-v3-card-cta")) {
  if (!renderer.includes(rendererNeedle)) {
    console.error("PremiumRenderer-Einfügepunkt nicht gefunden.");
    process.exit(1);
  }
  renderer = renderer.replace(rendererNeedle, rendererReplacement);
  fs.writeFileSync(rendererTarget, renderer, "utf8");
}

/* 3. Alle drei Ansätze verlinkbar machen */
let content = fs.readFileSync(contentTarget, "utf8");

const replacements = [
  [
`      - label: "Allrounder"
        title: "Petlibro Granary WiFi"
        text: "App-Zeitpläne, großer Vorrat und Batterie-Backup für Trockenfutter."`,
`      - label: "Allrounder"
        title: "Petlibro Granary WiFi"
        text: "App-Zeitpläne, großer Vorrat und Batterie-Backup für Trockenfutter."
        href: "/produkt/petlibro-granary-wifi-feeder/"
        cta: "Allrounder ansehen"`
  ],
  [
`      - label: "Kompakt"
        title: "PETKIT Fresh Element Solo"
        text: "Kompakte Bauweise und App-Steuerung für Katzen und kleine Tiere."`,
`      - label: "Kompakt"
        title: "PETKIT Fresh Element Solo"
        text: "Kompakte Bauweise und App-Steuerung für Katzen und kleine Tiere."
        href: "/produkt/petkit-fresh-element-solo/"
        cta: "Kompaktes Modell ansehen"`
  ]
];

for (const [oldValue, newValue] of replacements) {
  if (!content.includes(newValue)) {
    if (!content.includes(oldValue)) {
      console.error("Premium-Card-Inhalt nicht gefunden:", oldValue.split("\n")[0]);
      process.exit(1);
    }
    content = content.replace(oldValue, newValue);
  }
}

fs.writeFileSync(contentTarget, content, "utf8");

/* Verification */
const checks = [
  [cssTarget, ".pt-health-bridge"],
  [cssTarget, ".premium-v3-grid-quickFacts"],
  [rendererTarget, "premium-v3-card-cta"],
  [contentTarget, 'href: "/produkt/petlibro-granary-wifi-feeder/"'],
  [contentTarget, 'href: "/produkt/petkit-fresh-element-solo/"']
];

for (const [file, needle] of checks) {
  if (!fs.readFileSync(file, "utf8").includes(needle)) {
    console.error("Verifikation fehlgeschlagen:", needle);
    process.exit(1);
  }
}

fs.writeFileSync(
  path.join(root, ".ui-polish-4.0.1-manifest.json"),
  JSON.stringify({
    installedAt: new Date().toISOString(),
    backupRoot,
    files: targets.map((file) => path.relative(root, file))
  }, null, 2) + "\n"
);

console.log("PfotenTechnik UI Polish 4.0.1 installiert.");
console.log("Jetzt: npm run build:pfotentechnik");
