# Topical Authority Stray Fragment Fix 1.2.9

Dieser Patch basiert auf dem aktuell committed GitHub-Stand des Loaders.

## Gefundener Fehler

Direkt nach:

```ts
function parseFrontmatter(...) {
  ...
  return output;
}
```

stand ein verwaister Rest einer früheren Parser-Implementierung:

```ts
),
    );
    if (valueMatch) {
      ...
```

Erst danach begann die gültige Funktion:

```ts
function parseNestedFrontmatterValue(...)
```

Das Fragment verursachte den Astro-Parse-Fehler bei Zeile 398.

## Verhalten des Installers

Der Installer:

- prüft die exakte Parser-Reihenfolge,
- entfernt ausschließlich den beschädigten Zwischenblock,
- verändert keine Clusterdefinitionen oder Zuordnungslogik,
- prüft auf genau einen `fs`-Import und einen Nested-Parser,
- kontrolliert, dass `category.key` und das Kategorie-Mapping erhalten bleiben,
- legt vorher ein Backup unter `.patch-backups/` an.

## Installation

```bash
node 2/install-topical-authority-stray-fragment-fix-1.2.9.mjs
```

## Validierung

```bash
npm --workspace apps/pfotentechnik run test:topical-authority
npm --workspace apps/pfotentechnik run audit:topical-authority:strict
npm --workspace apps/pfotentechnik run build
```
