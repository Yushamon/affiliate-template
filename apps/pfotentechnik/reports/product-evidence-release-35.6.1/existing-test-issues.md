# Die drei bestehenden Testfehler

Beleg vor 35.6: 1.217 Tests, drei Fehler; eigenständiger Baseline-Build und Rohlog aus 35.6.
Beleg zum Start dieses Auftrags: vollständiger Wiederholungslauf `logs/app-before.log`.
Die ursprüngliche 35.6-Zusammenfassung ist keine ausreichende Diagnose: Insbesondere der Merchant-Test
scheitert aktuell an Flappies provisionsfreiem Link, der DOG-6-XL-Test an einer ersetzten Formulierung.

## E01 · DOG 6 XL wird nicht fälschlich als hands-on getestet dargestellt

Ersetzte Hinweisformulierung; der tatsächlich fehlgeschlagene Regex erwartete „Plattformwert selbst ist aber nicht produktspezifisch“.

Herstellerdatenstatus, ausdrücklich kein eigener Praxistest, The-Verge-Berichterstattung und externer CHIP-Labortest getrennt prüfen.

Eine überholte Formulierung ist kein eigener Hands-on-Test; die ursprüngliche 35.6-Kurzdiagnose war hier zu grob.

Nutzerauswirkung: unveränderte Produktionsfunktionen; die vorherige Erwartung war überholt. Die klaren
Korrekturen wurden umgesetzt, nicht zurückgestellt. Die Baseline belegt Unabhängigkeit von 35.6;
eine Entstehung durch 35.4/35.5 wird ohne historischen Einzelbeleg nicht behauptet.

## E02 · all built heroes keep complete product names, source-backed chips and the secondary comparison link

Iteration über Quellen einschließlich gesperrter Entwürfe; erwartete öffentliche Granary-2-Route fehlt zu Recht.

Nur publizierte Produkte auf Hero-Ausgabe prüfen; für Entwürfe ausdrücklich Routenabwesenheit verlangen.

Publikationssperren müssen erhalten bleiben; keine Entwurfsseite zum Bestehen des Tests veröffentlichen.

Nutzerauswirkung: unveränderte Produktionsfunktionen; die vorherige Erwartung war überholt. Die klaren
Korrekturen wurden umgesetzt, nicht zurückgestellt. Die Baseline belegt Unabhängigkeit von 35.6;
eine Entstehung durch 35.4/35.5 wird ohne historischen Einzelbeleg nicht behauptet.

## E03 · all built product pages retain exact merchant URLs, metadata hooks and safe public price states

Pauschale sponsored-Pflicht auch für provisionsfreie offizielle Händlerlinks; aktuell Flappie mit rel=nofollow noopener. Der Loop enthielt außerdem Entwürfe.

Exakte Rel-Werte aus dem Commerce-Modell prüfen, Provision/official unterscheiden und Entwurfsabwesenheit absichern.

Offizielle Links sind keine automatisch provisionsberechtigten Affiliate-Links. Ziele und Produktionsausgabe bleiben unverändert.

Nutzerauswirkung: unveränderte Produktionsfunktionen; die vorherige Erwartung war überholt. Die klaren
Korrekturen wurden umgesetzt, nicht zurückgestellt. Die Baseline belegt Unabhängigkeit von 35.6;
eine Entstehung durch 35.4/35.5 wird ohne historischen Einzelbeleg nicht behauptet.

