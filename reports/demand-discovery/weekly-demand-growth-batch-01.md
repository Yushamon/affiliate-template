# Weekly Demand Growth Batch 01

Stand: 28. August 2026  
Modus: Read-only Repository Coverage + Intent Ownership  
Scope: drei extern validierte Demand Nodes gegen den aktuellen Bestand von `apps/pfotentechnik`

## 1. Executive Summary

Alle drei Demand Nodes sind im aktuellen Repository bereits **covered**. Seit älteren Demand-Audits wurden insbesondere die kombinierte Nassfutter-Entscheidung, die Tailgating-Systemgrenze und modellbezogene Locking-Evidence so weit ergänzt, dass die extern beobachteten Fragen heute ohne neue URL beantwortet werden können.

| Coverage | Anzahl |
|---|---:|
| covered | 3 |
| partial | 0 |
| fragmented | 0 |
| missing | 0 |
| overcovered | 0 |
| uncertain | 0 |

- **Neue URLs empfohlen:** 0
- **Bestehende URLs gezielt erweitern:** 0
- **Data-Asset-Kandidaten:** 1
- **Data-Asset-Potenzial:** medium für GPS-Akkulaufzeit nach dokumentiertem Nutzungsszenario

Die drei klaren Intent Owner sind:

1. `/vergleiche/beste-futterautomaten-fuer-nassfutter/`
2. `/katzenklappen/`
3. `/vergleiche/gps-tracker-mit-langer-akkulaufzeit/`

Die vorhandenen Search-Reports liefern nur ergänzende Signale: Der Nassfuttervergleich hat ein kleines Google-Signal für „Nassfutterautomaten / elektrische Kühlung“; die Tractive-CAT-6-Mini-Produktseite hat ein Bing-Signal mit Akkubezug. Für den exakten Tailgating-Longtail und den vollständigen GPS-Szenariointent ist kein belastbares Query-Signal im gespeicherten Report sichtbar. Das ist wegen Cold Start und kleiner Stichproben **kein Gegenbeweis zur externen Nachfrage**.

## 2. Finding 1 — Nassfutter + Kühlung + Mikrochip + Timer

### Coverage

**covered** · Confidence: **high**

Der zentrale Nutzerkonflikt wird bereits auf einer Seite aufgelöst. Der Nassfuttervergleich erklärt nicht nur einzelne Features, sondern sagt ausdrücklich:

- Fach-/Kühlautomaten können Mahlzeiten zeitlich bereitstellen, trennen aber Tiere nicht automatisch.
- Mikrochip-Näpfe schützen eine Ration, besitzen aber keine Zeitpläne oder automatische Mahlzeitenfolge.
- PETLIBRO Polar und PetSafe FreshFeed stehen für aktive Kühlung; Catit PIXI und Cat Mate C500 für passive Kühlakkus beziehungsweise lokale Timer.
- SureFeed steht für Mikrochip-/RFID-Zugang, aber ohne aktive Kühlung und ohne Zeitplan.
- Bei Stromausfall müssen Fachöffnung beziehungsweise Zeitplan und aktive Kühlung getrennt bewertet werden.
- Damit wird keine nicht existierende Komplettlösung suggeriert; getrennte Plätze oder kombinierte Systeme werden als realer Kompromiss sichtbar.

### Repository-Evidence

- `src/content/comparisons/beste-futterautomaten-fuer-nassfutter.md`
  - Einleitung trennt aktiv gekühlte Zeitplanmodelle von Mikrochip-Näpfen.
  - Vergleichsfelder enthalten `kuehlprinzip`, `mahlzeiten`, `steuerung`, `stromversorgung` und `tiertrennung`.
  - SureFeed ist mit „keine aktive Kühlung“, „manuell befüllter Napf“, „Mikrochip/RFID“ und „keine Zeitpläne“ eingeordnet.
  - FAQ beantwortet aktive Kühlung versus Kühlakku, Stromausfall, Futterklau und die Grenze des SureFeed.
  - Der Abschnitt „Stromausfall: Öffnen und Kühlen getrennt bewerten“ verhindert eine falsche Backup-Aussage.
- `src/content/comparisons/beste-futterautomaten-fuer-zwei-katzen.md`
  - Abschnitt „Nassfutter für zwei Katzen automatisch füttern“ trennt Zeitplan/Kühlung von Tieridentität.
  - Nennt zwei unabhängige Plätze oder eine Zugangslösung als nötigen Kompromiss bei unterschiedlichen Rationen.
- `src/content/products/petlibro-polar-wet-food-feeder.md`
  - aktive thermoelektrische Kühlung, drei zeitgesteuerte Fächer und stromabhängige Kühlung;
  - Batterie-Backup schützt laut Hersteller den Plan bis zu zwölf Stunden, nicht nachweislich die Kühlung.
- `src/content/products/surefeed-microchip-pet-feeder.md` und `surefeed-microchip-pet-feeder-connect.md`
  - Nassfuttertauglichkeit und Mikrochip-/RFID-Zugang;
  - keine automatische Ausgabe, keine Zeitpläne, keine aktive Kühlung.
- `reports/demand-enhancement/demand-enhancement-1.md` bewertet denselben Kombinationsfall nach Repository-Prüfung bereits als covered.

### Relevante URLs und Intent Ownership

| URL | Aktueller Hauptintent | Relevanz für Demand Node | Überschneidung | Möglicher Owner |
|---|---|---|---|---|
| `/vergleiche/beste-futterautomaten-fuer-nassfutter/` | Nassfutterlösungen nach Kühlung, Zeitsteuerung, Ausfall und Zugang vergleichen | sehr hoch; alle drei Funktionsachsen und die fehlende Komplettlösung stehen zusammen | natürlicher Schnittpunkt mit Mehrkatzenintent | **klarer Primary Owner** |
| `/vergleiche/beste-futterautomaten-fuer-zwei-katzen/` | Bauart für zwei Katzen, getrennte Rationen und Futterklau wählen | hoch; erklärt denselben Kompromiss aus Haushaltsperspektive | darf den vollständigen Nassfuttervergleich nicht duplizieren | Secondary Owner |
| `/vergleiche/beste-futterautomaten-fuer-mehrtierhaushalte/` | Futterplätze und Zugang für mehrere Tierarten organisieren | mittel; stark für Zugang, schwächer für Kühlung/Timer | breiter als die konkrete Katzen-/Nassfutterfrage | unterstützend |
| `/vergleiche/beste-futterautomaten-fuer-berufstaetige/` | planbare Fütterung während Abwesenheit | niedrig bis mittel; Zeitplan vorhanden | keine ausreichende Tiertrennungs-/Kühlungsrolle | nein |
| `/smarte-futterautomaten/` | breiter Futterautomaten-Hub | mittel; führt Bauarten und Spezialvergleiche zusammen | zu breit für die konkrete Produktkombination | Hub/Fallback |
| `/produkt/petlibro-polar-wet-food-feeder/` | aktives Kühl-/Zeitplanprodukt prüfen | hoch für Kühlung/Timer | keine Tiertrennung | Produkt-Evidence, kein Cluster-Owner |
| `/produkt/surefeed-microchip-pet-feeder/` | geschützten Mikrochip-Napf prüfen | hoch für Tiertrennung/Spezialfutter | keine Kühlung/Timer | Produkt-Evidence, kein Cluster-Owner |

### Intent Owner

**Bestehende URL ist klarer Owner:** `/vergleiche/beste-futterautomaten-fuer-nassfutter/`

Der Zwei-Katzen-Vergleich bleibt eine starke sekundäre URL für die Haushaltsperspektive. Der Nassfuttervergleich ist dennoch der bessere Primary Owner für diesen Demand Node, weil die zentrale Frage mit Kühlprinzip und Zeitsteuerung beginnt und dort alle relevanten Produktklassen bereits in einer Entscheidungsansicht zusammenstehen.

### Fehlende Nutzerinformation

Keine substantielle Information fehlt für die Coverage-Entscheidung. Modellverfügbarkeit, neue Kombigeräte und Herstellerfunktionen bleiben naturgemäß wartungsabhängig, sind aber kein aktueller Content-Gap.

### Cannibalization Risk

**high**, falls eine neue Longtail-Seite angelegt würde. Sie würde sich gleichzeitig mit dem Nassfutter-, Zwei-Katzen- und Mehrtiervergleich überschneiden und im Wesentlichen deren vorhandene Systemgrenze neu formulieren.

### Recommendation

**no-change**

- Keine neue URL.
- Keine zusätzliche FAQ allein für die kombinierte Formulierung.
- Den Nassfuttervergleich als Primary Owner und den Zwei-Katzen-Vergleich als sekundäre Haushaltsperspektive erhalten.

### New Page Decision

`newPage: no`

Die Entscheidungsfrage benötigt zwar mehr als einen Satz, wird aber bereits vollständig im natürlichen Owner beantwortet. Damit scheitern die New-Page-Kriterien 2 und 3; zusätzlicher Information Gain wäre gering und Kannibalisierung wahrscheinlich.

## 3. Finding 2 — Mikrochip-Katzenklappe + Tailgating

### Coverage

**covered** · Confidence: **high**

Der Katzenklappen-Hub beantwortet die exakte Nutzerfrage in einem eigenen Abschnitt „Systemgrenze: Tailgating“: Mikrochipfreigabe entscheidet, welches erkannte Tier entriegelt; sie garantiert nicht, dass eine fremde Katze unmittelbar hinter der berechtigten Katze durch die noch offene Klappe folgt. Mikrochip und DualScan werden ausdrücklich nicht als Anti-Tailgating-Technik interpretiert.

Die Information ist damit nicht mehr nur modellbezogen fragmentiert. Der Hub liefert die verständliche Systemantwort; Produktseiten liefern die engeren Locking-Details und dokumentierten Unbekannten.

### Repository-Evidence

- `src/content/pages/katzenklappen.md`
  - eigener Abschnitt „Systemgrenze: Tailgating“;
  - trennt selektiven Eintritt, individuelle Ausgangsrechte und mechanische Vereinzelung;
  - fordert ausdrücklich dokumentierten Anti-Tailgating-Schutz, statt ihn abzuleiten.
- `src/content/products/sureflap-dualscan-mikrochip-katzenklappe.md`
  - Chipprüfung auf beiden Seiten;
  - kein Anti-Tailgating-Schutz dokumentiert;
  - exakter Wiederverriegelungszeitpunkt in den geprüften Unterlagen nicht dokumentiert.
- `src/content/products/sureflap-mikrochip-katzenklappe-connect.md`
  - verriegelt laut Handbuch nach vollständigem Passieren wieder;
  - keine mechanische Vereinzelung oder Anti-Tailgating-Garantie dokumentiert.
- `src/content/products/petsafe-mikrochip-katzenklappe.md`
  - Chipprüfung beim Annähern von außen und doppelte Auto-Verriegelung;
  - exakter Wiederverriegelungszeitpunkt und Tailgating-Schutz bleiben nicht dokumentiert.
- `reports/demand-discovery/external-demand-evidence-repair.md`
  - acht relevante Klappen geprüft;
  - modellbezogene Evidence für DualScan, Connect und PetSafe ergänzt;
  - explizite Guardrails gegen Ableitungen aus DualScan, Doppelriegel oder Beuteerkennung.

### Relevante URLs und Intent Ownership

| URL | Aktueller Hauptintent | Relevanz für Demand Node | Überschneidung | Möglicher Owner |
|---|---|---|---|---|
| `/katzenklappen/` | passende Klappenklasse nach Zugang, Richtung, App und Einbau wählen | sehr hoch; enthält die direkte Systemantwort | bündelt Modellunterschiede, ohne Produktvergleich zu ersetzen | **klarer Primary Owner** |
| `/vergleiche/beste-mikrochip-katzenklappen/` | Mikrochip-Klappen nach Zugang und System vergleichen | hoch, aber aktuelle FAQ weniger direkt als der Hub | sollte auf Modellvergleich fokussiert bleiben | Secondary Owner |
| `/katzenklappe-fuer-mehrere-katzen/` | Rechte und Konflikte im Mehrkatzenhaushalt organisieren | mittel | Tailgating ist nur ein Teilproblem | unterstützend |
| `/produkt/sureflap-dualscan-mikrochip-katzenklappe/` | DualScan-Richtungsrechte prüfen | hoch für Modellgrenze | kein allgemeiner Intent Owner | Produkt-Evidence |
| `/produkt/sureflap-mikrochip-katzenklappe-connect/` | vernetzte SureFlap prüfen | hoch für Wiederverriegelungslogik | kein allgemeiner Intent Owner | Produkt-Evidence |
| `/produkt/petsafe-mikrochip-katzenklappe/` | PetSafe-Chipkompatibilität und Verriegelung prüfen | mittel bis hoch | kein allgemeiner Intent Owner | Produkt-Evidence |

### Intent Owner

**Bestehende URL ist klarer Owner:** `/katzenklappen/`

Der Demand Node ist eine wichtige Systemgrenze innerhalb der allgemeinen Kaufentscheidung, aber kein eigenständiger Produkttyp. Der Hub kann die allgemeine Antwort geben und zu modellbezogener Evidence führen.

### Fehlende Nutzerinformation

Keine für die allgemeine Antwort. Bei mehreren Modellen bleiben exakte Schließzeit, Verhalten bei blockierter Klappe/Schwanz und eine Hersteller-Garantie unbekannt. Diese Unknowns werden korrekt nicht als `false` oder als Garantieersatz interpretiert.

### Cannibalization Risk

**high** für eine eigenständige Tailgating-Seite. Sie würde einen kurzen, bereits klar beantworteten Systemgrenzen-Intent vom Katzenklappen-Hub abspalten und mit Mikrochip-Vergleich sowie Mehrkatzenratgeber konkurrieren.

### Recommendation

**no-change**

- Keine neue URL und keine zweite allgemeine Tailgating-Erklärung.
- Hub als Owner erhalten.
- Modellbezogene Unknowns nur bei neuer Primärevidenz aktualisieren; keine Schließzeit schätzen.

### New Page Decision

`newPage: no`

Der Demand ist plausibel, aber Coverage ist covered, ein klarer Owner existiert und die allgemeine Antwort passt in einen fokussierten Abschnitt. Die New-Page-Kriterien 2, 3 und 5 sind nicht erfüllt.

## 4. Finding 3 — GPS-Akkulaufzeit nach Nutzungsszenario

### Coverage

**covered** · Confidence: **high**

Der dedizierte Akkuvergleich behandelt Hersteller-Maximalwerte bereits als bedingte Orientierung statt als reale Laufzeit. Er trennt Energiesparzone, kontinuierliche Ortung, Live-Tracking, Tier-Fit und Mobilfunk-/VHF-Systemklasse. Er erklärt außerdem Einflussfaktoren wie Ortungsintervall, Netzqualität, Temperatur und Bewegung und empfiehlt eine eigene beobachtete Verbrauchskurve statt einer Hochrechnung.

### Repository-Evidence

- `src/content/comparisons/gps-tracker-mit-langer-akkulaufzeit.md`
  - Titel und Primary Intent entsprechen direkt dem Demand Node;
  - Vergleichsregel „gleiche Betriebsart oder keine Rangfolge“;
  - konkrete Szenarien unter anderem für Tractive DOG 6 XL, Weenect XT, PAJ und Weenect XS;
  - erklärt Energiesparzonen und den Mehrverbrauch im Live-Modus;
  - nennt Mobilfunkqualität, Bewegung und Aktualisierungsrate als Bedingungen;
  - warnt vor direktem Vergleich mit VHF und vor Maximalwerten ohne Tier-Fit.
- `src/content/pages/gps-tracker.md`
  - Hub nennt Hersteller-Maximalakku als typischen Fehler;
  - verweist prominent auf den dedizierten Akkuvergleich;
  - erklärt Einfluss von Live-Tracking, schwachem Empfang, Kälte und häufigen Updates.
- Produktdaten:
  - Tractive CAT 6 Mini: mit und ohne Energiesparzone dokumentiert;
  - Tractive DOG 6 XL: mit und ohne Energiesparzone dokumentiert;
  - Weenect XS/XT: Energiesparzone und kontinuierliche Ortung dokumentiert;
  - PAJ PET Finder 4G Mini: Energiesparmodus, gemischte Nutzung und kontinuierliches Tracking getrennt dokumentiert;
  - Prothelis: Intervallabhängigkeit dokumentiert;
  - Pawfit: Herstellermaximum als nutzungs-/netzabhängig markiert.

### Relevante URLs und Intent Ownership

| URL | Aktueller Hauptintent | Relevanz für Demand Node | Überschneidung | Möglicher Owner |
|---|---|---|---|---|
| `/vergleiche/gps-tracker-mit-langer-akkulaufzeit/` | Akkuwerte samt Betriebsbedingungen vergleichen | sehr hoch; exakter Intent | keine problematische Überschneidung | **klarer Primary Owner** |
| `/gps-tracker/` | GPS-System und Kaufentscheidung allgemein verstehen | hoch als Hub und Erklärung | verweist korrekt zum Spezialvergleich | Secondary/Hub |
| `/vergleiche/beste-gps-tracker-fuer-hunde/` | Hundetracker nach Gesamtfit vergleichen | mittel; Akku ist ein Kriterium | nicht zum Akku-Owner ausbauen | Secondary |
| `/vergleiche/beste-gps-tracker-fuer-katzen/` | Katzentracker nach Gewicht und Gesamtfit vergleichen | mittel | nicht zum Akku-Owner ausbauen | Secondary |
| `/produkt/tractive-cat-6-mini/` | CAT 6 Mini bewerten | hoch für ein Modell | navigational/product intent | Produkt-Evidence |
| `/produkt/tractive-dog-6-xl/` | DOG 6 XL bewerten | hoch für Maximal-/Ohne-Zone-Werte | navigational/product intent | Produkt-Evidence |
| `/produkt/weenect-xs/`, `/produkt/weenect-xt/` | jeweiliges Modell bewerten | hoch für Szenariowerte | navigational/product intent | Produkt-Evidence |
| `/produkt/paj-pet-finder-4g-mini/` | PAJ-Modell bewerten | sehr hoch für drei Nutzungsszenarien | navigational/product intent | Produkt-Evidence |

### Intent Owner

**Bestehende URL ist klarer Owner:** `/vergleiche/gps-tracker-mit-langer-akkulaufzeit/`

### Fehlende Nutzerinformation

Für die redaktionelle Coverage fehlt keine grundlegende Erklärung. Für ein maschinenlesbares Data Asset fehlen jedoch je Modell einheitlich typisierte Szenariofelder und feldgenaue Primärquellenzuordnung:

- Maximum mit Bedingung;
- Wert ohne Energiesparzone, sofern offiziell genannt;
- kontinuierliches Tracking beziehungsweise Live-Modus, sofern offiziell genannt;
- klarer Status `known`, `unknown` oder `not-published` je Szenario;
- Quellen- und Prüfdatum je Wert.

### Vorhandene strukturierte Daten

Der Data-Readiness-Audit über alle zwölf GPS-Produkte weist aus:

| Feld | Coverage | Bewertung |
|---|---:|---|
| `gps.batteryMaxDays` | 12/12 · 100 % | numerisch; Herstellermaximum |
| `gps.batteryCondition` | muss mit Maximum geführt werden | textuell, noch nicht szenarienormalisiert |
| `gps.liveTracking` | 12/12 · 100 % | Boolean; Intervall nicht vereinheitlicht |
| `gps.transmission` | 12/12 · 100 % | Enum; LTE/VHF muss getrennt bleiben |
| `gps.deviceWeightGrams` | 12/12 · 100 % | wichtig für Tier-Fit |

Quelle: `reports/authority-distribution/data-readiness.md` und `.json`.

### Mögliche Primärquellen, bereits im Repository referenziert

- Tractive Kundenservice/Produktauswahl in den Tractive-Produktdatensätzen;
- Weenect XS/XT Produktseiten und offizielles Hilfe-Center;
- PAJ PET Finder 4G Mini Produktseite und Schnellstart-Anleitung;
- Prothelis Produktseite und deutscher Herstellershop;
- Pawfit Produktseite und offizieller Modellvergleich.

Vor einer Asset-Veröffentlichung muss geprüft werden, ob die bestehende `evidenceSources`-Assertion tatsächlich das jeweilige Akkufeld belegt. Eine produktweite Quelle ist nicht automatisch feldgenaue Akku-Evidence.

### Data-Asset-Potenzial

**medium**

Begründung:

- Positiv: 12/12 Maximalwerte, Bedingungen, Übertragung und Live-Tracking sind strukturell vorhanden; der bestehende Owner liefert bereits eine belastbare Methodik; Aktualisierung ist automatisierbar.
- Begrenzung: Maximalwerte sind nur mittel vergleichbar; Szenariowerte sind nicht für jedes Modell offiziell vorhanden oder typisiert; Quellenzuordnung ist teils produkt- statt feldgenau.
- Zulässiges Asset: dokumentierte Herstellerangaben nach Szenario und `unknown`-Status.
- Unzulässig: berechnete „reale Laufzeit“, lineare Hochrechnung oder Rangfolge über inkompatible Betriebsarten.

### Cannibalization Risk

**medium** für eine neue Seite, **low** für ein Data Asset innerhalb des bestehenden Akkuvergleichs beziehungsweise als dessen Research-Datengrundlage. Eine zweite URL zur „realen GPS-Akkulaufzeit“ würde denselben Intent duplizieren und zugleich unbelegbare Erwartungen wecken.

### Recommendation

**data-asset-candidate**

Kein Content-Enrichment und keine neue Seite in diesem Batch. In einem separaten Datenbatch können die bereits vorhandenen GPS-Felder szenarienormalisiert und feldgenau belegt werden. Der bestehende Akkuvergleich bleibt alleiniger publizierbarer Intent Owner.

### New Page Decision

`newPage: no`

Coverage ist covered und ein exakter natürlicher Owner existiert. Das Data Asset ist eine Evidenzgrundlage für diesen Owner, kein neuer Suchintent.

## 5. Intent Ownership Matrix

| Demand Node | Primary Owner | Secondary URLs | Coverage | Recommendation |
|---|---|---|---|---|
| Nassfutter + Kühlung + Mikrochip + Timer | `/vergleiche/beste-futterautomaten-fuer-nassfutter/` | `/vergleiche/beste-futterautomaten-fuer-zwei-katzen/`, `/vergleiche/beste-futterautomaten-fuer-mehrtierhaushalte/`, Polar/SureFeed-Produkte | covered | no-change |
| Mikrochip-Katzenklappe + Tailgating | `/katzenklappen/` | `/vergleiche/beste-mikrochip-katzenklappen/`, `/katzenklappe-fuer-mehrere-katzen/`, DualScan/Connect/PetSafe-Produkte | covered | no-change |
| GPS-Akkulaufzeit nach Nutzungsszenario | `/vergleiche/gps-tracker-mit-langer-akkulaufzeit/` | `/gps-tracker/`, Hunde-/Katzenvergleiche, relevante Produktseiten | covered | data-asset-candidate |

## 6. New Page Decision

| Demand Node | newPage | Begründung |
|---|---|---|
| Nassfutter + Kühlung + Mikrochip + Timer | no | Vollständige Systementscheidung steht im natürlichen Nassfutter-Owner; neue URL würde drei bestehende Intents überlappen. |
| Mikrochip-Katzenklappe + Tailgating | no | Klare Systemantwort im Katzenklappen-Hub; als eigenständige Seite zu schmal und kannibalisierend. |
| GPS-Akkulaufzeit nach Nutzungsszenario | no | Exakter Spezialvergleich existiert; Datenstrukturierung erzeugt keinen neuen Search Intent. |

**Empfohlene neue Seiten gesamt: 0.**

## 7. Recommended Growth Batch

Maximalzahl eingehalten: drei konkrete Maßnahmen.

### P0 — No change: Kombinationsfall im bestehenden Owner schützen

`/vergleiche/beste-futterautomaten-fuer-nassfutter/` als Primary Owner erhalten. Keine neue Longtail-Seite und keine Duplizierung der bereits vorhandenen Kompromissmatrix in Berufstätigen- oder Mehrtierseiten.

### P1 — GPS Data Asset als separaten Datenbatch prüfen

Für zwölf GPS-Produkte ausschließlich offiziell belegte Szenariofelder normalisieren: Herstellermaximum, Bedingung, ohne Energiesparzone, kontinuierliches/Live-Tracking, Quellen-URL, geprüft-am und `unknown`. Keine Laufzeit berechnen. Das Asset dem bestehenden Akkuvergleich zuordnen, nicht als neue URL behandeln.

### P2 — No change: Tailgating-Owner und Unknowns bewahren

Den Tailgating-Abschnitt in `/katzenklappen/` als alleinige allgemeine Systemantwort erhalten. Produktseiten nur bei neuer Primärevidenz zu Wiederverriegelung oder echter Anti-Tailgating-Technik aktualisieren; unbekannte Werte nicht als `false` interpretieren.

## 8. DO NOT TOUCH

- **Nicht duplizieren:** die kombinierte Nassfutter-/Mikrochip-/Timer-Systemgrenze aus `/vergleiche/beste-futterautomaten-fuer-nassfutter/` und `/vergleiche/beste-futterautomaten-fuer-zwei-katzen/`.
- **Nicht aufspalten:** den Tailgating-Abschnitt aus `/katzenklappen/` in eine neue URL.
- **Nicht umwidmen:** `/vergleiche/beste-mikrochip-katzenklappen/` bleibt Modellvergleich; `/katzenklappen/` bleibt System-/Auswahlowner.
- **Nicht kannibalisieren:** `/vergleiche/gps-tracker-mit-langer-akkulaufzeit/` durch einen zweiten „realistische Akkulaufzeit“-Ratgeber.
- **Nicht überschreiben:** Hunde- und Katzen-GPS-Vergleiche bleiben Gesamtfit-Owner; Akku ist dort nur ein Kriterium.
- **Nicht extrapolieren:** Herstellermaxima, Energiesparzonenwerte oder einzelne Praxistests zu einer angeblich realen Laufzeit.
- **Nicht aggregieren:** fehlende Szenariowerte als `0`, `false` oder „nicht vorhanden“.
- **Nicht überreagieren:** Das Bing-Signal zur Tractive CAT 6 Mini hat nur zehn Impressionen; der bestehende Report empfiehlt Monitoring statt Snippet-/Owner-Änderung.
- **Nicht migrieren:** Der Google-Report sieht den Nassfuttervergleich bereits als richtigen kommerziellen Owner und empfiehlt, vorhandene Konsolidierung wirken zu lassen.

## Search-Signal Cross-Check

| Demand Node | Repository-Signal | Einordnung |
|---|---|---|
| Nassfutter-Kombination | Google: 3 Impressionen, Position 17 für den Nassfuttervergleich im Signal „Nassfutterautomaten / elektrische Kühlung“ | kleines positives Owner-Signal; keine Grundlage für neue URL |
| Tailgating | kein exakter Query-Treffer in den gespeicherten Search-Reports | Cold Start; weder positive noch negative Coverage-Evidence |
| GPS-Akku-Szenario | Bing: 10 Impressionen, Position 6 für Tractive CAT 6 Mini mit Akkulaufzeit-Signal | produktbezogenes Zusatzsignal; kein Beweis für Gesamtvolumen |

Verwendete Search-Snapshots: `apps/pfotentechnik/reports/seo-signal-focus/top-search-signals.json` (Quellenstände 24.08.2026) sowie ergänzend der ältere kombinierte 28-Tage-Report unter `apps/pfotentechnik/reports/search/search-report.json`. Fehlende Impressionen wurden nicht als Demand-Gate verwendet.

