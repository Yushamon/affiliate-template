# PfotenTechnik 37.1 – Premium UX Refinement

Überarbeitung der bestehenden Route `/ratgeber/technikgeschenke-haustiere/`. Kein Merge, kein Deployment.

## Sichtbare Änderungen

Die Tierauswahl verwendet Ausschnitte des vorhandenen, selbst generierten Titelmotivs. Katze, Hund und beide Tiere haben eigene Bildausschnitte; native Radiobuttons, ein kontrastreicher Auswahlrahmen und ein Häkchen bilden den Zustand gemeinsam ab. Die Bilder sind dekorativ, die Textlabels bleiben die zugänglichen Namen. Der Symbolcharakter wird direkt unter der Tierauswahl benannt.

Fortschritt wird durch vier beschriftete Schritte, eine durchgehende Fortschrittslinie und eine aktuelle Handlungsbeschreibung deutlich. Die vorhandenen Höhen- und Schrittwechsel wurden beibehalten. Ein kurzer Übergang mit Ergebnisbestätigung und einer separaten Einblendung der Ergebnisüberschrift schließt den Finder ab. Kein künstlicher Ladebildschirm, keine zusätzliche Wartezeit. Alle Bewegungen beachten Reduced Motion.

Das erste bestätigte Modell der bestehenden Empfehlungsreihenfolge erhält eine größere, typografisch hervorgehobene Darstellung. Zwei Alternativen stehen am Desktop kompakt daneben und auf Mobile darunter. Die Hauptempfehlung bleibt auch beim Sortieren stabil; der entsprechend beschriftete Schalter sortiert die Alternativen. Ein höherer Einzelwert eines anderen Modells wird nicht überschrieben oder verborgen: Empfehlung folgt weiterhin der bestehenden Advisor-Reihenfolge, nicht einer neu erfundenen Bewertung.

Alternativen zeigen vorzugsweise einen bereits vorhandenen Vorteil, dessen exakter Wortlaut bei den anderen sichtbaren Modellen fehlt. Beispiel: Granary Dual „Zwei Edelstahlnäpfe“, Granary WiFi „bis zu zehn Mahlzeiten täglich“. Wenn kein solcher vorhandener Text existiert, bleibt der erste dokumentierte Vorteil. Das ist ausschließlich die Auswahl angezeigter Texte, keine neue Eignungs- oder Rangfolgeregel.

Auf Mobile stehen Modell, Entscheidungsargumente, Einschränkung und Preis vor der Detailfülle. Weitere Vor- und Nachteile, alle bisherigen technischen Entscheidungshinweise und die Bewertungsgrundlage bleiben in nativen Details erreichbar. Vergleich mit zwei bis drei Modellen, Antwortkorrektur, Deep Links, Preis-Sortierung, Händlerziele und Tastaturbedienung bleiben erhalten.

## Bildsprache

In Modellkarten werden keine Kategorie-Symbolfotos mehr gezeigt. Die vorher drei gleichen Fütterungs- beziehungsweise wiederkehrenden Brunnenmotive konnten trotz Beschriftung wie Modellfotos wirken. Jetzt unterscheiden Typografie, Geräteklasse, Modellname und dokumentierte Eigenschaften die Karten. Keine Darstellung eines erfundenen Produkts und keine neue Verwendung fremder Modellbilder.

Die emotionale Bildsprache bleibt im Hero, bei der Tierauswahl und als eindeutig beschriftete redaktionelle Illustration erhalten. Alle Motive stammen aus den bereits dokumentierten eigenen KI-Assets aus 37.0; es wurden keine neuen Bilder generiert oder Fremdbilder beschafft. [Unveränderte Bildprovenienz](../research/gift-guide-37.0/image-plan.json).

## Interaktiver Mittelteil

Zwei Ergänzungen erschließen bestehende Beratungsthemen, während der vollständige ursprüngliche Markdown-Ratgeber unverändert und direkt indexierbar bleibt:

1. **Gerät und Digitaldienst:** Ein Modellwähler stellt Gerätepreis und den bereits hinterlegten Zwölfmonatsbetrag gegenüber. Der Dienstanteil ergibt sich aus dem bestehenden Gesamtbetrag abzüglich Gerätepreis. Es wird kein zweites Tarifmodell aufgebaut. Unbekannte Gesamtbeträge bleiben „Nicht vollständig belegt“; fehlende Dienstkosten werden nicht als null ausgegeben. Optionale Dienste, ausgeschlossene Verbrauchsteile/Versand und unbekannte Verfügbarkeit werden ausdrücklich benannt. Enthaltene Paketmonate bleiben durch den bereits berechneten Originalbetrag berücksichtigt.
2. **Die Funktion hinterfragen:** Drei auswählbare Aufgaben verdeutlichen vorhandene Grenzen: getrennte Rationen, Zuhause nachsehen und unterwegs orten. Aussagen stammen aus der bestehenden Beratung. Sie lösen keine automatische Produktempfehlung aus. Ohne JavaScript sind alle drei Antworten lesbar; der nicht bedienbare Modellwähler ist deaktiviert und ein vollständiges Kostenbeispiel bleibt sichtbar.

## HTML und Datenübertragung

Die Baseline wurde vor den Änderungen unveränderlich unter `research/gift-guide-37.1/baseline.json.gz` gesichert. Sie enthält die Originalgrößen und den kompletten bisherigen Darstellungskatalog.

Hauptursachen der Ausgangsgröße waren 56 vollständige inaktive Modellkarten-Vorlagen und ein 336.695 Byte großer JSON-Katalog. Im Advisor-Objekt wurden Marketingtexte, Vorteile, Nachteile und Fähigkeiten nochmals übertragen, obwohl die Karte diese Daten bereits separat besitzt.

Jetzt wird eine einzige serverseitig erzeugte Vorlage verwendet. Der Browser setzt Modellaussagen ausschließlich als Text und die bestehenden aufgelösten Ziele als URLs ein. Der Advisor erhält dieselben tatsächlich benötigten Fakten und Sortierfelder. Der vollständige Katalog bleibt initial verfügbar; es wird nichts durch zusätzliche Fetches oder ein neues API nachgeladen.

Alle drei initialen Modellbeispiele samt Detailinhalten, der vollständige Ratgeber, Hero, zwei Beratungswerkzeuge, FAQ und Metadaten bleiben im SSR-HTML. Die Größenreduktion entfernt wiederholte Übertragung, keine wichtigen SSR-Inhalte.

## Abschlussprüfung und exakte Größen

- HTML: **658.535 → 301.519 Byte** (643,1 → 294,5 KiB), **−54,2 %**.
- HTML mit lokalem gzip: **100.134 → 50.732 Byte** (97,8 → 49,5 KiB), **−49,3 %**. Keine Behauptung über eine gemessene Hosting-Konfiguration.
- JSON-Katalog: 336.695 → 216.518 Byte; Modellvorlagen: **56 → 1**. Alle 56 Modelle und sämtliche für die Funktion nötigen Daten bleiben vorhanden.
- Endgültiger Build bestanden: **391 generierte Seiten**, unverändert 270 öffentliche Canonicals und 269 Sitemap-URLs. In 37.1 keine neuen oder entfernten öffentlichen Routen.
- **229 Tests bestanden:** 25 Geschenkfinder-Tests (16 bestehende, 9 neue), 145 Produktintegration/Commerce/Rendering, 59 Advisor-/Freshness-/Entscheidungshinweis-/Product-Operations-Regressionen.
- Transportvergleich für 180 Kombinationen aus Tier, Wunsch, Budget und Futterart: identische Eignung, Reihenfolge, Gründe und offene Angaben. Zusätzlich 60 Szenarien des tatsächlichen gebauten Katalogs mit dem Originalkatalog verglichen.
- Alle 110 Produktdateien bytegleich; alle 259 vorher vorhandenen Content-Dateien aus der Vor-Geschenkfinder-Baseline unverändert. Die 437 Originalhinweise auf 73 Produkten bleiben unverändert und gesperrt. Preise, Scores, Affiliate-Ziele, technische Hinweise und Vergleichswerte im transportierten Katalog mit der 37.0-Baseline exakt abgeglichen.
- Experiment 35.5: **20 geschützte Seiten und 205 eingehende Linkzugänge unverändert**. Bestehende Arbeiten aus 35.9–36.1 erhalten. Keine neuen Dependencies.
- Genau vier neue Fullpage-Screenshots: 375/1600, Light/Dark. Keine horizontalen Seitenüberläufe, defekten Bilder oder JavaScript-Ausnahmen. Finder, Eingabevalidierung, Zurück/Editieren, Deep Links, Hauptempfehlung, Sortierung der Alternativen, richtige Modellwerte in der gemeinsamen Vorlage, vollständige Details, Vergleich mit zwei Modellen und Limit von drei, Kosten und offene Kosten sowie die Funktionsfragen im Browser geprüft.
- Native Tastaturauswahl, Fokus nach Schließen des Vergleichs, Reduced Motion und hilfreiche Inhalte ohne JavaScript bestanden. Vier repräsentative Textrollen in allen Ansichten gemessen: mindestens **5,11:1** Kontrast. Das ist eine dokumentierte Stichprobe, keine vollständige WCAG-Zertifizierung.
- Finalen Diff einschließlich neuer Komponenten, Transport, Tests, QA-Skripten und Bericht geprüft; `git diff --check` und Syntaxprüfungen der neuen/geänderten TypeScript-Module bestanden. Kein Merge, kein Push, kein Deployment.


## Kritischer Vergleich mit 37.0 und den drei UX-Referenzen

- **Mobile Tierauswahl / Referenz A:** Fotos und ausgewählte Zustände sind jetzt deutlich erkennbar. Fortschritt und aktuelle Aufgabe sind klarer. Der Hero wird mobil um weitere 35 Pixel gekürzt; große bildfüllende Auswahlkarten aus dem Mockup werden zugunsten kurzer Wege nicht übernommen.
- **Editorial / Referenz B:** Bestehende Graphite-Navy-/Light-Tokens, ruhige Serifentypografie und das eigene Tiermotiv bleiben erhalten. Zwei interaktive Beratungsmodule durchbrechen den vorher weitgehend linearen Mittelteil. Der vollständige Text macht die Seite weiterhin lang; sie wird deshalb nicht künstlich auf eine kurze Verkaufsstrecke gekürzt.
- **Empfehlungen / Referenz C:** Statt drei gleich großen Boxen mit identischem Foto gibt es ein primäres Modell und kompakte Alternativen mit sichtbaren Unterschieden. Ein zentraler Vergleich bleibt verfügbar. Bewertungskreise, illustrative Mockup-Scores und unbelegte Versprechen werden weiterhin nicht übernommen.
- **Bewusste Grenze:** Ohne belegte Nutzungsgrundlage werden keine echten Modellfotos eingebunden. Die neue Darstellung ist deshalb bei den Empfehlungen stärker typografisch als die Produktfoto-Referenz. Die Tierauswahl verwendet Ausschnitte eines gemeinsamen Originalmotivs; sie täuscht keine drei verschiedenen Aufnahmen vor.
- **Umfang:** Die neuen Beratungswerkzeuge benötigen sichtbaren Platz. Eine kleinere HTML-Datei bedeutet daher nicht automatisch eine kürzere gesamte Seite oder einen belegten Core-Web-Vitals-Gewinn. Es liegt keine Produktivmessung vor.

## Nachweise und Reproduktion

[Maschinenlesbare Build-/Quellprüfung und Größen](gift-guide-37.1-qa/verification.json) · [Browserprüfung](gift-guide-37.1-qa/browser.json)

Genau vier neue Fullpage-Dateien; die vier 37.0-Vergleichsbilder bleiben erhalten:

- [375 Light – Tierauswahl](gift-guide-37.1-qa/gift-guide-37.1-375-light.png)
- [375 Dark – persönliche Ergebnisse](gift-guide-37.1-qa/gift-guide-37.1-375-dark.png)
- [1600 Light – Tierauswahl](gift-guide-37.1-qa/gift-guide-37.1-1600-light.png)
- [1600 Dark – persönliche Ergebnisse](gift-guide-37.1-qa/gift-guide-37.1-1600-dark.png)

```sh
npm run build:pfotentechnik
npm --workspace apps/pfotentechnik run test:gift-guide
npm --workspace apps/pfotentechnik run test:product-integration
node --test apps/pfotentechnik/test/advisor-decision-b1.test.mjs apps/pfotentechnik/test/advisor-foundation.test.mjs apps/pfotentechnik/test/product-freshness-36.0.test.mjs apps/pfotentechnik/test/decision-consequences-35.9.test.mjs apps/pfotentechnik/test/product-operations.test.mjs
npm --workspace apps/pfotentechnik run check:gift-guide
npm --workspace apps/pfotentechnik run qa:gift-guide
```

Prüfungen gegen das gerenderte Inventar erst nach beendetem Build starten. Browser-QA nutzt lokal installiertes Chrome und einen temporären lokalen Static-Server; beide werden danach beendet. Keine neuen Dependencies, kein separater Produktbestand und keine Änderungen an der bestehenden Empfehlungslogik.
