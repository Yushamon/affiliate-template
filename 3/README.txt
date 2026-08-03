PfotenTechnik Feeder Intent Consolidation 25.11.0

Der Patch setzt die entscheidungsreifen Teile der Roadmap um:

1. /smarte-futterautomaten/ wird redaktionell als alleiniger Cluster-Hub
   festgeschrieben.
2. /welcher-futterautomat-ist-der-richtige/ wird als kompakte Auswahlhilfe
   in fünf Schritten abgegrenzt.
3. Die Auswahlhilfe verweist für ausführliche Kaufkriterien auf den Hub.
4. Generische nächste-Schritt-Texte im Hub werden, soweit vorhanden,
   durch einen konkreteren Linktext ersetzt.
5. Regressionstests sichern die getrennte Intent-Ownership.

Bewusst nicht enthalten:
- keine Redirects
- keine Löschungen
- keine neue Seite
- keine Produkt- oder Herstelleränderungen
- keine pauschale interne Verlinkung
- keine Aussagen aus nicht vorliegenden GSC-Daten

Anwendung:

node 3/apply-pfotentechnik-feeder-intent-consolidation-25.11.0.mjs --check

node 3/apply-pfotentechnik-feeder-intent-consolidation-25.11.0.mjs

Ohne vollständigen Build:

node 3/apply-pfotentechnik-feeder-intent-consolidation-25.11.0.mjs --no-build
