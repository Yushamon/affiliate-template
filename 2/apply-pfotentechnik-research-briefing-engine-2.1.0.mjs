#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-research-briefing-engine-2.1.0";
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const runTests = !args.has("--no-tests");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 14; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const files = {
  schema: path.join(ROOT, "apps", "pfotentechnik", "src", "lib", "seo", "research", "schema.ts"),
  prompt: path.join(ROOT, "apps", "pfotentechnik", "src", "lib", "seo", "research", "prompt-builder.ts"),
  growth: path.join(ROOT, "apps", "pfotentechnik", "src", "lib", "seo", "research", "growth.ts"),
  workbench: path.join(ROOT, "apps", "pfotentechnik", "src", "components", "admin", "ResearchWorkbench.astro"),
  test: path.join(ROOT, "apps", "pfotentechnik", "test", "seo-research-briefing-engine-2.1.0.test.mjs")
};

for (const [key, file] of Object.entries(files)) {
  if (key === "test") continue;
  if (!fs.existsSync(file)) throw new Error(`Erforderliche Datei fehlt: ${path.relative(ROOT, file)}`);
}

function replaceRequired(source, search, replacement, label) {
  const next = source.replace(search, replacement);
  if (next === source) throw new Error(`${label} konnte nicht sicher angewendet werden.`);
  return next;
}

const original = Object.fromEntries(
  Object.entries(files)
    .filter(([key]) => key !== "test")
    .map(([key, file]) => [key, fs.readFileSync(file, "utf8")])
);
const next = { ...original };

if (!next.schema.includes("ResearchImplementationBrief")) {
  next.schema = replaceRequired(
    next.schema,
    'export interface ResearchActionBundle { id?:string; title:string; sequence:string[]; }\n',
    `export interface ResearchActionBundle { id?:string; title:string; sequence:string[]; }\nexport interface ResearchImplementationBrief { goal:string; problem:string; userValue:string; implementation:string[]; files:string[]; doNotChange:string[]; acceptanceCriteria:string[]; verification:string[]; }\n`,
    "Schema-Interface"
  );
  next.schema = replaceRequired(
    next.schema,
    'refreshPlan?:ResearchRefreshPlan; impact?:ResearchImpactPlan; actionBundle?:ResearchActionBundle;\n',
    'refreshPlan?:ResearchRefreshPlan; impact?:ResearchImpactPlan; actionBundle?:ResearchActionBundle; implementationBrief?:ResearchImplementationBrief;\n',
    "ResearchItem-Briefing"
  );
  next.schema = replaceRequired(
    next.schema,
    'const bundle=(v:unknown,f:string):ResearchActionBundle|undefined=>{if(!record(v))return;return{id:optionalText(v.id),title:text(v.title,`${f}.title`),sequence:strings(v.sequence)};};\n',
    'const bundle=(v:unknown,f:string):ResearchActionBundle|undefined=>{if(!record(v))return;return{id:optionalText(v.id),title:text(v.title,`${f}.title`),sequence:strings(v.sequence)};};\nconst implementationBrief=(v:unknown,f:string):ResearchImplementationBrief|undefined=>{if(!record(v))return;return{goal:text(v.goal,`${f}.goal`),problem:text(v.problem,`${f}.problem`),userValue:text(v.userValue,`${f}.userValue`),implementation:strings(v.implementation),files:strings(v.files),doNotChange:strings(v.doNotChange),acceptanceCriteria:strings(v.acceptanceCriteria),verification:strings(v.verification)};};\n',
    "Schema-Normalizer"
  );
  next.schema = replaceRequired(
    next.schema,
    'refreshPlan:refreshPlan(raw.refreshPlan,`items[${index}].refreshPlan`),impact:impact(raw.impact,`items[${index}].impact`),actionBundle:bundle(raw.actionBundle,`items[${index}].actionBundle`),\n',
    'refreshPlan:refreshPlan(raw.refreshPlan,`items[${index}].refreshPlan`),impact:impact(raw.impact,`items[${index}].impact`),actionBundle:bundle(raw.actionBundle,`items[${index}].actionBundle`),implementationBrief:implementationBrief(raw.implementationBrief,`items[${index}].implementationBrief`),\n',
    "Schema-Import"
  );
}

if (!next.prompt.includes("implementationBrief:")) {
  next.prompt = replaceRequired(
    next.prompt,
    '    actionBundle: {\n      id: "optional-bundle-id",\n      title: "zusammengehöriger Arbeitsblock",\n      sequence: []\n    },\n',
    `    actionBundle: {\n      id: "optional-bundle-id",\n      title: "zusammengehöriger Arbeitsblock",\n      sequence: []\n    },\n    implementationBrief: {\n      goal: "konkretes Endergebnis",\n      problem: "belegter Ist-Zustand",\n      userValue: "Nutzen für Leser oder Kaufentscheidung",\n      implementation: ["konkrete Änderung"],\n      files: ["bekannte Route oder Repository-Datei"],\n      doNotChange: ["Bereiche, die ohne Beleg unverändert bleiben"],\n      acceptanceCriteria: ["objektiv prüfbares Fertig-Kriterium"],\n      verification: ["Test, Audit oder Build"]\n    },\n`,
    "Prompt-Beispiel"
  );
  next.prompt = replaceRequired(
    next.prompt,
    '  "PRIORISIERUNG",\n',
    `  "IMPLEMENTIERUNGS-BRIEFING",\n  "- Erzeuge für jedes Finding ein implementationBrief, das unverändert in einen neuen ChatGPT- oder Codex-Chat kopiert werden kann.",\n  "- goal beschreibt das konkrete Endergebnis.",\n  "- problem erklärt den belegten Ist-Zustand.",\n  "- userValue erklärt, welche Nutzerfrage oder Kaufentscheidung danach besser gelöst wird.",\n  "- implementation enthält konkrete, ausführbare Änderungen und keine bloßen Stichworte.",\n  "- files nennt nur bekannte Zielrouten oder Repository-Dateien. Unbekannte Dateien nicht erfinden.",\n  "- doNotChange schützt Bereiche, die nicht Teil des belegten Problems sind.",\n  "- acceptanceCriteria enthält objektiv prüfbare Fertig-Kriterien.",\n  "- verification nennt passende Tests, Audits und den Build.",\n  "- Formuliere das Briefing so, dass ein anderer Chat die Aufgabe vollständig abarbeiten und als konfliktarmen Installer-Patch liefern kann.",\n  "",\n  "PRIORISIERUNG",\n`,
    "Prompt-Anweisung"
  );
}

if (!next.growth.includes("ImplementationBrief")) {
  next.growth = replaceRequired(
    next.growth,
    'export type GrowthHorizon = "short-term" | "strategic";\n',
    `export type GrowthHorizon = "short-term" | "strategic";\nexport type ImplementationBrief = { goal:string; problem:string; userValue:string; implementation:string[]; files:string[]; doNotChange:string[]; acceptanceCriteria:string[]; verification:string[]; };\n`,
    "Growth-Briefing-Typ"
  );
  next.growth = replaceRequired(
    next.growth,
    '  sourceCount: number;\n',
    '  sourceCount: number;\n  implementationBrief: ImplementationBrief;\n  implementationPrompt: string;\n',
    "GrowthOpportunity-Briefing"
  );
  next.growth = replaceRequired(
    next.growth,
    'const informationGain = (item: any): string => {',
    `const inferredFiles = (item: any): string[] => [...new Set([text(item?.repositoryMatch?.file),text(item?.repositoryMatch?.route),text(item?.refreshPlan?.targetRoute),...list<any>(item?.actions).map((action)=>text(action?.target))].filter(Boolean))].slice(0,8);\n\nexport const buildImplementationBrief=(item:any):ImplementationBrief=>{const explicit=item?.implementationBrief??{};const gaps=compactGaps(item);const actions=list<any>(item?.actions);const implementation=list<string>(explicit.implementation).length?list<string>(explicit.implementation):[...actions.map((action)=>[text(action?.target),text(action?.reason)].filter(Boolean).join(": ")),...gaps.map((gap)=>\`Fehlenden Punkt konkret lösen: \${gap}\`)].filter(Boolean).slice(0,8);const target=primaryTarget(item);return{goal:text(explicit.goal,target?\`\${text(item?.title,"Research-Aufgabe")} für \${target} vollständig und nachvollziehbar umsetzen.\`:\`\${text(item?.title,"Research-Aufgabe")} vollständig und nachvollziehbar umsetzen.\`),problem:text(explicit.problem,text(item?.reason,"Der aktuelle Bestand löst die belegte Nutzerfrage noch nicht ausreichend.")),userValue:text(explicit.userValue,text(item?.serpGap?.informationGain,"Die betroffene Nutzerfrage wird klarer, vollständiger und entscheidungsorientierter beantwortet.")),implementation,files:list<string>(explicit.files).length?list<string>(explicit.files):inferredFiles(item),doNotChange:list<string>(explicit.doNotChange).length?list<string>(explicit.doNotChange):["Keine unbelegten Produktdaten ergänzen.","Editorial Score und Empfehlung nicht ohne eigenen Beleg verändern.","Preis und Verfügbarkeit nicht statisch im Fließtext festschreiben."],acceptanceCriteria:list<string>(explicit.acceptanceCriteria).length?list<string>(explicit.acceptanceCriteria):[...gaps.map((gap)=>\`\${gap} ist auf der Zielseite eindeutig und ohne Widerspruch gelöst.\`),"Alle neuen Aussagen sind durch die im Research-Item genannten Quellen gedeckt.","Bestehende Funktionen bleiben außerhalb des Aufgabenbereichs unverändert."].slice(0,8),verification:list<string>(explicit.verification).length?list<string>(explicit.verification):["Relevante bestehende Tests und Audits ausführen.","npm --workspace apps/pfotentechnik run build"]};};\n\nconst promptList=(title:string,entries:string[]):string[]=>entries.length?[title,...entries.map((entry)=>\`- \${entry}\`),""]:[];\nexport const buildResearchImplementationPrompt=(item:any,brief=buildImplementationBrief(item)):string=>["Du arbeitest direkt im Repository Yushamon/affiliate-template.","Betroffenes Projekt: apps/pfotentechnik","","Arbeite den folgenden Research-Auftrag vollständig ab und erstelle einen konfliktarmen, wiederholbaren Installer-Patch im Ordner 3.","Behebe Ursachen zentral. Keine neuen CSS- oder Daten-Sonderregeln, wenn eine allgemeine Lösung möglich ist.","","AUFGABE",text(item?.title,"Research-Aufgabe"),"","ZIEL",brief.goal,"","PROBLEM",brief.problem,"","NUTZEN FÜR DEN LESER",brief.userValue,"",...promptList("KONKRET UMSETZEN",brief.implementation),...promptList("BETROFFENE ZIELE ODER DATEIEN",brief.files),...promptList("NICHT ÄNDERN",brief.doNotChange),...promptList("AKZEPTANZKRITERIEN",brief.acceptanceCriteria),...promptList("PRÜFUNG",brief.verification),"QUELLEN UND BELEGE",...list<any>(item?.evidence).map((entry)=>\`- \${text(entry?.source,"Quelle")}: \${text(entry?.note)}\${text(entry?.url)?\` (\${text(entry?.url)})\`:""}\`),"","Arbeite bis zur vollständig implementierten und getesteten Lösung. Keine reine Analyse, keine Mockups und keine Platzhalter."].join("\\n");\n\nconst informationGain = (item: any): string => {`,
    "Growth-Briefing-Funktionen"
  );
  next.growth = replaceRequired(
    next.growth,
    '      const ranking = scoreItem(item, gscSignals);\n      return {\n',
    '      const ranking = scoreItem(item, gscSignals);\n      const implementationBrief = buildImplementationBrief(item);\n      return {\n',
    "Growth-Briefing-Aufbau"
  );
  next.growth = replaceRequired(
    next.growth,
    '        sourceCount: list(item?.evidence).length,\n',
    '        sourceCount: list(item?.evidence).length,\n        implementationBrief,\n        implementationPrompt: buildResearchImplementationPrompt(item, implementationBrief),\n',
    "Growth-Briefing-Rückgabe"
  );
}

if (!next.workbench.includes("data-copy-implementation-prompt")) {
  next.workbench = replaceRequired(
    next.workbench,
    '<div class={`growth-gain is-${gain}`}><span>Information Gain: {gainLabel[gain]}</span><p>{item.informationGain}</p></div></div></article>',
    '<div class={`growth-gain is-${gain}`}><span>Information Gain: {gainLabel[gain]}</span><p>{item.informationGain}</p></div><details class="growth-brief"><summary>Umsetzungsbriefing</summary><div class="growth-brief__content"><section><strong>Ziel</strong><p>{item.implementationBrief.goal}</p></section><section><strong>Warum das wichtig ist</strong><p>{item.implementationBrief.userValue}</p></section>{item.implementationBrief.implementation.length>0&&<section><strong>Konkret umsetzen</strong><ul>{item.implementationBrief.implementation.map(entry=><li>{entry}</li>)}</ul></section>}{item.implementationBrief.files.length>0&&<section><strong>Ziele oder Dateien</strong><ul>{item.implementationBrief.files.map(entry=><li><code>{entry}</code></li>)}</ul></section>}{item.implementationBrief.doNotChange.length>0&&<section><strong>Nicht ändern</strong><ul>{item.implementationBrief.doNotChange.map(entry=><li>{entry}</li>)}</ul></section>}{item.implementationBrief.acceptanceCriteria.length>0&&<section><strong>Fertig, wenn</strong><ul>{item.implementationBrief.acceptanceCriteria.map(entry=><li>{entry}</li>)}</ul></section>}<button type="button" class="pt-button pt-button--secondary growth-copy" data-copy-implementation-prompt={item.implementationPrompt}>Umsetzungsauftrag kopieren</button></div></details></div></article>',
    "Workbench-Briefing"
  );
  next.workbench = replaceRequired(
    next.workbench,
    '<script is:inline>document.addEventListener("click",async e=>{const b=e.target instanceof Element?e.target.closest("[data-copy-research-prompt]"):null;if(!(b instanceof HTMLButtonElement))return;const p=b.dataset.copyResearchPrompt||"";try{await navigator.clipboard.writeText(p);const old=b.textContent;b.textContent="Research-Auftrag kopiert";setTimeout(()=>b.textContent=old,1800);}catch{window.prompt("Research-Auftrag kopieren:",p);}});</script>',
    '<script is:inline>document.addEventListener("click",async e=>{const b=e.target instanceof Element?e.target.closest("[data-copy-research-prompt],[data-copy-implementation-prompt]"):null;if(!(b instanceof HTMLButtonElement))return;const implementation=b.hasAttribute("data-copy-implementation-prompt");const p=implementation?(b.dataset.copyImplementationPrompt||""):(b.dataset.copyResearchPrompt||"");const copied=implementation?"Umsetzungsauftrag kopiert":"Research-Auftrag kopiert";try{await navigator.clipboard.writeText(p);const old=b.textContent;b.textContent=copied;setTimeout(()=>b.textContent=old,1800);}catch{window.prompt(implementation?"Umsetzungsauftrag kopieren:":"Research-Auftrag kopieren:",p);}});</script>',
    "Workbench-Kopierlogik"
  );
  next.workbench = replaceRequired(
    next.workbench,
    '.growth-gain.is-schwach{border-color:var(--pt-color-danger,#c83232)}.cluster-progress',
    '.growth-gain.is-schwach{border-color:var(--pt-color-danger,#c83232)}.growth-brief{margin-top:.85rem;border-top:1px solid var(--seo-border,#d9dee7);padding-top:.75rem}.growth-brief summary{cursor:pointer;font-weight:850}.growth-brief__content{display:grid;gap:.75rem;margin-top:.75rem;padding:.85rem;border-radius:var(--pt-radius-md);background:var(--seo-surface-subtle,#f4f6f8)}.growth-brief__content section{display:grid;gap:.3rem}.growth-brief__content p,.growth-brief__content ul{margin:0}.growth-brief__content ul{display:grid;gap:.3rem;padding-left:1.1rem}.growth-brief__content code{overflow-wrap:anywhere}.growth-copy{justify-self:start}.cluster-progress',
    "Workbench-Stile"
  );
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../..");
const APP=path.join(ROOT,"apps","pfotentechnik");
const read=(...parts)=>fs.readFileSync(path.join(APP,...parts),"utf8");
test("Schema unterstützt Implementation Briefings",()=>{const s=read("src","lib","seo","research","schema.ts");assert.match(s,/ResearchImplementationBrief/);assert.match(s,/implementationBrief\?:ResearchImplementationBrief/);assert.match(s,/acceptanceCriteria:string\[\]/);});
test("Research Prompt verlangt ausführbare Briefings",()=>{const s=read("src","lib","seo","research","prompt-builder.ts");assert.match(s,/IMPLEMENTIERUNGS-BRIEFING/);assert.match(s,/implementationBrief/);assert.match(s,/Akzeptanzkriterien/);});
test("Growth erzeugt kopierbaren Entwickler-Prompt",()=>{const s=read("src","lib","seo","research","growth.ts");assert.match(s,/buildImplementationBrief/);assert.match(s,/buildResearchImplementationPrompt/);assert.match(s,/konfliktarmen, wiederholbaren Installer-Patch/);});
test("Workbench zeigt Briefing und Kopierbutton",()=>{const s=read("src","components","admin","ResearchWorkbench.astro");assert.match(s,/Umsetzungsauftrag kopieren/);assert.match(s,/data-copy-implementation-prompt/);assert.match(s,/Konkret umsetzen/);assert.match(s,/Fertig, wenn/);assert.match(s,/Nicht ändern/);});
`;

const planned = [];
for (const key of ["schema","prompt","growth","workbench"]) {
  if (next[key] !== original[key]) planned.push([files[key], next[key]]);
}
if (!fs.existsSync(files.test) || fs.readFileSync(files.test, "utf8") !== testSource) planned.push([files.test, testSource]);

if (checkOnly) {
  console.log(`[${NAME}] Vorprüfung bestanden.`);
  console.log(`[${NAME}] Zu ändernde Dateien: ${planned.length}`);
  for (const [file] of planned) console.log(`- ${path.relative(ROOT, file)}`);
  process.exit(0);
}

if (planned.length) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupRoot = path.join(ROOT, ".patch-backups", `${NAME}-${timestamp}`);
  for (const [file, content] of planned) {
    if (fs.existsSync(file)) {
      const backup = path.join(backupRoot, path.relative(ROOT, file));
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      fs.copyFileSync(file, backup);
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, "utf8");
    console.log(`[${NAME}] Geschrieben: ${path.relative(ROOT, file)}`);
  }
  console.log(`[${NAME}] Backup: ${path.relative(ROOT, backupRoot)}`);
} else {
  console.log(`[${NAME}] Bereits aktuell.`);
}

if (runTests) {
  execFileSync(process.execPath,["--experimental-strip-types","--test","apps/pfotentechnik/test/seo-research-briefing-engine-2.1.0.test.mjs","apps/pfotentechnik/test/seo-research-engine-2.0.0.test.mjs","apps/pfotentechnik/test/seo-research-engine.test.mjs"],{cwd:ROOT,stdio:"inherit"});
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  execFileSync(npm,["--workspace","apps/pfotentechnik","run","research:check"],{cwd:ROOT,stdio:"inherit"});
}

console.log(`[${NAME}] Fertig.`);
console.log(`[${NAME}] Im Cockpit kann jetzt jedes Finding als vollständiger Umsetzungsauftrag kopiert werden.`);
