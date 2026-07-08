# Affiliate Sites Monorepo

Dieses Repository verwaltet mehrere eigenständig build- und deploybare Astro-Websites. Wiederverwendbare Darstellung und technische Helfer liegen im Workspace-Package `@affiliate-core/core`; Inhalte und Projektdaten bleiben in der jeweiligen App.

## Installation

Alle Befehle in diesem Dokument werden, sofern nicht anders angegeben, im Repository-Root ausgeführt.

```bash
npm install
```

npm verknüpft dabei die Workspaces unter `apps/*` und `packages/*`. Es ist keine separate Installation pro App nötig.

## Balkonspeicher lokal starten

```bash
npm run dev:balkonspeicher
```

Der Astro-Entwicklungsserver wird gemäß Projektstandard im Hintergrund gestartet. Status, Logs und Stoppen lassen sich im App-Verzeichnis verwalten:

```bash
cd apps/balkonspeicher
npx astro dev status
npx astro dev logs
npx astro dev stop
```

## PfotenTechnik lokal starten

```bash
npm run dev:pfotentechnik
```

Auch dieser Server läuft im Hintergrund. Die Verwaltung erfolgt entsprechend:

```bash
cd apps/pfotentechnik
npx astro dev status
npx astro dev logs
npx astro dev stop
```

## Projekte bauen

Nur Balkonspeicher bauen:

```bash
npm run build:balkonspeicher
```

Nur PfotenTechnik bauen:

```bash
npm run build:pfotentechnik
```

Beide Projekte nacheinander bauen:

```bash
npm run build
```

Die statischen Ergebnisse liegen in:

- `apps/balkonspeicher/dist`
- `apps/pfotentechnik/dist`

## Cloudflare Pages

Für jede Domain wird ein eigenes Cloudflare-Pages-Projekt mit demselben Repository verbunden. Das Root-Verzeichnis bleibt jeweils der Repository-Root.

### balkonspeicher-ratgeber.de

- Build command: `npm run build:balkonspeicher`
- Build output directory: `apps/balkonspeicher/dist`
- Node.js: mindestens `22.12.0`

### pfotentechnik.de

- Build command: `npm run build:pfotentechnik`
- Build output directory: `apps/pfotentechnik/dist`
- Node.js: mindestens `22.12.0`

Beide Astro-Apps erzeugen statische Ausgaben und benötigen aktuell keinen Cloudflare-Adapter.

## Was gehört in affiliate-core?

`packages/affiliate-core` enthält Bausteine, die ohne fest verdrahtete Nischen- oder Markenbegriffe in mehreren Affiliate-Projekten funktionieren:

- Layout, Header, Footer und Artikel-Metadaten
- Renderer und semantische Content-Bausteine
- Produktboxen, Rankingkarten, Vergleiche und Entscheidungskomponenten
- UI-Grundbausteine
- globale Styles und Komponenten-Styles
- generische Produkt- und Projektmodelle
- Schema.org- und SEO-Helfer
- Bild-Fallback- und Content-Bereinigungsfunktionen

Core-Komponenten greifen bei Bedarf über den Alias `@app` auf einen projektspezifischen Datenvertrag zu. Dadurch enthält der Core keine konkreten Produktdaten und keine Nischentexte.

## Was bleibt app-spezifisch?

Jede App verwaltet selbst:

- `src/project.config.ts`
- Content-Schema und Inhalte unter `src/content`
- Seiten und Routing unter `src/pages`
- Produkte, Rankings, Empfehlungen und Herstellerdaten unter `src/data`
- `seoOverrides.ts`, `projectImages.ts`, `internalLinks.ts` und `nextSteps.ts`
- Bilder, Favicons und Robots-Dateien unter `public`
- Domain und Integrationen in der eigenen `astro.config.mjs`

Für ein neues Projekt werden mindestens `site`, `siteMeta` und `projectConfig` aus `src/project.config.ts` exportiert. Header-Navigation, Footer-Inhalte, Standardbild und Kategoriepfad werden dort festgelegt.

## Import-Aliase

Jede App definiert dieselben Aliase in `astro.config.mjs` und `tsconfig.json`:

```ts
import AffiliateLayout from "@affiliate-core/layouts/AffiliateLayout.astro";
import ProductBox from "@affiliate-core/components/ProductBox.astro";
```

- `@affiliate-core/*` zeigt auf `packages/affiliate-core/src/*`.
- `@app/*` zeigt auf das `src`-Verzeichnis der jeweils gebauten App.

Das npm-Package heißt `@affiliate-core/core`. Der kurze Alias wird zusätzlich verwendet, weil Astro-Dateiimporte damit übersichtlich bleiben und direkt auf die Quelldateien zeigen.
