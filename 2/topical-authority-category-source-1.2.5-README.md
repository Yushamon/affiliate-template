# Topical Authority Category Source 1.2.5

Dieser Patch verwendet bei Produkten die bereits vorhandene strukturierte
Frontmatter-Angabe `category.key` als verbindliche Quelle.

Beispiel:

```yaml
category:
  key: "futterautomaten"
  label: "Futterautomaten"
```

## Verhalten

- Produkte werden anhand von `category.key` genau dem passenden Cluster zugeordnet.
- Hersteller wie PETLIBRO, PETKIT oder Cat Mate bestimmen keine Produktkategorie.
- Body-Erwähnungen bestimmen keine Produktkategorie.
- Nur für ältere Produkt-MDs ohne `category.key` bleibt ein enger Fallback über
  Slug, Titel und Description bestehen.
- Der Installer ersetzt auch die heuristische Logik aus Patch 1.2.4, falls sie
  bereits installiert wurde.

## Installation

```bash
node 2/install-topical-authority-category-source-1.2.5.mjs
```

## Validierung

```bash
npm --workspace apps/pfotentechnik run test:topical-authority
npm --workspace apps/pfotentechnik run audit:topical-authority:strict
npm --workspace apps/pfotentechnik run build
```
