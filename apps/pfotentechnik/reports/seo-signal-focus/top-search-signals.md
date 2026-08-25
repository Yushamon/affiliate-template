# SEO Signal Focus nach Patch 33.9.0

Stand: 25. August 2026. Grundlage sind ausschließlich die gespeicherten Provider-Dashboards: Google 55 Impressionen / 1 Klick / Position 37,3 und Bing 44 Impressionen / 2 Klicks / Position 4,9 im jeweiligen 28-Tage-Fenster.

## Search-Data-Integrität

- Der lokale Combined-Stand war nach einem neueren Google-Sync veraltet und markierte Google fälschlich als `stale`.
- Combined wurde aus beiden aktuellen Provider-Dashboards neu aufgebaut. Datenstand: Google `2026-08-24T12:23:27.763Z`, Bing `2026-08-23T07:00:00.000Z`; beide Provider sind `current`.
- Einzel-Provider-Syncs bauen Combined bereits neu auf. Ein zusätzlicher Verhaltenstest schützt die Zuordnung der Provider-Zeitpunkte.
- Recovery stammte vom 10. August und war älter als das aktuelle GSC-Dashboard. Der Loader liefert aus einem solchen Snapshot keine aktuellen Opportunities mehr. `seo:recovery` muss nach dem nächsten erfolgreichen Build beziehungsweise GSC-Sync einen neuen Snapshot erzeugen.

## Bing-Winner-Audit

| URL | Befund | Änderung |
|---|---|---|
| `/katzentrinkbrunnen-richtig-reinigen/` | Intent, Snippet, Quellen, Vergleichs-Journey und CTA passen. Pumpenfragen dominieren die sichtbaren Queries. | Vorhandene Pumpen-Zerlegeanleitung zusätzlich in der Kurzantwort verlinkt. |
| `/wie-funktionieren-gps-tracker/` | Der einzelne Klick passt exakt zur vorhandenen Pieps-Erklärung. Gute Kurzantwort, Quellen und GPS-Hub-Journey. | Keine Änderung wegen nur einer Impression. |
| `/produkt/tractive-cat-6-mini/` | Markenintent, Akku/Abo/Gewicht/Preis im Titel und Kauf-CTA sind passend; ausreichende interne Zuführung vorhanden. | Beobachten, kein Rewrite bei zehn Impressionen. |
| `/produkt/petkit-eversweet-ultra/` | Modellintent, OneWay-Abgrenzung, Quellen, Grenzen und CTA sind vorhanden. | Keine Änderung bei vier Impressionen. |
| `/produkt/petlibro-granary-2-vision/` | Schnellentscheidung, Abgrenzung zum Granary 2 X, Quellen, Affiliate-Kontext und Vergleiche sind vorhanden. | Keine Änderung bei drei Impressionen. |

## Futterautomaten-Intent-Ownership

| Intent | Primärer Owner | Rolle |
|---|---|---|
| Bauartwahl für Katzen | `/futterautomat-katze/` | Ratgeber vor der Modellauswahl |
| Beste Katzenmodelle | `/vergleiche/beste-futterautomaten-fuer-katzen/` | kommerzieller Produktvergleich |
| Beste Nassfuttermodelle | `/vergleiche/beste-futterautomaten-fuer-nassfutter/` | kommerzieller Spezialvergleich |
| Zwei Katzen | `/vergleiche/beste-futterautomaten-fuer-zwei-katzen/` | Szenario- und Produktvergleich |
| Allgemeiner Mehrtierhaushalt | `/vergleiche/beste-futterautomaten-fuer-mehrtierhaushalte/` | Tierarten- und Konfliktkontext |

`/futterautomat-nassfutter/` und `/futterautomat-fuer-zwei-katzen/` sind bereits technische 301-Aliasse auf die jeweiligen Vergleichs-Owner. Titles, H1, interne Anchors, `recommendationJourney` und `contentPlatform` rechtfertigen keine weitere Migration.

## Priorisierte Opportunities

Die acht Findings stehen vollständig in `top-search-signals.json`. Nur die Pumpen-Journey wurde sofort geändert. Alle übrigen Findings sind bewusst konservative Beobachtungs- oder Ownership-Regeln; bei drei bis zehn Impressionen wäre ein Snippet-Rewrite nicht belastbar.

Nicht empfohlen werden neue URLs, neue Cluster, neue Produktseiten, generische Content-Ausweitung, Redirect-Wellen oder massenhafte Title-Änderungen.
