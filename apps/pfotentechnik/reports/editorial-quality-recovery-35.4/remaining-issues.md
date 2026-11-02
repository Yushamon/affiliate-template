# Offene redaktionelle Punkte

Stand 02.11.2026. Die Website wurde vollständig auf Aufgaben, Struktur, Entscheidungsnutzen und Evidenzgrenzen gesichtet. Ein neuer unabhängiger Praxistest oder ein aktueller externer Faktencheck jeder bestehenden Einzelaussage ist damit nicht verbunden. Offene Punkte stehen zusätzlich URL-bezogen in `quality-inventory.csv`.

## P0: Empfehlungen und Suchintention getrennt überprüfen

Der Finalistenselektor nutzt unter anderem Bewertung, Datenvollständigkeit und Unterschiedlichkeit der Kandidaten. Er ist keine unabhängige Messung der jeweiligen Spezialfrage. Besonders beim GPS-Akkuvergleich kann die Vorauswahl deshalb andere Modelle vertiefen als das Modell mit der größten dokumentierten Hersteller-Maximalangabe.

Die überzogene pauschale Gesamt-Superlativformulierung wurde in sechs Vergleichen entfernt. Beim Akkuvergleich wurden Maximalwert und Vorauswahl ausdrücklich getrennt. **Scores, Kandidatenlisten, Auswahlregeln und Finalistenreihenfolge blieben unverändert.** Für eine Änderung des Bewertungsmodells ist ein gesonderter Score-/Intent-Review erforderlich; er darf nicht durch redaktionelles Hoch- oder Herabsetzen einzelner Produkte ersetzt werden.

## P1: Produktspezifische Recherchebedarfe

| Bereich / URLs | Offene Evidenz | Nächste sinnvolle Arbeit |
| --- | --- | --- |
| PAWBBY Smart Pet Feeder | Modellversion, App-Region, Kamera und Backup nicht einheitlich dokumentiert | konkrete Modellnummer und Originalanleitung des angebotenen Geräts beschaffen; keine Funktionen aus ähnlichen Bildern ableiten |
| HoneyGuardian A68 / S305D / A305D | Reservefunktionen und Handelsvarianten; fehlende genaue Reinigungsfreigaben | passende Anleitung je Variante, dokumentierte erhaltene Funktionen und Ersatzteile prüfen |
| WOPET Heritage View | Variantenabhängigkeit bei Backup, Netz, Speicherung und Lieferregion | exakte Generation abgleichen; keine SD-Größe oder kostenlose Cloud erfinden |
| Fresh Element Infinity | Generation, App-Kompatibilität und Akkumodus | passende Hersteller-/Supportdokumentation; aus integriertem Akku keine typische Laufzeit ableiten |
| Devoko 90L | widersprüchliche Sensor-, Maß-, Gewichts- und Garantieangaben | Anbieter und Anleitung eindeutig einer Handelsvariante zuordnen; Source-Homepage genügt nicht als technischer Nachweis |
| Enabot ROLA Mini | regionale Lieferbarkeit, Speicher und optionale Dienste | aktuelle regionale Dokumentation statt Annahmen über Docking oder Abos |
| Produkte ohne unabhängige Tests | Hersteller-/Händlerdaten können Eigenschaften dokumentieren, aber keine reale Ausfallsicherheit oder Langzeithaltbarkeit beweisen | gezielt unabhängige Prüfungen planen oder echte professionelle Reviews auswerten; keine eigenen Tests aus Fremdtests ableiten |

Die neun präzisierten Produktseiten verwenden vorhandene `experience.summary`, `experience.reliability` und `experience.maintenance`-Felder. Diese Felder werden tatsächlich im Nutzungsabschnitt ausgegeben. Markdown-Haupttexte werden vom aktuellen Produkt-Renderer nicht verwendet; redaktionelle Änderungen müssen diese Grenze berücksichtigen. Neue Pflichtfelder oder eine globale zusätzliche Textsektion wurden nicht eingeführt.

Eignungs-Schlagworte wie `katze`, `hund` oder `app` bleiben in einzelnen Katalogen knapp. Sie wurden nicht automatisiert zu neuen medizinischen oder tierartspezifischen Eignungszusagen umgedeutet. Die konkret ergänzten Nutzungsfelder benennen Voraussetzungen und Grenzen. Auch diese Katalogsprache kann später ohne Änderung der Bewertungslogik fachlich überprüft werden.

## P1/P2: Hersteller und medizinische Inhalte

- Pauschales Käuferlob sowie Haltbarkeits-, Marktführerschafts-, Update- und Supporturteile wurden in neun Herstellerprofilen durch überprüfbare Modellrollen und offene Grenzen ersetzt. Bestehende Links zu Garantiebedingungen sind keine unabhängig geprüfte Aussage zur Servicequalität.
- Insbesondere bei IMIPAW bleibt die Zuordnung einzelner Garantie-/Supportdomains zur konkreten Lieferregion prüfbedürftig. Bereits vorhandene Garantieangaben sind nicht markenweit oder für jeden Verkäufer bestätigt.
- Medizinische Artikel enthalten Informations- und Handlungshilfen, keine individuelle Diagnose. Die gezielt überarbeiteten Durst- und Schling-Abschnitte wurden mit veterinärmedizinischen beziehungsweise fachlichen Primärquellen abgeglichen. Ein vollständiges veterinärmedizinisches Fachlektorat aller Gesundheitsartikel bleibt eine sinnvolle separate Aufgabe.
- Herstellerangaben zu Vitalwerten, Kameraerkennung oder Gewichtsauswertung belegen keine diagnostische Genauigkeit. Bereits vorhandene entsprechende Grenzen bleiben erhalten.

## Konsolidierung und Veröffentlichung

Die allgemeine Gadget-Seite wird zur fachlichen Konsolidierung mit dem Haupt-Hub empfohlen; siehe `overlap-analysis.md`. Vor einer späteren URL-Änderung Queries, Links und die zu erhaltenden Inhalte prüfen und gesondert freigeben. Die beiden Durst-Seiten wurden stattdessen nach Aufgabe differenziert. Bei den Schling-Ratgebern bleibt eine Überschneidungsprüfung offen. Keine URL wurde automatisch zusammengelegt.

Priorisierte Reihenfolge einer **späteren, separat veranlassten** Veröffentlichung:

1. Medizinische Klarstellungen, korrekte 32-g-Angabe und die Einordnung der automatischen Vergleichsaussagen.
2. P0-Vergleichsdifferenzierung, besonders GPS-Akku und die nicht indexierten Spezialvergleiche; keine Indexierung allein durch Textänderung erwarten.
3. Neun Produktseiten mit konkret sichtbaren Nutzungsgrenzen sowie die Herstellerprofile.
4. GSC-Kontrolle der tatsächlich veröffentlichten Version. Erst danach größere strukturelle Entscheidungen.

## Technische Altlasten und Messgrenzen

- Der alte `audit-recommendation-engine-4.mjs` meldet zwei fehlende Aufrufmarker: `buildMoneyPageNextSteps` und `buildManufacturerNextSteps`. Beide fehlen nachweislich bereits in den unveränderten HEAD-Dateien. Dieser statische Alt-Audit besteht daher weiterhin nicht. Die vollständige aktuelle Testsuite und die Vorher-/Nachher-Prüfung aller 28 Finalistenreihenfolgen bestehen. Beleg: `legacy-audit-baseline.json` und `logs/ranking.txt`.
- Der Editorial-Linter hat weiterhin Bestandswarnungen; sie wurden nicht durch generische Einleitungen oder längere Texte kosmetisch entfernt. Vorher 238, nachher 232, null Fehler und keine neu hinzugekommenen Warnungskategorien je Datei.
- Die genaue Google-Ursache bleibt unbekannt. Die vollständige GSC-Zuordnung ist eine datierte Beobachtung, keine neue URL-Inspection nach diesen Änderungen. Kein Erfolg aus dem Verschwinden historischer Exportzeilen abgeleitet.
- Keine Veröffentlichung, kein Deployment, kein Push und kein Indexierungsantrag wurden ausgeführt.
