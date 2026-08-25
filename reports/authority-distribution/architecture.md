# Authority & Distribution – Phase 0 Architecture

## Ergebnis

PfotenTechnik braucht keine neue große Engine und kein paralleles Produktmodell. Das kleinste sinnvolle System ist ein dünner, read-only-orientierter Layer über den bestehenden Produkt-, Research-, Search-, Content-Graph-, Quality- und Admin-Komponenten:

`bestehende Quellen → normalisierter Snapshot → Change/Finding → menschliche Validierung → vorbereiteter Distribution Pack`

Publikation und externe Kommunikation liegen ausdrücklich außerhalb dieses Flows.

## 1. Bestandsaudit

| Bereich | Vorhandener Bestand | Wiederverwendung | Lücke/Grenze |
|---|---|---|---|
| Produktquelle | `src/content/products` + `src/content/schema/product.ts` | einzige Source of Truth für 101 Produkte | außerhalb GPS viele freie Strings; keine allgemeine Feld-Provenienz |
| Hersteller | `src/content/manufacturers`, 32 Datensätze, `sources`, Serien/Produktbezüge | Watchlist, Domain-/Produktzuordnung, Herstellerbezug | nur 2 mit `evidenceSources`; keine Watch-URL-/Fetch-Policy |
| Vergleiche | `comparisonData`, `comparisonFilters`, `comparisonDataPlatform.ts`, Comparison-Audits | vorhandene Aliase/Resolver, Kategoriepopulationen, Zielseitenzuordnung | Resolver ist für Anzeige tolerant; Statistik braucht strengere Semantik und darf Fallback `–` nie werten |
| GPS | typisiertes `gps`-Objekt | sofortige Aggregation nach Review | Abopreise fehlen; Akkubedingung nicht überall als publizierter Kontext erzwungen |
| Price Intelligence | `src/lib/price-intelligence/*`, `scripts/price-intelligence/audit.mjs`, Admin-Preise | Angebotssnapshot, `checkedAt`, Quelle, Status, Operations | keine Preis-Historie/Change Events; Angebot ≠ UVP/Marktpreis |
| Product Operations | Statusfelder, Policy, Audit, Admin-Produktpflege | Arbeitsstatus, Verfügbarkeit, manuelle Bestätigung | `productStatus` bei 43/101 unknown; nicht als Lifecycle-Fakt nutzbar |
| Product Evidence | `externalEvidence`, `evidenceSources`, Audit + Research Queue | Quelle, Methodik, Consensus, Schutz vor falschen Testclaims | Reports teils veraltet; Feldbelege nicht flächendeckend |
| Research Engine | `lib/seo/research/{schema,store}`, `research/research.json` | Research Finding/Opportunity als downstream Arbeitsobjekt, Lifecycle/Impact/Aktionen | nur 6 implementierte Items; keine automatische Watch-/Diff-Pipeline |
| SEO Copilot | Workspace, Jobs, SourceEvidence, MarketSignal, Discovery Provider, Preflight | Evidence-Typen, Confidence, Jobs, Audit-Log, Approval-Muster | Workspace aktuell ohne Kandidaten/Findings; Authority-Typen fehlen |
| Quality Operations | Source Registry, Normalisierung, Snapshots, Arbeitslisten | Adaptermuster, stabile Fingerprints, Deduplizierung, History, manuelle Status | Authority/Data/Market noch keine Source-Adapter |
| Search Platform | GSC/Bing Provider, Range-Dashboards, Sync/Reports | passende interne URL, Themen-/Query-Relevanz, Nachfragepriorisierung | entdeckt keine Web-Erwähnungen/Backlinks; Daten können fehlen/altern |
| Content Graph | `src/generated/content-graph.json`, Query API, Build/Audit | Finding → bestehende Produkt-/Vergleichs-/Ratgeber-/Hersteller-URL | Build-Artifact sehr groß; nur intern, keine externe Linkquelle |
| Topical Authority | Audit, Loader, Admin-Seite, Decision Journeys | Finding → Cluster/Topic/Content Gap; UI-Einstieg | Authority Score ist interne Content-Coverage, keine externe Domain Authority |
| Product Discovery | SEO-Copilot Candidate/SourceEvidence/Preflight | neue Produkte/Nachfolger als Kandidat, Duplicate/Relation Check | Provider ist keine dauerhafte Herstellerüberwachung |
| Content Platform | `informationGainProfiles`, Page Assembly | thematische Anschlussfähigkeit eines Findings | keine Contentseite in Phase 0/1 erzeugen |
| Admin/Cockpit | `/admin/seo`, Advisor, Topical Authority, Products, Prices, Quality Operations | bestehendes Layout, Arbeitslisten, Server-/Audit-Muster | kein eigener Bereich Authority & Distribution |
| Reports | zahlreiche JSON/MD-Audits unter `apps/pfotentechnik/reports` | Quality-Source-Registry und Snapshot-Muster | einige Reports haben 80/82/99 statt 101 Produkte; Aktualität sichtbar machen |
| Scheduler | viele idempotente CLI-Scripts und npm commands | von externem Cron/CI aufrufbar | im Repository keine Cron-/Workflow-Konfiguration gefunden; Betrieb derzeit manuell |

### Verlässlichkeit der Daten

Automatisch aggregierbar sind typisierte, explizit bekannte Werte mit eindeutiger Semantik: insbesondere GPS-Kernfelder; nach Prüfung auch Preise als datierte Angebote und einzelne typisierte Filter. Bedingt aggregierbar sind normalisierbare Strings mit hoher Coverage. Nicht automatisch faktfähig sind Body-Text, qualitative Einordnung, Scores, unbestätigte Lifecycle-Änderungen, Sicherheitswirksamkeit und alle Unknown-Ableitungen. Details: `data-readiness.md/json`.

## 2. Zielarchitektur

### Prinzipien

1. Produkt-Markdown bleibt Source of Truth. Kein zweites Produkt- oder Herstellermodell.
2. Neue Stores enthalten nur abgeleitete Snapshots, Changes, Opportunities und Packs; sie replizieren keine Produktstammdaten.
3. Jeder Wert hat drei Zustände: `known(value)`, `unknown(reason)` oder `notApplicable(reason)`. Nur `known` darf in Zähler/Nenner eines Feld-Findings eingehen.
4. Provenienz bleibt getrennt: `manufacturer`, `merchant`, `independent`, `editorial`, `hands-on`. Derzeit existieren keine PfotenTechnik-Hands-on-Datensätze.
5. Discovery ist maschinell; Validierung und externe Handlung sind menschlich.
6. Alle Writes sind lokale, auditierbare JSON-Snapshots mit stabilen IDs und atomarer Speicherung nach bestehendem Store-Muster.

### Kleine Modulgrenzen (erst in späterer Implementierung)

| Modul | Verantwortung | Reuse |
|---|---|---|
| `data-snapshot` | streng bekannte Felder aus der Product Collection lesen; Coverage/Population berechnen | Product Schema, Comparison-Aliase nur als Kandidatenliste |
| `fact-normalizers` | kategoriespezifische, explizite Parser; keine generische Wahrheitsableitung aus Prosa | `comparisonFilters`, GPS-Typen, Price Adapter |
| `finding-validator` | Coverage-, Provenienz-, Freshness-, Comparability- und Unknown-Gates | Evidence-/Confidence-Typen, Quality-Patterns |
| `market-watch` | kontrollierte URL-Watchlist abrufen, Main-Content fingerprinten, semantische Changes erzeugen | Herstellerdaten, Safe Fetch, Research Lifecycle |
| `authority-discovery` | Erwähnungen/Links/Publisher-Themen als Opportunities normalisieren | SEO-Copilot SourceEvidence, Content Graph, Search-Themen |
| `distribution-pack` | ausschließlich Draft-Artefakte aus `validated` Findings | Content Graph, Search Platform, Herstellerrelationen |
| `quality-adapters` | Reports in bestehende Quality-/Arbeitslisten spiegeln | Quality Source Registry/Fingerprints |

## 3. Finding-Lifecycle

Interner Status für Data/Market Findings:

`candidate → needs-review → validated | rejected → superseded`

- Nur `validated` darf einen Distribution Pack erzeugen.
- Eine relevante Produktänderung wird niemals direkt publiziert oder in Produkt-Markdown geschrieben.
- Eine neue Beobachtung derselben Population superseded das alte Finding, löscht es aber nicht.
- Der Hash umfasst Population, bekannte Produkt-IDs, normalisierte Werte, Quellen und Stichtag; reine Sortierung erzeugt kein neues Finding.

Minimaler `DataFinding`:

```ts
type Known<T> =
  | { state: "known"; value: T; provenance: EvidenceRef[] }
  | { state: "unknown"; reason: string }
  | { state: "not-applicable"; reason: string };

interface DataFinding {
  id: string;
  question: string;
  population: { category: string; eligibleN: number; includedSlugs: string[]; asOf: string };
  metric: { knownN: number; unknownN: number; numerator?: number; value?: number; unit?: string };
  fields: string[];
  evidence: EvidenceRef[];
  caveats: string[];
  confidence: "low" | "medium" | "high";
  status: "candidate" | "needs-review" | "validated" | "rejected" | "superseded";
  validatedBy?: string;
  validatedAt?: string;
}
```

## 4. Authority Monitor

### Scope

Der Monitor sammelt keine Backlinks und bewertet keine Fantasie-„Authority“. Er erkennt überprüfbare externe Chancen und legt sie zur Prüfung vor.

```ts
interface AuthorityOpportunity {
  type:
    | "brand-mention"
    | "backlink"
    | "manufacturer-review-link"
    | "competitor-editorial-link"
    | "resource-gap"
    | "publisher-topic-match"
    | "reviewer-or-press-program";
  sourceUrl: string;
  sourceDomain: string;
  targetOrTopic: string;
  discoveredAt: string;
  evidence: Array<{ url: string; title?: string; excerpt?: string; observedAt: string }>;
  relevance: { score: number; reasons: string[] };
  authorityReason: string;
  suggestedAction: "review" | "consider-citation-pitch" | "consider-correction" | "monitor" | "none";
  confidence: number;
  status: "new" | "reviewed" | "actionable" | "dismissed" | "completed";
}
```

### Kostenfrei sinnvoll automatisierbar

- Eigene Referrer-/Serverlogs, falls vorhanden: neue verweisende URLs extrahieren und per HEAD/GET bestätigen.
- GSC-Links-Export/Google Search Console API, soweit der konfigurierte Zugang diese Daten liefert: neue verlinkende Seiten/Domains als Kandidaten, danach Live-Link prüfen. Der aktuelle Search Provider verarbeitet Performance-Daten; ein Link-Adapter wäre neu.
- Bing Webmaster API/Exports, soweit Links geliefert werden: gleiches Kandidatenmuster.
- Suchmaschinen-/News-/RSS-Abfragen für exakte Marke/Domain, Hersteller-Presseseiten, Reviewer-/Media-/Press-Programme und definierte Publisher-Themen. Wegen API-/Rate-Limits nur inkrementell und cachebasiert.
- RSS/Atom/Sitemaps ausgewählter Publisher, Hersteller und Ressourcenlisten.
- Live-Verifikation eines Kandidaten: Quellseite abrufen, Canonical prüfen, sichtbaren Anchor/Link zu `pfotentechnik.de` und `rel` erfassen.
- Content Graph + validierte Data Findings: Publisher-Thema einer vorhandenen belastbaren Datenbasis und passenden PfotenTechnik-URL zuordnen.
- Wettbewerber-/Ressourcenseiten nur über kleine kuratierte Watchlists, nicht durch unbeschränktes Crawling.

Nicht kostenlos zuverlässig automatisierbar: vollständiger Web-Linkindex, historische neue/verlorene Links im gesamten Web, DR/DA und umfassende Wettbewerber-Linkgraphen. Ohne Ahrefs/Semrush/Majestic o. Ä. muss das System „beobachtet/nicht beobachtet“ statt „vollständig“ kommunizieren.

### Deduplizierung und Relevanz

Stabile ID aus `type + canonicalSourceUrl + targetOrTopic`. Relevanz basiert nur auf nachvollziehbaren Faktoren: thematische Übereinstimmung mit Content Graph, Deutschlandbezug, redaktioneller Kontext, echter klickbarer Link, vorhandenes validiertes Finding, Hersteller-/Publisher-Typ und Aktualität. Keine erfundenen Domain-Metriken. HTTP-Status, Linkziel, Anchor, `rel`, Screenshot/Excerpt und Abrufzeit sind Evidence, kein Score-Ersatz.

## 5. Market Monitor

### Quellen

Watchlist wird aus bestehenden Hersteller-`website`/`sources`, Produkt-/Affiliate-/Evidence-URLs und Research-Evidence abgeleitet. Sie speichert nur URL, owner slug, Dokumenttyp, erwartete Sprache/Region, Fetch-Intervall und Extraktionsregel – keine zweite Kopie von Produktfakten.

Priorität der Dokumenttypen:

1. Produktseite, technische Daten, Support-/Manual-Seite, Preis-/Tarifseite.
2. Hersteller-News/Press, Produkt-Sitemap, App-Release-Notes, Firmware-/Support-Changelog.
3. Händlerseite nur für Preis/Deutschland-Verfügbarkeit, nicht als primäre technische Wahrheit.

### Datenfluss

`fetch → canonicalize → main-content extraction → structured selectors/JSON-LD → normalized snapshot → semantic diff → relevance gate → entity match → Research Finding`

Relevante Change-Typen: `new-product`, `successor`, `discontinued`, `price`, `subscription`, `specification`, `manual`, `firmware-or-app-feature`, `germany-availability`. Layout, Navigation, Cookiebanner, Trackingparameter, Lager-Countdown und beliebiger Marketingtext werden vor dem Diff entfernt.

### Change-Objekt

```ts
interface MarketChange {
  id: string;
  type: "new-product" | "successor" | "discontinued" | "price" | "subscription" |
    "specification" | "manual" | "firmware-or-app-feature" | "germany-availability";
  sourceUrl: string;
  observedAt: string;
  before: Known<unknown>;
  after: Known<unknown>;
  sourceType: "manufacturer" | "manual" | "app-store" | "press-release" | "merchant";
  matchedEntities: string[];
  relevanceReasons: string[];
  confidence: number;
  status: "candidate" | "needs-review" | "validated" | "rejected";
}
```

### Schutz vor Fehlalarmen

- DOM-/Text-Normalisierung und dokumenttypspezifische Selektoren vor Hashing.
- Zwei aufeinanderfolgende Beobachtungen oder unabhängiger Zweitbeleg für Einstellung, Deutschland-Verfügbarkeit und Aboänderung.
- Produktidentität über Slug, Hersteller, Modellnummer/EAN/SKU/Alias; fuzzy match allein darf kein Produkt ändern.
- Preisänderung nur bei gleicher Währung, Region, Variante und Verkäuferklasse.
- Technische Änderung muss einen normalisierten Faktenpfad oder relevantes Dokument betreffen.
- Output ist Research Finding; niemals Auto-Patch oder Publikation.

## 6. Distribution Pack

Nur ein `validated` Finding darf einen Pack vorbereiten:

```ts
interface DistributionPack {
  id: string;
  findingId: string;
  findingVersion: string;
  status: "draft" | "reviewed" | "approved-for-manual-use" | "archived";
  shortSummary: string;
  socialDrafts: Array<{ channel: string; text: string; publishAllowed: false }>;
  chart: { title: string; unit?: string; labels: string[]; series: number[]; sourceNote: string; caveats: string[] };
  outreachHook: { subjectIdea: string; angle: string; sendAllowed: false };
  manufacturerRelations: string[];
  internalTargets: Array<{ route: string; reason: string }>;
  evidence: EvidenceRef[];
  requiredDisclosures: string[];
  generatedAt: string;
}
```

Der Pack enthält immer N, Coverage, Stichtag, Population, Quelle/Methodik und Caveats. Social-/Outreach-Felder sind Textentwürfe ohne Credentials, Empfängerlisten, Versandadapter oder Publish-Methode. Die passende interne URL kommt aus Content Graph; Herstellerbezug aus Produktrelationen; Search-Daten priorisieren nur den Nutzerwert.

## 7. Rhythmus

| Job | Rhythmus | Begründung/Trigger |
|---|---|---|
| Preis-/Verfügbarkeitsquellen | 2× wöchentlich; teure/manuelle Quellen wöchentlich | Angebote ändern häufiger; bestehende Price Intelligence nutzen |
| Produkt-/Herstellerseiten | wöchentlich, gestaffelt | 133 Kernobjekte; Marketingrauschen vermeiden |
| Manuals/Support/Firmware/App-Notes | alle 2 Wochen; RSS ereignisbasiert | seltener, aber fachlich relevant |
| Produkt-Sitemaps/Press/Neuheiten | wöchentlich | neue Modelle/Nachfolger |
| Authority Brand-/Link-Kandidaten | wöchentlich | kostenlose Quellen sind unvollständig; täglich bringt wenig Mehrwert |
| kuratierte Wettbewerber-/Ressourcen-Watchlist | alle 2 Wochen | Kosten/Rate-Limit und geringere Änderungsrate |
| Data Snapshot/Aggregation | ereignisbasiert nach validiertem Produkt-/Preis-Change; sonst monatlicher Kontrolllauf | keine identischen täglichen Findings |
| Distribution Pack | nur einmal pro neuem oder wesentlich geändertem validierten Finding | kein Content-Rad |
| Quality/Retention | monatlich | stale Quellen, Dedupe, superseded Findings, Fehlerrate |

Jeder Lauf hat URL-/Zeitbudget, ETag/Last-Modified, Cache, Backoff und robots-/Nutzungsbedingungen. Der Repository-Bestand besitzt Scripts, aber keinen eingebauten Scheduler; die Jobs bleiben CLI-fähig und werden später über vorhandene CI/externen Cron ausgelöst.

## 8. Admin-Integration

Kein neues Dashboard und keine eigene App. Im bestehenden `SeoAdminLayout` ein Bereich **Authority & Distribution** mit vier Arbeitslisten:

- **DATA:** Candidate/Needs Review/Validated; N, Coverage, Aussage, Caveat, Ziel-URL.
- **MARKET:** relevante Changes; Vorher/Nachher, Quelle, Entity Match, Bestätigung.
- **AUTHORITY:** exakt die fünf Opportunity-Status, Evidence und vorgeschlagene manuelle Aktion.
- **DISTRIBUTION:** Packs aus validierten Findings; Draft/Reviewed/Manual-use, niemals Publish-Button.

Die Übersicht zeigt nur offene Arbeit, keine Gesamtscores. Quality Operations kann Blocker/kaputte Quellen per Adapter aufnehmen; fachliche Datensätze bleiben in ihrem eigenen abgeleiteten Store. `ResearchWorkbench` ist der richtige Anschluss für validierte Market Findings, nicht eine zweite Research-App.

## 9. Technische Guardrails

- Keine Module/Dependencies für E-Mail-Versand, Social Publishing, Reddit, Forum, Kommentare, Gastartikel, Linktausch oder Backlink-Erzeugung.
- Kein generischer Webhook und keine frei konfigurierbare Ziel-URL in Distribution Packs.
- Alle Draft-Aktionen tragen `publishAllowed:false`/`sendAllowed:false`; Schema und Tests erzwingen dies.
- Nur allowlist-basierte GET/HEAD-Fetches; keine POSTs zu externen Plattformen.
- `Known<T>`-Union; Aggregator akzeptiert ausschließlich `state:"known"`.
- Nenner, Unknown-N, Population und Stichtag sind Pflichtfelder; Summentest `knownN + unknownN + notApplicableN = eligibleN`.
- Provenienztyp und Evidence-Referenz pro aggregiertem Wert; Herstellerwerte werden im Text als solche bezeichnet.
- Hands-on-Claim nur wenn `testStatus`/`editorial.testedHandsOn` und passende Evidence vorliegen; derzeit immer blockiert.
- Market Changes können Produktdaten nicht schreiben. Erst bestätigtes Research Finding, dann separater redaktioneller Workflow.
- Kein DA/DR-Feld im Authority-Schema. Unbekannte Drittmetriken werden nicht geschätzt.
- Kein Massenexport von Empfängern; kein automatischer Outreach; keine automatischen Backlinks.

## 10. Entscheidungsfragen

1. **Genug Daten?** Ja. Die zwölf GPS-Datensätze reichen für mindestens ein belastbares, klar begrenztes Repository-Sample-Asset.
2. **Erstes Asset?** Anteil der ausgewerteten GPS-Tracker mit Pflichtabo: 10/12, mit Produktliste, Stichtag, Definition und Quellenreview.
3. **Authority ohne Paid Tools?** Eigene Referrer/GSC/Bing-Exporte soweit verfügbar, Brand-/Domain-Suche, RSS/Atom/Sitemaps, kuratierte Hersteller-/Publisher-/Ressourcen-Watchlists, Live-Link-Verifikation und Topic-Matching. Nicht vollständig automatisierbar ist ein webweiter Linkindex.
4. **Nicht automatisieren?** Veröffentlichung, E-Mail-/Social-/Forum-/Reddit-/Kommentar-Posting, Linktausch, Gastartikel, Massen-Outreach, Backlink-Erzeugung, DA/DR-Schätzung, Fakten aus Unknown/Prosa, Produktänderungen ohne Bestätigung und Herstellerangaben als eigene Tests.
5. **Kleinster nützlicher Schritt?** Ein read-only GPS-Abo-Aggregator mit Unknown-/Evidence-Gate, der einen versionierten Candidate-Report erzeugt und nach manueller Validierung in der bestehenden Arbeitsliste erscheint. Keine UI ist für den ersten CLI/Report-Nutzen erforderlich.
