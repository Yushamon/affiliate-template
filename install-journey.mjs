#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const installerDir = path.dirname(fileURLToPath(import.meta.url));

const targets = {
  product: path.join(root, "apps/pfotentechnik/src/pages/produkt/[product].astro"),
  comparison: path.join(root, "apps/pfotentechnik/src/pages/vergleiche/[comparison].astro"),
  article: path.join(root, "apps/pfotentechnik/src/pages/[slug].astro"),
  component: path.join(root, "apps/pfotentechnik/src/components/ConversionJourney.astro")
};

for (const file of [targets.product, targets.comparison, targets.article]) {
  if (!fs.existsSync(file)) {
    console.error(`Abbruch: Datei nicht gefunden: ${file}`);
    process.exit(1);
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, `.conversion-journey-backup-${stamp}`);

const backup = (file) => {
  if (!fs.existsSync(file)) return;
  const relative = path.relative(root, file);
  const target = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
};

Object.values(targets).forEach(backup);

const ensureImport = (source, anchor, importLine) => {
  if (source.includes(importLine)) return source;
  if (!source.includes(anchor)) {
    throw new Error(`Importanker nicht gefunden: ${anchor}`);
  }
  return source.replace(anchor, `${anchor}\n${importLine}`);
};

const insertBefore = (source, anchor, block, marker) => {
  if (source.includes(marker)) return source;
  if (!source.includes(anchor)) {
    throw new Error(`Einfügeanker nicht gefunden: ${anchor}`);
  }
  return source.replace(anchor, `${block}\n\n${anchor}`);
};

const productImport =
  'import ConversionJourney from "../../components/ConversionJourney.astro";';
const comparisonImport =
  'import ConversionJourney from "../../components/ConversionJourney.astro";';
const articleImport =
  'import ConversionJourney from "../components/ConversionJourney.astro";';

let product = fs.readFileSync(targets.product, "utf8");
let comparison = fs.readFileSync(targets.comparison, "utf8");
let article = fs.readFileSync(targets.article, "utf8");

product = ensureImport(
  product,
  'import RelatedArticles from "@affiliate-core/components/RelatedArticles.astro";',
  productImport
);

comparison = ensureImport(
  comparison,
  'import RelatedArticles from "@affiliate-core/components/RelatedArticles.astro";',
  comparisonImport
);

article = ensureImport(
  article,
  'import RelatedArticles from "@affiliate-core/components/RelatedArticles.astro";',
  articleImport
);

const productBlock = `    <ConversionJourney
      title="So geht es nach dem Produkttest weiter"
      intro="Vergleiche das Modell mit passenden Alternativen oder vertiefe die wichtigsten Kaufkriterien."
      items={[
        {
          eyebrow: "Vergleichen",
          title: "Passende Modelle direkt gegenüberstellen",
          text: "Prüfe Unterschiede bei Funktionen, Einsatzbereich und Bewertung in der passenden Vergleichsübersicht.",
          href: categoryHref,
          label: "Zum Vergleich"
        },
        {
          eyebrow: "Alternativen",
          title: "Andere Lösungen für deinen Anwendungsfall",
          text: "Sieh dir Modelle an, die bei Preis, Ausstattung oder Futterart einen anderen Schwerpunkt setzen.",
          href: "#alternativen",
          label: "Alternativen ansehen"
        },
        {
          eyebrow: "Grundlagen",
          title: "Kaufkriterien noch einmal prüfen",
          text: "Vertiefe Portionierung, Reinigung, Stromausfall und Alltagssicherheit vor der endgültigen Entscheidung.",
          href: "/smarte-futterautomaten/",
          label: "Ratgeber lesen"
        }
      ]}
    />`;

product = insertBefore(
  product,
  "    <RelatedArticles items={relatedItems} />",
  productBlock,
  'title="So geht es nach dem Produkttest weiter"'
);

const comparisonBlock = `    <ConversionJourney
      title="Von der Vorauswahl zur passenden Entscheidung"
      intro="Nutze den Vergleich als Ausgangspunkt und vertiefe anschließend das Modell oder die Kriterien, die für deinen Alltag entscheidend sind."
      items={[
        {
          eyebrow: "Produkte",
          title: "Favoriten im Detail prüfen",
          text: "Öffne die Produkttests der Modelle, die bei deinen wichtigsten Kriterien vorne liegen.",
          href: "#vergleich",
          label: "Modelle vergleichen"
        },
        {
          eyebrow: "Kaufberatung",
          title: "Anforderungen genauer einordnen",
          text: "Prüfe Futterart, Tierzahl, Portionsgröße, App, Stromversorgung und Reinigungsaufwand.",
          href: "/smarte-futterautomaten/",
          label: "Kaufberatung lesen"
        },
        {
          eyebrow: "Praxis",
          title: "Betrieb und Reinigung vorbereiten",
          text: "Plane Einrichtung, Testportionen und regelmäßige Pflege schon vor dem Kauf.",
          href: "/futterautomat-richtig-reinigen/",
          label: "Praxisratgeber öffnen"
        }
      ]}
    />`;

comparison = insertBefore(
  comparison,
  "    <RelatedArticles items={relatedItems} />",
  comparisonBlock,
  'title="Von der Vorauswahl zur passenden Entscheidung"'
);

const articleBlock = `  <ConversionJourney
    title="Was jetzt sinnvoll ist"
    intro="Vertiefe das Thema oder gehe gezielt zur passenden Produkt- und Vergleichsebene weiter."
    items={[
      {
        eyebrow: "Orientierung",
        title: "Passende Kaufberatung öffnen",
        text: "Nutze die zentrale Übersicht, um Anforderungen und Gerätetypen strukturiert einzuordnen.",
        href: "/smarte-futterautomaten/",
        label: "Zur Kaufberatung"
      },
      {
        eyebrow: "Vergleich",
        title: "Geeignete Modelle gegenüberstellen",
        text: "Vergleiche Funktionen und Einsatzbereiche, statt nur einzelne Produktversprechen zu betrachten.",
        href: "/vergleiche/",
        label: "Zu den Vergleichen"
      },
      {
        eyebrow: "Praxis",
        title: "Technik sicher im Alltag nutzen",
        text: "Prüfe Reinigung, Kontrollroutinen und Grenzen automatisierter Fütterung.",
        href: "/futterautomat-richtig-reinigen/",
        label: "Praxiswissen lesen"
      }
    ]}
  />`;

article = insertBefore(
  article,
  "  <RelatedArticles items={relatedItems} />",
  articleBlock,
  'title="Was jetzt sinnvoll ist"'
);

fs.mkdirSync(path.dirname(targets.component), { recursive: true });
fs.copyFileSync(
  path.join(installerDir, "ConversionJourney.astro"),
  targets.component
);

fs.writeFileSync(targets.product, product, "utf8");
fs.writeFileSync(targets.comparison, comparison, "utf8");
fs.writeFileSync(targets.article, article, "utf8");

const manifest = {
  installedAt: new Date().toISOString(),
  backupRoot,
  files: Object.values(targets).map((file) => path.relative(root, file))
};

fs.writeFileSync(
  path.join(root, ".conversion-framework-journey.json"),
  JSON.stringify(manifest, null, 2),
  "utf8"
);

console.log(`Backup erstellt: ${backupRoot}`);
console.log("Conversion Journey installiert.");
console.log("Jetzt ausführen: npm run build:pfotentechnik");
