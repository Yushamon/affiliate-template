# SEO Platform – GSC Dashboard 1.1.0

## Installation

Im Repository-Root:

```bash
node install-seo-platform-gsc-dashboard-1.1.0.mjs
npm run gsc:sync
npm run build:pfotentechnik
```

## Enthalten

- GSC-Synchronisierung für aktuelle und vorherige 28 Tage
- Klicks, Impressionen, CTR und Durchschnittsposition
- Top-Seiten und Top-Suchanfragen
- automatische Empfehlungen für geringe CTR, Positionen 8–20 und Content-Gaps
- statisches Astro-Dashboard unter `/admin/seo/`
- keine zusätzliche npm-Abhängigkeit
- automatische `.gitignore`-Ergänzungen für `.gsc` und OAuth-Dateien

Die bestehende GSC-Verbindung muss eingerichtet sein. Erwartet werden `.gsc/client-secret.json` und eine Token-Datei wie `.gsc/token.json`.
