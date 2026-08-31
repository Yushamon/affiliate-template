# PfotenTechnik — SEO Cockpit Traffic Leverage Audit

Stand: 31. August 2026  
Lokale Basis: Branch `main`, HEAD `01755b311d2c16528618bbb9144c4aa409935a63`. Der Working Tree war zu Auditbeginn sauber. Lokale Reports und Produktionsdaten sind die Grundlage dieses Audits.

## Executive Summary

Das lokale System besitzt bereits deutlich mehr als ein Dashboard: Google-Search-Console-Import mit Page-, Query-, Page-Query- und Trenddaten, regelbasierte Quick Wins, Recovery-Opportunities, Quality Operations, Work-Package-Lifecycle, Content-/Link-/Authority-Audits sowie ein Beobachtungsstatus für bearbeitete Chancen.

Der zentrale Engpass ist nicht die Datenerhebung, sondern die Verbindung: Search-, Intent-, Link-, Evidence- und Freshness-Signale werden heute überwiegend in separaten Systemen priorisiert. Eine Seite kann daher gleichzeitig als GSC-Quick-Win, Recovery-Opportunity, Quality Finding und Advisor-Paket erscheinen. Der bestehende Beobachtungsstatus speichert eine Baseline, bewertet nach Ablauf aber kein Ergebnis. Dies sind die einzigen sehr hochwirksamen Lücken; eine zweite Admin-App, ein zweiter Technical Audit oder automatische Content-Änderungen wären redundant.

## Lokale Baseline

| Bereich | Tatsächlicher lokaler Stand |
|---|---|
| GSC-Daten | `gsc-dashboard-ranges.json`: 7d, 28d, 3m, 6m, 12m; Query-, Page-, Page-Query- und Trend-Reihen vorhanden |
| GSC-Stand | letzte lokale Generierung 28. August 2026; aktuelle Datentiefe ist für einzelne 7d/28d-Signale gering |
| Recovery | 38 Google-only Page Opportunities, 33 Redirects, 2 Signal-Watches, keine technischen Fehler im letzten Report |
| Quality Operations | kanonische Findings, Gruppen, Status, Snapshots und Auditquellen vorhanden; registry umfasst Link-, Cannibalization-, Content-, Product-, Performance-, Media- und Authority-Reports |
| Work Packages | Statusmodell von `open` bis `verified`/`needs-work`, Snooze, Checks und Search-Window existieren |
| Demand/Data Assets | Demand Growth Batch 01/02, Batch 03 und Program 04 vorhanden; Program 04: 33 Nodes, 22 covered, 11 partial, 16 Structured-Data- und 5 Data-Asset-Entscheidungen |
| Link/Authority | Content Graph (243 Nodes/57.835 Edges), interne Link-Health- und Anchor-Governance-Audits sowie Topical-Authority- und Intent-Ownership-Module vorhanden |

## End-to-End Flow Reconstruction

| Schritt | Existiert | Input | Output/Persistenz | UI | Tests/Automation | Bewertung |
|---|---|---|---|---|---|---|
| GSC Import | ja | Google Search Console API | Range-JSON mit Metrics, Pages, Queries, PageQueries, Trends | Cockpit | `gsc:sync`, Provider-Tests | complete |
| Normalisierung | ja | Provider-Rows | kanonische URL/Query-Metriken, Vergleiche | indirekt | Search-Normalizer | complete |
| Regel-Discovery | ja | PageQuery-Rows | Quick-Wins und CTR-Empfehlungen | Cockpit, Advisor | Google-Sync | primitive |
| Page-Recovery | ja | GSC, Redirects, Build | Page-Opportunities und Migration-Status | Cockpit | `seo:recovery` | partial |
| Intent Ownership | teilweise | Repository-Content | explizite Owner derzeit vor allem für Futterautomaten | Topical Authority/Advisor | Authority-Tests | partial |
| Link/Authority | ja, getrennt | Content Graph, Link Audits | Link-Findings und Advisories | Quality/Advisor | Link-Audits | partial |
| Evidence/Data Assets | ja, getrennt | Product Schema, Product Evidence, Demand Reports | Audit- und Readiness-Reports | Produkt/Admin/Reports | Product audits | partial |
| Priorisierung | ja, verteilt | Recovery, GSC, Quality, Advisor | mehrere Scores und Work Packages | Cockpit/Advisor/Tasks | Copilot tests | duplicated |
| Umsetzungstracking | ja | Work Package actions | persistierte Status, Checks, Snooze, History | Tasks/Advisor | Workflow tests | complete |
| Post-change observation | ja, minimal | Page baseline + Cooldown | `observing`-Eintrag | Cockpit | Opportunity-state tests | primitive |
| Outcome measurement | nein | Baseline + frische GSC-Ranges | kein belastbares Vorher/Nachher-Ergebnis | keine | keine | missing |

## Capability Matrix

| Capability | Status | Existing Implementation | Missing Piece | Traffic Value | Recommendation |
|---|---|---|---|---|---|
| GSC query discovery | complete | Provider lädt Query-Rows je Zeitraum | keine neue Pipeline | very-high | unverändert nutzen |
| GSC page discovery | complete | Page-Rows, URLs und Metriken je Zeitraum | keine | very-high | unverändert nutzen |
| trends | partial | Tagestrend und periodischer Vergleich vorhanden | Query/Page-Trend wird nicht als Opportunity-Signal komponiert | high | Composer nutzt vorhandene Vergleichsdaten, keine zweite Trend-Engine |
| query→URL mapping | complete | PageQuery-Rows mit normalisierten URLs/Queries | keine Datenerhebungslücke | very-high | als Composer-Input wiederverwenden |
| intent ownership | partial | Topical Authority, Journey und Owner-Modell vorhanden | Mapping nicht für GSC-Queries und nur ein Cluster detailliert | very-high | Query/Route-Fit als konservatives Signal ergänzen |
| cannibalization | partial | Content-Quality-Audit und Intent-Separation | kein querybezogener Wechsel mehrerer Ranking-URLs | high | als Review-Signal, nicht als automatische Kannibalisierungsbehauptung |
| internal authority | partial | Content Graph, Health Audit, Anchor Governance | kein gemeinsamer Score mit Rankingchance | very-high | Opportunity Composer verbindet Advisory nur bei passender GSC-Chance |
| anchor governance | complete | eigener Audit und Source-Route-Guardrails | keine zweite Engine | medium | nur referenzieren |
| CTR/snippet | primitive | GSC-Regel: Impressionen/Position/CTR | starre Schwellen, kein Low-Data-/Position-Kontext in einem Objekt | very-high | Strike-Zone-Klassifikation einführen |
| content gaps | complete | Demand-Growth-, Authority- und Research-Workflows | keine neue Content-Gap-Engine | high | als Discovery-Signal referenzieren |
| topical authority | complete | Cluster-, Journey-, Ownership- und Product-Coverage-Module | keine | high | unverändert nutzen |
| structured decision data | partial | Failure Modes, Litter, Multi-Pet, Program 04, Product Evidence | Cockpit weiß nicht, ob Asset-Readiness eine konkrete Opportunity stärkt | high | Data-asset-Evidence im Composer ergänzen |
| image SEO | complete | Media Center, Alt-, Hero- und Bild-Audits | keine | medium | nicht erweitern |
| indexation | partial | Sitemap/Canonical/Robots/Linkdaten in Recovery und Technical Audits | Cockpit bündelt Status nicht pro Opportunity | high | vorhandene Recovery-/Quality-Signale nur beifügen |
| freshness | partial | Evidence-/Produkt-/Preis-Audits und `updatedAt` vorhanden | keine gekoppelte Priorisierung | high | Freshness als Hinweis, keine neue Audit-Pipeline |
| opportunity prioritization | duplicated | Recovery-Score, GSC-Recommendations, Quality Priority, Advisor Packages | kein kanonisches Opportunity-Objekt/Dedupe über Systeme | very-high | WP1 Composer |
| work-item lifecycle | complete | Packages: open → sent → verification → waiting/review → verified/needs-work/snoozed | keine Ersetzung | high | bestehenden Lifecycle behalten |
| feedback loop | primitive | Page-Baseline, observing, Cooldown, reopen | kein Ablauf in ein gemessenes Ergebnis | very-high | WP3 Outcome Measurement |
| outcome measurement | missing | nur visuelle Gegenüberstellung von Baseline/aktueller Recovery-Zeile | keine Minimum-Data-Regel, keine Deltas/Outcomes | very-high | WP3 |
| finding deduplication | partial | Quality Operations dedupliziert eigene Quellen; Advisor unterdrückt teils UI-Karten | Search/Recovery/Quality/Data-Assets nicht gemeinsam dedupliziert | very-high | WP1 Composer |

## Traffic Strike Zone

Eine ähnliche, aber nicht vollständige Klassifikation existiert bereits: Recovery nutzt `defend`, `push`, `improve`, `investigate`; GSC nutzt `quick-win` und `ctr`. Sie wird nicht durch neue feste globale Grenzwerte ersetzt. Der Composer verwendet stattdessen die vorhandenen Ranking-/CTR-/Impressionswerte und versieht jedes Ergebnis mit Datenqualität.

| Klasse | Datenbasierte Bedeutung | Voraussetzung |
|---|---|---|
| STRIKE | rankingnahe Page-Query-Chance mit ausreichenden Impressionen | Position grob 4–15 oder bestehende Recovery-`push`-Chance; Low-Data gesondert |
| EMERGING | neue/wachsende Sichtbarkeit | positiver Vergleich bei ausreichendem Basiswert |
| DEFEND | bereits starke Position mit relevantem Signal | gute Position, keine blinde CTR-Abwertung |
| DISCOVER | Repository-/Demand-/Asset-Lücke ohne belastbares Google-Signal | vorhandenes Demand/Authority/Data-Asset-Signal |
| REVIEW | Rückgang, Intent-/Owner-Mismatch, konkurrierende Evidenz oder Authority-Gap | explizite gegensätzliche/fehlende Signale |

## High-Value Gaps Selected

1. **WP1 — Opportunity Composer & Deduplication.** Kanonisches, rein abgeleitetes Objekt pro Page/Query verbindet GSC, Recovery, Query→Route, Link-Advisory, Demand/Data-Asset-Readiness und Freshness. Keine neue Datenquelle und keine automatische Content-Änderung.
2. **WP2 — GSC Strike Zone.** Kontextbewusste Klassifikation mit Low-Impression-Schutz und klarer Unterscheidung zwischen rankingnaher CTR-Chance und Position-48-Rauschen.
3. **WP3 — Outcome Feedback Loop.** Bestehenden `observing`-State um Messfenster, Vorher/Nachher-Delta und die Outcomes `improved`, `neutral`, `declined`, `insufficient-data` erweitern.
4. **WP4 — Cockpit Integration.** Eine priorisierte "Jetzt tun"-Karte und Opportunity-Details in der bestehenden Cockpit-Seite; keine zweite Navigation/Anwendung.

## Rejected as Redundant or Weak

- keine neue GSC-Import-, Trend-, Image-, Indexation-, Content-Gap- oder Technical-Audit-Pipeline;
- keine zweite Work-Item-/Statusmaschine neben den vorhandenen SEO Work Packages;
- keine automatische Änderung von Titles, Meta Descriptions, Links, Canonicals oder Content;
- keine pauschale Kannibalisierungskennung aus ähnlichen Begriffen;
- keine Search-Volume- oder Revenue-Schätzung;
- keine Versprechen über Ergebnisse, bevor ein ausreichendes Post-Change-Fenster gemessen wurde.

## Audit Decision

Die vier gewählten Pakete erfüllen das Implementation Gate: bestehende Capability ist `partial`, `primitive`, `duplicated` oder `missing`, der Traffic-Wert ist `very-high`, und die Umsetzung erweitert vorhandene Daten/Lifecycle/UI statt sie zu duplizieren.
