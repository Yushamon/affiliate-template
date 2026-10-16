# Kontrollierter Indexierungsversuch

## Auswahl und Zweck

[Zwölf priorisierte URLs mit Einzelbefunden und Maßnahmen](current/experiment-plan.md). Alle zwölf gehören im vorhandenen GSC-Export als **exakte aktuelle kanonische URLs** zur Gruppe „Gecrawlt – zurzeit nicht indexiert“. Historische, www- und Slash-Varianten sind keine Anforderungsziele. Die 20 clusterübergreifenden Beobachtungsziele aus dem Hauptaudit bleiben in `current/prioritized-urls.md`; der eigentliche Versuch konzentriert sich auf diese zwölf Crawled-Fälle.

Vier vorgeschlagene Anforderungsfälle:

1. `/vergleiche/kleine-gps-tracker-fuer-katzen/` – nur zwei eingehende Quellen und nachgewiesene inhaltliche Nähe zum allgemeinen Katzenvergleich.
2. `/vergleiche/futterautomat-mit-app/` – erreichbarer Funktionsvergleich mit App-/Offline-Schnittmenge zu anderen Auswahlseiten.
3. `/produkt/petkit-yumshare-solo-2/` – konkreter aktueller Produktpfad mit bestehender historischer Solo-Weiterleitung und historischem GSC-Signal.
4. `/hersteller/petlibro/` – 50 eingehende Quellen, eigene Modellreihen-Navigation; schwache Entdeckung allein passt nicht zum Befund.

Acht zunächst unveränderte Beobachtungsfälle: Zwei-Katzen-Vergleich, Hunde-Trinkbrunnen-Vergleich, PETKIT YumShare Dual-Hopper, PETLIBRO Polar, SureFeed Connect, Hersteller PETKIT, Gesamtgeräte-Reinigung und Seniorenhund-Ratgeber. Ihre konkreten Befunde/Maßnahmen stehen in der Einzelliste. Sie erlauben einen explorativen Vergleich unterschiedlicher Seitentypen und Linkstärken. **Keine randomisierte Studie, keine statistisch belastbare Kausalzuordnung** mit vier gegenüber acht gezielt ausgewählten Fällen.

## T0: Messbare Ausgangslage schaffen

T0 ist der tatsächliche Start auf einer stabilen veröffentlichten Version, nicht automatisch das Datum dieses Berichts. Es wurde weder deployed noch eine URL-Prüfung oder Indexierungsanforderung ausgeführt.

1. Deployment-Version und Veröffentlichungszeitpunkt dokumentieren. Den separat bearbeiteten Commerce-Fix als eigenes Release-Ereignis erfassen. Keine Text-, Link-, Schema- und Deployment-Änderungen während einer Messrunde vermischen.
2. Alle zwölf **exakten URLs** in der URL-Prüfung von Google Search Console prüfen. Datum, gespeicherten Indexierungsstatus, `googleCanonical`, `userCanonical`, letzte Crawl-Zeit, Fetch-/Robots-Status und gegebenenfalls die von Google gespeicherte Version erfassen. Unverfügbare Felder bleiben leer. Das von der Website ausgegebene Canonical nicht als Google-Canonical eintragen.
3. Bei Bedarf Live-Test und gerenderten Hauptinhalt ebenfalls für beide Gruppen prüfen. Ein erfolgreicher Live-Test ist kein aktueller Indexierungsbeleg. Den gleichen Prüfablauf für Anforderungs- und Beobachtungsgruppe verwenden.
4. Ist eine URL bereits indexiert, wird sie nicht erneut angefordert. Wenn Google eine andere Canonical-URL nennt, zunächst diesen Befund sichern; weder Canonical noch Redirect automatisch ändern. Ein echter Abruffehler oder eine Indexierungssperre ist vor einer Anforderung gezielt zu klären.
5. Nur für die vier vorgesehenen Anforderungsfälle bei erfolgreicher Prüfung einmal „Indexierung beantragen“ verwenden und den tatsächlichen Zeitpunkt notieren. Keine automatisierte Massenanforderung, keine Wiederholung jeden Tag. Für die acht Beobachtungsfälle zunächst keine Anforderung.

Erfassungsdatei: [experiment-observations-template.csv](current/experiment-observations-template.csv). Alle Google-Felder sind absichtlich leer. `Status` erst nach einer tatsächlichen Google-Beobachtung ausfüllen. Die Vorlage ist kein angeblich erhobener Indexierungsbestand.

## T+7, T+14 und T+28

- Dieselben zwölf URLs erneut per gespeicherter URL-Prüfung prüfen; Status, Google-Canonical, letzte Crawl-Zeit und Version protokollieren. Nach Möglichkeit vor weiteren Live-Tests den gespeicherten Zustand erfassen.
- Neue Coverage-Exporte für **alle beobachteten Statusgruppen einschließlich tatsächlich indexierter URLs** importieren. Ein aus der Nicht-indexiert-Liste verschwundener Eintrag bleibt ohne positiven Beleg **unbekannt**.
- Snapshot gegen den vorigen Snapshot vergleichen: exakte URL-Statusübergänge, aktuelle Canonicals, Seitentypen und die zwölf Ziele. Keine künstliche Verbesserung aus verändertem Exportumfang oder gleich gebliebenen Quelldateien ableiten.
- Optional echte Hosting-Zugriffslogs ergänzen. Googlebot-Echtheit prüfen und Zeitpunkt, Status, Ziel-URL sowie ausgelieferte Version dokumentieren. Die vorhandenen eigenen HTTP-Prüfungen sind dafür kein Ersatz.
- T+28 ist eine Auswertungsrunde, keine zugesicherte Google-Frist. Verzögerte GSC-Berichte und eine nicht erneut gecrawlte Version getrennt von einer erneuten Crawl-/Nichtindexierungsentscheidung behandeln.

## Auswertung und nächste Entscheidung

| Beobachtung | Belastbare Aussage | Nächster Schritt |
| --- | --- | --- |
| Nach T0 kein belegter neuer Google-Crawl | Wirkung der aktuellen Dokumentversion nicht überprüfbar | Crawl-/Inspection-Daten weiter sammeln; keine Qualitätsablehnung der neuen Version behaupten |
| Neuer Crawl, weiterhin nicht indexiert, Google-Canonical identisch | Ausschluss trotz erneuter Verarbeitung derselben URL beobachtet | Bei kleiner Katzen-GPS-Seite zuerst die bereits dokumentierte Geräte-/Systemgewicht-Abgrenzung prüfen; bei App-Seite App-/Offline-Nutzen prüfen; jeweils eine einzelne Folgeänderung |
| Google wählt tatsächlich eine andere Canonical | Konkrete Google-Zuordnung bekannt | Exaktes URL-Paar und gerenderten Inhalt untersuchen; daraus erst eine gezielte Empfehlung ableiten |
| PETKIT-Hersteller bleibt ausgeschlossen, PETLIBRO wird indexiert | Unterschied im Verlauf beobachtet, noch kein Qualitätsbeweis | Allgemeine Aussagen zu Käuferlob/Design auf PETKIT gezielt belegen oder präzisieren; keine neuen Erfahrungen erfinden |
| Schwach verlinkte Seite bleibt ausgeschlossen | Linkpriorisierung weiter plausible Hypothese | Für Seniorenhund-Seite höchstens einen fachlich passenden Kontextlink als **getrennten** Folgeversuch planen; kein Linkpaket auf alle zwölf URLs |
| Nur angeforderte URLs wechseln zu belegtem „indexiert“ | Mit den Anfragen vereinbarer Verlauf | Beobachtungsgruppe und weitere Zeitpunkte vergleichen; bei kleiner, nicht randomisierter Auswahl keine alleinige Kausalität behaupten |
| Beide Gruppen entwickeln sich ähnlich | Anfrage ist keine ausreichende Erklärung des Verlaufs | Releases, neue Crawls und Google-Canonical-Entscheidungen abgleichen |
| URL fehlt nur in neuem Nichtindexiert-Export | Statusbeleg fehlt | `unknown`, bis Indexiert-/Inspection-Beleg vorhanden ist |

Die Inhalte werden im ersten Versuch absichtlich nicht pauschal umgeschrieben. Das schützt die Aussagekraft des Versuchs: Zuerst feststellen, **welche Version Google verarbeitet und welche URL Google auswählt**, dann eine konkrete Qualitätshypothese mit einer einzelnen Änderung prüfen.
