import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../..");
const APP=path.join(ROOT,"apps/pfotentechnik");
const ENGINE=path.join(APP,"src/lib/seo/research/visual-generation.ts");
const GROWTH=path.join(APP,"src/lib/seo/research/growth.ts");
const PROMPT=path.join(APP,"src/lib/seo/research/prompt-builder.ts");
const WORKBENCH=path.join(APP,"src/components/admin/ResearchWorkbench.astro");

test("Seitentypen werden erkannt",async()=>{const m=await import(pathToFileURL(ENGINE).href);assert.equal(m.inferVisualPageType({type:"product",title:"Produkt"}),"product");assert.equal(m.inferVisualPageType({repositoryMatch:{route:"/vergleiche/test/"}}),"comparison");assert.equal(m.inferVisualPageType({repositoryMatch:{route:"/ratgeber/"}}),"guide");assert.equal(m.inferVisualPageType({type:"manufacturer"}),"manufacturer");assert.equal(m.inferVisualPageType({title:"Kategorie Themenhub"}),"category");assert.equal(m.inferVisualPageType({repositoryMatch:{route:"/"}}),"homepage");assert.equal(m.inferVisualPageType({title:"Landingpage Test"}),"landingpage");});

test("Produktplan ist realistisch und ChatGPT-kompatibel",async()=>{const m=await import(pathToFileURL(ENGINE).href);const p=m.buildVisualGenerationPlan({type:"product",title:"SureFlap Connect",slug:"sureflap-connect",reason:"Hub App Batterie Wandeinbau",evidence:[{url:"https://example.com"}]});assert.ok(p.assets.length>=8);assert.match(p.masterPrompt,/separaten Bildgenerierungsaufruf/);assert.match(p.masterPrompt,/nur „weiter“ schreibe/);assert.match(p.masterPrompt,/Möglichst realistisch/);assert.ok(p.assets.some(x=>x.id==="hub-system"));assert.ok(p.assets.some(x=>x.id==="installation"));assert.ok(p.assets.every(x=>x.filename.endsWith(".webp")));});

test("Vergleich und Ratgeber haben Entscheidungsmotive",async()=>{const m=await import(pathToFileURL(ENGINE).href);const c=m.buildVisualGenerationPlan({repositoryMatch:{route:"/vergleiche/gps/"},title:"GPS Vergleich"});const g=m.buildVisualGenerationPlan({repositoryMatch:{route:"/hund-trinkt-viel/"},title:"Hund trinkt viel"});assert.ok(c.assets.some(x=>x.id==="decision-tree"));assert.ok(c.assets.some(x=>x.id==="tradeoffs"));assert.ok(g.assets.some(x=>x.id==="checklist"));assert.ok(g.assets.some(x=>x.id==="warning-signs"));});

test("Research-Visuals werden dedupliziert",async()=>{const m=await import(pathToFileURL(ENGINE).href);const p=m.buildVisualGenerationPlan({title:"Ratgeber",serpGap:{missingVisuals:["Trinkmengen-Tabelle","Trinkmengen-Tabelle"]},refreshPlan:{visuals:["Wann zum Tierarzt"]}});const all=p.assets.map(x=>x.prompt).join("\n");assert.match(all,/Trinkmengen-Tabelle/);assert.match(all,/Wann zum Tierarzt/);assert.equal(p.assets.filter(x=>x.prompt.includes("Trinkmengen-Tabelle")).length,1);});

test("Cockpit-Integration ist vorhanden",()=>{const g=fs.readFileSync(GROWTH,"utf8");const p=fs.readFileSync(PROMPT,"utf8");const w=fs.readFileSync(WORKBENCH,"utf8");assert.match(g,/visualPlan: VisualGenerationPlan/);assert.match(g,/visualPrompt: visualPlan\.masterPrompt/);assert.match(p,/VISUAL-BRIEFING/);assert.match(w,/data-copy-visual-prompt/);assert.match(w,/Bildsatz-Prompt kopieren/);assert.match(w,/growth-copy-actions>\*\{width:100%\}/);assert.doesNotMatch(w,/!important/);});
