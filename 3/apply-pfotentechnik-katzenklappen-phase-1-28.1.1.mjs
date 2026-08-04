#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PATCH = 'pfotentechnik-katzenklappen-phase-1-28.1.1';
const APP = path.join('apps', 'pfotentechnik');
const root = process.cwd();
const appRoot = path.join(root, APP);
const args = new Set(process.argv.slice(2));
const runChecks = !args.has('--no-checks');

const targets = {
  hub: path.join(appRoot, 'src', 'content', 'pages', 'katzenklappen.md'),
  product: path.join(appRoot, 'src', 'content', 'products', 'sureflap-mikrochip-katzenklappe-connect.md'),
  journey: path.join(appRoot, 'src', 'lib', 'seo', 'topical-authority', 'journey-completion.ts'),
  test: path.join(appRoot, 'test', 'katzenklappen-phase-1-28.1.1.test.mjs'),
  audit: path.join(appRoot, 'research', 'katzenklappen-phase-1-web-audit-2026-08-04.json'),
  prompt: path.join(appRoot, 'research', 'visual-prompts', 'sureflap-connect-visual-master-prompt.txt'),
};

if (!fs.existsSync(appRoot)) throw new Error(`[${PATCH}] Projektpfad fehlt: ${APP}. Installer aus dem Repository-Root starten.`);
for (const key of ['hub', 'product', 'journey']) {
  if (!fs.existsSync(targets[key])) throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${path.relative(root, targets[key])}`);
}

const backupRoot = path.join(root, '.patch-backups', `${PATCH}-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const changed = [];
const unchanged = [];

const normalize = (value) => value.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
const ensureDir = (file) => fs.mkdirSync(path.dirname(file), { recursive: true });
function backup(file) {
  if (!fs.existsSync(file)) return;
  const dest = path.join(backupRoot, path.relative(root, file));
  ensureDir(dest);
  fs.copyFileSync(file, dest);
}
function write(file, content) {
  const next = normalize(content);
  const previous = fs.existsSync(file) ? normalize(fs.readFileSync(file, 'utf8')) : null;
  if (previous === next) { unchanged.push(path.relative(root, file)); return; }
  backup(file);
  ensureDir(file);
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, next, 'utf8');
  fs.renameSync(tmp, file);
  changed.push(path.relative(root, file));
}
function splitFrontmatter(markdown) {
  const text = markdown.replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) throw new Error('Markdown besitzt kein erwartetes Frontmatter.');
  const end = text.indexOf('\n---\n', 4);
  if (end < 0) throw new Error('Frontmatter-Ende fehlt.');
  return { frontmatter: text.slice(4, end), body: text.slice(end + 5) };
}
const joinFrontmatter = (frontmatter, body) => `---\n${frontmatter.trimEnd()}\n---\n\n${body.trimStart()}`;
function setTopLevelScalar(frontmatter, key, serializedValue) {
  const lines = frontmatter.split('\n');
  const index = lines.findIndex((line) => new RegExp(`^${key}:`).test(line));
  const next = `${key}: ${serializedValue}`;
  if (index >= 0) lines[index] = next; else lines.push(next);
  return lines.join('\n');
}
function removeTopLevelKey(frontmatter, key) {
  const lines = frontmatter.split('\n');
  const index = lines.findIndex((line) => new RegExp(`^${key}:`).test(line));
  if (index < 0) return frontmatter;
  let end = index + 1;
  while (end < lines.length && (/^\s/.test(lines[end]) || lines[end].trim() === '')) end += 1;
  lines.splice(index, end - index);
  return lines.join('\n');
}
function replaceSection(body, heading, replacement) {
  const lines = body.split('\n');
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start < 0) return body;
  let end = start + 1;
  while (end < lines.length && !/^##\s+/.test(lines[end])) end += 1;
  lines.splice(start, end - start, ...replacement.trim().split('\n'));
  return lines.join('\n');
}
function insertBeforeHeading(body, heading, block) {
  if (body.includes(block.trim())) return body;
  const marker = `## ${heading}`;
  const at = body.indexOf(marker);
  if (at < 0) throw new Error(`Erwartete Überschrift fehlt: ${marker}`);
  return `${body.slice(0, at).trimEnd()}\n\n${block.trim()}\n\n${body.slice(at)}`;
}

// 1. Hub: sichtbare interne Architekturbegriffe entfernen und Entscheidung verdichten.
{
  const current = fs.readFileSync(targets.hub, 'utf8');
  let { frontmatter, body } = splitFrontmatter(current);
  frontmatter = setTopLevelScalar(frontmatter, 'updatedAt', '"2026-08-04"');
  body = body
    .replace(/Dieser Cornerstone besitzt den breiten Orientierungs- und Auswahl-Intent\.[^\n]*\n?/g, '')
    .replace(/Produktmaße, Chipformate und konkrete Systemgrenzen bleiben Eigentum der Produktseiten\./g, 'Konkrete Maße, Chipformate und Systemgrenzen findest du auf den jeweiligen Produktseiten.')
    .replace(/Intent-Owner/g, 'passende Vertiefungen');

  const quickDecision = `## Schnellentscheidung nach Nutzerproblem\n\n| Deine Hauptfrage | Passende Lösungsklasse | Vor dem Kauf prüfen |\n|---|---|---|\n| Fremde Katzen sollen draußen bleiben | Mikrochip-Katzenklappe mit selektivem Eintritt | Chip-Kompatibilität, Öffnungsmaß, Batteriewarnung |\n| Eine Katze darf hinaus, eine andere nicht | Modell mit individuellen Ein- und Austrittsrechten | Rechte müssen pro Tier und Richtung einstellbar sein |\n| Sperrzeiten oder Meldungen sollen aus der Ferne steuerbar sein | Vernetzte Katzenklappe | Hub oder WLAN, Konto, Offline-Verhalten |\n| Beuteeintrag ist das Hauptproblem | Klappe mit Beuteerkennung oder kompatible Nachrüstung | Erkennungsprinzip, Strom, WLAN, Fehlblockierungen |\n| Zugluft und Dämmung sind entscheidend | gedämmte oder motorisierte Tiertür | Einbaumaß, Anschluss, Stromversorgung, Notöffnung |\n\nEine App ersetzt weder die passende Öffnung noch eine verlässliche lokale Verriegelung. Entscheide deshalb zuerst nach Zugangsregel, Katze und Einbauort.`;
  body = insertBeforeHeading(body, 'Entscheidung in fünf Schritten', quickDecision);
  body = replaceSection(body, 'Intent-Owner im Cluster', `## Passende Vertiefungen\n\nDer [Mikrochip-Vergleich](/vergleiche/beste-mikrochip-katzenklappen/) stellt vollständige Klappen nach gemeinsamen Kriterien gegenüber. Der [Vergleich zu App und Beuteerkennung](/vergleiche/katzenklappen-mit-app-und-beuteerkennung/) trennt Komplettsysteme von Nachrüstlösungen.\n\nFür die Umsetzung helfen die Ratgeber zu [Einbau](/katzenklappe-einbauen/), [Gewöhnung](/katze-an-katzenklappe-gewoehnen/), [mehreren Katzen](/katzenklappe-fuer-mehrere-katzen/) sowie [Zugluft und Wärmedämmung](/katzenklappe-zugluft-und-waermedaemmung/).`);
  write(targets.hub, joinFrontmatter(frontmatter, body));
}

// 2. SureFlap Connect: Pflegezustand, Verfügbarkeit und nicht bewerteten Score bereinigen.
{
  const current = fs.readFileSync(targets.product, 'utf8');
  let { frontmatter, body } = splitFrontmatter(current);
  frontmatter = setTopLevelScalar(frontmatter, 'updatedAt', '"2026-08-04"');
  frontmatter = setTopLevelScalar(frontmatter, 'availability', '"unavailable"');
  frontmatter = setTopLevelScalar(frontmatter, 'availabilityReason', '"Sure Petcare Deutschland führte das Einzelgerät beim letzten Primärquellencheck als nicht vorrätig. Einzelgerät, Hub und Bundle bleiben getrennte Kaufvarianten; Lieferbarkeit vor dem Kauf erneut prüfen."');
  frontmatter = setTopLevelScalar(frontmatter, 'availabilityUpdated', '"2026-08-04T17:25:00.000Z"');
  frontmatter = setTopLevelScalar(frontmatter, 'maintenanceStatus', '"monitored"');
  frontmatter = setTopLevelScalar(frontmatter, 'visualStatus', '"reference-pack-required"');
  frontmatter = setTopLevelScalar(frontmatter, 'lastPrimarySourceCheck', '"2026-08-04"');
  frontmatter = removeTopLevelKey(frontmatter, 'rating');
  body = body.replace('Diese Produktseite bleibt der Intent-Owner für die konkrete SureFlap-Connect-Prüfung.', 'Auf dieser Produktseite stehen die konkreten Maße, Systemabhängigkeiten und Einbaugrenzen der SureFlap Connect.');
  body = body.replace(/## Preis und Verfügbarkeit[\s\S]*?(?=\n## Quellenlage)/, `## Preis und Verfügbarkeit\n\nSure Petcare Deutschland führte das Einzelgerät beim letzten Primärquellencheck als **nicht vorrätig**. Einzelgerät, Hub und Bundle werden getrennt angeboten und können unterschiedliche Bestände haben. Deshalb bleibt der Preisstatus dynamisch und die Lieferbarkeit muss unmittelbar vor dem Kauf erneut geprüft werden.\n`);
  body = body.replace(/Die technischen Angaben wurden am 2\. August 2026/, 'Die technischen Angaben und der Verfügbarkeitsstatus wurden zuletzt am 4. August 2026');
  write(targets.product, joinFrontmatter(frontmatter, body));
}

// 3. Audit und Bildproduktionsbriefing.
write(targets.audit, JSON.stringify({
  version: 2,
  updatedAt: '2026-08-04T19:50:00+02:00',
  repositoryBase: '2b57f4f1cc2c2c39477c44edf4d6533b57f67218',
  scope: 'katzenklappen-phase-1',
  verifiedRepositoryState: {
    hub: '/katzenklappen/',
    products: 7,
    comparisons: 2,
    guides: 4,
    journeyRequirements: 10
  },
  sources: [
    { source: 'Sure Petcare Deutschland', url: 'https://www.surepetcare.com/de-de/haustierklappen/mikrochip-katzenklappe-connect', accessedAt: '2026-08-04T19:25:00+02:00', facts: ['Hub für App erforderlich', '4 AA-Batterien', 'Öffnung 142 x 120 mm', 'Außenrahmen 210 x 210 mm', 'Herstellerbestand beim Check nicht verfügbar'] },
    { source: 'Sure Petcare Kundenservice', url: 'https://www.surepetcare.com/de-de/kundenservice/mikrochip-katzenklappe-connect', accessedAt: '2026-08-04T19:25:00+02:00', facts: ['Tür-/Wandausschnitt 165 x 171 mm', 'Glasausschnitt ideal 212 mm', 'Tunneltiefe 70 mm'] }
  ],
  decisions: [
    'Aktueller Hubpfad ist /katzenklappen/, nicht /smarte-katzenklappen/.',
    'Der Cluster besitzt bereits zwei Vergleiche, vier Praxisratgeber und mehrere vollständige Produkte.',
    'Journey-Logik bleibt strukturell unverändert, weil ihre zehn Pflichtkanten bereits Entscheidungs- und Praxiswege abbilden.',
    'Nicht bewertete Produkte erhalten keine künstliche Nullwertung.',
    'Realistische Produktbilder werden erst nach verifiziertem Referenzsatz eingebunden.'
  ]
}, null, 2));

write(targets.prompt, `Du erstellst den vollständigen realistischen Bildsatz für „SureFlap Mikrochip Katzenklappe Connect“.\n\nNutze aktuelle Herstellerbilder als strikte Produktidentitätsreferenz. Verwechsle das kleine Modell nicht mit der größeren Mikrochip Haustierklappe Connect. Erkennbar bleiben müssen das reale weiße Gehäuse, die transparente Klappe, das obenliegende Batteriefach, die innere Bedienseite und der katzenförmige Sure Petcare Hub.\n\nPrimärquellen:\n- https://www.surepetcare.com/de-de/haustierklappen/mikrochip-katzenklappe-connect\n- https://www.surepetcare.com/de-de/kundenservice/mikrochip-katzenklappe-connect\n- https://www.surepetcare.com/de-de/zubehoer\n\nRegeln:\n- jedes Motiv als einzelnes Bild, keine Collage\n- mobile first\n- keine erfundenen Bedienelemente, Maße, App-Werte oder Zubehörteile\n- nach „weiter“ exakt das nächste noch offene Bild erzeugen\n\n1. sureflap-mikrochip-katzenklappe-connect-01-hero.webp: korrekte Dreiviertelansicht\n2. sureflap-mikrochip-katzenklappe-connect-02-thumbnail.webp: frontale Freistellung\n3. sureflap-mikrochip-katzenklappe-connect-03-inner-controls.webp: reale Innenseite\n4. sureflap-mikrochip-katzenklappe-connect-04-battery.webp: Batteriefach\n5. sureflap-mikrochip-katzenklappe-connect-05-hub.webp: realer Hub\n6. sureflap-mikrochip-katzenklappe-connect-06-system.webp: Klappe, Hub, Router, abstraktes Smartphone\n7. sureflap-mikrochip-katzenklappe-connect-07-usage.webp: reale Nutzung\n8. sureflap-mikrochip-katzenklappe-connect-08-installation.webp: Einbausituation\n9. sureflap-mikrochip-katzenklappe-connect-09-dimensions.webp: belegte Maßgrafik\n\nBeginne mit Bild 1.`);

const testSource = `import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nimport path from 'node:path';\nimport test from 'node:test';\nimport { getJourneyRequirements } from '../src/lib/seo/topical-authority/journey-completion.ts';\nconst root=process.cwd();\nconst read=(relative)=>fs.readFileSync(path.join(root,relative),'utf8');\n\ntest('Hub nutzt die aktuelle kanonische Route und konkrete Nutzerentscheidungen',()=>{\n const hub=read('src/content/pages/katzenklappen.md');\n assert.match(hub,/canonical: \\"\\/katzenklappen\\/\\"/);\n assert.match(hub,/Schnellentscheidung nach Nutzerproblem/);\n assert.doesNotMatch(hub,/Intent-Owner/);\n});\n\ntest('SureFlap Connect besitzt keinen künstlichen Null-Score',()=>{\n const product=read('src/content/products/sureflap-mikrochip-katzenklappe-connect.md');\n assert.doesNotMatch(product,/^rating:\\s*0\\s*$/m);\n assert.match(product,/availability: \\"unavailable\\"/);\n assert.match(product,/visualStatus: \\"reference-pack-required\\"/);\n});\n\ntest('Katzenklappen-Journey bildet Vergleich und Praxis ab',()=>{\n const requirements=getJourneyRequirements('katzenklappen');\n assert.ok(requirements.length>=10);\n assert.ok(requirements.some((item)=>item.target==='/vergleiche/beste-mikrochip-katzenklappen/'));\n assert.ok(requirements.some((item)=>item.target==='/katzenklappe-einbauen/'));\n assert.ok(requirements.some((item)=>item.target==='/katze-an-katzenklappe-gewoehnen/'));\n});\n`;
write(targets.test, testSource);

function run(command, commandArgs, cwd = root) {
  const result = spawnSync(command, commandArgs, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) throw new Error(`[${PATCH}] Fehlgeschlagen: ${command} ${commandArgs.join(' ')}`);
}
if (runChecks) {
  run(process.execPath, ['--check', fileURLToPath(import.meta.url)]);
  run(process.execPath, ['--test', 'test/katzenklappen-phase-1-28.1.1.test.mjs'], appRoot);
}

console.log(`[${PATCH}] Geändert: ${changed.length}`);
for (const file of changed) console.log(`  - ${file}`);
if (unchanged.length) console.log(`[${PATCH}] Bereits aktuell: ${unchanged.length}`);
console.log(`[${PATCH}] Backups: ${path.relative(root, backupRoot)}`);
console.log(`[${PATCH}] Danach projektübliche Audits und den vollständigen Build ausführen.`);
