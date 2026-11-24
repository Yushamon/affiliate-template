# Google Deindexation Forensics 35.7

**Entscheidung E: Ursache mit verfügbaren Daten nicht ausreichend bestimmbar.** Neue Ergebnisse grenzen die Sichtbarkeitslücke ein und belegen präzise, welche URL-Verlaufsdaten fehlen. Kein allgemeiner SEO-Audit wiederholt und keine Websiteänderung aus dieser Analyse.

## Zehn zentrale Erkenntnisse

1. Beide Original-ZIPs vorhanden. Die acht Index-Meilensteine und Ausschlussgründe stimmen: 192→70, minus 122 beziehungsweise 63,54 %. Der Coverage-Stichtag ist **16.11.**, nicht der Exporttag 23.11.
2. Die aktuelle öffentliche Sitemap enthält **269 Canonicals**, alle früheren 259 plus zehn neue. 70/269 wäre keine belastbare Canonical-Indexierungsquote, weil 70 eine andere URL-Gesamtheit zählt.
3. **Null individuell nachweisbare aktuell deindexierte Canonicals** in den verfügbaren Verlaufsdaten, nicht „keine Deindexierungen“. Aktueller URL-Status fehlt bei allen 269; kein funktionsfähiger konfigurierter GSC-API-Zugang. Gruppe A/B/C deshalb aktuell unbestimmbar, ausdrücklich Gruppe U in der Matrix.
4. 11 heutige Canonicals wechselten zwischen den beiden älteren Exporten negativ→positiv. Kein älterer positiver Vorher-/aktueller negativer Nachherbefund identifiziert eine Verlust-URL. Die leere Verlustdatei ist beabsichtigt.
5. 57 Alternativen und 80 Weiterleitungen sind Ausschluss**bestände**, keine 137 verlorenen Inhalte. Kein konkreter Teilbetrag der 122 ist historischer Bereinigung oder aktuellem Inhaltsverlust URL-genau zuzuweisen; das bedeutet keine bewiesene Nullwirkung. Fünf historisch positive Varianten sind bekannt, aktueller Status unbekannt.
6. Performance verifiziert: **79 Property-Impressionen, null Klicks**, dagegen 171 Seitenimpressionen auf 52 URLs und 19 Impressionen in sieben offengelegten Queries. Unterschiedliche Aggregationen und Queryunterdrückung getrennt erklärt; nichts addiert.
7. **36/90 historisch positive heutige Seiten** haben eine exportierte Seitenzeile (147 Seitenimpressionen), 54 keine. Heutige positive Seiten lassen sich damit nicht identifizieren. In den letzten 28 Exporttagen gibt es nur 13 Property-Impressionen.
8. Nur 23/79 Property-Impressionen stammen aus Deutschland, 27 aus den USA. 18/19 offengelegte Query-Impressionen liegen in Queryzeilen mit mittlerer Position 47,18–92. Geringe deutsche Exposition und schwache Positionen sind eingegrenzt; ihre Ursache bleibt offen.
9. Kein neuer technischer Blocker, kein kausaler Qualitäts-/Strukturfaktor und kein externer Linkmangel nachgewiesen. A/B-Kohortenvergleich ohne aktuelle URL-Statusdaten wäre Scheingenauigkeit; alte 35.5-Merkmale bleiben unverändert verfügbar.
10. 35.5 ist laut Nutzer veröffentlicht, exaktes T0 und aktuelle URL-Messungen fehlen aber im Archiv. Noch kein 56-Tage-Endpunkt und keine Recoverybehauptung. Maximal fünf gezielte Daten-/Monitoringmaßnahmen, kein neuer Content-Rollout.

## Experimentzwischenstand

- treatment: 10 Seiten; 1 mit neuer exportierter Performancezeile, 1 Seitenimpressionen im **gesamten** 22.08.–21.11.-Fenster. Aktueller Google-Status aller zehn unbekannt.
- control: 10 Seiten; 0 mit neuer exportierter Performancezeile, 0 Seitenimpressionen im **gesamten** 22.08.–21.11.-Fenster. Aktueller Google-Status aller zehn unbekannt.

Die Fenster beginnen vor dem Experiment. Die Impressionen sind deshalb kein Nachherergebnis. Zehn Paare und Gruppenzuordnung bleiben erhalten. Die separat beauftragten Commerce-Preis-/Datumsupdates vom 23.11. sind als weiteres Ereignis zu erfassen.

## Entscheidungsvorlage: 13 Antworten

1. **Welche aktuellen URLs verloren?** Keine individuell nachweisbar; fehlende Nachher-Statusdaten. `deindexed-canonicals.csv` hat null Datenzeilen.
2. **Wie viele verlorene historische Pfade?** Nicht bestimmbar; fünf historisch positive Varianten bekannt, davon drei Migrationsaltpfade. Nicht mit 63 bekannten historischen/alternativen Identitäten verwechseln.
3. **Welcher Anteil der 122 erklärt?** Kein konkreter Teilbetrag durch identifizierte Übergänge zuweisbar. Bedingte Mengenschranke und ihre Grenzen in `indexation-cohorts.md`; kein Null-Prozent-Ursachenurteil.
4. **Unterschiede verlorener gegen indexierte?** Mit aktuellen A/B-Gruppen nicht berechenbar; alte Alters-/Linkbefunde nicht neu als Deindexierungsursache ausgegeben.
5. **Hypothesen bestätigt/widerlegt?** Aggregatrückgang und geringe Exposition bestätigt. H8 enger eingegrenzt; keine neue kausale Bestätigung der übrigen Hypothesen. H1 erklärt nicht nachweislich den gesamten Rückgang.
6. **Welche aktuell positiven URLs mit Impressionen?** Unbekannt. Alle 36 historisch positiven mit Seitenzeile sind in `search-visibility.md` aufgeführt, übrige Zuordnungen in der CSV.
7. **Warum geringe Sichtbarkeit?** Belegt sind wenige Sichtkontakte, geringe deutsche Exposition und schwache offengelegte Querypositionen; Googles Auswahl-/Rankingursache bleibt unbekannt.
8. **Rolle der Migration?** Historische technische Fehler belegt, mögliche Teil-/Nachwirkung; keine neue URL-Verlustquantifizierung.
9. **Neue technische Hinweise?** Keine neuen individuellen Google-Befunde gegen frühere technische Freigaben; Sitemap-Inventur erfolgreich. Keine aktuelle Indexierbarkeit aus Sitemap/HTTP abgeleitet.
10. **Experiment?** Früher Zwischenstand mit unbekannten aktuellen Endpunkten/T0, kein Erfolg/Misserfolg.
11. **Fehlende Daten?** Aktuelle URL-Listen/Inspection, historische positive URL-Snapshots vor August/Septemberverlusten, Google-Canonical-/Crawlverläufe, präziser Deploymentbeleg, Seite×Query×Land und externe Linkzeitreihe.
12. **Welche Maßnahmen?** Kleines 33er-Inspectionpanel, sieben Vergleichsseiten mit deutscher Performance verbinden, Experimentanker vervollständigen, Migrationsübergänge belegen, vorhandene externe Linkexporte ergänzen. Details, Aufwand, Risiko und Erfolgsmaß je Maßnahme in `recovery-actions.md`.
13. **Was unterlassen?** Pauschale Content-/Titel-/URL-/Scoreänderungen, neue Experimente, künstliche Links, automatische Indexierungsanträge und Veröffentlichungen. Preis-/Affiliateänderungen sind keine Maßnahme dieses SEO-Auftrags.

## Dateien

[data-inventory.md](data-inventory.md) · [historical-indexation.csv](historical-indexation.csv) · [deindexed-canonicals.csv](deindexed-canonicals.csv) · [indexation-cohorts.md](indexation-cohorts.md) · [search-visibility.md](search-visibility.md) · [hypothesis-evaluation.md](hypothesis-evaluation.md) · [recovery-actions.md](recovery-actions.md) · [monitoring-plan.md](monitoring-plan.md) · [validation.md](validation.md).

Abbruchregel eingehalten: Fehlende Übergangsdaten werden nicht durch spekulative SEO-Analysen ersetzt. Erfolgskriterium C/D erfüllt: neue Sichtbarkeitseingrenzung und konkrete Nachweislücke. Kein Push, Deployment oder Indexierungsantrag.
