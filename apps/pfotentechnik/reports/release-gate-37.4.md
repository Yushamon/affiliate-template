# Release Gate 37.4

**Entscheidung: GO für den lokal geprüften Stand. Kein Merge, kein Deployment.**

Produktionsbuild: 391 Seiten. Alle 283 relevanten Tests bestanden, keine übersprungen: Geschenkfinder 38, Produktintegration 145, Advisor/Freshness/Entscheidungshinweise/Product Operations/Tarife 74, neue Release-Prüfungen 7, HTTP-/interne URL-Verträge 19. Der strikte SEO-Build-Audit meldet null Fehler und null Warnungen.

## Sechs Fehler einzeln reproduziert und behoben

Die [Einzelreproduktionen](release-gate-37.4-qa/reproduction.json) und sechs zugehörigen Logs verwenden die unveränderten ursprünglichen Prüffassungen über einen ausschließlich lesenden Node-Testloader. Jeder Fall scheiterte einzeln. Die vollständigen betroffenen Testsuiten wurden anschließend ohne Namensfilter ausgeführt und bestanden.

Die fünf historischen Fehler betreffen den direkten Integrationscheck, den 35.8-Abschlussreport, den 35.9-Experimentschutz, den 35.9-Abschlussreport und den 36.0-Experimentschutz. Ursache sind ausschließlich zwei zeitabhängige Preisbeschriftungen: PawSync Smart Pet Feeder (50,99 €) und PETLIBRO Dockstream Cordless (67,99 €). Beide wechseln von „Anschaffungspreis / Hinterlegter Preis“ zu „Früherer Anschaffungspreis / Veralteter Preisstand“.

`protected-snapshots.mjs` validiert den tatsächlichen Betrag und die Preisbeschriftung gegen die zentrale Commerce-/Preislogik zum Zeitpunkt der Artefakterzeugung (Datei-mtime). Erst danach projiziert es ausschließlich die beiden reinen Textknoten der Kaufpreis-Beschriftung auf den Referenztag des historischen Manifests, 16.11.2026, 12:00 UTC. Der komplette historische Text- und Linkvergleich bleibt bestehen. Es gibt keine globale Textersetzung und keine neu erzeugte historische Baseline. Kontrollierte Tests für den 16./17.11. sowie unmittelbar vor und beim Ablauf von 15 Tagen prüfen die Frischegrenze. Manipulierte Preiswerte, falsche Frischekennzeichen, Inhalte und Affiliate-Ziele werden erkannt. Der Produktionsbuild verwendet weiterhin die reale Uhr.

Der sechste Fehler steht tatsächlich in `subscription-costs.test.mjs`: Die feste Erwartung von 20 aktiven GPS-/Kameramodellen war durch MOVA SureTrack Pro und SATELLAI Collar Go aus der freigegebenen Integration 35.8 überholt. Beide sind veröffentlicht, ohne Veröffentlichungssperren, nicht archiviert und besitzen strukturierte Pflichtdienst-Daten mit Herstellerquellen und Research-Datum 16.11.2026. Die unbekannte Lieferbarkeit von SATELLAI widerspricht seinem aktiven Produktstatus nicht. Der Test prüft jetzt jedes aktive Modell auf Tarifstatus, Quelle, Datum und widerspruchsfreie Pflichtdienstangaben statt auf eine feste Produktzahl. Nichtleerer Prüfumfang und eindeutige Slugs bleiben abgesichert.

## Sitemap-Differenz

Der vollständige Vergleich ergibt 270 öffentlich gebaute Self-Canonicals und 269 Sitemap-URLs. Einzige Differenz: `https://pfotentechnik.de/foundation/`. Die interne Designsystem-Vorschau trägt ausdrücklich `noindex,follow,max-image-preview:large` und ist in `astro.config.mjs` bewusst ausgeschlossen. Redaktionell ist sie keine Kaufberatung oder Suchzielseite. robots.txt erlaubt das Crawlen, damit der noindex-Hinweis gelesen werden kann. Ein Self-Canonical macht die Vorschau nicht indexierbar.

Alle **269 indexierbaren Self-Canonicals sind exakt in der Sitemap enthalten**; keine fehlende indexierbare URL, keine zusätzlichen URLs und keine Dubletten. Eine Änderung an der Sitemap-Konfiguration war daher nicht erforderlich. Der neue Release-Test hält diese Zuordnung fest.

## Schutz und Nachweise

Alle 110 Produktdateien einschließlich Preisen, Prüfdatumswerten, Scores, Texten und Affiliate-Zielen sowie sechs historische Baseline-Dateien sind bytegleich. Alle 437 Originalhinweise bleiben unverändert. Die 20 Experimentseiten und 205 eingehenden Linkkanten bestehen den vollständigen Vergleich unter der beschriebenen kontrollierten Preiszeit; die zwei tatsächlichen zeitabhängigen Preiszustände bleiben im Produktions-HTML sichtbar.

[Maschinenlesbare Prüfung samt vollständigem Canonical-/Sitemap-Bestand](release-gate-37.4-qa/verification.json) · [Dateihashes](release-gate-37.4-qa/protected-source-inventory.json) · [Strikter SEO-Audit](seo-release/build-output-latest.json)

## Reproduktion

Zuerst `npm run build:pfotentechnik`, danach `npm --workspace apps/pfotentechnik run test:gift-guide`, `npm --workspace apps/pfotentechnik run test:product-integration`, `npm --workspace apps/pfotentechnik run test:release-gate`, `npm --workspace apps/pfotentechnik run check:release-gate` und `npm --workspace apps/pfotentechnik run audit:release-build-output:strict`.

Die zusätzlichen sechs vollständigen Domainsuiten: `advisor-decision-b1`, `advisor-foundation`, `product-freshness-36.0`, `decision-consequences-35.9`, `product-operations`, `subscription-costs`; die beiden SEO-Suiten: `production-http-integrity-34.8` und `internal-url-policy`, jeweils unter `apps/pfotentechnik/test/*.test.mjs` mit `node --test` ausführen. Es wurden keine fehlgeschlagenen Fälle aus der abschließenden Testauswahl entfernt.

## Ergänzender Abschluss nach 37.3A

Der erneute Release-Check nach der Produktpflege-Reparatur besteht ebenfalls: **GO**, 350 vollständige relevante Tests ohne Fehler oder übersprungene Fälle, Produktionsbuild mit 391 Seiten und strikter SEO-Audit ohne Fehler/Warnungen. Die inzwischen ausdrücklich freigegebenen aktuellen Commerce-Preise werden gezielt validiert; Texte, Scores, Modellauswahl, 20 Experimentseiten und 205 eingehende Linkkanten bleiben geschützt. Die historische Baseline bleibt unverändert. Einzelheiten und externe Einschränkungen stehen im [37.3A-Bericht](product-operations-recovery-37.3a.md). Kein Merge, kein Deployment.
