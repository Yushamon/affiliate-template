# Topical Authority Cluster Detection Fix 1.1.1

Diese Version ersetzt die Loader-Datei vollständig und ist daher nicht von der
Formatierung der bestehenden `CLUSTER_DEFINITIONS` abhängig.

## Installation

ZIP im Repository-Root entpacken. Danach kann der Installer aus `2/` oder `3/`
gestartet werden, je nachdem wohin die Dateien entpackt wurden:

```bash
node 2/install-topical-authority-cluster-detection-fix-1.1.1.mjs
```

oder:

```bash
node 3/install-topical-authority-cluster-detection-fix-1.1.1.mjs
```

## Validierung

```bash
npm --workspace apps/pfotentechnik run test:topical-authority
npm --workspace apps/pfotentechnik run audit:topical-authority:strict
npm --workspace apps/pfotentechnik run build
```

## Erwartetes Ergebnis

Der Cluster „Automatische Katzentoiletten“ zeigt bei fehlenden Inhalten:

- 0 Ratgeber/Hubs
- 0 Vergleiche
- 0 Produkte
- 0 Hersteller
- Score 0/100
- keine falsch erkannten PETKIT-, PETLIBRO-, Futterautomaten- oder Trinkbrunnen-Seiten
