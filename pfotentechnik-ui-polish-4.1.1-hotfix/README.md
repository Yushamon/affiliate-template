# PfotenTechnik UI Polish 4.1.1 Hotfix

## Fehler

Nach UI Polish 4.1 wurde in `PremiumRenderer.astro` diese Scope-Klasse verwendet:

```astro
premium-v3--pfotentechnik
```

Die Bedingung greift auf `project` zu. `project` war zwar in `Props` definiert, wurde aber nicht aus `Astro.props` gelesen.

Dadurch entstand beim Prerendern:

```text
ReferenceError: project is not defined
```

## Korrektur

Vorher:

```ts
const {
  blocks = [],
  products = []
} = Astro.props;
```

Nachher:

```ts
const {
  blocks = [],
  products = [],
  project
} = Astro.props;
```

## Installation

```bash
node pfotentechnik-ui-polish-4.1.1-hotfix/install-ui-polish-4.1.1.mjs
npm run build:pfotentechnik
```

## Rollback

```bash
node pfotentechnik-ui-polish-4.1.1-hotfix/rollback-ui-polish-4.1.1.mjs
```
