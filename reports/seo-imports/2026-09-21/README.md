# SEO-Import vom 21.09.2026

Die beiden unveränderten Originalexporte liegen in diesem Verzeichnis. Die sechs Dashboarddateien unter `apps/pfotentechnik/src/data/seo/` und die Search-Berichte wurden damit aktualisiert.

| Ansicht | 28-Tage-Zeitraum | Klicks | Impressionen | CTR |
|---|---|---:|---:|---:|
| Google | 22.08.–18.09.2026 | 0 | 43 | 0 % |
| Bing | 23.08.–19.09.2026 | 20 | 487 | 4,11 % |
| Combined | 22.08.–18.09.2026 | 19 | 514 | 3,70 % |

- 7- und 28-Tage-Metriken wurden aus den tatsächlichen Tageswerten berechnet; CTR aus Klicks/Impressionen, Google-Position impressionsgewichtet.
- Google liefert Seiten und Suchanfragen nur für den gesamten 28-Tage-Zeitraum. Für 7 Tage werden keine Dimensionswerte aus einem anderen Zeitraum übernommen.
- Bing liefert ausschließlich Tageswerte. Fehlende Positionen bleiben `null`; Seiten, Suchanfragen und Crawl-Daten bleiben leer und werden als fehlend gekennzeichnet.
- Combined verwendet bei beiden Providern denselben Zeitraum bis 18.09.2026. Der zusätzliche Bing-Tag 19.09. bleibt im Bing-Dashboard verfügbar. Positions-, Seiten- und Suchanfragewerte in Combined stammen ausschließlich von Google. Provider-Sichtbarkeitsvergleiche sind deaktiviert.
- Ein 7-Tage-Vergleich ist aus beiden Exporten möglich. Der vorherige 28-Tage-Zeitraum ist nur bei Bing vollständig verfügbar. Bei Google und Combined bleiben Vergleichsmetriken für 28 Tage `null`.
- Die bisherigen 3-, 6- und 12-Monatsansichten bleiben als historische API-Daten vom 15.09.2026 erhalten und sind entsprechend gekennzeichnet. Der neue Export reicht nicht aus, um diese Zeiträume vollständig neu zu berechnen.
- Aktive Standardansicht: 28 Tage, passend zum vollständigen Google-Export.

## Merge-Auflösung

56 Produktdateien enthielten ausschließlich Konflikte bei Preiswerten und Prüfzeitpunkten. In jedem Konfliktblock wurde die neuere Preisprüfung vom 21.09.2026 statt der Prüfung vom 15.09.2026 übernommen. Automatisch zusammengeführte Änderungen außerhalb dieser Blöcke bleiben erhalten.

## Validierung

- Search-Plattform: 32 Tests erfolgreich.
- Tagesanzahl, Datumsgrenzen, Klick-/Impressionssummen und Übereinstimmung der aktiven Einzelansichten mit den Range-Dateien geprüft.
- Keine Konfliktmarker in den 56 aufgelösten Produktdateien.
- Astro-Produktionsbuild erfolgreich: 375 Seiten.
- Git meldet keine unaufgelösten Konflikte. Original-CSV mit unveränderten CRLF-Zeilenenden archiviert.
