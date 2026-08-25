# Authority & Distribution – Implementierungsplan

Der Plan umfasst höchstens drei Phasen. Keine Phase automatisiert Publikation, Outreach, Social Posts oder Backlinks. Produkt-Markdown bleibt Source of Truth; neue JSON-Dateien sind ausschließlich abgeleitete Arbeitsstände.

## Phase 1 – kleinstes produktiv nützliches System

### Ziel

Einen einzigen belastbaren GPS-Abo-Finding-Kandidaten reproduzierbar erzeugen, manuell validieren und als Arbeitsobjekt sichtbar machen. Zusätzlich nur die Verträge für spätere Market-/Authority-/Distribution-Daten definieren, noch keine Crawler-Flotte.

### Bestehende Komponenten wiederverwenden

- `src/content/schema/product.ts` und Product Collection als Quelle.
- `gps.subscriptionRequired`, Hersteller-/Kategorie-/Slug-Felder.
- `externalEvidence`/`evidenceSources` und SEO-Copilot `SourceEvidence` als Provenienzmuster.
- `lib/seo/research/schema.ts` für spätere Übergabe validierter Market Findings.
- SEO-Copilot Store: atomare JSON-Persistenz, Audit-Log und Approval-Muster.
- Quality Operations: stabile Fingerprints, Source Adapter, Status-/Arbeitslistenprinzip.
- Content Graph zur Zuordnung bestehender Ziel-URLs.

### Neue Dateien/Module

Vorgeschlagen, noch nicht implementiert:

```text
apps/pfotentechnik/src/lib/authority-distribution/
  types.ts
  known-value.ts
  data-snapshot.ts
  finding-validator.ts
apps/pfotentechnik/scripts/authority-distribution/data-audit.mjs
apps/pfotentechnik/test/authority-distribution-data.test.mjs
apps/pfotentechnik/reports/authority-distribution/data-findings.json
```

Kein neues Produktdatenmodell: `data-snapshot` liest Collection-Daten und erzeugt einen flüchtigen/abgeleiteten Snapshot. `types.ts` enthält `Known<T>`, `DataFinding`, `EvidenceRef` sowie die in `architecture.md` definierten Verträge.

### Datenfluss

`Product Collection → strikter GPS-Extractor → Known/Unknown → Coverage/Population → Candidate Finding → Evidence-/Claim-Gate → needs-review → manuelle Validierung → validated`

Erster Claim: „10 von 12 aktuell bei PfotenTechnik ausgewerteten GPS-Trackern benötigen ein Abo.“ Der Report enthält die zwölf Slugs, Einzelwerte, Quellenstatus, Stichtag und Caveat „Repository-Auswahl, kein Marktanteil“.

### Tests

- Missing/`unknown` wird nie `false` oder `0`.
- Explizites `false` bleibt bekannt und fließt in den Nenner ein.
- `known + unknown + notApplicable = eligibleN`.
- Finding blockiert bei Coverage unter konfiguriertem Minimum, fehlender Population, Stichtag oder Evidence-Review.
- Snapshot ist deterministisch; Reihenfolge ändert ID/Hash nicht.
- Claim-Snapshot erwartet 12 bekannte Werte, 10 `true`, 2 `false`.
- Herstellerwert kann nicht als `hands-on` serialisiert werden.
- JSON-Schema erlaubt keine Publish-/Send-Aktion.

### Risiken

- Feld ist typisiert, aber Quellenbezug noch nicht überall feldgenau. Phase 1 verlangt daher einen manuellen Source Check vor `validated`.
- Die Auswahl kann wachsen; Claim muss versioniert und mit Stichtag superseded werden.
- Bestehende Reports sind teils veraltet; der neue Lauf darf deren Produktzahl nicht übernehmen.

### Geschätzte Komplexität

**Klein (2–4 Entwicklertage)** inklusive Tests und einfacher Integration in eine bestehende Arbeitsliste; **1–2 Tage** als CLI/JSON-only MVP ohne UI.

## Phase 2 – sinnvolle Automatisierung

### Ziel

Kleine, kuratierte Market- und Authority-Discovery plus eventgetriebene Data-Neuberechnung. Nur Findings/Opportunities erzeugen; keine Produktänderung und keine externe Aktion ausführen.

### Bestehende Komponenten wiederverwenden

- Hersteller-`website`/`sources`, Produkt-/Evidence-URLs und Research-Evidence als Watchlist-Seed.
- `src/lib/price-intelligence/safe-fetch.mjs`, Preis-Service und Operations-Status.
- Research Lifecycle (`new`, `updated`, `successor`, `discontinued`, `firmware-update`, `app-update`).
- SEO-Copilot Discovery-/SourceEvidence-/Job-/Audit-Muster.
- Search Platform für interne Relevanz und optional verfügbare GSC/Bing-Linkexports.
- Content Graph/Topical Authority für Entity-/Topic-/URL-Matching.
- Quality Operations für defekte Quellen, stale Runs und deduplizierte Arbeitslisten.
- Bestehendes `SeoAdminLayout`, nicht neue Admin-App.

### Neue Dateien/Module

```text
apps/pfotentechnik/src/lib/authority-distribution/
  watchlist.ts
  fetch-policy.ts
  market-normalizer.ts
  market-diff.ts
  entity-match.ts
  authority-discovery.ts
  authority-verifier.ts
  store.mjs
apps/pfotentechnik/scripts/authority-distribution/
  market-sync.mjs
  authority-sync.mjs
  data-refresh.mjs
apps/pfotentechnik/src/pages/admin/seo/authority-distribution.astro
apps/pfotentechnik/src/components/admin/AuthorityDistributionWorklist.astro
apps/pfotentechnik/test/authority-distribution-{market,authority,store}.test.mjs
```

Abgeleitete Stores unter `.search/authority-distribution/` oder dem vorhandenen Search-Verzeichnis: `workspace.json`, append-only `audit-log.jsonl`, Cache/Snapshots. Keine Stammdatenkopie.

### Datenfluss

**Market:** `kuratierte Watchlist → GET/HEAD mit Cache/ETag → Main Content/JSON-LD → dokumenttyp-spezifische Normalisierung → semantischer Diff → Entity Match → needs-review MarketChange → bei Validierung ResearchItem`.

**Authority:** `GSC/Bing/Referrer/RSS/Search-Kandidat → Canonical/Link-Livecheck → Topic/Entity Match → AuthorityOpportunity(new) → manuelle Statuspflege`.

**Data:** `validierter relevanter Produkt-/Preis-Change → betroffene Aggregationen → neue Candidate-Version`; unveränderte Inputs erzeugen nichts.

### Tests

- Cookiebanner, Navigation, Layout, Trackingparameter und Sortierung erzeugen keinen Change.
- Preisvergleich blockiert bei anderer Währung/Variante/Region.
- Einstellung/Abo-/Deutschland-Verfügbarkeit benötigen Zweitbeleg oder zweite Beobachtung.
- Fuzzy Entity Match allein kann keinen Change validieren.
- Authority-Verifier erkennt echten Anchor/Target/`rel`, Redirect und entfernten Link.
- Keine DA/DR-Felder; keine externen POST-Requests.
- Stable ID/Dedupe über wiederholte Läufe; atomare Writes; Audit-Log redigiert Secrets.
- Admin zeigt vier Listen (DATA/MARKET/AUTHORITY/DISTRIBUTION), keine Score-Wand und keine Publish-/Send-Schaltfläche.
- Scheduler-Jobs sind idempotent, budgetiert, cachefähig und bei Quellfehlern nicht destruktiv.

### Risiken

- Kostenlose Websuche und Webmasterdaten sind unvollständig; UI muss „beobachtet“ statt „vollständig“ sagen.
- Hersteller-DOMs ändern sich; selektorspezifische Parser brauchen Health Findings.
- Robots/Nutzungsbedingungen, Rate-Limits, App-Store-Zugriff und regionale Inhalte begrenzen Quellen.
- False Positives bei Varianten/Nachfolgern; menschliche Bestätigung bleibt zwingend.
- Keine Repository-Scheduler vorhanden; CI/externen Cron erst nach Betriebsentscheidung anbinden.

### Geschätzte Komplexität

**Mittel (8–15 Entwicklertage)** für kleine Allowlist, Stores, drei Jobs, Tests und eine integrierte Arbeitslistenseite. Ein webweiter Monitor ist ausdrücklich nicht Teil der Phase.

## Phase 3 – optionale Erweiterungen

### Ziel

Weitere Data Assets nach Schema-Härtung und vorbereitete Distribution Packs aus validierten Findings; optionale bessere Discovery-Datenquellen, ohne Autopublishing.

### Bestehende Komponenten wiederverwenden

- Comparison Data Platform und vorhandene Kategorie-Aliase als Migrationshinweise.
- Product-/Comparison-/Price-Audits als Release Gates.
- Search Range-Daten, Content Graph, Hersteller-/Produktrelationen für Distribution Packs.
- SEO-Copilot Work Packages/Prompt Registry für manuelle redaktionelle Aufgaben.
- Research Store als bestätigte fachliche Queue.

### Neue Dateien/Module

```text
apps/pfotentechnik/src/lib/authority-distribution/
  normalizers/{feeder,fountain,litter-box,cat-flap,camera}.ts
  distribution-pack.ts
  chart-data.ts
apps/pfotentechnik/scripts/authority-distribution/distribution-build.mjs
apps/pfotentechnik/test/authority-distribution-{normalizers,distribution}.test.mjs
```

Optional additive Felder im bestehenden Product Schema: nullable kategoriespezifische Fakten und feldnahe Evidence-Referenzen. Keine neue Produktcollection. Optional bezahlte Linkprovider nur als Adapter hinter demselben `AuthorityOpportunity`-Vertrag; Drittmetriken nur mit echter Quelle und Abrufdatum.

### Datenfluss

`redaktionell normalisierte bestehende Produktfelder → weitere validierbare Aggregationen → validated Finding → Distribution Pack (Summary, Social Draft, Chart-Daten, Outreach-Hook, Herstellerbezug, bestehende URL) → manueller Review/Export`

Packs besitzen statisch `publishAllowed:false` und `sendAllowed:false`. Ein Export ist eine Datei für manuelle Nutzung, kein Versand.

### Tests

- Kategorie-Normalizer haben Golden Fixtures für Einheiten, Varianten und Unknown.
- Roundtrip bewahrt Provenienz und `notApplicable`.
- Keine Statistik wird erzeugt, wenn bekannte Werte/Comparability unter dem Asset-Gate liegen.
- Pack übernimmt Claim, N, Coverage, Stichtag, Evidence und Caveats unverändert.
- Pack kann nur aus `validated` Finding und passender Finding-Version entstehen.
- Contract-Test verbietet Netzwerk-POST, Credentials, Empfängerlisten und Publish-/Send-Funktionen.
- Regression gegen Product-/Comparison-/Price-/Quality-Audits.

### Risiken

- Schemaausbau kann zu mechanischem Backfill mit falschen `false`-Werten verleiten; nur redaktionell bestätigte Werte migrieren.
- Generierte Drafts können Caveats verkürzen; Packs müssen Pflichtdisclosures technisch fixieren.
- Kostenpflichtige Provider schaffen Lizenz-, Retention- und Metrikabhängigkeiten; Rohdaten und Herkunft offenlegen.

### Geschätzte Komplexität

**Mittel bis groß (10–25 Entwicklertage, modular)**, abhängig von Zahl der normalisierten Kategorien und optionalen Providern. Jede Kategorie/Providerintegration bleibt separat auslieferbar.

## Empfohlene Reihenfolge und Stop-Regeln

Phase 1 vollständig abschließen, bevor Web-Monitoring beginnt. Phase 2 nur auf einer kleinen URL-Allowlist betreiben und False-Positive-Rate messen. Phase 3 pro Kategorie erst starten, wenn ein konkretes Asset die Normalisierung rechtfertigt. Stoppen/blockieren, wenn Unknown-Semantik, Provenienz oder Produktidentität nicht eindeutig sind; transparent fehlende Daten sind wertvoller als eine scheinbar vollständige Statistik.
