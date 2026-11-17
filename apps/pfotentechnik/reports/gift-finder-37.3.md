# PfotenTechnik 37.3 – Geschenkfinder, Empfehlungen und Kaufpreis

Die bestehende Route `/ratgeber/technikgeschenke-haustiere/` wurde überarbeitet. Kein Merge, Push oder Deployment. Die Bildsprache, Typografie und Light-/Dark-Tokens bleiben erhalten. Keine neuen Dependencies und keine zweite Produktdatenbank.

## Gewichtsauswahl vorher / nachher

Vorher gab es ein numerisches Gewichtsformular. Ohne Eingabe blieb der GPS-Abgleich offen; für „Beide“ wurde nach dem leichteren Tier gefragt. Jetzt erscheinen ausschließlich bei der Ortung native Radio-Chips mit vorausgewählter mittlerer Klasse:

- Katze: klein unter 3 kg, normal 3–6 kg, groß über 6 kg.
- Hund: klein unter 10 kg, mittel 10–25 kg, groß über 25 kg.

Die Grenzen wurden gegen den bestehenden Katalog geprüft: PAJ, Weenect XS und Tractive CAT beginnen bei 3 kg; Pawfit bei 3,5 kg, Tractive DOG bei 4 kg und DOG XL bei 20 kg. Tractive CAT hat zusätzlich eine dokumentierte Obergrenze von 8 kg. Die Klassen sind deshalb ausdrücklich Bereiche, keine angenommenen Einzelgewichte.

Liegt eine Klasse vollständig außerhalb einer Modellgrenze, wird das Modell ausgeschlossen. Überschneidet sie eine Grenze, bleibt das Modell nur mit einem konkreten Hinweis im Ergebnis, beispielsweise „erst ab 20 kg geeignet“. Offene Endpunkte werden berücksichtigt: „unter 3 kg“ erfüllt keine Mindestgrenze von 3 kg. „Über 6 kg“ bestätigt keine Obergrenze von 8 kg für die ganze Klasse.

Das optionale Feld „Genaues Gewicht eingeben“ steht in einem Aufklappbereich. Ein gültiger exakter Wert ersetzt den Klassenbereich. Bei Hund und Katze werden eigene Klassen und eigene Gewichte erfasst. Alte Einzelgewicht-Links bleiben für eine Tierart nutzbar; ein altes gemeinsames Gewicht wird bei „Beide“ nicht stillschweigend auf zwei Tiere übertragen. Ungültige Eingaben können auch über die Fortschrittsnavigation nicht übersprungen werden.

## Entfernte Fragen und vereinfachte Führung

Die Frage nach laufenden Dienstkosten wurde vollständig entfernt. Es gibt keine Ersatzfrage; alte `abo`-URL-Parameter beeinflussen die Empfehlung nicht mehr und werden beim Teilen nicht erzeugt. Alle vorhandenen Produkt- und Tarifdaten bleiben in ihren ursprünglichen Quellen erhalten.

Weiterhin werden Tier, Alltagswunsch und Gerätebudget abgefragt. Futterart erscheint nur bei Fütterung, Gewicht nur bei Ortung. Größenklassen haben sinnvolle Standardwerte; Tierart und Wunsch bleiben bewusste Entscheidungen. Zurücknavigation, Antwortkorrektur, Browserhistorie und Deep Links erhalten die Auswahl. Interne Begriffe wurden aus zentralen Texten entfernt.

## Neue Empfehlungslogik

Der vorhandene Advisor prüft weiterhin dokumentierte Widersprüche bei Tierart, Futterart und Gerätebudget. Der Geschenkfinder ergänzt den Bereichsabgleich für Gewichte. Unveröffentlichte, archivierte, abgekündigte und nachweislich nicht verfügbare Produkte bleiben bereits beim Katalogaufbau ausgeschlossen. Der geschützte Bestand aus Experiment 35.5 bleibt ebenfalls aus dem Finder ausgeschlossen.

Unbekannte Lieferbarkeit verhindert keine fachlich vertretbare Empfehlung mehr. Fehlende technische Angaben werden als Einschränkung behandelt und erzeugen keine positiven Gründe. Alle vertretbaren Modelle stehen in einer gemeinsamen Ergebnisliste; der separate Rückfragebereich entfällt.

Die Sortierung berücksichtigt zuerst einen bekannten Gerätepreis, dann die technische Passung, anschließend den vorhandenen redaktionellen Empfehlungsstatus und Score. Gleichstände werden stabil nach Slug aufgelöst. Bei offener Inspiration bleibt die vorhandene Streuung über unterschiedliche Produktbereiche erhalten. Es gibt keinen neuen Produkt- oder Geschenk-Score.

Bekannte Preise über dem Budget bleiben ausgeschlossen. Unbekannte beziehungsweise vom bestehenden Preisresolver nicht mehr als aktuell ausgegebene Preise stehen nachrangig und mit ausdrücklichem Hinweis auf die offene Budgeteinhaltung. Optionale Dienste und verpflichtende Folgekosten werden dem Gerätebudget nicht zugeschlagen.

## Ergebniszustände und Produktkarten

Das Ergebnis zeigt eine Hauptempfehlung und höchstens zwei Alternativen. Die neue Überschrift lautet „Diese Technikgeschenke passen zu deiner Auswahl.“ Wenn nur eingeschränkte Kandidaten vorhanden sind: „Diese Modelle kommen deinem Wunsch am nächsten.“ Bei tatsächlich fehlenden Kandidaten werden andere Wünsche beziehungsweise ein angepasster Preisrahmen vorgeschlagen; ungeeignete Modelle werden nicht aufgefüllt.

Die früheren bestätigten Treffer und offenen Vorschläge erscheinen nicht mehr als getrennte Gruppen. Pro Karte steht höchstens ein kurzer Hinweis auf eine Datenlücke außerhalb der Details. Weitere Hinweise bleiben im Aufklappbereich. Allgemeine ungeklärte Dienstkosten werden ebenfalls dorthin verlagert, statt auf allen Karten denselben Warntext zu wiederholen.

Die Hauptempfehlung zeigt zwei vorhandene konkrete Stärken und gegebenenfalls einen zusätzlichen passenden Gewichtsgrund. Alternativen heben vorhandene abweichende Stärken hervor. Eine wesentliche Schwäche bleibt sichtbar; weitere Eigenschaften, Einschränkungen und Bewertungsgrundlagen sind aufklappbar. Produktname, Bewertung, Gerätepreis, Produktlink und unverändertes Händlerziel bleiben erreichbar. Die Hauptempfehlung bleibt beim Sortieren der Alternativen stabil. Der Direktvergleich unterstützt zwei bis drei Modelle.

Geschenkeignung wird aus vorhandenen Aussagen vermittelt, etwa „ohne WLAN und App“, Einschränkungen bei Futter oder Zugangskontrolle sowie notwendige Dienste. Einrichtungs-, Pflege- oder Mehrtierbehauptungen werden nicht aus Datenlücken erfunden. Die bestehenden redaktionellen Abschnitte erklären außerdem Konten, Privatsphäre, Reinigung und gemeinsame Auswahl.

## Kaufpreis und Seitenstruktur

Der große Rechner „Gerät + Digitaldienst = Zusammen“ wurde durch einen kompakten Modellwähler mit Gerätepreis, sachlichem Diensthinweis und Link zur Produktseite ersetzt. Überschrift: „Was kostet ein gutes Technikgeschenk?“

Beispiel PETLIBRO Scout: **109,99 € Gerätepreis**, daneben nachgeordnet **optionaler Digitaldienst 129,99 € / Jahr**. Der vorher prominente Gesamtbetrag von 239,98 € entfällt. Pflichtdienste werden ausdrücklich als erforderlich beschrieben; ein belegter aktueller Tarif wird ergänzt. Enthaltene Servicemonate werden direkt benannt. Es wird kein Paket doppelt berechnet und kein unbekannter Dienstpreis als null angenommen. Auf einen Erstjahresgesamtbetrag wird vollständig verzichtet.

Nach den Empfehlungen folgen zuerst Geschenkgeeignetheit, Pflege und Funktion. Erst danach kommt der Kostenbereich. Desktopkarten nutzen drei Spalten mit einer kompakteren Hauptempfehlung; mobile Alternativen bleiben kürzer als die Hauptkarte. Vorhandene Bilder, FAQ und der vollständige ursprüngliche Markdown-Ratgeber bleiben erhalten. Ohne JavaScript sind Modellbeispiele, Kostenbeispiel, alle drei Funktionsantworten und die Kaufberatung direkt lesbar.

## Drei reproduzierte Problemtypen

Die Beschreibung enthielt keine separat beigefügten Originalscreenshots. Deshalb wurden die drei konkret beschriebenen Funktionsprobleme am vorhandenen 37.1-Katalog reproduziert, nicht als pixelgenaue Rekonstruktion unbekannter Auswahlen ausgegeben. [Maschinenlesbarer Vergleich](gift-finder-37.3-qa/problem-cases.json):

1. **Katze / Ortung / 150 € ohne Zahleneingabe:** vorher null bestätigte Empfehlungen und drei zurückgestellte Modelle. Jetzt liefert die vorausgewählte Klasse 3–6 kg Weenect XS, Tractive CAT und PAJ mit einem knappen Lieferbarkeitshinweis. Unter 3 kg werden diese Modelle ausgeschlossen; exakt 4 kg hat Vorrang vor dem kleinen Chip.
2. **Hund / Fütterung / 150 € / Futterart unbekannt:** vorher null bestätigte Empfehlungen und 13 zurückgestellte Modelle. Jetzt werden vertretbare Modelle gemeinsam gezeigt, mit dem konkreten Hinweis, die Futterart zu prüfen. Unbekannte Lieferbarkeit erzeugt keinen eigenen Ergebniszustand.
3. **PETLIBRO Scout und optionaler Jahresdienst:** vorher 239,98 € als dominanter Geräte-und-Dienst-Gesamtbetrag. Jetzt steht 109,99 € als Kaufpreis im Vordergrund; 129,99 € pro Jahr werden ausdrücklich optional ausgewiesen.

## Build, SEO und Performance

Der abschließende Produktionsbuild ist erfolgreich: **391 generierte Seiten**. Der öffentliche Bestand bleibt bei **270 Canonicals und 269 Sitemap-URLs**. Canonical, strukturierte Daten, FAQ, interne Ziele und die vorhandenen Routen wurden geprüft; keine defekten internen Ziele auf der Geschenkseite.

HTML gegenüber 37.1: **301.519 → 294.674 Byte**, etwa **2,3 % kleiner**. Lokal gzip: **50.732 → 50.196 Byte**. Gegenüber der Ausgangsbasis aus 37.0 bleibt die HTML-Reduktion bei **55,3 %**. Ungenutzte Symbolbild-Metadaten werden nicht mehr an den Browserkatalog übertragen. Alle 56 Modelle und die eine gemeinsame Kartenvorlage bleiben erhalten. Keine neuen Katalogrequests oder JavaScript-Abhängigkeiten. Dies sind Buildgrößen, keine behauptete Messung produktiver Core Web Vitals.

## Regressionstests und Schutzregeln

- **38 Geschenkfinder-Tests bestanden**, einschließlich bestehender Tests aus 37.0/37.1 und 13 Tests aus 37.3. Abgedeckt: Bereiche, Standardklassen, exakte Grenzen, getrennte Gewichte, unbekannte Daten, harte Widersprüche, Budget, Sortierung, Tarifdarstellung und Transport.
- **143 von 145 Integrationsprüfungen bestanden**.
- **70 von 74 zusätzlichen Advisor-, Freshness-, Entscheidungshinweis-, Product-Operations- und Tarifprüfungen bestanden**.
- Insgesamt **251 bestanden, sechs ältere Assertions fehlgeschlagen**. Die Fehler werden nicht als erfolgreiche Tests gezählt; Einzelheiten stehen unten und in [tests.json](gift-finder-37.3-qa/tests.json).
- Die neue Build-/Quellprüfung und die Browser-QA bestehen. 60 Kombinationen aus Tier, Wunsch und Budget wurden zusätzlich am gebauten Katalog geprüft. Der Transporttest prüft 180 Kombinationen einschließlich Futterart.
- Alle **110 Produktdateien und 259 ursprünglichen Content-Dateien bytegleich**. Die **437 gesperrten Originalhinweise auf 73 Produkten unverändert**. Gespeicherte Produktpreise, Scores und Affiliate-Ziele wurden nicht bearbeitet; technische Kartenangaben und bestehende Händlerziele wurden gegen die Baseline geprüft.
- Alle **20 Experimentseiten und 205 eingehenden Linkkanten** geprüft: Links und Inhalte sind unverändert bis auf die unten ausdrücklich ausgewiesene zeitabhängige Preisbeschriftung. Keine Änderungen an der Experimentimplementierung.
- Browserprüfung bei 375 und 1600 Pixeln, Light/Dark: Gewichts-Chips, getrennte Gewichte, exakter Vorrang, Validierung über Schrittlinks, Hauptempfehlung/Alternativen, Sortierung, Direktvergleich, Browser-Zurück, Deep Links, native Tastaturauswahl einschließlich Gewichts-Chips, Fokus, Reduced Motion und Betrieb ohne JavaScript. Keine JavaScript-Ausnahmen, defekten Bilder oder horizontalen Seitenüberläufe. Repräsentative Textkontraste mindestens 4,5:1; keine Behauptung einer vollständigen Accessibility-Zertifizierung.

[Build-/Quellprüfung](gift-finder-37.3-qa/verification.json) · [Browserprüfung](gift-finder-37.3-qa/browser.json)

## Bekannte Grenzen und offene Punkte

Fünf ältere Assertions vergleichen vollständige historische Experiment-Snapshots. Bei PawSync Smart Pet Feeder und PETLIBRO Dockstream Cordless hat die unveränderte zentrale Preisaktualitätsprüfung inzwischen „Anschaffungspreis / Hinterlegter Preis“ in „Früherer Anschaffungspreis / Veralteter Preisstand“ geändert. Die Preiswerte selbst und sämtliche Links sind identisch. [Exakter Textunterschied](gift-finder-37.3-qa/protected-render-drift.json). Die neue Featureprüfung weist diese zwei Fälle gesondert aus und prüft alle übrigen Texte und Links strikt. Die alten Tests beziehungsweise deren Baselines wurden nicht umgeschrieben.

Die sechste fehlgeschlagene Assertion stammt aus dem unveränderten Product-Operations-Test: Er erwartet 20 aktive GPS-/Kameraprodukte; die vorhandenen Quellen ergeben 22. Die Quellen sind bytegleich. Diese Bestandsannahme und die historische Behandlung zeitabhängiger Preisbadges sollten separat bereinigt werden.

Einzelne im alten Build bekannte Preise sind inzwischen durch die bestehende Freshness-Regel unbekannt. Das ist keine Änderung gespeicherter Preise und wird nicht durch künstliche Preisannahmen oder ein zurückgesetztes Prüfdatum kaschiert. 44 der 56 Katalogmodelle besitzen keine bestätigte aktuelle Lieferbarkeit. Herstellerpassform, die Akzeptanz laufender Kosten und die konkrete Einrichtung bleiben notwendige Kaufentscheidungen der beschenkten Person. Die Größenklasse ersetzt keine Prüfung eines Grenzfalls.

## Screenshots und Vorher-Nachher

Vorher: [375 Light](gift-guide-37.1-qa/gift-guide-37.1-375-light.png), [375 Dark](gift-guide-37.1-qa/gift-guide-37.1-375-dark.png), [1600 Light](gift-guide-37.1-qa/gift-guide-37.1-1600-light.png), [1600 Dark](gift-guide-37.1-qa/gift-guide-37.1-1600-dark.png). Die Light-Bilder aus 37.1 zeigen den initialen Finder, die Dark-Bilder persönliche Ergebnisse; diese unterschiedlichen Zustände werden nicht als identische Szenarien behandelt.

Vier neue Fullpage-Aufnahmen zeigen einheitlich Hund / Fütterung / 150 € / Trockenfutter:

- [375 Light](gift-finder-37.3-qa/gift-guide-37.3-375-light.png)
- [375 Dark](gift-finder-37.3-qa/gift-guide-37.3-375-dark.png)
- [1600 Light](gift-finder-37.3-qa/gift-guide-37.3-1600-light.png)
- [1600 Dark](gift-finder-37.3-qa/gift-guide-37.3-1600-dark.png)

Zusätzlich: [Detailaufnahme der Gewichtsauswahl](gift-finder-37.3-qa/weight-375-light.png). Im Nachher-Vergleich sind der separate Rückfrageblock und der große Gesamtpreis entfernt, der Kostenbereich liegt hinter der Eignungsberatung, und die Produktkarten sind kompakter. Die Screenshots werden gegen den lokalen Produktionsbuild erstellt.

## Reproduktion

```sh
npm run build:pfotentechnik
npm --workspace apps/pfotentechnik run test:gift-guide
npm --workspace apps/pfotentechnik run check:gift-guide
npm --workspace apps/pfotentechnik run qa:gift-guide
npm --workspace apps/pfotentechnik run test:product-integration
```

Die zusätzlichen sechs Domain-Testdateien und Ergebnisse stehen in `gift-finder-37.3-qa/tests.json`. Prüfungen am gerenderten Bestand erst nach beendetem Build starten. Browser-QA nutzt einen temporären lokalen Static-Server und Headless Chrome und beendet beide danach. Kein Dev-Server gestartet.
