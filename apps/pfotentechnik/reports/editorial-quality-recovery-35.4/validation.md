# Validierung 35.4

Finaler Stand: 02.11.2026. Die Prüfungen beziehen sich auf den lokalen Production Build. Es wurde keine neue Version veröffentlicht.

| Prüfung | Ergebnis / Evidenz |
| --- | --- |
| Vollständiger Production Build | **PASS**, 374 HTML-Seiten; `logs/build-final.txt` |
| Gesamte Testsuite | **PASS**, 991/991, null fehlgeschlagen/übersprungen; `logs/tests-final.txt` |
| Bestehender Content-Quality-Core, unveränderte Konfiguration | **PASS**, 374 Dokumente, 259 öffentlich, null Fehler/Warnungen, null Exact-/Near-Duplikate; `content-audit.json` |
| Editorial-Lint | **0 Fehler**, 232 Warnungen gegenüber 238 zuvor; keine neuen Warnungsregeln/Anzahlen je Datei, sechs Bestandswarnungen entfallen; `logs/lint-before.txt`, `logs/lint-after.txt` |
| Strikte URL-/Canonical-Prüfung | **PASS**, 259 öffentliche und 115 Noindex-/Admin-Dokumente, null Fehler/Warnungen; `logs/canonical.txt` |
| Sitemap gegen Canonicals und Build | **PASS**, exakt unveränderte 259 URLs, alle vorhandenen öffentlichen Ziele in der Sitemap, keine Canonical-/Sitemap-Widersprüche; `snapshot.json`, `source-invariants.json` |
| Strikte interne Linkziele | **PASS**, 374 Seiten, null Fehler/Warnungen; `logs/links.txt` |
| Linkgraph | **PASS**, keine verwaisten/unerreichbaren öffentlichen URLs, keine gebrochenen Dokumentlinks, keine internen Alias-Verweise; `snapshot.json` |
| Technischer Source-/Build-SEO-Audit | **PASS**; `logs/technical.txt` |
| Vergleichs-Schema | **PASS**, 28 Seiten und 28 ItemLists; keine unvollständigen Product-Snippets; `logs/schema.txt` |
| Redaktionelle Transparenz | **PASS**, Prüfart und Datengrundlage auf allen 103 Produktseiten; `logs/transparency.txt` |
| Ranking-Regressionen | **PASS**, alle aktuellen Tests plus identische Kandidatenlisten und Finalistenreihenfolge aller 28 Vergleiche; `source-invariants.json`, `render-invariants.json` |
| Preise, Verfügbarkeit, Scores | **PASS**, geschützte Felder aller 103 Produkte unverändert. Neun redaktionelle experience-Blöcke und ein Quellenbeleg sind gezielt geändert; keine technischen Produktmerkmale oder Bewertungsmethodik geändert. |
| Offers, Review und Affiliate-Ziele | **PASS**, Vorher-/Nachher-Abgleich aller 259 öffentlichen HTML-Dokumente: Offers, Review-Markup und Reihenfolge/Targets gesponserter Links unverändert; `render-invariants.json` |
| Tatsächliche Ausgabe der Verbesserungen | **PASS**, 41/41 mit erwartetem Inhalt im finalen HTML; `rendered-edit-evidence.json` |
| Mobile/Desktop, Hell/Dunkel | **PASS**, 20/20 Chrome-Prüfungen, null horizontaler Überlauf über Toleranz, keine defekten geladenen Bilder, jeweils eine H1; `visual-checks.json` |
| Visuelle Sichtung | Mobile Stichproben von verändertem Produkt-Nutzungsabschnitt, Vergleichstabelle, medizinischem Artikel und Herstellerprofil gesichtet; Bilder unter `visual/`. Details für die Prüfung geöffnet; keine Layout-/Theme-/CTA-Komponenten verändert. |
| Veröffentlichungs-/Aktualisierungsdaten | **PASS**, vorhandene Daten erhalten; Abrufdaten neuer Quellen separat dokumentiert |
| Git-Diff | `git diff --check` **PASS**; auf konkrete Texte, gemeinsame Vergleichsbeschriftung und Auditbelege begrenzt |

## Ein ausdrücklich nicht bestandener Alt-Audit

`node ../../scripts/audit-recommendation-engine-4.mjs` aus dem App-Verzeichnis liefert weiterhin Exit 1, weil die Marker `buildMoneyPageNextSteps` und `buildManufacturerNextSteps` fehlen. Die beiden betroffenen Routendateien sind gegenüber HEAD unverändert; die Marker fehlen bereits dort. **Keine neue Regression.** Die alte Prüfung wurde nicht abgeschwächt oder durch einen erfolgreichen Status ersetzt. [Baseline-Nachweis](legacy-audit-baseline.json), [Originalausgabe](logs/ranking.txt).

## Umfang der redaktionellen Evidenzprüfung

Neue oder korrigierte Aussagen wurden gegen konkrete Primärquellen beziehungsweise vorhandene modellbezogene Daten geprüft. Unbelegtes Käuferlob wurde entfernt, nicht durch neue Erfahrungen ersetzt. Die 378 Paarvergleiche verwenden Produktüberschneidung und die bestehende `textSimilarity` auf Markdown-Haupttexten; sie sind Kandidatensignale. Ein nicht deklarierter Quell-Sieger wird nicht als gleicher Sieger zweier Vergleiche gezählt. Redaktionelle Schlussfolgerungen stehen in `overlap-analysis.md`.

Der Content-Audit kann fehlende praktische Evidenz und semantische Überschneidungen nicht abschließend beurteilen. Bestandshinweise zu Varianten, Garantie, regionaler App-Unterstützung und fehlenden unabhängigen Tests bleiben deshalb sichtbar. Eine rechtliche oder veterinärmedizinische Zertifizierung sämtlicher Inhalte wird nicht behauptet.

## Reproduktion

Ab Repository-Wurzel; Build und darauf angewiesene Tests sequenziell ausführen:

```sh
npm run build:pfotentechnik
npm --workspace apps/pfotentechnik test
node apps/pfotentechnik/scripts/seo/audit-url-consistency.mjs --strict
node apps/pfotentechnik/scripts/audit-internal-link-targets.mjs --strict
node apps/pfotentechnik/scripts/seo/audit-week4-technical-seo.mjs
node apps/pfotentechnik/scripts/seo/audit-comparison-product-schema.mjs
node apps/pfotentechnik/scripts/audit-editorial-transparency.mjs
node apps/pfotentechnik/scripts/seo/audit-production-baseline.mjs --recovery --coverage apps/pfotentechnik/reports/editorial-quality-recovery-35.4/coverage-input.json --observed-at 2026-11-02 --previous apps/pfotentechnik/reports/google-index-recovery-35.3/snapshot.json --out /tmp/pfotentechnik-editorial-recovery-repeat
git diff --check
```

Für die Content-Quality-Bewertung wurde die bestehende Funktion `collectContentQuality` mit `scripts/content-quality/config.json` verwendet; keine Schwellwerte verändert. Der bestehende CLI-Aufruf `npm --workspace apps/pfotentechnik run audit:content-quality` führt dieselbe Bewertung aus und aktualisiert zusätzlich seine üblichen generierten Bestandsberichte.

Die visuellen Stichproben verwendeten lokales Chrome mit temporärem Profil und Produktions-HTML: Akku- und Edelstahlvergleich, akuter Durst-Ratgeber, One-RFID-Produkt und Xiaomi-Profil, jeweils 390/1366 Pixel und Hell/Dunkel. Der vorhandene Electron-Wrapper war wegen fehlender Installationsdateien nicht verwendbar; Abhängigkeiten wurden dafür nicht verändert.
