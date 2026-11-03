# 35.5 – Messplan für 56 Tage ab tatsächlichem Release

Das Experiment ist **noch nicht gestartet**. Kein Push, Release, Deployment, Veröffentlichungsdatum oder Indexierungsantrag wurde ausgeführt. T0 bezeichnet erst die spätere, live verifizierte Veröffentlichung der festgelegten Änderungen. Die Fristen werden relativ zu T0 geführt; kein Startdatum aus dem Bearbeitungsdatum ableiten.

## Vor dem späteren Release

1. Alle 20 URLs in `experiment-baseline.csv` aktuell per GSC/URL-Inspection prüfen. Beobachtungszeit, echten Status, letzten Crawl, Google-selected Canonical, verfügbare Performance und Quelldatei ergänzen. `gsc-access-check.json` dokumentiert fehlenden Client/Token/Propertyzugang. Der Export vom 02.11. ist keine aktuelle Release-Baseline.
2. Vor dem Start weiterhin die gleiche exakte URLidentität verwenden. Keine Statusübertragung von Alias, www oder Redirectziel; HTTP 200 ist kein Indexierungsbeleg.
3. Falls eine zugeloste URL bereits indexiert ist oder einen neuen technischen Blocker hat: vor Start Eignung des **ganzen Paares** neu beurteilen und eine notwendige Protokolländerung dokumentieren. Keine solche Auswahl nach Beginn oder nach beobachteten Ergebnissen. Bestehende Zuteilung nicht still ersetzen.
4. Releasecommit, tatsächlichen Livezeitpunkt, den Umfang gleichzeitig veröffentlichter 35.4-/35.3B-Arbeiten und die finale Zuordnung sichern. Bei gemeinsamem Release kann ein Gewinn nicht eindeutig 35.5 zugerechnet werden.
5. Live nur die 20 Zielseiten und die relevanten geänderten Bereiche prüfen; Inhalte, Canonicals, Schema, Quellen und gesponserte Ziele mit der lokalen Freigabe vergleichen. Kein automatischer Indexierungsantrag gehört zum Plan.

## Feste Messpunkte

| Zeitpunkt | Indexierungs-/Crawlbelege | Performance |
| --- | --- | --- |
| T0 unmittelbar vor Veröffentlichung | Alle 20 URLs, letzter Crawl, Google-selected Canonical; Quelldatei archivieren | Letzte vollständige sieben Tage vor T0 |
| T0 + 7 Tage | Gleiches 20er-Panel; tatsächlichen Beobachtungszeitpunkt speichern | Sieben Tage vor diesem Messpunkt, sobald vollständig verfügbar |
| T0 + 14 Tage | Gleiches Panel | Gleiches Fensterprinzip |
| T0 + 28 Tage | Gleiches Panel | Gleiches Fensterprinzip |
| T0 + 56 Tage | Primärer Endpunkt, gleiches Panel | Gleiches Fensterprinzip |

GSC-Verzögerungen nicht durch scheinexakte Datierung verstecken. Status und Performance können an unterschiedlichen tatsächlichen Abrufzeitpunkten verfügbar werden. Das nominelle Messintervall und den tatsächlichen Zeitstempel erhalten, Performancefenster ausdrücklich mit Start/Ende speichern. Unvollständige Fenster später ergänzen oder als unvollständig kennzeichnen; keinen leeren Export als null Impressionen oder fehlende Indexierung ausgeben. Bei Verschiebung der Statusabfrage den tatsächlichen Tag dokumentieren und eine Sensitivitätsauswertung vorsehen.

`monitoring-observations-template.csv` enthält 100 leere URL-/Zeitpunkt-Zeilen. Pro URL erfassen: GSC-Status, letzter bekannter Crawl, Google-selected Canonical, Impressionen/Klicks, Zahl offengelegter Suchanfragen, vollständiges Performancefenster, HTTP-Auffälligkeiten, Release-/Beobachtungszeit und Archivdatei. Rohdaten und aggregierte Auswertung getrennt behalten. Queryzeilen sind nur offengelegte Suchanfragen, nicht die vollständige Queryzahl.

## Endpunkte und Auswertung vorab festlegen

**Primär:** Nach 56 Tagen als indexiert erfasste URLs / zehn zugeloste URLs je Arm; absolute Risikodifferenz Test minus Kontrolle in Prozentpunkten. Paarweise Darstellung beibehalten. Google-selected Canonical muss zusätzlich sichtbar sein; positives Urteil mit fremdem Canonical nicht ungeprüft als vollständige Zielkonsolidierung beschreiben.

Fehlende Werte bleiben unbekannt. Ohne alle 20 beobachteten Endpunkte ist die Hauptauswertung unvollständig. Dann bekannte Nenner und unbekannte Werte getrennt zeigen und Extremannahmen für fehlende Ergebnisse ausweisen; keine automatisierte Gleichsetzung „unbekannt = nicht indexiert“. Technisch ausgefallene Seiten und redaktionelle Fremdänderungen bleiben in der ursprünglich zugeteilten Gruppe und werden als Abweichungen dokumentiert.

Ergänzend: exakter gepaarter Vorzeichentest auf diskordante Paare (binomial/McNemar) und ein reproduzierbares paarweises Bootstrapintervall. Zehn Paare liefern geringe Präzision; keine Mindestzahl an p-Werten und kein Wechsel des Tests, weil ein Ergebnis attraktiver aussieht. Unterschiedliche Themen/Geräte und gemeinsame Websiteeffekte begrenzen die Interpretation auch bei zufälliger Zuteilung.

**Sekundär:** erster beobachteter positiver Messpunkt, neue Googlebot-Crawls, Canonical-Entscheidungen, Veränderungen von Impressionen und Klicks in vollständigen gleichlangen Fenstern. Der Zeitpunkt der ersten tatsächlichen Indexierung ist zwischen Messpunkten unbekannt. Impressionen und Suchanfragen getrennt vom Coverage-Endpunkt betrachten; ähnliche globale Trends in beiden Armen sind keine spezifische Textwirkung.

Reproduktion ohne Netzwerk:

```sh
python3 apps/pfotentechnik/reports/indexation-gap-analysis-35.5/scripts/evaluate-monitoring.py \
  apps/pfotentechnik/reports/indexation-gap-analysis-35.5/monitoring-observations-template.csv \
  --output /tmp/indexation-35-5-monitoring.json
```

Die leere Vorlage ergibt bewusst `ready: false`, je zehn unbekannte Ergebnisse und **keine** behauptete Recovery. Der Evaluator führt weder API-Schreibaktionen noch Indexierungsanträge aus.

## Interpretation und Entscheidungen

Mehr indexierte Testseiten nach neuen Crawls, eigene Google-Canonicals und ein über mehrere Zeitpunkte bestehender Unterschied würden den Nutzen dieser konkreten Änderungen stützen. Ähnliche oder bessere Kontrollresultate trotz neuer Crawls sprechen gegen einen zusätzlichen Indexierungsnutzen der getesteten Intervention. Ausbleibende Änderung ohne neue Crawls prüft die Qualitätshypothese nicht sinnvoll.

Bis Tag 56 keine breiten zusätzlichen Text-/Titel-/URL-/Scoreänderungen im Panel. Notwendige sachliche oder technische Fehlerkorrekturen bleiben möglich, aber Zeitpunkt, Anlass und Seiten dokumentieren; keine Kontrollseite still nachbehandeln. Seiten-, Quellen- und Inhaltsänderungen außerhalb des Panels ebenfalls in einem Release-/Ereignisprotokoll festhalten. Erst danach über Ausweitung oder weitere Konsolidierung entscheiden. Keine allgemeine Google-Abwertung, KI-Abwertung oder garantierte Qualitätswirkung diagnostizieren.

Die lokale Endprüfung hält die eingehenden kontextuellen Quellmengen aller 20 Panel-URLs gegenüber der Baseline konstant. Dies bei T0 erneut prüfen; spätere Linkzugänge oder Verluste sind als mögliche Mitursache zu dokumentieren.
