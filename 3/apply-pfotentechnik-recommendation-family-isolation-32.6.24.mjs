#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-recommendation-family-isolation-32.6.24";

function root(start) {
  let d = path.resolve(start);
  for (let i=0;i<10;i++) {
    if (fs.existsSync(path.join(d,"apps","pfotentechnik","package.json"))) return d;
    const p=path.dirname(d); if(p===d) break; d=p;
  }
  throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
}
const r=root(process.cwd());
const file=path.join(r,"apps/pfotentechnik/src/domain/recommendationLinks.ts");
if(!fs.existsSync(file)) throw new Error(`[${PATCH}] Datei fehlt: ${path.relative(r,file)}`);
let s=fs.readFileSync(file,"utf8");
const backup=`${file}.${PATCH}.bak`;
if(!fs.existsSync(backup)) fs.copyFileSync(file,backup);

const old = `  const topicFamily = topics.find((topic): topic is RecommendationFamily =>
    ["futterautomaten", "trinkbrunnen", "gps-tracker", "katzenklappen", "haustierkameras", "katzentoiletten"].includes(topic)
  );
  if (topicFamily) return topicFamily;

  const category = normalize([
    typeof data.category === "string" ? data.category : data.category?.key,
    typeof data.category === "object" ? data.category?.label : "",
    data.contentPlatform?.cluster,
    ...asArray(data.hub?.sections)
  ].filter(Boolean).join(" "));`;

const neu = `  const explicitFamilyText = normalize([
    data.contentPlatform?.cluster,
    data.decisionJourney?.cluster,
    ...asArray(data.hub?.sections),
    ...asArray(data.linking?.contexts),
    typeof data.category === "string" ? data.category : data.category?.key,
    typeof data.category === "object" ? data.category?.label : ""
  ].filter(Boolean).join(" "));

  // Explizite Cluster-/Hub-Metadaten haben Vorrang vor semantischen Topics.
  // Sonst kann z.B. "Katze" + "App" einer Katzentoiletten-Seite einen
  // fachfremden Futterautomaten-Kandidaten erlauben.
  for (const [family, pattern] of FAMILY_PATTERNS) {
    if (pattern.test(explicitFamilyText)) return family;
  }

  const topicFamily = topics.find((topic): topic is RecommendationFamily =>
    ["futterautomaten", "trinkbrunnen", "gps-tracker", "katzenklappen", "haustierkameras", "katzentoiletten"].includes(topic)
  );
  if (topicFamily) return topicFamily;

  const category = explicitFamilyText;`;

if(!s.includes(old)) throw new Error(`[${PATCH}] Erwarteter detectRecommendationFamily-Block nicht gefunden. Aktuellen Git-Stand prüfen.`);
s=s.replace(old,neu);

const oldCompat = `const hasCompatibleRecommendationTopic = (source: Context, candidate: Context) => {
  if (source.family && candidate.family && source.family !== candidate.family) {
    return false;
  }
  if (source.topics.size === 0 || candidate.topics.size === 0) {
    return !source.family || !candidate.family || source.family === candidate.family;
  }
  return overlapCount(source.topics, candidate.topics) > 0;
};`;

const newCompat = `const hasCompatibleRecommendationTopic = (source: Context, candidate: Context) => {
  // Bei einer erkannten Produktfamilie gilt fail-closed:
  // Kandidaten ohne dieselbe Familie dürfen nicht als Next Step erscheinen.
  if (source.family) {
    return candidate.family === source.family;
  }
  if (candidate.family && source.family !== candidate.family && source.topics.size === 0) {
    return false;
  }
  if (source.topics.size === 0 || candidate.topics.size === 0) {
    return true;
  }
  return overlapCount(source.topics, candidate.topics) > 0;
};`;

if(!s.includes(oldCompat)) throw new Error(`[${PATCH}] Erwarteter Kompatibilitätsblock nicht gefunden.`);
s=s.replace(oldCompat,newCompat);

fs.writeFileSync(file,s,"utf8");

const reportDir=path.join(r,"apps/pfotentechnik/reports/recommendations");
fs.mkdirSync(reportDir,{recursive:true});
const report=path.join(reportDir,"recommendation-family-isolation-32.6.24.md");
fs.writeFileSync(report,`# Recommendation Family Isolation 32.6.24

## Ursache
Die Next-Step-Logik leitete die Produktfamilie zuerst aus allgemeinen semantischen Topics ab.
Die Seite \`automatische-katzentoiletten\` besitzt jedoch bereits eindeutige Metadaten:
\`contentPlatform.cluster: automatische-katzentoiletten\`,
\`decisionJourney.cluster: automatische-katzentoiletten\` und den entsprechenden Hub.

Dadurch konnten fachfremde Kandidaten über gemeinsame Signale wie Katze, App oder Kaufberatung ranken.

## Fix
1. Explizite Cluster-, Journey-, Hub- und Linking-Metadaten bestimmen die Produktfamilie vor semantischen Topics.
2. Sobald die Quellseite eine Produktfamilie besitzt, gilt für Next Steps fail-closed:
   nur Kandidaten derselben Produktfamilie sind zulässig.
3. Fehlt ein passender Kandidat, wird keine fachfremde Ersatzkarte erzeugt.

Der Fix ist global und nicht auf Katzentoiletten hart codiert.
`, "utf8");

console.log(`[${PATCH}] Backup: ${path.relative(r,backup)}`);
console.log(`[${PATCH}] Gepatcht: ${path.relative(r,file)}`);
console.log(`[${PATCH}] Explizite Produktfamilie hat jetzt Vorrang; Matching ist fail-closed.`);
console.log(`[${PATCH}] Report: ${path.relative(r,report)}`);
console.log(`[${PATCH}] Fertig.`);
