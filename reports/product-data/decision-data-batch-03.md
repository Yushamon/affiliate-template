# Structured Decision Data — Batch 03

## Ergebnis

Batch 03 ergänzt die bestehende Produktschema-Quelle, ohne Parallelmodell und ohne neue Content-Route:

- `litterCompatibility` für alle 11 automatischen Katzentoiletten,
- `multiPet` für 19 fachlich relevante Produkte,
- konservative Wiederprüfung des Failure-Mode-Bestands,
- ein eigener read-only Decision-Data-Audit,
- kompakte Nutzung in genau drei bestehenden Intent-Ownern.

## Work Package A — Litter

Abgeschlossen: Das optionale Statusmodell und die Matrix decken alle 11 Repository-Produkte ab. Neun Produkte besitzen mindestens eine belastbare Herstellerquelle; Devoko und PetSnowy bleiben vollständig `unknown`. Der vorhandene Katzenklo-Vergleich ist der alleinige UI-Owner.

## Work Package B — Multi-Pet

Abgeschlossen: 19 relevante Produkte der drei Kernklassen nutzen ein gemeinsames Capability-Modell. Shared Use, Identifikation, Zugang, Fütterung und Analytics sind getrennte Claims; ähnlich schwere Tiere können modelliert werden, werden ohne konkrete Evidence aber nicht pauschal bewertet.

## Failure Mode Follow-up

Die 9 vorhandenen Failure-Mode-Datensätze wurden gegen den aktuellen Repository-Evidence-Bestand erneut geprüft. Es gab keine neue, hinreichend eindeutige Quelle für eine sichere Umstufung. Deshalb wurden keine Werte erzwungen: 25 Einträge bleiben `unknown`; daneben bestehen 3 `supported`, 2 `partial`, 3 `unavailable` und 3 `notApplicable`. Der offene F4-Punkt bleibt fachlich ungelöst, statt aus indirekten Angaben abgeleitet zu werden.

## Legacy Cleanup

- **FEELNEEDY:** Der Datensatz verweist absichtlich auf den bestehenden Herstellerindex `/hersteller/`, nicht auf eine fehlende Detailseite. Der Comparison-Audit akzeptiert diesen expliziten Fallback nun; unbekannte Hersteller ohne diesen Fallback bleiben weiterhin strikte Fehler.
- **11 Content-Count-Befunde:** Alle elf sind als Mess-/Schema-Ambiguität klassifiziert. Der Audit vergleicht die Frontmatter-`items` mit einem einzelnen gerenderten `numberOfItems`, während die Seiten zusätzliche Listen/Empfehlungselemente strukturieren. Die Differenzen bestanden bereits in der Baseline. Eine globale Änderung wäre ohne eigene Markierung der primären Vergleichsliste nicht trivial und blieb deshalb außerhalb dieses Targeted Cleanup unverändert.
- **Sechs Legacy-Fehler in drei Tests:** Starre historische Bundle-Größen, exakt acht Bildreferenzen und `rating: 0` waren nicht mehr fachlich gültig. Die Tests prüfen jetzt weiterhin die eigentlichen Invarianten: Manufacturer-Data/kein Hands-on, vorhandene Pflichtbilder, existierende Produktziele, Journey-Abdeckung und Sicherheitsreihenfolge.

Betroffene Count-Routen: `beste-automatische-katzentoiletten`, `beste-futterautomaten-fuer-hunde`, `beste-futterautomaten-fuer-katzen`, `beste-futterautomaten-fuer-nassfutter`, `beste-futterautomaten-mit-kamera`, `beste-futterautomaten-ohne-wlan`, `beste-haustierkameras`, `beste-trinkbrunnen-fuer-hunde`, `beste-trinkbrunnen-fuer-katzen`, `futterautomat-mit-app`, `gps-tracker-mit-langer-akkulaufzeit`.

## Bestehende Owner-Integration

Nur drei bestehende Vergleiche wurden ergänzt:

1. automatische Katzentoiletten: Streukompatibilität und Mehrkatzen-Grenzen,
2. Futterautomaten für Mehrtierhaushalte: Identifikation, Zugriff, Fütterung und Daten,
3. Mikrochip-Katzenklappen: gemeinsame Nutzung gegenüber individuellen Ein-/Ausgangsrechten.

Es wurden keine Seiten, URLs, TCO-Modelle oder automatisierten Research-Flows angelegt.

## Technische Guardrails

- optionale Schemafelder, bestehende Produktdateien bleiben kompatibel,
- eigene Enum-Status statt boolescher Verkürzung,
- `unknown` bleibt von `false`, `0` und `notSupported` getrennt,
- Bedingungen stehen am jeweiligen Claim,
- belegte Claims erfordern Evidence-URLs,
- individuelle Leistungen erfordern eine dokumentierte Identifikationsmethode,
- keine Darstellung als eigener Produkttest.

## Validation

| Prüfung | Ergebnis |
|---|---|
| Product Data Audit | grün, 101 Produkte, 0 Fehler |
| Product Data Strict | grün, 0 Fehler; 96 bestehende Warnungen |
| Content Audit | 11 Baseline-Count-Mismatches, keine neuen Befunde |
| Internal Linking | grün, 0 Fehler, 9 nicht-strikte Warnungen |
| Internal Linking Strict | grün, 0 strict-kritische Befunde |
| Comparison Audit Strict | grün, 0 Fehler, 4 Coverage-Warnungen |
| Comparison Data Audit | grün, 100 % gerenderte Abdeckung |
| Decision Data Audit | grün, 101 Produkte / 11 Litter-Produkte |
| Failure Mode Tests | 4/4 grün |
| Litter/Multi-Pet/Legacy Tests | 16/16 grün |
| Astro Build | grün, 366 Seiten |
| `git diff --check` | grün |
