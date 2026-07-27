#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const index = args.indexOf("--repo");
const repo = path.resolve(index >= 0 ? args[index + 1] : process.cwd());

const componentFile = path.join(
  repo,
  "apps",
  "pfotentechnik",
  "src",
  "components",
  "product-experience-2",
  "ProductDecisionAssistant.astro"
);
const cssFile = path.join(
  repo,
  "apps",
  "pfotentechnik",
  "src",
  "styles",
  "pfotentechnik-product-mobile-premium.css"
);

const [component, css] = await Promise.all([
  fs.readFile(componentFile, "utf8"),
  fs.readFile(cssFile, "utf8")
]);

const checks = [
  [
    "Nicht-Futterkategorien bleiben bei fünf Fragen",
    component.includes("profile.usesFoodQuestions !== false") &&
      component.includes("usesFoodQuestions ? 7 : 5")
  ],
  [
    "Futterfragen bleiben konditional",
    component.includes("{usesFoodQuestions && (")
  ],
  [
    "Sieben semantische Frage-Icons",
    [
      "questionIcons.animal",
      "questionIcons.animalCount",
      "questionIcons.dryFood",
      "questionIcons.wetFood",
      "questionIcons.budget",
      "questionIcons.wifi",
      "questionIcons.camera"
    ].every((marker) => component.includes(marker))
  ],
  [
    "Katze und Hund mit Auswahl-Icons",
    component.includes("optionIcons.cat") &&
      component.includes("optionIcons.dog")
  ],
  [
    "Icons dekorativ und Screenreader-sicher",
    component.includes('aria-hidden="true"') &&
      component.includes("decision__question-icon")
  ],
  [
    "Statusmarken bleiben semantisch getrennt",
    component.includes('positive: "✓"') &&
      component.includes('neutral: "–"') &&
      component.includes('negative: "×"')
  ],
  [
    "Statuszeichen und Text in eigenen Elementen",
    component.includes("decision__reason-mark") &&
      component.includes("decision__reason-copy") &&
      component.includes("item.append(mark, copy)")
  ],
  [
    "Mindestens 12px Statusabstand",
    component.includes("column-gap: 12px")
  ],
  [
    "Kompakte Fragen mit 44px Touchziel",
    component.includes("min-height: 44px")
  ],
  [
    "Divider oberhalb statt neben Legende",
    component.includes("fieldset + fieldset::before") &&
      component.includes("legend {") &&
      component.includes("width: 100%")
  ],
  [
    "Dark Mode mit eigenen Ergebnisflächen",
    component.includes('background: #102137') &&
      component.includes('background: #312b20') &&
      component.includes('background: #372329')
  ],
  [
    "Resultattext kontraststark",
    component.includes("color: #e6edf5")
  ],
  [
    "Ideal-für-Listen vergrößert",
    css.includes("font-size: 1.04rem")
  ],
  [
    "Ideal-für-Überschrift vergrößert",
    css.includes("font-size: 1.05rem")
  ],
  [
    "Preisnotiz lesbarer",
    css.includes("font-size: 0.875rem")
  ],
  [
    "Eyebrows bleiben bewusst kompakt",
    css.includes("font-size: 0.72rem")
  ],
  [
    "Hero-Unterbereiche ohne innere Schatten",
    css.includes("box-shadow: none !important")
  ],
  [
    "Keine Entscheidungslogik entfernt",
    component.includes("evaluateProductDecision") &&
      component.includes("candidate.gain >= 5") &&
      component.includes("evaluation.score < 82")
  ]
];

const failed = checks.filter(([, ok]) => !ok);

for (const [label, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
}

if (failed.length) {
  throw new Error(
    `${failed.length} Mobile-Decision-UX-Auditprüfungen fehlgeschlagen.`
  );
}

console.log("\nMobile-Decision-UX-Audit erfolgreich: 18/18 Prüfungen.");
