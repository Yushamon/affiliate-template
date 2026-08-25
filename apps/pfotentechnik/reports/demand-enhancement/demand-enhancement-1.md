# Demand Enhancement Patch – Phase 1

Stand: 25.08.2026. Geänderte Intent Owner: **2 von maximal 6**. Neue URLs, Ratgeber, Redirects, Canonicals, Produktseiten oder CTA-Änderungen: **0**.

## Ergebnis

Der Patch präzisiert zwei reale Nutzerfragen innerhalb ihrer bestehenden Cornerstones:

1. Der Katzenklappen-Hub erklärt jetzt Tailgating als mechanische Grenze und trennt sie von Chipfreigabe, DualScan und App-Funktionen.
2. Der Haustierkamera-Hub beantwortet prominent, wann eine normale Indoor-Kamera genügt und wann eine Pet-Spezialfunktion einen Mehrwert liefert.

Alle anderen Nodes waren bereits ausreichend beantwortet oder durften wegen unzureichender Daten-/Finding-Reife nicht umgesetzt werden.

## Audit je Demand Node

### Futterautomaten – Ausfallsicherheit

- **Intent Owner:** `/futterautomat-bei-stromausfall/`
- **Vorher:** covered
- **Befund:** Der dedizierte Ratgeber trennt Strom, WLAN, Internet, Cloud und Mechanik; erklärt lokale Zeitpläne, Backup-Arten und Restfunktionen; enthält Funktionsmatrix, Herstellerbeispiele und einen Ausfalltest.
- **Änderung:** keine
- **Evidenz:** vorhandene Primärquellen von Xiaomi, PETKIT, PetSafe und PETLIBRO im Owner
- **Nachher:** covered
- **Confidence:** high
- **Skipped:** ja – weitere Matrix wäre redundant.

### Futterautomaten – zwei Katzen + Nassfutter + Zugang

- **Intent Owner:** `/vergleiche/beste-futterautomaten-fuer-zwei-katzen/`
- **Vorher:** covered
- **Befund:** Der Owner beantwortet die Systemgrenze bereits: Fach-/Kühlautomaten planen Nassfuttermahlzeiten, kontrollieren aber nicht automatisch die Tieridentität; Mikrochip-Näpfe schützen eine Ration, bieten aber keine Folge zeitgesteuerter Mahlzeiten. Bei kombinierten Anforderungen sind getrennte Plätze/Systeme nötig.
- **Änderung:** keine
- **Evidenz:** vorhandene Produkt-/Vergleichsdaten zu SureFeed, Cat Mate C500, PETLIBRO Polar, PetSafe FreshFeed und Catit PIXI
- **Nachher:** covered
- **Confidence:** high
- **Skipped:** ja – die fehlende Komplettlösung ist bereits ehrlich erklärt.

### Katzenklappen – Zugangslogik und Tailgating

- **Intent Owner:** `/katzenklappen/`
- **Vorher:** partial
- **Befund:** Selektiver Eintritt, individuelle Ausgangsrechte, App/Hub und Offline-Grundfunktion waren getrennt. Tailgating fehlte.
- **Änderung:** kurzer Abschnitt „Systemgrenze: Tailgating“ nach der vorhandenen Entscheidungsmatrix. Er erklärt, dass eine Chipfreigabe das erkannte Tier entriegelt, aber kein physisches Hinterherlaufen durch die noch offene Klappe ausschließt. Aus „Mikrochip“ oder „DualScan“ wird keine Anti-Tailgating-Funktion abgeleitet.
- **Evidenz:** Sure Petcare Klappenübersicht und vorhandene Produktdaten zu Standard, DualScan und Connect
- **Nachher:** covered
- **Confidence:** high
- **Skipped:** nein

### Automatische Katzentoiletten – Wartung

- **Intent Owner:** `/automatische-katzentoiletten/`
- **Vorher/Nachher:** covered
- **Befund:** Der Cornerstone sagt bereits prominent, dass Selbstreinigung Sichtkontrolle, Demontage und Grundreinigung nicht ersetzt. Streu, Sensorik, Abfallfach, Filter/Deodorizer und Kosten sind vorhanden.
- **Änderung:** keine
- **Confidence:** high
- **Skipped:** ja – Wiederholungsrisiko.

### Automatische Katzentoiletten – Gewöhnung

- **Intent Owner:** `/automatische-katzentoiletten/`
- **Vorher/Nachher:** covered
- **Befund:** Altes Klo stehen lassen, neues Gerät ausgeschaltet anbieten und Automatik erst nach freiwilliger Nutzung unter Beobachtung aktivieren sind bereits enthalten. Standort, Einstieg, Streu und Ausschlussgründe stehen im selben Owner.
- **Änderung:** keine
- **Confidence:** high
- **Skipped:** ja – der sichere Kernablauf ist vorhanden.

### Haustierkameras – normale Indoor-Kamera oder Spezialkamera

- **Intent Owner:** `/haustierkameras/`
- **Vorher:** partial
- **Befund:** Klassen und Beispiele existierten, die direkte Kurzantwort war nicht prominent.
- **Änderung:** kurzer Abschnitt vor der bestehenden Entscheidungsmatrix. Livebild, Bewegungserkennung, Gegensprechen und lokale Aufnahme können eine normale Indoor-Kamera ausreichend machen. Pet-Spezialmodelle werden nur über konkrete Zusatzaufgaben begründet: Leckerliwurf, Laut-Hinweise, Tiertracking/-KI oder mobile Perspektive.
- **Evidenz:** Reolink E1 Zoom Deutschland; bestehende Furbo-/Enabot-Produktdaten
- **Nachher:** covered
- **Confidence:** high
- **Skipped:** nein

### Haustierkameras – Offline/Internetausfall

- **Intent Owner:** `/haustierkameras/`
- **Vorher/Nachher:** covered
- **Befund:** Fernzugriff, Cloud, App, Tarif und lokale Speicherung sind bereits getrennt. Unbelegte lokale Restfunktionen werden ausdrücklich nicht unterstellt.
- **Änderung:** keine Produktmatrix
- **Confidence:** high
- **Skipped:** ja – die vorhandene allgemeine Logik ist korrekt; der Produktbestand ist für eine vollständige Offline-Matrix nicht einheitlich typisiert.

### GPS – Abo Data Asset

- **Primärer Intent Owner:** `/warum-brauchen-gps-tracker-ein-abo/`
- **Vorher/Nachher:** covered, unverändert
- **Befund:** Der Snapshot besteht sein Rechengate, das Finding steht jedoch auf `needs-review`, Confidence `low`, Evidence-Abdeckung 4/12 beziehungsweise 33,3 %. „4 von 4“ wäre als öffentliche Aussage über die Auswahl leicht missverständlich.
- **Änderung:** keine Statistik und keine Querverweise veröffentlicht
- **Evidenz:** `reports/authority-distribution/data-assets/gps-subscriptions.json`
- **Confidence des Skip-Entscheids:** high
- **Skipped:** ja – nicht fachlich validiert/publikationsreif.

## Nicht umgesetzt

- Futterautomaten-Ausfallsicherheit: bereits vollständig abgedeckt.
- Zwei-Katzen-Kombinationsfall: Systemgrenze bereits vollständig abgedeckt.
- Katzentoiletten-Wartung und -Gewöhnung: bereits prominent abgedeckt.
- Haustierkamera-Offline-Matrix: keine pseudo-genauen Werte aus uneinheitlichen Produktdaten.
- GPS-Statistik: fehlende fachliche Freigabe und nur 33,3 % Evidence-Abdeckung.

## Intent- und Scope-Prüfung

Es entstanden keine neuen Intent-Konflikte: Beide Änderungen liegen in bestehenden Cornerstones und präzisieren deren vorhandene Orientierungsrolle. Es wurden keine neuen URLs, Canonicals, Titles, Descriptions, Templates oder CTA-Ziele angelegt oder geändert.
