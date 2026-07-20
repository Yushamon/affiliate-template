#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const packageRoot = path.dirname(fileURLToPath(import.meta.url));

const files = {
  css: path.join(root, "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css"),
  premium: path.join(root, "packages/affiliate-core/src/renderer/PremiumRenderer.astro"),
  health: path.join(root, "apps/pfotentechnik/src/components/HealthBridge.astro"),
  conversion: path.join(root, "apps/pfotentechnik/src/components/ConversionJourney.astro"),
  trust: path.join(root, "apps/pfotentechnik/src/components/ProductTrustPanel.astro")
};

for (const [name, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    console.error(`Erforderliche Datei fehlt (${name}): ${file}`);
    console.error("Installer im Root von affiliate-template ausführen.");
    process.exit(1);
  }
}

const backupRoot = path.join(
  root,
  `.ui-polish-4.1-backup-${new Date().toISOString().replace(/[:.]/g, "-")}`
);
const manifestPath = path.join(root, ".ui-polish-4.1-manifest.json");

function backup(file) {
  const relative = path.relative(root, file);
  const target = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

Object.values(files).forEach(backup);

function replaceStyle(file, styleSourceName) {
  let content = fs.readFileSync(file, "utf8");
  const style = fs.readFileSync(path.join(packageRoot, styleSourceName), "utf8").trim();

  const styleStart = content.indexOf("<style>");
  const styleEnd = content.lastIndexOf("</style>");

  if (styleStart >= 0 && styleEnd > styleStart) {
    content =
      content.slice(0, styleStart).trimEnd() +
      "\n\n" +
      style +
      "\n";
  } else {
    content = content.trimEnd() + "\n\n" + style + "\n";
  }

  fs.writeFileSync(file, content, "utf8");
}

/* PremiumRenderer: PfotenTechnik-spezifische Scope-Klasse */
let premium = fs.readFileSync(files.premium, "utf8");
const oldWrapper = '<div class="premium-v3">';
const newWrapper =
  '<div class:list={["premium-v3", { "premium-v3--pfotentechnik": project === "pfotentechnik" }]}>'; 

if (!premium.includes("premium-v3--pfotentechnik")) {
  if (!premium.includes(oldWrapper)) {
    console.error("PremiumRenderer-Wrapper wurde nicht gefunden.");
    process.exit(1);
  }
  premium = premium.replace(oldWrapper, newWrapper);
}

/* CTA aus 4.0.1 erhalten, falls lokal noch nicht vorhanden */
if (!premium.includes("premium-v3-card-cta")) {
  const needle = `                    {product && (
                      <ul>
                        {product.highlights.slice(0, 3).map((item) => (
                          <li>{stripLeadingIcon(item)}</li>
                        ))}
                      </ul>
                    )}
                  </CardTag>`;
  const replacement = `                    {product && (
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

  if (!premium.includes(needle)) {
    console.error("CTA-Einfügepunkt im PremiumRenderer wurde nicht gefunden.");
    process.exit(1);
  }
  premium = premium.replace(needle, replacement);
}
fs.writeFileSync(files.premium, premium, "utf8");
replaceStyle(files.premium, "PremiumRenderer.4.1.style.txt");

/* HealthBridge */
replaceStyle(files.health, "HealthBridge.4.1.style.txt");

/* ConversionJourney */
replaceStyle(files.conversion, "ConversionJourney.4.1.style.txt");

/* ProductTrustPanel: nutzerfreundliche Version aus 3.6.4 sicherstellen */
let trust = fs.readFileSync(files.trust, "utf8");
trust = trust.replace(
  ': " Sie behauptet keinen mehrmonatigen Praxistest."',
  ': " Für dieses Modell wurde kein eigener mehrmonatiger Praxistest durchgeführt."'
);

const oldDl = `    <dl>
      <div>
        <dt>Prüfstatus</dt>
        <dd>{assessmentLabels[assessmentType]}</dd>
      </div>
      <div>
        <dt>Praxistest</dt>
        <dd>{testedHandsOn ? "Ja" : "Nicht behauptet"}</dd>
      </div>
      {formattedDate && (
        <div>
          <dt>Zuletzt geprüft</dt>
          <dd>{formattedDate}</dd>
        </div>
      )}
    </dl>`;

const newDl = `    <dl>
      <div>
        <dt>Bewertungsgrundlage</dt>
        <dd>{evidenceText}</dd>
      </div>
      {formattedDate && (
        <div>
          <dt>Zuletzt geprüft</dt>
          <dd>{formattedDate}</dd>
        </div>
      )}
    </dl>`;

if (trust.includes(oldDl)) {
  trust = trust.replace(oldDl, newDl);
}
fs.writeFileSync(files.trust, trust, "utf8");
replaceStyle(files.trust, "ProductTrustPanel.4.1.style.txt");

/* Globalen, vollständig migrierten 4.0.1-Block entfernen */
let css = fs.readFileSync(files.css, "utf8");
const startMarker = "/* === PfotenTechnik UI Polish 4.0.1 Corrective === */";
const endMarker = "/* === End PfotenTechnik UI Polish 4.0.1 Corrective === */";

const start = css.indexOf(startMarker);
const end = css.indexOf(endMarker);

if (start >= 0 && end >= start) {
  css =
    css.slice(0, start).trimEnd() +
    "\n" +
    css.slice(end + endMarker.length).trimStart();
}

fs.writeFileSync(files.css, css.trimEnd() + "\n", "utf8");

/* Audit */
const markerRegex = /\/\* === ([^*]+?) === \*\//g;
const selectorChecks = [
  ".premium-v3",
  ".pt-health-bridge",
  ".pt-conversion-journey",
  ".pt-trust-panel"
];

const finalCss = fs.readFileSync(files.css, "utf8");
const markers = [];
let match;
while ((match = markerRegex.exec(finalCss)) !== null) {
  if (!match[1].startsWith("End ")) markers.push(match[1].trim());
}

const selectorCounts = Object.fromEntries(
  selectorChecks.map((selector) => [
    selector,
    finalCss.split(selector).length - 1
  ])
);

const report = {
  generatedAt: new Date().toISOString(),
  removedGlobalBlock: start >= 0,
  remainingPatchMarkers: markers,
  remainingGlobalSelectorOccurrences: selectorCounts,
  note:
    "4.1 migriert PremiumRenderer, HealthBridge, ConversionJourney und ProductTrustPanel. Home-, Vergleichs-, Hersteller- und Product-Review-Overrides bleiben bis 4.2 bestehen."
};

fs.writeFileSync(
  path.join(root, "apps/pfotentechnik/UI_POLISH_4_1_AUDIT.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

/* Verification */
const checks = [
  [files.premium, "premium-v3--pfotentechnik"],
  [files.premium, "<style>"],
  [files.health, "--health-surface-start"],
  [files.conversion, "--journey-surface"],
  [files.trust, "<dt>Bewertungsgrundlage</dt>"],
  [files.trust, "--trust-surface"]
];

for (const [file, needle] of checks) {
  if (!fs.readFileSync(file, "utf8").includes(needle)) {
    console.error("Verifikation fehlgeschlagen:", needle);
    process.exit(1);
  }
}

fs.writeFileSync(
  manifestPath,
  JSON.stringify(
    {
      installedAt: new Date().toISOString(),
      backupRoot,
      files: [
        ...Object.values(files).map((file) => path.relative(root, file)),
        "apps/pfotentechnik/UI_POLISH_4_1_AUDIT.json"
      ]
    },
    null,
    2
  ) + "\n",
  "utf8"
);

console.log("");
console.log("PfotenTechnik UI Polish 4.1 installiert.");
console.log("");
console.log("Komponentenbereinigt:");
console.log("- PremiumRenderer");
console.log("- HealthBridge");
console.log("- ConversionJourney");
console.log("- ProductTrustPanel");
console.log("");
console.log("Entfernt:");
console.log("- globaler UI-Polish-4.0.1-Korrekturblock");
console.log("");
console.log("Audit:");
console.log("- apps/pfotentechnik/UI_POLISH_4_1_AUDIT.json");
console.log("");
console.log("Jetzt ausführen:");
console.log("  npm run build:pfotentechnik");
