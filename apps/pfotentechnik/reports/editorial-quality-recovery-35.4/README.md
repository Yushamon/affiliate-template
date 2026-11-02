# Editorial Quality Recovery 35.4

**02.11.2026 · 259 öffentliche Canonicals gesichtet, 41 gezielt verbessert, 218 unverändert.** Die 169 Canonicals aus den negativen GSC-Gruppen sind vollständig priorisiert. Die Ursache ihrer Nichtindexierung bleibt unbekannt.

| Seitentyp | Geprüft | Geändert |
| --- | ---: | ---: |
| Produkte | 103 | 9 |
| Vergleiche | 28 | 15 |
| Ratgeber | 76 | 3 |
| Haupt-Hubs | 6 | 1 |
| Hersteller | 33 | 13 |
| Sonstiges | 13 | 0 |
| **Gesamt** | **259** | **41** |

Die Sichtung berücksichtigt Aufgabe, Abgrenzung, fachliche Datengrundlage, Entscheidungskriterien, Glaubwürdigkeit und Nutzerführung. Quellen wurden gezielt für neue oder korrigierte Aussagen geprüft. Sie ist **kein vollständiger neuer externer Faktencheck jeder bestehenden Behauptung**, kein veterinärmedizinisches Fachlektorat und kein eigener Produkttest. Die Inventur dokumentiert auch Grenzen und offene Recherche, statt aus technischen Merkmalen eine pauschale Qualitätsnote abzuleiten.

## Konkreter Qualitätsgewinn

- Sieben austauschbare Vergleichseinstiege durch konkrete Auswahl- und Ausschlussregeln ersetzt; allgemeine Wiederholungen gekürzt.
- Sechs automatische Gesamt-Superlative als Vorauswahl eingeordnet. Im GPS-Akkuvergleich Herstellermaximum, passende Betriebsart und unveränderte Finalisten klar getrennt.
- Neun Produktseiten mit tatsächlich gerenderten, produktspezifischen Nutzungsgrenzen konkretisiert. Beispiel: One RFID koppelt nur einen Anhänger pro Gerät; eine zentrale Mehrkatzenstation entsteht daraus nicht.
- Neun Herstellerprofile von unbelegtem Käuferlob und allgemeinen Support-/Zuverlässigkeitsurteilen bereinigt; vier weitere Profile beschreiben nun Modellrollen statt interner Integrationsbegriffe.
- Akuten Durst und längerfristige Trinkbeobachtung voneinander abgegrenzt. Pauschale Wartefristen und unpräzise Wirkungszusagen in den bearbeiteten Gesundheits-/Verhaltensabschnitten entfernt.
- Den 31/32-g-Widerspruch zum CAT 6 Mini im Kleinformatvergleich und in der Hub-FAQ korrigiert. Beim Hub betrifft die Korrektur die ausgegebenen FAQ-Strukturdaten, nicht einen neu eingefügten sichtbaren Textblock.

Alle 41 Bearbeitungen sind im finalen HTML nachgewiesen: [Renderbelege](rendered-edit-evidence.json). Die Produktverbesserungen verwenden die vorhandenen `experience`-Felder; ungenutzte Markdown-Erweiterungen wurden nicht als Verbesserung gezählt.

## Vollständige Inventur und GSC-Abgleich

[quality-inventory.csv](quality-inventory.csv) enthält **eine Zeile je öffentlicher Canonical**, mit Seitentyp, exaktem GSC-Status, Cluster, Aufgabe, Kriterienbewertung, Befund, Priorität, Maßnahme, Änderung, Quellenstatus und offenen Risiken. [JSON-Fassung](quality-inventory.json), [Zusammenfassung](summary.json).

| Beobachtung | Roh-Export-URLs | Exakte aktuelle Canonicals | Getrennte Varianten |
| --- | ---: | ---: | ---: |
| Indexiert | 95 | 90 | 5 |
| Gecrawlt, nicht indexiert | 105 | 91 | 14 |
| Gefunden, nicht indexiert | 78 | 78 | 0 |
| **Gesamt** | **278** | **259** | **19** |

Die 14 negativen Varianten sind die bereits geprüften Weiterleitungen aus 35.3. Der positive Export enthält zusätzlich `/futterautomat-berater/`, zwei alte Vergleichsrouten und zwei www-URLs. Ihre positiven Beobachtungen wurden **nicht** auf die Ziel-Canonicals übertragen. Damit sind alle 259 Canonicals hier durch eine exakte Export-URL belegt: 90 Indexiert, 91 Crawled, 78 Discovered; keine Konflikte. Das ist eine historische Exportzuordnung, kein aktueller Google-Livetest nach der Überarbeitung.

Die Originale liegen unter [inputs](inputs/), mit [Prüfsummen und Herkunft](input-manifest.json) sowie [Import](coverage-input.json). Der positive Export hat kein `Problem`-Metadatenfeld; `Indexiert` wurde entsprechend dem vom Nutzer bezeichneten 95er-Export aus `Coverage-Valid` explizit importiert. Der Status wurde nicht aus HTTP oder fehlenden Ausschlusszeilen abgeleitet. Das Indexierungsdiagramm reicht vom 05.08.2026 mit 196 bis zum 23.10.2026 mit 95 Seiten; dies bestätigt keine Verarbeitung der heutigen Änderungen.

## Berichte

- [changes.md](changes.md): Problem, Änderung, Nutzen, Evidenz und Datei für jede bearbeitete Canonical.
- [overlap-analysis.md](overlap-analysis.md): eigenständige Aufgaben, Verbesserungen und Konsolidierungsempfehlung; [alle 378 Vergleichspaare](comparison-overlaps.csv).
- [remaining-issues.md](remaining-issues.md): offene Produkt-/Quellenfragen, Score-/Intent-Review, Alt-Audit und spätere Veröffentlichungsreihenfolge.
- [competitive-review.md](competitive-review.md): aktuelle Suchergebnis-Stichprobe und konkrete Gegenprüfung, ohne fremde Texte oder Messwerte zu übernehmen.
- [evidence-ledger.csv](evidence-ledger.csv): Änderungen mit Bestandsbeleg oder konkret abgerufener Primärquelle.
- [validation.md](validation.md): vollständige Ergebnisse, Vorher-/Nachher-Abgleich und Reproduktion.

Der Build, alle **991 Tests**, Content-Quality, Canonicals, Sitemap, interne Links, Schema und 20 Browser-Stichproben bestehen. Der alte Recommendation-Engine-4.0-Marker-Audit meldet weiterhin zwei nachweislich unveränderte Bestandsprobleme; dies ist ausdrücklich dokumentiert.

Scores, Rankingregeln, Finalistenreihenfolge, Produktmerkmale, Preise, Verfügbarkeit und gesponserte Linkziele wurden erhalten. Keine neuen Pflichtfelder, URLs, Canonicals, Weiterleitungen oder Veröffentlichungsdaten. Keine Veröffentlichung, kein Deployment, kein Push und kein Indexierungsantrag.
