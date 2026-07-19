# Conversion Framework 3 – Trust Installer

Dieser Installer ersetzt den nicht anwendbaren Git-Patch.

Er arbeitet mit stabilen Codeankern statt Zeilennummern und ist idempotent:
bereits vorhandene Änderungen werden übersprungen.

## Installation

Entpacke den Ordner in den Repository-Root und führe aus:

```bash
node conversion-framework-3-trust-installer/install-trust.mjs
npm run build:pfotentechnik
```

## Rollback

```bash
node conversion-framework-3-trust-installer/rollback-trust.mjs
```

## Änderungen

- `productEditorialSchema`
- optionales `editorial`-Feld im Produktschema
- neue Komponente `ProductTrustPanel.astro`
- korrekter Import aus `../../components/ProductTrustPanel.astro`
- Ersatz des bisherigen `pt-review-method`-Blocks
- automatisches Backup vor Änderungen

## Warum kein weiterer Git-Patch?

Dein lokaler Stand enthält bereits Foundation und Recommendations.
Dadurch unterscheiden sich Zeilenpositionen und Kontextbereiche vom GitHub-Stand.
Der Installer prüft stattdessen semantische Anker in den tatsächlichen Dateien.
