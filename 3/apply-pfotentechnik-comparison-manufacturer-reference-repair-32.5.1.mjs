#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-comparison-manufacturer-reference-repair-32.5.1";
const DEVOKO = "---\ntitle: \"Devoko\"\nslug: \"devoko\"\ntype: \"manufacturer\"\nlayout: \"manufacturer\"\ndescription: \"Devoko im Überblick: preisorientierte automatische Katzentoiletten mit großem Innenraum, App und mehrstufiger Sensorik.\"\nkey: \"devoko\"\nname: \"Devoko\"\nrecommendation: \"Devoko ist im aktuellen Katzentoiletten-Cluster eine preisorientierte Alternative, bei der die konkrete Handelsvariante und Dokumentation besonders sorgfältig geprüft werden sollten.\"\nsummary: \"Das aktuell gepflegte Devoko-90L-Modell kombiniert großen Innenraum, niedrigen Einstieg, automatische Reinigung und App-Steuerung; einzelne technische Angaben unterscheiden sich je nach öffentlicher Quelle.\"\npublishedAt: \"2026-08-07\"\nupdatedAt: \"2026-08-07\"\ntags: [\"hersteller\", \"devoko\", \"automatische-katzentoiletten\"]\nimages:\n  hero:\n    src: \"../../assets/images/products/devoko-90l-automatisches-katzenklo/hero.webp\"\n    alt: \"Devoko 90L automatische Katzentoilette als redaktionelle Produktdarstellung\"\n  gallery: []\nproductCategories: [\"Automatische Katzentoiletten\"]\nproductAreas: [\"automatische Selbstreinigung\", \"App-Steuerung\", \"Sensorik\", \"Geruchskontrolle\"]\nfocus: [\"großer Innenraum\", \"niedriger Einstieg\", \"preisorientierte Alternative\"]\nsuitableFor: [\"Haushalte, die großen Innenraum und einen niedrigeren Einstieg priorisieren und die konkrete Produktvariante vor Kauf prüfen\"]\nattention:\n  - \"Öffentliche Angaben zu Sensoranzahl, Außenmaßen und Garantie sind nicht durchgehend konsistent\"\n  - \"App-Einrichtung setzt laut dokumentierter Produktinformation 2,4-GHz-WLAN voraus\"\n  - \"Service-, Garantie- und Ersatzteilbedingungen des konkreten Angebots vor Kauf prüfen\"\nstrengths: [\"großer dokumentierter Innenraum\", \"niedriger Einstieg im Vergleich zu mehreren Open-Top-Systemen\"]\nweaknesses: [\"weniger konsistente öffentliche Dokumentation als bei etablierten Premium-Anbietern\", \"Modell- und Handelsvarianten müssen sorgfältig abgeglichen werden\"]\nprofile:\n  company: \"Das Profil bildet die im Repository gepflegte Devoko-Produktrolle ab. In deutschen Handelsangaben wird für das aktuelle 90L-Modell Mainwin Furniture GmbH als Hersteller genannt; die konkrete Angebotsvariante bleibt vor Kauf zu prüfen.\"\n  appEcosystem: \"Die dokumentierte App unterstützt Einstellungen, Nutzungsdaten und Fernreinigung über 2,4-GHz-WLAN.\"\n  replacementParts: \"Beutel, Geruchsneutralisator und weitere Verbrauchsteile sind abhängig vom konkreten Angebot.\"\n  filterSupply: \"Nicht relevant; entscheidend sind kompatible klumpende Streu und die dokumentierte Geruchskontrolle.\"\n  warranty: \"Öffentliche Garantieangaben sind nicht einheitlich. Maßgeblich sind das konkrete Angebot und die mitgelieferten Unterlagen.\"\n  competitorComparison: \"Devoko konkurriert über großen Innenraum, niedrigeren Einstieg und Preis; bei Dokumentation und Service-Ökosystem sind etablierte Premium-Anbieter transparenter.\"\nproductSlugs: [\"devoko-90l-automatisches-katzenklo\"]\nfeaturedProductSlugs: [\"devoko-90l-automatisches-katzenklo\"]\nseries: []\nalternativeManufacturerSlugs: [\"neakasa\", \"whisker\", \"petkit\"]\nsources:\n  - { label: \"Devoko 90L Produktdokumentation und Händlerangaben\", url: \"https://www.amazon.de/\" }\nfaq: []\n---\n\n## Devoko bei PfotenTechnik\n\nDas aktuell gepflegte Modell ist das [Devoko 90L automatische Katzenklo](/produkt/devoko-90l-automatisches-katzenklo/). Es gehört in den [Vergleich automatischer Katzentoiletten](/vergleiche/beste-automatische-katzentoiletten/).\n\nDie geringere Dokumentationstiefe wird nicht durch Schätzwerte ausgeglichen. Abweichende Angaben zu Sensorik, Außenmaßen oder Garantie bleiben als Unsicherheit sichtbar.\n";
const TEST = "import test from \"node:test\";\nimport assert from \"node:assert/strict\";\nimport fs from \"node:fs\";\nimport path from \"node:path\";\n\nconst root = process.cwd();\nconst read = (relative) => fs.readFileSync(path.join(root, relative), \"utf8\");\n\nconst devoko = read(\"apps/pfotentechnik/src/content/manufacturers/devoko.md\");\nconst devokoProduct = read(\"apps/pfotentechnik/src/content/products/devoko-90l-automatisches-katzenklo.md\");\nconst neakasa = read(\"apps/pfotentechnik/src/content/manufacturers/neakasa.md\");\n\ntest(\"Devoko-Produkt besitzt ein auflösbares Herstellerprofil\", () => {\n  assert.match(devokoProduct, /slug:\\s*\"devoko\"/);\n  assert.match(devoko, /^slug:\\s*\"devoko\"$/m);\n  assert.match(devoko, /^type:\\s*\"manufacturer\"$/m);\n});\n\ntest(\"Devoko-Herstellerprofil verweist auf Produkt und Vergleich\", () => {\n  assert.match(devoko, /devoko-90l-automatisches-katzenklo/);\n  assert.match(devoko, /\\/vergleiche\\/beste-automatische-katzentoiletten\\//);\n});\n\ntest(\"Neakasa-Herstellerprofil kennt M1 Plus und M1 Lite\", () => {\n  assert.match(neakasa, /productSlugs:\\s*\\[\"neakasa-m1-plus\",\\s*\"neakasa-m1-lite\"\\]/);\n});\n";
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const skipBuild = process.argv.includes("--skip-build");

const candidates = [process.cwd(), path.resolve(SCRIPT_DIR, ".."), path.resolve(SCRIPT_DIR, "../..")];
const root = candidates.find((candidate) =>
  fs.existsSync(path.join(candidate, "apps/pfotentechnik")) &&
  fs.existsSync(path.join(candidate, "packages/affiliate-core"))
);
if (!root) throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);

const paths = {
  product: "apps/pfotentechnik/src/content/products/devoko-90l-automatisches-katzenklo.md",
  devoko: "apps/pfotentechnik/src/content/manufacturers/devoko.md",
  neakasa: "apps/pfotentechnik/src/content/manufacturers/neakasa.md",
  test: "apps/pfotentechnik/test/comparison-manufacturer-reference-repair-32.5.1.test.mjs"
};

for (const relative of [paths.product, paths.neakasa]) {
  if (!fs.existsSync(path.join(root, relative))) throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${relative}`);
}

const backupRoot = path.join(root, ".patch-backups", `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
let changed = 0;
const abs = (rel) => path.join(root, rel);

function writeIfChanged(rel, content) {
  const target = abs(rel);
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
  if (current === content) return console.log(`[${PATCH}] Unverändert: ${rel}`);
  if (current !== null) {
    const backup = path.join(backupRoot, rel);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(target, backup);
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
  changed++;
  console.log(`[${PATCH}] Geschrieben: ${rel}`);
}

const product = fs.readFileSync(abs(paths.product), "utf8");
if (!/manufacturer:[\s\S]*?slug:\s*"devoko"/.test(product)) {
  throw new Error(`[${PATCH}] Devoko-Produkt referenziert nicht manufacturer.slug=devoko.`);
}

writeIfChanged(paths.devoko, DEVOKO);

let neakasa = fs.readFileSync(abs(paths.neakasa), "utf8");
neakasa = neakasa.replace('updatedAt: "2026-08-06"', 'updatedAt: "2026-08-07"');
neakasa = neakasa.replace('productSlugs: ["neakasa-m1-plus"]', 'productSlugs: ["neakasa-m1-plus", "neakasa-m1-lite"]');
neakasa = neakasa.replace('featuredProductSlugs: ["neakasa-m1-plus"]', 'featuredProductSlugs: ["neakasa-m1-plus", "neakasa-m1-lite"]');
writeIfChanged(paths.neakasa, neakasa);

writeIfChanged(paths.test, TEST);

function run(command, args) {
  console.log(`[${PATCH}] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`[${PATCH}] Kommando fehlgeschlagen (${result.status}).`);
}

run(process.execPath, ["--test", paths.test]);
run("npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:audit:strict"]);
if (!skipBuild) run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);

console.log(`[${PATCH}] Fertig. ${changed} Datei(en) geändert.`);
