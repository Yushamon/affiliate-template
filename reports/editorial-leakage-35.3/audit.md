# PFOTENTECHNIK 35.3 — Editorial Leakage & Reader Language

**EDITORIAL LEAKAGE GATE: PASS** — für den lokalen Produktionsbuild und die redaktionelle Closure. Kein Deployment durchgeführt. Der bereits vor 35.3 fehlschlagende Preis-Audit bleibt als separate Commerce-Ausnahme dokumentiert.

## Scope und Zählweise

260 öffentliche kanonische Seiten plus die öffentliche 404-Seite wurden vollständig gerendert geprüft (261 HTML-Dokumente). Der Build umfasst unverändert 375 Dokumente; 113 Admin-Seiten und die interne Foundation-Seite sind vom öffentlichen Sprach-Gate ausgeschlossen. 429 Quelldateien wurden durchsucht, darunter alle 248 Dateien der vier Content-Collections.

Erfasst wurden sichtbarer Text, Überschriften, Tabellen, FAQ, Callouts, Buttons, Karten, Alt-/ARIA-/Title-Beschriftungen, SEO-Metadaten und redaktionelle JSON-LD-Werte. Script-Inhalte, Schema-Schlüssel, Datenattribute, Kommentare, interne Slugs, Reports und Admin-UI zählen nicht als Lesertext. Ausklappbare Inhalte werden mitgeprüft. Dies ist ein Audit des erzeugten Produktions-HTML, kein erneuter Live-Crawl.

`PUBLIC_RENDERED` und `PUBLIC_METADATA` werden separat gespeichert. Die Quelldatei-Suche ist nur die Kandidatensuche; ein Schlüssel wie `externalEvidence` oder ein Statuswert `unknown` im Frontmatter ist kein Leak. Nicht gerenderte Markdown-Abschnitte, etwa bei Kategorie-, Hersteller- und Produktseiten, bleiben unverändert. Unsichere Zuordnung eines Source-Fragments begründet keine öffentliche Fundstelle; das vollständige gerenderte Dokument ist die maßgebliche Evidenz.

## Findings

- **3,066 öffentliche Kandidatentreffer**: 240 bestätigte Leak-Treffer, 41 Publikationsartefakt-Treffer, 12 Review-Fälle, 2,772 legitime Nutzungen und 1 Fehlalarm.
- Bestätigte Leaks betreffen **111 Seiten** und 112 unterschiedliche gerenderte Kontexttexte. Artefakte betreffen 7 Seiten, teilweise dieselben Seiten.
- Gezählt werden **Vorkommen**, nicht Artikel oder unabhängige Fehler: mehrfach verwendete Karten, Inhaltsverzeichnis-Einträge, Bild-Alt-Texte und Vergrößerungslabels zählen jeweils mit. Mehrere Suchbegriffe im selben Text können mehrere Treffer ergeben.
- Source-Inventar separat: 21,856 rohe Suchtreffer; 16,047 interne Vorkommen und 4,237 legitime Markdown-Syntax-Treffer. Sie werden nicht zu den öffentlichen Leak-Zahlen addiert.
- Nach Korrektur: **0 bestätigte Leaks, 0 Publikationsartefakte, 0 verbleibende systemische Leaks**.

## By type

| Typ | Seiten | Mit Kandidaten | Leaks | Review | Legitim | Artefakte |
| --- | --- | --- | --- | --- | --- | --- |
| guides | 76 | 76 | 100 | 0 | 440 | 5 |
| hubs | 9 | 9 | 17 | 0 | 76 | 0 |
| comparisons | 28 | 28 | 44 | 0 | 721 | 2 |
| products | 103 | 103 | 73 | 12 | 984 | 33 |
| manufacturers | 33 | 33 | 6 | 0 | 510 | 1 |
| other | 12 | 12 | 0 | 0 | 41 | 0 |
| shared UI/components (overlaps page rows) | 261 | 89 | 96 | 0 | 0 | 5 |

Die Zeile Shared UI überschneidet sich mit den Seitenzeilen; sie wird nicht zur Gesamtzahl addiert. Sie zählt die bestätigten wiederverwendeten Beschreibungstexte und Kurzfassungs-Artefakte. Gewöhnliche Navigationsbegriffe werden bei der jeweiligen Seite gezählt.

## Leak types und Ursachen

- **SEO/Content-Architektur:** Cornerstone, Cluster, Information Gain sowie Support-/Problem-/Evaluations-Intent. Sechs öffentliche Hub-Beschreibungen wurden über bestehende Discovery-Karten auf vielen Seiten wiederverwendet. Engste Korrektur: diese öffentlichen Beschreibungstexte, nicht die interne Cluster-Architektur ändern.
- **Evidenz/Implementierung:** `externalEvidence`, `evidenceSources`, `reviewCount`, Frontmatter, Repository, Content Registry sowie Research-constrained/constrained und `unknown` als Lesertext. Quellen, Einschränkungen und fehlende unabhängige Tests bleiben ausdrücklich benannt.
- **Workflow:** Audit-Status, Audit-Rückblick und Batch. Keine belastbaren öffentlichen Prompt-/ChatGPT-/LLM-Artefakte gefunden; keine Aussage über KI-Autorschaft.
- **Publikationsartefakte:** veraltete Furbo-Bildslot-/Platzhalter-Texte trotz vorhandener echter Bilder sowie fünf sichtbare Markdown-Fettdruck-Markierungen in einer automatisch erzeugten Ratgeber-Kurzfassung.
- **Systemische Korrektur:** Die Tabellenübernahme in `guideExperience/model.ts` verwendet nun den bestehenden Markdown-zu-Text-Schritt. Keine CSS-/Layout-Änderung und keine pauschale Bereinigung aller Texte zur Laufzeit.

## Changes und Beispiele

62 Implementierungsdateien geändert (57 Produktionsdateien und 5 QA-Dateien); 121 öffentliche Seiten mit veränderten Text-/Metadatenoberflächen. Die 57 Produktionsdateien umfassen: 55 Content-Dateien, eine öffentliche Seitenvorlage und ein gemeinsames View-Model. Dazu kommen die kleine QA-Erweiterung, deren Tests und die Einbindung in die bestehende Release-Preflight-Prüfung. Alle Einzeländerungen stehen in `changes.md` und `edits.json`.

1. `Information Gain: Wasser aus dem Futter berechnen` → `Wasser aus dem Futter berechnen`.
2. `Research-constrained: kein unabhängiger Fachtest gefunden. Kein eigener PfotenTechnik-Praxistest.` → `Kein unabhängiger Fachtest gefunden. Kein eigener PfotenTechnik-Praxistest.`
3. `… durch die unter externalEvidence und evidenceSources dokumentierten Quellen gedeckt …` → `… durch die angegebenen Quellen gedeckt …`.

Alte Überschriften-Fragmente bleiben als leere, ausgeblendete Sprungziele erreichbar. Das Inhaltsverzeichnis verwendet die bereinigten Überschriften. Interne Kommentare und Statusfelder bleiben bestehen. Die im Glossar entfernte Zählung von Inhaltsdateien war eine Beschreibung des Produktionsprozesses, keine fachliche Produkt-/Tierangabe.

## Konservativ nicht geändert

12 öffentliche Vorkommen von „Consensus“ bleiben `REVIEW_REQUIRED`: teils gewöhnlicher Quellenkonsens, teils möglicherweise interner Begriff. Die Beleggrenzen sind jeweils lesbar; allein die englische Wortwahl begründet keine bestätigte interne Zustandsausgabe. Keine automatische Umschreibung. Einzelstellen: `review-required.csv`.

„Modell“, „Status“, tierärztliche „Anweisung“, GPS-„Route“, technischer „Fallback“, „Freeze-dried“, externe Quellentitel und Affiliate-Provisionen sind legitime Nutzungen. „render“ innerhalb des deutschen Wortes „störender“ war ein ASCII-Wortgrenzen-Fehlalarm. Transparenz- und Affiliate-Hinweise bleiben erhalten.

## Validation

- Produktionsbuild: **PASS**, 375 Seiten; 260 indexierbare Canonicals und 260 Sitemap-URLs.
- Tests: **868/868 PASS**, einschließlich sieben neuer Reader-Language-Tests.
- Browsergeometrie: **160/160 PASS**, 20 Routen × vier Breiten (375/768/1024/1600) × Hell/Dunkel. Keine Screenshots; lediglich Text-/Plaintext-Korrekturen, kein materieller Layoutumbau.
- Bestehende Audits: **17/18 PASS**. Nur `price:audit:strict` scheitert weiterhin an den zwei schon zuvor fehlenden Affiliate-Zielen für Litter-Robot 5 Pro und Neakasa Riko. Diese bestehende Commerce-Ausnahme ist kein Ergebnis der Sprachkorrekturen.
- Alle Canonicals, Robots-Angaben, SEO-Titel/-Descriptions, Sitemap-URLs/lastmod, Redirect-Konfiguration und bisherigen Fragmentziele unverändert. 248 Content-Dateien auf geschützte Metadaten geprüft; 103 Produkt-Schemabewertungen unverändert.
- Schema: 103 syntaktisch gültige Produkt-/Review-Ausgaben, keine neuen semantischen Fehler. Die bestehenden 103 Textauswahl-Warnungen des Signal-Audits bleiben Warnungen.
- Produktdaten, Belege, Bild-Alt-Verträge, Kontrast, Responsive-Regeln und Performance-Audits bestehen.
- Interne Links: 16.901 Dokumentlink-Vorkommen, keine Variantenlinks, keine Orphans, keine unerreichbaren Seiten und keine Tiefe >3.

**Dokumentierte Folge der notwendigen Beschreibungskorrekturen:** Auf sechs Seiten wählt der bestehende textbasierte Discovery-Mechanismus jeweils ein anderes kontextuelles Weiterführungsziel; auf einer weiteren Seite ändert sich nur die Reihenfolge. Keine Link-/Ranking-Konfiguration oder Produktwertung wurde editiert. Die Zielwechsel gehen von weniger passenden Querverweisen zu vorhandenen Kategorie-Hubs. Vollständige Vorher-/Nachher-Liste: `validation/invariants.json`. Deshalb wird keine bytegleiche Linkliste behauptet. Alle Link-Gates bestehen.

Der erste Browserlauf wurde bei einer unbegrenzten Warteoperation abgebrochen. Nach begrenzter Wartezeit lief die gesamte Prüfung erfolgreich durch. Der unterbrochene Log bleibt als Diagnose erhalten.

## Severity

- P1: **6 verschiedene Quelltexte**, als 96 öffentliche Treffer ausgespielt: wiederverwendete interne Hub-Bezeichnungen.
- P2: **98 verschiedene Quellkontexte**, 185 öffentliche Treffer einschließlich Artefakte: isolierte Produktionsbegriffe, Evidenz-/Feldnamen und Formatierungsreste.
- P3: **0** bestätigte Stilkorrekturen. Gewöhnliche Formulierungen bleiben NO_CHANGE; Review-Fälle werden nicht künstlich hochgestuft.

## Decision gate

1. Interne SEO-Begriffe öffentlich? **YES**.
2. AI-/Prompt-/Workflow-Artefakte öffentlich? **YES für Workflow**, keine bestätigten AI-/Prompt-Artefakte.
3. Interne Evidence-/Lifecycle-/Datenmodell-Zustände öffentlich? **YES** für Evidence-/Datenmodell-Begriffe; die frühere Lifecycle-Owner-Korrektur bleibt intakt.
4. Publikationsartefakte gefunden? **YES**.
5. Systemische Rendering-/Mapping-Leaks gefunden? **YES**.
6. Bestätigte öffentliche Leaks übrig? **0**.
7. Fachliche Bedeutung unbeabsichtigt geändert? **NO**.
8. Breite redaktionelle Überarbeitung gerechtfertigt? **NO**.

**EDITORIAL LEAKAGE GATE: PASS**. Gilt für diese redaktionelle Closure mit offengelegter bestehender Commerce-Ausnahme, nicht als pauschale Freigabe des Preis-Gates oder Nachweis einer Live-Veröffentlichung.

## Next

Das neue gerenderte Sprach-Gate in der bestehenden Release-Preflight-Prüfung verbindlich beibehalten.
