# SEO Copilot 3.0 und Product Intelligence 1.0

## Architektur

Die Erweiterung verwendet ausschließlich die bestehende Search- und Advisor-Architektur:

1. Google Search Console und Bing liefern normalisierte Daten an die bestehende Combined Search Platform.
2. `loadSeoDashboard()` und `loadAdvisorContent()` laden Search-Daten, Astro-Content und den vorhandenen Content Graph.
3. `buildSeoAdvisor()` bleibt der einzige Orchestrator. Die Module `intelligence.ts` und `productIntelligence.ts` ergänzen seine Ergebnisse.
4. `/admin/seo/advisor/` rendert den bestehenden Co-Pilot mit Prioritäten, Szenarien, Content-/Graph-Gaps, Kalender, Conversion- und Produktansichten.
5. Schreibende Funktionen laufen ausschließlich über die Allowlist des lokalen Search-Admin-Service. Es gibt keine freie Shell und keine API-Schlüssel im Client.

## Datenbasis und Grenzen

- Forecasts sind konservative Szenarien aus vorhandenen Impressionen, CTR und Position. Sie sind keine Traffic- oder Ranking-Versprechen.
- Conversion Insights prüfen Search-Sichtbarkeit und strukturelle Signale in Quelldokumenten. Ohne Analytics- oder Affiliate-Events werden keine Produktinteraktionen behauptet.
- Product Discovery zeigt nur Slugs, die in einer vorhandenen Herstellerdatei geführt werden, aber noch keine Produktdatei besitzen.
- Der Product Health Score ist eine interne redaktionelle Prüfhilfe, kein Suchmaschinen-Score.
- Learning vergleicht frühestens nach 14 Tagen einen Abschluss-Snapshot mit dem dann vorhandenen Search-Snapshot. Das Ergebnis ist eine zeitliche Assoziation, keine Kausalitätsaussage.

## Sichere One-Click-Actions

Der bestehende lokale Service erlaubt zusätzlich:

- `copilot.prompt`
- `copilot.task.complete`
- `product.draft.create`
- `product.images.prompts`
- `product.images.pack`

Alle Actions validieren strukturierte Payloads. Produkt-Slugs müssen in vorhandenen Herstellerdaten belegt sein. Bestehende Produkt-, Draft- und Bildpaketdateien werden nie überschrieben.

## Produktentwürfe

`Produkt erstellen` erzeugt einen Forschungs-Draft unter:

```text
apps/pfotentechnik/.search/drafts/products/<slug>.md
```

Der Draft liegt absichtlich außerhalb der Astro-Content-Collection. Er enthält nur bekannte Herstellerzuordnung, Quellenkandidaten, Zielpfade und offene Recherchefelder. Erst ein redaktionell vervollständigter und schema-validierter Inhalt darf nach `src/content/products/` übernommen werden.

## Bildpaket ohne Provider

1. `Bilder erstellen` erzeugt sechs Prompts unter `.search/image-prompts/<slug>.json`.
2. Lege geprüfte Dateien unter `.search/image-imports/<slug>/` ab:
   `hero`, `thumbnail`, `comparison`, `gallery-1`, `gallery-2`, `gallery-3`, jeweils als PNG, JPG oder WebP.
3. `Bildpaket bauen` konvertiert lokal mit der vorhandenen Astro/Sharp-Installation. Thumbnail wird 800 × 800 px, alle übrigen Rollen 1600 × 900 px.
4. Ergebnis: `.search/image-packs/<slug>/` und `.search/image-packs/<slug>.zip`.

Die ZIP-/WebP-Ausgabe bleibt zunächst im privaten Arbeitsbereich. Eine Übernahme in `src/assets/images/products/` ist eine bewusste redaktionelle Entscheidung.

## Image Provider

`IMAGE_PROVIDER` kennzeichnet einen konfigurierten Provider in der Oberfläche. Die aktuelle sichere Baseline erzeugt unabhängig davon ein Promptpaket und unterstützt den lokalen Import. Ein späterer Provider-Adapter muss serverseitig implementiert werden, darf keine Schlüssel an den Browser senden und muss dieselben Slug-, Rollen- und No-Overwrite-Prüfungen verwenden.

## Lokal starten

In zwei PowerShell-Fenstern im Repository:

```powershell
npm run seo:admin
npm run dev:pfotentechnik
```

Danach: `http://localhost:4321/admin/seo/advisor/`. Falls Astro einen anderen freien Port wählt, die ausgegebene URL verwenden.

## Validierung

```powershell
npm --workspace apps/pfotentechnik run test:search
npm run build:pfotentechnik
npm --workspace apps/pfotentechnik run lint:content
npm --workspace apps/pfotentechnik run audit:products:strict
npm --workspace apps/pfotentechnik run audit:content-graph
```
