# PfotenTechnik 35.1 – IFA-Guide und Riko

Stand: 15.09.2026. Repository-Remote geprüft: `Yushamon/affiliate-template`.

## CONTENT

- IFA-Guide: `apps/pfotentechnik/src/content/pages/ifa-2026-haustiertechnik.md`, bestehendes Knowledge-/Page-v2-System, ohne Layoutänderung.
- Riko: `apps/pfotentechnik/src/content/products/neakasa-riko.md` vollständig im bestehenden Product-v2-System als `manufacturer-data`, eingeschränkte Empfehlung und ausdrücklich kein Praxistest angelegt. Sechs hinterlegte Originalbilder eingebunden.
- M9: weiterhin keine Produktseite, weil das Bildset fehlt. Das entspricht `inputs/codex-final-after-assets.md`, Abschnitt 1. Alle Original-Recherchen und Produktdrafts liegen unter `inputs/`, außerhalb der Runtime-Collections.
- Haustiertechnik-Hub verlinkt den IFA-Guide; Einordnung in den bestehenden Wissen-Hub über `hub.sections`.
- Riko vom IFA-Guide, Futterautomaten-Hub und bestehenden Neakasa-Profil verlinkt. Herstellerprofil um die neue Fütterungsrolle ergänzt; bestehende Katzentoiletten bleiben eigenständige Modelle.
- Keine LR5-Seite, kein LR4/LR5-Vergleich, keine Änderung bestehender Produkt-URLs, keine neue Architektur oder Schemata. Keine Aufnahme von Riko in Ranglisten für klassische Nassfutterspender.

## MEDIA

- Drei Bildordner angelegt und durch `.gitkeep` in Git erhaltbar.
- Riko: 6/6 vorhanden und referenziert, alle 800 × 800 Pixel, vollständig als WebP decodiert; vier unterschiedliche Originalmotive visuell geprüft. Hero, Thumbnail und Comparison sind identische Nutzerdateien. Galerie: Zubereitungsprinzip, App, Vorratsabdichtung. Keine erfundenen Katze-/Wohnumfeld-Alt-Texte. Datei-Prüfsummen, Motive und Maße: `riko-media.json`.
- M9: 0/6; IFA-spezifische Bilder: 0. Im Guide keine fehlenden Bildreferenzen. Der bestehende ProjectLayout-Fallback verwendet das vorhandene Projektbild als Open Graph-Bild; die Guide-Darstellung benötigt kein eigenes Hero.
- Exakte Namen und Pfade: [assets.md](assets.md). Guide-Bilder sind optional; die sechs M9-Produktbilder blockieren dessen Umsetzung.

## EVIDENCE

- Abgeschlossenes Recherchepaket als primäre Grundlage archiviert. Keine erneute breite Produktrecherche, keine Bildbeschaffung. Zusätzlich nur die ausdrücklich erforderliche aktuelle Riko-Preis-/Verfügbarkeitsprüfung sowie die durch AGENTS.md verlangte Astro-Content-Collections-Dokumentation.
- Zehn Quellen mit Provenance, Recherche-Datum, Aussagen und Feldern im bestehenden `evidenceSources`-Schema; sichtbare Quellenlinks und Recherche-/Methodikhinweis im Guide. Das Datum bezeichnet die Erfassung im gelieferten Paket, keine erneute Verifikation durch diesen Lauf.
- Riko: deutsche Produktseite priorisiert; abweichende EU-Werte und „mehr als 20“ nicht vermischt. Gemeinsame Nutzung nicht als individuelle Zugangserkennung oder Portionszuordnung dargestellt.
- M9: Preview, angekündigter 09.10.2026 klar von bestätigter DE-Lieferbarkeit getrennt. Preis, Außenmaße, Gewicht, Abfallbehälter, Tiergewichtsgrenzen, Sensoren, Streu, Lautstärke, laufende Kosten, Offline-Verhalten und Garantie offen belassen. 96 Liter nicht als Abfallbehältervolumen verwendet.
- Keine eigenen Testclaims, Sicherheitsrangfolge, medizinische Diagnose, validierte WePaws-Emotionserkennung oder redaktionelle Bestätigung des PawSwing-90%-Claims. PETGUGU nicht als gesicherte Premiere bezeichnet. LR5 und Pro getrennt.
- Riko-Commerce am 15.09.2026 auf der DE-Produktseite geprüft: 199,99 EUR Vorbestellerpreis bis 20.09.; Versand voraussichtlich ab 21.09. Keine sofortige Verfügbarkeit behauptet: `availability: unknown`, erklärender Text, keine Affiliate-URL und keine automatische Preisaktualisierung. Die bestehende Kaufbarkeitsprüfung unterdrückt ein irreführendes InStock-Offer. Preisquelle und Prüftermin sind dokumentiert.
- Bewertung 3,8/5 aus dem gelieferten Redaktionsdraft übernommen und ausdrücklich als vorläufige redaktionelle Einschätzung gekennzeichnet. Keine gemessene Leistungsnote, keine erfundenen Kriterien- oder Nutzerbewertungen.

## SEO

- Einzigartiger IFA-/PetTech-Neuheiten-Intent; Riko besitzt einen separaten Produktintent. M9 bleibt bis zum Asset-Gate ein Artikelabschnitt. Allgemeine Kaufberatung bleibt beim bestehenden Haustiertechnik-Hub.
- Selbstreferenzierender Canonical durch bestehende Architektur: `https://pfotentechnik.de/ifa-2026-haustiertechnik/`.
- Riko-Canonical: `https://pfotentechnik.de/produkt/neakasa-riko/`. Indexierung und Sitemap aktiviert; Article-/Product-Schema über bestehende Architektur. Kein Product-Schema für M9.
- Kontextlinks zu bestehenden Futterautomaten-, Katzentoiletten- und GPS-Hubs sowie `/produkt/neakasa-m1-plus/` und `/produkt/litter-robot-5-pro/`. Keine Links zur fehlenden M9-Seite.

## VALIDATION

Die abschließenden Ergebnisse stehen in `validation.json`. Prüfprotokolle liegen lokal unter `.patch-backups/35.1-final-prep/`.

## GO-LIVE

**Gesamtbatch: NOT READY.** Die sechs Originalbilder für M9 fehlen. Anschließend sind dessen vollständige Product-v2-Seite, Evidence-/Commerce-Felder und Verlinkung umzusetzen und der neue Stand zu validieren. Das Kopieren allein aktiviert keine Seite.

IFA-Guide und Riko sind unabhängig davon implementiert. Es wurde nichts deployed oder gepusht. Keine umfangreiche Screenshot-Serie: bestehende Komponenten, keine Layoutänderungen.
