import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const content=fs.readFileSync(path.join(app,"src/content/pages/smarte-futterautomaten.md"),"utf8");

test("redundante Premium-Blöcke entfernt",()=>{
  assert.doesNotMatch(content,/title:\s*"Welcher smarte Futterautomat passt zu dir\?"/);
  assert.doesNotMatch(content,/title:\s*"Ausgewählte smarte Futterautomaten"/);
  assert.doesNotMatch(content,/title:\s*"Die wichtigsten Qualitätsmerkmale"/);
});

test("redaktionelle Kurzantwort bleibt im Haupttext",()=>{
  assert.match(content,/## Das Wichtigste in 30 Sekunden/);
  assert.match(content,/Für viele Haushalte ist ein Trockenfutterautomat mit lokal gespeichertem Zeitplan und Batterie-Backup/);
  assert.match(content,/## Auswahlhilfe: Welcher Futterautomat passt zu dir\?/);
});

test("wesentliche Premium-Entscheidungsblöcke bleiben",()=>{
  for(const type of ["quickFacts","scenarios","decision","mistakes"])
    assert.match(content,new RegExp('type: "'+type+'"'));
});

test("Vergleich und Qualitätsinhalt bleiben",()=>{
  assert.match(content,/comparisonRecommendation:/);
  assert.match(content,/### 6\. Reinigung/);
  assert.match(content,/### 7\. Sicherheit/);
  assert.match(content,/### 8\. App, Datenschutz und Folgekosten/);
  assert.match(content,/### 10\. Ersatzteile und langfristige Nutzung/);
  assert.match(content,/## Portionen richtig kalibrieren/);
});
