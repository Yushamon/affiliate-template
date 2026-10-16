# Kompakter Kaufbereich auf Produktseiten

Die zentrale `PriceBox2.astro` rendert den Kaufbereich aller 103 Produktdetailseiten kompakter. Amazon-Linkauflösung, Partner-IDs, Produktzuordnungen, Awin-/Adcell-Integrationen, Produktdaten und JSON-LD bleiben unverändert.

## Darstellung

- Bei lediglich unbekannter Verfügbarkeit entfällt die öffentliche Statusbox samt interner Begründung. Die Operationsdaten und Cockpit-Meldungen bleiben bestehen. Hinweise auf ausdrücklich eingestellte oder nicht lieferbare Produkte bleiben sichtbar.
- Unter den Händleroptionen steht einmal „Preis und Verfügbarkeit beim Händler prüfen“ mit Affiliate-Kennzeichnung. Der Amazon-Button heißt „Bei Amazon ansehen“ und bleibt bei unbekannter Verfügbarkeit anklickbar.
- Bei einer Händleroption erscheint der Anschaffungspreis einmal prominent. Ein validierter Händlerpreis hat Vorrang. Ältere redaktionelle Preise werden als „Zuletzt erfasster Anschaffungspreis“ und „Veralteter Preisstand“ bzw. „Nicht aktuell bestätigt“ gekennzeichnet. Fehlende Preise werden nicht erfunden.
- Bei mehreren Händlern stehen vorhandene aktuelle Preise in den jeweiligen Karten. Es gibt keine zusätzliche Anschaffungspreis-Zeile. Unbekannte Preise, Prüfdatums- und Versandkosten-Platzhalter sowie Bestpreis-Werbung entfallen. Tatsächlich bekannte Versandkosten und Varianten bleiben erhalten.
- Optionale Abos erscheinen als „Optionales Abo möglich“. Bekannte Tarifbeträge bleiben direkt sichtbar. Pflichtabos, erforderliche Prepaid-Dienste, bekannte Zahlungsintervalle und Vorauszahlungen bleiben oberhalb der Händleroptionen sichtbar. Unbekannte Pflichtkosten werden ausdrücklich als zu prüfender Tarif ausgewiesen.
- Tariflisten, Funktionsumfang ohne/mit Dienst, Quellen und Rechenbeispiele bleiben in einem geschlossenen nativen `details`-Element unter dem Kaufbereich erreichbar. Bestehende Design-Tokens, Dark Mode und Fokuszustände werden verwendet.

## Nachweis der Platzersparnis

Chrome-Messung desselben PETKIT-Produkts, öffentliche bisherige Darstellung gegenüber lokalem Production Build, jeweils mit geschlossenem Tarifbereich:

| Viewport | Bisher | Kompakt | Weniger Höhe |
| --- | ---: | ---: | ---: |
| 360 px | 815 px | 378 px | 54 % |
| 375 px | 815 px | 378 px | 54 % |
| 390 px | 815 px | 378 px | 54 % |
| 430 px | 712 px | 308 px | 57 % |
| 1440 px | 598 px | 300 px | 50 % |

Die Messung bezieht sich auf die gesamte Preisbox, nicht auf die gesamte Produktseite. Die exakten Werte und ausgegebenen Links stehen in [browser-before.json](browser-before.json) und [browser.json](browser.json). Die öffentliche Vorher-Messung ist eine Momentaufnahme; sie behauptet keinen künftigen Produktionszustand.

375-px-Aufnahmen: [vorher](before-petkit-yumshare-dual-hopper-375.png), [nachher](after-petkit-yumshare-dual-hopper-375.png).

## Tests und Reproduktion

```sh
npm run build:pfotentechnik
npm --workspace apps/pfotentechnik test
npm run test:affiliate
npm --workspace apps/pfotentechnik run lint:content
npm --workspace apps/pfotentechnik run audit:technical-seo
node apps/pfotentechnik/scripts/price-intelligence/rendered-integrity-audit.mjs
node apps/pfotentechnik/scripts/price-intelligence/compact-purchase-browser.mjs
```

Für die Browserprüfung wird Chrome/Chromium benötigt; bei Bedarf `CHROME_PATH` auf die ausführbare Datei setzen. Das Skript stellt `dist` selbst lokal bereit und beendet Server und Browser anschließend. Optional lässt sich mit `--base-url=http://127.0.0.1:PORT` ein vorhandener Produktionspreview prüfen. `--baseline --base-url=https://pfotentechnik.de` zeichnet eine separate öffentliche Vergleichsmessung ohne die neuen UI-Assertions auf. Händlerziele werden nicht angeklickt.

Ergebnisse:

- Production Build: **374 Seiten erfolgreich**.
- App-Tests: **981 bestanden**, darunter **12 neue Rendering-Tests** gegen die tatsächliche Astro-Komponente. Abgedeckt sind unbekannte Verfügbarkeit, fehlende/alte Preise, optionale/erforderliche/unbekannte/veraltete Tarife, Prepaid-Bedingungen, mehrere Händler und PETKITs exakter vorhandener Amazon-Link. Ein zusätzlicher Test prüft sämtliche gebauten Produktseiten gegen die zentral aufgelösten Händlerziele und den einmaligen Verfügbarkeitshinweis.
- Affiliate-Core: **26 Tests bestanden**.
- Browser: **15 Kombinationen bestanden**, drei Produktseiten bei 360, 375, 390, 430 und 1440 Pixeln. Geprüft werden Überlauf, mindestens 44 Pixel hohe CTA-Flächen, tatsächliche Klickbarkeit, `sponsored`, genau ein Händlerhinweis und entfernte Unknown-Box.
- Reale Browserfälle: PETKIT YumShare Dual-Hopper; PETLIBRO Polar mit gleichzeitigem Amazon- und Awin-Button; Tractive CAT 6 Mini mit Pflichtabo. Adcell und Herstellerlinks sind zusätzlich im Rendering-Test mit getrennten unveränderten URLs abgedeckt; ein produktiver Adcell-Klick wird damit nicht behauptet.
- Preis-/Verfügbarkeits-Integritätsaudit: **103 Produkte, 9 zulässige Offer-Schemas, 92 Reviews, 28 Vergleichsseiten, keine Fehler**. Die sichtbare Unknown-Meldung wurde im bestehenden Audit durch den neuen Händlerhinweis ersetzt; die Schema- und Fremdwährungsprüfungen bleiben bestehen.
- Technischer SEO-Audit: bestanden.
- Editorial Lint: **0 Fehler, 238 bestehende Warnungen**.
- Ein eigenständiger Typecheck und ein allgemeiner Code-Linter sind im Projekt nicht eingerichtet; entsprechende Prüfungen werden nicht als ausgeführt ausgegeben. Astro-Build, Rendering-Tests und vorhandener Content-Linter wurden ausgeführt.

## Git- und Produktionsstatus

Die Implementierung und ersten Tests wurden während der Bearbeitung durch externe Git-Schritte bereits in `6a8d410f` auf `main` übernommen; `5d8baa38` enthält den abschließenden UI-Feinschliff und den Browserprüfer. Dieser Review ergänzt einen Regressionstest über sämtliche Produktseiten, die abschließende Dokumentation, aktualisierte Browsernachweise und Vorher-/Nachher-Aufnahmen. Die bereits auf `main` liegende Implementierung ist deshalb nicht nochmals als neue PR-Differenz enthalten.

Durch diesen Auftrag wurde kein Deployment oder Merge ausgelöst. Aus einem erfolgreichen lokalen Build oder einem Push wird kein Produktionsrollout abgeleitet.

Abschluss der Integration: Auf ausdrücklichen Nutzerwunsch sind dieser Review, das nachfolgende Produktseiten-Redesign und die Amazon-Audit-Ergänzung in `main` zusammengeführt. Die aktuelle erweiterte Testabdeckung besteht mit 985 App-Tests; Build und technische Integritätsprüfungen sind erfolgreich. Kein Deployment wurde gestartet.
