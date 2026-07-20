#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(
  root,
  "apps/pfotentechnik/src/components/ProductTrustPanel.astro"
);
const backup = `${target}.before-trust-panel-fix-3.6.4`;

if (!fs.existsSync(target)) {
  console.error("ProductTrustPanel.astro nicht gefunden.");
  console.error("Installer im Root von affiliate-template ausführen.");
  process.exit(1);
}

if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
}

let content = fs.readFileSync(target, "utf8");

const oldParagraph = `      Die Einordnung basiert auf {evidenceText}.
      {
        testedHandsOn
          ? " Das Produkt wurde zusätzlich praktisch geprüft."
          : " Sie behauptet keinen mehrmonatigen Praxistest."
      }`;

const newParagraph = `      Die Einordnung basiert auf {evidenceText}.
      {
        testedHandsOn
          ? " Das Produkt wurde zusätzlich praktisch geprüft."
          : " Für dieses Modell wurde kein eigener mehrmonatiger Praxistest durchgeführt."
      }`;

if (!content.includes(oldParagraph)) {
  console.error("Erwarteter Beschreibungstext wurde nicht gefunden.");
  process.exit(1);
}

content = content.replace(oldParagraph, newParagraph);

const oldDefinitionList = `    <dl>
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

const newDefinitionList = `    <dl>
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

if (!content.includes(oldDefinitionList)) {
  console.error("Erwarteter Prüfstatus-Block wurde nicht gefunden.");
  process.exit(1);
}

content = content.replace(oldDefinitionList, newDefinitionList);

content = content.replace(
  "grid-template-columns: repeat(3, minmax(0, 1fr));",
  "grid-template-columns: repeat(2, minmax(0, 1fr));"
);

fs.writeFileSync(target, content, "utf8");

const verification = fs.readFileSync(target, "utf8");
const required = [
  "<dt>Bewertungsgrundlage</dt>",
  "<dd>{evidenceText}</dd>",
  "Für dieses Modell wurde kein eigener mehrmonatiger Praxistest durchgeführt.",
  "grid-template-columns: repeat(2, minmax(0, 1fr));"
];

const forbidden = [
  "<dt>Praxistest</dt>",
  'Nicht behauptet'
];

for (const item of required) {
  if (!verification.includes(item)) {
    fs.copyFileSync(backup, target);
    console.error("Verifikation fehlgeschlagen. Änderung wurde zurückgerollt.");
    process.exit(1);
  }
}

for (const item of forbidden) {
  if (verification.includes(item)) {
    fs.copyFileSync(backup, target);
    console.error("Alter Praxistest-Hinweis ist noch vorhanden. Änderung wurde zurückgerollt.");
    process.exit(1);
  }
}

console.log("Product Trust Panel Fix 3.6.4 installiert.");
console.log("Jetzt: npm run build:pfotentechnik");
