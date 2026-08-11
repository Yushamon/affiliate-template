#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-external-evidence-batch-5-33.8.5";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = path.join(root, "apps", "pfotentechnik");
const productDir = path.join(app, "src", "content", "products");
const audit = path.join(app, "scripts", "product-evidence", "audit.mjs");
const queue = path.join(app, "scripts", "product-evidence", "research-queue.mjs");
const testFile = path.join(app, "test", "external-evidence-batch-5-33.8.5.test.mjs");

const blocks = {
  "petkit-yumshare-solo-2": "externalEvidence:\n  professionalReviews:\n    - publisher: \"PetTech AI\"\n      title: \"PETKIT YumShare Solo 2 Review: Useful AI or Breakfast Surveillance?\"\n      url: \"https://pettechai.com/petkit-yumshare-solo-2-camera-review/\"\n      checkedAt: \"2026-08-11\"\n      methodology: \"editorial-review\"\n      positives:\n        - \"Die redaktionelle Analyse sieht den gr\u00f6\u00dften Mehrwert in der Verbindung aus Futterausgabe, Kamera, Tiererkennung und Mahlzeitenhistorie.\"\n        - \"F\u00fcr Haushalte, die visuell pr\u00fcfen m\u00f6chten, was nach der Futterausgabe passiert, wird das Konzept als sinnvoll eingeordnet.\"\n      negatives:\n        - \"Die Tiererkennung steuert keinen physischen Zugang und verhindert daher nicht, dass ein anderes Tier frisst.\"\n        - \"F\u00fcr das 2026 eingef\u00fchrte Modell fehlt noch belastbare Langzeiterfahrung.\"\n      findings:\n        - \"Die Quelle kennzeichnet ausdr\u00fccklich, dass kein Langzeit-Hands-on-Test durchgef\u00fchrt wurde und basiert ihre Einordnung auf Spezifikationen, Softwarebedingungen und fr\u00fcher Eigent\u00fcmer-Evidenz.\"\n  userReviews:\n    - platform: \"TikTok Shop\"\n      url: \"https://shop.tiktok.com/us/pdp/smart-automatic-pet-feeder-petkit-yumshare-solo-with-1080p-camera-app/1729471870039069198\"\n      checkedAt: \"2026-08-11\"\n      rating: 5\n      scale: 5\n      reviewCount: 7\n      recurringPositives:\n        - \"Die kleine fr\u00fche Stichprobe lobt Kameraqualit\u00e4t, einfache Bedienung und Komfort der automatischen F\u00fctterung.\"\n      recurringCriticism: []\n  consensus:\n    strengths:\n      - finding: \"Kamera, Zeitplanung und visuelle Mahlzeitenkontrolle sind der klar erkennbare Mehrwert des Solo 2.\"\n        sourceCount: 2\n        confidence: \"medium\"\n    weaknesses:\n      - finding: \"Die AI-Zuordnung ist keine physische Zugangskontrolle und die Langzeitzuverl\u00e4ssigkeit des jungen Modells ist noch nicht belastbar.\"\n        sourceCount: 1\n        confidence: \"medium\"\n    editorialAssessment: >-\n      Die externe Evidenz reicht jetzt f\u00fcr eine vorsichtige Einordnung, aber nicht f\u00fcr starke Langzeitaussagen.\n      Die Nutzerstichprobe ist klein und die professionelle Quelle ist ausdr\u00fccklich research-led statt hands-on.\n  note: >-\n    Bewertungen des \u00e4lteren YumShare Solo werden nicht auf Solo 2 \u00fcbertragen. Die kleine TikTok-Shop-Stichprobe\n    wird nur als fr\u00fches produktspezifisches Nutzersignal gewertet.\n",
  "petkit-eversweet-ultra": "externalEvidence:\n  professionalReviews:\n    - publisher: \"The Verge\"\n      title: \"Petkit's first automatic wet food feeder keeps track of how much your pet eats\"\n      url: \"https://www.theverge.com/news/850992/petkit-ai-camera-yumshare-daily-feast-automatic-wet-food-feeder-eversweet-ultra-fountain\"\n      publishedAt: \"2026-01-02\"\n      checkedAt: \"2026-08-11\"\n      methodology: \"editorial-review\"\n      positives:\n        - \"Die unabh\u00e4ngige CES-Berichterstattung hebt das nicht-rezirkulierende Wasserprinzip und die individuelle Trinkbeobachtung per Kamera als Kernunterschiede hervor.\"\n      negatives:\n        - \"Die Berichterstattung ist Produktvorstellung und kein Langzeit-Praxistest.\"\n      findings:\n        - \"The Verge beschreibt das konkrete Eversweet-Ultra-Modell mit 1080p-Kamera, Mehrtier-Erkennung und getrenntem Frisch-/Abwasserprinzip.\"\n  userReviews:\n    - platform: \"Chewy\"\n      url: \"https://www.chewy.com/petkit-ever-sweet-ultra-automatic/product-reviews/4452958\"\n      checkedAt: \"2026-08-11\"\n      rating: 4.3\n      scale: 5\n      reviewCount: 4\n      recurringPositives:\n        - \"Die kleine Stichprobe lobt Trinkakzeptanz, Kamera und das wartungsarme Reinigungskonzept.\"\n      recurringCriticism:\n        - \"Ein K\u00e4ufer berichtet, dass die Erstinbetriebnahme entgegen der Erwartung eine App-Bindung erforderte.\"\n        - \"Ein weiterer Nutzer berichtet von unzuverl\u00e4ssiger Tiererkennung.\"\n  consensus:\n    strengths:\n      - finding: \"Frisch-/Abwassertrennung und individuelle Trinkbeobachtung sind die klarsten Differenzierungsmerkmale.\"\n        sourceCount: 2\n        confidence: \"medium\"\n    weaknesses:\n      - finding: \"App-Abh\u00e4ngigkeit und Tiererkennung sind in der fr\u00fchen Nutzerbasis noch nicht durchgehend verl\u00e4sslich.\"\n        sourceCount: 1\n        confidence: \"low\"\n    editorialAssessment: >-\n      Die unabh\u00e4ngige Produktberichterstattung best\u00e4tigt das technische Konzept, w\u00e4hrend die kleine Chewy-Stichprobe\n      erste praktische St\u00e4rken und Schw\u00e4chen zeigt. F\u00fcr Langzeitzuverl\u00e4ssigkeit ist die Datenlage weiterhin zu jung.\n  note: >-\n    Kein unabh\u00e4ngiger Langzeit-Hands-on-Test. Herstellerbewertungen werden nicht als unabh\u00e4ngige Nutzerquelle gewertet.\n",
  "petsafe-freshfeed-refrigerated-feeder": "externalEvidence:\n  professionalReviews:\n    - publisher: \"Her Cozy Crew\"\n      title: \"PetSafe FreshFeed Review: Automatic Wet Food Feeder for Cats\"\n      url: \"https://www.hercozycrew.com/post/petsafe-freshfeed-refrigerated-pet-feeder-review\"\n      checkedAt: \"2026-08-11\"\n      methodology: \"hands-on\"\n      positives:\n        - \"Die Autorin nutzte das Ger\u00e4t im eigenen Haushalt mit zwei Katzen und beschreibt Einrichtung und Zeitplanung als unkompliziert.\"\n        - \"Die aktive K\u00fchlung erleichterte die planbare Nassfutterf\u00fctterung im Alltag.\"\n        - \"Der F\u00fctterungston wurde von den Katzen nicht als st\u00f6rend beschrieben.\"\n      negatives:\n        - \"Das Testger\u00e4t wurde von PetSafe kostenlos zur Verf\u00fcgung gestellt.\"\n      findings:\n        - \"Der Beitrag basiert auf tats\u00e4chlicher Nutzung im Haushalt und kennzeichnet die Produktbereitstellung transparent.\"\n    - publisher: \"Spchlang\"\n      title: \"PetSafe FreshFeed Frozen Pet Food Review: Fresh Food on Schedule Without Rushing\"\n      url: \"https://www.spchlang.com/index.php/2026/07/03/petsafe-freshfeed-frozen-pet-food-review-fresh-food-on-schedule-without-rushing/\"\n      publishedAt: \"2026-07-03\"\n      checkedAt: \"2026-08-11\"\n      methodology: \"hands-on\"\n      positives:\n        - \"Der Praxiseinsatz hebt aktive K\u00fchlung und vorbereitete kleine Mahlzeiten als Hauptnutzen hervor.\"\n      negatives:\n        - \"Der Beitrag liefert noch keine belastbare Langzeiterfahrung \u00fcber viele Monate.\"\n      findings:\n        - \"Die Quelle beschreibt den Einsatz mit einem Hund, der frische beziehungsweise gek\u00fchlte Nahrung erh\u00e4lt.\"\n  userReviews:\n    - platform: \"Chewy\"\n      url: \"https://www.chewy.com/petsafe-freshfeed-refrigerated-dog/product-reviews/3967438\"\n      checkedAt: \"2026-08-11\"\n      rating: 4.5\n      scale: 5\n      reviewCount: 31\n      recurringPositives:\n        - \"Aktive K\u00fchlung, einfache App-Einrichtung und planbare Mahlzeiten werden h\u00e4ufig positiv beschrieben.\"\n        - \"Leiser Betrieb und leicht herausnehmbare Edelstahl-Eins\u00e4tze werden wiederholt gelobt.\"\n      recurringCriticism:\n        - \"Ein gro\u00dfer Teil der fr\u00fchen Rezensionen stammt aus kostenlos bereitgestellten Produkttests und ist daher vorsichtig zu gewichten.\"\n        - \"Hohe Bauform und schmale N\u00e4pfe passen nicht zu jedem Tier; eine organische Rezension nennt Whisker-Stress bei einer Katze.\"\n  consensus:\n    strengths:\n      - finding: \"Aktive K\u00fchlung und vorbereitete zeitgesteuerte Nass- oder Frischfuttermahlzeiten funktionieren in mehreren Quellen als klarer Alltagsvorteil.\"\n        sourceCount: 3\n        confidence: \"high\"\n      - finding: \"Einrichtung und App-Steuerung werden \u00fcberwiegend als unkompliziert beschrieben.\"\n        sourceCount: 2\n        confidence: \"medium\"\n    weaknesses:\n      - finding: \"Napfform und Bauh\u00f6he k\u00f6nnen f\u00fcr einzelne Katzen unpassend sein.\"\n        sourceCount: 1\n        confidence: \"medium\"\n      - finding: \"Die Nutzerbasis ist wegen vieler incentivierter Fr\u00fchbewertungen noch kein starker Beleg f\u00fcr Langzeitzuverl\u00e4ssigkeit.\"\n        sourceCount: 1\n        confidence: \"high\"\n    editorialAssessment: >-\n      Zwei Hands-on-Berichte und die Chewy-Basis st\u00fctzen den Kernnutzen der aktiven K\u00fchlung. Wegen des jungen Produkts\n      und vieler incentivierter Fr\u00fchbewertungen bleiben Haltbarkeit und Langzeitzuverl\u00e4ssigkeit offen.\n  note: >-\n    Die kostenlose Bereitstellung im Her-Cozy-Crew-Test und der hohe Anteil incentivierter Chewy-Bewertungen werden\n    ausdr\u00fccklich ber\u00fccksichtigt. Externe Ratings flie\u00dfen nicht in den PfotenTechnik-Score ein.\n",
};

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(root, ".patch-backups", `${PATCH}-${stamp}`);
fs.mkdirSync(backup, { recursive: true });
const changed = [];

const replaceExternal = (raw, replacement, slug) => {
  const lines = raw.split(/\r?\n/);
  const start = lines.findIndex((line) => /^externalEvidence:\s*$/.test(line));
  if (start < 0) throw new Error(`externalEvidence fehlt: ${slug}`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^[A-Za-z0-9_äöüÄÖÜß-]+:\s*/.test(lines[i])) {
      end = i;
      break;
    }
  }
  const before = lines.slice(0, start).join("\n");
  const after = lines.slice(end).join("\n");
  return before + "\n" + replacement.trimEnd() + "\n" + after + (raw.endsWith("\n") ? "\n" : "");
};

try {
  for (const [slug, block] of Object.entries(blocks)) {
    const file = path.join(productDir, `${slug}.md`);
    if (!fs.existsSync(file)) throw new Error(`Produktdatei fehlt: ${slug}`);
    const raw = fs.readFileSync(file, "utf8");
    const backupFile = path.join(backup, path.relative(root, file));
    fs.mkdirSync(path.dirname(backupFile), { recursive: true });
    fs.copyFileSync(file, backupFile);
    fs.writeFileSync(file, replaceExternal(raw, block, slug), "utf8");
    changed.push(slug);
    console.log(`[${PATCH}] Evidence aktualisiert: ${slug}`);
  }

  const test = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(slug)=>fs.readFileSync(path.join(app,"src/content/products",slug+".md"),"utf8");

test("YumShare Solo 2 enthält research-led Review und produktspezifische Nutzerquelle",()=>{
  const s=read("petkit-yumshare-solo-2");
  assert.ok(s.includes("pettechai.com/petkit-yumshare-solo-2-camera-review"));
  assert.ok(s.includes("TikTok Shop"));
  assert.ok(s.includes('methodology: "editorial-review"'));
});

test("Eversweet Ultra nutzt unabhängige Berichterstattung und Chewy",()=>{
  const s=read("petkit-eversweet-ultra");
  assert.ok(s.includes("theverge.com/news/850992"));
  assert.ok(s.includes("chewy.com/petkit-ever-sweet-ultra"));
});

test("FreshFeed enthält transparente Hands-on-Evidenz",()=>{
  const s=read("petsafe-freshfeed-refrigerated-feeder");
  assert.ok(s.includes("hercozycrew.com/post/petsafe-freshfeed"));
  assert.ok(s.includes("spchlang.com/index.php/2026/07/03"));
  assert.ok(s.includes("kostenlos zur Verfügung gestellt"));
  assert.ok(s.includes("incentivierter"));
});

test("Oneisall bleibt bewusst unangetastet und partial",()=>{
  const s=read("oneisall-2-in-1-feeder-water");
  assert.ok(s.includes('publisher: "WIRED"'));
  assert.ok(s.includes("userReviews: []"));
});

test("PfotenTechnik-Ratings bleiben erhalten",()=>{
  for(const slug of ["petkit-yumshare-solo-2","petkit-eversweet-ultra","petsafe-freshfeed-refrigerated-feeder"]) {
    assert.match(read(slug),/^rating:\s*[0-9.]+$/m);
  }
});
`;
  fs.writeFileSync(testFile, test, "utf8");

  const checks = [
    ["Test-Syntax", ["--check", testFile]],
    ["Batch-Test", ["--test", testFile]],
    ["Evidence-Audit", [audit]],
    ["NOW-Queue", [queue, "--lane=NOW", "--limit=10"]]
  ];
  for (const [label,args] of checks) {
    console.log(`[${PATCH}] Prüfe: ${label}`);
    const r=spawnSync(process.execPath,args,{cwd:root,stdio:"inherit"});
    if(r.status!==0) throw new Error(`${label} fehlgeschlagen (Exit ${r.status})`);
    console.log(`[${PATCH}] BESTANDEN: ${label}`);
  }

  console.log(`[${PATCH}] Abgeschlossen. Geändert: ${changed.length}`);
  console.log(`[${PATCH}] Oneisall bleibt bewusst partial bis produktspezifische Nutzer-Evidenz vorliegt.`);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
} catch (error) {
  for (const slug of changed) {
    const file = path.join(productDir, `${slug}.md`);
    const backupFile = path.join(backup, path.relative(root, file));
    if (fs.existsSync(backupFile)) fs.copyFileSync(backupFile, file);
  }
  if (fs.existsSync(testFile)) fs.rmSync(testFile);
  console.error(`[${PATCH}] FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  console.error(`[${PATCH}] Änderungen wurden zurückgerollt.`);
  process.exit(1);
}
