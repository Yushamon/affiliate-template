#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-research-briefing-engine-2.1.1";
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
  test: path.join(ROOT, "apps", "pfotentechnik", "test", "seo-research-briefing-engine-2.1.1.test.mjs")
};

for (const [name, file] of Object.entries(files)) {
  if (name === "test") continue;
  if (!fs.existsSync(file)) throw new Error(`Erforderliche Datei fehlt: ${path.relative(ROOT, file)}`);
}

const originals = new Map(
  Object.entries(files)
    .filter(([name]) => name !== "test")
    .map(([name, file]) => [name, fs.readFileSync(file, "utf8")])
);

function assertContains(source, needle, label) {
  if (!source.includes(needle)) throw new Error(`${label} wurde nicht erkannt.`);
}

function insertAfterRegex(source, regex, addition, marker, label) {
  if (source.includes(marker)) return source;
  const match = source.match(regex);
  if (!match) throw new Error(`${label} konnte nicht sicher gefunden werden.`);
  return source.slice(0, match.index + match[0].length) + addition + source.slice(match.index + match[0].length);
}

function replaceOnceRegex(source, regex, replacement, marker, label) {
  if (source.includes(marker)) return source;
  const next = source.replace(regex, replacement);
  if (next === source) throw new Error(`${label} konnte nicht sicher angewendet werden.`);
  return next;
}

const next = new Map(originals);

// SCHEMA
{
  let source = next.get("schema");
  assertContains(source, "export interface ResearchActionBundle", "ResearchActionBundle");
  assertContains(source, "normalizeResearchStore", "normalizeResearchStore");

  source = insertAfterRegex(
    source,
    /export interface ResearchActionBundle\s*\{[^}]*\}\s*/,
    `\nexport interface ResearchImplementationBrief {
  goal:string;
  problem:string;
  userValue:string;
  implementation:string[];
  files:string[];
  doNotChange:string[];
  acceptanceCriteria:string[];
  verification:string[];
}\n`,
    "export interface ResearchImplementationBrief",
    "Schema-Interface"
  );

  source = replaceOnceRegex(
    source,
    /(refreshPlan\?:ResearchRefreshPlan;\s*impact\?:ResearchImpactPlan;\s*actionBundle\?:ResearchActionBundle;)/,
    `$1 implementationBrief?:ResearchImplementationBrief;`,
    "implementationBrief?:ResearchImplementationBrief",
    "ResearchItem-Erweiterung"
  );

  source = insertAfterRegex(
    source,
    /const bundle=\([^;]+;\s*/,
    `\nconst implementationBrief=(v:unknown,f:string):ResearchImplementationBrief|undefined=>{
 if(!record(v))return;
 return{
  goal:text(v.goal,\`\${f}.goal\`),
  problem:text(v.problem,\`\${f}.problem\`),
  userValue:text(v.userValue,\`\${f}.userValue\`),
  implementation:strings(v.implementation),
  files:strings(v.files),
  doNotChange:strings(v.doNotChange),
  acceptanceCriteria:strings(v.acceptanceCriteria),
  verification:strings(v.verification)
 };
};\n`,
    "const implementationBrief=",
    "Schema-Normalizer"
  );

  source = replaceOnceRegex(
    source,
    /(actionBundle:bundle\(raw\.actionBundle,`items\[\$\{index\}\]\.actionBundle`\),?)/,
    `$1implementationBrief:implementationBrief(raw.implementationBrief,\`items[\${index}].implementationBrief\`),`,
    "implementationBrief:implementationBrief",
    "Schema-Import"
  );

  next.set("schema", source);
}

// PROMPT
{
  let source = next.get("prompt");
  assertContains(source, "const outputExample", "Prompt-Ausgabebeispiel");
  assertContains(source, "\"PRIORISIERUNG\"", "Prompt-Priorisierung");

  if (!source.includes("implementationBrief: {")) {
    source = source.replace(
      /(actionBundle:\s*\{[\s\S]*?sequence:\s*\[\]\s*\},)/,
      `$1
    implementationBrief: {
      goal: "welches konkrete Ergebnis erreicht werden soll",
      problem: "welches belegte Problem die aktuelle Seite oder der Bestand hat",
      userValue: "welche Nutzerfrage oder Kaufentscheidung danach besser gelöst wird",
      implementation: ["konkrete Änderung 1", "konkrete Änderung 2"],
      files: ["konkrete Route oder bekannte Repository-Datei"],
      doNotChange: ["Bereiche, die ohne Beleg unberührt bleiben müssen"],
      acceptanceCriteria: ["objektiv prüfbares Fertig-Kriterium"],
      verification: ["passender Test, Audit oder Build"]
    },`
    );
    if (!source.includes("implementationBrief: {")) {
      throw new Error("Prompt-Beispiel konnte nicht erweitert werden.");
    }
  }

  if (!source.includes("\"IMPLEMENTIERUNGS-BRIEFING\"")) {
    source = source.replace(
      /(\s*"PRIORISIERUNG",)/,
      `
  "IMPLEMENTIERUNGS-BRIEFING",
  "- Erzeuge für jedes Finding ein implementationBrief, das unverändert in einen neuen ChatGPT- oder Codex-Chat kopiert werden kann.",
  "- goal beschreibt das konkrete Endergebnis.",
  "- problem beschreibt den belegten Ist-Zustand.",
  "- userValue erklärt die bessere Nutzerfrage oder Kaufentscheidung.",
  "- implementation enthält konkrete ausführbare Änderungen statt vager Stichworte.",
  "- files nennt nur bekannte Routen oder Repository-Dateien.",
  "- doNotChange schützt Bereiche, die nicht Teil des Problems sind.",
  "- acceptanceCriteria enthält objektiv prüfbare Fertig-Kriterien.",
  "- verification nennt Tests, Audits und den Build.",
  "- Das Briefing muss ohne weitere Interpretation als Auftrag für einen Installer-Patch funktionieren.",
  "",
$1`
    );
    if (!source.includes("\"IMPLEMENTIERUNGS-BRIEFING\"")) {
      throw new Error("Prompt-Anweisung konnte nicht ergänzt werden.");
    }
  }

  next.set("prompt", source);
}

// GROWTH
{
  let source = next.get("growth");
  assertContains(source, "export type GrowthOpportunity", "GrowthOpportunity");
  assertContains(source, "const informationGain =", "informationGain");

  source = insertAfterRegex(
    source,
    /export type GrowthHorizon\s*=\s*"short-term"\s*\|\s*"strategic";\s*/,
    `
export type ImplementationBrief = {
  goal: string;
  problem: string;
  userValue: string;
  implementation: string[];
  files: string[];
  doNotChange: string[];
  acceptanceCriteria: string[];
  verification: string[];
};\n`,
    "export type ImplementationBrief",
    "Growth-Briefing-Typ"
  );

  source = replaceOnceRegex(
    source,
    /(sourceCount:\s*number;)/,
    `$1
  implementationBrief: ImplementationBrief;
  implementationPrompt: string;`,
    "implementationPrompt: string",
    "GrowthOpportunity-Erweiterung"
  );

  if (!source.includes("export const buildImplementationBrief")) {
    const insertionPoint = source.indexOf("const informationGain =");
    if (insertionPoint < 0) throw new Error("Einfügeposition für Briefing-Logik fehlt.");

    const block = `const inferredFiles = (item: any): string[] => {
  const entries = [
    text(item?.repositoryMatch?.file),
    text(item?.repositoryMatch?.route),
    text(item?.refreshPlan?.targetRoute),
    ...list<any>(item?.actions).map((action) => text(action?.target))
  ].filter(Boolean);
  return [...new Set(entries)].slice(0, 8);
};

export const buildImplementationBrief = (item: any): ImplementationBrief => {
  const explicit = item?.implementationBrief ?? {};
  const gaps = compactGaps(item);
  const actions = list<any>(item?.actions);

  const implementation = list<string>(explicit.implementation).length
    ? list<string>(explicit.implementation)
    : [
        ...actions.map((action) => [text(action?.target), text(action?.reason)].filter(Boolean).join(": ")),
        ...gaps.map((gap) => \`Fehlenden Punkt konkret lösen: \${gap}\`)
      ].filter(Boolean).slice(0, 8);

  const target = primaryTarget(item);
  return {
    goal: text(
      explicit.goal,
      target
        ? \`\${text(item?.title, "Research-Aufgabe")} für \${target} vollständig umsetzen.\`
        : \`\${text(item?.title, "Research-Aufgabe")} vollständig umsetzen.\`
    ),
    problem: text(explicit.problem, text(item?.reason, "Der aktuelle Bestand löst die belegte Nutzerfrage noch nicht ausreichend.")),
    userValue: text(
      explicit.userValue,
      text(item?.serpGap?.informationGain, "Die Nutzerfrage wird klarer, vollständiger und entscheidungsorientierter beantwortet.")
    ),
    implementation,
    files: list<string>(explicit.files).length ? list<string>(explicit.files) : inferredFiles(item),
    doNotChange: list<string>(explicit.doNotChange).length
      ? list<string>(explicit.doNotChange)
      : [
          "Keine unbelegten Produktdaten ergänzen.",
          "Editorial Score und Empfehlung nicht ohne neuen Beleg verändern.",
          "Preis und Verfügbarkeit nicht statisch im Fließtext festschreiben."
        ],
    acceptanceCriteria: list<string>(explicit.acceptanceCriteria).length
      ? list<string>(explicit.acceptanceCriteria)
      : [
          ...gaps.map((gap) => \`\${gap} ist eindeutig und widerspruchsfrei gelöst.\`),
          "Alle neuen Aussagen sind durch die Research-Belege gedeckt.",
          "Bestehende Funktionen außerhalb des Aufgabenbereichs bleiben unverändert."
        ].slice(0, 8),
    verification: list<string>(explicit.verification).length
      ? list<string>(explicit.verification)
      : [
          "Relevante bestehende Tests und Audits ausführen.",
          "npm --workspace apps/pfotentechnik run build"
        ]
  };
};

const promptList = (title: string, entries: string[]): string[] =>
  entries.length ? [title, ...entries.map((entry) => \`- \${entry}\`), ""] : [];

export const buildResearchImplementationPrompt = (
  item: any,
  brief = buildImplementationBrief(item)
): string => [
  "Du arbeitest direkt im Repository Yushamon/affiliate-template.",
  "Betroffenes Projekt: apps/pfotentechnik",
  "",
  "Arbeite den folgenden Research-Auftrag vollständig ab und erstelle einen konfliktarmen, wiederholbaren Installer-Patch im Ordner 3.",
  "Behebe Ursachen zentral. Keine neuen CSS- oder Daten-Sonderregeln, wenn eine allgemeine Lösung möglich ist.",
  "",
  "AUFGABE",
  text(item?.title, "Research-Aufgabe"),
  "",
  "ZIEL",
  brief.goal,
  "",
  "PROBLEM",
  brief.problem,
  "",
  "NUTZEN FÜR DEN LESER",
  brief.userValue,
  "",
  ...promptList("KONKRET UMSETZEN", brief.implementation),
  ...promptList("BETROFFENE ZIELE ODER DATEIEN", brief.files),
  ...promptList("NICHT ÄNDERN", brief.doNotChange),
  ...promptList("AKZEPTANZKRITERIEN", brief.acceptanceCriteria),
  ...promptList("PRÜFUNG", brief.verification),
  "QUELLEN UND BELEGE",
  ...list<any>(item?.evidence).map((entry) =>
    \`- \${text(entry?.source, "Quelle")}: \${text(entry?.note)}\${text(entry?.url) ? \` (\${text(entry?.url)})\` : ""}\`
  ),
  "",
  "Arbeite bis zur vollständig implementierten und getesteten Lösung. Keine reine Analyse, keine Mockups und keine Platzhalter."
].join("\\n");

`;

    source = source.slice(0, insertionPoint) + block + source.slice(insertionPoint);
  }

  if (!source.includes("const implementationBrief = buildImplementationBrief(item);")) {
    source = source.replace(
      /(const ranking = scoreItem\(item, gscSignals\);\s*)/,
      `$1      const implementationBrief = buildImplementationBrief(item);
`
    );
    if (!source.includes("const implementationBrief = buildImplementationBrief(item);")) {
      throw new Error("Briefing-Erzeugung konnte nicht eingefügt werden.");
    }
  }

  if (!source.includes("implementationPrompt: buildResearchImplementationPrompt")) {
    source = source.replace(
      /(sourceCount:\s*list\(item\?\.evidence\)\.length,)/,
      `$1
        implementationBrief,
        implementationPrompt: buildResearchImplementationPrompt(item, implementationBrief),`
    );
    if (!source.includes("implementationPrompt: buildResearchImplementationPrompt")) {
      throw new Error("Briefing-Rückgabe konnte nicht ergänzt werden.");
    }
  }

  next.set("growth", source);
}

// WORKBENCH
{
  let source = next.get("workbench");
  assertContains(source, "Research-Auftrag kopieren", "Research-Workbench");

  if (!source.includes("data-copy-implementation-prompt")) {
    source = source.replace(
      /(<div class=\{`growth-gain is-\$\{gain\}`\}><span>Information Gain:[\s\S]*?<\/div>)(<\/div><\/article>)/,
      `$1
              <details class="growth-brief"><summary>Umsetzungsbriefing</summary><div class="growth-brief__content"><section><strong>Ziel</strong><p>{item.implementationBrief.goal}</p></section><section><strong>Warum das wichtig ist</strong><p>{item.implementationBrief.userValue}</p></section>{item.implementationBrief.implementation.length>0&&<section><strong>Konkret umsetzen</strong><ul>{item.implementationBrief.implementation.map(entry=><li>{entry}</li>)}</ul></section>}{item.implementationBrief.files.length>0&&<section><strong>Ziele oder Dateien</strong><ul>{item.implementationBrief.files.map(entry=><li><code>{entry}</code></li>)}</ul></section>}{item.implementationBrief.doNotChange.length>0&&<section><strong>Nicht ändern</strong><ul>{item.implementationBrief.doNotChange.map(entry=><li>{entry}</li>)}</ul></section>}{item.implementationBrief.acceptanceCriteria.length>0&&<section><strong>Fertig, wenn</strong><ul>{item.implementationBrief.acceptanceCriteria.map(entry=><li>{entry}</li>)}</ul></section>}<button type="button" class="pt-button pt-button--secondary growth-copy" data-copy-implementation-prompt={item.implementationPrompt}>Umsetzungsauftrag kopieren</button></div></details>$2`
    );

    if (!source.includes("data-copy-implementation-prompt")) {
      throw new Error("Workbench-Briefing konnte nicht eingefügt werden.");
    }

    source = source.replace(
      /<script is:inline>[\s\S]*?<\/script>/,
      `<script is:inline>document.addEventListener("click",async e=>{const b=e.target instanceof Element?e.target.closest("[data-copy-research-prompt],[data-copy-implementation-prompt]"):null;if(!(b instanceof HTMLButtonElement))return;const isImplementation=b.hasAttribute("data-copy-implementation-prompt");const p=isImplementation?(b.dataset.copyImplementationPrompt||""):(b.dataset.copyResearchPrompt||"");const copied=isImplementation?"Umsetzungsauftrag kopiert":"Research-Auftrag kopiert";try{await navigator.clipboard.writeText(p);const old=b.textContent;b.textContent=copied;setTimeout(()=>b.textContent=old,1800);}catch{window.prompt(isImplementation?"Umsetzungsauftrag kopieren:":"Research-Auftrag kopieren:",p);}});</script>`
    );

    source = source.replace(
      /(\.growth-gain\.is-schwach\{[^}]*\})/,
      `$1.growth-brief{margin-top:.85rem;border-top:1px solid var(--seo-border,#d9dee7);padding-top:.75rem}.growth-brief summary{cursor:pointer;font-weight:850}.growth-brief__content{display:grid;gap:.75rem;margin-top:.75rem;padding:.85rem;border-radius:var(--pt-radius-md);background:var(--seo-surface-subtle,#f4f6f8)}.growth-brief__content section{display:grid;gap:.3rem}.growth-brief__content p,.growth-brief__content ul{margin:0}.growth-brief__content ul{display:grid;gap:.3rem;padding-left:1.1rem}.growth-brief__content code{overflow-wrap:anywhere}.growth-copy{justify-self:start}`
    );
  }

  next.set("workbench", source);
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const read = (file) => fs.readFileSync(file, "utf8");

test("Research Briefing Engine ist vollständig integriert", () => {
  const schema = read(path.join(APP, "src", "lib", "seo", "research", "schema.ts"));
  const prompt = read(path.join(APP, "src", "lib", "seo", "research", "prompt-builder.ts"));
  const growth = read(path.join(APP, "src", "lib", "seo", "research", "growth.ts"));
  const workbench = read(path.join(APP, "src", "components", "admin", "ResearchWorkbench.astro"));

  assert.match(schema, /ResearchImplementationBrief/);
  assert.match(schema, /implementationBrief\\?:ResearchImplementationBrief/);
  assert.match(prompt, /IMPLEMENTIERUNGS-BRIEFING/);
  assert.match(prompt, /implementationBrief/);
  assert.match(growth, /buildImplementationBrief/);
  assert.match(growth, /buildResearchImplementationPrompt/);
  assert.match(workbench, /Umsetzungsauftrag kopieren/);
  assert.match(workbench, /data-copy-implementation-prompt/);
  assert.match(workbench, /Fertig, wenn/);
});
`;

const planned = [];
for (const [name, content] of next) {
  if (content !== originals.get(name)) planned.push([files[name], content]);
}
if (!fs.existsSync(files.test) || fs.readFileSync(files.test, "utf8") !== testSource) {
  planned.push([files.test, testSource]);
}

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
  execFileSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--test",
      "apps/pfotentechnik/test/seo-research-briefing-engine-2.1.1.test.mjs",
      "apps/pfotentechnik/test/seo-research-engine-2.0.0.test.mjs",
      "apps/pfotentechnik/test/seo-research-engine.test.mjs"
    ],
    { cwd: ROOT, stdio: "inherit" }
  );

  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  execFileSync(
    npm,
    ["--workspace", "apps/pfotentechnik", "run", "research:check"],
    { cwd: ROOT, stdio: "inherit" }
  );
}

console.log(`[${NAME}] Fertig.`);
