# Recommendation Family Isolation 32.6.24

## Ursache
Die Next-Step-Logik leitete die Produktfamilie zuerst aus allgemeinen semantischen Topics ab.
Die Seite `automatische-katzentoiletten` besitzt jedoch bereits eindeutige Metadaten:
`contentPlatform.cluster: automatische-katzentoiletten`,
`decisionJourney.cluster: automatische-katzentoiletten` und den entsprechenden Hub.

Dadurch konnten fachfremde Kandidaten über gemeinsame Signale wie Katze, App oder Kaufberatung ranken.

## Fix
1. Explizite Cluster-, Journey-, Hub- und Linking-Metadaten bestimmen die Produktfamilie vor semantischen Topics.
2. Sobald die Quellseite eine Produktfamilie besitzt, gilt für Next Steps fail-closed:
   nur Kandidaten derselben Produktfamilie sind zulässig.
3. Fehlt ein passender Kandidat, wird keine fachfremde Ersatzkarte erzeugt.

Der Fix ist global und nicht auf Katzentoiletten hart codiert.
