# Änderungen 3.3.4

## Installer-Audit

- Produktdaten-Audit wird vor jeder Änderung als Baseline ausgeführt
- nach dem Patch wird der vollständige Audit erneut ausgeführt
- neue Produktfehler und neue doppelte Slugs lösen weiterhin einen Rollback aus
- bereits vorhandene, unveränderte Auditfehler blockieren den Vergleichs- und Preispatch nicht mehr
- nach einem Rollback wird der Auditbericht auf den wiederhergestellten Repository-Stand aktualisiert

## Produktseiten

- hybrides Editorial-Layout aus 2.0.3 zurückgenommen
- frühere Kartenhierarchie wiederhergestellt
- gemeinsames Score-Modul im Hero beibehalten
- explizite Symbole für positive, neutrale und negative Kaufgründe beibehalten
- Deduplizierung von Vorteilen, Warnungen und Nachteilen beibehalten
- Alternativkarten verwenden bei vorhandenem Score die gemeinsame kompakte Score-Darstellung

## Vergleichsseiten

- Score-Darstellung an das Produktseiten-Muster angeglichen
- aktuelle Preise, Preisstatus und typische Preisbereiche ergänzt
- Preiswerte erscheinen auch ohne Affiliate-Link
- Preis und Score im Direktvergleich als eigene priorisierte Zeilen ergänzt
- CTAs an die zentralen PfotenTechnik-Farbtokens gebunden
- Beratertext aus tatsächlich vorhandenen Vergleichsfiltern abgeleitet

## Preisverwaltung

- ein einziges Feld `targetUrl` im SEO Cockpit
- Speichern synchronisiert `affiliate.url` und damit alle Produkt- und Vergleichs-CTAs
- Preisblock speichert keine zweite URL-Kopie mehr
- bestehende doppelte URL-Felder werden migriert
- Legacy-Felder bleiben nur als lesender Fallback erhalten

## Installer 3.3.4

- Windows-CRLF und Unix-LF werden beim Patchen gleichermaßen unterstützt
- ursprüngliche Zeilenenden der bestehenden Dateien bleiben erhalten
- Price-Engine-Import wird am Import-/Typbereich eingefügt und benötigt keinen einzelnen exakten Textanker mehr
- Price Index und Preiszuordnung verwenden semantische Fallback-Anker
- Vergleichsseiten-Patch toleriert unterschiedliche Formatierung des View-Model- und Advisor-Blocks
- vollständige Mock-Installation mit bestehendem Baseline-Auditfehler, 18 Tests, Audit-Regressionsprüfung, Build und exaktem Rollback geprüft
