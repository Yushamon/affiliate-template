#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const appRoot=path.resolve(fileURLToPath(new URL("..",import.meta.url)));
const required=[
  "src/components/product-experience-2/ProductExperience2.astro",
  "src/components/product-experience-2/ProductHero2.astro",
  "src/components/product-experience-2/ProductDecisionAssistant.astro",
  "src/components/product-experience-2/ProductEverydayTimeline.astro",
  "src/components/product-experience-2/ProductAlternatives2.astro",
  "src/components/product-experience-2/ProductTrust2.astro",
  "src/domain/productExperience/model.ts",
  "src/domain/productExperience/decisionEngine.ts",
  "src/domain/price/engine.ts"
];
const findings=[];
for(const relative of required)try{const source=await fs.readFile(path.join(appRoot,relative),"utf8");if(!source.trim())findings.push(`${relative}: leer`)}catch{findings.push(`${relative}: fehlt`)}
const renderer=await fs.readFile(path.join(appRoot,"src/components/product-standard-2/ProductRenderer.astro"),"utf8");if(!renderer.includes("ProductExperience2"))findings.push("ProductRenderer nutzt Product Experience 2.0 nicht.");if(renderer.split(/\r?\n/).length>120)findings.push("ProductRenderer ist erneut zu einem Monolithen angewachsen.");
const page=await fs.readFile(path.join(appRoot,"src/pages/produkt/[product].astro"),"utf8");if(!page.includes("currentEntry={contentEntry}"))findings.push("Produktseite übergibt den aktuellen Content-Eintrag nicht.");if(!page.includes("allProducts={allProducts}"))findings.push("Produktseite übergibt den Vergleichsbestand nicht.");if(page.includes("pt-everyday-review"))findings.push("Alter doppelter Alltagstest ist noch aktiv.");
const report={generatedAt:new Date().toISOString(),ok:findings.length===0,findings};await fs.mkdir(path.join(appRoot,"reports"),{recursive:true});await fs.writeFile(path.join(appRoot,"reports","product-experience-2-audit.json"),JSON.stringify(report,null,2));console.log(findings.length?`Product Experience 2.0: ${findings.length} Fehler.`:"Product Experience 2.0: Architektur vollständig.");for(const finding of findings)console.error(`- ${finding}`);if(findings.length)process.exitCode=1;
