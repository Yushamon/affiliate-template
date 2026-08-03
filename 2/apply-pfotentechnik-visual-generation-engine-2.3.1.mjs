#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-visual-generation-engine-2.3.1";

function findRoot(start) {
  let directory = path.resolve(start);
  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(directory, "apps", "pfotentechnik", "package.json"))) return directory;
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const log = (message) => console.log(`[${NAME}] ${message}`);

function backup(root, backupRoot, target) {
  if (!fs.existsSync(target)) return;
  const destination = path.join(backupRoot, path.relative(root, target));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(target, destination);
}

function writeIfChanged(root, backupRoot, target, content) {
  const before = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
  if (before === content) {
    log(`Bereits aktuell: ${path.relative(root, target)}`);
    return;
  }
  if (before !== null) backup(root, backupRoot, target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  log(`${before === null ? "Geschrieben" : "Geändert"}: ${path.relative(root, target)}`);
}

function insertOnce(source, anchor, content, label, position = "before") {
  if (source.includes(content.trim())) return source;
  const index = source.indexOf(anchor);
  if (index < 0) throw new Error(`${label}: Anker nicht gefunden.`);
  if (position === "after") {
    const end = index + anchor.length;
    return source.slice(0, end) + content + source.slice(end);
  }
  return source.slice(0, index) + content + source.slice(index);
}

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`${label}: Ausgangsblock nicht gefunden.`);
  return source.slice(0, index) + after + source.slice(index + before.length);
}

function normalizedSource(source) {
  return source.replace(/\r\n/g, "\n");
}

function insertImport(source, importLine, label) {
  if (source.includes(importLine)) return source;
  const lines = normalizedSource(source).split("\n");
  let lastImport = -1;
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].trim().startsWith("import ")) lastImport = index;
    else if (lastImport >= 0 && lines[index].trim()) break;
  }
  if (lastImport < 0) throw new Error(`${label}: Importblock nicht gefunden.`);
  lines.splice(lastImport + 1, 0, importLine);
  return lines.join("\n");
}

function insertAfterTrimmedLine(source, expectedLine, insertedLines, label) {
  const lines = normalizedSource(source).split("\n");
  if (insertedLines.every((line) => lines.some((entry) => entry.trim() === line.trim()))) return lines.join("\n");
  const index = lines.findIndex((line) => line.trim() === expectedLine.trim());
  if (index < 0) throw new Error(`${label}: Zielzeile nicht gefunden.`);
  const indent = lines[index].match(/^\s*/)?.[0] ?? "";
  lines.splice(index + 1, 0, ...insertedLines.map((line) => indent + line.trimStart()));
  return lines.join("\n");
}

function addVisualPlanToGrowthMap(source) {
  const lines = normalizedSource(source).split("\n");
  const briefIndex = lines.findIndex((line) => line.includes("const implementationBrief = buildImplementationBrief(item)"));
  if (briefIndex < 0) throw new Error("growth map: implementationBrief nicht gefunden.");
  if (!lines.some((line) => line.includes("const visualPlan = buildVisualGenerationPlan(item)"))) {
    const indent = lines[briefIndex].match(/^\s*/)?.[0] ?? "";
    lines.splice(briefIndex + 1, 0, `${indent}const visualPlan = buildVisualGenerationPlan(item);`);
  }
  return lines.join("\n");
}

function quoteWindowsArgument(value) {
  const text = String(value);
  if (!/[\s"&|<>^()]/.test(text)) return text;
  return `"${text.replaceAll("^", "^^").replaceAll("%", "%%").replaceAll('"', '\\"')}"`;
}

function runNpm(root, args) {
  if (process.platform === "win32") {
    const commandInterpreter = process.env.ComSpec || "C:\\Windows\\System32\\cmd.exe";
    const command = ["npm", ...args].map(quoteWindowsArgument).join(" ");
    execFileSync(commandInterpreter, ["/d", "/s", "/c", command], {
      cwd: root,
      stdio: "inherit",
      windowsHide: true
    });
    return;
  }
  execFileSync("npm", args, { cwd: root, stdio: "inherit" });
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const ENGINE = path.join(APP, "src", "lib", "seo", "research", "visual-generation.ts");
const GROWTH = path.join(APP, "src", "lib", "seo", "research", "growth.ts");
const PROMPT = path.join(APP, "src", "lib", "seo", "research", "prompt-builder.ts");
const WORKBENCH = path.join(APP, "src", "components", "admin", "ResearchWorkbench.astro");
const PACKAGE = path.join(APP, "package.json");
const TEST = path.join(APP, "test", "visual-generation-engine-2.3.1.test.mjs");
const BACKUP = path.join(ROOT, ".patch-backups", `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`);

for (const target of [GROWTH, PROMPT, WORKBENCH, PACKAGE]) {
  if (!fs.existsSync(target)) throw new Error(`Erwartete Datei fehlt: ${path.relative(ROOT, target)}`);
}

const engineSource = `export type VisualPageType = "product" | "comparison" | "guide" | "manufacturer" | "category" | "homepage" | "landingpage";

export type VisualAsset = {
  id: string;
  purpose: string;
  filename: string;
  alt: string;
  prompt: string;
  required: boolean;
};

export type VisualGenerationPlan = {
  pageType: VisualPageType;
  subject: string;
  target?: string;
  assets: VisualAsset[];
  masterPrompt: string;
  fallbackPrompts: string[];
};

const list = <T>(value: T[] | undefined | null): T[] => Array.isArray(value) ? value : [];
const text = (value: unknown, fallback = ""): string => typeof value === "string" && value.trim() ? value.trim() : fallback;
const normalize = (value: unknown): string => text(value).toLocaleLowerCase("de-DE").replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue").replaceAll("ß", "ss").replace(/[^a-z0-9]+/g, " ").trim();
const slugify = (value: string): string => normalize(value).replaceAll(" ", "-") || "visual";

const collectText = (item: any): string => normalize([
  item?.title, item?.type, item?.slug, item?.category, item?.intent, item?.reason,
  item?.repositoryMatch?.route, item?.refreshPlan?.targetRoute,
  ...list<string>(item?.serpGap?.missingVisuals), ...list<string>(item?.refreshPlan?.visuals),
  ...list<any>(item?.actions).flatMap((entry) => [entry?.type, entry?.target, entry?.reason])
].filter(Boolean).join(" "));

export const inferVisualPageType = (item: any): VisualPageType => {
  const route = text(item?.refreshPlan?.targetRoute, text(item?.repositoryMatch?.route));
  const source = collectText(item);
  if (route === "/" || /\\b(homepage|startseite)\\b/.test(source)) return "homepage";
  if (route.startsWith("/produkt/") || item?.type === "product" || /\\bproduktseite\\b/.test(source)) return "product";
  if (route.startsWith("/vergleiche/") || /\\bvergleich(?:sseite)?\\b/.test(source)) return "comparison";
  if (route.startsWith("/hersteller/") || item?.type === "manufacturer") return "manufacturer";
  if (/\\b(kategorie|category|cluster hub|themenhub)\\b/.test(source)) return "category";
  if (/\\b(landingpage|landing page)\\b/.test(source)) return "landingpage";
  return "guide";
};

const baseMotifs: Record<VisualPageType, Array<{ id: string; purpose: string; scene: string }>> = {
  product: [
    { id: "hero", purpose: "Hero", scene: "realistische Premium-Studioaufnahme in klarer Dreiviertelansicht" },
    { id: "thumbnail", purpose: "Thumbnail", scene: "kompakte freigestellte Produktansicht mit sofort erkennbarer Silhouette" },
    { id: "front", purpose: "Galerie Front", scene: "realistische frontale Produktansicht" },
    { id: "angle", purpose: "Galerie Perspektive", scene: "realistische 45-Grad-Ansicht mit sichtbarer Tiefe und Materialität" },
    { id: "detail", purpose: "Funktionsdetail", scene: "nahes Detail der wichtigsten kaufentscheidenden Funktion" },
    { id: "usage", purpose: "Nutzung", scene: "realistische Nutzungssituation mit passendem Haustier, ohne das Produkt zu verdecken" }
  ],
  comparison: [
    { id: "hero", purpose: "Hero", scene: "redaktionelles Vergleichshero mit klarer Produkttyp-Silhouette und ruhiger Fläche" },
    { id: "overview", purpose: "Vergleichsübersicht", scene: "mobile-first Übersicht der wichtigsten Vergleichsdimensionen ohne kleine Texte" },
    { id: "decision-tree", purpose: "Entscheidungsbaum", scene: "visueller Entscheidungsbaum mit wenigen klaren Wegen und großen Symbolen" },
    { id: "use-cases", purpose: "Einsatzfälle", scene: "realistische Gegenüberstellung typischer Nutzungssituationen" },
    { id: "tradeoffs", purpose: "Zielkonflikte", scene: "verständliche Visualisierung der wichtigsten Zielkonflikte und Grenzen" }
  ],
  guide: [
    { id: "hero", purpose: "Hero", scene: "realistisches redaktionelles Hero passend zur konkreten Nutzerfrage" },
    { id: "overview", purpose: "Übersicht", scene: "mobile-first Ursachen-, Schritte- oder Kriterienübersicht mit großen Symbolen" },
    { id: "decision-tree", purpose: "Entscheidungshilfe", scene: "klarer Entscheidungsbaum mit wenigen belastbaren nächsten Schritten" },
    { id: "checklist", purpose: "Checkliste", scene: "visuelle Checkliste mit gut unterscheidbaren Situationen statt Textwand" },
    { id: "warning-signs", purpose: "Warnzeichen oder Grenzen", scene: "ruhige sachliche Darstellung wichtiger Warnzeichen, Grenzen oder Ausschlusskriterien" }
  ],
  manufacturer: [
    { id: "hero", purpose: "Markenhero", scene: "ruhiges redaktionelles Markenhero ohne nachgebautes Markenlogo" },
    { id: "portfolio", purpose: "Produktfamilien", scene: "Übersicht der belegten Produktfamilien und ihrer Einsatzzwecke" },
    { id: "ecosystem", purpose: "Ökosystem", scene: "verständliche Darstellung von App, Hub, Zubehör und kompatiblen Produktlinien" },
    { id: "positioning", purpose: "Einordnung", scene: "redaktionelle Einordnung von Stärken, Grenzen und Zielgruppen" }
  ],
  category: [
    { id: "hero", purpose: "Kategoriehero", scene: "realistisches Hero der Produktkategorie mit klaren Nutzungssituationen" },
    { id: "types", purpose: "Produkttypen", scene: "visuelle Übersicht der wichtigsten Bauarten oder Untertypen" },
    { id: "decision-tree", purpose: "Kaufentscheidung", scene: "mobile-first Entscheidungsbaum nach Bedarf und Einsatzfall" },
    { id: "criteria", purpose: "Kaufkriterien", scene: "visuelle Gegenüberstellung der wichtigsten Kaufkriterien" },
    { id: "mistakes", purpose: "Fehlkäufe", scene: "verständliche Darstellung typischer Fehlkäufe und ihrer Folgen" }
  ],
  homepage: [
    { id: "hero", purpose: "Homepage Hero", scene: "hochwertiges redaktionelles Hero für smarte Haustiertechnik mit klarer Orientierung" },
    { id: "categories", purpose: "Kategorien", scene: "visuelle Übersicht der zentralen Produktkategorien" },
    { id: "method", purpose: "Arbeitsweise", scene: "ruhige Infografik zur unabhängigen redaktionellen Einordnung" }
  ],
  landingpage: [
    { id: "hero", purpose: "Landingpage Hero", scene: "realistisches Hero exakt zur Suchintention und Nutzeraufgabe" },
    { id: "benefits", purpose: "Nutzenübersicht", scene: "mobile-first Darstellung der wichtigsten konkreten Vorteile" },
    { id: "decision", purpose: "Entscheidungshilfe", scene: "visuelle Auswahlhilfe mit wenigen klaren Optionen" },
    { id: "proof", purpose: "Beleg und Grenzen", scene: "sachliche Visualisierung belegter Fakten und wichtiger Grenzen" }
  ]
};

const featureMotifs = (item: any) => {
  const source = collectText(item);
  const result: Array<{ id: string; purpose: string; scene: string }> = [];
  const add = (condition: boolean, id: string, purpose: string, scene: string) => { if (condition) result.push({ id, purpose, scene }); };
  add(/\\b(hub|gateway|bridge)\\b/.test(source), "hub-system", "Hub und System", "realistische Systemansicht aus Hauptgerät, Hub und Smartphone, ohne erfundene App-Oberfläche");
  add(/\\b(app|smartphone|wlan|wifi)\\b/.test(source), "app", "App-Funktion", "realistische Nutzung mit Smartphone; App-Inhalte nur abstrakt und ohne erfundene Messwerte");
  add(/\\b(kamera|camera|video)\\b/.test(source), "camera-detail", "Kameradetail", "nahes realistisches Detail der belegten Kamera- oder Sensorposition");
  add(/\\b(batterie|akku|battery)\\b/.test(source), "power", "Stromversorgung", "realistische Detailansicht der belegten Stromversorgung oder des Batteriefachs");
  add(/\\b(wand|wall|glas|glass|einbau|installation)\\b/.test(source), "installation", "Einbau", "realistische Einbausituation passend zu den belegten Montagearten");
  add(/\\b(filter|reinigung|cleaning)\\b/.test(source), "cleaning", "Reinigung", "realistische zerlegte oder geöffnete Ansicht der tatsächlich entnehmbaren Reinigungsteile");
  add(/\\b(mehrtier|mehrere tiere|multi pet|dual scan|mikrochip|rfid)\\b/.test(source), "multi-pet", "Mehrtier-Nutzung", "realistische Mehrtier-Situation, die Zugang, Trennung oder individuelle Nutzung verständlich zeigt");
  add(/\\b(nassfutter|wet food|trockenfutter|dry food|portion)\\b/.test(source), "food-detail", "Futter und Portion", "realistische Detailansicht der belegten Futterart, Schale oder Portionierung");
  return result;
};

const explicitMotifs = (item: any) => [
  ...list<string>(item?.serpGap?.missingVisuals),
  ...list<string>(item?.refreshPlan?.visuals)
].map((entry) => text(entry)).filter(Boolean).map((entry, index) => ({
  id: \`research-\${index + 1}-\${slugify(entry).slice(0, 40)}\`,
  purpose: "Research-Visual",
  scene: entry
}));

const dedupe = (motifs: Array<{ id: string; purpose: string; scene: string }>) => {
  const seen = new Set<string>();
  return motifs.filter((motif) => {
    const key = normalize(\`\${motif.purpose} \${motif.scene}\`);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const assetPrompt = (subject: string, pageType: VisualPageType, motif: { purpose: string; scene: string }, sources: string[]) => [
  \`Create one image for the PfotenTechnik \${pageType} page about "\${subject}".\`,
  \`Image purpose: \${motif.purpose}.\`,
  \`Scene: \${motif.scene}.\`,
  "Use a highly realistic, premium editorial or commercial photography style unless the motif explicitly requires an infographic.",
  "Design mobile first: the main subject and meaning must remain clear at 375 px width.",
  "Keep visual identity consistent with every other image in this set.",
  "Do not invent product controls, accessories, measurements, app screens, medical claims, labels or functions.",
  "No promotional banners, watermarks, decorative text, fake ratings or unrelated logos.",
  sources.length ? \`Before generating, inspect these cited references for factual and visual identity where accessible: \${sources.join(", ")}.\` : "Use only the facts contained in this conversation. For an exact branded product without visual references, do not guess hidden details."
].join("\\n");

export const buildVisualGenerationPlan = (item: any): VisualGenerationPlan => {
  const pageType = inferVisualPageType(item);
  const subject = text(item?.title, text(item?.slug, "PfotenTechnik-Inhalt"));
  const target = text(item?.refreshPlan?.targetRoute, text(item?.repositoryMatch?.route)) || undefined;
  const sources = list<any>(item?.evidence).map((entry) => text(entry?.url)).filter(Boolean).slice(0, 6);
  const motifs = dedupe([...baseMotifs[pageType], ...featureMotifs(item), ...explicitMotifs(item)]).slice(0, 12);
  const baseName = slugify(text(item?.slug) || target?.split("/").filter(Boolean).at(-1) || subject);
  const assets = motifs.map((motif, index): VisualAsset => ({
    id: motif.id,
    purpose: motif.purpose,
    filename: \`\${baseName}-\${String(index + 1).padStart(2, "0")}-\${slugify(motif.id)}.webp\`,
    alt: \`\${motif.purpose} zu \${subject}\`,
    prompt: assetPrompt(subject, pageType, motif, sources),
    required: index < Math.min(4, motifs.length)
  }));
  const manifest = assets.map((asset, index) => \`\${index + 1}. \${asset.purpose}\\n   Datei: \${asset.filename}\\n   Alt: \${asset.alt}\\n   Auftrag: \${asset.prompt.replaceAll("\\n", " ")}\`).join("\\n\\n");
  const masterPrompt = [
    "Du erstellst in ChatGPT den vollständigen Bildsatz für PfotenTechnik.", "",
    \`SEITE: \${subject}\`, \`SEITENTYP: \${pageType}\`, target ? \`ZIELROUTE: \${target}\` : "", "",
    "ARBEITSMODUS FÜR CHATGPT",
    "- Erzeuge alle unten aufgeführten Motive als eigenständige Bilder, nicht als Collage und nicht als Kontaktbogen.",
    "- Verwende für jedes Motiv einen separaten Bildgenerierungsaufruf.",
    "- Arbeite die Liste strikt in der angegebenen Reihenfolge ab und überspringe kein Motiv.",
    "- Falls die Oberfläche technisch nur ein Bild pro Antwort erzeugt, beginne mit Bild 1. Wenn ich danach nur „weiter“ schreibe, erzeuge ohne Rückfrage exakt das nächste noch offene Bild.",
    "- Nach „weiter“ darfst du weder den Master-Prompt wiederholen noch ein bereits erzeugtes Motiv neu erstellen.",
    "- Zeige vor oder nach dem Bild nur die laufende Nummer, den Dateinamen und den kurzen Zweck.", "",
    "QUALITÄTSREGELN",
    "- Möglichst realistisch und hochwertig, bei Produktmotiven wie glaubwürdige Herstellerfotografie.",
    "- Mobile first: Motiv und Aussage müssen bei 375 px Breite sofort verständlich bleiben.",
    "- Keine erfundenen Funktionen, Bedienelemente, Maße, App-Werte, Testergebnisse oder Werbeaussagen.",
    "- Keine Wasserzeichen, Preisangaben, Sternebewertungen oder fremde Logos.", "",
    "BILDLISTE", manifest, "",
    "Beginne jetzt mit Bild 1. Arbeite bei technisch möglicher Mehrfachgenerierung selbstständig bis zum letzten Bild weiter."
  ].filter(Boolean).join("\\n");
  return {
    pageType, subject, target, assets, masterPrompt,
    fallbackPrompts: assets.map((asset, index) => [\`Bild \${index + 1} von \${assets.length}\`, \`Dateiname: \${asset.filename}\`, asset.prompt].join("\\n"))
  };
};
`;

writeIfChanged(ROOT, BACKUP, ENGINE, engineSource);

let growth = normalizedSource(fs.readFileSync(GROWTH, "utf8"));
growth = insertImport(
  growth,
  'import { buildVisualGenerationPlan, type VisualGenerationPlan } from "./visual-generation";',
  "growth import"
);
growth = insertAfterTrimmedLine(
  growth,
  "implementationPrompt: string;",
  ["visualPlan: VisualGenerationPlan;", "visualPrompt: string;"],
  "growth type"
);
growth = addVisualPlanToGrowthMap(growth);
growth = insertAfterTrimmedLine(
  growth,
  "implementationPrompt: buildResearchImplementationPrompt(item, implementationBrief),",
  ["visualPlan,", "visualPrompt: visualPlan.masterPrompt,"],
  "growth values"
);
writeIfChanged(ROOT, BACKUP, GROWTH, growth);

let prompt = normalizedSource(fs.readFileSync(PROMPT, "utf8"));
prompt = insertOnce(prompt, '    implementationBrief: {\n', `    visualBrief: {\n      pageType: "product | comparison | guide | manufacturer | category | homepage | landingpage",\n      subject: "konkretes Seitenthema oder Produkt",\n      motifs: ["nur wirklich notwendige oder belegte Motive"],\n      styleNotes: ["optionale konkrete Stilhinweise"],\n      referenceUrls: ["optionale visuelle Primärquellen"]\n    },\n`, "prompt example");
prompt = insertOnce(prompt, '  "PRIORISIERUNG",\n', `  "VISUAL-BRIEFING",\n  "- Erzeuge für jedes Finding ein visualBrief. Visuals sind Teil des Produktionspakets, nicht ein optionaler Nachtrag.",\n  "- pageType ist product, comparison, guide, manufacturer, category, homepage oder landingpage.",\n  "- motifs enthält nur Bilder, die der Nutzerfrage, Kaufentscheidung oder Erklärung einen konkreten Mehrwert geben.",\n  "- Für neue Produktseiten mindestens Hero, Thumbnail, Perspektivansicht, wichtigstes Funktionsdetail und reale Nutzungssituation vorsehen.",\n  "- Für Vergleiche bevorzugt Hero, Vergleichsübersicht, Entscheidungsbaum, Einsatzfälle und Zielkonflikte.",\n  "- Für Ratgeber bevorzugt Hero, Übersicht, Entscheidungshilfe, Checkliste und Warnzeichen oder Grenzen.",\n  "- Nutze missingVisuals und refreshPlan.visuals für individuelle Motive statt nur starre Standardlisten zu wiederholen.",\n  "- Produktmotive müssen möglichst realistisch und anhand von Hersteller-Primärquellen identifizierbar sein. Keine erfundenen Details.",\n  "- Der spätere ChatGPT-Master-Prompt muss alle Bilder als einzelne Outputs anfordern und einen robusten Weiter-Modus enthalten, falls ChatGPT nur ein Bild pro Antwort erzeugt.",\n  "",\n\n`, "prompt rules");
writeIfChanged(ROOT, BACKUP, PROMPT, prompt);

let workbench = normalizedSource(fs.readFileSync(WORKBENCH, "utf8"));
const oldButton = '<button type="button" class="pt-button pt-button--secondary growth-copy" data-copy-implementation-prompt={item.implementationPrompt}>Umsetzungsauftrag kopieren</button></div></details>';
const newButton = '<div class="growth-copy-actions"><button type="button" class="pt-button pt-button--secondary growth-copy" data-copy-implementation-prompt={item.implementationPrompt}>Umsetzungsauftrag kopieren</button><button type="button" class="pt-button pt-button--secondary growth-copy" data-copy-visual-prompt={item.visualPrompt}>Bildsatz-Prompt kopieren</button></div></div></details><details class="growth-visual"><summary>Visual-Paket · {item.visualPlan.assets.length} Motive</summary><div class="growth-visual__content"><p><strong>{item.visualPlan.pageType}</strong> · {item.visualPlan.subject}</p><ol>{item.visualPlan.assets.map(asset=><li><strong>{asset.purpose}</strong><code>{asset.filename}</code><span>{asset.required?"Pflicht":"Optional"}</span></li>)}</ol><p>Ein Master-Prompt steuert den kompletten Bildsatz. Falls ChatGPT technisch nur ein Bild erzeugt, reicht danach jeweils <code>weiter</code>.</p></div></details>';
workbench = replaceOnce(workbench, oldButton, newButton, "workbench button");
workbench = replaceOnce(workbench, 'e.target.closest("[data-copy-research-prompt],[data-copy-implementation-prompt]")', 'e.target.closest("[data-copy-research-prompt],[data-copy-implementation-prompt],[data-copy-visual-prompt]")', "workbench selector");
workbench = replaceOnce(workbench, 'const isImplementation=b.hasAttribute("data-copy-implementation-prompt");const p=isImplementation?(b.dataset.copyImplementationPrompt||""):(b.dataset.copyResearchPrompt||"");const copied=isImplementation?"Umsetzungsauftrag kopiert":"Research-Auftrag kopiert";', 'const isImplementation=b.hasAttribute("data-copy-implementation-prompt");const isVisual=b.hasAttribute("data-copy-visual-prompt");const p=isVisual?(b.dataset.copyVisualPrompt||""):isImplementation?(b.dataset.copyImplementationPrompt||""):(b.dataset.copyResearchPrompt||"");const copied=isVisual?"Bildsatz-Prompt kopiert":isImplementation?"Umsetzungsauftrag kopiert":"Research-Auftrag kopiert";', "workbench copy");
workbench = replaceOnce(workbench, 'window.prompt(isImplementation?"Umsetzungsauftrag kopieren:":"Research-Auftrag kopieren:",p);', 'window.prompt(isVisual?"Bildsatz-Prompt kopieren:":isImplementation?"Umsetzungsauftrag kopieren:":"Research-Auftrag kopieren:",p);', "workbench fallback");
workbench = insertOnce(workbench, '.growth-copy{justify-self:start}', '.growth-copy-actions{display:flex;gap:.6rem;flex-wrap:wrap}.growth-copy{justify-self:start}.growth-visual{margin-top:.7rem;border-top:1px solid var(--growth-border);padding-top:.7rem}.growth-visual summary{cursor:pointer;font-weight:850}.growth-visual__content{display:grid;gap:.7rem;margin-top:.7rem;padding:.85rem;border:1px solid var(--growth-border);border-radius:var(--pt-radius-md);background:var(--growth-surface-raised)}.growth-visual__content p{margin:0}.growth-visual__content ol{display:grid;gap:.45rem;margin:0;padding-left:1.25rem}.growth-visual__content li{display:grid;grid-template-columns:minmax(8rem,1fr) minmax(0,2fr) auto;gap:.5rem;align-items:center}.growth-visual__content code{overflow-wrap:anywhere}.growth-visual__content li>span{font-size:.72rem;color:var(--growth-text-muted)}', "workbench css");
workbench = insertOnce(workbench, '@media(max-width:48rem){.growth-head', '@media(max-width:48rem){.growth-visual__content li{grid-template-columns:1fr}.growth-copy-actions>*{width:100%}}', "workbench mobile");
writeIfChanged(ROOT, BACKUP, WORKBENCH, workbench);

const testSource = `import test from "node:test";\nimport assert from "node:assert/strict";\nimport fs from "node:fs";\nimport path from "node:path";\nimport { fileURLToPath, pathToFileURL } from "node:url";\n\nconst ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../..");\nconst APP=path.join(ROOT,"apps/pfotentechnik");\nconst ENGINE=path.join(APP,"src/lib/seo/research/visual-generation.ts");\nconst GROWTH=path.join(APP,"src/lib/seo/research/growth.ts");\nconst PROMPT=path.join(APP,"src/lib/seo/research/prompt-builder.ts");\nconst WORKBENCH=path.join(APP,"src/components/admin/ResearchWorkbench.astro");\n\ntest("Seitentypen werden erkannt",async()=>{const m=await import(pathToFileURL(ENGINE).href);assert.equal(m.inferVisualPageType({type:"product",title:"Produkt"}),"product");assert.equal(m.inferVisualPageType({repositoryMatch:{route:"/vergleiche/test/"}}),"comparison");assert.equal(m.inferVisualPageType({repositoryMatch:{route:"/ratgeber/"}}),"guide");assert.equal(m.inferVisualPageType({type:"manufacturer"}),"manufacturer");assert.equal(m.inferVisualPageType({title:"Kategorie Themenhub"}),"category");assert.equal(m.inferVisualPageType({repositoryMatch:{route:"/"}}),"homepage");assert.equal(m.inferVisualPageType({title:"Landingpage Test"}),"landingpage");});\n\ntest("Produktplan ist realistisch und ChatGPT-kompatibel",async()=>{const m=await import(pathToFileURL(ENGINE).href);const p=m.buildVisualGenerationPlan({type:"product",title:"SureFlap Connect",slug:"sureflap-connect",reason:"Hub App Batterie Wandeinbau",evidence:[{url:"https://example.com"}]});assert.ok(p.assets.length>=8);assert.match(p.masterPrompt,/separaten Bildgenerierungsaufruf/);assert.match(p.masterPrompt,/nur „weiter“ schreibe/);assert.match(p.masterPrompt,/Möglichst realistisch/);assert.ok(p.assets.some(x=>x.id==="hub-system"));assert.ok(p.assets.some(x=>x.id==="installation"));assert.ok(p.assets.every(x=>x.filename.endsWith(".webp")));});\n\ntest("Vergleich und Ratgeber haben Entscheidungsmotive",async()=>{const m=await import(pathToFileURL(ENGINE).href);const c=m.buildVisualGenerationPlan({repositoryMatch:{route:"/vergleiche/gps/"},title:"GPS Vergleich"});const g=m.buildVisualGenerationPlan({repositoryMatch:{route:"/hund-trinkt-viel/"},title:"Hund trinkt viel"});assert.ok(c.assets.some(x=>x.id==="decision-tree"));assert.ok(c.assets.some(x=>x.id==="tradeoffs"));assert.ok(g.assets.some(x=>x.id==="checklist"));assert.ok(g.assets.some(x=>x.id==="warning-signs"));});\n\ntest("Research-Visuals werden dedupliziert",async()=>{const m=await import(pathToFileURL(ENGINE).href);const p=m.buildVisualGenerationPlan({title:"Ratgeber",serpGap:{missingVisuals:["Trinkmengen-Tabelle","Trinkmengen-Tabelle"]},refreshPlan:{visuals:["Wann zum Tierarzt"]}});const all=p.assets.map(x=>x.prompt).join("\\n");assert.match(all,/Trinkmengen-Tabelle/);assert.match(all,/Wann zum Tierarzt/);assert.equal(p.assets.filter(x=>x.prompt.includes("Trinkmengen-Tabelle")).length,1);});\n\ntest("Cockpit-Integration ist vorhanden",()=>{const g=fs.readFileSync(GROWTH,"utf8");const p=fs.readFileSync(PROMPT,"utf8");const w=fs.readFileSync(WORKBENCH,"utf8");assert.match(g,/visualPlan: VisualGenerationPlan/);assert.match(g,/visualPrompt: visualPlan\\.masterPrompt/);assert.match(p,/VISUAL-BRIEFING/);assert.match(w,/data-copy-visual-prompt/);assert.match(w,/Bildsatz-Prompt kopieren/);assert.match(w,/growth-copy-actions>\\*\\{width:100%\\}/);assert.doesNotMatch(w,/!important/);});\n`;
writeIfChanged(ROOT, BACKUP, TEST, testSource);

const pkg = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
pkg.scripts ??= {};
pkg.scripts["test:visual-generation"] = "node --experimental-strip-types --test test/visual-generation-engine-2.3.1.test.mjs";
writeIfChanged(ROOT, BACKUP, PACKAGE, JSON.stringify(pkg, null, 2) + "\n");

const finalPkg = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
for (const script of ["test:visual-generation", "test:research", "build"]) {
  if (!finalPkg.scripts?.[script]) throw new Error(`package.json: npm-Skript fehlt: ${script}`);
}

execFileSync(process.execPath, ["--check", fileURLToPath(import.meta.url)], {
  cwd: ROOT,
  stdio: "inherit",
  windowsHide: true
});

log("Fachliche Ergebnisvalidierung bestanden.");
runNpm(ROOT, ["--workspace", "apps/pfotentechnik", "run", "test:visual-generation"]);
runNpm(ROOT, ["--workspace", "apps/pfotentechnik", "run", "test:research"]);
runNpm(ROOT, ["--workspace", "apps/pfotentechnik", "run", "build"]);
log("Visual Engine, Research-Tests und vollständiger Build erfolgreich.");
log("Fertig.");
