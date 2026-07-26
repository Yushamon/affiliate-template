# Architekturentscheidungen

## 1. Product Experience als View-Model

Astro-Komponenten rendern nur noch ein `ProductExperienceModel`. Das Modell aggregiert vorhandene Content-Collections, bestehende Alternative-Empfehlungen und die Preisdomäne. Dadurch gibt es eine zentrale Interpretation von Eignung, Preis, Alltag und Vertrauen.

```text
Content Collection
      │
      ├── Price Engine
      ├── Decision Profile
      ├── Alternative Selection
      └── Trust / Everyday Mapping
               │
       ProductExperienceModel
               │
       kleine Astro-Komponenten
```

Der aktive `product-standard-2/ProductRenderer.astro` bleibt als stabile Integrationsfassade erhalten. Dadurch müssen Route und andere Aufrufer nicht an eine neue parallele Rendering-Plattform gekoppelt werden.

## 2. Preis als eigene Domäne

```text
Product Content
      │
      ▼
PriceAdapter<T>
      │
      ▼
ProductPriceSnapshot
      │
      ├── Kategorie-Ranges
      ├── Status
      ├── Tier
      └── Freshness
      │
      ▼
ProductPriceInsight
```

Die Range wird nicht in jedem Produkt gepflegt. Sie entsteht über Quantile innerhalb derselben Kategorie. Bei weniger als zwei bekannten Preisen zeigt die Oberfläche offen an, dass keine belastbare Spanne vorhanden ist.

Der Händler-Crawler ist ein separater Schreibdienst. Er schreibt nur geprüfte standardisierte Angebotsdaten in das Produkt-Frontmatter. Die Price Engine bleibt davon unabhängig und kann später Daten aus anderen Adaptern erhalten. Preis- und Medienabrufe verwenden dieselbe abgesicherte HTTPS-Schicht mit DNS-Pinning, Redirect-Prüfung, Größenlimit und vollständigem Timeout.

## 3. Lokaler Operations Router

Der bestehende Search-Admin-Server bleibt der einzige lokale Schreibprozess. Ein kleiner `operations-router.mjs` ergänzt Preis- und Media-Routen, statt einen zweiten Server mit eigener CORS-, Fehler- und Prozesslogik zu starten.

```text
SEO Cockpit Astro UI
        │
        ▼
127.0.0.1:4178
        │
        ├── bestehende Search-Routen
        ├── Price Operations
        └── Media Operations
```

## 4. Media Center mit Staging und Approval

```text
Quellseite
   │
   ├── Kandidatenfilter
   ├── sicherer Download
   ├── technische Bildbewertung
   └── Duplikaterkennung
   │
   ▼
.media-center/jobs/<id>
   │
   ├── Referenzen
   ├── Prompts
   ├── Uploads
   ├── WebP Outputs
   └── Audit
   │
   ▼ explizite Freigabe
Assets + Markdown + persistenter Audit
```

Die Freigabe verwendet ein Staging-Verzeichnis und sichert vorhandene Assets sowie den ursprünglichen Markdown-Inhalt. Dadurch wird ein fehlgeschlagener Schreibvorgang zurückgesetzt. Referenzbilder bleiben im Job-Verzeichnis. Veröffentlichte WebP-Dateien entstehen nur aus eigenen oder extern erzeugten Uploads; Thumbnail und Vergleichsbild dürfen aus dem hochgeladenen Hero abgeleitet werden.

## 5. Installer statt unkontrollierter Patchserie

Jedes Modul hat:

- eigene Payload-Dateien
- eigene Änderungen an bestehenden Integrationspunkten
- eigene Sicherungsliste
- eigene Tests und Audits
- eigenen Rollback

Ein fehlgeschlagenes Modul stoppt die Installation. Spätere Module werden nicht begonnen.

## 6. Gemeinsame Operations-Infrastruktur

Preisprüfung und Media Center teilen zwei kleine Infrastrukturmodule:

- `public-fetch.mjs` für gepinnte öffentliche HTTPS-Abrufe ohne Zugriff auf lokale Netze
- `atomic-file.mjs` für absturzsicheren Dateiersatz auf Windows, macOS und Linux

Damit entstehen weder zwei SSRF-Schutzvarianten noch zwei konkurrierende Schreibmechanismen.
