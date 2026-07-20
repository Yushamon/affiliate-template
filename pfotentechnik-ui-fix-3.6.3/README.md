# PfotenTechnik UI Fix 3.6.3

## Änderungen

- mobiler Seitenrand von 20 px auf 12 px reduziert
- verschachtelte Produktbereiche auf volle verfügbare Breite gesetzt
- Produkt-Hero und Inhaltsfläche im Dark Mode vereinheitlicht
- Faktenblock mit genau zwei Einträgen auf 50/50-Spalten umgestellt
- lange Faktenwerte dürfen umbrechen
- Gesundheitshinweis vollständig für Dark Mode gestaltet
- Gesundheitshinweis mobil kompakter

## Installation

```bash
node pfotentechnik-ui-fix-3.6.3/install-ui-fix-3.6.3.mjs
npm run build:pfotentechnik
```

Danach den Dev-Server neu starten:

```bash
npm run dev:pfotentechnik
```

## Rollback

```bash
node pfotentechnik-ui-fix-3.6.3/rollback-ui-fix-3.6.3.mjs
```
