# PfotenTechnik — SEO Cockpit Traffic Leverage Implementation

Stand: 31. August 2026

## Already Had

Die folgenden vermuteten "neuen" Fähigkeiten waren lokal bereits vorhanden und wurden nicht dupliziert:

- Google Search Console Import mit Page-, Query-, Page-Query-, Trend- und Vergleichszeitraumdaten.
- Regelbasierte Quick-Wins und CTR-Hinweise im Google-Sync.
- Google-only Recovery mit Redirect-, Build-, Canonical-, Sitemap-, Link- und Page-Opportunity-Prüfung.
- Quality Operations mit kanonischen Findings, Deduplizierung innerhalb der Auditquellen, Gruppen, Historie und Statusmodell.
- SEO Work Packages mit `open`, Übergabe, Checks, Search-Window, Review, `verified`, `needs-work` und Snooze.
- Content Graph, Internal-Link-Health, Anchor Governance, Topical Authority, Intent Ownership, Media-/Image-, Product-Evidence- und Freshness-nahe Audits.
- Demand-Growth- und Decision-Data-Programme einschließlich Batch 03 und Program 04.

## Improved

### WP1 — Opportunity Composer & Deduplication

`src/lib/seo/traffic-opportunities.mjs` erzeugt jetzt ein rein abgeleitetes Opportunity-Objekt pro kanonischem Page/Query-Paar. Es vereint vorhandene GSC-PageQuery-Daten mit Recovery, internen Linklücken sowie Program-04-Intent-/Data-Asset-Signalen. Mehrere Eingangssignale werden in einem Objekt geführt; identische URL-/Query-Varianten werden normalisiert und dedupliziert.

### WP2 — GSC Strike Zone

Die Klassifikation `STRIKE`, `EMERGING`, `DEFEND`, `DISCOVER`, `REVIEW` verwendet Positions-, Impressions-, CTR- und vorhandene Vergleichssignale. Sie behandelt geringe Datenmengen ausdrücklich als Low Data: kein STRIKE und keine CTR-Opportunity aus wenigen Impressionen. Die Cockpit-Topliste zeigt nur belastbar priorisierbare Chancen; Low-Data-Fälle bleiben sichtbar in der Zusammenfassung, werden aber nicht als "eine Aufgabe jetzt" verkauft.

### WP3 — Outcome Feedback Loop

Der vorhandene `opportunity-state` wurde von Schema 1 auf 2 erweitert. Er bewahrt alle bisherigen `observing`-Einträge, speichert künftig Messhistorie und erzeugt erst nach Ablauf des Beobachtungsfensters ein Ergebnis. Mögliche Zustände: `improved`, `neutral`, `declined`, `insufficient-data`. Vor- und Nachfenster benötigen jeweils mindestens zehn Impressionen; daraus wird kein falsches positives Ergebnis abgeleitet.

### WP4 — Cockpit Integration

Die bestehende Seite `/admin/seo/cockpit/` enthält nun die priorisierte Traffic-Leverage-Tabelle und den Mess-Button für abgelaufene Beobachtungsfenster. Die vorhandene Markieren-/Reopen-Interaktion wurde wiederverwendet; der lokale Operations-Router bekam nur den schmalen Evaluate-Endpunkt.

## Added

- `traffic-opportunities.mjs`: deterministic composer, Strike Zone und Cross-System-Dedupe ohne neue Datenbank oder Datenquelle.
- `evaluateOpportunityMetrics`: nachvollziehbare Ergebnisregel mit Pre-/Post-Deltas.
- `/api/admin/seo/opportunities/evaluate`: lokaler, JSON-geschützter Endpunkt für das bestehende Admin-Service-Modell.
- `test:traffic-leverage`: vier Tests für Priorisierung, Dedupe, Query→URL, Low-Data, fehlende GSC-Daten und Outcome-Schutz.

## Rejected

- Kein zweiter GSC-Importer, keine zweite Trend- oder CTR-Engine.
- Kein zweites Work-Item-System; bestehende SEO Work Packages bleiben unverändert und behalten ihre Historie.
- Keine automatische Änderung von Content, Snippets, Links, Canonicals oder Metadaten.
- Keine automatische Kannibalisierungsfeststellung und keine erfundenen Search-Volume-/Revenue-Prognosen.
- Keine neue Admin-Navigation oder parallele Cockpit-Oberfläche.

## Traffic Workflow

```text
GSC sync
  → Range JSON (page, query, page-query, trend)
  → Recovery + Link/Intent/Data-Asset-Evidence
  → Traffic Opportunity Composer (one page/query object)
  → STRIKE / EMERGING / DEFEND / DISCOVER / REVIEW
  → existing cockpit + optional existing work-package workflow
  → Umsetzung markieren (baseline + observe window)
  → nach Ablauf: aktuelle GSC-Metriken messen
  → improved / neutral / declined / insufficient-data
```

Das System beantwortet damit zuerst "Was ist die sinnvollste Arbeit jetzt?", dann "Warum?" mit verbundenen Signals, danach "Was ändern?" als begrenzte Aktion und nach ausreichender Zeit "Hat es funktioniert?". Bei der aktuellen lokalen 7d-Datenlage sind fast alle Page-Query-Signale Low Data; das Cockpit zeigt deshalb keine künstlich hochpriorisierte Maßnahme, bis belastbarere Signale vorliegen.

## Changed Files

- `apps/pfotentechnik/src/lib/seo/traffic-opportunities.mjs`
- `apps/pfotentechnik/src/lib/seo/opportunity-state.mjs`
- `apps/pfotentechnik/src/lib/admin/operations-router.mjs`
- `apps/pfotentechnik/src/pages/admin/seo/cockpit.astro`
- `apps/pfotentechnik/test/traffic-leverage-opportunities.test.mjs`
- `apps/pfotentechnik/package.json`
- die drei Reports dieses Arbeitslaufs
