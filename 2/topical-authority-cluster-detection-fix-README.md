# Topical Authority Cluster Detection Fix 1.1.0

## Behobenes Problem

Die erste Erkennung hat ganze Seitenkörper mit sehr breiten Regex-Mustern
analysiert. Dadurch wurden allgemeine Katzen-, Hygiene- oder Herstellerseiten
fälschlich dem Cluster „Automatische Katzentoiletten“ zugeordnet.

## Neue Logik

- Slug und Titel sind primäre Clustersignale.
- Allgemeine Begriffe wie „Katze“, „Hund“, „Hygiene“ oder „selbstreinigend“
  reichen nicht mehr aus.
- Body-Treffer allein erzeugen keine Clusterzuordnung.
- Bei Ratgebern müssen Beschreibung und Body beide spezifische Signale tragen,
  sofern Slug/Titel nicht eindeutig sind.
- Produkte benötigen ebenfalls mehrere spezifische Signale.
- Hersteller werden nicht pauschal einem Themencluster zugerechnet, nur weil
  sie in mehreren Kategorien Produkte anbieten.
- Ausschlussmuster verhindern Überschneidungen zwischen Futterautomaten,
  Trinkbrunnen, GPS, Katzenklappen und Katzentoiletten.

## Installation

ZIP im Repository-Root entpacken:

```bash
node 3/install-topical-authority-cluster-detection-fix-1.1.0.mjs
```

Danach:

```bash
npm --workspace apps/pfotentechnik run test:topical-authority
npm --workspace apps/pfotentechnik run audit:topical-authority:strict
npm --workspace apps/pfotentechnik run build
```
