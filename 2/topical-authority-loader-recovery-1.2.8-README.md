# Topical Authority Loader Recovery 1.2.8

Dieser Recovery-Patch behebt den Parse-Fehler:

```text
Expected `,` or `)` but found `{`
new RegExp(`^\\s{${sectionIndent + 2},}${key}:...
```

## Ursache

Der Loader wurde versehentlich innerhalb eines RegExp-Strings ein zweites Mal
vollständig eingefügt. Dadurch enthielt die Datei zwei `import fs ...`-Blöcke
und einen nie geschlossenen Template-String.

## Recovery

Der Installer:

1. erstellt ein Backup,
2. erkennt die eingebettete zweite vollständige Dateikopie,
3. verwendet diese als saubere Ausgangsbasis,
4. setzt den `category.key`-Parser ohne verschachtelte Template-Literals neu ein,
5. stellt die ausschließlich strukturierte Produktzuordnung wieder her,
6. prüft, dass genau ein `fs`-Import verbleibt.

## Installation

```bash
node 2/install-topical-authority-loader-recovery-1.2.8.mjs
```

## Validierung

```bash
npm --workspace apps/pfotentechnik run test:topical-authority
npm --workspace apps/pfotentechnik run audit:topical-authority:strict
npm --workspace apps/pfotentechnik run build
```
