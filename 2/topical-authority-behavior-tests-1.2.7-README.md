# Topical Authority Behavior Tests 1.2.7

Dieser Patch korrigiert die nach 1.2.6 verbliebenen alten Erwartungen in
Tests und Strict-Audit.

## Änderungen

### Tests

Die Tests erwarten nicht mehr:

```ts
if (categoryCluster) {
  return categoryCluster === definition.id;
}
```

oder:

```ts
return primaryEvidence;
```

Stattdessen prüfen sie den aktuellen Product-Branch:

```ts
const categoryCluster = productClusterFromCategory(document);
return categoryCluster === definition.id;
```

Zusätzlich wird geprüft, dass innerhalb des Product-Branches keine Nutzung von
`primaryEvidence`, `manufacturerEvidence` oder `bodyEvidence` vorkommt.

### Strict-Audit

Der Audit erhält zwei explizite Prüfungen:

- `PRODUCT_CATEGORY_SOURCE`
- `PRODUCT_HEURISTIC_GUARD`

Die Regressionstest-Erkennung sucht jetzt nach den Tests der strukturierten
Produktzuordnung statt nach dem veralteten Body-Testnamen.

## Installation

```bash
node 2/install-topical-authority-behavior-tests-1.2.7.mjs
```

## Validierung

```bash
npm --workspace apps/pfotentechnik run test:topical-authority
npm --workspace apps/pfotentechnik run audit:topical-authority:strict
npm --workspace apps/pfotentechnik run build
```
