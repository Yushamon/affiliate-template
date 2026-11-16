# Entscheidungshinweise 35.9

Ausgangsstand: nach dem abgeschlossenen Build 36.0, vor den Änderungen an der Hinweiserzeugung. Der frühere 36.0-Report bleibt ein historischer Phasenbeleg.

## Ergebnis

- 110 Produkte geprüft: 108 gerendert, zwei weiterhin gesperrte Entwürfe.
- 100 Datensätze verbessert; 545 neue oder ersetzte gerenderte Hinweise, 12 Änderungen nur in der Entwurfserzeugung. „Verbessert“ zählt geänderte Texttripel, keine nachträglich erfundene Qualitätsnote.
- Identische Konsequenzen: 40 → 4; 36 entfernt. Gleichwertige Themen: 59 → 10.
- Regelbasiert erkannte Kontextfehler: 29 → 2. Unbelegte Verallgemeinerungen: 115 → 20.
- 156 unklare oder unzureichende Eingabewerte bei 50 Produkten werden separat ausgewiesen.
- Alle 437 Originalhinweise in 73 Arrays erhalten, null Freigaben. Alle 110 Produktdateien bytegenau erhalten: keine Score-, Preis-, Affiliate- oder SEO-Änderungen durch 35.9.
- Alle 20 geschützten Seiten und 205 eingehenden Linkkanten unverändert; zehn geschützte Produktseiten bleiben bewusst beim bisherigen Rendering.

Alle verbleibenden identischen Konsequenzen und regelbasiert erkannten Kontextfehler betreffen ausschließlich die geschützte 35.5-Ausgabe. Auf den 100 ungeschützten Datensätzen meldet der zusätzliche Ausgabe-Audit keine Regelbefunde. Das ist keine Garantie vollständiger semantischer Fehlerfreiheit.

## Dauerhafte Logik und Integration

Die bestehende Funktion buildDecisionFacts verwendet eine zentrale Auswahl nach Produkttyp, dokumentierter Eigenschaft und Entscheidungsthema. Sechs Plätze sind maximal verfügbar; freigegebene exakte Originaltexte haben Vorrang. Dubletten werden nach Thema und normalisiertem Konsequenztext abgefangen. Akkuwerte und Kostenangaben können gemeinsam in einem Hinweis stehen. mAh/Ah/Wh werden vor Volumenregeln behandelt; falsche physikalische Einheiten werden verworfen. Nutzbares Wasservolumen hat Vorrang vor nominalem Tankvolumen.

Unbekannte Funktionen werden nicht bejaht. Unterschiedliche Werte desselben Merkmals sowie eindeutige Abo-/Tierartwidersprüche zwischen vorhandenen strukturierten Daten und Tabellen sperren die betroffenen Themen. Es werden keine Diagnosen, Lieferbarkeiten oder Produktempfehlungen erfunden. Die automatische Ableitung aus technischen Daten bleibt der Fallback; die unveränderte bisherige Implementierung ist ausschließlich für die zehn geschützten 35.5-Produktseiten isoliert.

Product Operations liefert dieselbe Qualitätsauswertung in Produktdatensätzen, Dashboard-Zähler und bestehender redaktioneller GET-/POST-API. Der vorhandene Produkteditor zeigt die Auswertung bei Laden und Speichern an. Neue und geänderte Produkte durchlaufen dieselbe Funktion im Build und in der Produktpflege. Keine zweite Hinweisplattform und keine neue Freigabeoberfläche.

## Prüfungen

- Produktionsbuild: 390 Seiten, bestanden.
- Tests: 177 bestanden, 0 fehlgeschlagen (productIntegration: 145; productFreshness: 9; productOperations: 11; decisionConsequences: 12).
- Browser: 32 Fälle mit 375/1600 Pixeln und Hell/Dunkel; keine Überläufe oder defekten Bilder, Hinweise und Kaufziele geprüft.
- Dateihashes: alle 110 Produktdateien unverändert. Diff-Prüfung: git diff --check 7f017989 bestanden; Produktdatei-Hashes und gezielter Code-Diff kontrolliert.

## Verbleibende Grenzen

- Zehn Produktseiten bleiben wegen Experiment 35.5 auf der bisherigen Ausgabe. Ihre erkannten Schwächen werden ausgewiesen und nicht als behoben gezählt.
- Vier bis sechs Hinweise sind eine Obergrenze mit Zielbereich, kein Zwang zum Auffüllen: Bei zu wenig dokumentierten Eigenschaften liefert die Laufzeit weniger oder keine Hinweise. Im aktuellen Bestand erreichen alle ungeschützten Datensätze den Zielbereich.
- Unbekannte Streu-Kompatibilität bleibt als ausdrücklich offener, sicherer Prüfhinweis erhalten; sie wird nicht als technische Freigabe gewertet.
- Themen-Gleichheit erkennt regelbasierte semantische Äquivalente. Weitergehende Sprach- oder Quellenwidersprüche können eine manuelle Prüfung erfordern. Keine regelbasierte Prüfung garantiert vollständige Fehlerfreiheit.
- Kein neuer technischer Fakt recherchiert oder erfunden. Bereits im Bestand vorhandene unzutreffende Angaben können ohne zusätzliche Quellenprüfung unentdeckt bleiben.

Die JSON-Fassung enthält pro Produkt alle Originaltexte samt Prüfbefunden, die automatisch erzeugten Hinweise vor/nach der Änderung, tatsächlich gerenderte Texttripel vor/nach der Änderung und alle verworfenen Eingaben mit Gründen: [Vollständiger JSON-Report](decision-consequences-35.9.json). Der bestehende [Originaltext-Qualitätsreport 35.7](decision-facts-quality-35.7.md) bleibt erhalten.

## Beispiele nach Kategorie

### Tractive CAT 6 Mini (GPS-Tracker)

- **Akkutechnik und Austausch / Akkukapazität / Akkulaufzeit: Integrierter, wiederaufladbarer Akku; Zellchemie und Austausch durch Nutzer in den geprüften modellspezifischen Herstellerangaben nicht eindeutig dokumentiert · 450 mAh · Bis zu 7 Tage mit Energiesparzone; bis zu 4 Tage ohne Energiesparzone** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo: Erforderlich; ein Abo pro Tracker** — Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.
- **Geeignet für: Katzen von 3 bis 8 kg** — Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.
- **Übertragung: LTE/4G (Cat 1 bis)** — Prüfe vor dem Kauf die unterstützten Netze und Länder für deinen Einsatzort. Satellitenortung allein garantiert noch keine Übertragung des Standorts an dich.
- **Ortung: GPS, GLONASS und Galileo** — Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.
- **Gewicht: 32 g inklusive Halsband** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

### PETLIBRO Granary WiFi Dual Food Tray Feeder (Futterautomaten)

- **Krokettengröße / Futterart: 2 bis 15 mm · Trockenfutter** — Miss die längste Seite des verwendeten Futters und halte die angegebene Größenfreigabe ein; eine passende Behältergröße sagt nichts über die Eignung der Kroketten aus.
- **Portionierung: 1 bis 50 Portionen je Mahlzeit** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Napfanzahl: Zwei Edelstahlnäpfe** — Mehrere Näpfe teilen das Futter räumlich auf; sie belegen keine getrennte Ration oder Zugangskontrolle pro Tier.
- **Stromversorgung: Netzadapter und drei D-Batterien** — Plane passende Ersatzbatterien nach dem dokumentierten Batterietyp ein; aus der Stromquelle allein folgt keine feste Laufzeit.
- **WLAN: 2,4 und 5 GHz** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Reinigung: Verteiler, Ausgabekanal und beide Näpfe regelmäßig reinigen. Trockenmittel ungefähr alle zwei Wochen ersetzen.** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.

### Philips Pet Series Trinkbrunnen PAW3210/02 (Trinkbrunnen)

- **Kapazität: 2,2 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Reinigung: Handreinigung laut Philips-Support; keine Spülmaschine. Anschluss trocken halten und Pumpe separat reinigen.** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Ersatzfilter / Filter: PAW0010/01; drei Filter pro Packung · Mehrschichtiger Filter mit Aktivkohle und Ionenaustausch; PAW0010/01, Wechsel alle 30 Tage** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Stromversorgung / Akku: DC 5 V / 1 A über Netzadapter; Eingang AC 100–240 V, 50/60 Hz; 1,5 m Kabel · Nein; kein Akkubetrieb dokumentiert** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Lautstärke: Unter 38 dB laut Pressemitteilung von 2024; kein eigener Messwert** — Ein Herstellerwert in dB ist nur bei gleichen Messbedingungen vergleichbar. Prüfe den Aufstellort besonders bei Nutzung im Schlafzimmer.
- **Geeignet für: Katzen und kleine Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.

### SureFlap DualScan Mikrochip Katzenklappe (Katzenklappen)

- **Zugang: Mikrochip beidseitig** — Prüfe, welche Richtung und welche Tiere die dokumentierte Erkennung tatsächlich steuert; eine Eingangskontrolle belegt keine individuellen Ausgangsrechte.
- **Durchgang: 142 × 120 mm** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.
- **Batterielaufzeit / Stromversorgung: Bis zu 12 Monate laut Hersteller · 4 AA-Batterien, nicht enthalten** — Plane den Batteriewechsel vor dem angegebenen Maximalzeitraum ein. Ein Hersteller-Maximalwert ist keine Zusage, dass jede Nutzung so lange ohne Wechsel auskommt.
- **Speicher: Bis zu 32 Tiere beziehungsweise Mikrochipnummern** — Vergleiche die speicherbare Tierzahl mit deinem Haushalt. Gespeicherte Identitäten belegen keine individuellen Zeitpläne oder Richtungsrechte.
- **Tür-/Wandausschnitt: 165 × 171 mm** — Gleiche Ausschnitt und Einbaumaterial vor dem Kauf mit den dokumentierten Montagevorgaben ab; Rahmenmaß und benötigte Öffnung sind unterschiedliche Maße.
- **Klappenöffnung: 142 × 120 mm** — Prüfe die dokumentierten App- und Kontovoraussetzungen vor dem Kauf; App-Unterstützung allein belegt keinen Fernzugriff und keinen Betrieb bei Cloud-Ausfall.

### PETKIT PuraMax 2 (Automatische Katzentoiletten)

- **Sicherheit: Elf Sensoren und Anti-Pinch-Struktur laut Hersteller; keine Sicherheitsgarantie** — Die dokumentierten Schutzfunktionen sind keine Sicherheitsgarantie. Halte die Alters- und Gewichtsgrenzen ein und beobachte die Eingewöhnung und ersten Reinigungszyklen.
- **Katzengewicht: 1,5 bis 10 kg; laut Hersteller ab sechs Monaten** — Nutze die Automatik nur innerhalb der dokumentierten Alters- und Gewichtsgrenzen; besonders leichte oder junge Katzen sind nicht pauschal freigegeben.
- **Streu-Kompatibilität: Geeignet: Bentonitstreu, klumpende Mineralstreu, Tofu-Streu und Mischstreu · Nicht geeignet: nicht klumpende Streu** — Klumpstreu erforderlich · max. 12 mm Länge / 3 mm Durchmesser.
- **Stromversorgung: 12 V / 2 A** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Einstieg: 200 mm; Öffnung 200 × 255 mm** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.
- **Kapazität: 76-Liter-Zylinder; 7-Liter-Abfallfach** — Plane die Entleerung nach Anzahl der Katzen und tatsächlicher Nutzung. Das Behältervolumen oder eine Maximaldauer ist keine feste Wartungsfrist.

### Furbo 360° Katzenkamera (Haustierkameras)

- **Video: 1080p FHD, rotierende 360°-Sicht, 4× Digitalzoom** — Vergleiche die dokumentierte Auflösung und den erfassten Bildbereich mit dem gewünschten Raum. Hohe Auflösung allein schließt tote Winkel nicht aus.
- **Speicherung: Videoverlauf über Furbo Nanny; keine lokale Speicherung belegt** — Prüfe Speicherort und Aufbewahrungsdauer getrennt vom Livebild; eine Liveansicht garantiert keine später abrufbare Aufnahme.
- **Abo: Basis-Livebild, Audio, Tracking, Leckerliwurf und Meowing Alert; Diary/Verlauf/weitere Alerts tarifabhängig** — Vergleiche die dokumentierten Pflicht- und Zusatzkosten über die geplante Nutzungszeit; optionale Dienste und notwendige Verbrauchsmaterialien getrennt rechnen.
- **Tracking: Automatische Rotation und Zoom-Verfolgung laut Hersteller** — Vergleiche die dokumentierten Erkennungsfunktionen mit deinem Tier; Ereignismeldungen sind keine lückenlose Verhaltens- oder Gesundheitsüberwachung.
- **Interaktion: Zwei-Wege-Audio, Leckerliwurf bis etwa 100 Stück, Feder-Spielzeug** — Prüfe die hier genannten Interaktionsmöglichkeiten für deinen Alltag; Audio oder Leckerligabe ersetzen keine Betreuung vor Ort.

## Vollständiger Vorher-Nachher-Vergleich

### aqara-smart-pet-feeder-c1

Status: pending-experiment-35.5; 6 erhaltene Originalhinweise; 5 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 4 Liter / etwa 1,7 kg** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Krokettengröße: 2 bis 12 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Portionierung: Etwa 6 bis 10 g je Ausgabeeinheit, futterabhängig** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Stromversorgung: USB-A, 5 V/1 A; optional 3 LR20/D-Batterien als Backup** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Notstrom: 3 LR20/D-Batterien** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.

**Nachher gerendert**

- **Kapazität: 4 Liter / etwa 1,7 kg** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Krokettengröße: 2 bis 12 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Portionierung: Etwa 6 bis 10 g je Ausgabeeinheit, futterabhängig** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Stromversorgung: USB-A, 5 V/1 A; optional 3 LR20/D-Batterien als Backup** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Notstrom: 3 LR20/D-Batterien** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.

**Offene Eingaben**

- App-Steuerung: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Napf: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Reinigung: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- WLAN: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

**Ausstehend wegen 35.5:** Krokettengröße: WRONG_DECISION_CONTEXT; Krokettengröße: GENERIC_CONSEQUENCE; Stromversorgung: GENERIC_CONSEQUENCE; Notstrom: EQUIVALENT_DECISION_TOPIC; Notstrom: UNSUPPORTED_GENERALIZATION; Kamera: UNSUPPORTED_GENERALIZATION. Keine Änderung am geschützten Rendering.

### brook-glass-pet-fountain

Status: improved; 0 erhaltene Originalhinweise; 3 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 2,7 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: Borosilikat- und Kalk-Natron-Glas; Filterkorb Edelstahl 316, Pumpe BPA-freier ABS-Kunststoff** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Stromversorgung: USB-Netzbetrieb mit Adapter, ca. 1,52 m Kabel; kein belegter Akku. Konkrete EU-Adapterausführung nicht bestätigt.** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Filter: Aktivkohlebeutel alle 1–2 Wochen; Grobfilterring alle 2–4 Wochen** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Lautstärke: Leise laut Hersteller; kein eigener Geräuschtest** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Akku: Nein; kein Akkubetrieb dokumentiert** — Kein integrierter Akku: Ohne Netzstrom läuft das Gerät nur weiter, wenn eine separate Batterie- oder Notstromlösung ausdrücklich vorgesehen ist.

**Nachher gerendert**

- **Kapazität: 2,7 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Reinigung: Glasteile wöchentlich reinigen und spülmaschinengeeignet; Pumpe separat alle 2–4 Wochen zerlegen** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Ersatzfilter / Filter: Sets mit 6/3, 12/6 oder 24/12 Aktivkohlebeuteln/Grobfilterringen · Aktivkohlebeutel alle 1–2 Wochen; Grobfilterring alle 2–4 Wochen** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Akku: Nein; kein Akkubetrieb dokumentiert** — Kein integrierter Akku: Ohne Netzstrom läuft das Gerät nur weiter, wenn eine separate Batterie- oder Notstromlösung ausdrücklich vorgesehen ist.
- **Geeignet für: Katzen und kleine Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.
- **App: Keine App-Steuerung** — Ohne diese dokumentierte Verbindung steht dieser Bedienweg nicht zur Verfügung; daraus folgt keine Zusage über andere App-, Cloud- oder Offline-Funktionen.

**Offene Eingaben**

- Stromversorgung: USB-Netzbetrieb mit Adapter, ca. 1,52 m Kabel; kein belegter Akku. Konkrete EU-Adapterausführung nicht bestätigt. (UNKNOWN_VALUE)
- Lautstärke: Leise laut Hersteller; kein eigener Geräuschtest (NO_MEASURED_NOISE)
- ASIN: B0D5DP2V53; Betreiberlink bis zu dieser ASIN aufgelöst, Preis und Lieferbarkeit unbekannt (UNKNOWN_VALUE)

### cat-mate-335-pet-fountain

Status: improved; 6 erhaltene Originalhinweise; 1 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 70 fl. oz., rund 2 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: BPA- und BHT-freier Kunststoff; Schale und Basis aus Polypropylen** — Kunststoff ist leicht, sollte wegen Kratzern und Geruchsaufnahme besonders gründlich kontrolliert werden.
- **Stromversorgung: Netzbetrieb mit Niedervolt-Netzteil und 3 m Kabel** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Akku: Nein** — Kein integrierter Akku: Ohne Netzstrom läuft das Gerät nur weiter, wenn eine separate Batterie- oder Notstromlösung ausdrücklich vorgesehen ist.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Filter im Lieferumfang: Polymer-Aktivkohlefilter** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.

**Nachher gerendert**

- **Kapazität: 70 fl. oz., rund 2 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Pumpenreinigung: Monatlich, bei hartem Wasser häufiger** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Kompatible Ersatzfilter / Filterwechsel: Dreistufenfilter Teil 386 mit Vorfilter, Aktivkohle und Ionenaustauschharz · Herstellerempfehlung monatlich** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Stromversorgung / Akku: Netzbetrieb mit Niedervolt-Netzteil und 3 m Kabel · Nein** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Geeignet für: Katzen und kleine Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.
- **App: Nein** — Ohne diese dokumentierte Verbindung steht dieser Bedienweg nicht zur Verfügung; daraus folgt keine Zusage über andere App-, Cloud- oder Offline-Funktionen.

**Offene Eingaben**

- Lautstärke: Superleiser Betrieb durch isoliertes Pumpensystem (P.S.) (NO_MEASURED_NOISE)

### cat-mate-c200

Status: pending-experiment-35.5; 6 erhaltene Originalhinweise; 3 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: Zwei Fächer mit je bis zu 400 g** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Stromversorgung: Eine AA-Batterie** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Batterielaufzeit: Herstellerangabe bis zwölf Monate** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Gewicht: Nicht vom Hersteller ausgewiesen** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Nachher gerendert**

- **Kapazität: Zwei Fächer mit je bis zu 400 g** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Stromversorgung: Eine AA-Batterie** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Batterielaufzeit: Herstellerangabe bis zwölf Monate** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Gewicht: Nicht vom Hersteller ausgewiesen** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Offene Eingaben**

- WLAN: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

**Ausstehend wegen 35.5:** Kamera: UNSUPPORTED_GENERALIZATION; Stromversorgung: GENERIC_CONSEQUENCE; Batterielaufzeit: EQUIVALENT_DECISION_TOPIC; Batterielaufzeit: UNSUPPORTED_GENERALIZATION; Gewicht: GENERIC_CONSEQUENCE. Keine Änderung am geschützten Rendering.

### cat-mate-c300

Status: improved; 6 erhaltene Originalhinweise; 3 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: Drei Fächer; aktuelle Produktseite nennt 170 g je Fach, Supportseite 330 g** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Stromversorgung: Drei AA-Batterien** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Batterielaufzeit: Herstellerangabe etwa zwölf Monate** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Gewicht: Nicht vom Hersteller ausgewiesen** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Nachher gerendert**

- **Futterart: Nass- und Trockenfutter** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Stromversorgung / Batterielaufzeit: Drei AA-Batterien · Herstellerangabe etwa zwölf Monate** — Plane passende Ersatzbatterien nach dem dokumentierten Batterietyp ein; aus der Stromquelle allein folgt keine feste Laufzeit.
- **Kühlung: Ein Kühlakku, keine aktive Kühlung** — Plane die Futterstandzeit nach der dokumentierten Kühl- oder Frischhaltetechnik; die Angabe ist keine allgemeine Haltbarkeitsgarantie für jede Futterart.
- **Reinigung: Deckel und Einsatz spülmaschinengeeignet** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Mahlzeiten: Ein Fach sofort, zwei Zeiten programmierbar** — Gleiche die Zahl und Verteilung der planbaren Ausgaben mit dem Tagesplan deines Tieres ab; mehrere Ausgaben ersetzen keine Kontrolle der Tagesration.
- **Kapazität: Drei Fächer; aktuelle Produktseite nennt 170 g je Fach, Supportseite 330 g** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.

**Offene Eingaben**

- WLAN: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### cat-mate-c500

Status: pending-experiment-35.5; 6 erhaltene Originalhinweise; 4 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: Fünf Fächer mit je 155 g** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Stromversorgung: Drei AA-Batterien** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Batterielaufzeit: Herstellerangabe bis etwa zwölf Monate** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Gewicht: Nicht vom Hersteller ausgewiesen** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Nachher gerendert**

- **Kapazität: Fünf Fächer mit je 155 g** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Stromversorgung: Drei AA-Batterien** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Batterielaufzeit: Herstellerangabe bis etwa zwölf Monate** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Gewicht: Nicht vom Hersteller ausgewiesen** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Offene Eingaben**

- Napf: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- WLAN: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

**Ausstehend wegen 35.5:** Kamera: UNSUPPORTED_GENERALIZATION; Stromversorgung: GENERIC_CONSEQUENCE; Batterielaufzeit: EQUIVALENT_DECISION_TOPIC; Batterielaufzeit: UNSUPPORTED_GENERALIZATION; Gewicht: GENERIC_CONSEQUENCE. Keine Änderung am geschützten Rendering.

### cat-mate-elite-355w

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: Bis zu neun Katzen; LCD zeigt die ersten drei** — Die Größe beeinflusst, wie häufig nachgefüllt oder gewartet werden muss.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Stromversorgung: 4 AA-Alkalibatterien; etwa 9 bis 12 Monate bei einer Katze laut Hersteller** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Durchgang: 145 × 145 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.

**Nachher gerendert**

- **Zugang: 15-stelliger ISO-Mikrochip oder Cat-Mate-ID-Anhänger; selektiver Eingang** — Prüfe, welche Richtung und welche Tiere die dokumentierte Erkennung tatsächlich steuert; eine Eingangskontrolle belegt keine individuellen Ausgangsrechte.
- **Durchgang: 145 × 145 mm** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.
- **Stromversorgung: 4 AA-Alkalibatterien; etwa 9 bis 12 Monate bei einer Katze laut Hersteller** — Plane passende Ersatzbatterien nach dem dokumentierten Batterietyp ein; aus der Stromquelle allein folgt keine feste Laufzeit.
- **Ausschnitt: 178 × 204 mm oder 232 mm rund; Schablone verwenden** — Gleiche Ausschnitt und Einbaumaterial vor dem Kauf mit den dokumentierten Montagevorgaben ab; Rahmenmaß und benötigte Öffnung sind unterschiedliche Maße.
- **App: Nein** — Ohne diese dokumentierte Verbindung steht dieser Bedienweg nicht zur Verfügung; daraus folgt keine Zusage über andere App-, Cloud- oder Offline-Funktionen.

### cat-mate-shell-fountain

Status: improved; 6 erhaltene Originalhinweise; 4 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 3 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Stromversorgung: Niedervolt-Netzbetrieb mit etwa 3 m Kabel** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Filter: Polymer-Aktivkohle oder dreistufig mit Ionenaustauschharz** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Filterwechsel: Herstellerempfehlung monatlich** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Lautstärke: Nicht vom Hersteller ausgewiesen** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.

**Nachher gerendert**

- **Kapazität: 3 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Pumpenreinigung: Monatlich, bei hartem Wasser häufiger** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Filterwechsel / Filter: Herstellerempfehlung monatlich · Polymer-Aktivkohle oder dreistufig mit Ionenaustauschharz** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Stromversorgung / Akku: Niedervolt-Netzbetrieb mit etwa 3 m Kabel · Nein** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Geeignet für: Katzen und kleine Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.
- **App: Nein** — Ohne diese dokumentierte Verbindung steht dieser Bedienweg nicht zur Verfügung; daraus folgt keine Zusage über andere App-, Cloud- oder Offline-Funktionen.

**Offene Eingaben**

- Lautstärke: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- UV: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### catit-pixi-smart-6-meal-feeder

Status: pending-experiment-35.5; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 6 Fächer mit je 170 ml** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Stromversorgung: USB-C-Netzbetrieb, DC 5 V/1 A mit Adapter** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Batterie-Backup: 4 C/LR14-Batterien, nicht enthalten; Herstellerangabe durchschnittlich etwa 4 Tage** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Gewicht: 1,204 kg leer; 1,708 kg mit Kühlakkus** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Akku: Nein** — Kein integrierter Akku: Ohne Netzstrom läuft das Gerät nur weiter, wenn eine separate Batterie- oder Notstromlösung ausdrücklich vorgesehen ist.

**Nachher gerendert**

- **Kapazität: 6 Fächer mit je 170 ml** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Stromversorgung: USB-C-Netzbetrieb, DC 5 V/1 A mit Adapter** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Batterie-Backup: 4 C/LR14-Batterien, nicht enthalten; Herstellerangabe durchschnittlich etwa 4 Tage** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Gewicht: 1,204 kg leer; 1,708 kg mit Kühlakkus** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Akku: Nein** — Kein integrierter Akku: Ohne Netzstrom läuft das Gerät nur weiter, wenn eine separate Batterie- oder Notstromlösung ausdrücklich vorgesehen ist.

**Ausstehend wegen 35.5:** Stromversorgung: GENERIC_CONSEQUENCE; Batterie-Backup: EQUIVALENT_DECISION_TOPIC; Batterie-Backup: UNSUPPORTED_GENERALIZATION; Kamera: UNSUPPORTED_GENERALIZATION; Gewicht: GENERIC_CONSEQUENCE; Akku: EQUIVALENT_DECISION_TOPIC. Keine Änderung am geschützten Rendering.

### catit-pixi-smart-trinkbrunnen

Status: improved; 0 erhaltene Originalhinweise; 1 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 2 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: BPA-freier Kunststoff mit Edelstahl-Trinkfläche** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Stromversorgung: Netzbetrieb; durchschnittlich unter 1 W laut Hersteller** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Filter: Dreifachfilter; Herstellerempfehlung alle 30 Tage wechseln** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Abmessungen: 20,5 × 20,5 × 17 cm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Gewicht: 800 g** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Nachher gerendert**

- **Kapazität: 2 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Reinigung: Edelstahleinsatz spülmaschinengeeignet; Pumpe und übrige Teile nach Anleitung reinigen** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Ersatzfilter / Filter: Catit PIXI Trinkbrunnenfilter 43721/43722/43723; Wechsel laut Hersteller etwa alle 30 Tage · Dreifachfilter; Herstellerempfehlung alle 30 Tage wechseln** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Stromversorgung / Akku: Netzbetrieb; durchschnittlich unter 1 W laut Hersteller · Nein; USB/DC-5-V-1-A-Netzbetrieb, durchschnittlicher Verbrauch unter 1 W** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **App: PIXI-App über 2,4-GHz-WLAN; Modi, Timer, UVC und Erinnerungen** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Geeignet für: Katzen** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.

**Offene Eingaben**

- Lautstärke: Superleise, vollständig abnehmbare Pumpe; kein konkreter dB-Wert veröffentlicht (NO_MEASURED_NOISE)

### catit-pixi-standard-trinkbrunnen

Status: improved; 0 erhaltene Originalhinweise; 1 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 2,5 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: Kunststoffreservoir und Standard-Trinkfläche aus Kunststoff; Edelstahleinsatz nur als Zubehör bzw. andere Variante** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Stromversorgung: USB-Netzbetrieb, DC 5 V / 1 A; Hersteller nennt weniger als 1 W Verbrauch** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Filter: Dreifachfilter aus Wattegewebe, Aktivkohle und Ionenaustauschharz; alle 30 Tage** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Lautstärke: Hersteller beschreibt leise, aufgehängte Pumpe; kein belastbarer dB-Wert** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Akku: Nein; kein Akkubetrieb dokumentiert** — Kein integrierter Akku: Ohne Netzstrom läuft das Gerät nur weiter, wenn eine separate Batterie- oder Notstromlösung ausdrücklich vorgesehen ist.

**Nachher gerendert**

- **Kapazität: 2,5 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Reinigung: Standardteile von Hand reinigen; Pumpe separat zerlegen. Spülmaschinenfreigabe des Edelstahleinsatzes gilt nicht für diese Kunststoffvariante.** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Ersatzfilter / Filter: 43721 (3er), 43722 (6er), 43723 (12er); ausschließlich PIXI-Kompatibilität prüfen · Dreifachfilter aus Wattegewebe, Aktivkohle und Ionenaustauschharz; alle 30 Tage** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Stromversorgung / Akku: USB-Netzbetrieb, DC 5 V / 1 A; Hersteller nennt weniger als 1 W Verbrauch · Nein; kein Akkubetrieb dokumentiert** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Geeignet für: Katzen** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.
- **App: Keine App-Steuerung** — Ohne diese dokumentierte Verbindung steht dieser Bedienweg nicht zur Verfügung; daraus folgt keine Zusage über andere App-, Cloud- oder Offline-Funktionen.

**Offene Eingaben**

- Lautstärke: Hersteller beschreibt leise, aufgehängte Pumpe; kein belastbarer dB-Wert (NO_MEASURED_NOISE)

### catit-pixi-vision-smart-feeder

Status: improved; 5 erhaltene Originalhinweise; 3 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 2,9 Liter / etwa 1,2 kg** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Krokettengröße: Bis 9 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Notstrom: 4 C/LR14-Batterien** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Stromversorgung: USB-Netzteil, Eingang 5 V/2 A und 10 W; Backup mit 4 C/LR14-Batterien** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Portionierung: Individuell einstellbare Mahlzeitengrößen, bis zu 12 Mahlzeiten pro Tag** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Gewicht: 1,782 kg** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Nachher gerendert**

- **Krokettengröße / Futterart: Bis 9 mm · Trockenfutter und trockene Snacks** — Miss die längste Seite des verwendeten Futters und halte die angegebene Größenfreigabe ein; eine passende Behältergröße sagt nichts über die Eignung der Kroketten aus.
- **Portionierung: Individuell einstellbare Mahlzeitengrößen, bis zu 12 Mahlzeiten pro Tag** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Notstrom / Stromversorgung: 4 C/LR14-Batterien · USB-Netzteil, Eingang 5 V/2 A und 10 W; Backup mit 4 C/LR14-Batterien** — Prüfe, welche Funktionen laut Dokumentation im Backup weiterlaufen; Batterie-Backup bedeutet weder volle App-Funktion noch unbegrenzte Überbrückung.
- **WLAN: 2,4 und 5 GHz** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Kapazität: 2,9 Liter / etwa 1,2 kg** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.
- **Geeignet für: Katzen** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.

**Offene Eingaben**

- App-Steuerung: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Napf: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Reinigung: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### devoko-90l-automatisches-katzenklo

Status: improved; 8 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Katzengewicht: Etwa 1,5 bis 10 kg** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Abmessungen: Je nach Quelle etwa 55 × 51 × 58 cm; Handelsangaben weichen ab** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Produktgewicht: Je nach Quelle etwa 10,9 bis 13,5 kg** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **App: Ja** — Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Stromversorgung: Netzadapter** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Streu-Kompatibilität: Vom Hersteller nicht ausreichend dokumentiert** — Vor dem Kauf direkt beim Anbieter prüfen, ob die vorhandene Streu geeignet ist.

**Nachher gerendert**

- **Sicherheit: Infrarot-, Gewichts- und Radarerkennung dokumentiert; Quellen widersprechen sich bei der Zahl der Sensoren** — Die dokumentierten Schutzfunktionen sind keine Sicherheitsgarantie. Halte die Alters- und Gewichtsgrenzen ein und beobachte die Eingewöhnung und ersten Reinigungszyklen.
- **Katzengewicht: Etwa 1,5 bis 10 kg** — Nutze die Automatik nur innerhalb der dokumentierten Alters- und Gewichtsgrenzen; besonders leichte oder junge Katzen sind nicht pauschal freigegeben.
- **Streu-Kompatibilität: Vom Hersteller nicht ausreichend dokumentiert** — Vor dem Kauf direkt beim Anbieter prüfen, ob die vorhandene Streu geeignet ist.
- **Stromversorgung: Netzadapter** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Einstiegshöhe: Etwa 23 cm in deutschen Händlerangaben** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.
- **Abfallbehälter: 8,5 Liter** — Plane die Entleerung nach Anzahl der Katzen und tatsächlicher Nutzung. Das Behältervolumen oder eine Maximaldauer ist keine feste Wartungsfrist.

### enabot-ebo-air-2

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

Keine öffentliche Ausgabe (gesperrter Entwurf).

**Nachher gerendert**

- **Video: 2K laut Hersteller** — Vergleiche die dokumentierte Auflösung und den erfassten Bildbereich mit dem gewünschten Raum. Hohe Auflösung allein schließt tote Winkel nicht aus.
- **Navigation: App-gesteuerte Fahrt im Innenraum** — Prüfe den vorgesehenen Fahrbereich auf die dokumentierten Hindernisse; die Kamera erschließt nicht automatisch mehrere Etagen.
- **Speicherung: Modell-/App-Angabe prüfen** — Prüfe Speicherort und Aufbewahrungsdauer getrennt vom Livebild; eine Liveansicht garantiert keine später abrufbare Aufnahme.
- **Abo: Kein belegter Pflichttarif** — Vergleiche die dokumentierten Pflicht- und Zusatzkosten über die geplante Nutzungszeit; optionale Dienste und notwendige Verbrauchsmaterialien getrennt rechnen.
- **Interaktion: Fahren und Kamerazugriff** — Prüfe die hier genannten Interaktionsmöglichkeiten für deinen Alltag; Audio oder Leckerligabe ersetzen keine Betreuung vor Ort.

### enabot-rola-mini

Status: improved; 0 erhaltene Originalhinweise; 1 unklare Eingabewerte.

**Vorher gerendert**

Keine öffentliche Ausgabe (gesperrter Entwurf).

**Nachher gerendert**

- **Video: 2K (2304 x 1296) laut Hersteller** — Vergleiche die dokumentierte Auflösung und den erfassten Bildbereich mit dem gewünschten Raum. Hohe Auflösung allein schließt tote Winkel nicht aus.
- **Speicherung: Vor Kauf prüfen** — Prüfe Speicherort und Aufbewahrungsdauer getrennt vom Livebild; eine Liveansicht garantiert keine später abrufbare Aufnahme.
- **Abo: Kein Pflichtabo belastbar belegt** — Vergleiche die dokumentierten Pflicht- und Zusatzkosten über die geplante Nutzungszeit; optionale Dienste und notwendige Verbrauchsmaterialien getrennt rechnen.
- **Interaktion: Zwei-Wege-Audio und App-Steuerung** — Prüfe die hier genannten Interaktionsmöglichkeiten für deinen Alltag; Audio oder Leckerligabe ersetzen keine Betreuung vor Ort.
- **Akku: 5000 mAh** — Die Akkuangabe allein belegt keine Laufzeit im Dauerbetrieb. Vergleiche sie mit dem dokumentierten Betriebsmodus, bevor du einen Standort ohne Steckdose wählst.

**Offene Eingaben**

- Aufzeichnung: Bewegungsaufzeichnung; Speicherweg nicht belastbar belegt (UNKNOWN_VALUE)

### enabot-rola-pettracker

Status: improved; 0 erhaltene Originalhinweise; 1 unklare Eingabewerte.

**Vorher gerendert**

- **Abmessungen: 62 × 37,5 × 27,1 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Gewicht: 70 g** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.
- **Abo: Nano-SIM und Mobilfunkdienst erforderlich; konkreten Tarif vor Kauf prüfen** — Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.
- **Temperaturschutz / Wasserschutz: Warnung über 45 °C; Kamera ab über 55 °C aus, bis unter 40 °C erreicht sind; Tracker bleibt laut FAQ aktiv · Keine IP-Schutzklasse dokumentiert** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.

**Nachher gerendert**

- **Akku: 1500 mAh; 3 bis 5 Tage laut Hersteller** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo: Nano-SIM und Mobilfunkdienst erforderlich; konkreten Tarif vor Kauf prüfen** — Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.
- **Herstellerempfehlung: Hunde und Katzen ab 4 kg** — Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.
- **Funk: 2,4-GHz-WLAN, Bluetooth 4.2, Nano-SIM** — Prüfe vor dem Kauf die unterstützten Netze und Länder für deinen Einsatzort. Satellitenortung allein garantiert noch keine Übertragung des Standorts an dich.
- **Ortung: GPS + AGPS, ergänzend LBS sowie Ton-/Licht-/Bildpositionierung** — Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.
- **Gewicht: 70 g** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

**Offene Eingaben**

- Material: Nicht ausgewiesen (UNKNOWN_VALUE)

### feelneedy-fn-w18-8l-katzenbrunnen

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Gesamtkapazität: 8 Liter beziehungsweise 270 fl. oz.** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: Tank und Trinkschale aus Edelstahl 304; Filterhalter und Steuermodul enthalten Kunststoff** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Lautstärke: Herstellerangabe ≤45 dB; keine unabhängige Messung** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Überlaufschutz: Rückseitige Überlauföffnung laut Hersteller** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.
- **Filterung: Mehrschichtige Filterpatrone plus Pumpenschwamm** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Filtermaterial: Hochdichte Baumwolle, Ionenaustauschharz, Kokos-Aktivkohle und Vlies laut Ersatzfilterunterlagen** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.

**Nachher gerendert**

- **Gesamtkapazität: 8 Liter beziehungsweise 270 fl. oz.** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Pumpenreinigung: Brunnen und Pumpe laut Anleitung ungefähr alle 10 bis 15 Tage; Pumpenschwamm häufiger prüfen** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Filterwechsel / Ersatzfilter: Anleitung empfiehlt etwa alle 2 bis 4 Wochen; tatsächliches Intervall abhängig von Tierzahl und Wasserqualität · DE-Angebot mit 3 Filtern; Filtererinnerung als 14-Tage-Timer** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Trinkmengenmessung: Nein** — Ohne dokumentierte Trinkmengenmessung lässt sich aus Pumpenlaufzeit oder Tankstand keine Trinkmenge eines einzelnen Tieres ableiten.
- **Akku: Integrierter Lithium-Ionen-Akku mit 5.000 mAh** — Die Akkuangabe allein belegt keine Laufzeit im Dauerbetrieb. Vergleiche sie mit dem dokumentierten Betriebsmodus, bevor du einen Standort ohne Steckdose wählst.
- **Lautstärke: Herstellerangabe ≤45 dB; keine unabhängige Messung** — Ein Herstellerwert in dB ist nur bei gleichen Messbedingungen vergleichbar. Prüfe den Aufstellort besonders bei Nutzung im Schlafzimmer.

### flappie

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Durchgang: 150,5 × 126 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Stromversorgung: Mitgeliefertes 12-V-Netzteil; Innensteckdose erforderlich** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Notstrom: Kein integrierter Akku** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.

**Nachher gerendert**

- **Zugang: Aktuell ohne Mikrochip- oder allgemein aktive individuelle Cat-ID-Erkennung** — Prüfe, welche Richtung und welche Tiere die dokumentierte Erkennung tatsächlich steuert; eine Eingangskontrolle belegt keine individuellen Ausgangsrechte.
- **Notstrom / Offline: Kein integrierter Akku · Beute-KI, Kameraaufzeichnung und Tasten lokal; keine Remote-App, Meldungen oder Updates** — Gleiche das dokumentierte Verhalten bei Strom- oder Verbindungsausfall mit dem nötigen Zugang deines Tieres ab; die Klappe darf dabei nicht als pauschal ausfallsicher gelten.
- **Durchgang: 150,5 × 126 mm** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.
- **Beutearten: Mäuse, Ratten, Vögel, Fische, Schlangen und Insekten laut Hersteller** — Beuteerkennung ist keine lückenlose Beutesperre. Prüfe die dokumentierten Grenzen, bevor du dich beim unbeaufsichtigten Zugang darauf verlässt.
- **Glasausschnitt: Ø 212–215 mm direkt; über 215 bis 260 mm mit Adapter** — Gleiche Ausschnitt und Einbaumaterial vor dem Kauf mit den dokumentierten Montagevorgaben ab; Rahmenmaß und benötigte Öffnung sind unterschiedliche Maße.
- **WLAN: 2,4 GHz; WPA2 bestätigt, WPA3 widersprüchlich dokumentiert** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.

### furbo-360-hundekamera

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Abo: Furbo Nanny für erweiterte intelligente Hinweise** — Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.

**Nachher gerendert**

- **Sicht: 360 Grad mit Auto-Tracking laut Hersteller** — Vergleiche die dokumentierte Auflösung und den erfassten Bildbereich mit dem gewünschten Raum. Hohe Auflösung allein schließt tote Winkel nicht aus.
- **Speicherung: App-/Tarifabhängig** — Prüfe Speicherort und Aufbewahrungsdauer getrennt vom Livebild; eine Liveansicht garantiert keine später abrufbare Aufnahme.
- **Abo: Furbo Nanny für erweiterte intelligente Hinweise** — Vergleiche die dokumentierten Pflicht- und Zusatzkosten über die geplante Nutzungszeit; optionale Dienste und notwendige Verbrauchsmaterialien getrennt rechnen.
- **Interaktion: Zwei-Wege-Audio und Leckerliausgabe** — Prüfe die hier genannten Interaktionsmöglichkeiten für deinen Alltag; Audio oder Leckerligabe ersetzen keine Betreuung vor Ort.

### furbo-360-katzenkamera

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

Keine öffentliche Ausgabe (gesperrter Entwurf).

**Nachher gerendert**

- **Video: 1080p FHD, rotierende 360°-Sicht, 4× Digitalzoom** — Vergleiche die dokumentierte Auflösung und den erfassten Bildbereich mit dem gewünschten Raum. Hohe Auflösung allein schließt tote Winkel nicht aus.
- **Speicherung: Videoverlauf über Furbo Nanny; keine lokale Speicherung belegt** — Prüfe Speicherort und Aufbewahrungsdauer getrennt vom Livebild; eine Liveansicht garantiert keine später abrufbare Aufnahme.
- **Abo: Basis-Livebild, Audio, Tracking, Leckerliwurf und Meowing Alert; Diary/Verlauf/weitere Alerts tarifabhängig** — Vergleiche die dokumentierten Pflicht- und Zusatzkosten über die geplante Nutzungszeit; optionale Dienste und notwendige Verbrauchsmaterialien getrennt rechnen.
- **Tracking: Automatische Rotation und Zoom-Verfolgung laut Hersteller** — Vergleiche die dokumentierten Erkennungsfunktionen mit deinem Tier; Ereignismeldungen sind keine lückenlose Verhaltens- oder Gesundheitsüberwachung.
- **Interaktion: Zwei-Wege-Audio, Leckerliwurf bis etwa 100 Stück, Feder-Spielzeug** — Prüfe die hier genannten Interaktionsmöglichkeiten für deinen Alltag; Audio oder Leckerligabe ersetzen keine Betreuung vor Ort.

### furbo-mini-360

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

Keine öffentliche Ausgabe (gesperrter Entwurf).

**Nachher gerendert**

- **Video: 2K QHD laut Hersteller** — Vergleiche die dokumentierte Auflösung und den erfassten Bildbereich mit dem gewünschten Raum. Hohe Auflösung allein schließt tote Winkel nicht aus.
- **Speicherung: Aktuellen Dienstumfang prüfen** — Prüfe Speicherort und Aufbewahrungsdauer getrennt vom Livebild; eine Liveansicht garantiert keine später abrufbare Aufnahme.
- **Abo: Optionale Dienste getrennt prüfen** — Vergleiche die dokumentierten Pflicht- und Zusatzkosten über die geplante Nutzungszeit; optionale Dienste und notwendige Verbrauchsmaterialien getrennt rechnen.
- **Versorgung: USB-C** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Nachtmodus: Automatische Nachtsicht** — Prüfe die dokumentierte Nachtfunktion für den geplanten Raum; Tagesbilder allein zeigen nicht die Erkennbarkeit bei Dunkelheit.
- **Interaktion: Zwei-Wege-Audio und Leckerliausgabe** — Prüfe die hier genannten Interaktionsmöglichkeiten für deinen Alltag; Audio oder Leckerligabe ersetzen keine Betreuung vor Ort.

### garmin-alpha-t-20

Status: improved; 6 erhaltene Originalhinweise; 1 unklare Eingabewerte.

**Vorher gerendert**

- **Abo: Für die VHF-Hundeortung nicht erforderlich** — Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.
- **Akkulaufzeit / Optionale Akkulaufzeit: Bis zu 68 Stunden mit Standardakku · bis zu 136 Stunden mit erweitertem Akkuteil** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Wasserschutz: 1 ATM; widersteht laut Garmin einem Druck entsprechend 10 m Wassertiefe** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.
- **Gerätegewicht: Ca. 238 g ohne Halsband; je nach Band und Ausführung höher** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.
- **Kapazität: Ein Hundehalsbandgerät; Anzahl gleichzeitig verfolgbarer Hunde vom Handgerät abhängig** — Die Größe beeinflusst, wie häufig nachgefüllt oder gewartet werden muss.

**Nachher gerendert**

- **Akkulaufzeit / Optionale Akkulaufzeit: Bis zu 68 Stunden mit Standardakku · bis zu 136 Stunden mit erweitertem Akkuteil** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo: Für die VHF-Hundeortung nicht erforderlich** — Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.
- **Geeignet für: Vor allem mittelgroße und große Jagd-, Such- und Arbeitshunde** — Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.
- **Übertragung: VHF-Direktübertragung an ein kompatibles Garmin-Alpha-Handgerät** — Die dokumentierte Funkverbindung setzt die passende Gegenstelle und deren Reichweite voraus; eine Smartphone-Ortung über Mobilfunk ist damit nicht zugesichert.
- **Ortung: Satellitenposition am Hund, Übertragung per VHF an kompatibles Handgerät** — Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.
- **Gerätegewicht: Ca. 238 g ohne Halsband; je nach Band und Ausführung höher** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

**Offene Eingaben**

- Akkutyp: wiederaufladbarer, austauschbarer Lithium-Ionen-Akku (UNSUPPORTED_BATTERY)

### garmin-alpha-tt-25

Status: improved; 6 erhaltene Originalhinweise; 1 unklare Eingabewerte.

**Vorher gerendert**

- **Abo: Für die VHF-Hundeortung nicht erforderlich** — Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.
- **Akkulaufzeit: Bis zu 68 Stunden; optional bis zu 136 Stunden** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Stromversorgung: Austauschbarer Lithium-Ionen-Akku** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Wasserschutz: 1 ATM** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.
- **Abmessungen: Nicht im offiziellen Handbuch ausgewiesen** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Gewicht: Nicht im offiziellen Handbuch ausgewiesen** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

**Nachher gerendert**

- **Akkulaufzeit: Bis zu 68 Stunden; optional bis zu 136 Stunden** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo: Für die VHF-Hundeortung nicht erforderlich** — Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.
- **Geeignet für: Jagd- und Arbeitshunde; nicht für Katzen** — Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.
- **Übertragung: VHF-Funk direkt zum kompatiblen Alpha-Handgerät** — Die dokumentierte Funkverbindung setzt die passende Gegenstelle und deren Reichweite voraus; eine Smartphone-Ortung über Mobilfunk ist damit nicht zugesichert.
- **Ortung: GPS-Hundehalsbandgerät** — Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.
- **Reinigung: Band, Antenne, Akku und Kontaktpunkte nach Garmin-Anleitung kontrollieren.** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.

**Offene Eingaben**

- Material: Genaue Werkstoffe nicht ausgewiesen (UNKNOWN_VALUE)

### honeyguardian-a305d

Status: improved; 6 erhaltene Originalhinweise; 4 unklare Eingabewerte.

**Vorher gerendert**

- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Kapazität: 5 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Portionierung: 1 bis 24 Portionen pro Mahlzeit** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Stromversorgung: USB-Netzteil oder 3 D-Batterien** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **WLAN: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Batterie: Nicht vom Hersteller ausgewiesen** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.

**Nachher gerendert**

- **Portionierung: 1 bis 24 Portionen pro Mahlzeit** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Futterart: Trockenfutter** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Stromversorgung: USB-Netzteil oder 3 D-Batterien** — Plane passende Ersatzbatterien nach dem dokumentierten Batterietyp ein; aus der Stromquelle allein folgt keine feste Laufzeit.
- **Mahlzeiten: 1 bis 6 pro Tag** — Gleiche die Zahl und Verteilung der planbaren Ausgaben mit dem Tagesplan deines Tieres ab; mehrere Ausgaben ersetzen keine Kontrolle der Tagesration.
- **Kapazität: 5 Liter** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.
- **Geeignet für: Zwei Katzen oder kleine Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.

**Offene Eingaben**

- Reinigung: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Batterie: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### honeyguardian-a68

Status: improved; 6 erhaltene Originalhinweise; 3 unklare Eingabewerte.

**Vorher gerendert**

- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Kapazität: 6 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Stromversorgung: Netzteil mit Batterie-Backup** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Batterie: Nicht vom Hersteller ausgewiesen** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Gewicht: Nicht vom Hersteller ausgewiesen** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Nachher gerendert**

- **Futterart: Trockenfutter** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Stromversorgung: Netzteil mit Batterie-Backup** — Prüfe, welche Funktionen laut Dokumentation im Backup weiterlaufen; Batterie-Backup bedeutet weder volle App-Funktion noch unbegrenzte Überbrückung.
- **WLAN: 2,4 GHz** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Reinigung: Herausnehmbarer Napf und gut zugänglicher Futterkanal** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Mahlzeiten: Bis zu 10 täglich** — Gleiche die Zahl und Verteilung der planbaren Ausgaben mit dem Tagesplan deines Tieres ab; mehrere Ausgaben ersetzen keine Kontrolle der Tagesration.
- **Kapazität: 6 Liter** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.

**Offene Eingaben**

- Batterie: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### honeyguardian-smart-pet-feeder-s305d

Status: improved; 6 erhaltene Originalhinweise; 3 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 5 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **App: Ja, abhängig von der konkreten Version** — Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Napfmaterial: Edelstahl** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Stromversorgung: Netzteil und Batteriereserve** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Portionierung: Mehrere planbare Mahlzeiten; konkrete Portionsschritte unterscheiden sich je nach S305D-Version** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.

**Nachher gerendert**

- **Portionierung: Mehrere planbare Mahlzeiten; konkrete Portionsschritte unterscheiden sich je nach S305D-Version** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Futterart: Trockenfutter** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Stromversorgung / Batterie: Netzteil und Batteriereserve · Backup-Funktion je Angebotsvariante prüfen** — Plane passende Ersatzbatterien nach dem dokumentierten Batterietyp ein; aus der Stromquelle allein folgt keine feste Laufzeit.
- **Reinigung: Behälter, Ausgabekanal und Edelstahl-Napf regelmäßig reinigen. Basis und Elektronik trocken halten.** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Kapazität: 5 Liter** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.
- **Geeignet für: Katzen und kleine Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.

**Offene Eingaben**

- WLAN: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### imipaw-3l-automatic-cat-feeder

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 3 Liter beziehungsweise etwa 12 Cups laut Hersteller** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Portionen je Mahlzeit: Bis zu 20 Portionseinheiten** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Portionsgröße: Laut Hersteller ungefähr 7 bis 9 g je Einheit; abhängig vom Futter** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **App: Nein, bei der hier bewerteten Basisversion** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **WLAN: Nein, bei der hier bewerteten Basisversion** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.

**Nachher gerendert**

- **Portionen je Mahlzeit: Bis zu 20 Portionseinheiten** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Futterart: Trockenfutter** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Stromversorgung / Batterie-Backup: 5 V/1 A Netzteil · 3 D-Alkalibatterien, nicht enthalten** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Reinigung: Entnehmbare Teile reinigen; elektrische Basis nicht in Wasser tauchen** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Mahlzeiten: Bis zu 6 pro Tag** — Gleiche die Zahl und Verteilung der planbaren Ausgaben mit dem Tagesplan deines Tieres ab; mehrere Ausgaben ersetzen keine Kontrolle der Tagesration.
- **Kapazität: 3 Liter beziehungsweise etwa 12 Cups laut Hersteller** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.

### invoxia-biotracker-2026

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Abo: Max GPS für Fern-GPS, Live-Tracking und Geofences erforderlich; Tarifumfang aktuell prüfen** — Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.
- **Akkulaufzeit: Bis zu 15 Tage laut Hersteller; nutzungs- und netzabhängig** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Stromversorgung: Wiederaufladbarer Akku; volle Ladung laut Hersteller bis zu zwei Stunden** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Gewicht: 37 g** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.
- **Wasserschutz: IP67** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.
- **Abmessungen: 59 × 30 × 23 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.

**Nachher gerendert**

- **Akkulaufzeit: Bis zu 15 Tage laut Hersteller; nutzungs- und netzabhängig** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo: Max GPS für Fern-GPS, Live-Tracking und Geofences erforderlich; Tarifumfang aktuell prüfen** — Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.
- **Geeignet für: Hunde; Passform von Tracker und Befestigung prüfen** — Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.
- **Übertragung: LTE-M und Bluetooth 5.3** — Prüfe vor dem Kauf die unterstützten Netze und Länder für deinen Einsatzort. Satellitenortung allein garantiert noch keine Übertragung des Standorts an dich.
- **Ortung: GPS; 1-Sekunden-Live-Tracking im Max-GPS-Tarif** — Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.
- **Gewicht: 37 g** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

### litter-robot-4

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Abmessungen: 75 × 56 × 68,6 cm (H × B × T)** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Gewicht: 10,9 kg leer** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Katzengewicht: Automatik ab 1,36 kg; EU-Seite nennt bis 11,33 kg als geeigneten Bereich** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Aktivkohlefilter: Optional für den Betrieb; Wechsel unter normalen Bedingungen ungefähr monatlich beziehungsweise nach Bedarf** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Stromversorgung: 15 V Gleichstrom** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Streu-Kompatibilität: Geeignet: Bentonitstreu und klumpende Mineralstreu · Nicht geeignet: Holzstreu, Pellets, Papierstreu und nicht klumpende Streu** — Klumpstreu erforderlich. Nur bedingt geeignet: Kristallstreu, Tofu-Streu und Pflanzenfaserstreu.

**Nachher gerendert**

- **Sicherheit: Laser- und Gewichtssensoren mit Zyklusverzögerung; Herstellerangabe, kein eigener Sicherheitstest** — Die dokumentierten Schutzfunktionen sind keine Sicherheitsgarantie. Halte die Alters- und Gewichtsgrenzen ein und beobachte die Eingewöhnung und ersten Reinigungszyklen.
- **Katzengewicht: Automatik ab 1,36 kg; EU-Seite nennt bis 11,33 kg als geeigneten Bereich** — Nutze die Automatik nur innerhalb der dokumentierten Alters- und Gewichtsgrenzen; besonders leichte oder junge Katzen sind nicht pauschal freigegeben.
- **Streu-Kompatibilität: Geeignet: Bentonitstreu und klumpende Mineralstreu · Nicht geeignet: Holzstreu, Pellets, Papierstreu und nicht klumpende Streu** — Klumpstreu erforderlich. Nur bedingt geeignet: Kristallstreu, Tofu-Streu und Pflanzenfaserstreu.
- **Stromversorgung: 15 V Gleichstrom** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **App: Whisker-App für Nutzung, Gewicht, Streu- und Abfallfüllstand** — Prüfe die dokumentierten App- und Kontovoraussetzungen vor dem Kauf; App-Unterstützung allein belegt keinen Fernzugriff und keinen Betrieb bei Cloud-Ausfall.
- **Kamera: Keine integrierte Dualkamera wie beim Litter-Robot 5 Pro** — Ohne Kamera ist keine visuelle Kontrolle über dieses Gerät möglich; Statusmeldungen oder Protokolle werden damit nicht zugesichert.

### litter-robot-5-pro

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Katzengewicht: 3 bis 30 lb, etwa 1,36 bis 13,6 kg laut Hersteller** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Streu-Kompatibilität: Geeignet: Bentonitstreu und klumpende Mineralstreu · Nicht geeignet: Holzstreu, Pellets, Papierstreu und nicht klumpende Streu** — Klumpstreu erforderlich. Nur bedingt geeignet: Kristallstreu, Tofu-Streu und Pflanzenfaserstreu.

**Nachher gerendert**

- **Sicherheit: Sensor- und Zykluslogik; Herstellerangabe, kein eigener Sicherheitstest** — Die dokumentierten Schutzfunktionen sind keine Sicherheitsgarantie. Halte die Alters- und Gewichtsgrenzen ein und beobachte die Eingewöhnung und ersten Reinigungszyklen.
- **Katzengewicht: 3 bis 30 lb, etwa 1,36 bis 13,6 kg laut Hersteller** — Nutze die Automatik nur innerhalb der dokumentierten Alters- und Gewichtsgrenzen; besonders leichte oder junge Katzen sind nicht pauschal freigegeben.
- **Streu-Kompatibilität: Geeignet: Bentonitstreu und klumpende Mineralstreu · Nicht geeignet: Holzstreu, Pellets, Papierstreu und nicht klumpende Streu** — Klumpstreu erforderlich. Nur bedingt geeignet: Kristallstreu, Tofu-Streu und Pflanzenfaserstreu.
- **Folgekosten: Beutel, Streu, Zubehör und gegebenenfalls Whisker+** — Vergleiche die dokumentierten Pflicht- und Zusatzkosten über die geplante Nutzungszeit; optionale Dienste und notwendige Verbrauchsmaterialien getrennt rechnen.
- **Kamera: Zwei integrierte 1080p-Kameras** — Prüfe den dokumentierten Bildbereich: Eine Kameraansicht belegt nicht die tatsächlich gefressene Menge oder eine vollständige Überwachung des Tieres.

### mova-suretrack-pro

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Gewicht: 36,4 g laut Hersteller** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.
- **Akkulaufzeit: Bis zu 7 Tage im Energiesparmodus laut Hersteller** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Schutzklasse: IP67** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.
- **Abo / Abo-Kosten: Für Mobilfunkortung erforderlich · Herstellerseite: 96 EUR für 1 Jahr, 160 EUR für 2 Jahre, 220 EUR für 3 Jahre; bei Abschluss erneut prüfen.** — Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.

**Nachher gerendert**

- **Akkulaufzeit: Bis zu 7 Tage im Energiesparmodus laut Hersteller** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo / Abo-Kosten: Für Mobilfunkortung erforderlich · Herstellerseite: 96 EUR für 1 Jahr, 160 EUR für 2 Jahre, 220 EUR für 3 Jahre; bei Abschluss erneut prüfen.** — Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.
- **Befestigung: Für Halsbänder bis 3 cm; Tiere ab 3,5 kg** — Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.
- **Übertragung: LTE** — Prüfe vor dem Kauf die unterstützten Netze und Länder für deinen Einsatzort. Satellitenortung allein garantiert noch keine Übertragung des Standorts an dich.
- **Live-Ortung: Live-Tracking dokumentiert** — Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.
- **Gewicht: 36,4 g laut Hersteller** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

### neakasa-m1-lite

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Katzengewicht: 1 bis 15 kg; unter 1 kg Kitten-Modus ohne Automatik** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Streukapazität: 7,17 Liter** — Die Größe beeinflusst, wie häufig nachgefüllt oder gewartet werden muss.
- **Eigengewicht: 10,35 kg** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Streu-Kompatibilität: Geeignet: Bentonitstreu und klumpende Mineralstreu · Nicht geeignet: Holzstreu, Pellets, Papierstreu und nicht klumpende Streu** — Klumpstreu erforderlich · max. 10 mm Länge / 3 mm Durchmesser.

**Nachher gerendert**

- **Sensorik: Aktuelle Lifecycle-Dokumentation nennt ein 6-Array-Infrarotsystem; eine offizielle Vergleichstabelle ist dazu nicht konsistent** — Die dokumentierten Schutzfunktionen sind keine Sicherheitsgarantie. Halte die Alters- und Gewichtsgrenzen ein und beobachte die Eingewöhnung und ersten Reinigungszyklen.
- **Katzengewicht: 1 bis 15 kg; unter 1 kg Kitten-Modus ohne Automatik** — Nutze die Automatik nur innerhalb der dokumentierten Alters- und Gewichtsgrenzen; besonders leichte oder junge Katzen sind nicht pauschal freigegeben.
- **Streu-Kompatibilität: Geeignet: Bentonitstreu und klumpende Mineralstreu · Nicht geeignet: Holzstreu, Pellets, Papierstreu und nicht klumpende Streu** — Klumpstreu erforderlich · max. 10 mm Länge / 3 mm Durchmesser.
- **Einstieg: 352 mm** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.
- **Abfallbehälter: 11,23 Liter** — Plane die Entleerung nach Anzahl der Katzen und tatsächlicher Nutzung. Das Behältervolumen oder eine Maximaldauer ist keine feste Wartungsfrist.
- **Abdichtung: Bristle Seal, Composite-Sealing-Ring und überarbeiteter Silikonliner laut Hersteller** — Plane neben den automatischen Zyklen die dokumentierte manuelle Reinigung ein; automatische Trennung bedeutet keine selbstständige Grundreinigung.

### neakasa-m1-plus

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Katzengewicht: 2,2 bis etwa 33 lb, rund 1 bis 15 kg laut Hersteller** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Geräusch: Bis 50 dB laut Hersteller** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Streu-Kompatibilität: Geeignet: Bentonitstreu und klumpende Mineralstreu · Nicht geeignet: Holzstreu, Pellets, Papierstreu und nicht klumpende Streu** — Klumpstreu erforderlich · max. 10 mm Länge / 3 mm Durchmesser.

**Nachher gerendert**

- **Sicherheit: Sechs Infrarot-Sensorgruppen; sofortiger Stopp laut Hersteller** — Die dokumentierten Schutzfunktionen sind keine Sicherheitsgarantie. Halte die Alters- und Gewichtsgrenzen ein und beobachte die Eingewöhnung und ersten Reinigungszyklen.
- **Katzengewicht: 2,2 bis etwa 33 lb, rund 1 bis 15 kg laut Hersteller** — Nutze die Automatik nur innerhalb der dokumentierten Alters- und Gewichtsgrenzen; besonders leichte oder junge Katzen sind nicht pauschal freigegeben.
- **Streu-Kompatibilität: Geeignet: Bentonitstreu und klumpende Mineralstreu · Nicht geeignet: Holzstreu, Pellets, Papierstreu und nicht klumpende Streu** — Klumpstreu erforderlich · max. 10 mm Länge / 3 mm Durchmesser.
- **Folgekosten: Streu und passende Müllbeutel; beliebige passende Beutel laut Hersteller** — Vergleiche die dokumentierten Pflicht- und Zusatzkosten über die geplante Nutzungszeit; optionale Dienste und notwendige Verbrauchsmaterialien getrennt rechnen.
- **Einstieg: 13,86 Zoll, etwa 35,2 cm** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.
- **Abfallbehälter: 11,23 Liter** — Plane die Entleerung nach Anzahl der Katzen und tatsächlicher Nutzung. Das Behältervolumen oder eine Maximaldauer ist keine feste Wartungsfrist.

### neakasa-riko

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Napfmaterial: Edelstahl laut Hersteller; zwei Näpfe im Lieferumfang** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Kapazität Futterbehälter: 3 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Portionsgröße: 1–15 g je Ausgabe** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Stromversorgung: Netzbetrieb; optionaler Akku 10,8 V / 2.500 mAh** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Materialien: ABS, PP, Edelstahl** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.

**Nachher gerendert**

- **Portionsgröße: 1–15 g je Ausgabe** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Futterart: Primär gefriergetrocknet; max. Stückgröße 15 × 15 × 25 mm; weitere Sorten nur bei bestätigter Kompatibilität** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Backup-Akku: Bis zu 7 Tage laut Hersteller, abhängig von Nutzung und Einstellungen** — Der dokumentierte Akku ist als Backup einzuordnen; daraus folgt kein uneingeschränkter kabelloser Betrieb aller Funktionen.
- **App-Steuerung / WLAN: Bluetooth + 2,4-GHz-WLAN laut deutscher Produktseite** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Reinigung: Kontaktteile abnehmbar; Hauptgerät nicht eintauchen; angefeuchtete Futterreste zeitnah entfernen** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Stromversorgung: Netzbetrieb; optionaler Akku 10,8 V / 2.500 mAh** — Die Akkuangabe allein belegt keine Laufzeit im Dauerbetrieb. Vergleiche sie mit dem dokumentierten Betriebsmodus, bevor du einen Standort ohne Steckdose wählst.

### oneisall-2-2l-cordless-fountain

Status: improved; 6 erhaltene Originalhinweise; 4 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 2,2 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Stromversorgung: Akku, Laden über USB-C mit 5 V/1 A** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Lautstärke: Herstellerangabe unter 20 dB** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Filter: Fünfstufig** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Filterwechsel: Herstellerempfehlung alle zwei bis vier Wochen** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.

**Nachher gerendert**

- **Kapazität: 2,2 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Reinigung: Filter vor Gebrauch einweichen. Brunnen alle ein bis zwei Wochen reinigen und Filter etwa alle zwei bis vier Wochen wechseln.** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Filterwechsel / Filter: Herstellerempfehlung alle zwei bis vier Wochen · fünfstufig** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Stromversorgung: Akku, Laden über USB-C mit 5 V/1 A** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Akkulaufzeit: Herstellerangabe bis 30 Tage** — Die Akkuangabe allein belegt keine Laufzeit im Dauerbetrieb. Vergleiche sie mit dem dokumentierten Betriebsmodus, bevor du einen Standort ohne Steckdose wählst.
- **Lautstärke: Herstellerangabe unter 20 dB** — Ein Herstellerwert in dB ist nur bei gleichen Messbedingungen vergleichbar. Prüfe den Aufstellort besonders bei Nutzung im Schlafzimmer.

**Offene Eingaben**

- UV: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Trinkhöhe: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Wasserfluss: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### oneisall-2-in-1-feeder-water

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Futterkapazität: 5 Liter beziehungsweise 169 fl. oz.** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Wasserkapazität: 3,5 Liter beziehungsweise 118 fl. oz.** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Krokettengröße: Bis 13 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Portionierung: Einstellbare Portionseinheiten; tatsächliches Gewicht hängt vom Futter ab** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **WLAN: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.

**Nachher gerendert**

- **Krokettengröße / Futterart: Bis 13 mm · Trockenfutter** — Miss die längste Seite des verwendeten Futters und halte die angegebene Größenfreigabe ein; eine passende Behältergröße sagt nichts über die Eignung der Kroketten aus.
- **Portionierung: Einstellbare Portionseinheiten; tatsächliches Gewicht hängt vom Futter ab** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Näpfe: Zwei separate Edelstahlnäpfe für Futter und Wasser** — Mehrere Näpfe teilen das Futter räumlich auf; sie belegen keine getrennte Ration oder Zugangskontrolle pro Tier.
- **Stromversorgung / Batterie-Backup: USB-C-Netzteil mit 5 V/1 A · 4 AA-Alkalibatterien, nicht enthalten** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Reinigung: Entnehmbare Teile von Hand reinigen; elektrische Basis nicht abspülen oder eintauchen** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Mahlzeiten: 1 bis 6 pro Tag** — Gleiche die Zahl und Verteilung der planbaren Ausgaben mit dem Tagesplan deines Tieres ab; mehrere Ausgaben ersetzen keine Kontrolle der Tagesration.

### oneisall-3-2l-cordless-fountain

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 3,2 Liter beziehungsweise 108 fl. oz.** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: ABS-Tank mit Trinkfläche aus Edelstahl 304** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Lautstärke: Herstellerangabe ungefähr 20 dB** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Filterung: Fünfstufig** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Filterbestandteile: Vlies, Aktivkohle, Ionenaustauschharz, Maifan-Stein und Schwamm laut Anleitung** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Filterwechsel: Produktbundle empfiehlt etwa alle 2 Wochen; allgemeiner Herstellerhinweis nennt 2 bis 4 Wochen** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.

**Nachher gerendert**

- **Kapazität: 3,2 Liter beziehungsweise 108 fl. oz.** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Reinigung: Filter vor der ersten Verwendung fünf Minuten einweichen. Trinkfläche, Tank und Filterhalter mindestens alle ein bis zwei Wochen reinigen, Wasser deutlich häufiger erneuern und Filter je nach Verschmutzung ungefähr alle zwei bis vier Wochen ersetzen. Steuermodul und Ladebereich nicht eintauchen.** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Filterwechsel / Filterung: Produktbundle empfiehlt etwa alle 2 Wochen; allgemeiner Herstellerhinweis nennt 2 bis 4 Wochen · fünfstufig** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Akku: Integrierter Lithium-Ionen-Akku mit 4.000 mAh** — Die Akkuangabe allein belegt keine Laufzeit im Dauerbetrieb. Vergleiche sie mit dem dokumentierten Betriebsmodus, bevor du einen Standort ohne Steckdose wählst.
- **Lautstärke: Herstellerangabe ungefähr 20 dB** — Ein Herstellerwert in dB ist nur bei gleichen Messbedingungen vergleichbar. Prüfe den Aufstellort besonders bei Nutzung im Schlafzimmer.
- **Geeignet für: Katzen und kleine Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.

### oneisall-3-5l-cordless-fountain

Status: pending-experiment-35.5; 6 erhaltene Originalhinweise; 3 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 3,5 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: Edelstahl** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Lautstärke: Herstellerangabe unter 30 dB** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Filter: 5-stufige Wasserfilterung** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Ersatzfilter: Herstellerempfehlung: alle 2 bis 3 Wochen wechseln** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Gewicht: Ca. 0,91 kg** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Nachher gerendert**

- **Kapazität: 3,5 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: Edelstahl** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Lautstärke: Herstellerangabe unter 30 dB** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Filter: 5-stufige Wasserfilterung** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Ersatzfilter: Herstellerempfehlung: alle 2 bis 3 Wochen wechseln** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Gewicht: Ca. 0,91 kg** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Offene Eingaben**

- UV: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Trinkhöhe: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Wasserfluss: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

**Ausstehend wegen 35.5:** Material: UNSUPPORTED_GENERALIZATION; Lautstärke: GENERIC_CONSEQUENCE; Filter: DUPLICATE_CONSEQUENCE; Filter: UNSUPPORTED_GENERALIZATION; Ersatzfilter: DUPLICATE_CONSEQUENCE; Ersatzfilter: EQUIVALENT_DECISION_TOPIC; Ersatzfilter: UNSUPPORTED_GENERALIZATION; Gewicht: GENERIC_CONSEQUENCE. Keine Änderung am geschützten Rendering.

### oneisall-5l-automatic-cat-feeder

Status: improved; 6 erhaltene Originalhinweise; 4 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 5 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Stromversorgung: Netzteil, je nach Variante Batterie-Backup** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Portionierung: Programmierbare Trockenfutterportionen auf zwei Näpfe verteilt** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Batterie: Nicht vom Hersteller ausgewiesen** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Gewicht: Nicht vom Hersteller ausgewiesen** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Nachher gerendert**

- **Portionierung: Programmierbare Trockenfutterportionen auf zwei Näpfe verteilt** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Futterart: Trockenfutter** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Napfanzahl: Zwei Näpfe** — Mehrere Näpfe teilen das Futter räumlich auf; sie belegen keine getrennte Ration oder Zugangskontrolle pro Tier.
- **Stromversorgung: Netzteil, je nach Variante Batterie-Backup** — Prüfe, welche Funktionen laut Dokumentation im Backup weiterlaufen; Batterie-Backup bedeutet weder volle App-Funktion noch unbegrenzte Überbrückung.
- **Reinigung: Behälter, Rotor, Ausgabekanal, Verteiler und beide Näpfe regelmäßig reinigen und vollständig trocknen.** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Kapazität: 5 Liter** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.

**Offene Eingaben**

- WLAN: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Batterie: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### oneisall-7l-dog-water-fountain

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 7 Liter beziehungsweise rund 230 fl. oz.** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: Trinkschale aus SUS/304-Edelstahl; Tank und weitere Bauteile aus Kunststoff beziehungsweise PC** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Stromversorgung: DC 5 V/1 A** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Akku: Nein** — Kein integrierter Akku: Ohne Netzstrom läuft das Gerät nur weiter, wenn eine separate Batterie- oder Notstromlösung ausdrücklich vorgesehen ist.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Lautstärke: Herstellerangabe unter beziehungsweise ungefähr 35 dB** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.

**Nachher gerendert**

- **Kapazität: 7 Liter beziehungsweise rund 230 fl. oz.** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Pumpenreinigung: Mindestens wöchentlich laut zugänglicher Anleitung; allgemeiner Support nennt 1 bis 2 Wochen** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Filterwechsel / Ersatzfilter: Offizielle Angaben variieren zwischen 15 Tagen, 2 bis 3 Wochen und 2 bis 4 Wochen · Oneisall 7L Ersatzfilter verfügbar; Hersteller empfiehlt Wechsel etwa alle 2 bis 3 Wochen** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Stromversorgung / Akku: DC 5 V/1 A · Nein** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Lautstärke: Herstellerangabe unter beziehungsweise ungefähr 35 dB** — Ein Herstellerwert in dB ist nur bei gleichen Messbedingungen vergleichbar. Prüfe den Aufstellort besonders bei Nutzung im Schlafzimmer.
- **Geeignet für: Mittelgroße und große Hunde sowie Mehrtierhaushalte** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.

### onlycat-mikrochip-katzenklappe

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

Keine öffentliche Ausgabe (gesperrter Entwurf).

**Nachher gerendert**

- **Zugang: Mikrochip-Scan beim Ein- und Ausgang** — Prüfe, welche Richtung und welche Tiere die dokumentierte Erkennung tatsächlich steuert; eine Eingangskontrolle belegt keine individuellen Ausgangsrechte.
- **Ausfallverhalten / Strom: Lokaler Betrieb bei WLAN-Ausfall; automatische Entsperrung bei Stromausfall laut Hersteller · USB-C Power Delivery, 9 V/2 A; kurze Backup-Überbrückung** — Gleiche das dokumentierte Verhalten bei Strom- oder Verbindungsausfall mit dem nötigen Zugang deines Tieres ab; die Klappe darf dabei nicht als pauschal ausfallsicher gelten.
- **Wandöffnung: 170 × 170 mm; Tunnel mit leichtem Gefälle nach außen** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.
- **Abo: Optionales Abonnement für günstigere Hardwarevariante mit verpflichtendem Monatsdienst** — Vergleiche die dokumentierten Pflicht- und Zusatzkosten über die geplante Nutzungszeit; optionale Dienste und notwendige Verbrauchsmaterialien getrennt rechnen.
- **Türmontage: Tunnelunterkante ungefähr auf Bauchhöhe; Tunnel weder bohren noch schneiden** — Gleiche Ausschnitt und Einbaumaterial vor dem Kauf mit den dokumentierten Montagevorgaben ab; Rahmenmaß und benötigte Öffnung sind unterschiedliche Maße.
- **WLAN: 2,4 GHz; Einrichtung und App-Funktionen benötigen WLAN** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.

### paj-pet-finder-4g-mini

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Abo: 27 Monate Tracking enthalten; danach kostenpflichtiger PAJ-Tarif erforderlich** — Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.
- **Akkulaufzeit Energiesparmodus: Bis zu 10 Tage laut Hersteller** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Wasserschutz: IP67, bis zu 1 m für maximal 30 Minuten** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.
- **Abmessungen ohne Halterung / Abmessungen mit Halterung: 51 × 33,16 × 17 mm · 51 × 41,16 × 17 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Gewicht: 33,1 g** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.
- **Kapazität: 27 Monate Tracking enthalten** — Die Größe beeinflusst, wie häufig nachgefüllt oder gewartet werden muss.

**Nachher gerendert**

- **Akku / Akkulaufzeit Energiesparmodus / Akkulaufzeit gemischte Nutzung / Akkulaufzeit kontinuierliches Tracking: Integrierter 700-mAh-Lithium-Polymer-Akku mit 3,7 V und 2,59 Wh · bis zu 10 Tage laut Hersteller · aktuelle Detailangabe 4 bis 6 Tage · aktuelle Detailangabe etwa 1 bis 2 Tage; FAQ nennt teils 1 bis 3 Tage** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo / Enthaltener Service / Kosten danach: 27 Monate Tracking enthalten; danach kostenpflichtiger PAJ-Tarif erforderlich · 3 Monate Premium plus anschließend 24 Monate Lite · Lite laut aktueller Herstellerangabe ab 2 € pro Monat bei jährlicher Zahlung** — Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.
- **Befestigung: Drei Gummi-Halsbandbefestigungen im aktuellen Hersteller-Lieferumfang** — Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.
- **Übertragung: GPS-Position über 4G/LTE mit integriertem 2G-Fallback an App und Webportal** — Prüfe vor dem Kauf die unterstützten Netze und Länder für deinen Einsatzort. Satellitenortung allein garantiert noch keine Übertragung des Standorts an dich.
- **Ortung: GPS im Freien; ergänzende Bluetooth- und WLAN-Funktionen zur Nähe- und Energiesparlogik** — Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.
- **Gewicht: 33,1 g** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

### pawbby-smart-pet-feeder

Status: improved; 6 erhaltene Originalhinweise; 6 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: Häufig 3,6 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Stromversorgung: Netzteil, modellabhängig Backup** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Portionierung: Zeitgesteuerte Trockenfutterportionen per App** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Batterie: Nicht vom Hersteller ausgewiesen** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Gewicht: Nicht vom Hersteller ausgewiesen** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Nachher gerendert**

- **Portionierung: Zeitgesteuerte Trockenfutterportionen per App** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Futterart: Trockenfutter** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Stromversorgung: Netzteil, modellabhängig Backup** — Prüfe, welche Funktionen laut Dokumentation im Backup weiterlaufen; Batterie-Backup bedeutet weder volle App-Funktion noch unbegrenzte Überbrückung.
- **Kapazität: Häufig 3,6 Liter** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.
- **Geeignet für: Katzen, kleine Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.
- **App-Steuerung: Ja, modellabhängig** — Prüfe die dokumentierten App- und Kontovoraussetzungen vor dem Kauf; App-Unterstützung allein belegt keinen Fernzugriff und keinen Betrieb bei Cloud-Ausfall.

**Offene Eingaben**

- Napf: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Reinigung: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- WLAN: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Batterie: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### pawfit-3

Status: improved; 0 erhaltene Originalhinweise; 1 unklare Eingabewerte.

**Vorher gerendert**

- **Abo: Pawfit-Abonnement erforderlich** — Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.
- **Stromversorgung: Wiederaufladbarer Akku** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Abmessungen: 1,89 × 1,3 × 0,55 Zoll, etwa 48 × 33 × 14 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Gewicht: 27 g** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.
- **Wasserschutz: IP68; Tauchtiefe ist Herstellerclaim** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.

**Nachher gerendert**

- **Abo: Pawfit-Abonnement erforderlich** — Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.
- **Geeignet für: Hunde über 3,5 kg laut Hersteller** — Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.
- **Übertragung: 4G-LTE über eSIM** — Prüfe vor dem Kauf die unterstützten Netze und Länder für deinen Einsatzort. Satellitenortung allein garantiert noch keine Übertragung des Standorts an dich.
- **Ortung: GPS mit WLAN- und Bluetooth-Unterstützung** — Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.
- **Gewicht: 27 g** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.
- **Wasserschutz: IP68; Tauchtiefe ist Herstellerclaim** — Halte dich beim Kontakt mit Wasser an die konkrete IP-Angabe und die Reinigungsvorgaben; daraus folgt keine allgemeine Freigabe für Hochdruck oder Reinigungsmittel.

**Offene Eingaben**

- Akkulaufzeit: Bis zu acht Tage laut Hersteller (UNSUPPORTED_BATTERY)

### pawsync-smart-pet-feeder

Status: pending-experiment-35.5; 6 erhaltene Originalhinweise; 7 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 3,6 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Krokettengröße: 4 bis 15 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Stromversorgung: 5 V Netzteil plus 3 D-Batterien** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **App: PawSync App** — Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Portionierung: Gewichtskontrollierte Ausgabe mit integrierter Napfwaage** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Batterie: Nicht vom Hersteller ausgewiesen** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.

**Nachher gerendert**

- **Kapazität: 3,6 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Krokettengröße: 4 bis 15 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Stromversorgung: 5 V Netzteil plus 3 D-Batterien** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **App: PawSync App** — Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Portionierung: Gewichtskontrollierte Ausgabe mit integrierter Napfwaage** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Batterie: Nicht vom Hersteller ausgewiesen** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.

**Offene Eingaben**

- Kamera: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Napf: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Reinigung: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- WLAN: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Batterie: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

**Ausstehend wegen 35.5:** Krokettengröße: WRONG_DECISION_CONTEXT; Krokettengröße: GENERIC_CONSEQUENCE; Stromversorgung: GENERIC_CONSEQUENCE; Batterie: UNSUPPORTED_GENERALIZATION. Keine Änderung am geschützten Rendering.

### petkit-eversweet-3-pro-uvc

Status: improved; 6 erhaltene Originalhinweise; 1 unklare Eingabewerte.

**Vorher gerendert**

- **Nutzbare Kapazität: 1,6 Liter beziehungsweise 54 fl. oz.** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Maximales Behältervolumen: 1,8 Liter laut Verpackung und älterer Anleitung; PETKIT weist 1,6 Liter als tatsächlich nutzbar aus** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Materialien: BPA-freies ABS, Silikon, Polypropylen und Edelstahl 304** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Hauptfilter: PETKIT Filter Unit 3.0, Modell P4161** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Filteraufbau: Hochdichtes Filtervlies, Kokos-Aktivkohle und Ionenaustauschharz** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Zusätzlicher Pumpenschutz: Feines Einlassgitter und austauschbarer Schwamm** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.

**Nachher gerendert**

- **Nutzbare Kapazität: 1,6 Liter beziehungsweise 54 fl. oz.** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Wasserreserve bei Stromausfall / Stromversorgung: Etwa 60 ml in der Trinkschale · USB-Stromkabel; Netzteil ist laut aktueller Produktseite nicht enthalten** — Unterscheide frei zugängliches Restwasser von weiterlaufender Wasserförderung: Eine dokumentierte Reserve belegt keinen Pumpenbetrieb bei Stromausfall.
- **Reinigung: Vollständig zerlegbar; alle Komponenten von Hand reinigen** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Filterwechsel / Hauptfilter: PETKIT nennt je nach Seite ungefähr 2 bis 4 Wochen beziehungsweise rund 4 Wochen · PETKIT Filter Unit 3.0, Modell P4161** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Trinkmengenmessung: Nein** — Ohne dokumentierte Trinkmengenmessung lässt sich aus Pumpenlaufzeit oder Tankstand keine Trinkmenge eines einzelnen Tieres ableiten.
- **Direkte Verbindung: Bluetooth** — Bluetooth belegt eine Verbindung im Nahbereich; ein Fernzugriff von unterwegs ist damit allein nicht zugesichert.

**Offene Eingaben**

- Wasserbehälter: Edelstahl 304 (INVALID_UNIT)

### petkit-eversweet-5-mini

Status: improved; 6 erhaltene Originalhinweise; 4 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 1 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: Keramik, PP und Silikon** — Keramik ist schwer und standfest, kann bei Stößen aber beschädigt werden.
- **Stromversorgung: Netzbetrieb** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Filter: Mehrstufig** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Gewicht: 1,4 kg** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Lautstärke: Nicht vom Hersteller ausgewiesen** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.

**Nachher gerendert**

- **Kapazität: 1 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Reinigung: Regelmäßig vollständig zerlegen und von Hand reinigen** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Stromversorgung / Akku: Netzbetrieb · Nein** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Filter: Mehrstufig** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Verbindung: Bluetooth** — Bluetooth belegt eine Verbindung im Nahbereich; ein Fernzugriff von unterwegs ist damit allein nicht zugesichert.
- **Geeignet für: Katzen und kleine Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.

**Offene Eingaben**

- Lautstärke: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- UV: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Trinkhöhe: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Wasserfluss: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### petkit-eversweet-max-2-uvc

Status: improved; 6 erhaltene Originalhinweise; 2 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 3 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: BPA-freies ABS und Edelstahl 304** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Stromversorgung: USB 5 V/1 A und integrierter Akku** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Lautstärke: Herstellerangabe bis 26 dB** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Filter: Mehrstufiger Filter und Pumpenvorfilter** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Abmessungen: 265 × 171 × 191 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.

**Nachher gerendert**

- **Kapazität: 3 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Reinigung: Laut Hersteller vollständig spülmaschinengeeignet** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Stromversorgung: USB 5 V/1 A und integrierter Akku** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Filter: Mehrstufiger Filter und Pumpenvorfilter** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **App: PETKIT App über Bluetooth** — Bluetooth belegt eine Verbindung im Nahbereich; ein Fernzugriff von unterwegs ist damit allein nicht zugesichert.
- **Akkulaufzeit: Herstellerangabe bis 83 Tage** — Die Akkuangabe allein belegt keine Laufzeit im Dauerbetrieb. Vergleiche sie mit dem dokumentierten Betriebsmodus, bevor du einen Standort ohne Steckdose wählst.

**Offene Eingaben**

- Trinkhöhe: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Wasserfluss: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### petkit-eversweet-max-cordless

Status: improved; 6 erhaltene Originalhinweise; 2 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 3 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: BPA-freies ABS und Edelstahl 304** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Stromversorgung: USB-Kabel und integrierter Lithium-Akku** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Lautstärke: Herstellerangabe etwa 26 dB** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Filter: Mehrstufige Einweg-Zirkulationsfilterung** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Filterwechsel: Herstellerempfehlung etwa alle zwei bis vier Wochen** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.

**Nachher gerendert**

- **Kapazität: 3 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Reinigung: Tank, Trinkfläche, Filterhalter und Pumpe regelmäßig vollständig reinigen. Filter je nach Wasserqualität etwa alle zwei bis vier Wochen wechseln.** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Filterwechsel / Filter: Herstellerempfehlung etwa alle zwei bis vier Wochen · mehrstufige Einweg-Zirkulationsfilterung** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Stromversorgung: USB-Kabel und integrierter Lithium-Akku** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **App: PETKIT-App über Bluetooth** — Bluetooth belegt eine Verbindung im Nahbereich; ein Fernzugriff von unterwegs ist damit allein nicht zugesichert.
- **Akkulaufzeit: Herstellerangabe bis 83 Tage** — Die Akkuangabe allein belegt keine Laufzeit im Dauerbetrieb. Vergleiche sie mit dem dokumentierten Betriebsmodus, bevor du einen Standort ohne Steckdose wählst.

**Offene Eingaben**

- Trinkhöhe: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Wasserfluss: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### petkit-eversweet-solo-2-fountain

Status: pending-experiment-35.5; 6 erhaltene Originalhinweise; 3 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 2 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Lautstärke: Herstellerangabe bis 25 dB** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Filter: Mehrstufig mit Aktivkohle und Ionenaustauscher** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Ersatzfilter: Filter Unit 3.0; Herstellerempfehlung alle 4 Wochen** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Akku: Nein; dauerhafter Netzbetrieb erforderlich** — Kein integrierter Akku: Ohne Netzstrom läuft das Gerät nur weiter, wenn eine separate Batterie- oder Notstromlösung ausdrücklich vorgesehen ist.
- **Gewicht: 0,8 kg** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Nachher gerendert**

- **Kapazität: 2 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Lautstärke: Herstellerangabe bis 25 dB** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Filter: Mehrstufig mit Aktivkohle und Ionenaustauscher** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Ersatzfilter: Filter Unit 3.0; Herstellerempfehlung alle 4 Wochen** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Akku: Nein; dauerhafter Netzbetrieb erforderlich** — Kein integrierter Akku: Ohne Netzstrom läuft das Gerät nur weiter, wenn eine separate Batterie- oder Notstromlösung ausdrücklich vorgesehen ist.
- **Gewicht: 0,8 kg** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Offene Eingaben**

- App: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Trinkhöhe: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Wasserfluss: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

**Ausstehend wegen 35.5:** Lautstärke: GENERIC_CONSEQUENCE; Filter: DUPLICATE_CONSEQUENCE; Filter: UNSUPPORTED_GENERALIZATION; Ersatzfilter: DUPLICATE_CONSEQUENCE; Ersatzfilter: EQUIVALENT_DECISION_TOPIC; Ersatzfilter: UNSUPPORTED_GENERALIZATION; Gewicht: GENERIC_CONSEQUENCE. Keine Änderung am geschützten Rendering.

### petkit-eversweet-solo-se

Status: pending-experiment-35.5; 6 erhaltene Originalhinweise; 2 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 1,8 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Stromversorgung: USB-Kabel, 5 V/1 A; Netzteil nicht enthalten** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Lautstärke: Herstellerangabe bis 25 dB** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Filter: Mehrstufig** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Filterwechsel: Herstellerempfehlung etwa alle vier Wochen** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.

**Nachher gerendert**

- **Kapazität: 1,8 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Stromversorgung: USB-Kabel, 5 V/1 A; Netzteil nicht enthalten** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Lautstärke: Herstellerangabe bis 25 dB** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Filter: Mehrstufig** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Filterwechsel: Herstellerempfehlung etwa alle vier Wochen** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.

**Offene Eingaben**

- UV: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Trinkhöhe: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

**Ausstehend wegen 35.5:** Stromversorgung: GENERIC_CONSEQUENCE; Lautstärke: GENERIC_CONSEQUENCE; Filter: DUPLICATE_CONSEQUENCE; Filter: UNSUPPORTED_GENERALIZATION; Filterwechsel: DUPLICATE_CONSEQUENCE; Filterwechsel: EQUIVALENT_DECISION_TOPIC; Filterwechsel: UNSUPPORTED_GENERALIZATION. Keine Änderung am geschützten Rendering.

### petkit-eversweet-ultra

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 5 Liter Frischwasser plus 1,8 Liter Abwasser** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Klassischer Hauptfilter: Nein** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **App: PETKIT-App** — Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Lautstärke: Herstellerangabe höchstens etwa 26 dB im Normalbetrieb; beim Spülen und Nachfüllen höher** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Stromversorgung: Netzbetrieb mit 12 V/2 A** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Akku: Nein** — Kein integrierter Akku: Ohne Netzstrom läuft das Gerät nur weiter, wenn eine separate Batterie- oder Notstromlösung ausdrücklich vorgesehen ist.

**Nachher gerendert**

- **Kapazität: 5 Liter Frischwasser plus 1,8 Liter Abwasser** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Spülmaschinengeeignete Teile: Trinkschale, Auslauf und magnetisches Sieb laut PETKIT** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Abo: Optionales Abonnement für erweiterte Video- und Auswertungsfunktionen** — Vergleiche die dokumentierten Pflicht- und Zusatzkosten über die geplante Nutzungszeit; optionale Dienste und notwendige Verbrauchsmaterialien getrennt rechnen.
- **Stromversorgung / Akku: Netzbetrieb mit 12 V/2 A · Nein** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Klassischer Hauptfilter: Nein** — Die dokumentierte Filterausstattung ersetzt keine Reinigung; plane für dieses Modell nur die tatsächlich angegebenen Ersatzteile ein.
- **WLAN: 2,4 und 5 GHz** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.

### petkit-fresh-element-infinity

Status: improved; 6 erhaltene Originalhinweise; 5 unklare Eingabewerte.

**Vorher gerendert**

- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Kapazität: 5 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Stromversorgung: Netzteil mit integriertem Akku** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Portionierung: App-gesteuerte Portionierung; integrierte Napfwaage erfasst die Futtermenge** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Batterie: Nicht vom Hersteller ausgewiesen** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Gewicht: Nicht vom Hersteller ausgewiesen** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Nachher gerendert**

- **Portionierung: App-gesteuerte Portionierung; integrierte Napfwaage erfasst die Futtermenge** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Futterart: Trockenfutter** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Stromversorgung: Netzteil mit integriertem Akku** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Kapazität: 5 Liter** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.
- **Geeignet für: Katzen und kleine Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.
- **App-Steuerung: Ja** — Prüfe die dokumentierten App- und Kontovoraussetzungen vor dem Kauf; App-Unterstützung allein belegt keinen Fernzugriff und keinen Betrieb bei Cloud-Ausfall.

**Offene Eingaben**

- Reinigung: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- WLAN: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Batterie: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### petkit-fresh-element-solo

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Krokettengröße Trockenfutter: Höchstens 12 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Krokettengröße gefriergetrocknet: Aktuelle Produktseite nennt höchstens 9 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Kapazität: 3 Liter beziehungsweise 12 Cups** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Gewicht des Vorrats: Herstellerschätzung etwa 1,33 kg; abhängig von der Schüttdichte** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Portionen je Mahlzeit: 1 bis 5 Portionseinheiten** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Portionsgröße: Herstellerangabe ungefähr 10 g beziehungsweise 1/12 Cup je Einheit** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.

**Nachher gerendert**

- **Krokettengröße Trockenfutter / Krokettengröße gefriergetrocknet: Höchstens 12 mm · aktuelle Produktseite nennt höchstens 9 mm** — Miss die längste Seite des verwendeten Futters und halte die angegebene Größenfreigabe ein; eine passende Behältergröße sagt nichts über die Eignung der Kroketten aus.
- **Portionen je Mahlzeit: 1 bis 5 Portionseinheiten** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Tiererkennung: Nein** — Prüfe die dokumentierte Zugangskontrolle pro Tier, wenn unterschiedliche Rationen oder Diätfutter getrennt bleiben müssen.
- **Offline-Betrieb: Gespeicherte Fütterungspläne laufen ohne Internetverbindung weiter** — Richte den Futterplan vorab ein und prüfe das dokumentierte Offline-Verhalten. Ein App-Protokoll allein belegt keine tatsächlich ausgegebene Mahlzeit.
- **Netzbetrieb / Batterie-Backup: USB-Stromkabel; aktuelle Herstellerseite nennt 5 V/1 A und weist darauf hin, dass der Adapter nicht enthalten ist · 5 AAA-Alkalibatterien, nicht enthalten** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Frischhaltesystem: Dichtungsring, Trockenmittelfach und geschlossener Auslass** — Plane die Futterstandzeit nach der dokumentierten Kühl- oder Frischhaltetechnik; die Angabe ist keine allgemeine Haltbarkeitsgarantie für jede Futterart.

### petkit-puramax-2

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Abmessungen: 620 × 538 × 552 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Gewicht: 10 kg** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Katzengewicht: 1,5 bis 10 kg; laut Hersteller ab sechs Monaten** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Kapazität: 76-Liter-Zylinder; 7-Liter-Abfallfach** — Die Größe beeinflusst, wie häufig nachgefüllt oder gewartet werden muss.
- **Stromversorgung: 12 V / 2 A** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Streu-Kompatibilität: Geeignet: Bentonitstreu, klumpende Mineralstreu, Tofu-Streu und Mischstreu · Nicht geeignet: nicht klumpende Streu** — Klumpstreu erforderlich · max. 12 mm Länge / 3 mm Durchmesser.

**Nachher gerendert**

- **Sicherheit: Elf Sensoren und Anti-Pinch-Struktur laut Hersteller; keine Sicherheitsgarantie** — Die dokumentierten Schutzfunktionen sind keine Sicherheitsgarantie. Halte die Alters- und Gewichtsgrenzen ein und beobachte die Eingewöhnung und ersten Reinigungszyklen.
- **Katzengewicht: 1,5 bis 10 kg; laut Hersteller ab sechs Monaten** — Nutze die Automatik nur innerhalb der dokumentierten Alters- und Gewichtsgrenzen; besonders leichte oder junge Katzen sind nicht pauschal freigegeben.
- **Streu-Kompatibilität: Geeignet: Bentonitstreu, klumpende Mineralstreu, Tofu-Streu und Mischstreu · Nicht geeignet: nicht klumpende Streu** — Klumpstreu erforderlich · max. 12 mm Länge / 3 mm Durchmesser.
- **Stromversorgung: 12 V / 2 A** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Einstieg: 200 mm; Öffnung 200 × 255 mm** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.
- **Kapazität: 76-Liter-Zylinder; 7-Liter-Abfallfach** — Plane die Entleerung nach Anzahl der Katzen und tatsächlicher Nutzung. Das Behältervolumen oder eine Maximaldauer ist keine feste Wartungsfrist.

### petkit-purobot-crystal-duo

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Gewicht: Ca. 5,65 kg** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Streu-Kompatibilität: Geeignet: Kristallstreu · Nicht geeignet: Bentonitstreu, klumpende Mineralstreu, Tofu-Streu, Pflanzenfaserstreu, Holzstreu, Pellets, Papierstreu und Mischstreu** — Herstellersystem erforderlich.

**Nachher gerendert**

- **Katzenprofil: Ab 6 Monaten und über 1,5 kg; kein oberes Gewicht ausgewiesen** — Nutze die Automatik nur innerhalb der dokumentierten Alters- und Gewichtsgrenzen; besonders leichte oder junge Katzen sind nicht pauschal freigegeben.
- **Streu-Kompatibilität: Geeignet: Kristallstreu · Nicht geeignet: Bentonitstreu, klumpende Mineralstreu, Tofu-Streu, Pflanzenfaserstreu, Holzstreu, Pellets, Papierstreu und Mischstreu** — Herstellersystem erforderlich.
- **Einstieg: 180 mm** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.
- **Reinigungssystem: Offene Schale, Zwei-Wege-Rechen und zwei seitliche Abfallfallen** — Plane neben den automatischen Zyklen die dokumentierte manuelle Reinigung ein; automatische Trennung bedeutet keine selbstständige Grundreinigung.
- **App/WLAN: PETKIT App; 2,4- und 5-GHz-WLAN laut EU-Produktseite** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Kamera: Fester Schalenblick, Einweg-Audio, Livebild und Ereignisclips; Kamera abschalt- und zeitplanbar** — Prüfe den dokumentierten Bildbereich: Eine Kameraansicht belegt nicht die tatsächlich gefressene Menge oder eine vollständige Überwachung des Tieres.

### petkit-purobot-max-3

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Abmessungen: 620 × 538 × 552 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Eigengewicht: 10 kg** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Katzengewicht: 1,5 bis 10 kg; Hersteller nennt zusätzlich 6+ Monate** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Kamera: Keine Kamera dokumentiert; Funktionen des MAX PRO 2 werden nicht übertragen** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Streu-Kompatibilität: Geeignet: Bentonitstreu, klumpende Mineralstreu, Tofu-Streu und Mischstreu · Nicht geeignet: nicht klumpende Streu** — Klumpstreu erforderlich · max. 12 mm Länge / 3 mm Durchmesser.

**Nachher gerendert**

- **Sicherheit: 12 Sensoren plus mechanisch dauerhaft offene Eingangsstruktur laut Hersteller; keine Sicherheitsgarantie** — Die dokumentierten Schutzfunktionen sind keine Sicherheitsgarantie. Halte die Alters- und Gewichtsgrenzen ein und beobachte die Eingewöhnung und ersten Reinigungszyklen.
- **Katzengewicht: 1,5 bis 10 kg; Hersteller nennt zusätzlich 6+ Monate** — Nutze die Automatik nur innerhalb der dokumentierten Alters- und Gewichtsgrenzen; besonders leichte oder junge Katzen sind nicht pauschal freigegeben.
- **Streu-Kompatibilität: Geeignet: Bentonitstreu, klumpende Mineralstreu, Tofu-Streu und Mischstreu · Nicht geeignet: nicht klumpende Streu** — Klumpstreu erforderlich · max. 12 mm Länge / 3 mm Durchmesser.
- **Strom: 12 V / 2 A, 24 W** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Einstieg: 204 mm; Öffnung 267 × 273 mm laut Herstellervergleich** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.
- **Abfallfach: 7 Liter; bis 15 Tage bei einer Katze ist eine Hersteller-Maximalangabe** — Plane die Entleerung nach Anzahl der Katzen und tatsächlicher Nutzung. Das Behältervolumen oder eine Maximaldauer ist keine feste Wartungsfrist.

### petkit-purobot-max-pro-2

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Abmessungen: 657 x 538 x 603 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Produktgewicht: Ca. 11 kg** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Katzengewicht: 1,5 bis 10 kg; unter 1,5 kg nicht fuer Automatik empfohlen** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Streu-Kompatibilität: Geeignet: Bentonitstreu, klumpende Mineralstreu, Tofu-Streu und Mischstreu · Nicht geeignet: nicht klumpende Streu** — Klumpstreu erforderlich · max. 12 mm Länge / 3 mm Durchmesser.

**Nachher gerendert**

- **Sicherheit: 12 Sensoren und Anti-Pinch-Konstruktion laut Hersteller** — Die dokumentierten Schutzfunktionen sind keine Sicherheitsgarantie. Halte die Alters- und Gewichtsgrenzen ein und beobachte die Eingewöhnung und ersten Reinigungszyklen.
- **Katzengewicht: 1,5 bis 10 kg; unter 1,5 kg nicht fuer Automatik empfohlen** — Nutze die Automatik nur innerhalb der dokumentierten Alters- und Gewichtsgrenzen; besonders leichte oder junge Katzen sind nicht pauschal freigegeben.
- **Streu-Kompatibilität: Geeignet: Bentonitstreu, klumpende Mineralstreu, Tofu-Streu und Mischstreu · Nicht geeignet: nicht klumpende Streu** — Klumpstreu erforderlich · max. 12 mm Länge / 3 mm Durchmesser.
- **Strom: 12 V / 2 A, 24 W** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Einstieg: 255 mm hoch; Oeffnung 267 x 273 mm** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.
- **Abfallfach: 8 Liter; bis 17 Tage ist eine Hersteller-Maximalangabe fuer eine Katze** — Plane die Entleerung nach Anzahl der Katzen und tatsächlicher Nutzung. Das Behältervolumen oder eine Maximaldauer ist keine feste Wartungsfrist.

### petkit-yumshare-dual-hopper

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Gesamtkapazität: 5 Liter beziehungsweise 21 Cups** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Krokettengröße Trockenfutter: Höchstens 12 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Krokettengröße gefriergetrocknet: Höchstens 9 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Portionen je Mahlzeit: 1 bis 10 Portionseinheiten pro Kammer** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Nominelle Portionsspanne: PETKIT nennt 10 bis 100 g pro Kammer und Mahlzeit; tatsächliches Gewicht hängt vom Futter und der Kammer ab** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Portionsmessung: Volumetrisch; keine integrierte Waage** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.

**Nachher gerendert**

- **Krokettengröße Trockenfutter / Krokettengröße gefriergetrocknet: Höchstens 12 mm · höchstens 9 mm** — Miss die längste Seite des verwendeten Futters und halte die angegebene Größenfreigabe ein; eine passende Behältergröße sagt nichts über die Eignung der Kroketten aus.
- **Portionen je Mahlzeit: 1 bis 10 Portionseinheiten pro Kammer** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Tiererkennung: AI-Gesichtserkennung; aktuelle offizielle Seiten nennen je nach Region bis zu 15 beziehungsweise 20 Tiere** — Mehrere Näpfe teilen das Futter räumlich auf; sie belegen keine getrennte Ration oder Zugangskontrolle pro Tier.
- **Offline-Betrieb: Gespeicherte Fütterungspläne laufen ohne Internet weiter** — Richte den Futterplan vorab ein und prüfe das dokumentierte Offline-Verhalten. Ein App-Protokoll allein belegt keine tatsächlich ausgegebene Mahlzeit.
- **Abo: Nein** — Vergleiche die dokumentierten Pflicht- und Zusatzkosten über die geplante Nutzungszeit; optionale Dienste und notwendige Verbrauchsmaterialien getrennt rechnen.
- **Netzbetrieb / Batterie-Backup: DC 6 V / 2 A · 4 D-Alkalibatterien, nicht enthalten** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.

### petkit-yumshare-solo-2

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 3 Liter beziehungsweise 12 Cups** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Portionen: 1 bis 5 Portionen pro Mahlzeit; Herstellerdarstellung ungefähr 10 bis 50 g** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **App: PETKIT-App** — Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Stromversorgung: 6-V-Netzteil; Backup-Stromversorgung vorhanden** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Batterie-Backup: Laut aktueller PETKIT-Produktseite bis zu 14 Tage mit fünf AAA-Alkaline-Batterien** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Batteriemodus: Kamera laut Hersteller deaktiviert** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.

**Nachher gerendert**

- **Portionen: 1 bis 5 Portionen pro Mahlzeit; Herstellerdarstellung ungefähr 10 bis 50 g** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Futterart: Trockenfutter; Kroketten bis 12 mm und gefriergetrocknete Stücke bis 9 mm laut Hersteller** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Offline-Verhalten: Gespeicherte Mahlzeiten laufen laut Hersteller bei WLAN-Ausfall weiter** — Richte den Futterplan vorab ein und prüfe das dokumentierte Offline-Verhalten. Ein App-Protokoll allein belegt keine tatsächlich ausgegebene Mahlzeit.
- **Abo: Optionales Abonnement für Video-Wiedergabe, erweiterter Cloudspeicher** — Vergleiche die dokumentierten Pflicht- und Zusatzkosten über die geplante Nutzungszeit; optionale Dienste und notwendige Verbrauchsmaterialien getrennt rechnen.
- **Stromversorgung / Batterie-Backup: 6-V-Netzteil; Backup-Stromversorgung vorhanden · laut aktueller PETKIT-Produktseite bis zu 14 Tage mit fünf AAA-Alkaline-Batterien** — Prüfe, welche Funktionen laut Dokumentation im Backup weiterlaufen; Batterie-Backup bedeutet weder volle App-Funktion noch unbegrenzte Überbrückung.
- **Reinigung: Edelstahlnapf regelmäßig reinigen, Behälter trocken halten und Futterweg auf Krümel beziehungsweise Fettbelag prüfen. Nach jedem Futterwechsel mehrere Portionen nachwiegen.** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.

### petlibro-air-automatic-feeder

Status: improved; 6 erhaltene Originalhinweise; 5 unklare Eingabewerte.

**Vorher gerendert**

- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Kapazität: 2 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Stromversorgung: USB-C-Netzteil oder 3 D-Batterien** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **WLAN: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Batterie: Nicht vom Hersteller ausgewiesen** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Gewicht: Nicht vom Hersteller ausgewiesen** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Nachher gerendert**

- **Futterart: Trockenfutter, Kroketten etwa 2 bis 15 mm** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Stromversorgung: USB-C-Netzteil oder 3 D-Batterien** — Plane passende Ersatzbatterien nach dem dokumentierten Batterietyp ein; aus der Stromquelle allein folgt keine feste Laufzeit.
- **Mahlzeiten: Bis zu 6 pro Tag** — Gleiche die Zahl und Verteilung der planbaren Ausgaben mit dem Tagesplan deines Tieres ab; mehrere Ausgaben ersetzen keine Kontrolle der Tagesration.
- **Kapazität: 2 Liter** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.
- **Geeignet für: Katzen und kleine Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.
- **App-Steuerung: Nein** — Ohne diese dokumentierte Verbindung steht dieser Bedienweg nicht zur Verfügung; daraus folgt keine Zusage über andere App-, Cloud- oder Offline-Funktionen.

**Offene Eingaben**

- Napf: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Reinigung: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Batterie: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### petlibro-air-wifi-feeder

Status: improved; 6 erhaltene Originalhinweise; 1 unklare Eingabewerte.

**Vorher gerendert**

- **Krokettengröße: 2 bis 15 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Kapazität: 2 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Portionen je Mahlzeit: 1 bis 16 Portionseinheiten** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Volumen je Portion: 10,4 ml beziehungsweise 1/24 Cup** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Portionsgewicht: Nicht fest; abhängig von Form, Größe und Dichte des Futters** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.

**Nachher gerendert**

- **Krokettengröße / Futterart: 2 bis 15 mm · Trockenfutter** — Miss die längste Seite des verwendeten Futters und halte die angegebene Größenfreigabe ein; eine passende Behältergröße sagt nichts über die Eignung der Kroketten aus.
- **Portionen je Mahlzeit: 1 bis 16 Portionseinheiten** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Tiererkennung: Nein** — Prüfe die dokumentierte Zugangskontrolle pro Tier, wenn unterschiedliche Rationen oder Diätfutter getrennt bleiben müssen.
- **Offline-Betrieb: Gespeicherte Zeitpläne laufen ohne Internet weiter** — Richte den Futterplan vorab ein und prüfe das dokumentierte Offline-Verhalten. Ein App-Protokoll allein belegt keine tatsächlich ausgegebene Mahlzeit.
- **Netzbetrieb: 5 V/1 A; dauerhafte Verbindung laut Hersteller möglich** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Frischhaltesystem: Rotorverschluss, Deckeldichtung und Trockenmittelfach** — Plane die Futterstandzeit nach der dokumentierten Kühl- oder Frischhaltetechnik; die Angabe ist keine allgemeine Haltbarkeitsgarantie für jede Futterart.

**Offene Eingaben**

- Akkutausch: nicht vom Nutzer austauschbar (UNSUPPORTED_BATTERY)

### petlibro-capsule-dog-fountain

Status: improved; 6 erhaltene Originalhinweise; 5 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 2,1 Gallonen, etwa 7,95 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Stromversorgung: USB 5 V/1 A, Kabel etwa 2 m** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Notstromreserve: Herstellerangabe bis 16 Stunden** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Lautstärke: Herstellerangabe 28 dB** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Filter: Fünfstufig** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Filterwechsel: Herstellerempfehlung etwa alle zwei Wochen** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.

**Nachher gerendert**

- **Kapazität: 2,1 Gallonen, etwa 7,95 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Reinigung: Wasser regelmäßig vollständig austauschen. Tank, Trinkschale, Filterbereich und Pumpe mindestens wöchentlich reinigen.** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Filterwechsel / Filter: Herstellerempfehlung etwa alle zwei Wochen · fünfstufig** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Stromversorgung / Notstromreserve: USB 5 V/1 A, Kabel etwa 2 m · Herstellerangabe bis 16 Stunden** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Lautstärke: Herstellerangabe 28 dB** — Ein Herstellerwert in dB ist nur bei gleichen Messbedingungen vergleichbar. Prüfe den Aufstellort besonders bei Nutzung im Schlafzimmer.
- **Geeignet für: Mittelgroße und große Hunde ab etwa 27 cm Schulterhöhe** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.

**Offene Eingaben**

- UV: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Trinkhöhe: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Wasserfluss: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### petlibro-dockstream-2-smart-cordless

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 3 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: ABS-Kunststoff und Edelstahl** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Abmessungen: 246 × 200 × 198 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Gewicht: 1,89 kg** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Akkukapazität: 5200 mAh** — Ein Akku ermöglicht Betrieb ohne permanente Stromverbindung. Entscheidend bleiben reale Laufzeit, Ladezeit und die Nutzung während des Ladens.
- **Akkulaufzeit: Laut Hersteller bis zu 30 Tage bei einer Katze, 30 Sitzungen täglich und je 45 Sekunden** — Ein Akku ermöglicht Betrieb ohne permanente Stromverbindung. Entscheidend bleiben reale Laufzeit, Ladezeit und die Nutzung während des Ladens.

**Nachher gerendert**

- **Kapazität: 3 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Reinigung: Handwäsche; nicht spülmaschinengeeignet** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Ersatzfilter / Filterung: Dockstream Ersatzfilter; 4-stufige Filterung, Wechsel bei einem Haustier etwa alle 2 Wochen, bei mehreren Tieren häufiger · vierstufig** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **WLAN: 2,4 und 5 GHz** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Akkukapazität: 5200 mAh** — Die Akkuangabe allein belegt keine Laufzeit im Dauerbetrieb. Vergleiche sie mit dem dokumentierten Betriebsmodus, bevor du einen Standort ohne Steckdose wählst.
- **Lautstärke: 23 dB laut Hersteller für Dockstream 2** — Ein Herstellerwert in dB ist nur bei gleichen Messbedingungen vergleichbar. Prüfe den Aufstellort besonders bei Nutzung im Schlafzimmer.

### petlibro-dockstream-2-smart

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 3 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: ABS-Kunststoff und Edelstahl** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Abmessungen: 246 × 200 × 198 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Gewicht: Etwa 1,77 kg** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Stromversorgung: Ausschließlich Netzbetrieb** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Akku: Nein** — Kein integrierter Akku: Ohne Netzstrom läuft das Gerät nur weiter, wenn eine separate Batterie- oder Notstromlösung ausdrücklich vorgesehen ist.

**Nachher gerendert**

- **Kapazität: 3 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Reinigung: Abnehmbarer Tank und spülmaschinenfeste Edelstahlschale; Rotor ausspülbar** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Abo: Optionales Abonnement für erweiterte Verlaufsauswertung, Care-Erinnerungen und Dashboard** — Vergleiche die dokumentierten Pflicht- und Zusatzkosten über die geplante Nutzungszeit; optionale Dienste und notwendige Verbrauchsmaterialien getrennt rechnen.
- **Ersatzfilter / Filterung: 4-stufiger Filter; für ein Haustier etwa alle 2 Wochen ersetzen, bei mehreren Tieren häufiger · vierstufig** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Stromversorgung / Akku: Ausschließlich Netzbetrieb · Nein** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **WLAN: 2,4 und 5 GHz** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.

### petlibro-dockstream-cordless

Status: pending-experiment-35.5; 6 erhaltene Originalhinweise; 3 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 2,5 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Stromversorgung: Netz- und Akkubetrieb** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Lautstärke: Herstellerangabe 23 dB** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Filter: Vierstufig** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Filterwechsel: Herstellerempfehlung etwa alle zwei Wochen** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.

**Nachher gerendert**

- **Kapazität: 2,5 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Stromversorgung: Netz- und Akkubetrieb** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Lautstärke: Herstellerangabe 23 dB** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Filter: Vierstufig** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Filterwechsel: Herstellerempfehlung etwa alle zwei Wochen** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.

**Offene Eingaben**

- UV: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Trinkhöhe: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Wasserfluss: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

**Ausstehend wegen 35.5:** Stromversorgung: GENERIC_CONSEQUENCE; Lautstärke: GENERIC_CONSEQUENCE; Filter: DUPLICATE_CONSEQUENCE; Filter: UNSUPPORTED_GENERALIZATION; Filterwechsel: DUPLICATE_CONSEQUENCE; Filterwechsel: EQUIVALENT_DECISION_TOPIC; Filterwechsel: UNSUPPORTED_GENERALIZATION. Keine Änderung am geschützten Rendering.

### petlibro-dockstream-rfid-smart

Status: improved; 6 erhaltene Originalhinweise; 3 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 3 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: ABS und Edelstahl** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **App: PETLIBRO-App** — Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Stromversorgung: Kabelgebunden, 5 V/1 A** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Lautstärke: Herstellerangabe 23 dB** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Filter: Mehrstufig** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.

**Nachher gerendert**

- **Kapazität: 3 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Reinigung: Tank, Trinkfläche, Rotor und Filterbereich regelmäßig reinigen. Filter etwa alle zwei Wochen wechseln.** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Filterwechsel / Filter: Herstellerempfehlung etwa alle zwei Wochen · mehrstufig** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Stromversorgung / Akku: Kabelgebunden, 5 V/1 A · Nein** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Verbindung: 2,4-GHz-WLAN** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Lautstärke: Herstellerangabe 23 dB** — Ein Herstellerwert in dB ist nur bei gleichen Messbedingungen vergleichbar. Prüfe den Aufstellort besonders bei Nutzung im Schlafzimmer.

**Offene Eingaben**

- UV: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Trinkhöhe: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Wasserfluss: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### petlibro-glacier-ultrafiltration

Status: improved; 6 erhaltene Originalhinweise; 3 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 2,5 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: SUS 304 Edelstahl** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Stromversorgung: Netzbetrieb** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Filter: Ultrafiltrationsmodul** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Abmessungen: 265 × 220 × 167 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.

**Nachher gerendert**

- **Kapazität: 2,5 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Reinigung: Tank laut Hersteller spülmaschinengeeignet** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Stromversorgung / Akku: Netzbetrieb · Nein** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Filter: Ultrafiltrationsmodul** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Geeignet für: Katzen und kleine Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.
- **App: Nein** — Ohne diese dokumentierte Verbindung steht dieser Bedienweg nicht zur Verfügung; daraus folgt keine Zusage über andere App-, Cloud- oder Offline-Funktionen.

**Offene Eingaben**

- Lautstärke: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- UV: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Trinkhöhe: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### petlibro-granary-2-vision-duo

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

Keine öffentliche Ausgabe (gesperrter Entwurf).

**Nachher gerendert**

Keine öffentliche Ausgabe (gesperrter Entwurf).

**Automatisch erzeugter Entwurf nachher (nicht veröffentlicht)**

- **Näpfe: Zwei** — Mehrere Näpfe teilen das Futter räumlich auf; sie belegen keine getrennte Ration oder Zugangskontrolle pro Tier.
- **Stromversorgung: Netzteil, DC 5 V / 2 A laut Handbuch** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **WLAN: 2,4 GHz / 5 GHz laut modellspezifischem Handbuch** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Kapazität: 5 Liter** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.
- **Kamera: Vorhanden** — Prüfe den dokumentierten Bildbereich: Eine Kameraansicht belegt nicht die tatsächlich gefressene Menge oder eine vollständige Überwachung des Tieres.
- **Abmessungen: 344 × 338 × 380 mm laut Handbuch** — Miss den vorgesehenen Stellplatz vor dem Kauf aus und berücksichtige zusätzlich den Zugang zum Befüllen und Reinigen.

### petlibro-granary-2-vision

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 5 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Portionierung: Geplante Mahlzeiten und Smart Refill; ausgegebene und verbleibende Futtermenge werden laut Hersteller über die integrierte Waage erfasst** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Krokettengröße: 2 bis 18 mm; keine übergroßen oder unregelmäßigen Formen** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Stromversorgung: Netzbetrieb und wiederaufladbarer Akku** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Material: Gehäuse aus BPA-freiem ABS und Silikon; Edelstahlnapf** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Abmessungen: 357 × 180 × 356 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.

**Nachher gerendert**

- **Krokettengröße / Futterart: 2 bis 18 mm; keine übergroßen oder unregelmäßigen Formen · Trockenfutter** — Miss die längste Seite des verwendeten Futters und halte die angegebene Größenfreigabe ein; eine passende Behältergröße sagt nichts über die Eignung der Kroketten aus.
- **Portionierung: Geplante Mahlzeiten und Smart Refill; ausgegebene und verbleibende Futtermenge werden laut Hersteller über die integrierte Waage erfasst** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Tiererkennung: KI-Zuordnung von Aufnahmen und Protokollen; keine Zugangssperre** — Prüfe die dokumentierte Zugangskontrolle pro Tier, wenn unterschiedliche Rationen oder Diätfutter getrennt bleiben müssen.
- **Stromversorgung / Backup: Netzbetrieb und wiederaufladbarer Akku · laut Variantenspezifikation bis zu 48 Stunden** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **WLAN: 2,4 und 5 GHz** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Kapazität: 5 Liter** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.

### petlibro-granary-2

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

Keine öffentliche Ausgabe (gesperrter Entwurf).

**Nachher gerendert**

Keine öffentliche Ausgabe (gesperrter Entwurf).

**Automatisch erzeugter Entwurf nachher (nicht veröffentlicht)**

- **Näpfe: Ein Napf** — Prüfe die dokumentierte Zugangskontrolle pro Tier, wenn unterschiedliche Rationen oder Diätfutter getrennt bleiben müssen.
- **Stromversorgung: Netzteil, DC 5 V / 2 A laut Handbuch** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **WLAN: 2,4 GHz / 5 GHz laut modellspezifischem Handbuch** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Kapazität: 5 Liter** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.
- **Kamera: Nein** — Ohne Kamera ist keine visuelle Kontrolle über dieses Gerät möglich; Statusmeldungen oder Protokolle werden damit nicht zugesichert.
- **Abmessungen: 357 × 180 × 356 mm laut Handbuch** — Miss den vorgesehenen Stellplatz vor dem Kauf aus und berücksichtige zusätzlich den Zugang zum Befüllen und Reinigen.

### petlibro-granary-camera-feeder

Status: improved; 6 erhaltene Originalhinweise; 3 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 5 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **App: PETLIBRO-App** — Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Stromversorgung: Netzbetrieb mit Batterie-Backup** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Batterie: Nicht vom Hersteller ausgewiesen** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Gewicht: Nicht vom Hersteller ausgewiesen** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Akku: Nein** — Kein integrierter Akku: Ohne Netzstrom läuft das Gerät nur weiter, wenn eine separate Batterie- oder Notstromlösung ausdrücklich vorgesehen ist.

**Nachher gerendert**

- **Futterart: Trockenfutter** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Stromversorgung / Akku: Netzbetrieb mit Batterie-Backup · Nein** — Prüfe, welche Funktionen laut Dokumentation im Backup weiterlaufen; Batterie-Backup bedeutet weder volle App-Funktion noch unbegrenzte Überbrückung.
- **Reinigung: Behälter, Ausgabekanal, Napf und Kamerafläche regelmäßig reinigen. Elektronische Basis nicht eintauchen.** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Mahlzeiten: Bis zu 10 pro Tag** — Gleiche die Zahl und Verteilung der planbaren Ausgaben mit dem Tagesplan deines Tieres ab; mehrere Ausgaben ersetzen keine Kontrolle der Tagesration.
- **Kapazität: 5 Liter** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.
- **Geeignet für: Katzen und kleine bis mittelgroße Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.

**Offene Eingaben**

- Batterie: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### petlibro-granary-dual-feeder

Status: improved; 6 erhaltene Originalhinweise; 2 unklare Eingabewerte.

**Vorher gerendert**

- **Krokettengröße: 2 bis 15 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Kapazität: 5 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Portionierung: 1 bis 50 Portionen je Mahlzeit** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Portionsgröße: 20 ml, ungefähr 10 g** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **App: PETLIBRO-App** — Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Stromversorgung: Netzadapter und drei D-Batterien** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.

**Nachher gerendert**

- **Krokettengröße / Futterart: 2 bis 15 mm · Trockenfutter** — Miss die längste Seite des verwendeten Futters und halte die angegebene Größenfreigabe ein; eine passende Behältergröße sagt nichts über die Eignung der Kroketten aus.
- **Portionierung: 1 bis 50 Portionen je Mahlzeit** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Napfanzahl: Zwei Edelstahlnäpfe** — Mehrere Näpfe teilen das Futter räumlich auf; sie belegen keine getrennte Ration oder Zugangskontrolle pro Tier.
- **Stromversorgung: Netzadapter und drei D-Batterien** — Plane passende Ersatzbatterien nach dem dokumentierten Batterietyp ein; aus der Stromquelle allein folgt keine feste Laufzeit.
- **WLAN: 2,4 und 5 GHz** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Reinigung: Verteiler, Ausgabekanal und beide Näpfe regelmäßig reinigen. Trockenmittel ungefähr alle zwei Wochen ersetzen.** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.

**Offene Eingaben**

- Kamera: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Batterie: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### petlibro-granary-wifi-feeder

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Krokettengröße: 2 bis 15 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Kapazität: 5 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Portionierung: 1 bis 50 Portionen pro Mahlzeit** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Portionsgröße: 20 ml, laut Hersteller ungefähr 10 g** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **App: PETLIBRO-App** — Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.

**Nachher gerendert**

- **Krokettengröße / Futterart: 2 bis 15 mm · Trockenfutter** — Miss die längste Seite des verwendeten Futters und halte die angegebene Größenfreigabe ein; eine passende Behältergröße sagt nichts über die Eignung der Kroketten aus.
- **Portionierung: 1 bis 50 Portionen pro Mahlzeit** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Zugang: Freier Zugang; keine Tiererkennung** — Prüfe die dokumentierte Zugangskontrolle pro Tier, wenn unterschiedliche Rationen oder Diätfutter getrennt bleiben müssen.
- **Stromversorgung / Batterie: Netzadapter und Batterie-Backup · 3 D-Batterien; Zeitpläne laufen weiter** — Prüfe, welche Funktionen laut Dokumentation im Backup weiterlaufen; Batterie-Backup bedeutet weder volle App-Funktion noch unbegrenzte Überbrückung.
- **WLAN: 2,4 und 5 GHz** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Reinigung: Behälter, Ausgabekanal und Napf regelmäßig reinigen. Trockenmittelbeutel nach Herstellerintervall ersetzen.** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.

### petlibro-luma-smart-litter-box

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Abmessungen: 592 x 573 x 714 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Produktgewicht: 15 kg** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Katzengewicht: 1 bis 10 kg für Automatik; bis zu 10 Katzenprofile** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Kitten-/Schutzgrenze: Unter 6 Monaten, unter 1 kg sowie trächtig/säugend nur manuell reinigen** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.
- **Geräusch: 35 bis 47 dB je nach Lüfterstufe laut Hersteller** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Streu-Kompatibilität: Geeignet: klumpende Mineralstreu, Tofu-Streu und Mischstreu · Nicht geeignet: Kristallstreu, Holzstreu und nicht klumpende Streu** — Klumpstreu erforderlich. Nur bedingt geeignet: Pflanzenfaserstreu.

**Nachher gerendert**

- **Kitten-/Schutzgrenze: Unter 6 Monaten, unter 1 kg sowie trächtig/säugend nur manuell reinigen** — Die dokumentierten Schutzfunktionen sind keine Sicherheitsgarantie. Halte die Alters- und Gewichtsgrenzen ein und beobachte die Eingewöhnung und ersten Reinigungszyklen.
- **Katzengewicht: 1 bis 10 kg für Automatik; bis zu 10 Katzenprofile** — Nutze die Automatik nur innerhalb der dokumentierten Alters- und Gewichtsgrenzen; besonders leichte oder junge Katzen sind nicht pauschal freigegeben.
- **Streu-Kompatibilität: Geeignet: klumpende Mineralstreu, Tofu-Streu und Mischstreu · Nicht geeignet: Kristallstreu, Holzstreu und nicht klumpende Streu** — Klumpstreu erforderlich. Nur bedingt geeignet: Pflanzenfaserstreu.
- **Abo: Optionales Abonnement für Cloud-Videoaufzeichnung, AI-Auswertungen** — Vergleiche die dokumentierten Pflicht- und Zusatzkosten über die geplante Nutzungszeit; optionale Dienste und notwendige Verbrauchsmaterialien getrennt rechnen.
- **Strom: Netzbetrieb; 12 V / 5 A Ausgang** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Einstieg: 34 cm hoch; 442 mm breit; Stufe enthalten** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.

### petlibro-one-rfid-smart-feeder

Status: improved; 6 erhaltene Originalhinweise; 5 unklare Eingabewerte.

**Vorher gerendert**

- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Kapazität: 3 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Portionierung: Bis zu 10 Mahlzeiten täglich** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Stromversorgung: Netzteil mit Batterie-Backup** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Batterie: Nicht vom Hersteller ausgewiesen** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Gewicht: Nicht vom Hersteller ausgewiesen** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Nachher gerendert**

- **Portionierung: Bis zu 10 Mahlzeiten täglich** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Futterart: Trockenfutter (ca. 2 bis 15 mm)** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Zugangskontrolle: RFID-Halsbandanhänger** — Prüfe die dokumentierte Zugangskontrolle pro Tier, wenn unterschiedliche Rationen oder Diätfutter getrennt bleiben müssen.
- **Stromversorgung: Netzteil mit Batterie-Backup** — Prüfe, welche Funktionen laut Dokumentation im Backup weiterlaufen; Batterie-Backup bedeutet weder volle App-Funktion noch unbegrenzte Überbrückung.
- **WLAN: 2,4 GHz und 5 GHz** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Kapazität: 3 Liter** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.

**Offene Eingaben**

- Napf: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Reinigung: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Batterie: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### petlibro-polar-wet-food-feeder

Status: pending-experiment-35.5; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Portionierung: Drei zeitgesteuerte Fächer mit je 200 ml** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Kapazität: Drei Fächer mit je 200 ml** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Stromversorgung: Netzteil 12 V/5 A** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Batterie-Backup: Drei AA-Batterien; laut Hersteller läuft der Fütterungsplan bei Stromausfall bis zu 12 Stunden weiter** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Abmessungen: 361 × 340 × 196 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.

**Nachher gerendert**

- **Portionierung: Drei zeitgesteuerte Fächer mit je 200 ml** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Kapazität: Drei Fächer mit je 200 ml** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Stromversorgung: Netzteil 12 V/5 A** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Batterie-Backup: Drei AA-Batterien; laut Hersteller läuft der Fütterungsplan bei Stromausfall bis zu 12 Stunden weiter** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Abmessungen: 361 × 340 × 196 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.

**Ausstehend wegen 35.5:** Kamera: UNSUPPORTED_GENERALIZATION; Stromversorgung: GENERIC_CONSEQUENCE; Batterie-Backup: EQUIVALENT_DECISION_TOPIC; Batterie-Backup: UNSUPPORTED_GENERALIZATION; Abmessungen: GENERIC_CONSEQUENCE. Keine Änderung am geschützten Rendering.

### petlibro-scout-smart-camera

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Abo: KI- und Cloudfunktionen abhängig vom Video Cloud AI-Tarif** — Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.

**Nachher gerendert**

- **Video: 1080p HD; Farb- und Schwarz-Weiß-Nachtsicht** — Vergleiche die dokumentierte Auflösung und den erfassten Bildbereich mit dem gewünschten Raum. Hohe Auflösung allein schließt tote Winkel nicht aus.
- **Einsatz: Kabelgebundener Innenbetrieb; nicht fuer draussen belegt** — Prüfe den vorgesehenen Fahrbereich auf die dokumentierten Hindernisse; die Kamera erschließt nicht automatisch mehrere Etagen.
- **Speicherung: Cloud; keine SD-Karte** — Prüfe Speicherort und Aufbewahrungsdauer getrennt vom Livebild; eine Liveansicht garantiert keine später abrufbare Aufnahme.
- **Abo: KI- und Cloudfunktionen abhängig vom Video Cloud AI-Tarif** — Vergleiche die dokumentierten Pflicht- und Zusatzkosten über die geplante Nutzungszeit; optionale Dienste und notwendige Verbrauchsmaterialien getrennt rechnen.
- **Mehrtiererkennung: Bis zu fünf Tiere laut Hersteller** — Vergleiche die dokumentierten Erkennungsfunktionen mit deinem Tier; Ereignismeldungen sind keine lückenlose Verhaltens- oder Gesundheitsüberwachung.
- **Interaktion: Zwei-Wege-Audio** — Prüfe die hier genannten Interaktionsmöglichkeiten für deinen Alltag; Audio oder Leckerligabe ersetzen keine Betreuung vor Ort.

### petlibro-space-smart-feeder

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Portionierung: Volumetrisch; etwa 20 ml je Einheit, bis zu 50 Einheiten pro Mahlzeit** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Kapazität: 8 Liter laut PLAF107-Handbuch** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Krokettengröße: 2 bis 18 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Portionseinheit: Ca. 20 ml je Portion** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Maximale Portionszahl: Bis zu 50 Portionen je Mahlzeit** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Portionsgewicht: Herstellerseitig ungefähr 10 g, abhängig von Form und Dichte des Futters** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Nachher gerendert**

- **Krokettengröße / Futterart: 2 bis 18 mm · Trockenfutter** — Miss die längste Seite des verwendeten Futters und halte die angegebene Größenfreigabe ein; eine passende Behältergröße sagt nichts über die Eignung der Kroketten aus.
- **Portionierung: Volumetrisch; etwa 20 ml je Einheit, bis zu 50 Einheiten pro Mahlzeit** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Tiererkennung: Nein** — Prüfe die dokumentierte Zugangskontrolle pro Tier, wenn unterschiedliche Rationen oder Diätfutter getrennt bleiben müssen.
- **Stromversorgung / Batteriemodus: Netzteil, vier D-Alkalibatterien als Backup möglich · etwa drei Tage laut Hersteller; ohne Vakuumpumpe** — Prüfe, welche Funktionen laut Dokumentation im Backup weiterlaufen; Batterie-Backup bedeutet weder volle App-Funktion noch unbegrenzte Überbrückung.
- **WLAN: WLAN-App-Anbindung vorhanden; Einrichtung über PETLIBRO App, alternativ Bluetooth beziehungsweise Hotspot-Verfahren** — Bluetooth belegt eine Verbindung im Nahbereich; ein Fernzugriff von unterwegs ist damit allein nicht zugesichert.
- **Reinigung: Zubehör zerlegbar; Basis nicht direkt mit Wasser abspülen und nicht mit nassem Tuch reinigen; Zubehör vor Zusammenbau vollständig trocknen** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.

### petlibro-stainless-steel-fountain

Status: improved; 6 erhaltene Originalhinweise; 2 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 3 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: Tank aus Edelstahl 304, Auslauf aus Polypropylen** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Stromversorgung: Netzbetrieb, Ausgang 5 V/1 A** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Lautstärke: Herstellerangabe bis 30 dB** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Filter: Dreistufig** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.

**Nachher gerendert**

- **Kapazität: 3 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Reinigung: Edelstahltank spülmaschinengeeignet** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Filterwechsel / Filter: Herstellerempfehlung etwa alle zwei Wochen · dreistufig** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Stromversorgung / Akku: Netzbetrieb, Ausgang 5 V/1 A · Nein** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Lautstärke: Herstellerangabe bis 30 dB** — Ein Herstellerwert in dB ist nur bei gleichen Messbedingungen vergleichbar. Prüfe den Aufstellort besonders bei Nutzung im Schlafzimmer.
- **Geeignet für: Katzen sowie ein kleiner oder mittelgroßer Hund** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.

**Offene Eingaben**

- UV: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Trinkhöhe: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### petsafe-freshfeed-refrigerated-feeder

Status: improved; 4 erhaltene Originalhinweise; 8 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 4,5 Cups gesamt; bis 5 fl oz je Fach** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Stromversorgung: Netzteil** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Batterie: Nicht vom Hersteller ausgewiesen** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Gewicht: Nicht vom Hersteller ausgewiesen** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Nachher gerendert**

- **Futterart: Nass-, Frisch- und Rohfutter nach tierärztlicher Eignung** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Stromversorgung: Netzteil** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Kühlung: Aktive Halbleiterkühlung, Ziel etwa 40 °F / 4,4 °C** — Plane die Futterstandzeit nach der dokumentierten Kühl- oder Frischhaltetechnik; die Angabe ist keine allgemeine Haltbarkeitsgarantie für jede Futterart.
- **Mahlzeiten: 6** — Gleiche die Zahl und Verteilung der planbaren Ausgaben mit dem Tagesplan deines Tieres ab; mehrere Ausgaben ersetzen keine Kontrolle der Tagesration.
- **Geeignet für: Katzen und kleine Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.
- **App: PetSafe Pet Companion, kein Pflichtabo** — Prüfe die dokumentierten App- und Kontovoraussetzungen vor dem Kauf; App-Unterstützung allein belegt keinen Fernzugriff und keinen Betrieb bei Cloud-Ausfall.

**Offene Eingaben**

- Kapazität: 4,5 Cups gesamt; bis 5 fl oz je Fach (INVALID_UNIT)
- Kamera: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Napf: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Reinigung: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- WLAN: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Batterie: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### petsafe-healthy-pet-simply-feed

Status: improved; 6 erhaltene Originalhinweise; 5 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 24 Cups / etwa 5,7 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Krokettengröße: Bis 3/4 Zoll / etwa 19 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Portionierung: 1/8 bis 4 Cups** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Stromversorgung: 4 D-Batterien; Netzadapter optional** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **WLAN: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Batterie: Nicht vom Hersteller ausgewiesen** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.

**Nachher gerendert**

- **Krokettengröße / Futterart: Bis 3/4 Zoll / etwa 19 mm · Trocken- und halbfeuchtes Futter** — Miss die längste Seite des verwendeten Futters und halte die angegebene Größenfreigabe ein; eine passende Behältergröße sagt nichts über die Eignung der Kroketten aus.
- **Portionierung: 1/8 bis 4 Cups** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Stromversorgung: 4 D-Batterien; Netzadapter optional** — Plane passende Ersatzbatterien nach dem dokumentierten Batterietyp ein; aus der Stromquelle allein folgt keine feste Laufzeit.
- **Mahlzeiten: Bis zu 12 täglich** — Gleiche die Zahl und Verteilung der planbaren Ausgaben mit dem Tagesplan deines Tieres ab; mehrere Ausgaben ersetzen keine Kontrolle der Tagesration.
- **Kapazität: 24 Cups / etwa 5,7 Liter** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.
- **Geeignet für: Katzen sowie kleine und mittelgroße Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.

**Offene Eingaben**

- Kamera: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Napf: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Reinigung: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Batterie: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### petsafe-mikrochip-katzenklappe

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Chipformat: FDX-B, 15-stellig; Kompatibilitätsprüfung empfohlen** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.

**Nachher gerendert**

- **Chipformat: FDX-B, 15-stellig; Kompatibilitätsprüfung empfohlen** — Lass das Chipformat deines Tieres mit der dokumentierten Kompatibilität abgleichen; Mikrochip, RFID-Anhänger und Kameraerkennung sind nicht austauschbar.
- **Verschluss: Doppelte automatische Verriegelung; 4 manuelle Optionen** — Prüfe, welche Richtung und welche Tiere die dokumentierte Erkennung tatsächlich steuert; eine Eingangskontrolle belegt keine individuellen Ausgangsrechte.
- **Strom: Batteriebetrieb** — Plane passende Ersatzbatterien nach dem dokumentierten Batterietyp ein; aus der Stromquelle allein folgt keine feste Laufzeit.
- **Einbau: Holz, PVC und uPVC direkt; für Metall, Glas, Ziegel und Wand Adapter prüfen** — Gleiche Ausschnitt und Einbaumaterial vor dem Kauf mit den dokumentierten Montagevorgaben ab; Rahmenmaß und benötigte Öffnung sind unterschiedliche Maße.
- **App: Nein** — Ohne diese dokumentierte Verbindung steht dieser Bedienweg nicht zur Verfügung; daraus folgt keine Zusage über andere App-, Cloud- oder Offline-Funktionen.

### petsafe-petporte-smart-flap

Status: improved; 7 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Stromversorgung: EU-Netzanschluss; Netzteil enthalten** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Mikrochip-Kompatibilität: EU-/UK-Standard-Mikrochips mit 15 Ziffern; Hersteller nennt konkrete Ausschlüsse** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.

**Nachher gerendert**

- **Mikrochip-Kompatibilität: EU-/UK-Standard-Mikrochips mit 15 Ziffern; Hersteller nennt konkrete Ausschlüsse** — Lass das Chipformat deines Tieres mit der dokumentierten Kompatibilität abgleichen; Mikrochip, RFID-Anhänger und Kameraerkennung sind nicht austauschbar.
- **Zugang: Selektiver Eingang per kompatiblem Mikrochip** — Prüfe, welche Richtung und welche Tiere die dokumentierte Erkennung tatsächlich steuert; eine Eingangskontrolle belegt keine individuellen Ausgangsrechte.
- **Maximale Schulterbreite: 150 mm** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.
- **Stromversorgung: EU-Netzanschluss; Netzteil enthalten** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Ausschnitt: 180 × 171 mm** — Gleiche Ausschnitt und Einbaumaterial vor dem Kauf mit den dokumentierten Montagevorgaben ab; Rahmenmaß und benötigte Öffnung sind unterschiedliche Maße.
- **Klappenöffnung: 160 × 160 mm** — Prüfe die dokumentierten App- und Kontovoraussetzungen vor dem Kauf; App-Unterstützung allein belegt keinen Fernzugriff und keinen Betrieb bei Cloud-Ausfall.

### petsafe-smart-feed-2

Status: improved; 5 erhaltene Originalhinweise; 1 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 24 Cups / etwa 5,7 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Portionierung: 1/8 bis 4 Cups je Mahlzeit** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Notstrom: 4 D-Batterien, separat** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Stromversorgung: Netzadapter; Backup mit 4 D-Batterien** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **App-Steuerung: My PetSafe App; iOS 12 oder neuer, Android 9 oder neuer** — Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.

**Nachher gerendert**

- **Portionierung: 1/8 bis 4 Cups je Mahlzeit** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Futterart: Trocken- und halbfeuchtes Futter** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Notstrom / Stromversorgung: 4 D-Batterien, separat · Netzadapter; Backup mit 4 D-Batterien** — Prüfe, welche Funktionen laut Dokumentation im Backup weiterlaufen; Batterie-Backup bedeutet weder volle App-Funktion noch unbegrenzte Überbrückung.
- **WLAN: 2,4 GHz** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Reinigung: Deckel, Futterbehälter, Edelstahlnapf und Napfhalter laut Hersteller spülmaschinengeeignet** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Mahlzeiten: Bis zu 12 täglich** — Gleiche die Zahl und Verteilung der planbaren Ausgaben mit dem Tagesplan deines Tieres ab; mehrere Ausgaben ersetzen keine Kontrolle der Tagesration.

**Offene Eingaben**

- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### petsafe-streamside-trinkbrunnen

Status: improved; 0 erhaltene Originalhinweise; 1 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 1,8 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: Keramik; laut Hersteller BPA-frei und kratzbeständig** — Keramik ist schwer und standfest, kann bei Stößen aber beschädigt werden.
- **Stromversorgung: Netzbetrieb mit Unterwasserpumpe** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Filter: Aktivkohlefilter PAC00-13906 und Schaumfilter PAC00-13711** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Abmessungen: 25,9 × 25,9 × 13,7 cm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **App: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.

**Nachher gerendert**

- **Kapazität: 1,8 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Reinigung: Schale und Turm im oberen Spülmaschinenkorb; Pumpe von Hand** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Ersatzfilter: PetSafe Aktivkohlefilter PAC00-13906 und Schaumfilter PAC00-13711** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Stromversorgung / Akku: Netzbetrieb mit Unterwasserpumpe · Nein; Netzbetrieb über Wandadapter** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Geeignet für: Katzen und kleine Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.
- **App: Nein** — Ohne diese dokumentierte Verbindung steht dieser Bedienweg nicht zur Verfügung; daraus folgt keine Zusage über andere App-, Cloud- oder Offline-Funktionen.

**Offene Eingaben**

- Lautstärke: Leiser Betrieb mit tauchfähiger Pumpe und sanft blubberndem Wasserfluss; kein dB-Wert veröffentlicht (NO_MEASURED_NOISE)

### petsnowy-snow-plus

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Streu-Kompatibilität: Geeignet: Bentonitstreu und klumpende Mineralstreu · Nicht geeignet: Holzstreu, Pellets, Papierstreu und nicht klumpende Streu** — Klumpstreu erforderlich. Nur bedingt geeignet: Kristallstreu, Tofu-Streu und Pflanzenfaserstreu.

**Nachher gerendert**

- **Sicherheit: Sieben Schutzebenen laut Hersteller; kein eigener Sicherheitstest** — Die dokumentierten Schutzfunktionen sind keine Sicherheitsgarantie. Halte die Alters- und Gewichtsgrenzen ein und beobachte die Eingewöhnung und ersten Reinigungszyklen.
- **Streu-Kompatibilität: Geeignet: Bentonitstreu und klumpende Mineralstreu · Nicht geeignet: Holzstreu, Pellets, Papierstreu und nicht klumpende Streu** — Klumpstreu erforderlich. Nur bedingt geeignet: Kristallstreu, Tofu-Streu und Pflanzenfaserstreu.
- **Abfallfach: 10 Liter, automatisch versiegelt laut Hersteller** — Plane die Entleerung nach Anzahl der Katzen und tatsächlicher Nutzung. Das Behältervolumen oder eine Maximaldauer ist keine feste Wartungsfrist.
- **Wartung: Magnetisch-modularer Aufbau; proprietäre Liner und Deodorizer berücksichtigen** — Plane neben den automatischen Zyklen die dokumentierte manuelle Reinigung ein; automatische Trennung bedeutet keine selbstständige Grundreinigung.

### pettec-cam-360

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Pflichtabo: Nein für Grundfunktionen laut Hersteller** — Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.
- **Abmessungen: 63,5 × 63,5 × 57 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Gewicht: 180 g** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Datenschutz: DSGVO-Konformität und deutsche Server sind Herstellerangaben, nicht redaktionell rechtlich bestätigt** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.

**Nachher gerendert**

- **Schwenken/Neigen: Ja; 360°-Rundumsicht ist Herstellerbeschreibung** — Vergleiche die dokumentierte Auflösung und den erfassten Bildbereich mit dem gewünschten Raum. Hohe Auflösung allein schließt tote Winkel nicht aus.
- **Lokale Speicherung: microSD möglich** — Prüfe Speicherort und Aufbewahrungsdauer getrennt vom Livebild; eine Liveansicht garantiert keine später abrufbare Aufnahme.
- **Pflichtabo: Nein für Grundfunktionen laut Hersteller** — Vergleiche die dokumentierten Pflicht- und Zusatzkosten über die geplante Nutzungszeit; optionale Dienste und notwendige Verbrauchsmaterialien getrennt rechnen.
- **Erkennung: Bewegung und Geräusch** — Vergleiche die dokumentierten Erkennungsfunktionen mit deinem Tier; Ereignismeldungen sind keine lückenlose Verhaltens- oder Gesundheitsüberwachung.
- **Nachtsicht: Ja** — Prüfe die dokumentierte Nachtfunktion für den geplanten Raum; Tagesbilder allein zeigen nicht die Erkennbarkeit bei Dunkelheit.
- **Audio: Zwei-Wege-Audio** — Prüfe die hier genannten Interaktionsmöglichkeiten für deinen Alltag; Audio oder Leckerligabe ersetzen keine Betreuung vor Ort.

### petwalk-medium-tiertuer

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Durchgang: 20 × 30 cm (B × H) laut Hersteller** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.

**Nachher gerendert**

- **Erkennung: Bewegungssensoren und RFID-Chiperkennung** — Prüfe, welche Richtung und welche Tiere die dokumentierte Erkennung tatsächlich steuert; eine Eingangskontrolle belegt keine individuellen Ausgangsrechte.
- **Durchgang: 20 × 30 cm (B × H) laut Hersteller** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.
- **Strom: 24-V-Netzgerät im Lieferumfang; Notstrom-Akku im System vorgesehen** — Prüfe, welche Funktionen laut Dokumentation im Backup weiterlaufen; Batterie-Backup bedeutet weder volle App-Funktion noch unbegrenzte Überbrückung.
- **Einbau: Glas, Wand oder Tür; Standard-Spacer für ca. 2–10 cm Bauteilstärke** — Gleiche Ausschnitt und Einbaumaterial vor dem Kauf mit den dokumentierten Montagevorgaben ab; Rahmenmaß und benötigte Öffnung sind unterschiedliche Maße.
- **Geeignet für: Alle Katzenrassen und kleinere Hunde laut Hersteller** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.
- **App: petWALK.control bei aktuellem Angebot enthalten** — Prüfe die dokumentierten App- und Kontovoraussetzungen vor dem Kauf; App-Unterstützung allein belegt keinen Fernzugriff und keinen Betrieb bei Cloud-Ausfall.

### philips-pet-series-paw3210-02

Status: improved; 0 erhaltene Originalhinweise; 1 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 2,2 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Material: Kunststoff; keine bestätigte BPA-frei-Zusage für dieses Modell** — Kunststoff ist leicht, sollte wegen Kratzern und Geruchsaufnahme besonders gründlich kontrolliert werden.
- **Stromversorgung: DC 5 V / 1 A über Netzadapter; Eingang AC 100–240 V, 50/60 Hz; 1,5 m Kabel** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Filter: Mehrschichtiger Filter mit Aktivkohle und Ionenaustausch; PAW0010/01, Wechsel alle 30 Tage** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Lautstärke: Unter 38 dB laut Pressemitteilung von 2024; kein eigener Messwert** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.
- **Akku: Nein; kein Akkubetrieb dokumentiert** — Kein integrierter Akku: Ohne Netzstrom läuft das Gerät nur weiter, wenn eine separate Batterie- oder Notstromlösung ausdrücklich vorgesehen ist.

**Nachher gerendert**

- **Kapazität: 2,2 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Reinigung: Handreinigung laut Philips-Support; keine Spülmaschine. Anschluss trocken halten und Pumpe separat reinigen.** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Ersatzfilter / Filter: PAW0010/01; drei Filter pro Packung · Mehrschichtiger Filter mit Aktivkohle und Ionenaustausch; PAW0010/01, Wechsel alle 30 Tage** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Stromversorgung / Akku: DC 5 V / 1 A über Netzadapter; Eingang AC 100–240 V, 50/60 Hz; 1,5 m Kabel · Nein; kein Akkubetrieb dokumentiert** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Lautstärke: Unter 38 dB laut Pressemitteilung von 2024; kein eigener Messwert** — Ein Herstellerwert in dB ist nur bei gleichen Messbedingungen vergleichbar. Prüfe den Aufstellort besonders bei Nutzung im Schlafzimmer.
- **Geeignet für: Katzen und kleine Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.

**Offene Eingaben**

- BPA-Freiheit: Nicht bestätigt; keine positive Zusage aus den verfügbaren Spezifikationen (UNKNOWN_VALUE)

### prothelis-area-pets

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Abo: Servicepaket für integrierte SIM erforderlich; aktuelle Laufzeiten prüfen** — Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.
- **Akkulaufzeit: Bis zu 8 Tage Nutzung, bis zu 30 Tage Standby laut aktuellem deutschen Shop; abhängig vom Intervall** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Stromversorgung: 950-mAh-LiPo-Akku** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Abmessungen: 64,3 × 29 × 25,7 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Gewicht: 38 g** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.
- **Wasserschutz: IP67** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.

**Nachher gerendert**

- **Akkulaufzeit: Bis zu 8 Tage Nutzung, bis zu 30 Tage Standby laut aktuellem deutschen Shop; abhängig vom Intervall** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo: Servicepaket für integrierte SIM erforderlich; aktuelle Laufzeiten prüfen** — Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.
- **Geeignet für: Tiere mit passender Befestigung; hier als Hundetracker eingeordnet** — Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.
- **Übertragung: GSM/GPRS/EDGE mit integrierter SIM** — Prüfe vor dem Kauf die unterstützten Netze und Länder für deinen Einsatzort. Satellitenortung allein garantiert noch keine Übertragung des Standorts an dich.
- **Ortung: GPS und GLONASS** — Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.
- **Gewicht: 38 g** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

### reolink-e1-zoom

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Abmessungen: 84 mm Durchmesser × 118 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Gewicht: 275 g** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Stromversorgung: 5 V / 2 A Netzbetrieb** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.

**Nachher gerendert**

- **Auflösung: 3840 × 2160, 8 MP bei 20 fps** — Vergleiche die dokumentierte Auflösung und den erfassten Bildbereich mit dem gewünschten Raum. Hohe Auflösung allein schließt tote Winkel nicht aus.
- **Lokale Speicherung: microSD bis 512 GB sowie NVR, Home Hub und FTP/NAS** — Prüfe Speicherort und Aufbewahrungsdauer getrennt vom Livebild; eine Liveansicht garantiert keine später abrufbare Aufnahme.
- **Abo: Kein Pflichtabo für lokale Speicherung** — Vergleiche die dokumentierten Pflicht- und Zusatzkosten über die geplante Nutzungszeit; optionale Dienste und notwendige Verbrauchsmaterialien getrennt rechnen.
- **Erkennung: Lokale Personen-, Tier- und Babygeschrei-Erkennung laut Hersteller** — Vergleiche die dokumentierten Erkennungsfunktionen mit deinem Tier; Ereignismeldungen sind keine lückenlose Verhaltens- oder Gesundheitsüberwachung.
- **Stromversorgung: 5 V / 2 A Netzbetrieb** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Nachtsicht: Infrarot bis 12 m laut Hersteller** — Prüfe die dokumentierte Nachtfunktion für den geplanten Raum; Tagesbilder allein zeigen nicht die Erkennbarkeit bei Dunkelheit.

### satellai-collar-go

Status: improved; 0 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Gewicht: 49 g laut EU-Produktseite** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.
- **Akkulaufzeit: Bis zu 12,5 Tage laut aktueller EU-Produktseite** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Schutzklasse: IP68** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.
- **Abo: Für Mobilfunkortung erforderlich** — Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.

**Nachher gerendert**

- **Akkulaufzeit: Bis zu 12,5 Tage laut aktueller EU-Produktseite** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo: Für Mobilfunkortung erforderlich** — Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.
- **Befestigung: Carbon Black / M; Halsbandpassform vor Kauf prüfen** — Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.
- **Übertragung: LTE** — Prüfe vor dem Kauf die unterstützten Netze und Länder für deinen Einsatzort. Satellitenortung allein garantiert noch keine Übertragung des Standorts an dich.
- **Live-Ortung: Live-Tracking dokumentiert** — Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.
- **Gewicht: 49 g laut EU-Produktseite** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

### surefeed-microchip-pet-feeder-connect

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Portionierung: Manuelles Befüllen mit integrierter Waage und LED-Anzeige auf 1 Gramm genau** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Kapazität: 400 ml** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Stromversorgung: 4 C-Batterien** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Batterie: 4 × C-Batterien; typische Laufzeit etwa 6 Monate** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.

**Nachher gerendert**

- **Portionierung: Manuelles Befüllen mit integrierter Waage und LED-Anzeige auf 1 Gramm genau** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Futterart: Nass- und Trockenfutter** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Zugang: Mikrochip oder kompatibler RFID-Halsbandanhänger** — Prüfe die dokumentierte Zugangskontrolle pro Tier, wenn unterschiedliche Rationen oder Diätfutter getrennt bleiben müssen.
- **Stromversorgung / Batterie: 4 C-Batterien · 4 × C-Batterien; typische Laufzeit etwa 6 Monate** — Plane passende Ersatzbatterien nach dem dokumentierten Batterietyp ein; aus der Stromquelle allein folgt keine feste Laufzeit.
- **Reinigung: Schaleneinsätze spülmaschinengeeignet; Deckel und Matte per Hand reinigen; Gerätebasis nur feucht abwischen und nicht eintauchen** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Kapazität: 400 ml** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.

### surefeed-microchip-pet-feeder

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 400 ml** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **App: Nein, Standardversion** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Stromversorgung: Vier C-Batterien** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Portionierung: Manuell eingefüllte Napfportion; keine automatische Dosierung** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **WLAN: Nein; die Standardversion arbeitet lokal ohne App oder Hub** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.

**Nachher gerendert**

- **Portionierung: Manuell eingefüllte Napfportion; keine automatische Dosierung** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Futterart: Nass- und Trockenfutter** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Zugang: Mikrochip oder RFID-Halsbandanhänger** — Prüfe die dokumentierte Zugangskontrolle pro Tier, wenn unterschiedliche Rationen oder Diätfutter getrennt bleiben müssen.
- **Stromversorgung / Batterie: Vier C-Batterien · 4 C-Batterien; bis zu 6 Monate laut Hersteller; Batterien nicht enthalten** — Plane passende Ersatzbatterien nach dem dokumentierten Batterietyp ein; aus der Stromquelle allein folgt keine feste Laufzeit.
- **Öffnung: 210 × 155 mm (B × H)** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.
- **Reinigung: Näpfe und Matte entnehmbar; bewegliche Mechanik gemäß Herstelleranleitung reinigen und trocken halten** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.

### sureflap-dualscan-mikrochip-katzenklappe

Status: improved; 5 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Stromversorgung: 4 AA-Batterien, nicht enthalten** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Batterielaufzeit: Bis zu 12 Monate laut Hersteller** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.

**Nachher gerendert**

- **Zugang: Mikrochip beidseitig** — Prüfe, welche Richtung und welche Tiere die dokumentierte Erkennung tatsächlich steuert; eine Eingangskontrolle belegt keine individuellen Ausgangsrechte.
- **Durchgang: 142 × 120 mm** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.
- **Batterielaufzeit / Stromversorgung: Bis zu 12 Monate laut Hersteller · 4 AA-Batterien, nicht enthalten** — Plane den Batteriewechsel vor dem angegebenen Maximalzeitraum ein. Ein Hersteller-Maximalwert ist keine Zusage, dass jede Nutzung so lange ohne Wechsel auskommt.
- **Speicher: Bis zu 32 Tiere beziehungsweise Mikrochipnummern** — Vergleiche die speicherbare Tierzahl mit deinem Haushalt. Gespeicherte Identitäten belegen keine individuellen Zeitpläne oder Richtungsrechte.
- **Tür-/Wandausschnitt: 165 × 171 mm** — Gleiche Ausschnitt und Einbaumaterial vor dem Kauf mit den dokumentierten Montagevorgaben ab; Rahmenmaß und benötigte Öffnung sind unterschiedliche Maße.
- **Klappenöffnung: 142 × 120 mm** — Prüfe die dokumentierten App- und Kontovoraussetzungen vor dem Kauf; App-Unterstützung allein belegt keinen Fernzugriff und keinen Betrieb bei Cloud-Ausfall.

### sureflap-mikrochip-katzenklappe-connect

Status: improved; 7 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Stromversorgung: 4 AA-Batterien** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Batterielaufzeit: Bis zu 6 Monate laut Hersteller** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **App: Sure Petcare App** — Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.

**Nachher gerendert**

- **Zugangssteuerung: Individuelle Ein- und Ausgangsrechte** — Prüfe, welche Richtung und welche Tiere die dokumentierte Erkennung tatsächlich steuert; eine Eingangskontrolle belegt keine individuellen Ausgangsrechte.
- **Durchgang: 142 × 120 mm** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.
- **Batterielaufzeit / Stromversorgung: Bis zu 6 Monate laut Hersteller · 4 AA-Batterien** — Plane den Batteriewechsel vor dem angegebenen Maximalzeitraum ein. Ein Hersteller-Maximalwert ist keine Zusage, dass jede Nutzung so lange ohne Wechsel auskommt.
- **Tür-/Wandausschnitt: 165 × 171 mm** — Gleiche Ausschnitt und Einbaumaterial vor dem Kauf mit den dokumentierten Montagevorgaben ab; Rahmenmaß und benötigte Öffnung sind unterschiedliche Maße.
- **Klappenöffnung: 142 × 120 mm** — Prüfe die dokumentierten App- und Kontovoraussetzungen vor dem Kauf; App-Unterstützung allein belegt keinen Fernzugriff und keinen Betrieb bei Cloud-Ausfall.

### sureflap-mikrochip-katzenklappe

Status: improved; 8 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Stromversorgung: 4 AA-Batterien, nicht enthalten** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Batterielaufzeit: Bis zu 12 Monate laut Hersteller** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Mikrochip-Kompatibilität: Gängige Identifikations-Mikrochips; Kompatibilitätsprüfung empfohlen** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.

**Nachher gerendert**

- **Mikrochip-Kompatibilität: Gängige Identifikations-Mikrochips; Kompatibilitätsprüfung empfohlen** — Lass das Chipformat deines Tieres mit der dokumentierten Kompatibilität abgleichen; Mikrochip, RFID-Anhänger und Kameraerkennung sind nicht austauschbar.
- **Verschluss: Manueller 4-Wege-Verschluss** — Prüfe, welche Richtung und welche Tiere die dokumentierte Erkennung tatsächlich steuert; eine Eingangskontrolle belegt keine individuellen Ausgangsrechte.
- **Durchgang: 142 × 120 mm** — Vergleiche die nutzbare Öffnung und Einstiegshöhe mit den Körpermaßen deines Tieres; Außenmaße allein belegen keinen passenden Durchgang.
- **Batterielaufzeit / Stromversorgung: Bis zu 12 Monate laut Hersteller · 4 AA-Batterien, nicht enthalten** — Plane den Batteriewechsel vor dem angegebenen Maximalzeitraum ein. Ein Hersteller-Maximalwert ist keine Zusage, dass jede Nutzung so lange ohne Wechsel auskommt.
- **Speicher: Bis zu 32 Tiere beziehungsweise Mikrochipnummern** — Vergleiche die speicherbare Tierzahl mit deinem Haushalt. Gespeicherte Identitäten belegen keine individuellen Zeitpläne oder Richtungsrechte.
- **Tür-/Wandausschnitt: 165 × 171 mm** — Gleiche Ausschnitt und Einbaumaterial vor dem Kauf mit den dokumentierten Montagevorgaben ab; Rahmenmaß und benötigte Öffnung sind unterschiedliche Maße.

### tractive-cat-6-mini

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Akkutechnik und Austausch / Akkukapazität / Akkulaufzeit: Integrierter, wiederaufladbarer Akku; Zellchemie und Austausch durch Nutzer in den geprüften modellspezifischen Herstellerangaben nicht eindeutig dokumentiert · 450 mAh · Bis zu 7 Tage mit Energiesparzone; bis zu 4 Tage ohne Energiesparzone** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo: Erforderlich; ein Abo pro Tracker** — Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.
- **App: Tractive GPS App; Android 10 oder neuer, iOS 17 oder neuer** — Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Stromversorgung: Integrierter Akku** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Wasserschutz: IP68** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.
- **Abmessungen: 95 × 20 × 13 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.

**Nachher gerendert**

- **Akkutechnik und Austausch / Akkukapazität / Akkulaufzeit: Integrierter, wiederaufladbarer Akku; Zellchemie und Austausch durch Nutzer in den geprüften modellspezifischen Herstellerangaben nicht eindeutig dokumentiert · 450 mAh · Bis zu 7 Tage mit Energiesparzone; bis zu 4 Tage ohne Energiesparzone** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo: Erforderlich; ein Abo pro Tracker** — Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.
- **Geeignet für: Katzen von 3 bis 8 kg** — Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.
- **Übertragung: LTE/4G (Cat 1 bis)** — Prüfe vor dem Kauf die unterstützten Netze und Länder für deinen Einsatzort. Satellitenortung allein garantiert noch keine Übertragung des Standorts an dich.
- **Ortung: GPS, GLONASS und Galileo** — Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.
- **Gewicht: 32 g inklusive Halsband** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

### tractive-dog-6-xl

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Akkukapazität / Akkutechnik und Austausch / Akkulaufzeit: 2150 mAh laut Tractive · Integrierter, wiederaufladbarer Akku; Zellchemie und Austausch durch Nutzer in den geprüften modellspezifischen Herstellerangaben nicht eindeutig dokumentiert · Bis zu 42 Tage mit Energiesparzonen; bis zu 20 Tage ohne** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo: Erforderlich; ein eigenes Abo pro Tracker** — Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.
- **App: Tractive GPS App; Android 10 oder neuer, iOS/iPadOS 17 oder neuer** — Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Stromversorgung: Integrierter Akku; Laden über das mitgelieferte USB-C-Ladekabel** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Wasserschutz: IP68** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.
- **Abmessungen: 83 × 47 × 20 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.

**Nachher gerendert**

- **Akkukapazität / Akkutechnik und Austausch / Akkulaufzeit: 2150 mAh laut Tractive · Integrierter, wiederaufladbarer Akku; Zellchemie und Austausch durch Nutzer in den geprüften modellspezifischen Herstellerangaben nicht eindeutig dokumentiert · Bis zu 42 Tage mit Energiesparzonen; bis zu 20 Tage ohne** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo: Erforderlich; ein eigenes Abo pro Tracker** — Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.
- **Geeignet für: Hunde ab 20 kg** — Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.
- **Übertragung: LTE/4G (Cat 1 bis)** — Prüfe vor dem Kauf die unterstützten Netze und Länder für deinen Einsatzort. Satellitenortung allein garantiert noch keine Übertragung des Standorts an dich.
- **Ortung: GPS, GLONASS und Galileo** — Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.
- **Gewicht: Rund 70 g** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

### tractive-dog-6

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Akkutechnik und Austausch / Akkulaufzeit / Akku: Integrierter, wiederaufladbarer Akku; Zellchemie und Austausch durch Nutzer in den geprüften modellspezifischen Herstellerangaben nicht eindeutig dokumentiert · Laut Tractive bis zu 14 Tage mit Energiesparzonen; bis zu 6 Tage ohne · Integrierter Akku, laut Support 930 mAh** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo: Erforderlich; ein eigenes Abo pro Tracker** — Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.
- **App: Tractive GPS App; Android 10 oder neuer, iOS/iPadOS 17 oder neuer** — Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Stromversorgung: Integrierter Akku; Laden über das mitgelieferte USB-C-Ladekabel** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Wasserschutz: IP68** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.
- **Abmessungen: 71 × 29 × 17 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.

**Nachher gerendert**

- **Akkutechnik und Austausch / Akkulaufzeit / Akku: Integrierter, wiederaufladbarer Akku; Zellchemie und Austausch durch Nutzer in den geprüften modellspezifischen Herstellerangaben nicht eindeutig dokumentiert · Laut Tractive bis zu 14 Tage mit Energiesparzonen; bis zu 6 Tage ohne · Integrierter Akku, laut Support 930 mAh** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo: Erforderlich; ein eigenes Abo pro Tracker** — Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.
- **Geeignet für: Hunde ab 4 kg** — Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.
- **Übertragung: LTE/4G (Cat 1 bis)** — Prüfe vor dem Kauf die unterstützten Netze und Länder für deinen Einsatzort. Satellitenortung allein garantiert noch keine Übertragung des Standorts an dich.
- **Ortung: GPS, GLONASS und Galileo** — Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.
- **Gewicht: Rund 39 g** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

### weenect-xs

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Abo / Abo-Modelle: Erforderlich; eigenes Abonnement pro Tracker · Aktuell 14 €/Monat, 90 €/Jahr, 120 €/2 Jahre oder 250 €/5 Jahre laut Weenect** — Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.
- **App: Weenect App für iOS und Android sowie Web-App** — Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Akkukapazität / Akkulaufzeit: 500 mAh · Bis zu 7 Tage mit WLAN-Energiesparzonen; etwa 2 Tage bei durchgehender Ortung** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Wasserschutz: IP68; laut Hersteller bis 1,5 m Wassertiefe für 60 Minuten** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.
- **Abmessungen: 60,5 × 24,5 × 15 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Gewicht / Mindestgewicht des Tieres: 27 g Gerätegewicht · 3 kg laut Hersteller** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

**Nachher gerendert**

- **Akkukapazität / Akkulaufzeit: 500 mAh · Bis zu 7 Tage mit WLAN-Energiesparzonen; etwa 2 Tage bei durchgehender Ortung** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo / Abo-Modelle: Erforderlich; eigenes Abonnement pro Tracker · Aktuell 14 €/Monat, 90 €/Jahr, 120 €/2 Jahre oder 250 €/5 Jahre laut Weenect** — Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.
- **Mindestgewicht des Tieres: 3 kg laut Hersteller** — Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.
- **Übertragung: 2G, NB-IoT/LTE-M und 4G über integrierte SIM** — Prüfe vor dem Kauf die unterstützten Netze und Länder für deinen Einsatzort. Satellitenortung allein garantiert noch keine Übertragung des Standorts an dich.
- **Ortung: GPS, Galileo, BeiDou und GLONASS** — Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.
- **Gewicht: 27 g Gerätegewicht** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

### weenect-xt

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Abo / Abo-Modelle: Erforderlich; eigenes Abonnement pro Tracker · Monatlich sowie Prepaid-Laufzeiten über ein, zwei oder fünf Jahre** — Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.
- **App: Weenect App für iOS und Android sowie Web-App** — Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.
- **Akkukapazität / Akkulaufzeit: 1.250 mAh bei 3,8 V; 4,75 Wh · Bis zu 3 Wochen mit Energiesparzone; ungefähr 1 Woche bei kontinuierlichem Tracking** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Wasserschutz: IP68; laut Hersteller bis 1,5 m Wassertiefe für 60 Minuten** — Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.
- **Abmessungen: 82 × 35 × 22 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Gewicht: 54,2 g Gerätegewicht** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

**Nachher gerendert**

- **Akkukapazität / Akkulaufzeit: 1.250 mAh bei 3,8 V; 4,75 Wh · Bis zu 3 Wochen mit Energiesparzone; ungefähr 1 Woche bei kontinuierlichem Tracking** — Die reale Akkulaufzeit hängt besonders von Live-Ortung, Empfang, Aktivität und Energiesparfunktionen ab. Hersteller-Maximalwerte sind deshalb kein typischer Dauerwert.
- **Abo / Abo-Modelle: Erforderlich; eigenes Abonnement pro Tracker · Monatlich sowie Prepaid-Laufzeiten über ein, zwei oder fünf Jahre** — Vergleiche Vertragslaufzeit, enthaltenen Zeitraum und Verlängerungskosten zusammen mit dem Gerätepreis; ein enthaltenes Paketjahr darf nicht zusätzlich berechnet werden.
- **Geeignet für: Hunde; redaktionell vor allem mittelgroße und große Hunde** — Gleiche die angegebenen Tier- und Halsbandgrenzen mit deinem Tier ab; eine Freigabe für Hunde lässt sich nicht auf Katzen oder leichtere Tiere übertragen.
- **Übertragung: Multi-Netz-eSIM; Weenect nennt 2G, NB-IoT/LTE-M und 4G, auf der XT-Produktseite zusätzlich 5G** — Prüfe vor dem Kauf die unterstützten Netze und Länder für deinen Einsatzort. Satellitenortung allein garantiert noch keine Übertragung des Standorts an dich.
- **Ortung: GPS, Galileo, BeiDou und GLONASS mit Weenect InfinityTrack** — Vergleiche die hier genannten Ortungsmodi und Aktualisierungsintervalle mit deinem Suchszenario. Eine Standortanzeige belegt keine zuverlässig rechtzeitige Ausbruchswarnung.
- **Gewicht: 54,2 g Gerätegewicht** — Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.

### wopet-cube-air-ca10

Status: improved; 6 erhaltene Originalhinweise; 5 unklare Eingabewerte.

**Vorher gerendert**

- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Kapazität: 4 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Portionierung: 1 bis 8 Portionen pro Mahlzeit** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Portionsgröße: Etwa 10 g pro Portion** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Stromversorgung: USB C Netzteil mit Batterie Backup** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Batterie: Nicht vom Hersteller ausgewiesen** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.

**Nachher gerendert**

- **Portionierung: 1 bis 8 Portionen pro Mahlzeit** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Futterart: Trockenfutter, Kroketten etwa 2 bis 12 mm** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Stromversorgung: USB C Netzteil mit Batterie Backup** — Prüfe, welche Funktionen laut Dokumentation im Backup weiterlaufen; Batterie-Backup bedeutet weder volle App-Funktion noch unbegrenzte Überbrückung.
- **WLAN: 2,4 und 5 GHz** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Mahlzeiten: 1 bis 10 pro Tag** — Gleiche die Zahl und Verteilung der planbaren Ausgaben mit dem Tagesplan deines Tieres ab; mehrere Ausgaben ersetzen keine Kontrolle der Tagesration.
- **Kapazität: 4 Liter** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.

**Offene Eingaben**

- Napf: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Reinigung: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Batterie: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### wopet-heritage-view-camera-feeder

Status: improved; 6 erhaltene Originalhinweise; 6 unklare Eingabewerte.

**Vorher gerendert**

- **Kamera: Ja** — Du kannst nicht nur die Geräteaktion, sondern auch die Situation am Napf oder Aufenthaltsort kontrollieren.
- **Kapazität: 6 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Stromversorgung: Netzteil, modellabhängig Backup** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Portionierung: 1 bis 6 Mahlzeiten pro Tag; 1 bis 20 Portionen à etwa 10 g pro Mahlzeit** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Batterie: Nicht vom Hersteller ausgewiesen** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.
- **Gewicht: Nicht vom Hersteller ausgewiesen** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.

**Nachher gerendert**

- **Portionierung: 1 bis 6 Mahlzeiten pro Tag; 1 bis 20 Portionen à etwa 10 g pro Mahlzeit** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Futterart: Trockenfutter** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Stromversorgung: Netzteil, modellabhängig Backup** — Prüfe, welche Funktionen laut Dokumentation im Backup weiterlaufen; Batterie-Backup bedeutet weder volle App-Funktion noch unbegrenzte Überbrückung.
- **Kapazität: 6 Liter** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.
- **Geeignet für: Katzen, kleine bis mittelgroße Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.
- **App-Steuerung: Ja** — Prüfe die dokumentierten App- und Kontovoraussetzungen vor dem Kauf; App-Unterstützung allein belegt keinen Fernzugriff und keinen Betrieb bei Cloud-Ausfall.

**Offene Eingaben**

- Napf: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Reinigung: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- WLAN: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Batterie: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### wopet-patrol-f07-pro

Status: improved; 6 erhaltene Originalhinweise; 1 unklare Eingabewerte.

**Vorher gerendert**

- **Krokettengröße: Offiziell uneinheitlich mit 2 bis 15 oder 5 bis 15 mm angegeben** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Kapazität: 6 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Portionierung: 1 bis 50 Portionen pro Mahlzeit** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Portionsgröße: Herstellerangabe etwa 5 g** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Stromversorgung: 5 V/1 A über USB-C und drei D-Batterien als Backup** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.

**Nachher gerendert**

- **Krokettengröße / Futterart: Offiziell uneinheitlich mit 2 bis 15 oder 5 bis 15 mm angegeben · Trockenfutter** — Miss die längste Seite des verwendeten Futters und halte die angegebene Größenfreigabe ein; eine passende Behältergröße sagt nichts über die Eignung der Kroketten aus.
- **Portionierung: 1 bis 50 Portionen pro Mahlzeit** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Stromversorgung / Batterie: 5 V/1 A über USB-C und drei D-Batterien als Backup · Batterie-Backup laut Produktdaten** — Prüfe, welche Funktionen laut Dokumentation im Backup weiterlaufen; Batterie-Backup bedeutet weder volle App-Funktion noch unbegrenzte Überbrückung.
- **WLAN: 2,4 GHz** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Reinigung: Behälter, Ausgabekanal und Napf regelmäßig reinigen. Blockaden bei Wechsel von Futterform oder -größe kontrollieren.** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Mahlzeiten: 1 bis 15 pro Tag** — Gleiche die Zahl und Verteilung der planbaren Ausgaben mit dem Tagesplan deines Tieres ab; mehrere Ausgaben ersetzen keine Kontrolle der Tagesration.

**Offene Eingaben**

- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### wopet-pioneer-f01-plus

Status: improved; 6 erhaltene Originalhinweise; 5 unklare Eingabewerte.

**Vorher gerendert**

- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Kapazität: 7 Liter** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Portionierung: Bis zu 40 Portionen pro Mahlzeit** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Stromversorgung: Netzteil und 3 D-Batterien als Backup** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **WLAN: Nein** — Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.
- **Batterie: Nicht vom Hersteller ausgewiesen** — Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.

**Nachher gerendert**

- **Portionierung: Bis zu 40 Portionen pro Mahlzeit** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Futterart: Trockenfutter, etwa 5 bis 15 mm** — Wähle das Gerät nur für die dokumentierte Futterart; eine Freigabe für Trockenfutter schließt Nassfutter oder Medikamente nicht ein.
- **Stromversorgung: Netzteil und 3 D-Batterien als Backup** — Prüfe, welche Funktionen laut Dokumentation im Backup weiterlaufen; Batterie-Backup bedeutet weder volle App-Funktion noch unbegrenzte Überbrückung.
- **Mahlzeiten: Bis zu 5 pro Tag** — Gleiche die Zahl und Verteilung der planbaren Ausgaben mit dem Tagesplan deines Tieres ab; mehrere Ausgaben ersetzen keine Kontrolle der Tagesration.
- **Kapazität: 7 Liter** — Berechne die Vorratsdauer mit der gewogenen Tagesration deiner Tiere; Liter Behältervolumen lassen sich ohne Futterdichte nicht zuverlässig in Futtertage umrechnen.
- **Geeignet für: Katzen sowie kleine bis mittelgroße Hunde** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.

**Offene Eingaben**

- Napf: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Reinigung: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Batterie: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Maße: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### xiaomi-smart-pet-food-feeder-2

Status: improved; 6 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Krokettengröße: Bis 12 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Kapazität: 5 Liter, etwa 2,5 kg** — Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.
- **Portionierung: Ab etwa 1 g über App steuerbar** — Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.
- **Kamera: Nein** — Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.
- **Napfmaterial: Edelstahl 304** — Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.
- **Stromversorgung: Netzbetrieb und vier AA-Batterien als Backup** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.

**Nachher gerendert**

- **Krokettengröße / Futterart: Bis 12 mm · Trockenfutter und gemischte gefriergetrocknete Anteile** — Miss die längste Seite des verwendeten Futters und halte die angegebene Größenfreigabe ein; eine passende Behältergröße sagt nichts über die Eignung der Kroketten aus.
- **Portionierung: Ab etwa 1 g über App steuerbar** — Wiege mehrere Ausgaben mit deinem eigenen Futter nach. Die angegebene Portionseinheit ist keine Zusage einer gleichbleibenden Grammmenge bei jeder Futtersorte.
- **Zugang: Freier Zugang; keine Tiererkennung** — Prüfe die dokumentierte Zugangskontrolle pro Tier, wenn unterschiedliche Rationen oder Diätfutter getrennt bleiben müssen.
- **Stromversorgung / Notstrom: Netzbetrieb und vier AA-Batterien als Backup · Herstellerangabe etwa 14 Tage** — Prüfe, welche Funktionen laut Dokumentation im Backup weiterlaufen; Batterie-Backup bedeutet weder volle App-Funktion noch unbegrenzte Überbrückung.
- **WLAN: 2,4 GHz** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Reinigung: Behälter und Napf regelmäßig reinigen. Wiegenapf nach dem Einsetzen kalibrieren und Trockenmittelkartusche monatlich austauschen.** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.

### xiaomi-smart-pet-fountain-2

Status: improved; 6 erhaltene Originalhinweise; 5 unklare Eingabewerte.

**Vorher gerendert**

- **Kapazität: 3 Liter** — Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.
- **Stromversorgung: Integrierter Akku, Laden mit 5 V/2 A** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.
- **Filter: Vierstufig mit PP-Filter, Aktivkohle, Ionenaustauschharz und bakteriostatischer Baumwolle** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Filterwechsel: Herstellerempfehlung monatlich** — Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.
- **Abmessungen: 190 × 230 × 180 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Lautstärke: Nicht vom Hersteller ausgewiesen** — Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.

**Nachher gerendert**

- **Kapazität: 3 Liter** — Unterscheide nutzbares Wasservolumen vom maximalen Tankvolumen. Plane Nachfüllen nach dem Verbrauch deiner Tiere und frisches Wasser unabhängig davon.
- **Reinigung: Zerlegbar; Hersteller empfiehlt wöchentliche Reinigung** — Plane die Reinigung nach den freigegebenen Bauteilen; eine Spülmaschinenfreigabe einzelner Teile gilt nicht automatisch für Elektronik, Pumpe oder das gesamte Gerät.
- **Filterwechsel / Filter: Herstellerempfehlung monatlich · vierstufig mit PP-Filter, Aktivkohle, Ionenaustauschharz und bakteriostatischer Baumwolle** — Prüfe die passenden Ersatzfilter und das angegebene Wechselintervall vor dem Kauf. Aus der Filterausstattung folgt weder Keimfreiheit noch ein fester monatlicher Preis.
- **Stromversorgung: Integrierter Akku, Laden mit 5 V/2 A** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Verbindung: 2,4-GHz-WLAN** — Prüfe den dokumentierten WLAN-Frequenzbereich an deinem Router. Ein vorhandenes WLAN-Netz belegt nicht, dass das Gerät dessen Frequenzband unterstützt.
- **Akku: 4000 mAh** — Die Akkuangabe allein belegt keine Laufzeit im Dauerbetrieb. Vergleiche sie mit dem dokumentierten Betriebsmodus, bevor du einen Standort ohne Steckdose wählst.

**Offene Eingaben**

- Lautstärke: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- UV: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Trinkhöhe: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Wasserfluss: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)
- Gewicht: Nicht vom Hersteller ausgewiesen (UNKNOWN_VALUE)

### zeromouse-2-0

Status: improved; 4 erhaltene Originalhinweise; 0 unklare Eingabewerte.

**Vorher gerendert**

- **Abmessungen: 57,5 × 59,05 × 16,5 mm** — Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.
- **Gewicht: 25 g** — Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.
- **Kamera: Integriert** — Du kannst nicht nur die Geräteaktion, sondern auch die Situation am Napf oder Aufenthaltsort kontrollieren.
- **Stromversorgung: USB-C-Netzteil mit mindestens 2 A und geeignetes USB-C-Kabel erforderlich** — Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.

**Nachher gerendert**

- **Kompatibilität: Mikrochip-Katzenklappen mit geeignetem Tunnel; PetSafe PetPorte ausgeschlossen** — Lass das Chipformat deines Tieres mit der dokumentierten Kompatibilität abgleichen; Mikrochip, RFID-Anhänger und Kameraerkennung sind nicht austauschbar.
- **Beuteerkennung: Mäuse, Vögel, Ratten, Eidechsen und weitere typische Beutetiere laut Hersteller** — Prüfe, welche Richtung und welche Tiere die dokumentierte Erkennung tatsächlich steuert; eine Eingangskontrolle belegt keine individuellen Ausgangsrechte.
- **Stromversorgung: USB-C-Netzteil mit mindestens 2 A und geeignetes USB-C-Kabel erforderlich** — Plane den Standort passend zur dokumentierten Stromversorgung; ohne ausdrücklich belegtes Backup ist ein Weiterbetrieb bei Stromausfall nicht zugesichert.
- **Direkte Montage: Laut Hersteller bei vielen Klappen von SURE Petcare und Closer Pets** — Gleiche Ausschnitt und Einbaumaterial vor dem Kauf mit den dokumentierten Montagevorgaben ab; Rahmenmaß und benötigte Öffnung sind unterschiedliche Maße.
- **Bluetooth: Für die Einrichtung per Smartphone erforderlich** — Bluetooth belegt eine Verbindung im Nahbereich; ein Fernzugriff von unterwegs ist damit allein nicht zugesichert.
- **Geeignet für: Gechipte Freigängerkatzen mit kompatibler Mikrochip-Katzenklappe** — Gleiche die dokumentierte Tierart und Größenfreigabe mit deinem Tier ab; eine Freigabe für kleine Tiere gilt nicht automatisch für größere Tiere.

## Reproduktion

```sh
npm run build:pfotentechnik
npm --workspace apps/pfotentechnik run audit:decision-facts
npm --workspace apps/pfotentechnik run report:product-integration
npm --workspace apps/pfotentechnik run report:decision-consequences
npm --workspace apps/pfotentechnik run test:product-integration
npm --workspace apps/pfotentechnik run test:product-freshness
npm --workspace apps/pfotentechnik run test:decision-consequences
```

Die Baseline wird absichtlich nicht neu erzeugt. `snapshot.mjs --capture` verweigert das Überschreiben eines vorhandenen Ausgangsstands.
