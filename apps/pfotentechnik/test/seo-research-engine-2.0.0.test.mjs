import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../..");
const APP=path.join(ROOT,"apps","pfotentechnik");
const prompt=fs.readFileSync(path.join(APP,"src","lib","seo","research","prompt-builder.ts"),"utf8");
const schema=fs.readFileSync(path.join(APP,"src","lib","seo","research","schema.ts"),"utf8");

test("Prompt funktioniert eigenständig in ChatGPT",()=>{assert.match(prompt,/direkt in ChatGPT mit aktiviertem Webzugriff/);assert.match(prompt,/Gib ausschließlich valides JSON zurück/);assert.match(prompt,/buildChatGptResearchPrompt/);});
test("SERP und Information Gain sind enthalten",()=>{assert.match(prompt,/ersten zehn organischen Ergebnisse/);assert.match(prompt,/missingCalculators/);assert.match(prompt,/missingDecisionTools/);assert.match(prompt,/informationGain/);});
test("Lifecycle ist enthalten",()=>{assert.match(prompt,/Rückrufe/);assert.match(prompt,/Firmware/);assert.match(prompt,/app-update/);assert.match(prompt,/discontinued/);});
test("Refresh und Bundles sind enthalten",()=>{assert.match(prompt,/refreshPlan/);assert.match(prompt,/actionBundle/);assert.match(prompt,/estimatedContentHours/);assert.match(prompt,/affectedComparisons/);});
test("Schema validiert Version 2",()=>{assert.match(schema,/ResearchOpportunity/);assert.match(schema,/ResearchSerpGap/);assert.match(schema,/ResearchLifecycle/);assert.match(schema,/ResearchRefreshPlan/);assert.match(schema,/ResearchActionBundle/);assert.match(schema,/version:1\|2/);});
