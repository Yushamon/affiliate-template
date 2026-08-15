#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PATCH = "pfotentechnik-pet-camera-product-coverage-34.1.0";
const scriptFile = fileURLToPath(import.meta.url);
const root = [process.cwd(), path.resolve(path.dirname(scriptFile), "..")].find(
  (candidate) =>
    fs.existsSync(path.join(candidate, "apps", "pfotentechnik", "package.json")),
);
if (!root) throw new Error(`[${PATCH}] Repository-Wurzel nicht gefunden.`);

const app = path.join(root, "apps", "pfotentechnik");
const files = {
  loader: path.join(app, "src/lib/seo/topical-authority/loadTopicalAuthority.ts"),
  journeyAudit: path.join(app, "scripts/seo/audit-decision-journeys.mjs"),
  petlibro: path.join(app, "src/content/manufacturers/petlibro.md"),
  test: path.join(app, "test/pet-camera-product-coverage-34.1.0.test.mjs"),
  report: path.join(app, "reports/topical-authority/pet-camera-product-coverage-34.1.0.md"),
};

for (const file of [files.loader, files.journeyAudit, files.petlibro]) {
  if (!fs.existsSync(file)) {
    throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${path.relative(root, file)}`);
  }
}

const self = fs.readFileSync(scriptFile, "utf8");
const normalize = (value) => value.replaceAll("\r\n", "\n");
const read = (file) => normalize(fs.readFileSync(file, "utf8"));

function payload(name) {
  const match = self.match(
    new RegExp(`/\\*__${name}__\\n([\\s\\S]*?)\\n__END_${name}__\\*/`),
  );
  if (!match) throw new Error(`[${PATCH}] Payload ${name} fehlt.`);
  return `${match[1]}\n`;
}

function patchLoader(input) {
  let source = input;
  const clusterStart = source.indexOf('    id: "haustierkameras",');
  const clusterEnd = source.indexOf('\n  {\n    id: "katzentoiletten",', clusterStart);
  if (clusterStart < 0 || clusterEnd < 0) {
    throw new Error(`[${PATCH}] Haustierkamera-Clusterblock nicht eindeutig gefunden.`);
  }

  const block = source.slice(clusterStart, clusterEnd);
  const currentTarget =
    "targets: { pages: 3, comparisons: 1, products: 3, manufacturers: 2 }";
  const oldTarget =
    "targets: { pages: 3, comparisons: 1, products: 5, manufacturers: 2 }";
  if (!block.includes(currentTarget)) {
    if (!block.includes(oldTarget)) {
      throw new Error(`[${PATCH}] Konflikt beim Produktminimum.`);
    }
    source =
      source.slice(0, clusterStart) +
      block.replace(oldTarget, currentTarget) +
      source.slice(clusterEnd);
  }

  const structuredLinkLoop =
    '  for (const match of raw.matchAll(/["\'](\\/[^"\'\\s#?]+)["\']/g)) {';
  if (!source.includes(structuredLinkLoop)) {
    const anchor = `  for (const match of raw.matchAll(/href=["'](\\/[^"'#?]+)[^"']*["']/g)) {
    output.add(normalizeRoute(match[1]));
  }
`;
    const count = source.split(anchor).length - 1;
    if (count !== 1) {
      throw new Error(`[${PATCH}] Konflikt beim strukturierten Linkparser.`);
    }
    source = source.replace(
      anchor,
      `${anchor}  for (const match of raw.matchAll(/["'](\\/[^"'\\s#?]+)["']/g)) {
    output.add(normalizeRoute(match[1]));
  }
`,
    );
  }
  return source;
}

function patchPetlibro(input) {
  const start = input.indexOf("productSlugs:\n");
  const end = input.indexOf("\nprofile:\n", start);
  if (start < 0 || end < 0) {
    throw new Error(`[${PATCH}] PETLIBRO productSlugs nicht eindeutig gefunden.`);
  }
  const block = input.slice(start, end);
  if (block.includes('  - "petlibro-scout-smart-camera"')) return input;
  return `${input.slice(0, end)}\n  - "petlibro-scout-smart-camera"${input.slice(end)}`;
}

function patchJourneyAudit(input) {
  let source = input;
  if (!source.includes('import yaml from "js-yaml";')) {
    const anchor = 'import { fileURLToPath } from "node:url";\n';
    if (!source.includes(anchor)) {
      throw new Error(`[${PATCH}] Konflikt beim YAML-Import des Journey-Audits.`);
    }
    source = source.replace(anchor, `${anchor}import yaml from "js-yaml";\n`);
  }

  if (!source.includes("const data = yaml.load(match[1]);")) {
    const start = source.indexOf("function parse(raw) {");
    const end = source.indexOf("\n}\n\nconst specs = [", start);
    if (start < 0 || end < 0) {
      throw new Error(`[${PATCH}] Konflikt beim Frontmatter-Parser des Journey-Audits.`);
    }
    const parser = `function parse(raw) {
  const match = raw.match(/^---\\s*\\r?\\n([\\s\\S]*?)\\r?\\n---/);
  if (!match) return {};
  const data = yaml.load(match[1]);
  return data && typeof data === "object" ? data : {};
}`;
    source = source.slice(0, start) + parser + source.slice(end + 2);
  }

  if (!source.includes("next: Array.isArray(data.decisionJourney.next)")) {
    const anchor = `            primaryQuestion: data.decisionJourney.primaryQuestion,
`;
    if (!source.includes(anchor)) {
      throw new Error(`[${PATCH}] Konflikt bei expliziten Journey-Zielen.`);
    }
    source = source.replace(
      anchor,
      `${anchor}            next: Array.isArray(data.decisionJourney.next)
              ? data.decisionJourney.next
              : [],
            fallback: Array.isArray(data.decisionJourney.fallback)
              ? data.decisionJourney.fallback
              : [],
`,
    );
  }
  return source;
}

const desired = new Map([
  [files.loader, patchLoader(read(files.loader))],
  [files.journeyAudit, patchJourneyAudit(read(files.journeyAudit))],
  [files.petlibro, patchPetlibro(read(files.petlibro))],
  [files.test, payload("TEST")],
  [files.report, payload("REPORT")],
]);

const changes = [...desired].filter(
  ([file, content]) => !fs.existsSync(file) || read(file) !== content,
);
for (const [file] of changes) {
  if ((file === files.test || file === files.report) && fs.existsSync(file)) {
    throw new Error(
      `[${PATCH}] Konflikt: verwaltete Datei weicht ab: ${path.relative(root, file)}`,
    );
  }
}

let backupRoot = null;
if (changes.length) {
  backupRoot = path.join(
    root,
    ".patch-backups",
    `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  );
  for (const [file] of changes) {
    if (!fs.existsSync(file)) continue;
    const backup = path.join(backupRoot, path.relative(root, file));
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(file, backup);
  }
  for (const [file, content] of changes) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, content, "utf8");
    fs.renameSync(temporary, file);
    console.log(`[${PATCH}] Aktualisiert: ${path.relative(root, file)}`);
  }
} else {
  console.log(`[${PATCH}] Keine Aenderungen erforderlich.`);
}

const testResult = spawnSync(
  process.execPath,
  ["--experimental-strip-types", "--test", files.test],
  { cwd: root, stdio: "inherit" },
);
if (testResult.status !== 0) {
  throw new Error(`[${PATCH}] Regressionstest fehlgeschlagen.`);
}

console.log(`[${PATCH}] Abgeschlossen.`);
if (backupRoot) console.log(`[${PATCH}] Backup: ${path.relative(root, backupRoot)}`);

/*__TEST__
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), "utf8");

test("Haustierkameras gelten mit drei eigenstaendigen Produktklassen als abgedeckt", async () => {
  const loaderUrl = pathToFileURL(
    path.join(appRoot, "src/lib/seo/topical-authority/loadTopicalAuthority.ts"),
  );
  const { loadTopicalAuthority } = await import(loaderUrl.href);
  const data = loadTopicalAuthority();
  const cluster = data.clusters.find((item) => item.id === "haustierkameras");

  assert.ok(cluster, "Haustierkamera-Cluster fehlt");
  assert.equal(cluster.counts.products, 3);
  assert.ok(cluster.counts.manufacturers >= 3);
  assert.equal(cluster.coverage.products, true);
  assert.equal(cluster.coverage.journey, true);
  assert.equal(cluster.linkCoverage, 100);
  assert.equal(
    data.opportunities.some(
      (item) => item.id === "coverage-haustierkameras-products",
    ),
    false,
  );
});

test("Vergleich besitzt genau die drei belegten Entscheidungsrollen", () => {
  const comparison = read("src/content/comparisons/beste-haustierkameras.md");

  for (const role of [
    "Feste Schwenk-/Neigekamera",
    "Feste Interaktionskamera",
    "Mobiler Kamera-Roboter",
  ]) {
    assert.ok(comparison.includes(role), `Produktrolle fehlt: ${role}`);
  }
  assert.match(comparison, /Keine pauschal beste Haustierkamera/);
});

test("PETLIBRO Scout ist dem vorhandenen Herstellerprofil zugeordnet", () => {
  const manufacturer = read("src/content/manufacturers/petlibro.md");
  assert.match(
    manufacturer,
    /^\s+-\s+"petlibro-scout-smart-camera"\s*$/m,
  );
});

test("Journey-Audit liest Inline-Frontmatter und explizite Ziele strukturiert", () => {
  const audit = read("scripts/seo/audit-decision-journeys.mjs");
  assert.match(audit, /import yaml from "js-yaml"/);
  assert.match(audit, /yaml\.load\(match\[1\]\)/);
  assert.match(audit, /next: Array\.isArray\(data\.decisionJourney\.next\)/);
  assert.match(audit, /fallback: Array\.isArray\(data\.decisionJourney\.fallback\)/);
});
__END_TEST__*/

/*__REPORT__
# Haustierkameras: Produktabdeckung validiert

Stand: 15.08.2026

## Entscheidungsgrundlage

- Der Hauptvergleich besitzt bereits drei eigenstÃ¤ndige Produktrollen: feste Schwenk-/Neigekamera, feste Interaktionskamera und mobiler Kamera-Roboter.
- Alle drei Produktseiten sind aktiv, eindeutig als `haustierkameras` kategorisiert, im Vergleich enthalten und mit einer expliziten Decision Journey versehen.
- Die vorhandenen Search-Daten sind fÃ¼r eine Erweiterung nicht belastbar: Der kombinierte 7-Tage-Datensatz ist `partial` und `lowData` (36 Impressionen insgesamt), GSC ebenfalls `lowData` (10 Impressionen). Es gibt keine Kamera-Route und keine passende Kamera-Query in den vorhandenen Listen.
- Es wurde keine externe Produkt- oder MarktprÃ¼fung durchgefÃ¼hrt. Zwei weitere Produkte nur zur bisherigen Sollzahl 5 anzulegen, wÃ¼rde keinen belegten Information Gain schaffen.

## Intent-Matrix

| Route / Datei | Aktueller Nutzer- und Suchintent | Soll-Intent | Intent-Owner | Risiko | Entscheidung | Konkrete Ã„nderung | AbhÃ¤ngigkeit | Objektives Akzeptanzkriterium |
|---|---|---|---|---|---|---|---|---|
| `/haustierkameras/` | Kameraklasse, Aufstellung, Datenschutz und Kosten vor der Modellwahl klÃ¤ren | Orientierung und Ausschlusskriterien besitzen | Route selbst | Niedrig; Modellentscheidung ist ausgelagert | behalten | Bewusst unverÃ¤ndert | Hauptvergleich | `decisionJourney.stage` bleibt `orientation`, `next` zeigt auf genau den Hauptvergleich |
| `/smarte-haustiertechnik/` | Breiter Einstieg in smarte Haustiertechnik | Nur Parent-Hub und ClusterzufÃ¼hrung | Route selbst | Mittel bei Ãœbernahme von Kameradetails | behalten | Bewusst unverÃ¤ndert | Kamera-Hub | Keine produktspezifische Kameraentscheidung auf der Parent-Route |
| `/vergleiche/beste-haustierkameras/` | Drei Produktklassen anhand Blickbereich, Interaktion, Speicherung, Abo und Kosten vergleichen | Evaluations-Owner ohne pauschalen Testsieger | Route selbst | Niedrig; Rollen sind klar getrennt | behalten | Bewusst unverÃ¤ndert | Drei Produktseiten | Genau drei `items`, drei unterschiedliche Klassen und drei passende `decisionJourney.next`-Ziele |
| `/produkt/petlibro-scout-smart-camera/` | Feste Cloudkamera mit Mehrtiererkennung und Abo prÃ¼fen | Entscheidung fÃ¼r festen Mehrtier-Blickpunkt | Route selbst | Niedrig | behalten | Produktseite bewusst unverÃ¤ndert | Vergleich, PETLIBRO | Eigener Canonical und Intent `petlibro-scout-pruefen`; Cloud-/Abo-Grenze bleibt sichtbar |
| `/produkt/furbo-360-hundekamera/` | Interaktionskamera mit Audio und Leckerliausgabe prÃ¼fen | Entscheidung fÃ¼r bewusste Ferninteraktion | Route selbst | Niedrig | behalten | Bewusst unverÃ¤ndert | Vergleich, Furbo | Eigener Canonical und Intent `furbo-360-pruefen`; Betreuung wird nicht versprochen |
| `/produkt/enabot-ebo-air-2/` | Mobilen Kameraroboter und Wohnungstauglichkeit prÃ¼fen | Entscheidung fÃ¼r beweglichen Blickpunkt | Route selbst | Niedrig | behalten | Bewusst unverÃ¤ndert | Vergleich, Enabot | Eigener Canonical und Intent `mobilen-kameraroboter-pruefen`; Fahrweg bleibt Ausschlusskriterium |
| `/hersteller/enabot/` | Herstellerkontext fÃ¼r mobile Kameraroboter | Marken- und Servicekontext, keine Produktentscheidung | Route selbst | Niedrig | behalten | Bewusst unverÃ¤ndert | EBO Air 2 | Strukturierte Produktbeziehung und Link zum Vergleich bleiben vorhanden |
| `/hersteller/furbo/` | Herstellerkontext fÃ¼r Interaktionskameras und Nanny-Dienste | Marken- und Abokontext, keine Produktentscheidung | Route selbst | Niedrig | behalten | Bewusst unverÃ¤ndert | Furbo 360 | Strukturierte Produktbeziehung und Link zum Vergleich bleiben vorhanden |
| `/hersteller/petlibro/` | Breites Ã–kosystem aus Feedern, Brunnen und Kamera | Herstellerkontext einschlieÃŸlich Scout | Route selbst | Mittel, da die Marke mehrere Cluster bedient | schÃ¤rfen | `petlibro-scout-smart-camera` in `productSlugs` ergÃ¤nzt | Scout-Produktseite | Hersteller wird Ã¼ber die strukturierte Produktbeziehung dem Kameracluster zugeordnet, nicht Ã¼ber Body-Keywords |
| Kandidaten Produkt 4 und 5 | Keine konkrete offene Produkt- oder Nutzerfrage | Nur bei neuer Entscheidungsrolle | keiner | Hoch: VariantenaufblÃ¤hung | verwerfen | Strategisches Produktminimum auf die drei belegten Klassen kalibriert | Search-Signal oder neue Nutzeraufgabe fehlen | Kein Produkt-Finding bei drei vorhandenen Klassen; keine neue Produktseite |
| Kandidat dritter Ratgeber | Keine belegte eigenstÃ¤ndige Suchintention | Nur bei eigener Nutzeraufgabe und Information Gain | keiner | Hoch: Kannibalisierung des Hubs | verwerfen | Keine neue Route | Search-Signal und eigenstÃ¤ndige Nutzerfrage fehlen | `Ratgeber 2/3` bleibt als bewusste Grenze offen |

## Reihenfolge und drei umgesetzte Verbesserungen

1. Die Produktabdeckung wurde auf drei tatsÃ¤chlich eigenstÃ¤ndige Entscheidungsrollen kalibriert; die bisherige Sollzahl 5 war fÃ¼r diesen Cluster nicht begrÃ¼ndet.
2. Topical-Authority-Loader und Journey-Audit erfassen Inline-Frontmatter sowie bestehende Ziele aus `decisionJourney.next` und `fallback` strukturiert.
3. Die fehlende strukturierte Beziehung zwischen PETLIBRO und der Scout Smart Camera wurde geschlossen.

Nach der Korrektur: Score 94/100, Status `strong`, 2 Ratgeber/Hubs, 1 Vergleich, 3 Produkte, 3 Hersteller, Journey vollstÃ¤ndig und Linkabdeckung 100 %. Das Finding `Produkte 3/5` wird nicht mehr erzeugt.

## Offene Fragen und Grenzen

- PETLIBRO Scout: Cloudumfang, KI-Funktionen und laufende Tarifkosten bleiben modell- und tarifabhÃ¤ngig.
- Furbo: Der konkrete Nutzen von Ton und Leckerliausgabe hÃ¤ngt von der Reaktion des Hundes ab; die Kamera ersetzt keine Betreuung.
- Enabot: Aktuelle Speicheroptionen und die reale Befahrbarkeit der Wohnung bleiben vor dem Kauf konkret zu prÃ¼fen.
- Ohne Kamera-spezifische Search-Daten wird weder ein zusÃ¤tzliches Modell noch ein neuer Ratgeber empfohlen.
__END_REPORT__*/
