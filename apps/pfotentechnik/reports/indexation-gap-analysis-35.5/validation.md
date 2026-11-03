# 35.5 – Validierung

Abschluss: 03.11.2026. Ausgangscommit `fda89099`. Keine Veröffentlichung, kein Push, kein Deployment, keine automatischen Indexierungsanträge.

## Build und vollständige Tests

| Prüfung | Ergebnis | Beleg |
| --- | --- | --- |
| Production Build | **374 Seiten**, erfolgreich | `logs/build.log` |
| Gesamte App-Testsuite | **1.005 bestanden**, 0 fehlgeschlagen/übersprungen | `logs/app-tests.log` |
| Shared-Core-Testsuite | **26 bestanden**, 0 fehlgeschlagen | `logs/core-tests.log` |
| Content-Quality strikt | **259 indexierbare**, 0 harte Fehler, 0 Warnungen | `logs/content-quality.log` |
| URL-/Canonical-Konsistenz strikt | **259 indexierbar**, 115 noindex/Admin; 0 Fehler, 0 Warnungen | `logs/url-consistency.log` |
| Build-Output-SEO strikt | **0 Fehler, 0 Warnungen** | `logs/build-output.log` |
| Interne Linkziele strikt | **374 Seiten**, 0 Fehler, 0 Warnungen | `logs/internal-targets.log` |
| Redaktionelle interne Links strikt | **248 Dokumente**, 0 Fehler, neun Hinweise, 0 strict-kritisch | `logs/internal-links.log` |
| Vergleichs-Schema | **28 Vergleiche / ItemLists**, keine unvollständigen Product-Snippets | `logs/comparison-schema.log` |
| Transparenz / Affiliate-Trennung | **bestanden**, 103 Produktseiten mit Prüfart/Nachweisbasis | `logs/editorial-transparency.log` |
| Editorial Lint strikt | **nicht grün**: 0 Fehler, 231 Bestandswarnungen; Ausgangsstand 232, keine neue Warnungsregel/-anzahl je Datei | `logs/editorial-lint*.log`, `editorial-lint-regression.json` |

Der strenge Linter wird nicht als bestanden ausgegeben, weil sein Strict-Modus schon bei Warnungen fehlschlägt. Die unveränderte Regelversion wurde gegen die Originaldateien des Ausgangscommits in einem isolierten temporären Verzeichnis ausgeführt: ebenfalls Exit 1, 0 Fehler, 232 Warnungen. Die verbleibenden Warnungen wurden nicht durch pauschale Textverlängerung oder Kontrollseitenänderungen „repariert“.

Ein früher Validierungsversuch lief noch während des Aufbaus des dist-Verzeichnisses und traf fehlende Dateien; diese Ausführung ist kein Produktfehler und kein PASS-Beleg. Nach vollständig abgeschlossenem Build wurden die oben ausgewiesenen vollständigen Suites ausgeführt. Ein zunächst falsch eingerückter Provenienzeintrag wurde vor dem erfolgreichen Build korrigiert. Die finale Quellinvariantenprüfung schließt unbeabsichtigte Änderungen an Offers/Preisen ausdrücklich aus.

## Scope, Scores, Affiliate und Kontrollgruppe

- **Genau zehn Quelldateien geändert**, ausschließlich die zuvor zugelosten Testseiten: fünf Produkte, fünf Ratgeber. Alle anderen zuvor getrackten Dateien sind nach dem Archivieren/Zurücksetzen generierter Standardreports wieder auf ihrem ursprünglichen Hash. `final-scope-check.json`.
- **248 Contentdateien** gegen die gesicherte Baseline geprüft. Bei Produkt-Testseiten nur vorhandene experience-Copy plus Quellenregistry geändert; bei Ratgeber-Testseiten nur Body. Alle übrigen Metadaten byte-/wertgleich: Slugs, Canonicals, Veröffentlichungs-/Aktualisierungsdaten, technische Daten, Preise/Offers/Verfügbarkeit, Score-/Rankingkriterien und Affiliatefelder. `source-invariants.json`.
- **259 finale Hauptinhalte** verglichen: genau zehn verändert, alle zehn Testseiten sichtbar verbessert, alle zehn Kontroll-Haupttexte unverändert. Sämtliche neuen eigentlichen Textpassagen sind im gerenderten Hauptinhalt nachgewiesen. Das nicht ausgegebene Methodikfeld wurde wiederhergestellt und nicht als sichtbare Verbesserung gezählt. `scope-and-render-validation.json`.
- **Zehn Kontrollquellen hashgleich.** Sechs Kontroll-HTMLs roh bytegleich, die übrigen 4 unterscheiden sich ausschließlich durch deduplizierte Namen/Resize-Cachepfade für identische Originalbilder. Nach eng begrenzter Hero-/Comparison-/Thumbnail-Aliasnormalisierung sind alle zehn Kontroll-DOMs gleich. Ursprüngliche Bildhashes, Dimensionen, Texte, Linkziele und Schema bleiben überprüft; keine Bilddatei geändert. `build-image-alias-evidence.json`.
- **259 Canonical-/Robots-Signale**, gesponserte Linkziele und Reihenfolge, Offers, Review- und AggregateRating-JSON-LD unverändert. Alle JSON-LD-Blöcke im Panel/in der Grundgesamtheit geparst, keine neue ungültige Syntax. Kein Review-Score geändert.
- **Sitemap exakt 259** erwartete Canonicals, keine fehlenden/unerwarteten Ziele. `sitemap-validation.json`.
- Keine neuen exakten Haupttextduplikate. Für die 2.535 vom Eingriff betroffenen Paare keine neu hinzugekommenen 5-Gramm-Jaccardwerte ab 0,8; höchster betroffener Wert etwa 0,371. Das ist eine lexikalische Regression, kein automatischer Nachweis semantischer Einzigartigkeit. `duplicate-regression.json`.

Die bereits im Ausgangscommit enthaltenen 35.4-/35.3B-Arbeiten und deren Berichte sind erhalten. 18 durch Build/Audits neu erzeugte Standardreports wurden hier als Evidenz archiviert und anschließend auf ihren Ausgangsstand zurückgesetzt. Keine weiteren Source-/Konfigurationsänderungen. Die eingehenden kontextuellen Quellmengen aller 20 Experimentseiten sind im finalen HTML identisch zur Baseline (`panel-link-validation.json`).

## Mobile, Desktop, Dark Mode

Chrome prüfte alle zehn Testseiten bei **360, 390 und 1.366 px**, jeweils Light/Dark: **60/60 bestanden**. Nach der letzten Autolink-Isolierung wurde der Funktionsratgeber zusätzlich in allen sechs Kombinationen erneut geprüft: **6/6 bestanden**, `visual-followup/results.json`. Jeweils genau eine H1, kein horizontaler Overflow über der Zwei-Pixel-Toleranz, keine neu defekten Bilder, erwarteter Theme-Modus. Keine CSS-/Templateänderung. `visual/results.json`.

Zusätzliche Sichtstichproben der 390-px-Aufnahmen: C200 im Dark Mode zeigt die neue Timer-/Futterhaltbarkeitsabgrenzung lesbar; der Hunde-Ratgeber im Light Mode trennt angenommene Beispielwerte sichtbar von echten Messungen und stellt die Tabelle ohne neuen Seitenoverflow dar. Die übrigen Seiten sind durch automatisierte Viewportmetriken und gespeicherte lokale Aufnahmen abgedeckt, nicht durch behauptete pixelgenaue manuelle Prüfung jeder Ansicht.

Bildaufnahmen sind entsprechend der vorhandenen Repository-Regel lokale, ignorierte QA-Artefakte. Versionierbare Messwerte und das reproduzierbare Chrome-Skript bleiben im Bericht. Der lokale Prüfserver wurde nach der Kontrolle beendet.

## Messbarkeit und Datenintegrität

- Vollständige Matrix: **259 URLs, 86 Spalten** einschließlich Grunddaten, Inhaltsscreening, Quellenregistry, Graph, Historie und technischer Kontrollen. Exakte GSC-Gruppen **90 / 91 / 78** erhalten. Keine HTTP-basierte Indexierungszuordnung.
- 33.411 bereinigte lexikalische Paare; 91 gecrawlte Seiten mit sechs textgestützten Prüffragen dokumentiert. Kandidatenmerkmale sind keine Qualitätsnoten; manuelle Gegenprüfungen ausdrücklich getrennt.
- Historische Performance: **25 verifizierte Dashboardstände plus zwei Original-ZIPs**, 10.320 passende Beobachtungen für 122 heutige Canonicals. Überlappende Fenster und hostlose Pfade getrennt, keine Summierung zu scheinpräzisen Gesamtwerten und kein Coverage-Status daraus.
- Matching/Zufallszuteilung mit festem Seed reproduziert: **zehn gleiche Paare/gleiche Zuordnung**, Auswahl-Lock nicht überschrieben. Quellenkorrektur zum Catit-URLslug einschließlich ursprünglichem Lock erhalten. `selection-reproduction-check.json`.
- Baseline umfasst **20 feste URLs**, Messvorlage **100 URL-/Zeitpunktzeilen** für T0/7/14/28/56. Aktuelle GSC-Felder bleiben mangels Zugriff offen.
- Monitoring-Evaluator: **sechs synthetische Selbsttests bestanden**, darunter vollständige Gleichheit, Test-/Kontrollvorteil, fehlender Endpunkt und unbekannte URLidentität. Die echte leere Messvorlage ergibt `ready: false`, keine erfundene Recovery. `monitoring-evaluator-self-test.json`, `monitoring-dry-run.json`.
- `git diff --check` ist Bestandteil der Abschlusskontrolle. Originalbelege, Baselinearchive und SHA-Manifest liegen im Berichtsordner; sensible Authentifizierungsdaten wurden nicht exportiert.
