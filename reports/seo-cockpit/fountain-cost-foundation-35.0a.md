# PFOTENTECHNIK 35.0A — FOUNTAIN COST DATA FOUNDATION

**COMPLETE — 35.0B READY: YES.** Foundation only; keine externe Produktrecherche, keine neuen realen Produktdaten, keine Veröffentlichung und keine sichtbare Produktänderung.

## ARCHITECTURE

- Existing systems reused: Astro-Produktcollection, `ProductContentData`, bestehende Preis-/Affiliate-/Availability-Schemas, `repairability.parts`, `evidenceSources`, Research-Importer und Produkt-/Release-Audits.
- Duplicate systems created: **0**.
- Schema extensions: optionale `consumables` und `consumablePolicy`; optionale ID/Name/Kompatibilität/Offers in bestehenden `repairability.parts`; fehlende strukturierte Betriebsangaben in bestehendem `comparisonData.fountain`.
- Commerce extensions: bestehende Schemas unverändert nach `commerce.mjs` ausgelagert und für mehrere Zubehörangebote wiederverwendet. Händler bleibt `price.source`, Affiliate bleibt `affiliate`. Kein zweiter Fetcher, Preisalgorithmus oder Merchant-Katalog.
- Evidence extensions: optionales `sourceType` in bestehender Quellenstruktur; exakte Feldpfade für neue bekannte Claims. Bestehender Research-Importer erhält Kategorien und Feldpfade. Keine zweite Quellenverwaltung.
- Kapazität, Material, kabelloser Betrieb und Garantie behalten ihre bisherigen Daten-Owner; keine synonymen Doppel-Felder. Ersatzpumpen bleiben in `repairability.parts`, nicht in einer parallelen `replacementParts`-Liste.

## CALCULATION

- Unit cost: `packPrice / packSize`.
- Annual fixed interval: `unitCost × 365 / days`.
- Annual interval range: Untergrenze mit `maxDays`, Obergrenze mit `minDays`.
- Reines Testbeispiel, kein recherchierter Produktwert: 19,99 € / 8 = 2,49875 €; bei 14–30 Tagen 30,401458…–65,145982… €/Jahr. Intern keine Zwischenrundung; Formatierung erst für Anzeige.
- Missing-data handling: `insufficientData` / null bei fehlendem oder nicht aktuellem Preis, Packungsgröße, Intervall, gewähltem Offer oder exakter Kompatibilität. Explizites `notApplicable` bleibt getrennt; ungültige Eingaben werden abgelehnt.
- Three-year preparation: Kaufpreis + dreifache verpflichtende Verbrauchskosten, nur bei ausdrücklich belegter vollständiger Verbrauchsteilliste. Gleiche Währung erforderlich.
- Replacement parts excluded from mandatory TCO: **YES**. Optionale Verbrauchsteile werden separat zurückgegeben; Ersatzpumpen niemals automatisch annualisiert.
- Projektion: amortisierter Verbrauch, keine Ganzpackungs-Kassenausgabe. Konstante Preise/Intervalle vorausgesetzt; Strom, Versand und Ausfallkosten ausgeschlossen und in Provenance benannt.

## DATA QUALITY

- Unknown distinguished from false: **YES**, über `known` mit Wert, `unknown`, `notApplicable`.
- Provenance supported: manufacturer, manual, officialStore, retailer, ownMeasurement, calculated, independentSource, aggregatedUserReports.
- Calculated provenance: Formel/Version, Eingabewerte, Produkt-/Item-/Offer-ID, Feldpfade, Preisquelle/-zeitpunkt und ursprüngliche Belege; keine manuelle Jahreskosten-Evidence erforderlich.
- Volatile prices separated: **YES**, stabile Pack-/Intervall-/Kompatibilitätsdaten getrennt von `offers[].price`, Berechnung nur zur Laufzeit.
- Proprietary dependency supported: erforderlich/optional getrennt von proprietär/generisch/unbekannt; offiziell möglicher filterloser Betrieb als belegter eigener Betriebsclaim. Kein Score oder Ranking.
- Ein filterloses Produkt impliziert nicht null Verbrauchskosten: andere Verbrauchsteile können weiterhin existieren. Null verpflichtender Verbrauch nur bei belegtem vollständigem Inventar.
- Keine dB-Messwerte erfunden oder aus subjektiven Geräuschangaben abgeleitet.

## FRONTEND

- Visible product changes: **0**.
- New CTAs: **0**. New affiliate links rendered: **0**. New URLs: **0**.
- Observation cohort changed: **0/15**; 34.6: **6/6 NO CHANGE**.
- ProductExperience2, sichtbare Specs, SEO-Copy, Schema.org-Ausgabe, Komponenten, Templates und Inhaltsdateien nicht geändert.
- 34.8-Messbaseline unverändert; Zeitfenster 07.09.–21.09.2026 nicht neu gestartet.

## RESEARCH READINESS

- Fountains found: **24**.
- P1: **8**; P2: **6**; P3: **10**.
- Products already containing useful filter data: **24** haben Text-/Spec-Kandidaten. Diese sind noch keine vollständigen strukturierten Kostendatensätze.
- Products requiring full cost research: **24**.
- P1 beruht auf originalen historischen GSC-Impressionen oder der bestehenden Beobachtungskohorte. P2: aktives und empfohlenes Produkt oder mindestens zwei bestehende Vergleichsreferenzen. P3: übrige Brunnen. Keine externe Recherche und keine neuen Rankingsignale angenommen.
- Pro Produkt gespeichert: Slug, Hersteller, Modell, vorhandene Betriebs-/Filter-/Ersatzteilangaben, Quellen, Produktangebot und Zubehörangebote, fehlende Fakten sowie nachvollziehbarer Prioritätsgrund.

## VALIDATION

- PfotenTechnik tests: **780/780 PASS**, davon 32 neue Foundation-Tests.
- Production Build: **PASS**, frischer Ausgangsbuild und Build mit finalen Schema-/Berechnungsänderungen.
- Release phases: **24/24 PASS**, inklusive Production HTTP Gate und der bereits für 34.8 akzeptierten maximal zwei HTTP-www-Hops.
- Schema: echte bestehende Produktcollection und alle vorhandenen Produktdateien getestet; keine Pflichtmigration. Synthetische neue Felder werden durch dieselbe Collection validiert.
- Commerce: mehrere Händler, bewusste Offer-Auswahl, Preisänderung, fehlende/stale/future Preise, Affiliate-Vertrag und Währungsabgleich getestet.
- Evidence: bekannte Claims benötigen genaue Feldquellen; Herstellerintervall und positiver filterloser Betrieb benötigen offizielle Belege. Calculated-only-Belege gelten nicht als Research-Nachweis.
- Regression: fester und variabler Intervall, Packungsgröße, Pflicht/Optional/Unknown/NotApplicable, 0-/Negativ-/ungültige Werte, Provenance, Ersatzteile ohne Preis und Rückwärtskompatibilität getestet.
- Page count: **372 → 372**, keine neue oder entfernte HTML-Route.
- Sitemap: **bytegleich** zum frischen Ausgangsbuild.
- Public HTML: **inhaltlich identisch**. Asset-URLs ausschließlich anhand der SHA-256-Werte der tatsächlich referenzierten Dateien verglichen; keine Texte, Links, Metadaten oder JSON-LD ausgeblendet. Einzelne Dateinamen gleicher Bildbytes variieren zwischen Builds.
- Observation cohort: **15/15 inhaltlich identisch**, zusätzlich alle Content-Dateien per Hash und Git-Diff unverändert.
- Fünf interne Admin-Seiten weisen vorhandene automatisch erzeugte Prüfzeitpunktänderungen auf. Diese sind separat dokumentiert; es wird keine pauschale Bytegleichheit aller 372 HTML-Dateien behauptet.
- New blockers: **0**.
- Pre-existing unrelated failures: bekannter Shared-Core-Syntaxfehler `packages/affiliate-core/src/linking/linkEngine.test.ts:126`; Datei gegenüber Batchstart per Hash unverändert. Nicht repariert, kein neuer 35.0A-Fehler.

## 35.0B READY

**YES.** Datenmodell, Commerce-/Evidence-Anbindung, Berechnung und QA stehen bereit. In 35.0B folgen belegte Produkt-/SKU-/Pack-Recherche, genaue Kompatibilität, Herstellerintervalle und aktuelle Angebote. 35.0A enthält ausschließlich synthetische Testdaten und bereits vorhandene Repository-Fakten.

## Deliverables

- [Architecture audit](fountain-cost-foundation-audit-35.0a.md)
- [Machine-readable final report](fountain-cost-foundation-35.0a.json)
- [Research readiness](fountain-research-readiness-35.0a.md) / [JSON](fountain-research-readiness-35.0a.json)
- [Validation and cohort hashes](fountain-cost-35.0a-evidence/validation.json)
- [HTML comparison](fountain-cost-35.0a-evidence/html-comparison.json)
- [Release evidence](fountain-cost-35.0a-evidence/release-preflight.json)
- [Model and calculation contract](../../apps/pfotentechnik/docs/data/consumable-cost-foundation.md)
