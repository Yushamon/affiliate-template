# 35.3B – Technische Korrekturen

## Lokal umgesetzt

`apps/pfotentechnik/public/_redirects` bleibt die maßgebliche Pfadredirect-Datei. Die Git-Diffs `3dc09874` und `b07f68d7` belegen die ursprünglichen und korrekten Ziele für 14 versehentlich verkürzte Canonicals.

- 13 fehlende Recovery-Ziele für `/vergleiche/-…` hinzugefügt, jeweils mit und ohne Schluss-Slash: 26 zusätzliche 301-Regeln.
- Die zwei bestehenden Regeln für `/vergleiche/-fuer-katzen` gehen jetzt direkt auf `/vergleiche/beste-futterautomaten-fuer-katzen/` statt auf die allgemeine Übersicht.
- Summe: 96 statt 70 Regelvarianten. Alle Ziele bestehen bereits, liefern im Build selbstreferenzierende Canonicals und sind indexierbar. Kein Ziel ist wiederum Redirectquelle, keine neue Kette.
- 14 Regressionstests prüfen beide Varianten, konkrete Zielidentität, permanenten Status, Zielinhalt und Ein-Hop-Verhalten. Der bestehende Integritätstest wird auf die neue Regelanzahl aktualisiert.

Diese Korrektur gewinnt möglicherweise fehlgeleitete historische Signale zurück. Kein entsprechender Pfad ist in den vorliegenden Coverage-URL-Listen enthalten; tatsächliche Google-Abrufe dieser Zwischenstände sind nicht nachgewiesen. Es wird kein messbarer Recoveryeffekt zugesagt. Die historischen Canonical-Felder und heutigen öffentlichen URLs selbst benötigen keine erneute Änderung.

## Livebefund und externer Restpunkt

Die Liveprüfung **vor einem Deployment** umfasst 178 Fälle: 49 rekonstruierte Pfade jeweils mit Slash, ohne Slash und als HTTPS-www sowie 31 unterschiedliche Ziel-/Kontroll-URLs. Alle 31 Ziel-/Kontroll-URLs liefern direkt HTTP 200 mit korrektem Canonical und ohne noindex. Alle 27 belegten alten Content-/Advisorpfade gehen auf non-www in einem 301-Schritt zum richtigen Ziel.

76 Fälle verletzen den vollständigen historischen Recovery-/Ein-Hop-Vertrag:

- 26 non-www-Varianten der 13 fehlenden historischen Aliasziele enden auf 404.
- Zwei non-www-Katzenvarianten enden auf der allgemeinen Übersicht.
- 13 entsprechende www-Varianten enden nach dem Hostredirect ebenfalls auf 404.
- 35 vorhandene www-Legacyvarianten benötigen zwei 301-Schritte; darin enthalten ist der Katzenfall mit zusätzlich unspezifischem Ziel.

Die Pfadfehler sind **lokal** korrigiert, live bleiben sie bis zu einem separat autorisierten Release bestehen. Die 35 www-Legacyketten entstehen aus dem Zusammenspiel der externen Cloudflare-Hostregel mit Pages-Pfadredirects. Die Hostregel erhält heute den ursprünglichen Pfad; erst Pages ersetzt ihn. Für einen direkten Hop müssen diese Regeln extern zusammengesetzt werden. Dieser Auftrag untersagt Deployment; keine Cloudflare-Regel wurde verändert und kein vollständiger Live-PASS behauptet. Die bereits in 34.8 akzeptierte HTTP-www-Ausnahme ist keine pauschale Freigabe für zusätzliche HTTPS-www-Legacyketten.

Die vollständigen exakten Quellen/Ziele für eine spätere Zusammensetzung stehen in `historical-url-map.csv`, der aktuelle Pfadregelsatz in `public/_redirects`. Hostnormalisierung für aktuelle Canonicals bleibt korrekt. Kein Worker und keine neue Redirectarchitektur eingeführt.

## Bewusst ohne technische Änderung

Der Klemmt-Ratgeber hat keinen nachgewiesenen thematisch passenden Nachfolger und liefert heute eine echte 404. Eine Weiterleitung auf den später unter derselben Quelldatei stehenden Katzenwasser-Artikel oder auf die Homepage wäre fachlich falsch. Der aktuelle Wasserstandort-Pfad existiert weiterhin; die damalige Dateilöschung ist keine zweite Migration.

Keine Content-, Score-, Produkt-, Preis-, Sitemap- oder aktuellen Canonical-Änderungen durch 35.3B. Die bereits vor Arbeitsbeginn vorhandenen 36 Änderungen aus 35.4 bleiben bytegleich erhalten. Kein Push, Deployment oder Veröffentlichung.
