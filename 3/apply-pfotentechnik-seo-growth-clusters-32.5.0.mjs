#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-seo-growth-clusters-32.5.0";
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const skipBuild = process.argv.includes("--skip-build");

const candidates = [process.cwd(), path.resolve(SCRIPT_DIR, ".."), path.resolve(SCRIPT_DIR, "../..")];
const root = candidates.find((candidate) =>
  fs.existsSync(path.join(candidate, "apps/pfotentechnik")) &&
  fs.existsSync(path.join(candidate, "packages/affiliate-core"))
);
if (!root) throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);

const payloads = {
  "apps/pfotentechnik/src/content/pages/haustierkameras.md": "---\ntitle: \"Haustierkameras auswählen: Blickbereich, Datenschutz und Kosten\"\nslug: \"haustierkameras\"\ntype: \"page\"\nlayout: \"page\"\ndescription: \"Cornerstone für Haustierkameras: festen Blickpunkt, Interaktion oder mobilen Kameraroboter nach Wohnsituation, Datenschutz, Speicherung, Abo und Gesamtkosten auswählen.\"\nseoTitle: \"Haustierkameras: Datenschutz, Abo & Kaufberatung\"\nseoDescription: \"Haustierkamera nach Blickbereich, Interaktion, Cloud oder lokaler Speicherung, Datenschutz, Abo und 24-Monats-Kosten auswählen.\"\ncategory: \"haustiertechnik\"\ncategoryLabel: \"Haustierkameras\"\ncategoryPath: \"/wissen/\"\nlinking: { keywords: [\"Haustierkameras\", \"Haustierkamera\", \"Hundekamera\", \"Katzenkamera\"], contexts: [\"haustierkameras\", \"smarte-haustiertechnik\", \"kamera\", \"datenschutz\"], priority: \"high\", maxOccurrences: 2 }\ntags: [\"Haustierkameras\", \"Hundekamera\", \"Katzenkamera\", \"Datenschutz\", \"Cloud\", \"App\", \"Kaufberatung\"]\nauthor: { name: \"PfotenTechnik Redaktion\", role: \"Redaktion\" }\npublishedAt: \"2026-08-06\"\nupdatedAt: \"2026-08-07\"\nhub: { sections: [\"wissen\", \"haustierkameras\"], title: \"Haustierkameras\", description: \"Blickbereich, Interaktion, Speicherung, Datenschutz und Folgekosten vor dem Modell klären.\", icon: \"📷\", featured: true, order: 36 }\nhubPriority: 92\nseo: { title: \"Haustierkameras: Datenschutz, Abo & Kaufberatung\", description: \"Haustierkamera nach Blickbereich, Interaktion, Speicherung, Datenschutz, Abo und 24-Monats-Kosten auswählen.\", canonical: \"/haustierkameras/\", sitemap: true, noindex: false, priority: 0.9, changefreq: \"monthly\" }\ncontentPlatform:\n  version: 2\n  cluster: \"haustierkameras\"\n  intent: \"buying-guide\"\n  products: [\"petlibro-scout-smart-camera\", \"furbo-360-hundekamera\", \"enabot-ebo-air-2\"]\n  decision: \"auto\"\n  blocks: [\"summary\", \"comparison\", \"fit\", \"checklist\", \"mistakes\"]\n  summary:\n    - \"Zuerst den benötigten Blickbereich festlegen, dann Interaktion und erst danach KI- oder Cloudfunktionen bewerten.\"\n    - \"Cloudspeicher, KI-Auswertung und Benachrichtigungen können laufende Kosten und zusätzliche Datenverarbeitung erzeugen.\"\n    - \"Eine Haustierkamera zeigt Verhalten, ersetzt aber weder Betreuung noch eine fachliche Diagnose.\"\n  suitableFor: [\"Kontrolle eines klar definierten Innenbereichs\", \"Ferninteraktion mit einem daran gewöhnten Tier\", \"robotertaugliche Wohnungen bei mobilen Kameras\"]\n  notSuitableFor: [\"Ersatz regelmäßiger Betreuung\", \"Kauf ohne Prüfung von Cloud, Konto und Aufbewahrung\", \"mobile Roboter bei offenen Treppen oder ungeeigneten Fahrwegen\"]\n  checklist: [\"Blickbereich festlegen\", \"WLAN am Standort testen\", \"Speicherweg und Abo prüfen\", \"Mikrofon und Benachrichtigungen bewusst konfigurieren\", \"24-Monats-Kosten rechnen\"]\n  mistakes: [\"Auflösung mit besserer Abdeckung verwechseln\", \"Cloudkosten erst nach dem Kauf prüfen\", \"Leckerliausgabe als automatisch sinnvolle Interaktion ansehen\", \"Kameradaten als Diagnose interpretieren\"]\n  faqMode: \"manual\"\n  theme: \"blue\"\npremiumBlocks:\n  - { type: \"answer\", eyebrow: \"Kurzantwort\", title: \"Welche Haustierkamera passt?\", text: \"Für einen festen Futter- oder Schlafplatz reicht meist eine stationäre Kamera. Leckerliausgabe ist eine eigene Interaktionsentscheidung. Ein Kameraroboter lohnt nur, wenn mehrere Räume tatsächlich befahrbar sind.\", href: \"#entscheidung-nach-aufgabe\", cta: \"Kameraklasse wählen\" }\n  - type: \"quickFacts\"\n    eyebrow: \"Nächste Schritte\"\n    title: \"Modelle und Klassen prüfen\"\n    cards:\n      - { label: \"Vergleich\", title: \"Haustierkameras vergleichen\", text: \"Feste Kamera, Interaktionskamera und Kameraroboter nach denselben Entscheidungskriterien.\", href: \"/vergleiche/beste-haustierkameras/\", cta: \"Modelle vergleichen\" }\n      - { label: \"Fester Blickpunkt\", title: \"PETLIBRO Scout\", text: \"Cloudbasierte Mehrtierkamera für einen definierten Innenbereich.\", href: \"/produkt/petlibro-scout-smart-camera/\", cta: \"Produkt einordnen\" }\n      - { label: \"Interaktion\", title: \"Furbo 360°\", text: \"Hundekamera mit Zwei-Wege-Audio und Leckerliausgabe.\", href: \"/produkt/furbo-360-hundekamera/\", cta: \"Produkt einordnen\" }\nfaq:\n  - { question: \"Braucht eine Haustierkamera ein Abo?\", answer: \"Nicht zwingend. Livebild und Basisfunktionen können je nach Modell ohne Tarif verfügbar sein. Cloudaufzeichnung, KI-Auswertung oder spezialisierte Hinweise sind häufig tarifabhängig.\" }\n  - { question: \"Ist lokale Speicherung automatisch datenschutzfreundlicher?\", answer: \"Nein. Lokale Speicherung reduziert mögliche Cloudabhängigkeit, ersetzt aber keine Prüfung von App-Konto, Fernzugriff, Mikrofon und Updateversorgung.\" }\n  - { question: \"Reicht Full HD für eine Haustierkamera?\", answer: \"Für einen klar definierten Innenbereich häufig ja. Blickwinkel, Positionierung, Nachtsicht und tatsächliche Abdeckung sind meist wichtiger als eine höhere Auflösung allein.\" }\n  - { question: \"Ist ein Kameraroboter besser als eine feste Kamera?\", answer: \"Nur wenn mehrere relevante Bereiche auf einer befahrbaren Ebene liegen. Treppen, Schwellen, Kabel, Türen und Hindernisse können den zusätzlichen Blickbereich stark begrenzen.\" }\n  - { question: \"Hilft Gegensprechen bei Trennungsstress?\", answer: \"Das lässt sich nicht pauschal ableiten. Manche Tiere reagieren ruhig, andere werden durch eine Stimme ohne sichtbare Person eher irritiert. Die Funktion sollte beobachtet und nicht als Therapie verstanden werden.\" }\n  - { question: \"Kann eine Haustierkamera Krankheiten erkennen?\", answer: \"Nein. Sie kann Verhalten oder Hersteller-KI-Hinweise sichtbar machen. Auffälligkeiten brauchen eine fachliche Einordnung und dürfen nicht als Diagnose aus einer App übernommen werden.\" }\ndecisionJourney:\n  cluster: \"haustierkameras\"\n  stage: \"orientation\"\n  intent: \"haustierkamera-sinnvoll-auswaehlen\"\n  primaryQuestion: \"Welcher Blickbereich, welche Interaktion und welche Datenverarbeitung passen zu Tier und Wohnung?\"\n  next: [\"/vergleiche/beste-haustierkameras/\"]\n  fallback: [\"/smarte-haustiertechnik/\"]\nevidenceSources:\n  - { source: \"PETLIBRO Deutschland – Scout Smart Camera\", url: \"https://de.petlibro.com/en/products/scout-smart-camera\", accessedAt: \"2026-08-06\", assertion: \"Cloudspeicher, Mehrtiere-Erkennung und Produktrolle werden nur als Herstellerangaben verwendet.\", fields: [\"contentPlatform\", \"faq\"] }\n  - { source: \"Furbo Deutschland – Dog Cam 360\", url: \"https://furbo.com/eu-de/products/furbo-dog-cam-360\", accessedAt: \"2026-08-06\", assertion: \"Leckerliausgabe, Zwei-Wege-Audio und Nanny-Funktionen begründen die Interaktionsklasse.\", fields: [\"premiumBlocks\", \"contentPlatform\"] }\n  - { source: \"Enabot\", url: \"https://www.enabot.com/de/about-us\", accessedAt: \"2026-08-06\", assertion: \"Der mobile Kameraroboter wird als eigene Produktklasse behandelt; Fahrweg und Wohnungsgrenzen bleiben redaktionelle Entscheidungskriterien.\", fields: [\"contentPlatform\", \"decisionJourney\"] }\n---\n\nEine Haustierkamera ist zuerst ein **Blickpunkt im Zuhause** und erst danach ein smartes Gerät. Die wichtigste Frage ist, welchen Bereich du zuverlässig sehen möchtest und was du mit dem Bild tatsächlich tun willst.\n\n## Entscheidung nach Aufgabe\n\n| Aufgabe | Sinnvolle Produktklasse | Wichtigster Zielkonflikt |\n|---|---|---|\n| Futterplatz, Schlafplatz oder Eingang beobachten | feste Innenkamera | nur der gewählte Blickbereich ist sichtbar |\n| mit dem Hund sprechen oder bewusst Leckerli ausgeben | Interaktionskamera | Tierreaktion, Reinigung und mögliche Abokosten |\n| mehrere verbundene Räume aktiv abfahren | mobiler Kameraroboter | Schwellen, Treppen, Kabel, Türen und Ladeweg |\n| Aufzeichnungen möglichst unabhängig von Cloudtarifen halten | Modell mit geeigneter lokaler Speicherung | lokale Speicherung ist modellabhängig und muss konkret belegt sein |\n\nDer [Vergleich der Haustierkameras](/vergleiche/beste-haustierkameras/) besitzt die konkrete Modellentscheidung. Dieser Hub klärt vorher Kameraklasse, Aufstellung, Datenweg und Folgekosten.\n\n## Blickbereich vor Auflösung\n\nEine höhere Auflösung löst keinen falschen Standort. Markiere zuerst den Bereich, der wirklich relevant ist. Prüfe dann Sichtwinkel, Schwenkbereich, Gegenlicht und Nachtsicht.\n\nFür mehrere Räume ist eine zweite feste Kamera oft berechenbarer als ein Roboter. Ein mobiler Kameraroboter gewinnt nur dann Reichweite, wenn Türen offen, Übergänge flach und Fahrwege frei sind.\n\n## Interaktion ist eine eigene Entscheidung\n\nZwei-Wege-Audio und Leckerliausgabe sind keine automatische Verbesserung. Entscheidend ist, wie das individuelle Tier reagiert.\n\nDie [Furbo 360° Hundekamera](/produkt/furbo-360-hundekamera/) gehört deshalb in eine andere Klasse als eine reine Beobachtungskamera. Stimme oder Wurfgeräusch sollten zunächst kurz und unter Beobachtung ausprobiert werden.\n\n## Cloud, Konto und Speicherung vor dem Kauf klären\n\nPrüfe nicht nur, **ob** eine Kamera speichern kann, sondern **wo** und unter welchen Bedingungen:\n\n- Funktioniert Livebild ohne kostenpflichtigen Tarif?\n- Gibt es lokale Speicherung oder ausschließlich Cloud?\n- Welche Funktionen benötigen ein Konto?\n- Welche Aufnahmen oder Ereignisse werden gespeichert?\n- Lassen sich Kamera oder Objektiv physisch deaktivieren?\n- Welche KI-Funktionen verschwinden ohne Abo?\n- Wie werden Firmware- und Sicherheitsupdates bereitgestellt?\n\nDie [PETLIBRO Scout Smart Camera](/produkt/petlibro-scout-smart-camera/) zeigt, warum Cloud- und KI-Funktionen getrennt von der Kamerahardware bewertet werden müssen.\n\n## Gesamtkosten über 24 Monate rechnen\n\n`24-Monats-Kosten = Gerät + 24 × Monatsgebühr + Zubehör + erwartete Ersatzteile`\n\nRechne mindestens Basisbetrieb ohne kostenpflichtige Zusatzfunktionen und den Tarif, den du für die gewünschten Funktionen tatsächlich benötigen würdest.\n\n## Einrichtung vor der endgültigen Platzierung testen\n\n1. WLAN-Signal am realen Standort prüfen.\n2. Tag- und Nachtbild kontrollieren.\n3. Gegenlicht und tote Winkel testen.\n4. Benachrichtigungen so reduzieren, dass sie nicht dauerhaft ignoriert werden.\n5. Mikrofon und Lautsprecher bewusst ausprobieren.\n6. Prüfen, welche Funktionen ohne Cloudtarif übrig bleiben.\n\nBeim [Enabot EBO Air 2](/produkt/enabot-ebo-air-2/) kommt zusätzlich der Fahrweg hinzu. Ein beweglicher Blickpunkt ist nur dann ein Vorteil, wenn der Roboter die relevanten Bereiche tatsächlich erreicht.\n\n## Typische Fehlkäufe\n\n- 2K oder 4K kaufen, obwohl der gewünschte Bereich außerhalb des Blickwinkels liegt.\n- Ein Abo erst nach der Einrichtung bemerken.\n- Cloudspeicherung und lokale Speicherung gleichsetzen.\n- Leckerliausgabe wählen, obwohl sie für die eigentliche Aufgabe nicht benötigt wird.\n- Einen Kameraroboter für eine Wohnung mit offenen Treppen oder vielen Schwellen kaufen.\n- Hersteller-KI als verlässliche Verhaltens- oder Gesundheitsdiagnose lesen.\n\n## Grenzen der Technik\n\nEine Kamera kann zeigen, was vor dem Objektiv geschieht. Sie beweist nicht, warum ein Tier bellt, miaut, unruhig ist oder sein Verhalten ändert. Die Aufnahme ist ein Beobachtungshinweis und keine Diagnose.\n\nDie Modellunterschiede bei Speicherung, Abo, Interaktion und Beweglichkeit stehen im [Haustierkamera-Vergleich](/vergleiche/beste-haustierkameras/).\n",
  "apps/pfotentechnik/scripts/seo/audit-growth-clusters.mjs": "#!/usr/bin/env node\nimport fs from \"node:fs\";\nimport path from \"node:path\";\nimport { fileURLToPath } from \"node:url\";\n\nconst APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), \"../..\");\nconst ROOT = path.resolve(APP_ROOT, \"../..\");\nconst reportDir = path.join(APP_ROOT, \"reports\", \"seo-growth\");\nconst errors = [];\nconst warnings = [];\n\nconst read = (relative) => {\n  const file = path.join(ROOT, relative);\n  if (!fs.existsSync(file)) {\n    errors.push(`Datei fehlt: ${relative}`);\n    return \"\";\n  }\n  return fs.readFileSync(file, \"utf8\");\n};\n\nconst requireText = (text, needle, message) => {\n  if (!text.includes(needle)) errors.push(message);\n};\n\nconst taxonomy = read(\"apps/pfotentechnik/src/domain/content/linkTaxonomy.data.mjs\");\nconst recommendations = read(\"apps/pfotentechnik/src/domain/recommendationLinks.ts\");\nconst cameraHub = read(\"apps/pfotentechnik/src/content/pages/haustierkameras.md\");\nconst litterHub = read(\"apps/pfotentechnik/src/content/pages/automatische-katzentoiletten.md\");\nconst catFlapHub = read(\"apps/pfotentechnik/src/content/pages/katzenklappen.md\");\nconst cameraComparison = read(\"apps/pfotentechnik/src/content/comparisons/beste-haustierkameras.md\");\nconst litterComparison = read(\"apps/pfotentechnik/src/content/comparisons/beste-automatische-katzentoiletten.md\");\nconst catFlapComparison = read(\"apps/pfotentechnik/src/content/comparisons/beste-mikrochip-katzenklappen.md\");\n\nconst clusters = [\n  [\"Haustierkameras\", cameraHub, cameraComparison, \"/haustierkameras/\", \"/vergleiche/beste-haustierkameras/\"],\n  [\"Automatische Katzentoiletten\", litterHub, litterComparison, \"/automatische-katzentoiletten/\", \"/vergleiche/beste-automatische-katzentoiletten/\"],\n  [\"Katzenklappen\", catFlapHub, catFlapComparison, \"/katzenklappen/\", \"/vergleiche/beste-mikrochip-katzenklappen/\"]\n];\n\nfor (const [name, hub, comparison, hubPath, comparisonPath] of clusters) {\n  requireText(hub, \"contentPlatform:\", `${name}: contentPlatform fehlt.`);\n  requireText(hub, \"decisionJourney:\", `${name}: decisionJourney fehlt.`);\n  requireText(hub, \"linking:\", `${name}: Linking-Kontext fehlt.`);\n  requireText(hub, `canonical: \"${hubPath}\"`, `${name}: Hub-Canonical fehlt oder ist falsch.`);\n  requireText(comparison, `canonical: \"${comparisonPath}\"`, `${name}: Vergleichs-Canonical fehlt oder ist falsch.`);\n  requireText(taxonomy, `href: \"${hubPath}\"`, `${name}: Hub ist in der Link-Taxonomie nicht routbar.`);\n  requireText(taxonomy, `href: \"${comparisonPath}\"`, `${name}: Vergleich ist in der Link-Taxonomie nicht routbar.`);\n}\n\nrequireText(recommendations, '| \"katzentoiletten\"', \"Empfehlungslogik kennt Katzentoiletten nicht als Familie.\");\nrequireText(recommendations, '[\"katzentoiletten\",', \"Empfehlungslogik besitzt kein Katzentoiletten-Muster.\");\n\nconst litterProducts = [\n  \"litter-robot-5-pro\",\n  \"petkit-purobot-max-pro-2\",\n  \"neakasa-m1-plus\",\n  \"neakasa-m1-lite\",\n  \"devoko-90l-automatisches-katzenklo\"\n];\n\nfor (const slug of litterProducts) {\n  const product = read(`apps/pfotentechnik/src/content/products/${slug}.md`);\n  requireText(litterHub, `\"${slug}\"`, `Katzentoiletten-Hub führt ${slug} nicht.`);\n  requireText(litterComparison, `slug: \"${slug}\"`, `Katzentoiletten-Vergleich enthält ${slug} nicht.`);\n  requireText(product, \"automatische-katzentoiletten\", `${slug}: Cluster fehlt.`);\n  requireText(product, \"beste-automatische-katzentoiletten\", `${slug}: Rückverweis auf Vergleich fehlt.`);\n}\n\nfor (const slug of [\"petlibro-scout-smart-camera\", \"furbo-360-hundekamera\", \"enabot-ebo-air-2\"]) {\n  const product = read(`apps/pfotentechnik/src/content/products/${slug}.md`);\n  requireText(cameraHub, `\"${slug}\"`, `Haustierkamera-Hub führt ${slug} nicht.`);\n  requireText(cameraComparison, `slug: \"${slug}\"`, `Haustierkamera-Vergleich enthält ${slug} nicht.`);\n  requireText(product, \"beste-haustierkameras\", `${slug}: Rückverweis auf Vergleich fehlt.`);\n}\n\nfor (const marker of [\"seo:\", \"premiumBlocks:\", \"evidenceSources:\", \"faq:\"]) {\n  requireText(cameraHub, marker, `Haustierkamera-Hub: ${marker} fehlt.`);\n}\n\nfs.mkdirSync(reportDir, { recursive: true });\nconst report = {\n  schemaVersion: 1,\n  generatedAt: new Date().toISOString(),\n  status: errors.length ? \"error\" : \"ok\",\n  clusters: clusters.map(([name]) => name),\n  errors,\n  warnings\n};\n\nfs.writeFileSync(path.join(reportDir, \"growth-clusters-latest.json\"), JSON.stringify(report, null, 2) + \"\\n\", \"utf8\");\nfs.writeFileSync(path.join(reportDir, \"growth-clusters-latest.md\"), [\n  \"# SEO Growth Clusters\",\n  \"\",\n  `- Status: ${report.status.toUpperCase()}`,\n  `- Cluster: ${report.clusters.join(\", \")}`,\n  `- Fehler: ${errors.length}`,\n  `- Warnungen: ${warnings.length}`,\n  \"\",\n  \"## Fehler\",\n  \"\",\n  ...(errors.length ? errors.map((item) => `- ${item}`) : [\"Keine.\"]),\n  \"\",\n  \"## Warnungen\",\n  \"\",\n  ...(warnings.length ? warnings.map((item) => `- ${item}`) : [\"Keine.\"]),\n  \"\"\n].join(\"\\n\"), \"utf8\");\n\nconsole.log(\"# SEO Growth Clusters\");\nconsole.log(`Status: ${report.status.toUpperCase()}`);\nconsole.log(`Fehler: ${errors.length}`);\nconsole.log(`Warnungen: ${warnings.length}`);\n\nif (errors.length) {\n  for (const error of errors) console.error(`- ${error}`);\n  process.exitCode = 1;\n}\n",
  "apps/pfotentechnik/test/seo-growth-clusters-32.5.0.test.mjs": "import test from \"node:test\";\nimport assert from \"node:assert/strict\";\nimport fs from \"node:fs\";\nimport path from \"node:path\";\n\nconst root = process.cwd();\nconst read = (relative) => fs.readFileSync(path.join(root, relative), \"utf8\");\n\nconst taxonomy = read(\"apps/pfotentechnik/src/domain/content/linkTaxonomy.data.mjs\");\nconst recommendations = read(\"apps/pfotentechnik/src/domain/recommendationLinks.ts\");\nconst cameraHub = read(\"apps/pfotentechnik/src/content/pages/haustierkameras.md\");\nconst litterHub = read(\"apps/pfotentechnik/src/content/pages/automatische-katzentoiletten.md\");\nconst litterComparison = read(\"apps/pfotentechnik/src/content/comparisons/beste-automatische-katzentoiletten.md\");\nconst preflight = read(\"apps/pfotentechnik/scripts/seo/release-preflight.mjs\");\nconst packageJson = JSON.parse(read(\"apps/pfotentechnik/package.json\"));\n\ntest(\"neue Kerncluster besitzen routbare Hub-Einträge\", () => {\n  for (const href of [\"/haustierkameras/\", \"/automatische-katzentoiletten/\", \"/katzenklappen/\"]) {\n    assert.ok(taxonomy.includes(`href: \"${href}\"`), href);\n  }\n});\n\ntest(\"neue Kerncluster besitzen routbare Vergleichseinträge\", () => {\n  for (const href of [\n    \"/vergleiche/beste-haustierkameras/\",\n    \"/vergleiche/beste-automatische-katzentoiletten/\",\n    \"/vergleiche/beste-mikrochip-katzenklappen/\"\n  ]) {\n    assert.ok(taxonomy.includes(`href: \"${href}\"`), href);\n  }\n});\n\ntest(\"Katzentoiletten sind eine echte Empfehlungsfamilie\", () => {\n  assert.match(recommendations, /\\| \"katzentoiletten\"/);\n  assert.match(recommendations, /\\[\"katzentoiletten\",/);\n  assert.match(recommendations, /\"katzentoiletten\"\\]\\.includes\\(topic\\)/);\n});\n\ntest(\"Haustierkamera-Hub besitzt Premium- und Intent-Struktur\", () => {\n  for (const marker of [\n    \"contentPlatform:\",\n    'cluster: \"haustierkameras\"',\n    'intent: \"buying-guide\"',\n    \"premiumBlocks:\",\n    \"decisionJourney:\",\n    \"evidenceSources:\",\n    'canonical: \"/haustierkameras/\"'\n  ]) assert.ok(cameraHub.includes(marker), marker);\n});\n\ntest(\"Katzentoiletten-Hub führt fünf aktuelle Produkte\", () => {\n  for (const slug of [\n    \"litter-robot-5-pro\",\n    \"petkit-purobot-max-pro-2\",\n    \"neakasa-m1-plus\",\n    \"neakasa-m1-lite\",\n    \"devoko-90l-automatisches-katzenklo\"\n  ]) assert.ok(litterHub.includes(`\"${slug}\"`), slug);\n});\n\ntest(\"Katzentoiletten-Vergleich enthält fünf Modelle\", () => {\n  for (const slug of [\n    \"litter-robot-5-pro\",\n    \"petkit-purobot-max-pro-2\",\n    \"neakasa-m1-plus\",\n    \"neakasa-m1-lite\",\n    \"devoko-90l-automatisches-katzenklo\"\n  ]) assert.ok(litterComparison.includes(`slug: \"${slug}\"`), slug);\n  assert.match(litterComparison, /5 Modelle/);\n});\n\ntest(\"Growth-Audit ist Teil des Release-Preflights\", () => {\n  assert.equal(packageJson.scripts[\"audit:seo-growth-clusters\"], \"node scripts/seo/audit-growth-clusters.mjs\");\n  assert.match(preflight, /SEO-Wachstumscluster/);\n  assert.match(preflight, /audit:seo-growth-clusters/);\n});\n"
};
const taxonomyReplacements = {
  "topic:haustierkameras": "  {\n    id: \"hub:haustierkameras\",\n    href: \"/haustierkameras/\",\n    title: \"Haustierkameras\",\n    targetGroup: \"hub\",\n    topics: [\"haustierkameras\", \"haustiertechnik\"],\n    anchorAliases: [\"Haustierkamera\", \"Haustierkameras\", \"Hundekamera\", \"Hundekameras\", \"Katzenkamera\", \"Katzenkameras\"],\n    exclusiveAnchors: [\"Haustierkameras\"],\n    contextTerms: [\"Futterkamera\", \"Innenkamera\", \"Kameraroboter\", \"Cloudspeicher\", \"Nachtsicht\", \"Zwei-Wege-Audio\", \"Datenschutz\", \"App\"],\n    intentTerms: [\"Überblick\", \"Kaufberatung\", \"Datenschutz\", \"Kosten\"],\n    priority: \"high\",\n    cornerstone: true\n  },\n  {\n    id: \"comparison:beste-haustierkameras\",\n    href: \"/vergleiche/beste-haustierkameras/\",\n    title: \"Haustierkameras im Vergleich\",\n    targetGroup: \"comparison\",\n    topics: [\"haustierkameras\", \"haustiertechnik\"],\n    anchorAliases: [\"Haustierkameras im Vergleich\", \"beste Haustierkameras\", \"Haustierkameras vergleichen\", \"Hundekameras im Vergleich\"],\n    contextTerms: [\"PETLIBRO Scout\", \"Furbo 360\", \"Enabot EBO\", \"Modelle\", \"Cloud\", \"Abo\"],\n    intentTerms: [\"vergleichen\", \"beste Modelle\", \"Kaufentscheidung\"],\n    priority: \"high\"\n  },",
  "topic:katzenklappen": "  {\n    id: \"hub:katzenklappen\",\n    href: \"/katzenklappen/\",\n    title: \"Katzenklappen\",\n    targetGroup: \"hub\",\n    topics: [\"katzenklappen\", \"haustiertechnik\", \"katzen\"],\n    anchorAliases: [\"Katzenklappe\", \"Katzenklappen\", \"Mikrochip-Katzenklappe\", \"Mikrochip-Katzenklappen\", \"smarte Katzenklappe\", \"smarte Katzenklappen\"],\n    exclusiveAnchors: [\"Katzenklappen\"],\n    contextTerms: [\"Mikrochip\", \"DualScan\", \"App\", \"Beuteerkennung\", \"Zugangskontrolle\", \"Einbau\", \"Mehrkatzenhaushalt\"],\n    intentTerms: [\"Überblick\", \"Kaufberatung\", \"Einbau\", \"Zugang\"],\n    priority: \"high\",\n    cornerstone: true\n  },\n  {\n    id: \"comparison:beste-mikrochip-katzenklappen\",\n    href: \"/vergleiche/beste-mikrochip-katzenklappen/\",\n    title: \"Mikrochip-Katzenklappen im Vergleich\",\n    targetGroup: \"comparison\",\n    topics: [\"katzenklappen\", \"katzen\"],\n    anchorAliases: [\"Mikrochip-Katzenklappen im Vergleich\", \"beste Mikrochip-Katzenklappen\", \"Mikrochip-Katzenklappen vergleichen\"],\n    contextTerms: [\"SureFlap\", \"PetSafe\", \"OnlyCat\", \"Modelle\", \"Zugangsrechte\"],\n    intentTerms: [\"vergleichen\", \"beste Modelle\", \"Kaufentscheidung\"],\n    priority: \"high\"\n  },\n  {\n    id: \"comparison:katzenklappen-app-beute\",\n    href: \"/vergleiche/katzenklappen-mit-app-und-beuteerkennung/\",\n    title: \"Katzenklappen mit App und Beuteerkennung\",\n    targetGroup: \"comparison\",\n    topics: [\"katzenklappen\", \"haustiertechnik\", \"katzen\"],\n    anchorAliases: [\"Katzenklappen mit App und Beuteerkennung\", \"Katzenklappen mit App\", \"Katzenklappen mit Beuteerkennung\"],\n    contextTerms: [\"App\", \"Beuteerkennung\", \"Connect\", \"OnlyCat\", \"ZeroMOUSE\"],\n    intentTerms: [\"vergleichen\", \"App\", \"Beuteerkennung\"],\n    priority: \"high\"\n  },",
  "topic:katzentoiletten": "  {\n    id: \"hub:katzentoiletten\",\n    href: \"/automatische-katzentoiletten/\",\n    title: \"Automatische Katzentoiletten\",\n    targetGroup: \"hub\",\n    topics: [\"katzentoiletten\", \"haustiertechnik\", \"katzen\"],\n    anchorAliases: [\"automatische Katzentoilette\", \"automatische Katzentoiletten\", \"automatisches Katzenklo\", \"automatische Katzenklos\", \"selbstreinigendes Katzenklo\", \"selbstreinigende Katzenklos\"],\n    exclusiveAnchors: [\"automatische Katzentoiletten\", \"automatisches Katzenklo\"],\n    contextTerms: [\"Selbstreinigung\", \"Mindestgewicht\", \"Sicherheitsstopp\", \"Streu\", \"Abfallbehälter\", \"App\", \"Mehrkatzenhaushalt\"],\n    intentTerms: [\"Überblick\", \"Kaufberatung\", \"Sicherheit\", \"Hygiene\"],\n    priority: \"high\",\n    cornerstone: true\n  },\n  {\n    id: \"comparison:beste-automatische-katzentoiletten\",\n    href: \"/vergleiche/beste-automatische-katzentoiletten/\",\n    title: \"Automatische Katzentoiletten im Vergleich\",\n    targetGroup: \"comparison\",\n    topics: [\"katzentoiletten\", \"katzen\"],\n    anchorAliases: [\"automatische Katzentoiletten im Vergleich\", \"beste automatische Katzentoiletten\", \"automatische Katzenklos im Vergleich\", \"selbstreinigende Katzenklos im Vergleich\"],\n    contextTerms: [\"Litter-Robot\", \"PETKIT\", \"Neakasa\", \"Devoko\", \"Modelle\", \"Sicherheit\"],\n    intentTerms: [\"vergleichen\", \"beste Modelle\", \"Kaufentscheidung\"],\n    priority: \"high\"\n  },"
};

const backupRoot = path.join(root, ".patch-backups", `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
let changed = 0;
let backupCreated = false;
const absolute = (relative) => path.join(root, relative);
const ensureParent = (file) => fs.mkdirSync(path.dirname(file), { recursive: true });

function backup(relative) {
  const source = absolute(relative);
  if (!fs.existsSync(source)) return;
  const destination = path.join(backupRoot, relative);
  ensureParent(destination);
  fs.copyFileSync(source, destination);
  backupCreated = true;
}

function writeIfChanged(relative, content) {
  const target = absolute(relative);
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
  if (current === content) {
    console.log(`[${PATCH}] Unverändert: ${relative}`);
    return;
  }
  backup(relative);
  ensureParent(target);
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, content, "utf8");
  fs.renameSync(temporary, target);
  changed += 1;
  console.log(`[${PATCH}] Geschrieben: ${relative}`);
}

function replaceRequired(source, oldValue, newValue, label) {
  if (source.includes(newValue)) return source;
  if (!source.includes(oldValue)) {
    throw new Error(`[${PATCH}] ${label}: erwarteter Ausgangsblock fehlt.`);
  }
  return source.replace(oldValue, newValue);
}

for (const required of [
  "apps/pfotentechnik/src/content/products/neakasa-m1-lite.md",
  "apps/pfotentechnik/src/content/products/devoko-90l-automatisches-katzenklo.md",
  "apps/pfotentechnik/src/content/comparisons/beste-haustierkameras.md",
  "apps/pfotentechnik/src/content/pages/katzenklappen.md",
  "apps/pfotentechnik/src/content/comparisons/beste-mikrochip-katzenklappen.md"
]) {
  if (!fs.existsSync(absolute(required))) throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${required}`);
}

for (const [relative, content] of Object.entries(payloads)) writeIfChanged(relative, content);

// Zentrale Link-Taxonomie.
const taxonomyPath = "apps/pfotentechnik/src/domain/content/linkTaxonomy.data.mjs";
let taxonomy = fs.readFileSync(absolute(taxonomyPath), "utf8");
for (const [oldId, replacement] of Object.entries(taxonomyReplacements)) {
  const newId = replacement.match(/id: "([^"]+)"/)?.[1];
  if (newId && taxonomy.includes(`id: "${newId}"`)) continue;

  const startNeedle = `  {\n    id: "${oldId}",`;
  const start = taxonomy.indexOf(startNeedle);
  if (start < 0) throw new Error(`[${PATCH}] Taxonomieblock ${oldId} nicht gefunden.`);

  const end = taxonomy.indexOf("\n  },", start);
  if (end < 0) throw new Error(`[${PATCH}] Ende von ${oldId} nicht gefunden.`);
  taxonomy = taxonomy.slice(0, start) + replacement + taxonomy.slice(end + 5);
}
writeIfChanged(taxonomyPath, taxonomy);

// Recommendation Engine.
const recommendationPath = "apps/pfotentechnik/src/domain/recommendationLinks.ts";
let recommendations = fs.readFileSync(absolute(recommendationPath), "utf8");
recommendations = replaceRequired(
  recommendations,
  `  | "katzenklappen"\n  | "haustierkameras";`,
  `  | "katzenklappen"\n  | "haustierkameras"\n  | "katzentoiletten";`,
  "RecommendationFamily erweitern"
);
recommendations = replaceRequired(
  recommendations,
  `  ["katzenklappen", /\\b(katzenklappe|katzenklappen|mikrochipklappe|cat flap)\\b/],\n  ["haustierkameras", /\\b(haustierkamera|tierkamera|pet camera|kamera fuer haustiere)\\b/]`,
  `  ["katzenklappen", /\\b(katzenklappe|katzenklappen|mikrochipklappe|cat flap)\\b/],\n  ["haustierkameras", /\\b(haustierkamera|tierkamera|pet camera|kamera fuer haustiere)\\b/],\n  ["katzentoiletten", /\\b(automatische katzentoilette|automatische katzentoiletten|automatisches katzenklo|automatische katzenklos|selbstreinigendes katzenklo|selbstreinigende katzenklos|litter robot|litter-robot)\\b/]`,
  "Katzentoiletten-Familienmuster ergänzen"
);
recommendations = replaceRequired(
  recommendations,
  `    ["futterautomaten", "trinkbrunnen", "gps-tracker", "katzenklappen", "haustierkameras"].includes(topic)`,
  `    ["futterautomaten", "trinkbrunnen", "gps-tracker", "katzenklappen", "haustierkameras", "katzentoiletten"].includes(topic)`,
  "Katzentoiletten als Topic-Familie zulassen"
);
writeIfChanged(recommendationPath, recommendations);

// Automatische Katzentoiletten: Bestand auf fünf Produkte erweitern.
const litterHubPath = "apps/pfotentechnik/src/content/pages/automatische-katzentoiletten.md";
let litterHub = fs.readFileSync(absolute(litterHubPath), "utf8");
litterHub = litterHub.replace('updatedAt: "2026-08-06"', 'updatedAt: "2026-08-07"');
litterHub = litterHub.replace("maxOccurrences: 1", "maxOccurrences: 2");
litterHub = replaceRequired(
  litterHub,
  `  products: ["litter-robot-5-pro", "petkit-purobot-max-pro-2", "neakasa-m1-plus"]`,
  `  products: ["litter-robot-5-pro", "petkit-purobot-max-pro-2", "neakasa-m1-plus", "neakasa-m1-lite", "devoko-90l-automatisches-katzenklo"]`,
  "Katzentoiletten-Hub Produktbestand"
);
if (!litterHub.includes("## Zwei neue Modelle richtig einordnen")) {
  litterHub += `\n\n## Zwei neue Modelle richtig einordnen\n\nDas [Neakasa M1 Lite](/produkt/neakasa-m1-lite/) ist keine neue Systemklasse. Es gehört technisch in die offene M1-Familie und unterscheidet sich vor allem beim Lieferumfang. Das [Devoko 90L](/produkt/devoko-90l-automatisches-katzenklo/) erweitert den bestehenden Vergleich um eine preisorientierte geschlossene Option mit niedrigerem Einstieg und weniger konsistenter öffentlicher Dokumentation.\n\nBeide Produkte gehören deshalb in den [bestehenden Vergleich automatischer Katzentoiletten](/vergleiche/beste-automatische-katzentoiletten/) und rechtfertigen keine zusätzlichen Vergleichs-URLs.\n`;
}
writeIfChanged(litterHubPath, litterHub);

// Vergleich auf fünf Modelle erweitern.
const litterComparisonPath = "apps/pfotentechnik/src/content/comparisons/beste-automatische-katzentoiletten.md";
let litterComparison = fs.readFileSync(absolute(litterComparisonPath), "utf8");
litterComparison = litterComparison.replace('updatedAt: "2026-08-06"', 'updatedAt: "2026-08-07"');
litterComparison = litterComparison.replace(
  'description: "Litter-Robot 5 Pro, PETKIT PUROBOT MAX PRO 2 und Neakasa M1 Plus nach Bauform, Mindestgewicht, Sicherheit, Streu, App und Folgekosten vergleichen."',
  'description: "Fünf automatische Katzentoiletten nach Bauform, Mindestgewicht, Einstieg, Sicherheit, Streu, App und Folgekosten vergleichen."'
);
litterComparison = litterComparison.replace(
  'seo: { title: "Automatische Katzentoiletten im Vergleich: 3 Systeme", description: "Drei automatische Katzenklos nach Mindestgewicht, Einstieg, Sicherheit, Streu, App und Drei-Jahres-Kosten vergleichen.", canonical:',
  'seo: { title: "Automatische Katzentoiletten im Vergleich: 5 Modelle", description: "Fünf automatische Katzenklos nach Mindestgewicht, Einstieg, Sicherheit, Streu, App und Drei-Jahres-Kosten vergleichen.", canonical:'
);
litterComparison = litterComparison.replace(
  'hub: { sections: ["vergleiche", "automatische-katzentoiletten"], title: "Automatische Katzentoiletten im Vergleich", description: "Drei Systemtypen nach Sicherheits- und Passformkriterien.",',
  'hub: { sections: ["vergleiche", "automatische-katzentoiletten"], title: "Automatische Katzentoiletten im Vergleich", description: "Fünf Modelle nach Sicherheits-, Passform- und Betriebskriterien.",'
);

if (!litterComparison.includes('slug: "neakasa-m1-lite"')) {
  const marker = `criteria:\n`;
  const extraItems = `  - slug: "neakasa-m1-lite"\n    type: "product"\n    label: "Neakasa M1 Lite"\n    recommendation: "Offene M1-Alternative mit reduziertem Lieferumfang, wenn der etwa 35,2 cm hohe Einstieg passt."\n    values:\n      system: "Offene Siebtrommel / Open Top"\n      mindestgewicht: "ca. 1 kg; darunter Kitten-Modus ohne Automatik"\n      einstieg: "ca. 35,2 cm, oben offen"\n      sicherheit: "IR-Sensorik und Stoppfunktion laut Hersteller; Detailangaben uneinheitlich"\n      streu: "Klumpend und siebfähig; keine Holzpellets"\n      app: "Monitoring, Füllstand und Fernsteuerung"\n      kosten: "Streu und Beutel; weniger Zubehör als M1 Plus"\n  - slug: "devoko-90l-automatisches-katzenklo"\n    type: "product"\n    label: "Devoko 90L"\n    recommendation: "Preisorientierte XXL-Alternative mit niedrigem Einstieg; konkrete Modellvariante und Dokumentation besonders genau prüfen."\n    values:\n      system: "Geschlossene automatische Trommel"\n      mindestgewicht: "ca. 1,5–10 kg"\n      einstieg: "ca. 23 cm; großer Innenraum"\n      sicherheit: "IR-, Gewichts- und Radarerkennung; Sensorzahl öffentlich widersprüchlich"\n      streu: "Verschiedene klumpende Streusorten laut Dokumentation"\n      app: "2,4-GHz-WLAN; Gewicht, Nutzung und Fernreinigung"\n      kosten: "Streu, Beutel, Geruchsneutralisator; Service und Garantie prüfen"\n`;
  litterComparison = replaceRequired(litterComparison, marker, extraItems + marker, "Neue Katzentoiletten in Vergleich aufnehmen");
}

litterComparison = litterComparison.replace(
  `next: ["/produkt/litter-robot-5-pro/", "/produkt/petkit-purobot-max-pro-2/", "/produkt/neakasa-m1-plus/"]`,
  `next: ["/produkt/litter-robot-5-pro/", "/produkt/petkit-purobot-max-pro-2/", "/produkt/neakasa-m1-plus/", "/produkt/neakasa-m1-lite/", "/produkt/devoko-90l-automatisches-katzenklo/"]`
);

if (!litterComparison.includes("Neu hinzugekommen sind [Neakasa M1 Lite]")) {
  litterComparison += `\n\nNeu hinzugekommen sind [Neakasa M1 Lite](/produkt/neakasa-m1-lite/) und [Devoko 90L](/produkt/devoko-90l-automatisches-katzenklo/). Das M1 Lite erweitert die offene M1-Familie; Devoko ergänzt eine günstigere geschlossene Alternative mit niedrigerem Einstieg und schwächerer Dokumentationslage.\n`;
}
writeIfChanged(litterComparisonPath, litterComparison);

// Audit registrieren.
const packagePath = "apps/pfotentechnik/package.json";
const packageJson = JSON.parse(fs.readFileSync(absolute(packagePath), "utf8"));
packageJson.scripts ??= {};
if (packageJson.scripts["audit:seo-growth-clusters"] !== "node scripts/seo/audit-growth-clusters.mjs") {
  packageJson.scripts["audit:seo-growth-clusters"] = "node scripts/seo/audit-growth-clusters.mjs";
}
writeIfChanged(packagePath, JSON.stringify(packageJson, null, 2) + "\n");

const preflightPath = "apps/pfotentechnik/scripts/seo/release-preflight.mjs";
let preflight = fs.readFileSync(absolute(preflightPath), "utf8");
if (!preflight.includes('"SEO-Wachstumscluster"')) {
  const sourceAuditPattern = /^(\s*)npmScript\("Technischer SEO-Source-Audit", "audit:technical-seo:source"\);$/m;
  const match = preflight.match(sourceAuditPattern);
  if (!match) throw new Error(`[${PATCH}] Technischer SEO-Source-Audit im Preflight nicht gefunden.`);
  const indent = match[1] ?? "";
  preflight = preflight.replace(
    sourceAuditPattern,
    `${indent}npmScript("Technischer SEO-Source-Audit", "audit:technical-seo:source");\n${indent}npmScript("SEO-Wachstumscluster", "audit:seo-growth-clusters");`
  );
}
writeIfChanged(preflightPath, preflight);

if (!backupCreated && fs.existsSync(backupRoot)) fs.rmSync(backupRoot, { recursive: true, force: true });

function run(command, args) {
  console.log(`[${PATCH}] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`[${PATCH}] Kommando fehlgeschlagen (${result.status}).`);
}

run(process.execPath, ["--test", "apps/pfotentechnik/test/seo-growth-clusters-32.5.0.test.mjs"]);
run(process.execPath, ["apps/pfotentechnik/scripts/seo/audit-growth-clusters.mjs"]);

if (!skipBuild) run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);

console.log(`[${PATCH}] Fertig. ${changed} Datei(en) geändert.${skipBuild ? " Build übersprungen." : ""}`);
