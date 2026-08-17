#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-score-and-hub-cleanup-32.6.22";

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "package.json")) &&
        fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
}
function backup(file, root) {
  const out = `${file}.${PATCH}.bak`;
  if (!fs.existsSync(out)) {
    fs.copyFileSync(file, out);
    console.log(`[${PATCH}] Backup: ${path.relative(root, out)}`);
  }
}
function required(raw, before, after, label) {
  if (!raw.includes(before)) throw new Error(`[${PATCH}] Erwarteter Block fehlt: ${label}`);
  return raw.replace(before, after);
}

const root = findRoot(process.cwd());
const scoreFile = path.join(root,"packages","affiliate-core","src","components","EditorialScore.astro");
const gridFile = path.join(root,"packages","affiliate-core","src","components","comparison","RecommendationGrid.astro");
const comparisonsDir = path.join(root,"apps","pfotentechnik","src","content","comparisons");

let raw = fs.readFileSync(scoreFile,"utf8");
raw = required(raw,
`  .pt-score--good { --score-accent: #75a91b; }
  .pt-score--solid { --score-accent: #c58b00; }
  .pt-score--limited { --score-accent: #d56f1f; }
  .pt-score--poor { --score-accent: #cf4545; }`,
`  /* Global score palette 32.6.22: unabhängig vom Seitentheme. */
  .pt-score--excellent { --score-accent: var(--pt-color-brand-600, #23845f); }
  .pt-score--good { --score-accent: #75a91b; }
  .pt-score--solid { --score-accent: #c58b00; }
  .pt-score--limited { --score-accent: #d56f1f; }
  .pt-score--poor { --score-accent: #cf4545; }`,
"EditorialScore Palette");
backup(scoreFile,root);
fs.writeFileSync(scoreFile,raw,"utf8");
console.log(`[${PATCH}] Score-Farben global vereinheitlicht.`);

raw = fs.readFileSync(gridFile,"utf8");
raw = required(raw, `                variant="ring-compact"`, `                variant="compact"`, "RecommendationGrid Score");
backup(gridFile,root);
fs.writeFileSync(gridFile,raw,"utf8");
console.log(`[${PATCH}] Kaufberatung nutzt kompakte Standardbewertung.`);

let hubChanges = 0;
for (const name of fs.readdirSync(comparisonsDir)) {
  if (!name.endsWith(".md")) continue;
  const file = path.join(comparisonsDir,name);
  let text = fs.readFileSync(file,"utf8");
  const pairs = [
    [`hubTitle: "App und Beuteerkennung"`,`hubTitle: "Katzenklappen: App und Beuteerkennung"`],
    [`hubTitle: 'App und Beuteerkennung'`,`hubTitle: 'Katzenklappen: App und Beuteerkennung'`],
    [`hubTitle: App und Beuteerkennung`,`hubTitle: "Katzenklappen: App und Beuteerkennung"`]
  ];
  for (const [before,after] of pairs) {
    if (text.includes(before)) {
      backup(file,root);
      text = text.replace(before,after);
      fs.writeFileSync(file,text,"utf8");
      hubChanges++;
      console.log(`[${PATCH}] Hub-Titel: ${path.relative(root,file)}`);
      break;
    }
  }
}
if (!hubChanges) console.warn(`[${PATCH}] Kein exakter hubTitle "App und Beuteerkennung" gefunden.`);

const reportDir=path.join(root,"apps","pfotentechnik","reports","comparison-selection");
fs.mkdirSync(reportDir,{recursive:true});
fs.writeFileSync(path.join(reportDir,"comparison-score-and-hub-cleanup-32.6.22.md"),
`# Comparison Score & Hub Cleanup 32.6.22

- Score-Farben sind global und nicht mehr vom Seitentheme abhängig.
- RecommendationGrid nutzt die kompakte Standardbewertung statt ring-compact.
- Hub-Titel "App und Beuteerkennung" wird als "Katzenklappen: App und Beuteerkennung" ausgegeben.
- Geänderte Hub-Dateien: ${hubChanges}

Nicht verändert: Scores, Winner-Logik, Preise, Membership oder Produktdaten.
`,"utf8");

console.log(`[${PATCH}] Fertig.`);
