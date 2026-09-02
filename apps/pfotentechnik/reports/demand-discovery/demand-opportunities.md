# Demand Discovery

Generiert: 2026-09-02T06:06:21.151Z

## Trennung der Systeme

- **Interne Matching Engine:** ordnet belegte Demand Nodes vorhandenen Seiten zu. Sie verwendet Content, Überschriften, Frontmatter, Content Graph, Search-Page-Query-Signale und vorhandene Intent-Owner.
- **Externe Demand Discovery:** stammt in diesem Lauf ausschließlich aus vorhandenen GSC-/Bing-Queries und bestehender Research-Evidence. Für neue Wettbewerber-, Community- oder SERP-Signale ist weiterhin eine ausdrücklich konfigurierte Web-/SERP-Quelle nötig.

Keine Nachfrage, kein Suchvolumen und keine SERP-Beobachtung wird erfunden.

## Wiederverwendete Infrastruktur

- Search Platform: src/data/seo/search-dashboard-ranges.json (Combined GSC/Bing; keine neue Provider-Schicht)
- Content Graph: src/generated/content-graph.json (Route, Cluster, Topics, Aliases und Verknüpfungen)
- Content Collections: bestehendes Frontmatter, SEO-Titel, Überschriften und Body
- Topical Authority: vorhandene Intent-Owner und Cluster-Metadaten
- Research Engine: demand-enhancement-1.json als bestehende Research-Evidence und Regression
- Admin/Cockpit: bestehender Research-/SEO-Bereich als künftiger read-only Listen-Consumer

## Datenstand

- Search: 2026-08-28T09:03:13.694Z
- Google: 2026-08-28T09:03:13.658Z
- Bing: 2026-08-27T07:00:00.000Z
- Content Graph: 2026-09-01T04:06:47.045Z
- Research Ground Truth: 2026-08-25

## Matching-Ergebnis

- covered: 14
- partial: 3
- fragmented: 2
- missing: 0
- overcovered: 0
- uncertain: 1

Aktive Opportunities: 6 von maximal 20.

| Cluster | Nutzerproblem | Intent Owner | Status | Confidence | new-page-required |
|---|---|---|---|---|---|
| gps-tracker | Validiertes GPS-Abo-Finding in bestehende Inhalte integrieren | /warum-brauchen-gps-tracker-ein-abo/ | partial | medium | false |
| futterautomaten | futterautomat nassfutter katze | /futterautomat-katze/ | fragmented | medium | false |
| trinkbrunnen | you tube katzentrinkbrunnen filter einsetzen | /katzentrinkbrunnen-richtig-reinigen/ | partial | medium | false |
| trinkbrunnen | wie wird die pumpe eines katzenbrunnens gereinigt? gibt es eine anleitung wie diese auseinander gebaut werden soll? | /katzentrinkbrunnen-richtig-reinigen/ | uncertain | low | false |
| gps-tracker | warum piepsen gps tracker für haustiere in regelmäßigen abständen | /gps-tracker/ | partial | medium | false |
| futterautomaten | nassfutterautomat katze | /futterautomat-katze/ | fragmented | medium | false |

## Manuelle Prüfung

### Validiertes GPS-Abo-Finding in bestehende Inhalte integrieren

- Demand Evidence: existing-research
- Konkreter Gap: Das referenzierte Data Finding steht auf needs-review; daraus wird keine Content-Aktion abgeleitet.
- Empfohlene Aktion: Keine Content-Aktion; Data Finding zuerst fachlich validieren.

### futterautomat nassfutter katze

- Demand Evidence: gsc
- Konkreter Gap: Ähnlich starke Matches auf /katze-frisst-nicht/, /futterautomat-katze/, /futterautomat-und-ernaehrung/.
- Empfohlene Aktion: Intent Ownership und mögliche Konsolidierung manuell prüfen.

### you tube katzentrinkbrunnen filter einsetzen

- Demand Evidence: bing
- Konkreter Gap: Der beste Match /katzentrinkbrunnen-richtig-reinigen/ deckt nur einen Teil der Problembegriffe in Überschriften, Inhalt und Graph-Metadaten ab.
- Empfohlene Aktion: Bestehende Intent-Owner-Seite /katzentrinkbrunnen-richtig-reinigen/ auf die konkrete Inhaltslücke prüfen.

### wie wird die pumpe eines katzenbrunnens gereinigt? gibt es eine anleitung wie diese auseinander gebaut werden soll?

- Demand Evidence: bing
- Konkreter Gap: Die vorhandenen Signale ergeben keinen stabilen Match.
- Empfohlene Aktion: Manuell prüfen; Signal reicht für keine Content-Entscheidung.

### warum piepsen gps tracker für haustiere in regelmäßigen abständen

- Demand Evidence: bing
- Konkreter Gap: Der beste Match /gps-tracker/ deckt nur einen Teil der Problembegriffe in Überschriften, Inhalt und Graph-Metadaten ab.
- Empfohlene Aktion: Bestehende Intent-Owner-Seite /gps-tracker/ auf die konkrete Inhaltslücke prüfen.

### nassfutterautomat katze

- Demand Evidence: gsc
- Konkreter Gap: Ähnlich starke Matches auf /katze-frisst-nicht/, /trockenfutter-oder-nassfutter-katze/, /vergleiche/beste-futterautomaten-fuer-nassfutter/.
- Empfohlene Aktion: Intent Ownership und mögliche Konsolidierung manuell prüfen.


## Admin-Integration

Im bestehenden Research-/SEO-Bereich genügt eine Arbeitsliste **Demand Discovery**. Sie liest `demand-matching.json`, zeigt standardmäßig nur `partial`, `missing`, `fragmented` und `overcovered` und bietet Statusfilter. Keine neue App, keine Scoresammlung und keine schreibende Aktion sind erforderlich.

## Guardrails

Die Pipeline schreibt ausschließlich Reports. Sie erstellt oder ändert weder Seiten noch Texte, Redirects, Titles, Descriptions, Canonicals, Affiliate-Daten, Social Posts oder Outreach. `missing` bedeutet ausschließlich Research Candidate.
