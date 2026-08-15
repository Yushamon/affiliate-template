#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PATCH = "pfotentechnik-automatic-litter-box-product-coverage-34.0.0";
const scriptFile = fileURLToPath(import.meta.url);
const rootCandidates = [process.cwd(), path.resolve(path.dirname(scriptFile), "..")];
const root = rootCandidates.find((candidate) =>
  fs.existsSync(path.join(candidate, "apps", "pfotentechnik", "package.json")),
);
if (!root) throw new Error(`[${PATCH}] Repository-Wurzel nicht gefunden.`);

const app = path.join(root, "apps", "pfotentechnik");
const files = {
  loader: path.join(app, "src/lib/seo/topical-authority/loadTopicalAuthority.ts"),
  comparison: path.join(app, "src/content/comparisons/beste-automatische-katzentoiletten.md"),
  petkit: path.join(app, "src/content/manufacturers/petkit.md"),
  test: path.join(app, "test/automatic-litter-box-product-coverage-34.0.0.test.mjs"),
  report: path.join(app, "reports/topical-authority/automatic-litter-box-product-coverage-34.0.0.md"),
};

for (const file of [files.loader, files.comparison, files.petkit]) {
  if (!fs.existsSync(file)) {
    throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${path.relative(root, file)}`);
  }
}

const self = fs.readFileSync(scriptFile, "utf8");
function payload(name) {
  const match = self.match(
    new RegExp(`/\\*__${name}__\\n([\\s\\S]*?)\\n__END_${name}__\\*/`),
  );
  if (!match) throw new Error(`[${PATCH}] Payload ${name} fehlt.`);
  return `${match[1]}\n`;
}

function normalized(file) {
  return fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n");
}

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) {
    throw new Error(`[${PATCH}] Konflikt bei ${label}: Anker ${count}x gefunden.`);
  }
  return source.replace(before, after);
}

function patchLoader(input) {
  let source = input;

  if (!source.includes("  productSlugs: string[];")) {
    source = replaceOnce(
      source,
      "  categoryKey: string;\n",
      "  categoryKey: string;\n  productSlugs: string[];\n",
      "DocumentRecord.productSlugs",
    );
  }

  if (!source.includes("  const inlineSection = match[1].match(")) {
    const functionStart = source.indexOf("function parseNestedFrontmatterValue(");
    const anchor = '  if (!match) return "";\n';
    const anchorIndex = source.indexOf(anchor, functionStart);
    if (functionStart < 0 || anchorIndex < 0) {
      throw new Error(`[${PATCH}] Konflikt bei Inline-Kategorie-Parser.`);
    }
    const addition = `

  const inlineSection = match[1].match(
    new RegExp(\`^\${section}:\\\\s*\\\\{([^\\\\r\\\\n]*)\\\\}\\\\s*$\`, "m"),
  );

  if (inlineSection) {
    const inlineValue = inlineSection[1].match(
      new RegExp(
        \`(?:^|,)\\\\s*\${key}\\\\s*:\\\\s*(?:"([^"]*)"|'([^']*)'|([^,}]+))\`,
      ),
    );

    if (inlineValue) {
      return String(
        inlineValue[1] ?? inlineValue[2] ?? inlineValue[3] ?? "",
      ).trim();
    }
  }`;
    const insertAt = anchorIndex + anchor.length;
    source = source.slice(0, insertAt) + addition + source.slice(insertAt);
  }

  if (!source.includes("function parseFrontmatterStringArray(")) {
    const helper = `function parseFrontmatterStringArray(raw: string, key: string): string[] {
  const match = raw.match(/^---\\s*\\r?\\n([\\s\\S]*?)\\r?\\n---/);
  if (!match) return [];

  const inline = match[1].match(
    new RegExp(\`^\${key}:\\\\s*\\\\[([^\\\\r\\\\n]*)\\\\]\\\\s*$\`, "m"),
  );
  if (inline) {
    return [...inline[1].matchAll(/"([^"]+)"|'([^']+)'/g)]
      .map((item) => String(item[1] ?? item[2] ?? "").trim())
      .filter(Boolean);
  }

  const lines = match[1].split(/\\r?\\n/);
  const start = lines.findIndex((line) =>
    new RegExp(\`^\${key}:\\\\s*$\`).test(line),
  );
  if (start < 0) return [];

  const values: string[] = [];
  for (const line of lines.slice(start + 1)) {
    const item = line.match(/^\\s+-\\s*(?:"([^"]+)"|'([^']+)'|([^#\\r\\n]+))\\s*$/);
    if (!item) break;
    values.push(String(item[1] ?? item[2] ?? item[3] ?? "").trim());
  }
  return values.filter(Boolean);
}

`;
    source = replaceOnce(
      source,
      "function normalizeRoute(value: string): string {",
      `${helper}function normalizeRoute(value: string): string {`,
      "String-Array-Parser",
    );
  }

  if (!source.includes('parseFrontmatterStringArray(raw, "productSlugs")')) {
    source = replaceOnce(
      source,
      `      categoryKey:
        type === "product"
          ? parseNestedFrontmatterValue(raw, "category", "key")
          : "",
      body: stripFrontmatter(raw),`,
      `      categoryKey:
        type === "product"
          ? parseNestedFrontmatterValue(raw, "category", "key")
          : "",
      productSlugs:
        type === "manufacturer"
          ? parseFrontmatterStringArray(raw, "productSlugs")
          : [],
      body: stripFrontmatter(raw),`,
      "Collection.productSlugs",
    );
  }

  if (!source.includes("Strukturierte Produktreferenzen ordnen")) {
    source = replaceOnce(
      source,
      `  if (excluded) return false;

  if (document.type === "manufacturer") {`,
      `  if (document.type === "manufacturer") {`,
      "Hersteller-vor-Exclusion",
    );
    source = replaceOnce(
      source,
      `    return manufacturerEvidence;
  }

  if (document.type === "product") {`,
      `    if (manufacturerEvidence) return manufacturerEvidence;

    // Strukturierte Produktreferenzen ordnen auch kategorienuebergreifende
    // Hersteller zu, ohne beilaufige Begriffe aus dem Body auszuwerten.
    return document.productSlugs.some((productSlug) => {
      const product = documents.find(
        (candidate) =>
          candidate.type === "product" && candidate.slug === productSlug,
      );
      return Boolean(
        product && productClusterFromCategory(product) === definition.id,
      );
    });
  }

  if (excluded) return false;

  if (document.type === "product") {`,
      "strukturierte Herstellerzuordnung",
    );
  }

  return source;
}

function patchComparison(input) {
  let source = input;
  const newText = '  text: "Litter-Robot 5 Pro und PUROBOT sind geschlossene Kamera-Systeme mit unterschiedlicher Datenlogik. Neakasa M1 Plus und M1 Lite teilen die offene Systementscheidung; das Lite ist vor allem eine Lieferumfangsvariante. Devoko ist die preisorientierte geschlossene Alternative, bleibt wegen uneinheitlicher Modell- und Servicedaten aber eine eingeschr\u00e4nkte Empfehlung. Ein Modell mit ungekl\u00e4rtem Mindestgewicht oder ungeeigneter Streu wird verworfen."';
  if (!source.includes("Lite ist vor allem eine Lieferumfangsvariante")) {
    const blockStart = source.indexOf(
      'recommendation:\n  title: "Die Passform entscheidet vor den Smartfunktionen"\n',
    );
    const textStart = source.indexOf('  text: "', blockStart);
    const textEnd = source.indexOf("\n  alternativeSlug:", textStart);
    if (blockStart < 0 || textStart < 0 || textEnd < 0) {
      throw new Error(`[${PATCH}] Konflikt bei Vergleichsempfehlung.`);
    }
    source = source.slice(0, textStart) + newText + source.slice(textEnd);
  }
  if (source.includes('updatedAt: "2026-08-07"')) {
    source = source.replace('updatedAt: "2026-08-07"', 'updatedAt: "2026-08-15"');
  }
  return source;
}

function patchPetkit(input) {
  if (/^\s+-\s*["']petkit-purobot-max-pro-2["']\s*$/m.test(input)) return input;
  const start = input.indexOf("productSlugs:\n");
  const end = input.indexOf("\nprofile:\n", start);
  if (start < 0 || end < 0) {
    throw new Error(`[${PATCH}] Konflikt bei PETKIT productSlugs.`);
  }
  return `${input.slice(0, end)}\n  - "petkit-purobot-max-pro-2"${input.slice(end)}`;
}

const desired = new Map([
  [files.loader, patchLoader(normalized(files.loader))],
  [files.comparison, patchComparison(normalized(files.comparison))],
  [files.petkit, patchPetkit(normalized(files.petkit))],
  [files.test, payload("TEST")],
  [files.report, payload("REPORT")],
]);

const changes = [...desired].filter(
  ([file, content]) => !fs.existsSync(file) || normalized(file) !== content,
);

for (const [file, content] of changes) {
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
    const target = path.join(backupRoot, path.relative(root, file));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(file, target);
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

const check = spawnSync(
  process.execPath,
  ["--experimental-strip-types", "--test", files.test],
  { cwd: root, stdio: "inherit" },
);
if (check.status !== 0) {
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
const loaderUrl = pathToFileURL(
  path.join(appRoot, "src/lib/seo/topical-authority/loadTopicalAuthority.ts"),
);

test("Katzentoiletten erfassen Inline-Kategorien und Herstellerbeziehungen", async () => {
  const { loadTopicalAuthority } = await import(loaderUrl.href);
  const data = loadTopicalAuthority();
  const cluster = data.clusters.find((item) => item.id === "katzentoiletten");

  assert.ok(cluster, "Katzentoiletten-Cluster fehlt");
  assert.ok(cluster.counts.products >= 5, "Nicht alle kategorisierten Produkte erfasst");
  assert.ok(cluster.counts.manufacturers >= 4, "Herstellerbeziehungen unvollstaendig");
  assert.equal(cluster.coverage.products, true);
  assert.equal(cluster.coverage.manufacturers, true);
  assert.equal(
    data.opportunities.some(
      (item) =>
        item.id === "coverage-katzentoiletten-products" ||
        item.id === "coverage-katzentoiletten-manufacturers",
    ),
    false,
  );
});

test("Vergleich grenzt M1-Lieferumfang und Devoko-Datenlage ab", () => {
  const comparison = fs.readFileSync(
    path.join(
      appRoot,
      "src/content/comparisons/beste-automatische-katzentoiletten.md",
    ),
    "utf8",
  );

  assert.match(comparison, /Lite ist vor allem eine Lieferumfangsvariante/);
  assert.match(comparison, /Devoko ist die preisorientierte geschlossene Alternative/);
  assert.match(comparison, /uneinheitlicher Modell- und Servicedaten/);
});
__END_TEST__*/

/*__REPORT__
# Automatische Katzentoiletten: Produktabdeckung validiert

Stand: 15.08.2026

## Entscheidungsgrundlage

- Der Ã¼bergebene Cockpit-Stand von 2 Produkten und 0 Herstellern war technisch unvollstÃ¤ndig. Drei gÃ¼ltige Produktseiten nutzten eine Inline-YAML-Kategorie, die der Loader nicht gelesen hat.
- Im Repository sind fÃ¼nf kategorisierte und im bestehenden Hauptvergleich gefÃ¼hrte Produkte vorhanden. Vier Herstellerseiten besitzen eine strukturierte Beziehung zu mindestens einem dieser Produkte.
- Die aktuellen Search-Daten sind fÃ¼r diesen Cluster nicht entscheidungsfÃ¤hig: Der kombinierte 7-Tage-Datensatz ist als `lowData` und `partial` markiert (36 Impressionen insgesamt), der GSC-Datensatz als `lowData` (10 Impressionen). Keine Clusterroute und keine Clusterquery erscheint in den vorhandenen Seiten- oder Querylisten.
- Es wurde keine externe Produkt- oder MarktprÃ¼fung durchgefÃ¼hrt. Die Entscheidung beruht auf Repository-Bestand, strukturierten Beziehungen, vorhandener Evidenzkennzeichnung und Journey-Logik.

## Intent-Matrix

| Route / Datei | Aktueller Nutzer- und Suchintent | Soll-Intent | Aktueller Intent-Owner | Risiko | Entscheidung | Konkrete Ã„nderung | AbhÃ¤ngigkeit | Objektives Akzeptanzkriterium |
|---|---|---|---|---|---|---|---|---|
| `/automatische-katzentoiletten/` | Sicherheit, Passform, Streu, Platz und GewÃ¶hnung vor der Modellauswahl klÃ¤ren | Orientierung und Ausschlusskriterien besitzen | Route selbst | Niedrig; verweist fÃ¼r Modellwahl in den Vergleich | behalten | Bewusst unverÃ¤ndert | Hauptvergleich | Genau ein Orientation-Owner mit `next` zum Vergleich |
| `/smarte-haustiertechnik/` | Breiter Einstieg in smarte Haustiertechnik | Nur Parent-Hub und ClusterzufÃ¼hrung | Route selbst | Mittel, wenn sie Detailberatung Ã¼bernÃ¤hme | behalten | Bewusst unverÃ¤ndert | Katzenklo-Hub | Kein Modellvergleich auf der Parent-Route |
| `/vergleiche/beste-automatische-katzentoiletten/` | FÃ¼nf Modelle anhand gemeinsamer Ausschluss- und Betriebskriterien vergleichen | System- und Modellentscheidung besitzen; Varianten klar kennzeichnen | Route selbst | M1 Plus und M1 Lite sind technisch sehr nah | schÃ¤rfen | M1 Lite als Lieferumfangsvariante der offenen M1-Entscheidung und Devoko als eingeschrÃ¤nkte preisorientierte Alternative benannt | FÃ¼nf Produktseiten | Alle fÃ¼nf Slugs bleiben in `items` und `decisionJourney.next`; Empfehlung nennt beide Abgrenzungen |
| `/produkt/neakasa-m1-lite/` | Konkrete M1-Lite-Passform und Lieferumfang prÃ¼fen | Produktentscheidung fÃ¼r die Lite-Variante | Route selbst | Mittel gegenÃ¼ber M1 Plus | behalten | Bewusst unverÃ¤ndert; vorhandene FAQ, Empfehlung und Produkttext besitzen den Lieferumfangsunterschied bereits | Vergleich, Neakasa-Herstellerseite | Eigener Canonical; Intent `neakasa-m1-lite-pruefen`; Unterschied zu M1 Plus bleibt explizit |
| `/produkt/devoko-90l-automatisches-katzenklo/` | Konkretes preisorientiertes XXL-Modell trotz Datenunsicherheit prÃ¼fen | Produktentscheidung mit sichtbarer Evidenzgrenze | Route selbst | Niedrig; eigenstÃ¤ndige Bauform-, Einstieg- und Dokumentationsfrage | behalten | Bewusst unverÃ¤ndert; Unsicherheiten sind bereits in Entscheidung, Specs und Fazit markiert | Vergleich, Devoko-Herstellerseite | Eigener Canonical; Intent `devoko-90l-pruefen`; widersprÃ¼chliche Sensor-, MaÃŸ- und Garantiedaten bleiben sichtbar |
| `/produkt/litter-robot-5-pro/` | Geschlossenes Premiumsystem mit Kamera prÃ¼fen | Premium-/Kamera-Produktentscheidung | Route selbst | Niedrig | behalten | Keine InhaltsÃ¤nderung; Inline-Kategorie wird nun zentral erkannt | Whisker-Herstellerseite | `category.key` wird dem Cluster `katzentoiletten` zugeordnet |
| `/produkt/petkit-purobot-max-pro-2/` | Geschlossenes Kamera-System fÃ¼r Mehrkatzenprofile prÃ¼fen | PETKIT-Produktentscheidung mit offenen Sicherheitsfragen | Route selbst | Niedrig | behalten | Keine ProduktÃ¤nderung; Inline-Kategorie zentral erkannt | PETKIT-Herstellerseite | `category.key` wird erkannt und Herstellerbeziehung ist strukturiert |
| `/produkt/neakasa-m1-plus/` | Offene M1-Systementscheidung mit vollem Lieferumfang | PrimÃ¤re offene M1-Systemvariante | Route selbst | Mittel gegenÃ¼ber M1 Lite | behalten | Keine InhaltsÃ¤nderung; Inline-Kategorie zentral erkannt | Vergleich, Neakasa-Herstellerseite | Beide M1-Produkte bleiben getrennte Canonicals, der Vergleich bezeichnet Lite als Lieferumfangsvariante |
| `/hersteller/devoko/` | Hersteller- und Servicekontext zum Devoko 90L | Herstellerkontext, keine Modellentscheidung | Route selbst | Niedrig | behalten | Keine InhaltsÃ¤nderung; Zuordnung wird aus `productSlugs` ermittelt | Devoko-Produkt | Wird als Cluster-Hersteller gezÃ¤hlt, ohne Body-Keyword-Heuristik |
| `/hersteller/neakasa/` | Herstellerkontext zur M1-Familie | Herstellerkontext fÃ¼r beide M1-Varianten | Route selbst | Niedrig | behalten | Keine InhaltsÃ¤nderung; beide Produktbeziehungen werden strukturiert ausgewertet | M1 Plus, M1 Lite | Wird als Cluster-Hersteller gezÃ¤hlt; beide Slugs bleiben referenziert |
| `/hersteller/whisker/` | Herstellerkontext zum Litter-Robot | Herstellerkontext, keine Premium-Modellentscheidung | Route selbst | Niedrig | behalten | Keine InhaltsÃ¤nderung; Produktbeziehung wird strukturiert ausgewertet | Litter-Robot 5 Pro | Wird als Cluster-Hersteller gezÃ¤hlt |
| `/hersteller/petkit/` | MarkenÃ¼bergreifendes Ã–kosystem und Produktsortiment | Herstellerkontext einschlieÃŸlich PUROBOT | Route selbst | Mittel, weil PETKIT mehrere Cluster bedient | schÃ¤rfen | `petkit-purobot-max-pro-2` in `productSlugs` ergÃ¤nzt; Zuordnung erfolgt nicht Ã¼ber beilÃ¤ufigen Bodytext | PUROBOT-Produkt | PETKIT wird trotz anderer Produktkategorien korrekt dem Katzenklo-Cluster zugeordnet |
| Kandidat dritter Ratgeber | Noch keine belegte eigenstÃ¤ndige Suchintention | Nur bei eigener Nutzeraufgabe und Information Gain | keiner | Hoch: Quoten-Seite und Kannibalisierung des Hubs | verwerfen | Keine neue Route | Belastbare Search-Daten oder konkrete Nutzerfrage fehlen | Kein neuer Content nur fÃ¼r `Ratgeber 2/3` |

## Reihenfolge und drei umgesetzte Verbesserungen

1. Loader zentral korrigiert: Inline- und Blockschreibweisen werden fÃ¼r strukturierte Kategorien beziehungsweise Produktlisten gelesen; Hersteller werden Ã¼ber ihre Produktbeziehungen zugeordnet.
2. PETKIT-Beziehung geschlossen: PUROBOT ist im vorhandenen Herstellerdatensatz als Produkt referenziert.
3. Vergleich geschÃ¤rft: M1 Lite wird nicht als neue Systemklasse dargestellt; Devoko bleibt wegen der dokumentierten Datenlage eine eingeschrÃ¤nkte Alternative.

Nach der Korrektur: Score 90/100, Status `strong`, 2 Ratgeber/Hubs, 1 Vergleich, 5 Produkte, 4 Hersteller, Journey vollstÃ¤ndig, Linkabdeckung 75 %. Die frÃ¼heren Findings `Produkte 2/5` und `Hersteller 0/2` werden nicht mehr erzeugt. Die rechnerische LÃ¼cke `Ratgeber 2/3` bleibt bewusst offen, weil keine eigenstÃ¤ndige Suchintention belegt ist.

## Offene Fragen und Grenzen

- Devoko: Modellvariante, Sensoranzahl, AuÃŸenmaÃŸe und Garantie bleiben in den vorhandenen Quellen widersprÃ¼chlich.
- PETKIT PUROBOT: Mindestgewicht und regionale Streuliste bleiben als offene Produktfragen markiert.
- Neakasa: Die Bezeichnungen M1 Lite, M1 Plus Lite und M1 Lite Plus sind nicht durchgehend konsistent.
- Die geringere Linkabdeckung nach der Korrektur entsteht durch den nun vollstÃ¤ndigeren Clusterumfang. Es wurden keine Links nur zur Kennzahlverbesserung eingefÃ¼gt.
__END_REPORT__*/
