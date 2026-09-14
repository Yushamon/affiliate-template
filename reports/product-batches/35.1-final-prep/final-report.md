# PfotenTechnik 35.1 – Umsetzung vor Bildbereitstellung

Stand: 14.09.2026. Repository-Remote geprüft: `Yushamon/affiliate-template`.

## CONTENT

- IFA-Guide: `apps/pfotentechnik/src/content/pages/ifa-2026-haustiertechnik.md`, bestehendes Knowledge-/Page-v2-System, ohne Layoutänderung.
- Riko und M9: wegen fehlender vollständiger Bildsets nicht als Produktseiten angelegt. Das ist die ausdrücklich vorgeschriebene Behandlung in `inputs/codex-final-after-assets.md`, Abschnitt 1, und im Minimalbrief. Alle Original-Recherchen und Produktdrafts liegen unter `inputs/`, außerhalb der Runtime-Collections.
- Haustiertechnik-Hub verlinkt den IFA-Guide; Einordnung in den bestehenden Wissen-Hub über `hub.sections`.
- Keine LR5-Seite, kein LR4/LR5-Vergleich, keine Änderung bestehender Produkt-URLs, Hersteller, Commerce-Daten oder Schemata.

## MEDIA

- Drei Bildordner angelegt und durch `.gitkeep` in Git erhaltbar.
- Riko: 0/6; M9: 0/6; IFA-spezifische Bilder: 0.
- Keine neuen Bildreferenzen. Der bestehende ProjectLayout-Fallback verwendet das vorhandene Projektbild als Open Graph-Bild; die Guide-Darstellung benötigt kein eigenes Hero.
- Exakte Namen und Pfade: [assets.md](assets.md). Guide-Bilder sind optional; die zwölf Produktbilder blockieren den vollständigen Batch.

## EVIDENCE

- Abgeschlossenes Recherchepaket als primäre Grundlage archiviert. Keine erneute Produktrecherche, keine Bildbeschaffung. Nur die durch AGENTS.md verlangte Astro-Content-Collections-Dokumentation konsultiert.
- Zehn Quellen mit Provenance, Recherche-Datum, Aussagen und Feldern im bestehenden `evidenceSources`-Schema; sichtbare Quellenlinks und Recherche-/Methodikhinweis im Guide. Das Datum bezeichnet die Erfassung im gelieferten Paket, keine erneute Verifikation durch diesen Lauf.
- Riko: deutsche Produktseite priorisiert; abweichende EU-Werte und „mehr als 20“ nicht vermischt. Gemeinsame Nutzung nicht als individuelle Zugangserkennung oder Portionszuordnung dargestellt.
- M9: Preview, angekündigter 09.10.2026 klar von bestätigter DE-Lieferbarkeit getrennt. Preis, Außenmaße, Gewicht, Abfallbehälter, Tiergewichtsgrenzen, Sensoren, Streu, Lautstärke, laufende Kosten, Offline-Verhalten und Garantie offen belassen. 96 Liter nicht als Abfallbehältervolumen verwendet.
- Keine eigenen Testclaims, Sicherheitsrangfolge, medizinische Diagnose, validierte WePaws-Emotionserkennung oder redaktionelle Bestätigung des PawSwing-90%-Claims. PETGUGU nicht als gesicherte Premiere bezeichnet. LR5 und Pro getrennt.
- Keine dynamischen Commerce-Felder veröffentlicht; Riko-Verfügbarkeitsprüfung erst bei produktiver Commerce-Integration erforderlich. Historische Preise in archivierten Eingaben sind keine öffentlichen Kaufangebote.

## SEO

- Einzigartiger IFA-/PetTech-Neuheiten-Intent; Riko/M9 sind Artikelabschnitte, keine konkurrierenden Produktseiten. Allgemeine Kaufberatung bleibt beim bestehenden Haustiertechnik-Hub.
- Selbstreferenzierender Canonical durch bestehende Architektur: `https://pfotentechnik.de/ifa-2026-haustiertechnik/`.
- Indexierung und Sitemap aktiviert; Article-Schema über ProjectLayout. Kein Product-Schema für noch nicht angelegte Produkte.
- Kontextlinks zu bestehenden Futterautomaten-, Katzentoiletten- und GPS-Hubs sowie `/produkt/neakasa-m1-plus/` und `/produkt/litter-robot-5-pro/`. Keine Links zu den fehlenden Riko-/M9-Seiten.

## VALIDATION

Die abschließenden Ergebnisse stehen in `validation.json`. Prüfprotokolle liegen lokal unter `.patch-backups/35.1-final-prep/`.

## GO-LIVE

**Gesamtbatch: NOT READY.** Die jeweils sechs Originalbilder für Riko und M9 fehlen. Anschließend sind beide vollständigen Product-v2-Seiten, ihre Evidence-/Commerce-Felder und die Produkt-/Hub-Verlinkung umzusetzen und der neue Stand zu validieren. Das Kopieren allein aktiviert keine Seiten.

Der IFA-Guide ist unabhängig davon ohne eigene Bilder implementiert. Es wurde nichts deployed oder gepusht. Keine umfangreiche Screenshot-Serie: bestehende Komponenten, keine Layoutänderungen.
